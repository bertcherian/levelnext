/**
 * LevelNext Effectiveness Intelligence — tRPC Router
 *
 * Procedures:
 *   - getDashboard: returns latest Work Genome scan, capacity snapshot, 3 contracts, NBLA, evidence history
 *   - submitWorkScan: creates Work Scan, extracts activities, calculates capacity allocation, gap, and Opportunity Scan
 *   - createContract: creates/selects a Behavior Change Contract
 *   - updateContractStatus: transitions contract through selected → practising → active_in_work → verified_shift
 *   - recordEvidence: logs real-world evidence against a contract on the 7-level ladder
 *   - respondToNbla: mark NBLA as accepted / completed / dismissed
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  createWorkScanService,
  createBehaviorContractService,
  recordEvidenceClaimService,
  getEffectivenessDashboardService,
} from "../effectivenessIntelligence";
import {
  createWorkScanInputSchema,
  behaviorContractInputSchema,
  recordEvidenceInputSchema,
} from "../../shared/modules/effectivenessIntelligence";
import {
  eiNextBestActions,
  eiBehaviorContracts,
} from "../../drizzle/schema";

export const effectivenessIntelligenceRouter = router({
  // ── 1. Participant Dashboard Payload ──────────────────────────────────────────
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    return getEffectivenessDashboardService(ctx.user.id);
  }),

  // ── 2. Submit Work Genome Scan ────────────────────────────────────────────────
  submitWorkScan: protectedProcedure
    .input(createWorkScanInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await createWorkScanService({
          userId: ctx.user.id,
          input,
        });
        return {
          success: true,
          scanId: result.scan.id,
          gapScore: result.capacitySnapshot.gapScore,
          recoverableHours: result.capacitySnapshot.recoverableHours,
          workBelowLevelPercent: result.capacitySnapshot.workBelowLevelPercent,
          headline: result.opportunityScan.headline,
          recommendedBehaviors: result.opportunityScan.recommendedBehaviors,
          nbla: result.proposedNbla,
        };
      } catch (err: any) {
        console.error("[EffectivenessIntelligence] submitWorkScan error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to process leadership work scan",
        });
      }
    }),

  // ── 3. Create or Select Behavior Change Contract ──────────────────────────────
  createContract: protectedProcedure
    .input(behaviorContractInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const contract = await createBehaviorContractService({
          userId: ctx.user.id,
          input,
        });
        return { success: true, contract };
      } catch (err: any) {
        console.error("[EffectivenessIntelligence] createContract error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to create behavior contract",
        });
      }
    }),

  // ── 4. Update Contract Status ─────────────────────────────────────────────────
  updateContractStatus: protectedProcedure
    .input(
      z.object({
        contractId: z.number().int().positive(),
        status: z.enum(["selected", "practising", "active_in_work", "verified_shift", "deferred"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [existing] = await db
        .select()
        .from(eiBehaviorContracts)
        .where(
          and(
            eq(eiBehaviorContracts.id, input.contractId),
            eq(eiBehaviorContracts.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found or access denied" });
      }

      await db
        .update(eiBehaviorContracts)
        .set({
          status: input.status,
          achievedAt: input.status === "verified_shift" ? new Date() : existing.achievedAt,
          updatedAt: new Date(),
        })
        .where(eq(eiBehaviorContracts.id, input.contractId));

      return { success: true, contractId: input.contractId, status: input.status };
    }),

  // ── 5. Record Evidence Claim ──────────────────────────────────────────────────
  recordEvidence: protectedProcedure
    .input(recordEvidenceInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const claim = await recordEvidenceClaimService({
          userId: ctx.user.id,
          input,
        });
        return { success: true, claimId: claim.id, evidenceLevel: claim.evidenceLevel };
      } catch (err: any) {
        console.error("[EffectivenessIntelligence] recordEvidence error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Failed to record leadership evidence",
        });
      }
    }),

  // ── 6. Respond to Next Best Action (NBLA) ────────────────────────────────────
  respondToNbla: protectedProcedure
    .input(
      z.object({
        actionId: z.number().int().positive(),
        status: z.enum(["accepted", "completed", "dismissed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [existing] = await db
        .select()
        .from(eiNextBestActions)
        .where(
          and(
            eq(eiNextBestActions.id, input.actionId),
            eq(eiNextBestActions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Action not found or access denied" });
      }

      await db
        .update(eiNextBestActions)
        .set({
          status: input.status,
          completedAt: input.status === "completed" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(eiNextBestActions.id, input.actionId));

      return { success: true, actionId: input.actionId, status: input.status };
    }),
});
