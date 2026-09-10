import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  academyKnowledgeObjects,
  academyMentorMessages,
  academyMentorThreads,
  academyProfiles,
  academyProgressEvents,
} from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import {
  ACADEMY_DIAGNOSTIC_ITEMS,
  askProductMentor,
  ensureAcademySeedKnowledge,
  getAcademyPassportSummary,
  getOrCreateAcademyProfile,
  submitDiagnosticAttempt,
} from "../academyService";
import { ACADEMY_ROLE_TRACKS, type AcademyRoleTrack } from "../../shared/modules/academy";

export const academyRouter = router({
  getDiagnosticItems: publicProcedure.query(async () => {
    return ACADEMY_DIAGNOSTIC_ITEMS.map((item) => ({
      id: item.id,
      dimension: item.dimension,
      question: item.question,
      scenario: item.scenario,
      options: item.options.map((opt) => ({
        key: opt.key,
        label: opt.label,
      })),
    }));
  }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return getOrCreateAcademyProfile(ctx.user.id);
  }),

  getPassportSummary: protectedProcedure.query(async ({ ctx }) => {
    return getAcademyPassportSummary(ctx.user.id);
  }),

  getProductMap: protectedProcedure.query(async () => {
    await ensureAcademySeedKnowledge();
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const objects = await db
      .select()
      .from(academyKnowledgeObjects)
      .where(eq(academyKnowledgeObjects.approvalStatus, "approved"));

    return objects;
  }),

  submitDiagnostic: protectedProcedure
    .input(
      z.object({
        roleTrack: z.enum(ACADEMY_ROLE_TRACKS).optional(),
        responses: z.array(
          z.object({
            itemKey: z.string(),
            response: z.string(),
            confidence: z.enum(["low", "medium", "high"]),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return submitDiagnosticAttempt({
        userId: ctx.user.id,
        roleTrack: input.roleTrack as AcademyRoleTrack | undefined,
        responses: input.responses,
      });
    }),

  askMentor: protectedProcedure
    .input(
      z.object({
        question: z.string().min(5),
        mode: z.enum(["ask", "explain", "show", "test", "challenge"]).default("ask"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return askProductMentor({
        userId: ctx.user.id,
        question: input.question,
        mode: input.mode,
      });
    }),

  getMentorThreadHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const profile = await getOrCreateAcademyProfile(ctx.user.id);

    const threads = await db
      .select()
      .from(academyMentorThreads)
      .where(eq(academyMentorThreads.profileId, profile.id))
      .orderBy(desc(academyMentorThreads.lastActiveAt))
      .limit(5);

    return threads;
  }),

  recordStepExploration: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        stepTitle: z.string(),
        dimension: z.enum(["understand", "navigate", "apply", "explain"]).default("navigate"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const profile = await getOrCreateAcademyProfile(ctx.user.id);

      await db.insert(academyProgressEvents).values({
        profileId: profile.id,
        eventType: "step_explored",
        objectKey: input.slug,
        dimension: input.dimension,
        evidenceRef: {
          stepTitle: input.stepTitle,
          exploredAt: new Date().toISOString(),
        },
      });

      return { success: true };
    }),
});
