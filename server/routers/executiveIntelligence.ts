import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNotNull, lte } from "drizzle-orm";
import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { executiveDecisionJournal, executiveDecisionReviewReminderSettings, executiveMandates, executiveProfiles } from "../../drizzle/schema";
import { COOKIE_NAME } from "../../shared/const";
import {
  EXECUTIVE_MANDATE_AREAS,
  EXECUTIVE_ROLE_TYPES,
  EXECUTIVE_TRANSITION_MODES,
  type ExecutiveContext,
  type ExecutivePriority,
} from "../../shared/modules/executiveIntelligence";
import { analyseExecutiveSituation } from "../executiveIntelligence";
import { getDb } from "../db";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import { protectedProcedure, router } from "../_core/trpc";

const contextSchema = z.object({
  roleTitle: z.string().trim().max(180).optional(),
  roleType: z.enum(EXECUTIVE_ROLE_TYPES).optional(),
  businessName: z.string().trim().max(180).optional(),
  businessDescription: z.string().trim().max(2400).optional(),
  geography: z.string().trim().max(160).optional(),
  scopeDescription: z.string().trim().max(2400).optional(),
  mandateStatement: z.string().trim().max(2400).optional(),
  transitionMode: z.enum(EXECUTIVE_TRANSITION_MODES).optional(),
  runAttention: z.number().int().min(0).max(100).optional(),
  transformAttention: z.number().int().min(0).max(100).optional(),
  buildAttention: z.number().int().min(0).max(100).optional(),
  stakeholderSummary: z.string().trim().max(2400).optional(),
});

const prioritySchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().min(3).max(240),
  area: z.enum(EXECUTIVE_MANDATE_AREAS),
  outcome: z.string().trim().max(600).optional(),
  progress: z.enum(["not_started", "active", "on_track", "attention"]),
});

const decisionReviewReminderSchema = z.object({
  enabled: z.boolean(),
  localDayOfWeek: z.number().int().min(0).max(6).default(1),
  localHour: z.number().int().min(0).max(23).default(9),
  timeZone: z.string().trim().min(1).max(80).refine((value) => {
    try { new Intl.DateTimeFormat("en-US", { timeZone: value }); return true; } catch { return false; }
  }, "Choose a valid time zone."),
});

const decisionOutcomeSchema = z.object({
  decisionId: z.number().int().positive(),
  reviewStatus: z.enum(["working", "mixed", "not_working"]),
  actualOutcome: z.string().trim().min(8).max(4000),
  learning: z.string().trim().min(8).max(4000),
  nextTimeChange: z.string().trim().max(4000).optional(),
});

export const executiveIntelligenceRouter = router({
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const reviewCutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [[profile], [mandate], decisions, reviewableDecisions] = await Promise.all([
      db.select().from(executiveProfiles).where(eq(executiveProfiles.userId, ctx.user.id)).limit(1),
      db.select().from(executiveMandates).where(eq(executiveMandates.userId, ctx.user.id)).limit(1),
      db.select().from(executiveDecisionJournal).where(eq(executiveDecisionJournal.userId, ctx.user.id)).orderBy(desc(executiveDecisionJournal.createdAt)).limit(5),
      db.select().from(executiveDecisionJournal).where(and(eq(executiveDecisionJournal.userId, ctx.user.id), eq(executiveDecisionJournal.reviewStatus, "pending"), isNotNull(executiveDecisionJournal.reviewDate), lte(executiveDecisionJournal.reviewDate, reviewCutoff))).orderBy(executiveDecisionJournal.reviewDate).limit(3),
    ]);
    return { profile: profile ?? null, mandate: mandate ?? null, decisions, reviewableDecisions };
  }),

  getDecisionReviewReminder: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [setting] = await db.select().from(executiveDecisionReviewReminderSettings).where(eq(executiveDecisionReviewReminderSettings.userId, ctx.user.id)).limit(1);
    return setting ?? { enabled: false, localDayOfWeek: 1, localHour: 9, timeZone: "UTC", scheduleCronTaskUid: null };
  }),

  saveDecisionReviewReminder: protectedProcedure.input(decisionReviewReminderSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [existing] = await db.select().from(executiveDecisionReviewReminderSettings).where(eq(executiveDecisionReviewReminderSettings.userId, ctx.user.id)).limit(1);
    const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
    let taskUid = existing?.scheduleCronTaskUid ?? null;
    if (existing) await db.update(executiveDecisionReviewReminderSettings).set(input).where(eq(executiveDecisionReviewReminderSettings.id, existing.id));
    else await db.insert(executiveDecisionReviewReminderSettings).values({ userId: ctx.user.id, ...input });
    const cron = "0 0 * * * *";
    const description = "Private weekly Executive decision-review reminder";
    if (taskUid) await updateHeartbeatJob(taskUid, { cron, path: "/api/scheduled/executiveDecisionReviewReminder", method: "POST", description, enable: input.enabled }, sessionToken);
    else {
      const job = await createHeartbeatJob({ name: `executive-decision-review-${ctx.user.id}`, cron, path: "/api/scheduled/executiveDecisionReviewReminder", method: "POST", description }, sessionToken);
      taskUid = job.taskUid;
      if (!input.enabled) await updateHeartbeatJob(taskUid, { enable: false }, sessionToken);
      await db.update(executiveDecisionReviewReminderSettings).set({ scheduleCronTaskUid: taskUid }).where(eq(executiveDecisionReviewReminderSettings.userId, ctx.user.id));
    }
    return { ...input, scheduleCronTaskUid: taskUid };
  }),

  saveContext: protectedProcedure.input(contextSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const values = { userId: ctx.user.id, ...input };
    await db.insert(executiveProfiles).values(values).onDuplicateKeyUpdate({ set: input });
    return { success: true };
  }),

  saveMandate: protectedProcedure.input(z.object({ priorities: z.array(prioritySchema).min(3).max(5) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(executiveMandates).values({ userId: ctx.user.id, priorities: input.priorities as ExecutivePriority[] }).onDuplicateKeyUpdate({ set: { priorities: input.priorities as ExecutivePriority[] } });
    return { success: true };
  }),

  thinkWithMe: protectedProcedure.input(z.object({ situation: z.string().trim().min(12).max(5000), desiredOutcome: z.string().trim().max(1400).optional(), stakes: z.string().trim().max(1400).optional(), mode: z.enum(["prepare", "think", "challenge", "debrief"]).default("think") })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [[profile], [mandate]] = await Promise.all([
      db.select().from(executiveProfiles).where(eq(executiveProfiles.userId, ctx.user.id)).limit(1),
      db.select().from(executiveMandates).where(eq(executiveMandates.userId, ctx.user.id)).limit(1),
    ]);
    const executiveContext: ExecutiveContext | undefined = profile ? {
      roleTitle: profile.roleTitle ?? undefined, roleType: profile.roleType as ExecutiveContext["roleType"], businessName: profile.businessName ?? undefined,
      businessDescription: profile.businessDescription ?? undefined, geography: profile.geography ?? undefined, scopeDescription: profile.scopeDescription ?? undefined,
      mandateStatement: profile.mandateStatement ?? undefined, transitionMode: profile.transitionMode as ExecutiveContext["transitionMode"], runAttention: profile.runAttention,
      transformAttention: profile.transformAttention, buildAttention: profile.buildAttention, stakeholderSummary: profile.stakeholderSummary ?? undefined,
    } : undefined;
    const analysis = await analyseExecutiveSituation({ situation: input.situation, desiredOutcome: input.desiredOutcome, stakes: input.stakes, mode: input.mode, context: executiveContext, priorities: mandate?.priorities ?? [] });
    return { analysis };
  }),

  exportDecisionJournal: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(executiveDecisionJournal)
      .where(eq(executiveDecisionJournal.userId, ctx.user.id))
      .orderBy(desc(executiveDecisionJournal.createdAt));
  }),

  createDecision: protectedProcedure.input(z.object({
    decision: z.string().trim().min(5).max(2000), context: z.string().trim().min(8).max(4000), assumptions: z.array(z.string().trim().min(1).max(400)).max(8).optional(),
    options: z.array(z.string().trim().min(1).max(500)).max(8).optional(), tradeOffs: z.string().trim().max(1800).optional(), stakeholders: z.string().trim().max(1800).optional(),
    expectedOutcome: z.string().trim().max(1800).optional(), confidence: z.number().int().min(1).max(10).optional(), reviewDate: z.coerce.date().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const analysis = await analyseExecutiveSituation({ situation: input.context, desiredOutcome: input.expectedOutcome, stakes: input.tradeOffs });
    const [saved] = await db.insert(executiveDecisionJournal).values({ ...input, userId: ctx.user.id, analysis });
    return { id: Number(saved.insertId), analysis };
  }),

  saveDecisionOutcome: protectedProcedure.input(decisionOutcomeSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [decision] = await db.select({ id: executiveDecisionJournal.id }).from(executiveDecisionJournal).where(and(
      eq(executiveDecisionJournal.id, input.decisionId),
      eq(executiveDecisionJournal.userId, ctx.user.id),
    )).limit(1);
    if (!decision) throw new TRPCError({ code: "NOT_FOUND", message: "Decision record not found." });
    await db.update(executiveDecisionJournal).set({
      reviewStatus: input.reviewStatus,
      actualOutcome: input.actualOutcome,
      learning: input.learning,
      nextTimeChange: input.nextTimeChange || null,
      reviewedAt: new Date(),
    }).where(and(eq(executiveDecisionJournal.id, input.decisionId), eq(executiveDecisionJournal.userId, ctx.user.id)));
    return { success: true };
  }),
});
