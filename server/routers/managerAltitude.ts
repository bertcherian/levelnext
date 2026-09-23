import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { managerAltitudeIntakes } from "../../drizzle/schema";
import { deriveManagerDevelopmentAltitude, MANAGER_ALTITUDE_QUESTIONS, type ManagerAltitudeAnswer } from "../../shared/modules/managerAltitude";

const answerValues = Object.fromEntries(
  MANAGER_ALTITUDE_QUESTIONS.map((question) => [question.id, z.enum(question.options.map((option) => option.value) as [string, ...string[]])]),
) as Record<string, z.ZodType<string>>;

const answersSchema = z.object(answerValues).strict();

export const managerAltitudeRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [intake] = await db.select().from(managerAltitudeIntakes).where(eq(managerAltitudeIntakes.userId, ctx.user.id)).limit(1);
    return intake ?? null;
  }),

  complete: protectedProcedure
    .input(z.object({ answers: answersSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const answers = input.answers as ManagerAltitudeAnswer;
      const result = deriveManagerDevelopmentAltitude(answers);
      const values = {
        userId: ctx.user.id,
        answers,
        altitude: result.altitude,
        score: result.score,
        focus: result.focus,
        explanation: result.explanation,
      };
      const [existing] = await db.select({ id: managerAltitudeIntakes.id }).from(managerAltitudeIntakes).where(and(eq(managerAltitudeIntakes.userId, ctx.user.id))).limit(1);
      if (existing) {
        await db.update(managerAltitudeIntakes).set(values).where(eq(managerAltitudeIntakes.id, existing.id));
        return { id: existing.id, ...result };
      }
      const [inserted] = await db.insert(managerAltitudeIntakes).values(values).$returningId();
      return { id: inserted.id, ...result };
    }),
});
