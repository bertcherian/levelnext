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
  deriveEvidenceStrength,
  deriveMomentumState,
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
    lastActivityAt: participant.lastActivityAt,
  };
}

export async function createProofPilot(userId: number, input: ProofCreatePilotInput) {
  const db = await database();
  const [inserted] = await db.insert(proofPilots).values({
    ownerUserId: userId,
    name: input.name,
    companyContext: input.companyContext ?? null,
    businessProblem: input.businessProblem,
    targetBehaviours: input.targetBehaviours,
    observableActions: input.observableActions,
    businessSignals: input.businessSignals,
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
  await db.insert(proofObservations).values({ pilotId: pilot.id, participantId: participant.id, source: "behavioural", observationType: "baseline", summary: "Participant completed a baseline for a current workplace situation.", outcomeSignal: desiredMovement, evidenceLevel: 1, privacyScope: "private" });
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
  await db.insert(proofObservations).values({ pilotId: pilot.id, participantId: participant.id, source: "behavioural", observationType: "real_work_application", summary: `Participant recorded a real-work application: ${situationType}.`, outcomeSignal: outcomeSignal || actionTaken, evidenceLevel: 2, privacyScope: "sponsor_aggregate" });
  return getProofParticipant(tokenValue);
}

export async function recordProofObserverPulse(tokenValue: string, movement: "not_yet" | "early_signal" | "consistent_signal") {
  const { db, pilot, participant } = await participantContext(tokenValue);
  const now = new Date();
  await db.update(proofPilotParticipants).set({ lastActivityAt: now }).where(eq(proofPilotParticipants.id, participant.id));
  await db.insert(proofObservations).values({ pilotId: pilot.id, participantId: participant.id, source: "human", observationType: "observer_pulse", summary: `Observer pulse recorded: ${movement.replace(/_/g, " ")}.`, evidenceLevel: movement === "consistent_signal" ? 4 : 3, privacyScope: "sponsor_aggregate" });
  return getProofParticipant(tokenValue);
}

function buildSponsorDashboard(pilot: ProofPilot, participants: ProofPilotParticipant[], observations: Array<typeof proofObservations.$inferSelect>) {
  const baselineCompleted = participants.filter((participant) => participant.baselineCompletedAt).length;
  const firstReps = participants.filter((participant) => participant.firstRepAt).length;
  const realWorkApplications = participants.filter((participant) => participant.firstRealWorkAt).length;
  const lastActivityAt = participants.map((participant) => participant.lastActivityAt).filter(Boolean).sort((a, b) => (b?.getTime() ?? 0) - (a?.getTime() ?? 0))[0] ?? null;
  const counts = {
    system: observations.filter((observation) => observation.source === "system" && observation.privacyScope === "sponsor_aggregate").length,
    behavioural: observations.filter((observation) => observation.source === "behavioural" && observation.privacyScope === "sponsor_aggregate").length,
    human: observations.filter((observation) => observation.source === "human" && observation.privacyScope === "sponsor_aggregate").length,
    businessSignal: observations.filter((observation) => observation.source === "business_signal" && observation.privacyScope === "sponsor_aggregate").length,
  };
  const day = daysSince(pilot.launchedAt);
  const evidenceStrength = deriveEvidenceStrength(counts);
  return {
    pilot: {
      id: pilot.id,
      name: pilot.name,
      companyContext: pilot.companyContext,
      businessProblem: pilot.businessProblem,
      targetBehaviours: pilot.targetBehaviours,
      observableActions: pilot.observableActions,
      businessSignals: pilot.businessSignals,
      durationDays: pilot.durationDays,
      baselineMethod: pilot.baselineMethod,
      nudgeCadence: pilot.nudgeCadence,
      observerPulse: pilot.observerPulse,
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
      evidence: counts,
      evidenceStrength,
      momentum: deriveMomentumState({ participants: participants.length, baselineCompleted, firstReps, realWorkApplications, lastActivityAt }),
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
    limitations: ["Self-report alone is not proof of behaviour change.", "This proof reports movement signals, not causal or financial impact.", "Private coaching and reflection text are excluded from sponsor views."],
  };
}

export { recommendPilot };
