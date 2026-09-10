/**
 * LevelNext Behavioural Intelligence Engine™ — tRPC Router
 *
 * Exposes participant-owned Behavioural Intelligence procedures:
 * - Create & list Moments That Matter
 * - Analyse moments with structured UODL ontological reasoning & safe fallback
 * - Select Moves, link Practice/Rehearsal, commit Actions
 * - Record real-world Evidence & Reflections
 * - Summarise emergent behavioural Capacity
 * - Application adapters for Manager Effectiveness (MEP) and Leader Intelligence (LDI)
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createMomentService,
  analyseMomentService,
  getMomentWithLineageService,
  listMomentsService,
  selectMoveService,
  createPracticeLinkService,
  recordPracticeResultService,
  createActionService,
  updateActionStatusService,
  recordEvidenceService,
  recordReflectionService,
  getCapacitySummaryService,
} from "../behaviouralIntelligence";
import {
  createBehaviouralMomentSchema,
  updateActionStatusSchema,
  recordEvidenceSchema,
  recordReflectionSchema,
} from "../../shared/modules/behaviouralIntelligence";
import { buildMepBehaviouralMomentInput } from "../adapters/mepBehaviouralAdapter";
import { buildLdiBehaviouralMomentInput } from "../adapters/ldiBehaviouralAdapter";
import { getBehaviouralSponsorHeatmap } from "../behaviouralSponsorAnalytics";

export const behaviouralIntelligenceRouter = router({
  // ── Moments ─────────────────────────────────────────────────────────────────
  createMoment: protectedProcedure
    .input(createBehaviouralMomentSchema)
    .mutation(async ({ ctx, input }) => {
      return createMomentService({
        input,
        userId: ctx.user.id,
      });
    }),

  analyseMoment: protectedProcedure
    .input(
      z.object({
        momentId: z.number().int().positive(),
        forceFallback: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return analyseMomentService({
        momentId: input.momentId,
        userId: ctx.user.id,
        forceFallback: input.forceFallback,
      });
    }),

  getMomentWithLineage: protectedProcedure
    .input(z.object({ momentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return getMomentWithLineageService(input.momentId, ctx.user.id);
    }),

  listMoments: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).optional().default(30),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return listMomentsService(ctx.user.id, input?.limit ?? 30);
    }),

  // ── Moves & Practice ────────────────────────────────────────────────────────
  selectMove: protectedProcedure
    .input(
      z.object({
        moveId: z.number().int().positive(),
        momentId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return selectMoveService({
        moveId: input.moveId,
        momentId: input.momentId,
        userId: ctx.user.id,
      });
    }),

  createPracticeLink: protectedProcedure
    .input(
      z.object({
        moveId: z.number().int().positive(),
        momentId: z.number().int().positive(),
        providerType: z.string().trim().min(2).max(60),
        providerSessionId: z.number().int().positive().optional(),
        scenarioContext: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createPracticeLinkService({
        moveId: input.moveId,
        momentId: input.momentId,
        userId: ctx.user.id,
        providerType: input.providerType,
        providerSessionId: input.providerSessionId,
        scenarioContext: input.scenarioContext,
      });
    }),

  recordPracticeResult: protectedProcedure
    .input(
      z.object({
        practiceLinkId: z.number().int().positive(),
        feedbackScores: z.record(z.string(), z.unknown()).optional(),
        practiceStatus: z.enum(["completed", "abandoned"]),
        phraseTelemetry: z.array(z.object({
          phraseKey: z.string().trim().min(1).max(40),
          matched: z.boolean(),
          matchCount: z.number().int().min(0).max(50),
        })).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return recordPracticeResultService({
        practiceLinkId: input.practiceLinkId,
        userId: ctx.user.id,
        feedbackScores: {
          ...(input.feedbackScores ?? {}),
          ...(input.phraseTelemetry ? { phraseTelemetry: input.phraseTelemetry } : {}),
        },
        practiceStatus: input.practiceStatus,
      });
    }),

  // ── Actions ─────────────────────────────────────────────────────────────────
  createAction: protectedProcedure
    .input(
      z.object({
        moveId: z.number().int().positive(),
        momentId: z.number().int().positive(),
        actionDescription: z.string().trim().min(5).max(2000),
        personOrGroup: z.string().trim().max(255).optional(),
        dueAt: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createActionService({
        moveId: input.moveId,
        momentId: input.momentId,
        userId: ctx.user.id,
        actionDescription: input.actionDescription,
        personOrGroup: input.personOrGroup,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
      });
    }),

  updateActionStatus: protectedProcedure
    .input(updateActionStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return updateActionStatusService({
        actionId: input.actionId,
        userId: ctx.user.id,
        status: input.status,
        completionNotes: input.completionNotes,
      });
    }),

  // ── Evidence & Reflection ───────────────────────────────────────────────────
  recordEvidence: protectedProcedure
    .input(recordEvidenceSchema)
    .mutation(async ({ ctx, input }) => {
      return recordEvidenceService({
        momentId: input.momentId,
        moveId: input.moveId,
        actionId: input.actionId,
        userId: ctx.user.id,
        sourceType: input.sourceType,
        situation: input.situation,
        actionTaken: input.actionTaken,
        outcome: input.outcome,
        learning: input.learning,
        evidenceLevel: input.evidenceLevel,
      });
    }),

  recordReflection: protectedProcedure
    .input(recordReflectionSchema)
    .mutation(async ({ ctx, input }) => {
      return recordReflectionService({
        evidenceId: input.evidenceId,
        momentId: input.momentId,
        userId: ctx.user.id,
        reflectionText: input.reflectionText,
        capacitySignal: input.capacitySignal,
        oldPatternShift: input.oldPatternShift,
        newPossibility: input.newPossibility,
      });
    }),

  // ── Capacity Summary ────────────────────────────────────────────────────────
  getCapacitySummary: protectedProcedure.query(async ({ ctx }) => {
    return getCapacitySummaryService(ctx.user.id);
  }),

  /**
   * Organisation-owner/admin view. The service returns cohort-level values
   * only and suppresses all dimensions below the five-participant threshold.
   */
  getSponsorHeatmap: protectedProcedure.query(async ({ ctx }) => {
    return getBehaviouralSponsorHeatmap({ id: ctx.user.id, role: ctx.user.role });
  }),

  // ── Application Adapters ────────────────────────────────────────────────────
  createFromMep: protectedProcedure
    .input(
      z.object({
        diagnosticCode: z.string().trim().min(2).max(40),
        dimensionId: z.string().trim().min(2).max(100),
        dimensionLabel: z.string().trim().min(2).max(100),
        score: z.number().optional(),
        reportId: z.number().int().positive().optional(),
        customSituation: z.string().trim().max(3000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const momentInput = buildMepBehaviouralMomentInput(
        {
          diagnosticCode: input.diagnosticCode,
          dimensionId: input.dimensionId,
          dimensionLabel: input.dimensionLabel,
          score: input.score,
          reportId: input.reportId,
        },
        input.customSituation
      );

      return createMomentService({
        input: momentInput,
        userId: ctx.user.id,
      });
    }),

  createFromLdi: protectedProcedure
    .input(
      z.object({
        dimensionId: z.string().trim().min(2).max(100),
        dimensionName: z.string().trim().min(2).max(100),
        score: z.number().optional(),
        riskBand: z.string().optional(),
        archetypeLabel: z.string().optional(),
        reportId: z.number().int().positive().optional(),
        customSituation: z.string().trim().max(3000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const momentInput = buildLdiBehaviouralMomentInput(
        {
          dimensionId: input.dimensionId,
          dimensionName: input.dimensionName,
          score: input.score,
          riskBand: input.riskBand,
          archetypeLabel: input.archetypeLabel,
          reportId: input.reportId,
        },
        input.customSituation
      );

      return createMomentService({
        input: momentInput,
        userId: ctx.user.id,
      });
    }),
});
