import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { assessmentSessions, reports, users } from "../../drizzle/schema";
import { nanoid } from "nanoid";
import { updateLeadershipGraph } from "./leadershipGraph";

// Import all three module data sets
import {
  ECI_QUESTIONS, ECI_PILLARS,
  computeEciScore, computeAllPillarScores, computeAllDimensionScores,
  getEciZone, assignEciArchetype,
} from "../../shared/modules/eciData";
import {
  LII_QUESTIONS, LII_DIMENSIONS, LII_ARCHETYPES,
  getScoreBand,
} from "../../shared/modules/liiData";
import {
  GCC_MODULES, GCC_MODULE_MAP, computeModuleScore, computeGccReadinessScore,
  getReadinessZone, assignArchetype as assignGccArchetype,
} from "../../shared/modules/gccData";

// ─── Scoring helpers ──────────────────────────────────────────────────────────
function scoreLii(responses: Record<string, number>) {
  const dimensionScores: Record<string, number> = {};
  for (const dim of LII_DIMENSIONS) {
    const dimQuestions = LII_QUESTIONS.filter((q) => q.dimensionId === dim.id);
    if (dimQuestions.length === 0) continue;
    const total = dimQuestions.reduce((sum, q) => sum + (responses[String(q.id)] ?? 3), 0);
    dimensionScores[dim.id] = total / dimQuestions.length;
  }
  const overall = Object.values(dimensionScores).reduce((a, b) => a + b, 0) / Object.keys(dimensionScores).length;
  // Normalise 1–5 scale to 0–100
  const edgeScore = Math.round(((overall - 1) / 4) * 100);
  const band = getScoreBand(overall); // band uses 1-5 scale
  const bandLabel = { excellent: "Exceptional", good: "Strong", developing: "Developing", atRisk: "At Risk" }[band];

  // Assign archetype based on top-scoring dimensions
  const sortedDims = Object.entries(dimensionScores)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id);
  const topTwo = sortedDims.slice(0, 2);

  // Find archetype whose topDimensions best match the leader's top dimensions
  let bestArchetype = LII_ARCHETYPES[0];
  let bestMatch = -1;
  for (const arch of LII_ARCHETYPES) {
    const a = arch as any;
    if (!a.topDimensions?.length) continue;
    const matchCount = a.topDimensions.filter((d: string) => topTwo.includes(d)).length;
    if (matchCount > bestMatch) {
      bestMatch = matchCount;
      bestArchetype = arch;
    }
  }
  // Fallback: use score-based assignment if no dimension match
  if (bestMatch === 0) {
    if (edgeScore >= 75) bestArchetype = LII_ARCHETYPES[0]; // strategic_influencer
    else if (edgeScore >= 60) bestArchetype = LII_ARCHETYPES[2]; // organizational_navigator
    else if (edgeScore >= 45) bestArchetype = LII_ARCHETYPES[4]; // quiet_expert
    else bestArchetype = LII_ARCHETYPES[5]; // emerging_influencer
  }

  const arch = bestArchetype as any;
  return {
    edgeScore,
    dimensionScores,
    zone: band,
    zoneLabel: bandLabel,
    zoneDescription: `Your leadership influence is in the ${bandLabel} zone.`,
    archetype: arch.id,
    archetypeLabel: arch.name,
    archetypeTagline: arch.tagline,
    archetypeDescription: arch.description,
    archetypeStrengths: arch.topDimensions?.map((d: string) =>
      LII_DIMENSIONS.find((dim: any) => dim.id === d)?.name ?? d
    ) ?? [],
    archetypeRisks: [],
  };
}

function scoreGcc(responses: Record<string, number>) {
  const moduleScores: Record<string, number> = {};
  for (const mod of GCC_MODULES) {
    moduleScores[mod.id] = computeModuleScore(mod.id, responses);
  }
  const overall = computeGccReadinessScore(moduleScores);
  const zone = getReadinessZone(overall);
  const archetype = assignGccArchetype(moduleScores, overall);
  return { edgeScore: Math.round(overall), dimensionScores: moduleScores, zone: zone.id, archetype: archetype.id };
}

function scoreEci(responses: Record<string, number>) {
  const pillarScores = computeAllPillarScores(responses);
  const dimensionScores = computeAllDimensionScores(responses);
  const overall = computeEciScore(pillarScores);
  const zone = getEciZone(overall);
  const archetype = assignEciArchetype(pillarScores, overall);
  return {
    edgeScore: Math.round(overall),
    dimensionScores: { ...pillarScores, ...dimensionScores },
    zone: zone.id,
    zoneLabel: zone.label,
    zoneDescription: zone.description,
    zoneImplication: zone.implication,
    archetype: archetype.id,
    archetypeLabel: archetype.label,
    archetypeDescription: archetype.description,
    archetypeStrengths: archetype.strengths,
    archetypeRisks: archetype.risks,
  };
}

export const assessmentRouter = router({
  // Get questions for a module
  getQuestions: publicProcedure
    .input(z.object({ moduleType: z.enum(["ECI", "LII", "GCC"]) }))
    .query(({ input }) => {
      if (input.moduleType === "ECI") {
        return {
          questions: ECI_QUESTIONS.map((q) => ({ id: String(q.id), text: q.text, dimensionId: q.dimensionId, pillarId: q.pillarId })),
          pillars: ECI_PILLARS.map((p) => ({ id: p.id, label: p.label, description: p.description, color: p.color })),
          totalQuestions: ECI_QUESTIONS.length,
        };
      }
      if (input.moduleType === "LII") {
        return {
          questions: LII_QUESTIONS.map((q) => ({ id: String(q.id), text: q.text, dimensionId: q.dimensionId })),
          pillars: LII_DIMENSIONS.map((d) => ({ id: d.id, label: d.name, description: d.definition ?? "", color: "#12345A" })),
          totalQuestions: LII_QUESTIONS.length,
        };
      }
      // GCC
      const allQuestions = GCC_MODULES.flatMap((m) =>
        m.questions.map((q) => ({ id: String(q.id), text: q.text, dimensionId: m.id, pillarId: m.id }))
      );
      return {
          questions: allQuestions,
          pillars: GCC_MODULES.map((m) => ({ id: m.id, label: m.name, description: (m as any).description ?? m.coreQuestion ?? "", color: "#12345A" })),
        totalQuestions: allQuestions.length,
      };
    }),

  // Start or resume an assessment session
  startSession: protectedProcedure
    .input(z.object({ moduleType: z.enum(["ECI", "LII", "GCC"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check for existing in-progress session
      const existing = await db
        .select()
        .from(assessmentSessions)
        .where(
          and(
            eq(assessmentSessions.userId, ctx.user.id),
            eq(assessmentSessions.moduleType, input.moduleType),
            eq(assessmentSessions.status, "in_progress")
          )
        )
        .limit(1);

      if (existing[0]) {
        return { sessionId: existing[0].id, resumed: true, responses: existing[0].responses ?? {} };
      }

      const [session] = await db
        .insert(assessmentSessions)
        .values({ userId: ctx.user.id, moduleType: input.moduleType, responses: {} })
        .$returningId();

      return { sessionId: session.id, resumed: false, responses: {} };
    }),

  // Save progress (auto-save)
  saveProgress: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        responses: z.record(z.string(), z.number()),
        currentQuestionIndex: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(assessmentSessions)
        .set({ responses: input.responses, currentQuestionIndex: input.currentQuestionIndex })
        .where(and(eq(assessmentSessions.id, input.sessionId), eq(assessmentSessions.userId, ctx.user.id)));
      return { saved: true };
    }),

  // Submit completed assessment and generate report
  submit: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        moduleType: z.enum(["ECI", "LII", "GCC"]),
        responses: z.record(z.string(), z.number()),
        participantName: z.string(),
        participantEmail: z.string().email(),
        participantRole: z.string().optional(),
        organisation: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Score the responses
      let scored: { edgeScore: number; dimensionScores: Record<string, number>; zone: string; archetype: string };
      if (input.moduleType === "ECI") scored = scoreEci(input.responses);
      else if (input.moduleType === "LII") scored = scoreLii(input.responses);
      else scored = scoreGcc(input.responses);

      const slug = nanoid(16);

      // Create the report
      const [report] = await db
        .insert(reports)
        .values({
          sessionId: input.sessionId,
          userId: ctx.user.id,
          moduleType: input.moduleType,
          slug,
          participantName: input.participantName,
          participantEmail: input.participantEmail,
          participantRole: input.participantRole,
          organisation: input.organisation,
          edgeScore: scored.edgeScore,
          zone: scored.zone,
          archetype: scored.archetype,
          dimensionScores: scored.dimensionScores,
          responses: input.responses,
        })
        .$returningId();

      // Mark session as completed
      await db
        .update(assessmentSessions)
        .set({ status: "completed", completedAt: new Date(), responses: input.responses })
        .where(eq(assessmentSessions.id, input.sessionId));

      // Update the Leadership Graph
      await updateLeadershipGraph(ctx.user.id, input.moduleType, scored);

      return {
        reportId: report.id,
        slug,
        edgeScore: scored.edgeScore,
        archetype: scored.archetype,
        archetypeLabel: (scored as any).archetypeLabel,
        archetypeTagline: (scored as any).archetypeTagline,
        archetypeDescription: (scored as any).archetypeDescription,
        archetypeStrengths: (scored as any).archetypeStrengths,
        archetypeRisks: (scored as any).archetypeRisks,
        zone: scored.zone,
        zoneLabel: (scored as any).zoneLabel,
        zoneDescription: (scored as any).zoneDescription,
        zoneImplication: (scored as any).zoneImplication,
        dimensionScores: scored.dimensionScores,
      };
    }),

  // Get user's assessment history
  myHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(reports)
      .where(eq(reports.userId, ctx.user.id))
      .orderBy(desc(reports.createdAt));
  }),

  // Get a specific report by slug
  getReport: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(reports).where(eq(reports.slug, input.slug)).limit(1);
      return result[0] ?? null;
    }),
});
