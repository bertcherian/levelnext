import crypto from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  proofObservations,
  proofPilotParticipants,
  proofPilots,
  type ProofPilot,
  type ProofPilotParticipant,
} from "../drizzle/schema";
import { getDb } from "./db";
import { sendEmail } from "./_core/email";
import {
  anonymisePracticeText,
  deriveEvidenceStrength,
  deriveMomentumState,
  derivePilotHealth,
  getProofDailyAction,
  nextBestPilotAction,
  recommendPilot,
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
    dailyActionCount: participant.dailyActionCount,
    missedActionCount: participant.missedActionCount,
    accessIssue: participant.accessIssue,
    lastActivityAt: participant.lastActivityAt,
  };
}

export async function createProofPilot(userId: number, input: ProofCreatePilotInput) {
  const db = await database();
  const [inserted] = await db.insert(proofPilots).values({
    ownerUserId: userId,
    name: input.name,
    companyContext: input.companyContext ?? null,
    organisation: input.organisation ?? input.companyContext ?? null,
    sponsorName: input.sponsorName ?? null,
    businessProblem: input.businessProblem,
    whyItMatters: input.whyItMatters ?? null,
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
    const [inserted] = await db.insert(proofPilotParticipants).values({
      pilotId,
      email,
      name: participant.name?.trim() || null,
      inviteToken,
      inviteStatus: "pending",
    }).$returningId();
    const [created] = await db.select().from(proofPilotParticipants).where(eq(proofPilotParticipants.id, inserted.id)).limit(1);
    if (created) insertedParticipants.push(created);
    existingEmails.add(email);
    const inviteUrl = new URL(`/pilot/participant/${inviteToken}`, origin).toString();
    sendEmail({
      to: email,
      subject: `${pilot.name} — your 30-Day Behaviour Change Proof starts here`,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1C1C1C"><div style="background:#0A1A2F;padding:28px;text-align:center"><img src="${origin}/logo.png" alt="LevelNext" style="height:36px" /></div><div style="padding:32px;background:#F8F5F0"><p style="color:#D4AF37;font-weight:700;letter-spacing:1px;text-transform:uppercase">30-Day Behaviour Change Proof</p><h1 style="color:#0A1A2F">This isn't another course.</h1><p>Over the next 30 days, LevelNext will help you practise one to three behaviours in situations you are already dealing with at work.</p><p>Most interactions take only a few minutes. Start with a short baseline, then use the loop: notice → choose → practise → do → reflect.</p><p><a href="${inviteUrl}" style="display:inline-block;background:#D4AF37;color:#0A1A2F;padding:13px 20px;border-radius:6px;text-decoration:none;font-weight:700">Start my baseline →</a></p><p style="font-size:12px;color:#64748B">Private coaching and reflection stay private. The sponsor sees appropriate aggregated evidence, not your personal coaching text.</p></div></div>`,
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
  if (participant.inviteStatus === "pending") await db.update(proofPilotParticipants).set({ inviteStatus: "opened", lastActivityAt: new Date() }).where(eq(proofPilotParticipants.id, participant.id));
  return {
    pilot: {
      name: pilot.name,
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
