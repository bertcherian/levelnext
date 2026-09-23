import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import { COOKIE_NAME } from "../../shared/const";
import { getDb } from "../db";
import { personaBuilderReminderSettings } from "../../drizzle/schema";
import {
  addPersonaEpisodeSchema,
  analysePersonaPatternSchema,
  createPersonaCommitmentSchema,
  createPersonaCompletionReviewSchema,
  personaCoachSharingSchema,
  personaCoachTokenSchema,
  personaReminderSettingsSchema,
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
  createPersonaCoachShare,
  generatePersonaCandidates,
  getPersonaBuilderHome,
  getPersonaCoachSummaryByToken,
  getPersonaRepPracticeContext,
  recordPersonaCheckin,
  selectPersona,
  startPersonaJourney,
  savePersonaCoachSharing,
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
  saveCoachSharing: protectedProcedure.input(personaCoachSharingSchema).mutation(async ({ ctx, input }) => {
    try {
      return await savePersonaCoachSharing(ctx.user.id, input);
    } catch (error) {
      return toBadRequest(error);
    }
  }),
  createCoachShare: protectedProcedure.input(z.object({ journeyId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      return await createPersonaCoachShare(ctx.user.id, input.journeyId);
    } catch (error) {
      return toBadRequest(error);
    }
  }),
  getCoachSummary: publicProcedure.input(personaCoachTokenSchema).query(async ({ input }) => {
    try {
      return await getPersonaCoachSummaryByToken(input.token);
    } catch (error) {
      throw new TRPCError({ code: "NOT_FOUND", message: error instanceof Error ? error.message : "Coach summary unavailable." });
    }
  }),
  getReminderSettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [setting] = await db.select().from(personaBuilderReminderSettings).where(eq(personaBuilderReminderSettings.userId, ctx.user.id)).limit(1);
    return setting ?? { enabled: false, localHour: 9, timeZone: "UTC", scheduleCronTaskUid: null, lastReminderAt: null };
  }),
  saveReminderSettings: protectedProcedure.input(personaReminderSettingsSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [existing] = await db.select().from(personaBuilderReminderSettings).where(eq(personaBuilderReminderSettings.userId, ctx.user.id)).limit(1);
    const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
    const cron = "0 0 * * * *";
    let taskUid = existing?.scheduleCronTaskUid ?? null;
    if (existing) await db.update(personaBuilderReminderSettings).set({ enabled: input.enabled, localHour: input.localHour, timeZone: input.timeZone }).where(eq(personaBuilderReminderSettings.id, existing.id));
    else if (!input.enabled) {
      await db.insert(personaBuilderReminderSettings).values({ userId: ctx.user.id, ...input });
      return { ...input, scheduleCronTaskUid: null };
    } else await db.insert(personaBuilderReminderSettings).values({ userId: ctx.user.id, ...input });
    const description = "Optional daily Persona Builder journey reminder";
    if (taskUid) await updateHeartbeatJob(taskUid, { cron, path: "/api/scheduled/personaBuilderReminder", method: "POST", description, enable: input.enabled }, sessionToken);
    else if (input.enabled) {
      const job = await createHeartbeatJob({ name: `persona-builder-reminder-${ctx.user.id}`, cron, path: "/api/scheduled/personaBuilderReminder", method: "POST", description }, sessionToken);
      taskUid = job.taskUid;
      await db.update(personaBuilderReminderSettings).set({ scheduleCronTaskUid: taskUid }).where(eq(personaBuilderReminderSettings.userId, ctx.user.id));
    }
    return { ...input, scheduleCronTaskUid: taskUid };
  }),
});
