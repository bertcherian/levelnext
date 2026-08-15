import { TRPCError } from "@trpc/server";
import { and, desc, eq, lte } from "drizzle-orm";
import { z } from "zod";
import { salesClaims, salesCommitments, salesSituations } from "../../drizzle/schema";
import type { SalesJudgment } from "../../drizzle/schema";
import { analyzeCommercialSituation } from "../salesIntelligence";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const situationInput = z.object({
  title: z.string().trim().min(4).max(255), accountName: z.string().trim().max(255).optional(),
  situation: z.string().trim().min(20).max(6000), desiredOutcome: z.string().trim().max(1800).optional(),
});

export const salesIntelligenceRouter = router({
  getDesk: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [situations, commitments] = await Promise.all([
      db.select().from(salesSituations).where(eq(salesSituations.userId, ctx.user.id)).orderBy(desc(salesSituations.updatedAt)).limit(8),
      db.select().from(salesCommitments).where(and(eq(salesCommitments.userId, ctx.user.id), eq(salesCommitments.status, "pending"), lte(salesCommitments.dueDate, dueAt))).orderBy(salesCommitments.dueDate).limit(6),
    ]);
    return { situations, commitments };
  }),

  getSituation: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [situation] = await db.select().from(salesSituations).where(and(eq(salesSituations.id, input.id), eq(salesSituations.userId, ctx.user.id))).limit(1);
    if (!situation) throw new TRPCError({ code: "NOT_FOUND" });
    const [claims, commitments] = await Promise.all([
      db.select().from(salesClaims).where(and(eq(salesClaims.situationId, input.id), eq(salesClaims.userId, ctx.user.id))).orderBy(desc(salesClaims.createdAt)),
      db.select().from(salesCommitments).where(and(eq(salesCommitments.situationId, input.id), eq(salesCommitments.userId, ctx.user.id))).orderBy(desc(salesCommitments.createdAt)),
    ]);
    return { situation, claims, commitments };
  }),

  analyzeSituation: protectedProcedure.input(situationInput).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const judgment = await analyzeCommercialSituation({ situation: input.situation, desiredOutcome: input.desiredOutcome, accountName: input.accountName });
    const [saved] = await db.insert(salesSituations).values({ userId: ctx.user.id, title: input.title, accountName: input.accountName, rawSituation: input.situation, desiredOutcome: input.desiredOutcome, judgment: judgment as SalesJudgment }).$returningId();
    const situationId = Number(saved.id);
    const claims = [
      ...judgment.whatWeKnow.map((statement) => ({ category: "fact" as const, statement, confidence: judgment.confidence, source: "seller narrative" })),
      ...judgment.constraintEvidence.map((statement) => ({ category: "evidence" as const, statement, confidence: judgment.confidence, source: "seller narrative" })),
      ...judgment.whatWeAreAssuming.map((statement) => ({ category: "assumption" as const, statement, confidence: "low" as const, source: "seller narrative" })),
    ];
    if (claims.length) await db.insert(salesClaims).values(claims.slice(0, 12).map((claim) => ({ ...claim, situationId, userId: ctx.user.id })));
    return { id: situationId, judgment };
  }),

  createCommitment: protectedProcedure.input(z.object({ situationId: z.number().int().positive(), action: z.string().trim().min(5).max(2000), stakeholder: z.string().trim().max(255).optional(), intendedBehaviour: z.string().trim().max(1400).optional(), dueDate: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [situation] = await db.select({ id: salesSituations.id }).from(salesSituations).where(and(eq(salesSituations.id, input.situationId), eq(salesSituations.userId, ctx.user.id))).limit(1);
    if (!situation) throw new TRPCError({ code: "NOT_FOUND" });
    const [saved] = await db.insert(salesCommitments).values({ ...input, userId: ctx.user.id }).$returningId();
    await db.update(salesSituations).set({ status: "committed" }).where(and(eq(salesSituations.id, input.situationId), eq(salesSituations.userId, ctx.user.id)));
    return { id: Number(saved.id) };
  }),

  reflectCommitment: protectedProcedure.input(z.object({ commitmentId: z.number().int().positive(), status: z.enum(["completed", "not_done"]), outcome: z.string().trim().min(8).max(4000), reflection: z.string().trim().min(8).max(4000) })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [commitment] = await db.select().from(salesCommitments).where(and(eq(salesCommitments.id, input.commitmentId), eq(salesCommitments.userId, ctx.user.id))).limit(1);
    if (!commitment) throw new TRPCError({ code: "NOT_FOUND" });
    await db.update(salesCommitments).set({ status: input.status, outcome: input.outcome, reflection: input.reflection }).where(and(eq(salesCommitments.id, input.commitmentId), eq(salesCommitments.userId, ctx.user.id)));
    await db.update(salesSituations).set({ status: "reflected" }).where(and(eq(salesSituations.id, commitment.situationId), eq(salesSituations.userId, ctx.user.id)));
    return { success: true };
  }),
});
