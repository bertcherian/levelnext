import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { router, protectedProcedure, successPartnerProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { analyseSelfLeadershipWithMetadata } from "../selfLeadershipIntelligence";
import { draftPartnerNudges } from "../engineeringNudgeIntelligence";
import {
  ENGINEERING_DIAGNOSTIC_QUESTIONS,
  ENGINEERING_DIAGNOSTIC_VERSION,
  deterministicPartnerNudge,
  getEngineeringQuestion,
  scoreEngineeringDiagnostic,
  type PartnerNudgeCandidate,
} from "../../shared/modules/engineeringIntelligence";
import { SELF_LEADERSHIP_CAREER_STAGES } from "../../shared/modules/selfLeadershipIntelligence";
import {
  eiAgentRuns,
  eiDiagnosticResponses,
  eiDiagnosticResults,
  eiDiagnosticSessions,
  eiEngineerProfiles,
  eiMissions,
  eiPartnerAssignments,
  eiPartnerCheckIns,
  eiPartnerNudges,
  icSelfLeadershipMirrors,
  tenantUsers,
  users,
} from "../../drizzle/schema";

async function requireTenantId(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number) {
  const [membership] = await db
    .select({ tenantId: tenantUsers.tenantId })
    .from(tenantUsers)
    .where(eq(tenantUsers.userId, userId))
    .limit(1);
  if (!membership) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Engineering Intelligence is available through an organisation membership." });
  return membership.tenantId;
}

async function requirePartnerAssignment(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  tenantId: number,
  partnerUserId: number,
  participantUserId: number,
  isPlatformAdmin: boolean,
) {
  if (isPlatformAdmin) return null;
  const [assignment] = await db
    .select()
    .from(eiPartnerAssignments)
    .where(and(
      eq(eiPartnerAssignments.tenantId, tenantId),
      eq(eiPartnerAssignments.partnerUserId, partnerUserId),
      eq(eiPartnerAssignments.participantUserId, participantUserId),
      eq(eiPartnerAssignments.status, "active"),
    ))
    .limit(1);
  if (!assignment) throw new TRPCError({ code: "FORBIDDEN", message: "You are not assigned to this participant." });
  return assignment;
}

function validateDiagnosticCompletion(rows: Array<{ questionCode: string; answerValue: number }>) {
  const answers = Object.fromEntries(rows.map((row) => [row.questionCode, Number(row.answerValue)]));
  const missing = ENGINEERING_DIAGNOSTIC_QUESTIONS.filter((question) => typeof answers[question.code] !== "number");
  if (missing.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Please answer every diagnostic question before completing the assessment." });
  return answers as Record<string, number>;
}

function getCandidateReason(mission: { status: string; dueAt: Date | null; updatedAt: Date; completedAt: Date | null }, followUpAt?: Date | null) {
  const now = new Date();
  if (followUpAt && followUpAt <= now) return { reasonCode: "follow_up_due" as const, priorityScore: 85 };
  if (mission.status === "complete" && mission.completedAt && mission.completedAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) return { reasonCode: "celebration" as const, priorityScore: 45 };
  if (mission.dueAt && mission.dueAt <= now && !["attempted", "complete", "declined"].includes(mission.status)) return { reasonCode: "mission_due" as const, priorityScore: 70 };
  if (["accepted", "preparing", "ready_to_act"].includes(mission.status) && mission.updatedAt <= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) return { reasonCode: "mission_stalled" as const, priorityScore: 60 };
  return null;
}

const selfLeadershipInput = z.object({
  situation: z.string().trim().min(10).max(4000),
  observedBehaviour: z.string().trim().max(3000).optional(),
  careerStage: z.enum(SELF_LEADERSHIP_CAREER_STAGES),
  role: z.string().trim().max(160).optional(),
  organisationalContext: z.string().trim().max(1200).optional(),
  authorityLevel: z.string().trim().max(600).optional(),
  stakeholders: z.string().trim().max(1200).optional(),
  consequences: z.string().trim().max(1200).optional(),
  availableInformation: z.string().trim().max(1200).optional(),
  culturalContext: z.string().trim().max(1200).optional(),
  powerDynamics: z.string().trim().max(1200).optional(),
  evidence: z.array(z.string().trim().min(1).max(500)).max(6).optional(),
});

export const engineeringIntelligenceRouter = router({
  getDiagnosticState: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await requireTenantId(db, ctx.user.id);
    const [session] = await db.select().from(eiDiagnosticSessions)
      .where(and(eq(eiDiagnosticSessions.tenantId, tenantId), eq(eiDiagnosticSessions.userId, ctx.user.id), eq(eiDiagnosticSessions.status, "in_progress")))
      .orderBy(desc(eiDiagnosticSessions.updatedAt)).limit(1);
    const responses = session
      ? await db.select({ questionCode: eiDiagnosticResponses.questionCode, answerValue: eiDiagnosticResponses.answerValue })
        .from(eiDiagnosticResponses).where(eq(eiDiagnosticResponses.sessionId, session.id))
      : [];
    return {
      version: ENGINEERING_DIAGNOSTIC_VERSION,
      questions: ENGINEERING_DIAGNOSTIC_QUESTIONS,
      session: session ? { id: session.id, currentQuestionIndex: session.currentQuestionIndex, answers: Object.fromEntries(responses.map((row) => [row.questionCode, Number(row.answerValue)])) } : null,
    };
  }),

  startDiagnostic: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await requireTenantId(db, ctx.user.id);
    const [existing] = await db.select().from(eiDiagnosticSessions)
      .where(and(eq(eiDiagnosticSessions.tenantId, tenantId), eq(eiDiagnosticSessions.userId, ctx.user.id), eq(eiDiagnosticSessions.status, "in_progress")))
      .orderBy(desc(eiDiagnosticSessions.updatedAt)).limit(1);
    if (existing) return { sessionId: existing.id, currentQuestionIndex: existing.currentQuestionIndex };
    const [created] = await db.insert(eiDiagnosticSessions).values({ tenantId, userId: ctx.user.id, diagnosticVersion: ENGINEERING_DIAGNOSTIC_VERSION, status: "in_progress", currentQuestionIndex: 0 }).$returningId();
    return { sessionId: created.id, currentQuestionIndex: 0 };
  }),

  saveDiagnosticResponse: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), questionCode: z.string().min(1), answerValue: z.number().int().min(1).max(5) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await requireTenantId(db, ctx.user.id);
    const question = getEngineeringQuestion(input.questionCode);
    if (!question) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown diagnostic question." });
    const [session] = await db.select().from(eiDiagnosticSessions).where(and(eq(eiDiagnosticSessions.id, input.sessionId), eq(eiDiagnosticSessions.tenantId, tenantId), eq(eiDiagnosticSessions.userId, ctx.user.id), eq(eiDiagnosticSessions.status, "in_progress"))).limit(1);
    if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Diagnostic session not found." });
    const questionIndex = ENGINEERING_DIAGNOSTIC_QUESTIONS.findIndex((entry) => entry.code === input.questionCode);
    await db.insert(eiDiagnosticResponses).values({ sessionId: session.id, tenantId, userId: ctx.user.id, questionCode: input.questionCode, answerValue: input.answerValue })
      .onDuplicateKeyUpdate({ set: { answerValue: input.answerValue, answeredAt: new Date() } });
    await db.update(eiDiagnosticSessions).set({ currentQuestionIndex: Math.max(session.currentQuestionIndex, questionIndex), updatedAt: new Date() }).where(eq(eiDiagnosticSessions.id, session.id));
    return { saved: true, nextQuestionIndex: Math.min(questionIndex + 1, ENGINEERING_DIAGNOSTIC_QUESTIONS.length - 1) };
  }),

  completeDiagnostic: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await requireTenantId(db, ctx.user.id);
    const [session] = await db.select().from(eiDiagnosticSessions).where(and(eq(eiDiagnosticSessions.id, input.sessionId), eq(eiDiagnosticSessions.tenantId, tenantId), eq(eiDiagnosticSessions.userId, ctx.user.id))).limit(1);
    if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Diagnostic session not found." });
    const [existingResult] = await db.select().from(eiDiagnosticResults).where(eq(eiDiagnosticResults.sessionId, session.id)).limit(1);
    if (existingResult) return { resultId: existingResult.id, alreadyCompleted: true };
    const rows = await db.select({ questionCode: eiDiagnosticResponses.questionCode, answerValue: eiDiagnosticResponses.answerValue }).from(eiDiagnosticResponses).where(eq(eiDiagnosticResponses.sessionId, session.id));
    const answers = validateDiagnosticCompletion(rows);
    const score = scoreEngineeringDiagnostic(answers);
    const [created] = await db.insert(eiDiagnosticResults).values({
      sessionId: session.id,
      tenantId,
      userId: ctx.user.id,
      diagnosticVersion: ENGINEERING_DIAGNOSTIC_VERSION,
      engineScores: score.engineScores,
      impactRadius: score.impactRadius,
      impactPattern: score.impactPattern,
      growthEdge: score.growthEdge,
      scoringMethodVersion: "deterministic_mvp_v1",
    }).$returningId();
    const dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(eiMissions).values({
      tenantId,
      userId: ctx.user.id,
      sourceResultId: created.id,
      title: `A practical experiment in ${score.growthEdge.engine.replace(/_/g, " ")}`,
      description: score.growthEdge.statement,
      status: "recommended",
      dueAt,
      partnerVisible: false,
    });
    await db.update(eiDiagnosticSessions).set({ status: "completed", currentQuestionIndex: ENGINEERING_DIAGNOSTIC_QUESTIONS.length - 1, completedAt: new Date(), updatedAt: new Date() }).where(eq(eiDiagnosticSessions.id, session.id));
    return { resultId: created.id, alreadyCompleted: false };
  }),

  saveProfileContext: protectedProcedure.input(z.object({ roleTitle: z.string().trim().max(180).optional(), discipline: z.string().trim().max(120).optional(), engineeringLevel: z.string().trim().max(120).optional(), aspiration: z.string().trim().max(180).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await requireTenantId(db, ctx.user.id);
    await db.insert(eiEngineerProfiles).values({ tenantId, userId: ctx.user.id, ...input }).onDuplicateKeyUpdate({ set: { ...input, updatedAt: new Date() } });
    return { saved: true };
  }),

  getOperatingProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await requireTenantId(db, ctx.user.id);
    const [profile] = await db.select().from(eiEngineerProfiles).where(and(eq(eiEngineerProfiles.tenantId, tenantId), eq(eiEngineerProfiles.userId, ctx.user.id))).limit(1);
    const [latestResult] = await db.select().from(eiDiagnosticResults).where(and(eq(eiDiagnosticResults.tenantId, tenantId), eq(eiDiagnosticResults.userId, ctx.user.id))).orderBy(desc(eiDiagnosticResults.createdAt)).limit(1);
    const missions = await db.select().from(eiMissions).where(and(eq(eiMissions.tenantId, tenantId), eq(eiMissions.userId, ctx.user.id))).orderBy(desc(eiMissions.updatedAt)).limit(6);
    const mirrors = await db.select().from(icSelfLeadershipMirrors).where(and(eq(icSelfLeadershipMirrors.userId, ctx.user.id), eq(icSelfLeadershipMirrors.tenantId, tenantId))).orderBy(desc(icSelfLeadershipMirrors.createdAt)).limit(5);
    return { profile: profile ?? null, latestResult: latestResult ?? null, missions, mirrors };
  }),

  updateMission: protectedProcedure.input(z.object({ missionId: z.number().int().positive(), status: z.enum(["recommended", "accepted", "preparing", "ready_to_act", "attempted", "complete", "deferred", "declined"]).optional(), partnerVisible: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await requireTenantId(db, ctx.user.id);
    const [mission] = await db.select().from(eiMissions).where(and(eq(eiMissions.id, input.missionId), eq(eiMissions.tenantId, tenantId), eq(eiMissions.userId, ctx.user.id))).limit(1);
    if (!mission) throw new TRPCError({ code: "NOT_FOUND", message: "Mission not found." });
    await db.update(eiMissions).set({
      ...(input.status ? { status: input.status, acceptedAt: input.status === "accepted" ? new Date() : mission.acceptedAt, attemptedAt: input.status === "attempted" ? new Date() : mission.attemptedAt, completedAt: input.status === "complete" ? new Date() : mission.completedAt } : {}),
      ...(typeof input.partnerVisible === "boolean" ? { partnerVisible: input.partnerVisible } : {}),
      updatedAt: new Date(),
    }).where(eq(eiMissions.id, mission.id));
    return { updated: true };
  }),

  analyseSelfLeadership: protectedProcedure.input(selfLeadershipInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await requireTenantId(db, ctx.user.id);
    const [run] = await db.insert(eiAgentRuns).values({ tenantId, actorUserId: ctx.user.id, subjectUserId: ctx.user.id, agentCode: "self_leadership_intelligence", purposeCode: "private_development_coaching", triggerType: "participant_requested", status: "running", inputManifest: { fields: Object.keys(input), source: "participant_private" }, traceId: crypto.randomUUID() }).$returningId();
    const outcome = await analyseSelfLeadershipWithMetadata({ ...input, sourceApp: "engineering_intelligence" });
    const [mirror] = await db.insert(icSelfLeadershipMirrors).values({
      tenantId,
      userId: ctx.user.id,
      sourceApp: "engineering_intelligence",
      careerStage: input.careerStage,
      primaryDimension: outcome.analysis.selfLeadershipSignal.primaryDimension,
      confidence: outcome.analysis.selfLeadershipSignal.confidence,
      situation: input.situation,
      observedBehaviour: input.observedBehaviour ?? null,
      analysis: outcome.analysis,
      ontologyPrimaryDistinctionId: outcome.analysis.ontology?.primaryDistinctionId ?? null,
      ontologySecondaryDistinctionId: outcome.analysis.ontology?.secondaryDistinctionId ?? null,
    }).$returningId();
    await db.update(eiAgentRuns).set({ status: outcome.mode === "model" ? "succeeded" : "fallback", modelId: outcome.modelId, completedAt: new Date() }).where(eq(eiAgentRuns.id, run.id));
    return { mirrorId: mirror.id, analysis: outcome.analysis, mode: outcome.mode };
  }),

  rateSelfLeadership: protectedProcedure.input(z.object({ mirrorId: z.number().int().positive(), relevance: z.enum(["up", "down"]), feedbackNote: z.string().trim().max(600).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [mirror] = await db.select({ id: icSelfLeadershipMirrors.id }).from(icSelfLeadershipMirrors).where(and(eq(icSelfLeadershipMirrors.id, input.mirrorId), eq(icSelfLeadershipMirrors.userId, ctx.user.id), eq(icSelfLeadershipMirrors.sourceApp, "engineering_intelligence"))).limit(1);
    if (!mirror) throw new TRPCError({ code: "NOT_FOUND", message: "Private reflection not found." });
    await db.update(icSelfLeadershipMirrors).set({ relevance: input.relevance, feedbackNote: input.feedbackNote ?? null }).where(eq(icSelfLeadershipMirrors.id, mirror.id));
    return { saved: true };
  }),

  getPartnerWorkspace: successPartnerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await requireTenantId(db, ctx.user.id);
    const assignments = ctx.user.role === "admin"
      ? await db.select().from(eiPartnerAssignments).where(and(eq(eiPartnerAssignments.tenantId, tenantId), eq(eiPartnerAssignments.status, "active")))
      : await db.select().from(eiPartnerAssignments).where(and(eq(eiPartnerAssignments.tenantId, tenantId), eq(eiPartnerAssignments.partnerUserId, ctx.user.id), eq(eiPartnerAssignments.status, "active")));
    const participants = await Promise.all(assignments.map(async (assignment) => {
      const [participant] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, assignment.participantUserId)).limit(1);
      const [mission] = await db.select().from(eiMissions).where(and(eq(eiMissions.tenantId, tenantId), eq(eiMissions.userId, assignment.participantUserId), eq(eiMissions.partnerVisible, true))).orderBy(desc(eiMissions.updatedAt)).limit(1);
      const [latestNudge] = await db.select().from(eiPartnerNudges).where(and(eq(eiPartnerNudges.partnerUserId, assignment.partnerUserId), eq(eiPartnerNudges.participantUserId, assignment.participantUserId))).orderBy(desc(eiPartnerNudges.createdAt)).limit(1);
      return { assignment, participant: participant ?? null, mission: mission ?? null, latestNudge: latestNudge ?? null };
    }));
    return { privacyBoundary: "Only participant-shared Mission context appears here. Private reflections, private AI coaching, and diagnostic responses are never included.", participants };
  }),

  generatePartnerNudges: successPartnerProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await requireTenantId(db, ctx.user.id);
    const assignments = ctx.user.role === "admin"
      ? await db.select().from(eiPartnerAssignments).where(and(eq(eiPartnerAssignments.tenantId, tenantId), eq(eiPartnerAssignments.status, "active")))
      : await db.select().from(eiPartnerAssignments).where(and(eq(eiPartnerAssignments.tenantId, tenantId), eq(eiPartnerAssignments.partnerUserId, ctx.user.id), eq(eiPartnerAssignments.status, "active")));
    const candidates: PartnerNudgeCandidate[] = [];
    for (const assignment of assignments) {
      const [participant] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, assignment.participantUserId)).limit(1);
      const [mission] = await db.select().from(eiMissions).where(and(eq(eiMissions.tenantId, tenantId), eq(eiMissions.userId, assignment.participantUserId), eq(eiMissions.partnerVisible, true))).orderBy(desc(eiMissions.updatedAt)).limit(1);
      const [lastCheckIn] = await db.select({ followUpAt: eiPartnerCheckIns.followUpAt }).from(eiPartnerCheckIns).where(and(eq(eiPartnerCheckIns.partnerUserId, assignment.partnerUserId), eq(eiPartnerCheckIns.participantUserId, assignment.participantUserId))).orderBy(desc(eiPartnerCheckIns.createdAt)).limit(1);
      if (!participant || !mission) continue;
      const reason = getCandidateReason(mission, lastCheckIn?.followUpAt ?? null);
      if (!reason) continue;
      candidates.push({ participantId: participant.id, participantName: participant.name ?? "Participant", missionId: mission.id, missionTitle: mission.title, missionStatus: mission.status, reasonCode: reason.reasonCode, priorityScore: reason.priorityScore, dueAt: mission.dueAt?.toISOString() ?? null, lastUpdatedAt: mission.updatedAt.toISOString(), followUpAt: lastCheckIn?.followUpAt?.toISOString() ?? null });
    }
    const cappedCandidates = candidates.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 8);
    if (!cappedCandidates.length) return { generated: [], mode: "deterministic" as const };
    const [run] = await db.insert(eiAgentRuns).values({ tenantId, actorUserId: ctx.user.id, agentCode: "success_partner_nudges", purposeCode: "partner_coaching_support", triggerType: "partner_requested", status: "running", inputManifest: { candidateCount: cappedCandidates.length, permittedContext: ["participant_name", "shared_mission", "follow_up_date"] }, traceId: crypto.randomUUID() }).$returningId();
    const outcome = await draftPartnerNudges(cappedCandidates);
    const persisted = [] as number[];
    const day = new Date().toISOString().slice(0, 10);
    for (const draft of outcome.drafts) {
      const candidate = cappedCandidates.find((item) => item.participantId === draft.participantId && item.reasonCode === draft.reasonCode);
      if (!candidate) continue;
      const dedupeKey = `${tenantId}:${ctx.user.id}:${candidate.participantId}:${candidate.reasonCode}:${day}`;
      const [existing] = await db.select({ id: eiPartnerNudges.id }).from(eiPartnerNudges).where(eq(eiPartnerNudges.dedupeKey, dedupeKey)).limit(1);
      if (existing) { persisted.push(existing.id); continue; }
      const [created] = await db.insert(eiPartnerNudges).values({ tenantId, partnerUserId: ctx.user.id, participantUserId: candidate.participantId, missionId: candidate.missionId, agentRunId: run.id, reasonCode: draft.reasonCode, objective: draft.objective, whyNow: draft.whyNow, suggestedQuestion: draft.suggestedQuestion, recommendedChannel: draft.recommendedChannel, effort: draft.effort, urgency: draft.urgency, priorityScore: candidate.priorityScore, permittedContextKeys: ["participant_name", "shared_mission", "follow_up_date"], dedupeKey }).$returningId();
      persisted.push(created.id);
    }
    await db.update(eiAgentRuns).set({ status: outcome.mode === "model" ? "succeeded" : "fallback", modelId: outcome.modelId, completedAt: new Date() }).where(eq(eiAgentRuns.id, run.id));
    return { generated: persisted, mode: outcome.mode };
  }),

  updatePartnerNudge: successPartnerProcedure.input(z.object({ nudgeId: z.number().int().positive(), status: z.enum(["opened", "contacted", "completed", "snoozed", "skipped", "dismissed"]), snoozedUntil: z.date().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [nudge] = await db.select().from(eiPartnerNudges).where(and(eq(eiPartnerNudges.id, input.nudgeId), eq(eiPartnerNudges.partnerUserId, ctx.user.id))).limit(1);
    if (!nudge) throw new TRPCError({ code: "NOT_FOUND", message: "Nudge not found." });
    await db.update(eiPartnerNudges).set({ status: input.status, snoozedUntil: input.snoozedUntil ?? null, openedAt: input.status === "opened" ? new Date() : nudge.openedAt, contactedAt: input.status === "contacted" ? new Date() : nudge.contactedAt, completedAt: input.status === "completed" ? new Date() : nudge.completedAt, updatedAt: new Date() }).where(eq(eiPartnerNudges.id, nudge.id));
    return { updated: true };
  }),

  logPartnerCheckIn: successPartnerProcedure.input(z.object({ participantUserId: z.number().int().positive(), nudgeId: z.number().int().positive().optional(), summaryShared: z.string().trim().min(3).max(1200), nextStep: z.string().trim().max(600).optional(), followUpAt: z.date().optional(), channel: z.enum(["in_app", "call", "voice_note", "email", "in_person"]) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await requireTenantId(db, ctx.user.id);
    await requirePartnerAssignment(db, tenantId, ctx.user.id, input.participantUserId, ctx.user.role === "admin");
    const [created] = await db.insert(eiPartnerCheckIns).values({ tenantId, partnerUserId: ctx.user.id, participantUserId: input.participantUserId, nudgeId: input.nudgeId ?? null, summaryShared: input.summaryShared, nextStep: input.nextStep ?? null, followUpAt: input.followUpAt ?? null, channel: input.channel }).$returningId();
    return { checkInId: created.id };
  }),

  assignPartner: adminProcedure.input(z.object({ tenantId: z.number().int().positive(), partnerUserId: z.number().int().positive(), participantUserId: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const memberships = await db.select({ userId: tenantUsers.userId }).from(tenantUsers).where(eq(tenantUsers.tenantId, input.tenantId));
    const memberIds = memberships.map((membership) => membership.userId);
    if (!memberIds.includes(input.partnerUserId) || !memberIds.includes(input.participantUserId)) throw new TRPCError({ code: "BAD_REQUEST", message: "Both Success Partner and participant must belong to the selected organisation." });
    const [existing] = await db.select().from(eiPartnerAssignments).where(and(eq(eiPartnerAssignments.tenantId, input.tenantId), eq(eiPartnerAssignments.partnerUserId, input.partnerUserId), eq(eiPartnerAssignments.participantUserId, input.participantUserId), eq(eiPartnerAssignments.status, "active"))).limit(1);
    if (existing) return { assignmentId: existing.id, created: false };
    const [created] = await db.insert(eiPartnerAssignments).values({ tenantId: input.tenantId, partnerUserId: input.partnerUserId, participantUserId: input.participantUserId, status: "active" }).$returningId();
    return { assignmentId: created.id, created: true };
  }),
});
