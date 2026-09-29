import crypto from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  proofObservations,
  proofPilotParticipants,
  proofPilots,
  proofParticipantTrustEvents,
  proofNudgeDeliveries,
  proofSecurityDocuments,
  proofSecurityRequirements,
  users,
  type ProofPilot,
  type ProofPilotParticipant,
} from "../drizzle/schema";
import { getDb } from "./db";
import { sendEmail } from "./_core/email";
import { storagePut } from "./storage";
import {
  anonymisePracticeText,
  buildProofCommunicationPack,
  defaultProofPrivacyConfig,
  deriveTrustState,
  PROOF_NUDGE_DAYS,
  deriveEvidenceStrength,
  deriveMomentumState,
  derivePilotHealth,
  getProofDailyAction,
  nextBestPilotAction,
  recommendPilot,
  type ProofCommunicationPack,
  type ProofPrivacyConfig,
  type ProofCreatePilotInput,
} from "../shared/modules/behaviourChangeProof";

function token() {
  return crypto.randomBytes(32).toString("hex");
}

function daysSince(date: Date | null | undefined) {
  if (!date) return 0;
  return Math.min(30, Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000)));
}

function asPilotStartDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameUtcDay(left: Date | null | undefined, right: Date) {
  return Boolean(left && left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth() && left.getUTCDate() === right.getUTCDate());
}

async function database() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

async function ownedPilot(userId: number, pilotId: number) {
  const db = await database();
  const [pilot] = await db.select().from(proofPilots).where(and(eq(proofPilots.id, pilotId), eq(proofPilots.ownerUserId, userId))).limit(1);
  if (!pilot) throw new TRPCError({ code: "NOT_FOUND", message: "Pilot not found" });
  return { db, pilot };
}

function safeParticipant(participant: ProofPilotParticipant) {
  return {
    id: participant.id,
    name: participant.name,
    role: participant.role,
    inviteStatus: participant.inviteStatus,
    baselineCompleted: Boolean(participant.baselineCompletedAt),
    firstRepCompleted: Boolean(participant.firstRepAt),
    firstRealWorkApplication: Boolean(participant.firstRealWorkAt),
    purposeUnderstood: Boolean(participant.purposeUnderstoodAt),
    privacyViewed: Boolean(participant.privacyViewedAt),
    personalGoal: participant.personalGoal,
    firstValue: Boolean(participant.firstValueAt),
    trustState: participant.trustState,
    trustConcern: participant.trustConcern,
    nudgePreference: participant.nudgePreference,
    dailyActionCount: participant.dailyActionCount,
    missedActionCount: participant.missedActionCount,
    accessIssue: participant.accessIssue,
    lastActivityAt: participant.lastActivityAt,
  };
}

export async function createProofPilot(userId: number, input: ProofCreatePilotInput) {
  const db = await database();
  const privacy = defaultProofPrivacyConfig(input.sponsorName || "your pilot sponsor");
  const communication = buildProofCommunicationPack({ sponsorName: input.sponsorName, sponsorRole: input.sponsorRole, organisation: input.organisation, whyItMatters: input.whyItMatters, behaviours: input.targetBehaviours, privacy });
  const [inserted] = await db.insert(proofPilots).values({
    ownerUserId: userId,
    name: input.name,
    companyContext: input.companyContext ?? null,
    organisation: input.organisation ?? input.companyContext ?? null,
    sponsorName: input.sponsorName ?? null,
    sponsorRole: input.sponsorRole ?? null,
    businessProblem: input.businessProblem,
    whyItMatters: input.whyItMatters ?? null,
    selectionRationale: input.selectionRationale ?? input.whyItMatters ?? null,
    privacyConfig: privacy,
    invitationSubject: communication.subject,
    invitationMessage: communication.message,
    targetBehaviours: input.targetBehaviours,
    observableActions: input.observableActions,
    businessSignals: input.businessSignals,
    cohortSize: input.cohortSize,
    accessLane: input.accessLane,
    pilotStartDate: asPilotStartDate(input.pilotStartDate),
    durationDays: 30,
    baselineMethod: input.baselineMethod,
    nudgeCadence: input.nudgeCadence,
    observerPulse: input.observerPulse,
    status: "draft",
  }).$returningId();
  const [pilot] = await db.select().from(proofPilots).where(eq(proofPilots.id, inserted.id)).limit(1);
  if (!pilot) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pilot could not be created" });
  return buildSponsorDashboard(pilot, [], []);
}

export async function inviteProofParticipants(userId: number, pilotId: number, participants: Array<{ email: string; name?: string }>, origin = "https://levelnext.coach") {
  const { db, pilot } = await ownedPilot(userId, pilotId);
  const existing = await db.select({ email: proofPilotParticipants.email }).from(proofPilotParticipants).where(eq(proofPilotParticipants.pilotId, pilotId));
  const existingEmails = new Set(existing.map((row) => row.email.toLowerCase()));
  const insertedParticipants: ProofPilotParticipant[] = [];
  for (const participant of participants) {
    const email = participant.email.trim().toLowerCase();
    if (existingEmails.has(email)) continue;
    const inviteToken = token();
    const privacy = (pilot.privacyConfig as ProofPrivacyConfig | null) ?? defaultProofPrivacyConfig(pilot.sponsorName || "your pilot sponsor");
    const communication = buildProofCommunicationPack({ participantName: participant.name, sponsorName: pilot.sponsorName ?? undefined, sponsorRole: pilot.sponsorRole ?? undefined, organisation: pilot.organisation ?? undefined, whyItMatters: pilot.whyItMatters ?? undefined, behaviours: pilot.targetBehaviours, privacy });
    const [inserted] = await db.insert(proofPilotParticipants).values({
      pilotId,
      email,
      name: participant.name?.trim() || null,
      inviteToken,
      inviteStatus: "pending",
      invitedAt: new Date(),
    }).$returningId();
    const [created] = await db.select().from(proofPilotParticipants).where(eq(proofPilotParticipants.id, inserted.id)).limit(1);
    if (created) insertedParticipants.push(created);
    existingEmails.add(email);
    const inviteUrl = new URL(`/pilot/participant/${inviteToken}`, origin).toString();
    sendEmail({
      to: email,
      subject: communication.subject,
      html: buildParticipantInvitationEmail({ origin, inviteUrl, participantName: participant.name ?? "there", sponsorName: pilot.sponsorName ?? "your sponsor", communication }),
    }).catch(() => undefined);
  }
  if (pilot.status === "draft") await db.update(proofPilots).set({ status: "active", launchedAt: new Date() }).where(eq(proofPilots.id, pilotId));
  const [updatedPilot] = await db.select().from(proofPilots).where(eq(proofPilots.id, pilotId)).limit(1);
  const allParticipants = await db.select().from(proofPilotParticipants).where(eq(proofPilotParticipants.pilotId, pilotId));
  const observations = await db.select().from(proofObservations).where(eq(proofObservations.pilotId, pilotId));
  return { ...buildSponsorDashboard(updatedPilot ?? pilot, allParticipants, observations), invited: insertedParticipants.length };
}

export async function getProofParticipant(tokenValue: string) {
  const db = await database();
  const [participant] = await db.select().from(proofPilotParticipants).where(eq(proofPilotParticipants.inviteToken, tokenValue)).limit(1);
  if (!participant) throw new TRPCError({ code: "NOT_FOUND", message: "Participant invite not found" });
  const [pilot] = await db.select().from(proofPilots).where(eq(proofPilots.id, participant.pilotId)).limit(1);
  if (!pilot) throw new TRPCError({ code: "NOT_FOUND", message: "Pilot not found" });
  if (participant.inviteStatus === "pending") {
    const openedAt = new Date();
    await db.update(proofPilotParticipants).set({ inviteStatus: "opened", inviteOpenedAt: openedAt, lastActivityAt: openedAt }).where(eq(proofPilotParticipants.id, participant.id));
    await db.insert(proofParticipantTrustEvents).values({ pilotId: pilot.id, participantId: participant.id, eventType: "invitation_opened" });
  }
  return {
    pilot: {
      name: pilot.name,
      sponsorName: pilot.sponsorName,
      sponsorRole: pilot.sponsorRole,
      organisation: pilot.organisation,
      selectionRationale: pilot.selectionRationale,
      privacyConfig: (pilot.privacyConfig as ProofPrivacyConfig | null) ?? defaultProofPrivacyConfig(pilot.sponsorName || "your pilot sponsor"),
      invitationMessage: pilot.invitationMessage,
      businessProblem: pilot.businessProblem,
      targetBehaviours: pilot.targetBehaviours,
      observableActions: pilot.observableActions,
      durationDays: pilot.durationDays,
      accessLane: pilot.accessLane,
      day: daysSince(pilot.launchedAt),
      dailyAction: getProofDailyAction(Math.max(1, daysSince(pilot.launchedAt)), pilot.targetBehaviours),
    },
    participant: safeParticipant(participant),
  };
}

async function participantContext(tokenValue: string) {
  const db = await database();
  const [participant] = await db.select().from(proofPilotParticipants).where(eq(proofPilotParticipants.inviteToken, tokenValue)).limit(1);
  if (!participant) throw new TRPCError({ code: "NOT_FOUND", message: "Participant invite not found" });
  const [pilot] = await db.select().from(proofPilots).where(eq(proofPilots.id, participant.pilotId)).limit(1);
  if (!pilot) throw new TRPCError({ code: "NOT_FOUND", message: "Pilot not found" });
  return { db, pilot, participant };
}

export async function recordProofBaseline(tokenValue: string, currentSituation: string, desiredMovement: string) {
  const { db, pilot, participant } = await participantContext(tokenValue);
  const now = new Date();
  await db.update(proofPilotParticipants).set({ inviteStatus: "active", baselineCompletedAt: now, lastActivityAt: now }).where(eq(proofPilotParticipants.id, participant.id));
  await db.insert(proofObservations).values({ pilotId: pilot.id, participantId: participant.id, source: "behavioural", observationType: "baseline", summary: "Participant completed a baseline for a current workplace situation.", outcomeSignal: anonymisePracticeText(desiredMovement), evidenceLevel: 1, privacyScope: "private" });
  await db.insert(proofObservations).values({ pilotId: pilot.id, participantId: participant.id, source: "system", observationType: "baseline_completed", summary: "Baseline completed.", evidenceLevel: 1, privacyScope: "sponsor_aggregate" });
  return getProofParticipant(tokenValue);
}

export async function recordProofRep(tokenValue: string, practiceRole: string) {
  const { db, pilot, participant } = await participantContext(tokenValue);
  const now = new Date();
  await db.update(proofPilotParticipants).set({ inviteStatus: "active", firstRepAt: participant.firstRepAt ?? now, lastActivityAt: now }).where(eq(proofPilotParticipants.id, participant.id));
  await db.insert(proofObservations).values({ pilotId: pilot.id, participantId: participant.id, source: "system", observationType: "behaviour_rep", summary: "Participant completed a short Behaviour Rep.", outcomeSignal: practiceRole, evidenceLevel: 2, privacyScope: "sponsor_aggregate" });
  return getProofParticipant(tokenValue);
}

export async function recordProofRealWork(tokenValue: string, situationType: string, actionTaken: string, outcomeSignal?: string) {
  const { db, pilot, participant } = await participantContext(tokenValue);
  const now = new Date();
  await db.update(proofPilotParticipants).set({ inviteStatus: "active", firstRealWorkAt: participant.firstRealWorkAt ?? now, lastActivityAt: now }).where(eq(proofPilotParticipants.id, participant.id));
  await db.insert(proofObservations).values({ pilotId: pilot.id, participantId: participant.id, source: "behavioural", observationType: "real_work_application", summary: `Participant recorded a real-work application: ${anonymisePracticeText(situationType)}.`, outcomeSignal: anonymisePracticeText(outcomeSignal || actionTaken), evidenceLevel: 2, privacyScope: "sponsor_aggregate" });
  return getProofParticipant(tokenValue);
}

export async function recordProofObserverPulse(tokenValue: string, movement: "not_yet" | "early_signal" | "consistent_signal") {
  const { db, pilot, participant } = await participantContext(tokenValue);
  const now = new Date();
  await db.update(proofPilotParticipants).set({ lastActivityAt: now }).where(eq(proofPilotParticipants.id, participant.id));
  await db.insert(proofObservations).values({ pilotId: pilot.id, participantId: participant.id, source: "human", observationType: "observer_pulse", summary: `Observer pulse recorded: ${movement.replace(/_/g, " ")}.`, evidenceLevel: movement === "consistent_signal" ? 4 : 3, privacyScope: "sponsor_aggregate" });
  return getProofParticipant(tokenValue);
}

export async function recordProofDailyAction(tokenValue: string, completed: boolean, barrier?: string) {
  const { db, pilot, participant } = await participantContext(tokenValue);
  const now = new Date();
  if (isSameUtcDay(participant.lastDailyActionAt, now)) return getProofParticipant(tokenValue);
  const day = Math.max(1, daysSince(pilot.launchedAt));
  const dailyAction = getProofDailyAction(day, pilot.targetBehaviours);
  await db.update(proofPilotParticipants).set({
    lastActivityAt: now,
    lastDailyActionAt: now,
    dailyActionCount: completed ? participant.dailyActionCount + 1 : participant.dailyActionCount,
    missedActionCount: completed ? participant.missedActionCount : participant.missedActionCount + 1,
  }).where(eq(proofPilotParticipants.id, participant.id));
  await db.insert(proofObservations).values({
    pilotId: pilot.id,
    participantId: participant.id,
    source: "system",
    observationType: completed ? "daily_micro_action_completed" : "daily_micro_action_barrier",
    summary: completed ? `Participant completed the Day ${day} micro-action: ${dailyAction.title}.` : "Participant identified a barrier to the next small action.",
    outcomeSignal: barrier ? anonymisePracticeText(barrier) : null,
    evidenceLevel: completed ? 1 : 0,
    privacyScope: "sponsor_aggregate",
  });
  return getProofParticipant(tokenValue);
}

export async function reportProofAccessIssue(tokenValue: string, issue: string) {
  const { db, participant } = await participantContext(tokenValue);
  const now = new Date();
  await db.update(proofPilotParticipants).set({ accessBlockedAt: now, accessIssue: anonymisePracticeText(issue), lastActivityAt: now }).where(eq(proofPilotParticipants.id, participant.id));
  return { ok: true, message: "Pilot access has been flagged for your sponsor. Please use only access approved by your organisation." };
}

export async function requestProofSecurityReview(userId: number, pilotId: number) {
  const { db, pilot } = await ownedPilot(userId, pilotId);
  const now = new Date();
  await db.update(proofPilots).set({ securityReviewStatus: "requested", securityReviewRequestedAt: now }).where(eq(proofPilots.id, pilot.id));
  return { ok: true, status: "requested" as const, message: "Security review is now tracked for this pilot. Share the fact-scoped fast pack with the appropriate IT or security contact." };
}

export async function getProofSecurityFastPack(userId: number, pilotId: number) {
  const { pilot } = await ownedPilot(userId, pilotId);
  return {
    title: "LevelNext Pilot Security Fast Pack",
    version: pilot.securityPackVersion,
    scope: "Pilot access summary — not a certification, security assessment, DPA, or approval decision.",
    pilot: { name: pilot.name, organisation: pilot.organisation, accessLane: pilot.accessLane, securityReviewStatus: pilot.securityReviewStatus },
    architecture: [
      "Zero-Integration Pilot: no HRIS, LMS, collaboration-suite, calendar, CRM, or internal-document integration is required for the proof flow.",
      "Participants use a secure pilot invitation link and should use only access methods permitted by their organisation.",
      "Enterprise identity, SSO, SCIM, data residency, and retention controls are separate enterprise-deployment decisions.",
    ],
    data: {
      collected: ["Participant contact detail for invitation", "Pilot participation milestones", "Minimised, anonymised practice and evidence signals"],
      notRequired: ["HRIS data", "Customer databases", "Corporate mail or calendar access", "Company financial systems", "Internal documents"],
      participantGuidance: "Do not enter confidential, proprietary, customer, financial, personal, regulated, or commercially sensitive information into pilot exercises.",
    },
    controls: [
      "Private coaching and reflection are excluded from sponsor views.",
      "Sponsors see approved aggregate evidence rather than participant reflection text.",
      "The pilot records blocked access as product friction; it does not recommend bypassing organisational controls.",
    ],
    reviewNextSteps: ["Confirm approved access lane", "Review pilot data fields", "Identify required vendor-risk, privacy, or AI-governance materials", "Record outstanding questions and approval status"],
  };
}

function buildSponsorDashboard(pilot: ProofPilot, participants: ProofPilotParticipant[], observations: Array<typeof proofObservations.$inferSelect>) {
  const baselineCompleted = participants.filter((participant) => participant.baselineCompletedAt).length;
  const firstReps = participants.filter((participant) => participant.firstRepAt).length;
  const realWorkApplications = participants.filter((participant) => participant.firstRealWorkAt).length;
  const dailyActions = participants.reduce((total, participant) => total + participant.dailyActionCount, 0);
  const missedActions = participants.reduce((total, participant) => total + participant.missedActionCount, 0);
  const accessFriction = participants.filter((participant) => participant.accessBlockedAt).length;
  const firstPracticeAt = participants.map((participant) => participant.firstRepAt).filter(Boolean).sort((a, b) => (a?.getTime() ?? 0) - (b?.getTime() ?? 0))[0] ?? null;
  const firstActivationAt = participants.map((participant) => participant.baselineCompletedAt).filter(Boolean).sort((a, b) => (a?.getTime() ?? 0) - (b?.getTime() ?? 0))[0] ?? null;
  const lastActivityAt = participants.map((participant) => participant.lastActivityAt).filter(Boolean).sort((a, b) => (b?.getTime() ?? 0) - (a?.getTime() ?? 0))[0] ?? null;
  const counts = {
    system: observations.filter((observation) => observation.source === "system" && observation.privacyScope === "sponsor_aggregate").length,
    behavioural: observations.filter((observation) => observation.source === "behavioural" && observation.privacyScope === "sponsor_aggregate").length,
    human: observations.filter((observation) => observation.source === "human" && observation.privacyScope === "sponsor_aggregate").length,
    businessSignal: observations.filter((observation) => observation.source === "business_signal" && observation.privacyScope === "sponsor_aggregate").length,
  };
  const day = daysSince(pilot.launchedAt);
  const evidenceStrength = deriveEvidenceStrength(counts);
  const health = derivePilotHealth({ participants: participants.length, baselineCompleted, firstReps, realWorkApplications, observerPulses: counts.human, securityFriction: accessFriction, day });
  const rescue = accessFriction > 0
    ? "Access friction is blocking the proof. Share the Security Fast Pack and use only an approved access lane."
    : baselineCompleted < participants.length
      ? "A short baseline is the next useful step. Ask participants about one live situation they want to handle differently."
      : realWorkApplications === 0
        ? "Participants have practised. Ask: ‘What’s one situation today where you could use this behaviour?’"
        : missedActions > dailyActions
          ? "Reduce the ask. Offer one 3-minute practice for the next relevant moment rather than another generic reminder."
          : "The cohort is moving. Keep prompts contextual and prepare a midpoint or Day-30 evidence review.";
  return {
    pilot: {
      id: pilot.id,
      name: pilot.name,
      companyContext: pilot.companyContext,
      organisation: pilot.organisation,
      sponsorName: pilot.sponsorName,
      businessProblem: pilot.businessProblem,
      whyItMatters: pilot.whyItMatters,
      targetBehaviours: pilot.targetBehaviours,
      observableActions: pilot.observableActions,
      businessSignals: pilot.businessSignals,
      durationDays: pilot.durationDays,
      baselineMethod: pilot.baselineMethod,
      nudgeCadence: pilot.nudgeCadence,
      observerPulse: pilot.observerPulse,
      cohortSize: pilot.cohortSize,
      accessLane: pilot.accessLane,
      pilotStartDate: pilot.pilotStartDate,
      securityReviewStatus: pilot.securityReviewStatus,
      securityReviewRequestedAt: pilot.securityReviewRequestedAt,
      status: pilot.status,
      launchedAt: pilot.launchedAt,
      completedAt: pilot.completedAt,
      day,
    },
    participants: participants.map(safeParticipant),
    metrics: {
      invited: participants.length,
      baselineCompleted,
      firstReps,
      realWorkApplications,
      observerPulses: counts.human,
      dailyActions,
      missedActions,
      accessFriction,
      timeToFirstPracticeMinutes: firstPracticeAt && pilot.launchedAt ? Math.max(0, Math.round((firstPracticeAt.getTime() - pilot.launchedAt.getTime()) / 60_000)) : null,
      invitationToActivationMinutes: firstActivationAt && pilot.launchedAt ? Math.max(0, Math.round((firstActivationAt.getTime() - pilot.launchedAt.getTime()) / 60_000)) : null,
      evidence: counts,
      evidenceStrength,
      momentum: deriveMomentumState({ participants: participants.length, baselineCompleted, firstReps, realWorkApplications, lastActivityAt }),
      health,
      rescue,
    },
    nextBestAction: nextBestPilotAction({ participants: participants.length, baselineCompleted, firstReps, realWorkApplications, day }),
  };
}

export async function getProofSponsorDashboard(userId: number, pilotId?: number) {
  const db = await database();
  const pilots = pilotId
    ? await db.select().from(proofPilots).where(and(eq(proofPilots.ownerUserId, userId), eq(proofPilots.id, pilotId))).limit(1)
    : await db.select().from(proofPilots).where(eq(proofPilots.ownerUserId, userId)).orderBy(desc(proofPilots.createdAt)).limit(1);
  const pilot = pilots[0];
  if (!pilot) return null;
  const participants = await db.select().from(proofPilotParticipants).where(eq(proofPilotParticipants.pilotId, pilot.id));
  const observations = await db.select().from(proofObservations).where(eq(proofObservations.pilotId, pilot.id));
  return buildSponsorDashboard(pilot, participants, observations);
}

export async function getProofDay30(userId: number, pilotId: number) {
  const dashboard = await getProofSponsorDashboard(userId, pilotId);
  if (!dashboard) throw new TRPCError({ code: "NOT_FOUND", message: "Pilot not found" });
  const { db } = await ownedPilot(userId, pilotId);
  const observations = await db.select().from(proofObservations).where(and(eq(proofObservations.pilotId, pilotId), eq(proofObservations.privacyScope, "sponsor_aggregate")));
  const humanSignals = observations.filter((observation) => observation.source === "human").length;
  const behaviouralSignals = observations.filter((observation) => observation.source === "behavioural").length;
  const businessSignals = observations.filter((observation) => observation.source === "business_signal").length;
  return {
    ...dashboard,
    headline: dashboard.pilot.day >= 30 ? "Here’s what changed in 30 days." : `Your proof is forming — Day ${dashboard.pilot.day} of 30.`,
    evidenceStrength: deriveEvidenceStrength({ system: dashboard.metrics.evidence.system, behavioural: behaviouralSignals, human: humanSignals, businessSignal: businessSignals }),
    movement: dashboard.metrics.realWorkApplications > 0 ? "Participants are bringing the target behaviours into real work." : "Real-work application is the next evidence gap.",
    areasStillRequiringDevelopment: dashboard.pilot.targetBehaviours.filter((behaviour) => dashboard.metrics.realWorkApplications === 0 || dashboard.metrics.observerPulses === 0).slice(0, 3),
    momentsThatMattered: observations.filter((observation) => observation.observationType !== "baseline_completed").slice(-5).map((observation) => ({ type: observation.observationType, source: observation.source, evidenceLevel: observation.evidenceLevel, summary: observation.summary })),
    expansionOptions: ["Continue this cohort", "Add another team", "Expand to more managers", "Start another behaviour sprint", "Explore enterprise deployment"],
    proofPack: [
      { label: "Business problem", value: dashboard.pilot.businessProblem },
      { label: "Target behaviours", value: dashboard.pilot.targetBehaviours.join(" · ") },
      { label: "Practice", value: `${dashboard.metrics.firstReps} participant${dashboard.metrics.firstReps === 1 ? "" : "s"} completed a Behaviour Rep.` },
      { label: "Workplace actions", value: `${dashboard.metrics.realWorkApplications} real-work application${dashboard.metrics.realWorkApplications === 1 ? "" : "s"} recorded.` },
      { label: "Evidence", value: `${formatEvidenceLabel(dashboard.metrics.evidenceStrength)} from the available signal mix.` },
    ],
    scaleDecision: {
      strongestMovement: dashboard.metrics.realWorkApplications > 0 ? "Participants are taking the target behaviours into real workplace moments." : "The clearest next opportunity is real-work application.",
      insufficientEvidence: dashboard.metrics.evidenceStrength === "insufficient" ? "More practice, action, or observation is needed before a scale decision." : "The current signal mix should still be interpreted as movement evidence, not causal or financial proof.",
      securityNextStep: dashboard.pilot.accessLane === "enterprise" || dashboard.pilot.securityReviewStatus !== "not_started" ? "Continue the tracked enterprise security review before changing deployment scope." : "Begin an enterprise security review only when broader deployment requires it.",
    },
    limitations: ["Self-report alone is not proof of behaviour change.", "This proof reports movement signals, not causal or financial impact.", "Private coaching and reflection text are excluded from sponsor views."],
  };
}

function formatEvidenceLabel(value: string) {
  return value.replace(/_/g, " ");
}

export { recommendPilot };


function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

function buildParticipantInvitationEmail(input: { origin: string; inviteUrl: string; participantName: string; sponsorName: string; communication: ProofCommunicationPack }) {
  const pack = input.communication;
  const privacy = pack.privacy;
  const expectationRows = pack.whatToExpect.map((item) => `<li style="margin:0 0 8px">${escapeHtml(item)}</li>`).join("");
  return `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1C1C1C"><div style="background:#0A1A2F;padding:28px;text-align:center"><img src="${escapeHtml(input.origin)}/logo.png" alt="LevelNext" style="height:36px" /></div><div style="padding:32px;background:#F8F5F0"><p style="color:#A78418;font-weight:700;letter-spacing:1px;text-transform:uppercase">30-Day Behaviour Change Proof</p><h1 style="color:#0A1A2F">You’ve been invited by ${escapeHtml(input.sponsorName)}</h1><p style="white-space:pre-line;line-height:1.65">${escapeHtml(pack.message)}</p><h3 style="color:#0A1A2F">What to expect</h3><ul style="padding-left:20px;line-height:1.5">${expectationRows}</ul><div style="background:#fff;border-left:4px solid #D4AF37;padding:16px;margin:22px 0"><b>Who can see what?</b><p style="font-size:13px;line-height:1.55;margin:8px 0">${escapeHtml(privacy.visibleToOrganisation.join(" "))} ${escapeHtml(privacy.notVisibleToOrganisation.join(" "))}</p></div><p><a href="${escapeHtml(input.inviteUrl)}" style="display:inline-block;background:#D4AF37;color:#0A1A2F;padding:13px 20px;border-radius:6px;text-decoration:none;font-weight:700">Start my 30-day experience →</a></p><p style="font-size:12px;color:#64748B">This is a development pilot, not a promise that information cannot be used for evaluation. Your organisation’s actual governance arrangement applies. You can ask questions, request fewer nudges, or raise a privacy concern from the participant space.</p></div></div>`;
}

export async function getProofCommunicationPack(userId: number, pilotId: number) {
  const { pilot } = await ownedPilot(userId, pilotId);
  const privacy = (pilot.privacyConfig as ProofPrivacyConfig | null) ?? defaultProofPrivacyConfig(pilot.sponsorName || "your pilot sponsor");
  return {
    pack: buildProofCommunicationPack({ sponsorName: pilot.sponsorName ?? undefined, sponsorRole: pilot.sponsorRole ?? undefined, organisation: pilot.organisation ?? undefined, whyItMatters: pilot.whyItMatters ?? undefined, behaviours: pilot.targetBehaviours, privacy }),
    pilot: { id: pilot.id, name: pilot.name, sponsorName: pilot.sponsorName, sponsorRole: pilot.sponsorRole, organisation: pilot.organisation, invitationSubject: pilot.invitationSubject, invitationMessage: pilot.invitationMessage },
  };
}

export async function recordProofTrustEvent(tokenValue: string, eventType: string, response?: string, detail?: string) {
  const { db, pilot, participant } = await participantContext(tokenValue);
  const now = new Date();
  const fields: Record<string, unknown> = { lastActivityAt: now };
  if (eventType === "purpose_understood") fields.purposeUnderstoodAt = now;
  if (eventType === "privacy_viewed") fields.privacyViewedAt = now;
  if (eventType === "personal_goal_created") fields.personalGoalAt = now;
  if (eventType === "first_value") fields.firstValueAt = now;
  if (eventType === "concern_reported") fields.trustConcern = response ?? "other";
  const nextTrustState = deriveTrustState({
    purposeUnderstood: eventType === "purpose_understood" || Boolean(participant.purposeUnderstoodAt),
    privacyViewed: eventType === "privacy_viewed" || Boolean(participant.privacyViewedAt),
    personalGoal: eventType === "personal_goal_created" || Boolean(participant.personalGoalAt),
    firstValue: eventType === "first_value" || Boolean(participant.firstValueAt),
    concern: eventType === "concern_reported" ? response : participant.trustConcern,
  });
  fields.trustState = nextTrustState;
  if (eventType === "trust_signal" && response === "fewer_nudges") fields.nudgePreference = "fewer";
  if (eventType === "trust_signal" && response === "pause_nudges") fields.nudgePreference = "paused";
  await db.update(proofPilotParticipants).set(fields).where(eq(proofPilotParticipants.id, participant.id));
  await db.insert(proofParticipantTrustEvents).values({ pilotId: pilot.id, participantId: participant.id, eventType, response: response ?? null, detail: detail ? anonymisePracticeText(detail) : null });
  return getProofParticipant(tokenValue);
}

export async function saveProofPersonalGoal(tokenValue: string, personalGoal: string) {
  const { db, pilot, participant } = await participantContext(tokenValue);
  const now = new Date();
  const trustState = deriveTrustState({ purposeUnderstood: Boolean(participant.purposeUnderstoodAt), privacyViewed: Boolean(participant.privacyViewedAt), personalGoal: true, firstValue: Boolean(participant.firstValueAt), concern: participant.trustConcern });
  await db.update(proofPilotParticipants).set({ personalGoal, personalGoalAt: now, trustState, lastActivityAt: now }).where(eq(proofPilotParticipants.id, participant.id));
  await db.insert(proofParticipantTrustEvents).values({ pilotId: pilot.id, participantId: participant.id, eventType: "personal_goal_created", detail: anonymisePracticeText(personalGoal) });
  return getProofParticipant(tokenValue);
}

export async function setProofNudgeTaskUid(userId: number, pilotId: number, taskUid: string | null) {
  const { db, pilot } = await ownedPilot(userId, pilotId);
  await db.update(proofPilots).set({ nudgeScheduleCronTaskUid: taskUid }).where(eq(proofPilots.id, pilot.id));
  return { pilotId, taskUid };
}

export async function setProofNudgeEnabled(userId: number, pilotId: number, enabled: boolean) {
  const { db, pilot } = await ownedPilot(userId, pilotId);
  await db.update(proofPilots).set({ nudgeEnabled: enabled }).where(eq(proofPilots.id, pilot.id));
  return { enabled };
}

export async function getProofNudgeSettings(userId: number, pilotId: number) {
  const { pilot } = await ownedPilot(userId, pilotId);
  return { pilotId, enabled: pilot.nudgeEnabled, scheduleCronTaskUid: pilot.nudgeScheduleCronTaskUid };
}

export async function deliverProofNudges(taskUid: string, origin: string) {
  const db = await database();
  const [pilot] = await db.select().from(proofPilots).where(and(eq(proofPilots.nudgeScheduleCronTaskUid, taskUid), eq(proofPilots.nudgeEnabled, true))).limit(1);
  if (!pilot) return { sent: 0, skipped: "orphan-or-disabled" };
  const now = new Date();
  const day = daysSince(pilot.launchedAt);
  const milestone = PROOF_NUDGE_DAYS.filter((value) => day >= value).at(-1);
  if (!milestone) return { sent: 0, skipped: "before-day-3" };
  const participants = await db.select().from(proofPilotParticipants).where(eq(proofPilotParticipants.pilotId, pilot.id));
  const [sponsor] = await db.select().from(users).where(eq(users.id, pilot.ownerUserId)).limit(1);
  const messages: Record<number, { participantSubject: string; participantBody: string; sponsorSubject: string; sponsorBody: string }> = {
    3: { participantSubject: "A small first step with LevelNext", participantBody: "How did the first useful step feel? If a real situation is coming up, LevelNext can help you rehearse it in a few minutes.", sponsorSubject: "Day 3 pilot check: is the first value clear?", sponsorBody: "Check whether participants understand why they were selected, what the pilot is for, and how to get help with a real situation." },
    7: { participantSubject: "One week in: choose one real moment", participantBody: "What is one conversation, handoff, or decision this week where you would like to respond more effectively? Bring that moment into LevelNext when useful.", sponsorSubject: "Day 7 pilot check: look for activation friction", sponsorBody: "Review who has understood the purpose, seen the privacy explanation, and completed a first Behaviour Rep. Diagnose before sending a generic reminder." },
    15: { participantSubject: "Midpoint: what feels more workable?", participantBody: "You are at the midpoint of the pilot. What is one response or behaviour that feels a little more workable now? You can also ask for fewer nudges.", sponsorSubject: "Day 15 midpoint: review movement, not completion", sponsorBody: "Look at early signals, real-work applications, trust concerns, and access friction. Use the next useful action rather than treating activity as proof." },
    30: { participantSubject: "Your 30-day proof reflection", participantBody: "Your pilot has reached Day 30. Take a few minutes to compare your starting point with what you now do differently. Keep personal and confidential details private.", sponsorSubject: "Day 30: your Pilot Proof Pack is ready", sponsorBody: "Review the available signal mix, evidence gaps, participant trust risks, and security next steps before deciding whether to continue controlled testing." },
  };
  const copy = messages[milestone];
  let sent = 0;
  for (const participant of participants) {
    if (!participant.email || participant.nudgePreference === "paused") continue;
    const deliveryKey = `participant:${participant.id}:${milestone}`;
    const prior = await db.select({ id: proofNudgeDeliveries.id }).from(proofNudgeDeliveries).where(eq(proofNudgeDeliveries.deliveryKey, deliveryKey)).limit(1);
    if (prior.length) continue;
    const link = `${origin}/pilot/participant/${participant.inviteToken}`;
    await sendEmail({ to: participant.email, subject: copy.participantSubject, html: brandedNudgeEmail(participant.name || "there", copy.participantBody, link, "Start my 30-day experience →") });
    await db.insert(proofNudgeDeliveries).values({ pilotId: pilot.id, participantId: participant.id, recipientType: "participant", milestoneDay: milestone, deliveryKey, deliveredAt: now });
    await db.update(proofPilotParticipants).set({ lastNudgeAt: now }).where(eq(proofPilotParticipants.id, participant.id));
    sent++;
  }
  if (sponsor?.email) {
    const deliveryKey = `sponsor:${pilot.id}:${milestone}`;
    const prior = await db.select({ id: proofNudgeDeliveries.id }).from(proofNudgeDeliveries).where(eq(proofNudgeDeliveries.deliveryKey, deliveryKey)).limit(1);
    if (!prior.length) {
      await sendEmail({ to: sponsor.email, subject: copy.sponsorSubject, html: brandedNudgeEmail(sponsor.name || pilot.sponsorName || "sponsor", copy.sponsorBody, `${origin}/pilot/dashboard?pilotId=${pilot.id}`, "Open sponsor proof workspace →") });
      await db.insert(proofNudgeDeliveries).values({ pilotId: pilot.id, participantId: null, recipientType: "sponsor", milestoneDay: milestone, deliveryKey, deliveredAt: now });
      sent++;
    }
  }
  return { sent, milestone };
}

function brandedNudgeEmail(name: string, message: string, link: string, cta: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1C1C1C"><div style="background:#0A1A2F;padding:24px;text-align:center"><img src="${escapeHtml(link.split("/pilot")[0])}/logo.png" alt="LevelNext" style="height:34px" /></div><div style="padding:28px;background:#F8F5F0"><p style="color:#A78418;font-weight:700;letter-spacing:1px;text-transform:uppercase">LevelNext · 30-Day Behaviour Change Proof</p><h2 style="color:#0A1A2F">A useful next step, ${escapeHtml(name)}</h2><p style="line-height:1.65">${escapeHtml(message)}</p><p><a href="${escapeHtml(link)}" style="display:inline-block;background:#D4AF37;color:#0A1A2F;padding:12px 18px;text-decoration:none;font-weight:700">${escapeHtml(cta)}</a></p><p style="font-size:12px;color:#64748B">No guilt, no streaks, and no private reflection text is included in this reminder. Use the participant controls if you need fewer nudges or have a concern.</p></div></div>`;
}

export async function getProofSecurityWorkspace(userId: number, pilotId: number) {
  const { db, pilot } = await ownedPilot(userId, pilotId);
  const existing = await db.select().from(proofSecurityRequirements).where(eq(proofSecurityRequirements.pilotId, pilot.id));
  if (!existing.length) {
    const defaults = [
      ["access_lane", "Approved access lane", "Confirm whether this pilot uses instant, corporate-browser, or enterprise access."],
      ["data_boundaries", "Data boundaries and privacy explanation", "Review participant-visible data boundaries and sponsor aggregation rules."],
      ["ai_governance", "AI governance and acceptable use", "Record the organisation’s approved use position for AI-assisted practice."],
      ["retention", "Retention and deletion arrangement", "Record the agreed pilot retention and deletion expectations."],
      ["vendor_risk", "Vendor-risk or procurement review", "Track any vendor-risk, DPA, or procurement requirement that applies."],
    ] as const;
    await db.insert(proofSecurityRequirements).values(defaults.map(([requirementKey, title, description]) => ({ pilotId: pilot.id, requirementKey, title, description })));
  }
  const [documents, requirements] = await Promise.all([
    db.select().from(proofSecurityDocuments).where(eq(proofSecurityDocuments.pilotId, pilot.id)).orderBy(desc(proofSecurityDocuments.createdAt)),
    db.select().from(proofSecurityRequirements).where(eq(proofSecurityRequirements.pilotId, pilot.id)).orderBy(desc(proofSecurityRequirements.createdAt)),
  ]);
  return { pilot: { id: pilot.id, name: pilot.name, securityReviewStatus: pilot.securityReviewStatus, accessLane: pilot.accessLane }, documents, requirements };
}

export async function uploadProofSecurityDocument(userId: number, input: { pilotId: number; title: string; description?: string; fileName: string; contentType: string; fileBase64: string }) {
  const { db, pilot } = await ownedPilot(userId, input.pilotId);
  const raw = input.fileBase64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(raw, "base64");
  if (buffer.length > 5_000_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Security documents must be 5 MB or smaller." });
  const safeName = input.fileName.replace(/[^a-z0-9._-]+/gi, "-").slice(-160);
  const uploaded = await storagePut(`proof-security/${pilot.id}/${userId}/${safeName}`, buffer, input.contentType);
  await db.insert(proofSecurityDocuments).values({ pilotId: pilot.id, uploadedByUserId: userId, title: input.title, description: input.description ?? null, storageKey: uploaded.key, storageUrl: uploaded.url, contentType: input.contentType, fileSize: buffer.length, status: "uploaded" });
  return getProofSecurityWorkspace(userId, pilot.id);
}

export async function updateProofSecurityDocument(userId: number, input: { pilotId: number; documentId: number; reviewOwnerName?: string; reviewOwnerEmail?: string; status?: "uploaded" | "in_review" | "approved" | "needs_action" | "archived"; reviewNotes?: string }) {
  const { db, pilot } = await ownedPilot(userId, input.pilotId);
  const [document] = await db.select({ id: proofSecurityDocuments.id }).from(proofSecurityDocuments).where(and(eq(proofSecurityDocuments.id, input.documentId), eq(proofSecurityDocuments.pilotId, pilot.id))).limit(1);
  if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Security document not found." });
  await db.update(proofSecurityDocuments).set({ reviewOwnerName: input.reviewOwnerName ?? null, reviewOwnerEmail: input.reviewOwnerEmail || null, status: input.status, reviewNotes: input.reviewNotes ?? null, reviewedAt: input.status === "approved" ? new Date() : null }).where(eq(proofSecurityDocuments.id, input.documentId));
  return getProofSecurityWorkspace(userId, pilot.id);
}

export async function createProofSecurityRequirement(userId: number, input: { pilotId: number; requirementKey: string; title: string; description: string }) {
  const { db, pilot } = await ownedPilot(userId, input.pilotId);
  await db.insert(proofSecurityRequirements).values({ pilotId: pilot.id, requirementKey: input.requirementKey, title: input.title, description: input.description });
  return getProofSecurityWorkspace(userId, pilot.id);
}

export async function updateProofSecurityRequirement(userId: number, input: { pilotId: number; requirementId: number; status?: "not_started" | "in_review" | "approved" | "blocked" | "not_applicable"; ownerName?: string; ownerEmail?: string; evidenceDocumentId?: number | null; reviewNote?: string }) {
  const { db, pilot } = await ownedPilot(userId, input.pilotId);
  await db.update(proofSecurityRequirements).set({ status: input.status, ownerName: input.ownerName ?? null, ownerEmail: input.ownerEmail || null, evidenceDocumentId: input.evidenceDocumentId ?? null, reviewNote: input.reviewNote ?? null }).where(and(eq(proofSecurityRequirements.id, input.requirementId), eq(proofSecurityRequirements.pilotId, pilot.id)));
  return getProofSecurityWorkspace(userId, pilot.id);
}

export async function getProofPackPayload(userId: number, pilotId: number) {
  const proof = await getProofDay30(userId, pilotId);
  const security = await getProofSecurityWorkspace(userId, pilotId);
  const communication = await getProofCommunicationPack(userId, pilotId);
  return { ...proof, security, communication: communication.pack };
}
