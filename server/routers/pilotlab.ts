import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  advancePilotlabRun,
  createPilotlabRun,
  getPilotlabRunForAdmin,
  getPilotlabWorkspace,
} from "../pilotlab";
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
      return await createPilotlabRun(ctx.user.id, input.name);
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

  runDetails: adminProcedure.input(z.object({ runId: z.number().int().positive() })).query(async ({ input }) => {
    try {
      return await getPilotlabRunForAdmin(input.runId);
    } catch (error) {
      return toTrpcError(error);
    }
  }),
});
