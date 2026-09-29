import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createProofPilot,
  getProofSecurityFastPack,
  getProofDay30,
  getProofParticipant,
  getProofSponsorDashboard,
  inviteProofParticipants,
  recordProofBaseline,
  recordProofDailyAction,
  recordProofObserverPulse,
  recordProofRealWork,
  recordProofRep,
  reportProofAccessIssue,
  recommendPilot,
  requestProofSecurityReview,
} from "../behaviourChangeProof";
import {
  proofAccessIssueSchema,
  proofBaselineSchema,
  proofCreatePilotSchema,
  proofDailyActionSchema,
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
  securityFastPack: protectedProcedure.input(z.object({ pilotId: z.number().int().positive() })).query(({ ctx, input }) => getProofSecurityFastPack(ctx.user.id, input.pilotId)),
  requestSecurityReview: protectedProcedure.input(z.object({ pilotId: z.number().int().positive() })).mutation(({ ctx, input }) => requestProofSecurityReview(ctx.user.id, input.pilotId)),

  participant: publicProcedure.input(proofTokenSchema).query(({ input }) => getProofParticipant(input.token)),
  completeBaseline: publicProcedure.input(proofBaselineSchema).mutation(({ input }) => recordProofBaseline(input.token, input.currentSituation, input.desiredMovement)),
  completeRep: publicProcedure.input(proofRepSchema).mutation(({ input }) => recordProofRep(input.token, input.practiceRole)),
  recordRealWork: publicProcedure.input(proofRealWorkSchema).mutation(({ input }) => recordProofRealWork(input.token, input.situationType, input.actionTaken, input.outcomeSignal)),
  observerPulse: publicProcedure.input(proofObserverPulseSchema).mutation(({ input }) => recordProofObserverPulse(input.token, input.movement)),
  completeDailyAction: publicProcedure.input(proofDailyActionSchema).mutation(({ input }) => recordProofDailyAction(input.token, input.completed, input.barrier)),
  reportAccessIssue: publicProcedure.input(proofAccessIssueSchema).mutation(({ input }) => reportProofAccessIssue(input.token, input.issue)),
});
