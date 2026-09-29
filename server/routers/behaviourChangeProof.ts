import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createProofPilot,
  getProofDay30,
  getProofParticipant,
  getProofSponsorDashboard,
  inviteProofParticipants,
  recordProofBaseline,
  recordProofObserverPulse,
  recordProofRealWork,
  recordProofRep,
  recommendPilot,
} from "../behaviourChangeProof";
import {
  proofBaselineSchema,
  proofCreatePilotSchema,
  proofInviteSchema,
  proofObserverPulseSchema,
  proofPreviewSchema,
  proofRepSchema,
  proofRealWorkSchema,
  proofTokenSchema,
} from "../../shared/modules/behaviourChangeProof";

export const behaviourChangeProofRouter = router({
  previewPilot: publicProcedure.input(proofPreviewSchema).query(({ input }) => recommendPilot(input.problem)),

  createPilot: protectedProcedure.input(proofCreatePilotSchema).mutation(({ ctx, input }) => createProofPilot(ctx.user.id, input)),

  sponsorDashboard: protectedProcedure.input(z.object({ pilotId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
    return getProofSponsorDashboard(ctx.user.id, input?.pilotId);
  }),

  inviteParticipants: protectedProcedure.input(proofInviteSchema).mutation(({ ctx, input }) => inviteProofParticipants(ctx.user.id, input.pilotId, input.participants, input.origin)),

  day30Proof: protectedProcedure.input(z.object({ pilotId: z.number().int().positive() })).query(async ({ ctx, input }) => getProofDay30(ctx.user.id, input.pilotId)),

  participant: publicProcedure.input(proofTokenSchema).query(({ input }) => getProofParticipant(input.token)),
  completeBaseline: publicProcedure.input(proofBaselineSchema).mutation(({ input }) => recordProofBaseline(input.token, input.currentSituation, input.desiredMovement)),
  completeRep: publicProcedure.input(proofRepSchema).mutation(({ input }) => recordProofRep(input.token, input.practiceRole)),
  recordRealWork: publicProcedure.input(proofRealWorkSchema).mutation(({ input }) => recordProofRealWork(input.token, input.situationType, input.actionTaken, input.outcomeSignal)),
  observerPulse: publicProcedure.input(proofObserverPulseSchema).mutation(({ input }) => recordProofObserverPulse(input.token, input.movement)),
});
