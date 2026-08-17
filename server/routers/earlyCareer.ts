import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  earlyCareerCommitments,
  earlyCareerCoachMessages,
  earlyCareerCoachSessions,
  earlyCareerCohorts,
  earlyCareerDiagnosticResults,
  earlyCareerDiagnosticSessions,
  earlyCareerEvidence,
  earlyCareerManagerNudges,
  earlyCareerNudgeConfigs,
  earlyCareerNudgeDeliveries,
  earlyCareerPracticeSessions,
  earlyCareerProfiles,
  earlyCareerSavedPracticeScenarios,
  tenantUsers,
  users,
} from "../../drizzle/schema";
import {
  EARLY_CAREER_CAPABILITIES,
  EARLY_CAREER_STAGES,
  getEarlyCareerManagerNudge,
  getEarlyCareerNextMove,
  getEarlyCareerStage,
  type EarlyCareerCapabilityId,
  type EarlyCareerStageId,
} from "../../shared/modules/earlyCareerData";
import {
  EARLY_CAREER_COACH_STARTERS,
  EARLY_CAREER_DIAGNOSTIC_DISCLAIMER,
  EARLY_CAREER_DIAGNOSTIC_QUESTIONS,
  EARLY_CAREER_PRACTICE_SCENARIOS,
  EARLY_CAREER_RESPONSE_SCALE,
  getEarlyCareerDevelopmentGuidance,
  scoreEarlyCareerDiagnostic,
} from "../../shared/modules/earlyCareerDiagnostic";
import { invokeLLM } from "../_core/llm";
import { buildSelfLeadershipGuideDirective } from "../../shared/modules/selfLeadershipIntelligence";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";

const stages = ["orient", "deliver", "connect", "navigate", "grow", "contribute", "accelerate"] as const;
const capabilities = [
  "ownership_reliability",
  "communication",
  "collaboration",
  "manager_partnership",
  "organisational_navigation",
  "learning_agility",
  "professional_judgment",
  "value_creation",
] as const;

const managerPrivacyBoundary =
  "This Manager Companion view uses manager-visible profile context and employee-shared commitments only. Private AI coaching, private reflections, raw diagnostic answers, and hidden employee labels are never included.";

async function getTenantIdForUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [membership] = await db
    .select({ tenantId: tenantUsers.tenantId })
    .from(tenantUsers)
    .where(eq(tenantUsers.userId, userId))
    .limit(1);
  return membership?.tenantId ?? null;
}

function stageIdFrom(value: string | null | undefined): EarlyCareerStageId {
  return stages.includes(value as EarlyCareerStageId) ? (value as EarlyCareerStageId) : "orient";
}

function extractLlmText(result: Awaited<ReturnType<typeof invokeLLM>>): string {
  const content = result.choices[0]?.message?.content ?? "";
  return typeof content === "string" ? content : "";
}

const customPracticeDefaults = {
  id: "custom",
  title: "Your workplace situation",
  counterpartRole: "colleague",
  objective: "Clarify your position and agree a useful next step.",
};

function resolvePracticeScenario(session: typeof earlyCareerPracticeSessions.$inferSelect) {
  if (session.scenarioId === customPracticeDefaults.id) {
    if (!session.customContext) return null;
    return {
      ...customPracticeDefaults,
      title: session.scenarioTitle || customPracticeDefaults.title,
      situation: session.customContext,
      counterpartRole: session.customCounterpartRole || customPracticeDefaults.counterpartRole,
      objective: session.customObjective || customPracticeDefaults.objective,
    };
  }
  return EARLY_CAREER_PRACTICE_SCENARIOS.find((item) => item.id === session.scenarioId) ?? null;
}

export const earlyCareerPracticeStartInput = z.object({
  scenarioId: z.string().min(3).max(100).optional(),
  customContext: z.string().trim().min(20).max(2000).optional(),
  customCounterpartRole: z.string().trim().min(2).max(120).optional(),
  customObjective: z.string().trim().min(3).max(600).optional(),
  difficulty: z.enum(["guided", "realistic", "stretch"]).default("realistic"),
}).superRefine((input, issue) => {
  if (Boolean(input.scenarioId) === Boolean(input.customContext)) {
    issue.addIssue({ code: "custom", message: "Choose a library scenario or describe your own workplace situation." });
  }
});

export const earlyCareerSavedPracticeScenarioInput = z.object({
  title: z.string().trim().min(3).max(160),
  context: z.string().trim().min(20).max(2000),
  counterpartRole: z.string().trim().min(2).max(120),
  objective: z.string().trim().max(600).optional(),
});

const earlyCareerCohortInput = z.object({
  tenantId: z.number().int().positive(),
  name: z.string().trim().min(3).max(160),
  description: z.string().trim().max(1000).optional(),
  managerUserId: z.number().int().positive(),
});

async function assertCohortAdministrationAccess(user: { id: number; role: string }, tenantId: number) {
  if (user.role === "admin") return;
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [membership] = await db.select().from(tenantUsers).where(and(eq(tenantUsers.userId, user.id), eq(tenantUsers.tenantId, tenantId), eq(tenantUsers.role, "owner"))).limit(1);
  if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Organisation owner access is required to manage Early Career cohorts." });
}

async function buildEarlyCareerPrivateContext(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const [profile, latestResult, commitments] = await Promise.all([
    db.select().from(earlyCareerProfiles).where(eq(earlyCareerProfiles.userId, userId)).limit(1),
    db.select().from(earlyCareerDiagnosticResults).where(eq(earlyCareerDiagnosticResults.userId, userId)).orderBy(desc(earlyCareerDiagnosticResults.createdAt)).limit(1),
    db.select().from(earlyCareerCommitments).where(and(eq(earlyCareerCommitments.userId, userId), inArray(earlyCareerCommitments.status, ["planned", "in_progress"]))).limit(4),
  ]);
  const lines = ["Private Early Career development context:"];
  if (profile[0]) lines.push(`Role: ${profile[0].roleTitle ?? "not specified"}; journey stage: ${profile[0].journeyStage}.`);
  if (latestResult[0]) lines.push(`Latest private reflection: ${latestResult[0].developmentalBand}; development focus: ${latestResult[0].recommendedCapabilityId}.`);
  if (commitments.length) lines.push(`Active commitments: ${commitments.map((item) => item.title).join("; ")}.`);
  lines.push("This context is private to the employee. Never imply it is shared with a manager or HR.");
  return lines.join("\n");
}

const EARLY_CAREER_COACH_GUARDRAIL = `You are the LevelNext Early Career Guide. Help an early-career employee clarify a workplace moment, practise a constructive action, and choose one proportionate next step. Be warm, direct, and specific. Do not score, rank, label, diagnose, or make performance/employment judgements. Do not claim facts not supplied. Do not offer legal, medical, or mental-health diagnosis. Never say private conversations are shared. Keep responses under 220 words and ask one useful question before advice when the situation is unclear.\n\n${buildSelfLeadershipGuideDirective("early_career")}`;

export const earlyCareerRouter = router({
  getDiagnostic: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [inProgress, latestResult] = await Promise.all([
      db
        .select()
        .from(earlyCareerDiagnosticSessions)
        .where(and(eq(earlyCareerDiagnosticSessions.userId, ctx.user.id), eq(earlyCareerDiagnosticSessions.status, "in_progress")))
        .orderBy(desc(earlyCareerDiagnosticSessions.updatedAt))
        .limit(1),
      db
        .select()
        .from(earlyCareerDiagnosticResults)
        .where(eq(earlyCareerDiagnosticResults.userId, ctx.user.id))
        .orderBy(desc(earlyCareerDiagnosticResults.createdAt))
        .limit(1),
    ]);
    return {
      disclaimer: EARLY_CAREER_DIAGNOSTIC_DISCLAIMER,
      capabilities: EARLY_CAREER_CAPABILITIES,
      questions: EARLY_CAREER_DIAGNOSTIC_QUESTIONS,
      responseScale: EARLY_CAREER_RESPONSE_SCALE,
      inProgress: inProgress[0] ?? null,
      latestResult: latestResult[0]
        ? { ...latestResult[0], developmentGuidance: getEarlyCareerDevelopmentGuidance(latestResult[0].recommendedCapabilityId as EarlyCareerCapabilityId) }
        : null,
    };
  }),

  startDiagnostic: protectedProcedure
    .input(z.object({ consent: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [existing] = await db
        .select()
        .from(earlyCareerDiagnosticSessions)
        .where(and(eq(earlyCareerDiagnosticSessions.userId, ctx.user.id), eq(earlyCareerDiagnosticSessions.status, "in_progress")))
        .orderBy(desc(earlyCareerDiagnosticSessions.updatedAt))
        .limit(1);
      if (existing) return { sessionId: existing.id, responses: existing.responses, currentQuestionIndex: existing.currentQuestionIndex };
      const tenantId = await getTenantIdForUser(ctx.user.id);
      const [created] = await db
        .insert(earlyCareerDiagnosticSessions)
        .values({ userId: ctx.user.id, tenantId, responses: {}, currentQuestionIndex: 0, consentedAt: new Date() })
        .$returningId();
      return { sessionId: created.id, responses: {}, currentQuestionIndex: 0 };
    }),

  submitDiagnosticResponse: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive(), questionId: z.string().min(3).max(100), response: z.number().int().min(1).max(5) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      if (!EARLY_CAREER_DIAGNOSTIC_QUESTIONS.some((question) => question.id === input.questionId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown diagnostic question." });
      }
      const [session] = await db
        .select()
        .from(earlyCareerDiagnosticSessions)
        .where(and(eq(earlyCareerDiagnosticSessions.id, input.sessionId), eq(earlyCareerDiagnosticSessions.userId, ctx.user.id)))
        .limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Diagnostic session not found." });
      if (session.status === "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "This diagnostic has already been completed." });

      const responses = { ...(session.responses as Record<string, number>), [input.questionId]: input.response };
      const answeredCount = EARLY_CAREER_DIAGNOSTIC_QUESTIONS.filter((question) => typeof responses[question.id] === "number").length;
      const isComplete = answeredCount === EARLY_CAREER_DIAGNOSTIC_QUESTIONS.length;
      const currentQuestionIndex = Math.min(answeredCount, EARLY_CAREER_DIAGNOSTIC_QUESTIONS.length - 1);

      await db
        .update(earlyCareerDiagnosticSessions)
        .set({ responses, currentQuestionIndex, status: isComplete ? "completed" : "in_progress", completedAt: isComplete ? new Date() : null })
        .where(eq(earlyCareerDiagnosticSessions.id, session.id));

      if (!isComplete) return { isComplete: false, currentQuestionIndex, answeredCount };

      const scored = scoreEarlyCareerDiagnostic(responses);
      const [result] = await db
        .insert(earlyCareerDiagnosticResults)
        .values({
          sessionId: session.id,
          userId: ctx.user.id,
          tenantId: session.tenantId,
          overallScore: scored.overallScore,
          capabilityScores: scored.capabilityScores,
          developmentalBand: scored.band.label,
          recommendedCapabilityId: scored.recommendedCapability,
        })
        .$returningId();
      return {
        isComplete: true,
        resultId: result.id,
        ...scored,
        developmentGuidance: getEarlyCareerDevelopmentGuidance(scored.recommendedCapability),
      };
    }),

  getLatestDiagnosticResult: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [result] = await db
      .select()
      .from(earlyCareerDiagnosticResults)
      .where(eq(earlyCareerDiagnosticResults.userId, ctx.user.id))
      .orderBy(desc(earlyCareerDiagnosticResults.createdAt))
      .limit(1);
    return result
      ? { ...result, developmentGuidance: getEarlyCareerDevelopmentGuidance(result.recommendedCapabilityId as EarlyCareerCapabilityId) }
      : null;
  }),

  getCoachStarters: protectedProcedure.query(() => EARLY_CAREER_COACH_STARTERS),

  startCoachSession: protectedProcedure.input(z.object({ context: z.string().trim().max(1000).optional(), title: z.string().trim().max(160).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await getTenantIdForUser(ctx.user.id);
    const [created] = await db.insert(earlyCareerCoachSessions).values({ userId: ctx.user.id, tenantId, title: input.title || input.context?.slice(0, 120) || "Private development conversation", startingContext: input.context ?? null }).$returningId();
    let opening = "I’m here to help you think through a real workplace moment. What feels most important to make clearer today?";
    try {
      const result = await invokeLLM({ model: "gpt-5-mini", messages: [{ role: "system", content: EARLY_CAREER_COACH_GUARDRAIL }, { role: "user", content: `${await buildEarlyCareerPrivateContext(ctx.user.id)}\n\nThe employee begins with: ${input.context ?? "a general development check-in"}\nWrite a warm two-sentence opening that invites reflection.` }], maxTokens: 180 });
      opening = extractLlmText(result).trim() || opening;
    } catch { /* private fallback */ }
    await db.insert(earlyCareerCoachMessages).values({ sessionId: created.id, role: "assistant", content: opening });
    return { sessionId: created.id, opening };
  }),

  sendCoachMessage: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), message: z.string().trim().min(1).max(2000) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [session] = await db.select().from(earlyCareerCoachSessions).where(and(eq(earlyCareerCoachSessions.id, input.sessionId), eq(earlyCareerCoachSessions.userId, ctx.user.id))).limit(1);
    if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Guide conversation not found." });
    await db.insert(earlyCareerCoachMessages).values({ sessionId: session.id, role: "user", content: input.message });
    const history = await db.select().from(earlyCareerCoachMessages).where(eq(earlyCareerCoachMessages.sessionId, session.id)).orderBy(earlyCareerCoachMessages.createdAt).limit(14);
    let reply = "Let’s slow this down. What outcome would make this situation feel more workable, and what is one conversation or action you could take next?";
    try {
      const result = await invokeLLM({ model: "gpt-5-mini", messages: [{ role: "system", content: EARLY_CAREER_COACH_GUARDRAIL }, { role: "system", content: await buildEarlyCareerPrivateContext(ctx.user.id) }, ...history.map((message) => ({ role: message.role, content: message.content }))], maxTokens: 420 });
      reply = extractLlmText(result).trim() || reply;
    } catch { /* private fallback */ }
    await db.insert(earlyCareerCoachMessages).values({ sessionId: session.id, role: "assistant", content: reply });
    return { reply };
  }),

  getCoachSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(earlyCareerCoachSessions).where(eq(earlyCareerCoachSessions.userId, ctx.user.id)).orderBy(desc(earlyCareerCoachSessions.updatedAt)).limit(20);
  }),

  getCoachMessages: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [session] = await db.select().from(earlyCareerCoachSessions).where(and(eq(earlyCareerCoachSessions.id, input.sessionId), eq(earlyCareerCoachSessions.userId, ctx.user.id))).limit(1);
    if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Guide conversation not found." });
    return db.select().from(earlyCareerCoachMessages).where(eq(earlyCareerCoachMessages.sessionId, session.id)).orderBy(earlyCareerCoachMessages.createdAt);
  }),

  getPracticeScenarios: protectedProcedure.query(() => EARLY_CAREER_PRACTICE_SCENARIOS),

  getSavedPracticeScenarios: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(earlyCareerSavedPracticeScenarios)
      .where(eq(earlyCareerSavedPracticeScenarios.userId, ctx.user.id))
      .orderBy(desc(earlyCareerSavedPracticeScenarios.updatedAt)).limit(12);
  }),

  savePracticeScenario: protectedProcedure.input(earlyCareerSavedPracticeScenarioInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = await getTenantIdForUser(ctx.user.id);
    const [created] = await db.insert(earlyCareerSavedPracticeScenarios).values({ userId: ctx.user.id, tenantId, title: input.title, context: input.context, counterpartRole: input.counterpartRole, objective: input.objective ?? null }).$returningId();
    return { id: created.id };
  }),

  deleteSavedPracticeScenario: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [scenario] = await db.select({ id: earlyCareerSavedPracticeScenarios.id }).from(earlyCareerSavedPracticeScenarios).where(and(eq(earlyCareerSavedPracticeScenarios.id, input.id), eq(earlyCareerSavedPracticeScenarios.userId, ctx.user.id))).limit(1);
    if (!scenario) throw new TRPCError({ code: "NOT_FOUND", message: "Saved practice scenario not found." });
    await db.delete(earlyCareerSavedPracticeScenarios).where(eq(earlyCareerSavedPracticeScenarios.id, scenario.id));
    return { success: true };
  }),

  getPracticeHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(earlyCareerPracticeSessions).where(eq(earlyCareerPracticeSessions.userId, ctx.user.id)).orderBy(desc(earlyCareerPracticeSessions.updatedAt)).limit(15);
  }),

  getCohortManagement: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const ownerMemberships = await db.select({ tenantId: tenantUsers.tenantId }).from(tenantUsers).where(and(eq(tenantUsers.userId, ctx.user.id), eq(tenantUsers.role, "owner")));
    if (ctx.user.role !== "admin" && ownerMemberships.length === 0) return { canManageCohorts: false, tenantIds: [], cohorts: [], employees: [], managers: [] };
    const cohorts = ctx.user.role === "admin"
      ? await db.select().from(earlyCareerCohorts).orderBy(desc(earlyCareerCohorts.updatedAt))
      : await db.select().from(earlyCareerCohorts).where(inArray(earlyCareerCohorts.tenantId, ownerMemberships.map((membership) => membership.tenantId))).orderBy(desc(earlyCareerCohorts.updatedAt));
    const tenantIds = ctx.user.role === "admin"
      ? Array.from(new Set((await db.select({ tenantId: earlyCareerProfiles.tenantId }).from(earlyCareerProfiles)).map((row) => row.tenantId).filter((id): id is number => id !== null)))
      : ownerMemberships.map((membership) => membership.tenantId);
    const employees = tenantIds.length ? await db.select({ profile: earlyCareerProfiles, employee: { id: users.id, name: users.name, email: users.email } }).from(earlyCareerProfiles).innerJoin(users, eq(earlyCareerProfiles.userId, users.id)).where(inArray(earlyCareerProfiles.tenantId, tenantIds)).orderBy(desc(earlyCareerProfiles.updatedAt)) : [];
    const managers = tenantIds.length ? await db.select({ tenantId: tenantUsers.tenantId, user: { id: users.id, name: users.name, email: users.email } }).from(tenantUsers).innerJoin(users, eq(tenantUsers.userId, users.id)).where(inArray(tenantUsers.tenantId, tenantIds)) : [];
    return { canManageCohorts: true, tenantIds, cohorts, employees, managers };
  }),

  createCohort: protectedProcedure.input(earlyCareerCohortInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    await assertCohortAdministrationAccess(ctx.user, input.tenantId);
    const [managerMembership] = await db.select().from(tenantUsers).where(and(eq(tenantUsers.userId, input.managerUserId), eq(tenantUsers.tenantId, input.tenantId))).limit(1);
    if (!managerMembership) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected manager must belong to this organisation." });
    const [created] = await db.insert(earlyCareerCohorts).values({ tenantId: input.tenantId, name: input.name, description: input.description ?? null, managerUserId: input.managerUserId, createdByUserId: ctx.user.id }).$returningId();
    return { id: created.id };
  }),

  assignCohortMember: protectedProcedure.input(z.object({ employeeUserId: z.number().int().positive(), cohortId: z.number().int().positive().nullable() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [employeeProfile] = await db.select().from(earlyCareerProfiles).where(eq(earlyCareerProfiles.userId, input.employeeUserId)).limit(1);
    if (!employeeProfile?.tenantId) throw new TRPCError({ code: "NOT_FOUND", message: "Early Career employee profile not found." });
    await assertCohortAdministrationAccess(ctx.user, employeeProfile.tenantId);
    if (!input.cohortId) {
      await db.update(earlyCareerProfiles).set({ cohortId: null }).where(eq(earlyCareerProfiles.id, employeeProfile.id));
      return { success: true };
    }
    const [cohort] = await db.select().from(earlyCareerCohorts).where(and(eq(earlyCareerCohorts.id, input.cohortId), eq(earlyCareerCohorts.tenantId, employeeProfile.tenantId))).limit(1);
    if (!cohort) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a cohort from the employee's organisation." });
    await db.update(earlyCareerProfiles).set({ cohortId: cohort.id, managerUserId: cohort.managerUserId }).where(eq(earlyCareerProfiles.id, employeeProfile.id));
    return { success: true, managerUserId: cohort.managerUserId };
  }),

  deleteCohort: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [cohort] = await db.select().from(earlyCareerCohorts).where(eq(earlyCareerCohorts.id, input.id)).limit(1);
    if (!cohort) throw new TRPCError({ code: "NOT_FOUND", message: "Cohort not found." });
    await assertCohortAdministrationAccess(ctx.user, cohort.tenantId);
    await db.update(earlyCareerProfiles).set({ cohortId: null }).where(eq(earlyCareerProfiles.cohortId, cohort.id));
    await db.delete(earlyCareerCohorts).where(eq(earlyCareerCohorts.id, cohort.id));
    return { success: true };
  }),

  startPracticeSession: protectedProcedure.input(earlyCareerPracticeStartInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const scenario = input.customContext
      ? {
          ...customPracticeDefaults,
          situation: input.customContext,
          counterpartRole: input.customCounterpartRole || customPracticeDefaults.counterpartRole,
          objective: input.customObjective || customPracticeDefaults.objective,
        }
      : EARLY_CAREER_PRACTICE_SCENARIOS.find((item) => item.id === input.scenarioId);
    if (!scenario) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown practice scenario." });
    const tenantId = await getTenantIdForUser(ctx.user.id);
    let opening = `I’m the ${scenario.counterpartRole}. How would you like to begin?`;
    try {
      const result = await invokeLLM({ model: "claude-haiku-4-5", messages: [{ role: "system", content: `You play a ${scenario.counterpartRole} in a developmental workplace rehearsal. Stay in character, use 1–2 realistic sentences, do not coach or grade.` }, { role: "user", content: `Situation: ${scenario.situation}\nEmployee objective: ${scenario.objective}\nDifficulty: ${input.difficulty}\nCreate the opening line.` }], maxTokens: 120 });
      opening = extractLlmText(result).trim() || opening;
    } catch { /* practice fallback */ }
    const messages = [{ role: "counterpart" as const, content: opening, timestamp: new Date().toISOString() }];
    const [created] = await db.insert(earlyCareerPracticeSessions).values({
      userId: ctx.user.id,
      tenantId,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      customContext: input.customContext ?? null,
      customCounterpartRole: input.customContext ? scenario.counterpartRole : null,
      customObjective: input.customContext ? scenario.objective : null,
      difficulty: input.difficulty,
      messages,
    }).$returningId();
    return { sessionId: created.id, opening };
  }),

  sendPracticeMessage: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), message: z.string().trim().min(1).max(1200) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [session] = await db.select().from(earlyCareerPracticeSessions).where(and(eq(earlyCareerPracticeSessions.id, input.sessionId), eq(earlyCareerPracticeSessions.userId, ctx.user.id))).limit(1);
    if (!session || session.status !== "active") throw new TRPCError({ code: "NOT_FOUND", message: "Active practice session not found." });
    const scenario = resolvePracticeScenario(session);
    if (!scenario) throw new TRPCError({ code: "BAD_REQUEST", message: "Practice scenario unavailable." });
    const messages = [...(session.messages ?? []), { role: "user" as const, content: input.message, timestamp: new Date().toISOString() }];
    let reply = "I understand. What specifically are you proposing as the next step?";
    try {
      const result = await invokeLLM({ model: "claude-haiku-4-5", messages: [{ role: "system", content: `Stay in role as a ${scenario.counterpartRole}. Scenario: ${scenario.situation}. Difficulty: ${session.difficulty}. Respond in 1–3 natural sentences. Do not coach, grade, or break character.` }, ...messages.slice(-8).map((message) => ({ role: message.role === "user" ? "user" as const : "assistant" as const, content: message.content }))], maxTokens: 180 });
      reply = extractLlmText(result).trim() || reply;
    } catch { /* practice fallback */ }
    messages.push({ role: "counterpart", content: reply, timestamp: new Date().toISOString() });
    await db.update(earlyCareerPracticeSessions).set({ messages }).where(eq(earlyCareerPracticeSessions.id, session.id));
    return { reply };
  }),

  endPracticeSession: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [session] = await db.select().from(earlyCareerPracticeSessions).where(and(eq(earlyCareerPracticeSessions.id, input.sessionId), eq(earlyCareerPracticeSessions.userId, ctx.user.id))).limit(1);
    if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Practice session not found." });
    let feedback: Record<string, unknown> = { headline: "You completed a practice conversation.", noticed: ["You chose to rehearse a real workplace moment."], tryNext: "Choose one phrase or question to use in the next real conversation.", reflectionQuestion: "What felt more natural after practising it?" };
    try {
      const result = await invokeLLM({ model: "gpt-5-mini", messages: [{ role: "system", content: "You are a practice debrief coach. Give behavioural, non-evaluative feedback. Do not score, rank, label, or imply employment readiness. Return JSON only with headline, noticed (string array), tryNext, reflectionQuestion." }, { role: "user", content: `Scenario: ${session.scenarioTitle}\nConversation: ${(session.messages ?? []).map((item) => `${item.role}: ${item.content}`).join("\n")}` }], maxTokens: 420 });
      const parsed = JSON.parse(extractLlmText(result));
      if (parsed && typeof parsed.headline === "string") feedback = parsed;
    } catch { /* debrief fallback */ }
    await db.update(earlyCareerPracticeSessions).set({ status: "completed", feedback }).where(eq(earlyCareerPracticeSessions.id, session.id));
    return feedback;
  }),

  getHRCohortIntelligence: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [membership] = await db.select().from(tenantUsers).where(and(eq(tenantUsers.userId, ctx.user.id), eq(tenantUsers.role, "owner"))).limit(1);
    if (!membership && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Organisation owner access is required." });
    const tenantId = membership?.tenantId;
    if (!tenantId) return { eligible: false, minimumCohortSize: 5, cohortSize: 0, privacyBoundary: "No individual answers, private Guide conversations, or Practice Partner records are included." };
    const results = await db.select().from(earlyCareerDiagnosticResults).where(eq(earlyCareerDiagnosticResults.tenantId, tenantId));
    const latest = new Map<number, typeof results[number]>(); results.forEach((item) => { if (!latest.has(item.userId)) latest.set(item.userId, item); });
    const cohort = Array.from(latest.values());
    if (cohort.length < 5) return { eligible: false, minimumCohortSize: 5, cohortSize: cohort.length, privacyBoundary: "Cohort metrics are withheld until at least five employees have completed the diagnostic. No individual answers, private Guide conversations, or Practice Partner records are included." };
    const averages = Object.fromEntries(EARLY_CAREER_CAPABILITIES.map((capability) => [capability.id, Math.round(cohort.reduce((total, result) => total + Number((result.capabilityScores as Record<string, number>)[capability.id] ?? 0), 0) / cohort.length)]));
    return { eligible: true, minimumCohortSize: 5, cohortSize: cohort.length, averageOverallScore: Math.round(cohort.reduce((total, result) => total + result.overallScore, 0) / cohort.length), capabilityAverages: averages, privacyBoundary: "Aggregate patterns only: no individual answers, private Guide conversations, Practice Partner transcripts, or employee labels are included." };
  }),

  getNudgeConfig: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [membership] = await db.select().from(tenantUsers).where(and(eq(tenantUsers.userId, ctx.user.id), eq(tenantUsers.role, "owner"))).limit(1);
    if (!membership && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    if (!membership) return [];
    return db.select().from(earlyCareerNudgeConfigs).where(eq(earlyCareerNudgeConfigs.tenantId, membership.tenantId));
  }),

  saveNudgeConfig: protectedProcedure.input(z.object({ audience: z.enum(["employees", "managers"]), enabled: z.boolean(), cadence: z.enum(["weekly", "fortnightly", "monthly"]), journeyStage: z.enum(["all", ...stages]), dayOfWeek: z.number().int().min(0).max(6), hourUtc: z.number().int().min(0).max(23) })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [membership] = await db.select().from(tenantUsers).where(and(eq(tenantUsers.userId, ctx.user.id), eq(tenantUsers.role, "owner"))).limit(1);
    if (!membership && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Organisation owner access is required." });
    if (!membership) throw new TRPCError({ code: "BAD_REQUEST", message: "A tenant owner membership is required." });
    const [existing] = await db.select().from(earlyCareerNudgeConfigs).where(and(eq(earlyCareerNudgeConfigs.tenantId, membership.tenantId), eq(earlyCareerNudgeConfigs.audience, input.audience))).limit(1);
    let configId: number;
    let taskUid = existing?.scheduleCronTaskUid ?? null;
    if (existing) { await db.update(earlyCareerNudgeConfigs).set(input).where(eq(earlyCareerNudgeConfigs.id, existing.id)); configId = existing.id; }
    else { const [created] = await db.insert(earlyCareerNudgeConfigs).values({ ...input, tenantId: membership.tenantId, createdByUserId: ctx.user.id }).$returningId(); configId = created.id; }

    const cron = `0 0 ${input.hourUtc} * * ${input.dayOfWeek}`;
    const schedulePatch = { cron, path: "/api/scheduled/earlyCareerNudges", method: "POST" as const, payload: { configId }, description: `Early Career ${input.audience} nudges for tenant ${membership.tenantId}`, enable: input.enabled };
    if (taskUid) await updateHeartbeatJob(taskUid, schedulePatch, "");
    else {
      const createdJob = await createHeartbeatJob({ name: `early-career-${membership.tenantId}-${input.audience}`, cron, path: "/api/scheduled/earlyCareerNudges", method: "POST", payload: { configId }, description: `Early Career ${input.audience} nudges for tenant ${membership.tenantId}` }, "");
      taskUid = createdJob.taskUid;
      if (!input.enabled) await updateHeartbeatJob(taskUid, { enable: false }, "");
      await db.update(earlyCareerNudgeConfigs).set({ scheduleCronTaskUid: taskUid }).where(eq(earlyCareerNudgeConfigs.id, configId));
    }
    return { id: configId, scheduleCronTaskUid: taskUid };
  }),

  getHome: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [profile] = await db
      .select()
      .from(earlyCareerProfiles)
      .where(eq(earlyCareerProfiles.userId, ctx.user.id))
      .limit(1);

    const stageId = stageIdFrom(profile?.journeyStage);
    const [commitments, evidence] = await Promise.all([
      db
        .select()
        .from(earlyCareerCommitments)
        .where(eq(earlyCareerCommitments.userId, ctx.user.id))
        .orderBy(desc(earlyCareerCommitments.createdAt))
        .limit(8),
      db
        .select()
        .from(earlyCareerEvidence)
        .where(eq(earlyCareerEvidence.userId, ctx.user.id))
        .orderBy(desc(earlyCareerEvidence.occurredAt))
        .limit(6),
    ]);

    return {
      profile: profile ?? null,
      journey: {
        stages: EARLY_CAREER_STAGES,
        currentStage: getEarlyCareerStage(stageId),
        currentStageId: stageId,
      },
      nextMove: getEarlyCareerNextMove(stageId),
      capabilities: EARLY_CAREER_CAPABILITIES,
      commitments,
      evidence,
      privacyMessage: "Private to you: your AI coaching conversations and reflections are not shared with your manager or HR.",
    };
  }),

  saveProfile: protectedProcedure
    .input(
      z.object({
        joiningDate: z.string().datetime().nullable().optional(),
        roleTitle: z.string().trim().max(255).nullable().optional(),
        functionName: z.string().trim().max(150).nullable().optional(),
        teamName: z.string().trim().max(150).nullable().optional(),
        journeyStage: z.enum(stages),
        privacyAcknowledged: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const tenantId = await getTenantIdForUser(ctx.user.id);
      const payload = {
        tenantId,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : null,
        roleTitle: input.roleTitle ?? null,
        functionName: input.functionName ?? null,
        teamName: input.teamName ?? null,
        journeyStage: input.journeyStage,
        onboardingComplete: true,
        privacyAcknowledgedAt: input.privacyAcknowledged ? new Date() : null,
      };

      const [existing] = await db
        .select()
        .from(earlyCareerProfiles)
        .where(eq(earlyCareerProfiles.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db.update(earlyCareerProfiles).set(payload).where(eq(earlyCareerProfiles.id, existing.id));
        return { ...existing, ...payload };
      }

      const [created] = await db.insert(earlyCareerProfiles).values({ userId: ctx.user.id, ...payload }).$returningId();
      return { id: created.id, userId: ctx.user.id, ...payload };
    }),

  createCommitment: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(3).max(255),
        description: z.string().trim().max(1000).optional(),
        journeyStage: z.enum(stages),
        capabilityId: z.enum(capabilities),
        dueDate: z.string().datetime().nullable().optional(),
        sharingScope: z.enum(["private", "employee_and_manager"]).default("private"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const tenantId = await getTenantIdForUser(ctx.user.id);
      const [created] = await db
        .insert(earlyCareerCommitments)
        .values({
          userId: ctx.user.id,
          tenantId,
          createdByUserId: ctx.user.id,
          title: input.title,
          description: input.description ?? null,
          journeyStage: input.journeyStage,
          capabilityId: input.capabilityId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          sharingScope: input.sharingScope,
        })
        .$returningId();
      return { id: created.id };
    }),

  completeCommitment: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), outcome: z.string().trim().min(3).max(1500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [commitment] = await db
        .select()
        .from(earlyCareerCommitments)
        .where(and(eq(earlyCareerCommitments.id, input.id), eq(earlyCareerCommitments.userId, ctx.user.id)))
        .limit(1);
      if (!commitment) throw new TRPCError({ code: "NOT_FOUND", message: "Commitment not found" });
      await db
        .update(earlyCareerCommitments)
        .set({ status: "completed", outcome: input.outcome, completedAt: new Date() })
        .where(eq(earlyCareerCommitments.id, commitment.id));
      return { success: true };
    }),

  addEvidence: protectedProcedure
    .input(
      z.object({
        commitmentId: z.number().int().positive().nullable().optional(),
        capabilityId: z.enum(capabilities),
        evidenceType: z.enum(["self_report", "shared_commitment", "practice", "manager_confirmation"]),
        privacyScope: z.enum(["private", "employee_and_manager"]).default("private"),
        summary: z.string().trim().min(3).max(1500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      if (input.commitmentId) {
        const [commitment] = await db
          .select()
          .from(earlyCareerCommitments)
          .where(and(eq(earlyCareerCommitments.id, input.commitmentId), eq(earlyCareerCommitments.userId, ctx.user.id)))
          .limit(1);
        if (!commitment) throw new TRPCError({ code: "NOT_FOUND", message: "Commitment not found" });
      }
      const tenantId = await getTenantIdForUser(ctx.user.id);
      const [created] = await db
        .insert(earlyCareerEvidence)
        .values({
          userId: ctx.user.id,
          tenantId,
          commitmentId: input.commitmentId ?? null,
          capabilityId: input.capabilityId,
          evidenceType: input.evidenceType,
          privacyScope: input.privacyScope,
          summary: input.summary,
        })
        .$returningId();
      return { id: created.id };
    }),

  getManagerCompanion: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const employees = await db
      .select({
        profile: earlyCareerProfiles,
        employee: { id: users.id, name: users.name, email: users.email },
      })
      .from(earlyCareerProfiles)
      .innerJoin(users, eq(earlyCareerProfiles.userId, users.id))
      .where(eq(earlyCareerProfiles.managerUserId, ctx.user.id))
      .orderBy(desc(earlyCareerProfiles.updatedAt));

    const employeeIds = employees.map((item) => item.employee.id);
    const sharedCommitments = await Promise.all(
      employeeIds.map((employeeId) =>
        db
          .select()
          .from(earlyCareerCommitments)
          .where(
            and(
              eq(earlyCareerCommitments.userId, employeeId),
              eq(earlyCareerCommitments.sharingScope, "employee_and_manager")
            )
          )
          .orderBy(desc(earlyCareerCommitments.updatedAt))
          .limit(4)
      )
    );

    const nudges = await db
      .select()
      .from(earlyCareerManagerNudges)
      .where(eq(earlyCareerManagerNudges.managerUserId, ctx.user.id))
      .orderBy(desc(earlyCareerManagerNudges.createdAt))
      .limit(12);

    return {
      privacyBoundary: managerPrivacyBoundary,
      employees: employees.map((item, index) => ({
        ...item,
        stage: getEarlyCareerStage(stageIdFrom(item.profile.journeyStage)),
        suggestedNudge: getEarlyCareerManagerNudge(stageIdFrom(item.profile.journeyStage)),
        sharedCommitments: sharedCommitments[index] ?? [],
      })),
      nudges,
    };
  }),

  getManagerAssignmentDirectory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const ownerMemberships = await db
      .select({ tenantId: tenantUsers.tenantId })
      .from(tenantUsers)
      .where(and(eq(tenantUsers.userId, ctx.user.id), eq(tenantUsers.role, "owner")));
    const tenantIds = ctx.user.role === "admin"
      ? Array.from(new Set((await db.select({ tenantId: earlyCareerProfiles.tenantId }).from(earlyCareerProfiles)).map((row) => row.tenantId).filter((id): id is number => id !== null)))
      : ownerMemberships.map((membership) => membership.tenantId);

    if (tenantIds.length === 0) return { canManageAssignments: false, employees: [], managers: [] };

    const [employees, managers] = await Promise.all([
      db
        .select({
          profile: earlyCareerProfiles,
          employee: { id: users.id, name: users.name, email: users.email },
        })
        .from(earlyCareerProfiles)
        .innerJoin(users, eq(earlyCareerProfiles.userId, users.id))
        .where(inArray(earlyCareerProfiles.tenantId, tenantIds))
        .orderBy(desc(earlyCareerProfiles.updatedAt)),
      db
        .select({
          tenantId: tenantUsers.tenantId,
          user: { id: users.id, name: users.name, email: users.email },
        })
        .from(tenantUsers)
        .innerJoin(users, eq(tenantUsers.userId, users.id))
        .where(inArray(tenantUsers.tenantId, tenantIds)),
    ]);

    return { canManageAssignments: true, employees, managers };
  }),

  createManagerNudge: protectedProcedure
    .input(z.object({ employeeUserId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [profile] = await db
        .select()
        .from(earlyCareerProfiles)
        .where(and(eq(earlyCareerProfiles.userId, input.employeeUserId), eq(earlyCareerProfiles.managerUserId, ctx.user.id)))
        .limit(1);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "You are not assigned as this employee's manager." });
      const nudge = getEarlyCareerManagerNudge(stageIdFrom(profile.journeyStage));
      const [created] = await db
        .insert(earlyCareerManagerNudges)
        .values({
          managerUserId: ctx.user.id,
          employeeUserId: input.employeeUserId,
          tenantId: profile.tenantId,
          nudgeCode: nudge.code,
          title: nudge.title,
          rationale: nudge.rationale,
          conversationObjective: nudge.objective,
          suggestedQuestions: nudge.questions,
          privacyBoundary: nudge.privacyBoundary,
        })
        .$returningId();
      return { id: created.id, ...nudge };
    }),

  assignManager: protectedProcedure
    .input(z.object({ employeeUserId: z.number().int().positive(), managerUserId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [employeeProfile] = await db
        .select()
        .from(earlyCareerProfiles)
        .where(eq(earlyCareerProfiles.userId, input.employeeUserId))
        .limit(1);
      if (!employeeProfile?.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The employee must have an Early Career profile and tenant membership before manager assignment." });
      }

      if (ctx.user.role !== "admin") {
        const [requesterMembership] = await db
          .select()
          .from(tenantUsers)
          .where(and(eq(tenantUsers.userId, ctx.user.id), eq(tenantUsers.tenantId, employeeProfile.tenantId)))
          .limit(1);
        if (!requesterMembership || requesterMembership.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only an organisation owner can assign a manager." });
        }
      }

      const [managerMembership] = await db
        .select()
        .from(tenantUsers)
        .where(and(eq(tenantUsers.userId, input.managerUserId), eq(tenantUsers.tenantId, employeeProfile.tenantId)))
        .limit(1);
      if (!managerMembership) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The selected manager must belong to the same organisation." });
      }

      await db
        .update(earlyCareerProfiles)
        .set({ managerUserId: input.managerUserId })
        .where(eq(earlyCareerProfiles.id, employeeProfile.id));
      return { success: true };
    }),

  updateManagerNudgeStatus: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["accepted", "dismissed", "completed"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [nudge] = await db
        .select()
        .from(earlyCareerManagerNudges)
        .where(and(eq(earlyCareerManagerNudges.id, input.id), eq(earlyCareerManagerNudges.managerUserId, ctx.user.id)))
        .limit(1);
      if (!nudge) throw new TRPCError({ code: "NOT_FOUND", message: "Manager nudge not found" });
      await db
        .update(earlyCareerManagerNudges)
        .set({ status: input.status, completedAt: input.status === "completed" ? new Date() : null })
        .where(eq(earlyCareerManagerNudges.id, nudge.id));
      return { success: true };
    }),
});
