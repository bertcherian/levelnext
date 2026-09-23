import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { v3SituationDecisions, v3SituationIntakes } from "../../drizzle/schema";
import { routeSituation, V3_INTENT_MODES } from "../../shared/modules/v3SituationRouting";

const intentSchema = z.enum(V3_INTENT_MODES);
const situationInput = z.object({
  situation: z.string().trim().min(12, "Tell us a little more about the moment you need to handle.").max(1200),
  intent: intentSchema,
});

export const v3SituationRouter = router({
  capture: protectedProcedure
    .input(situationInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const decision = routeSituation(input);
      const [intake] = await db.insert(v3SituationIntakes).values({
        userId: ctx.user.id,
        situation: input.situation,
        intent: input.intent,
        situationKey: decision.situationKey,
        situationLabel: decision.situationLabel,
      }).$returningId();

      if (!intake?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Situation could not be saved" });

      const traceId = randomUUID();
      const [savedDecision] = await db.insert(v3SituationDecisions).values({
        situationId: intake.id,
        userId: ctx.user.id,
        route: decision.route,
        confidence: decision.confidence,
        alternatives: decision.alternatives,
        evidence: decision.evidence,
        decisionMethod: decision.decisionMethod,
        modelVersion: decision.modelVersion,
        escalation: decision.escalation,
        clarificationPrompt: decision.clarificationPrompt,
        rationale: decision.rationale,
        traceId,
      }).$returningId();

      if (!savedDecision?.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Decision could not be recorded" });

      return {
        id: intake.id,
        decisionId: savedDecision.id,
        traceId,
        situation: input.situation,
        intent: input.intent,
        ...decision,
      };
    }),

  listRecent: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const intakes = await db
      .select()
      .from(v3SituationIntakes)
      .where(and(eq(v3SituationIntakes.userId, ctx.user.id), eq(v3SituationIntakes.status, "active")))
      .orderBy(desc(v3SituationIntakes.createdAt))
      .limit(6);

    return Promise.all(intakes.map(async (intake) => {
      const [decision] = await db
        .select()
        .from(v3SituationDecisions)
        .where(and(eq(v3SituationDecisions.situationId, intake.id), eq(v3SituationDecisions.userId, ctx.user.id)))
        .orderBy(desc(v3SituationDecisions.createdAt))
        .limit(1);
      return { intake, decision: decision ?? null };
    }));
  }),
});
