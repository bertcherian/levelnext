import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { launchApplicationReminders } from "../../drizzle/schema";
import { eq, and, gte, asc } from "drizzle-orm";

export const launchRemindersRouter = router({
  getByApplication: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(launchApplicationReminders)
        .where(
          and(
            eq(launchApplicationReminders.userId, ctx.user.id),
            eq(launchApplicationReminders.applicationId, input.applicationId)
          )
        )
        .orderBy(asc(launchApplicationReminders.reminderDate));
    }),

  getUpcoming: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const now = new Date();
    return db
      .select()
      .from(launchApplicationReminders)
      .where(
        and(
          eq(launchApplicationReminders.userId, ctx.user.id),
          eq(launchApplicationReminders.isDone, false),
          gte(launchApplicationReminders.reminderDate, now)
        )
      )
      .orderBy(asc(launchApplicationReminders.reminderDate))
      .limit(20);
  }),

  create: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      reminderType: z.enum(["interview", "follow_up", "deadline", "assessment", "other"]),
      reminderDate: z.string(), // ISO string
      note: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [inserted] = await db.insert(launchApplicationReminders).values({
        userId: ctx.user.id,
        applicationId: input.applicationId,
        reminderType: input.reminderType,
        reminderDate: new Date(input.reminderDate),
        note: input.note || null,
        isDone: false,
      });
      return { id: (inserted as { insertId: number }).insertId };
    }),

  markDone: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(launchApplicationReminders)
        .set({ isDone: true })
        .where(
          and(
            eq(launchApplicationReminders.id, input.id),
            eq(launchApplicationReminders.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .delete(launchApplicationReminders)
        .where(
          and(
            eq(launchApplicationReminders.id, input.id),
            eq(launchApplicationReminders.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
