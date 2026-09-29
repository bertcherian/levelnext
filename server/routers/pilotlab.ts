import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  advancePilotlabRun,
  createPilotlabRun,
  getPilotlabRunForAdmin,
  getPilotlabWorkspace,
} from "../pilotlab";
import { buildPilotlabAssuranceReport, runPilotlabLiveEvaluation, runPilotlabPairedComparison } from "../pilotlabIntegrations";
import { pilotlabCreateRunSchema } from "../../shared/modules/pilotlab";

function toTrpcError(error: unknown): never {
  const message = error instanceof Error ? error.message : "Pilotlab operation failed";
  if (message === "Pilotlab run not found") {
    throw new TRPCError({ code: "NOT_FOUND", message });
  }
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
}

export const pilotlabRouter = router({
  workspace: adminProcedure.query(async () => {
    try {
      return await getPilotlabWorkspace();
    } catch (error) {
      return toTrpcError(error);
    }
  }),

  createRun: adminProcedure.input(pilotlabCreateRunSchema).mutation(async ({ ctx, input }) => {
    try {
      return await createPilotlabRun(ctx.user.id, input.name, input.platformVersion, input.chaosConfig);
    } catch (error) {
      return toTrpcError(error);
    }
  }),

  advanceTime: adminProcedure.input(z.object({
    runId: z.number().int().positive(),
    days: z.number().int().min(1).max(60).default(7),
  })).mutation(async ({ input }) => {
    try {
      return await advancePilotlabRun(input.runId, input.days);
    } catch (error) {
      return toTrpcError(error);
    }
  }),

  runLiveEvaluation: adminProcedure.input(z.object({
    runId: z.number().int().positive(),
    scenarioCode: z.string().trim().min(1).max(32).optional(),
  })).mutation(async ({ ctx, input }) => {
    try {
      return await runPilotlabLiveEvaluation(input.runId, ctx, input.scenarioCode);
    } catch (error) {
      return toTrpcError(error);
    }
  }),

  runPairedComparison: adminProcedure.input(z.object({
    platformVersion: z.string().trim().min(1).max(80),
  })).mutation(async ({ ctx, input }) => {
    try {
      return await runPilotlabPairedComparison(ctx.user.id, ctx, input.platformVersion);
    } catch (error) {
      return toTrpcError(error);
    }
  }),

  assuranceReport: adminProcedure.input(z.object({
    runIds: z.array(z.number().int().positive()).max(10).default([]),
  })).mutation(async ({ input }) => {
    try {
      return await buildPilotlabAssuranceReport(input.runIds);
    } catch (error) {
      return toTrpcError(error);
    }
  }),

  runDetails: adminProcedure.input(z.object({ runId: z.number().int().positive() })).query(async ({ input }) => {
    try {
      return await getPilotlabRunForAdmin(input.runId);
    } catch (error) {
      return toTrpcError(error);
    }
  }),
});
