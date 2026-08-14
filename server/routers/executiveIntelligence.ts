import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { executiveDecisionJournal, executiveMandates, executiveProfiles } from "../../drizzle/schema";
import {
  EXECUTIVE_MANDATE_AREAS,
  EXECUTIVE_ROLE_TYPES,
  EXECUTIVE_TRANSITION_MODES,
  type ExecutiveContext,
  type ExecutivePriority,
} from "../../shared/modules/executiveIntelligence";
import { analyseExecutiveSituation } from "../executiveIntelligence";
import { getDb } from "../db";
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

export const executiveIntelligenceRouter = router({
  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [[profile], [mandate], decisions] = await Promise.all([
      db.select().from(executiveProfiles).where(eq(executiveProfiles.userId, ctx.user.id)).limit(1),
      db.select().from(executiveMandates).where(eq(executiveMandates.userId, ctx.user.id)).limit(1),
      db.select().from(executiveDecisionJournal).where(eq(executiveDecisionJournal.userId, ctx.user.id)).orderBy(desc(executiveDecisionJournal.createdAt)).limit(5),
    ]);
    return { profile: profile ?? null, mandate: mandate ?? null, decisions };
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
});
