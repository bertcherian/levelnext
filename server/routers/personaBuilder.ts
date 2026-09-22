import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  addPersonaEpisodeSchema,
  analysePersonaPatternSchema,
  createPersonaCommitmentSchema,
  createPersonaCompletionReviewSchema,
  createPersonaRepSchema,
  recordPersonaCheckinSchema,
  selectPersonaSchema,
  startPersonaJourneySchema,
} from "../../shared/modules/personaBuilder";
import {
  addPersonaEpisode,
  analysePersonaPattern,
  createPersonaCommitment,
  createPersonaRep,
  createPersonaCompletionReview,
  generatePersonaCandidates,
  getPersonaBuilderHome,
  getPersonaRepPracticeContext,
  recordPersonaCheckin,
  selectPersona,
  startPersonaJourney,
} from "../personaBuilder";

function toBadRequest(error: unknown): never {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: error instanceof Error ? error.message : "Persona Builder request could not be completed.",
  });
}

export const personaBuilderRouter = router({
  getHome: protectedProcedure.query(({ ctx }) => getPersonaBuilderHome(ctx.user.id)),
  startJourney: protectedProcedure.input(startPersonaJourneySchema).mutation(async ({ ctx, input }) => {
    try {
      return await startPersonaJourney(ctx.user.id, input);
    } catch (error) {
      return toBadRequest(error);
    }
  }),
  addEpisode: protectedProcedure.input(addPersonaEpisodeSchema).mutation(async ({ ctx, input }) => {
    try {
      return await addPersonaEpisode(ctx.user.id, input);
    } catch (error) {
      return toBadRequest(error);
    }
  }),
  analysePattern: protectedProcedure.input(analysePersonaPatternSchema).mutation(async ({ ctx, input }) => {
    try {
      return await analysePersonaPattern(ctx.user.id, input.journeyId);
    } catch (error) {
      return toBadRequest(error);
    }
  }),
  createCommitment: protectedProcedure.input(createPersonaCommitmentSchema).mutation(async ({ ctx, input }) => {
    try {
      return await createPersonaCommitment(ctx.user.id, input);
    } catch (error) {
      return toBadRequest(error);
    }
  }),
  generateCandidates: protectedProcedure.input(analysePersonaPatternSchema).mutation(async ({ ctx, input }) => {
    try {
      return await generatePersonaCandidates(ctx.user.id, input.journeyId);
    } catch (error) {
      return toBadRequest(error);
    }
  }),
  selectPersona: protectedProcedure.input(selectPersonaSchema).mutation(async ({ ctx, input }) => {
    try {
      return await selectPersona(ctx.user.id, input.journeyId, input.candidateIndex);
    } catch (error) {
      return toBadRequest(error);
    }
  }),
  createRep: protectedProcedure.input(createPersonaRepSchema).mutation(async ({ ctx, input }) => {
    try {
      return await createPersonaRep(ctx.user.id, input.journeyId);
    } catch (error) {
      return toBadRequest(error);
    }
  }),
  recordCheckin: protectedProcedure.input(recordPersonaCheckinSchema).mutation(async ({ ctx, input }) => {
    try {
      return await recordPersonaCheckin(ctx.user.id, input);
    } catch (error) {
      return toBadRequest(error);
    }
  }),
  getRepPracticeContext: protectedProcedure.input(z.object({ repId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    try {
      return await getPersonaRepPracticeContext(ctx.user.id, input.repId);
    } catch (error) {
      return toBadRequest(error);
    }
  }),
  createCompletionReview: protectedProcedure.input(createPersonaCompletionReviewSchema).mutation(async ({ ctx, input }) => {
    try {
      return await createPersonaCompletionReview(ctx.user.id, input);
    } catch (error) {
      return toBadRequest(error);
    }
  }),
});
