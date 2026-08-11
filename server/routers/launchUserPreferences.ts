import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { launchUserPreferences } from "../../drizzle/schema";
import { z } from "zod";

const ACCENT_COLORS = ["cyan", "pink", "green", "orange", "purple"] as const;
const AVATARS = ["🚀", "⚡", "🔥", "🎯", "🧭", "✨", "💼", "🏆", "🌟", "🦄", "🎮", "💡"] as const;

export const launchUserPreferencesRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const rows = await db
      .select()
      .from(launchUserPreferences)
      .where(eq(launchUserPreferences.userId, ctx.user.id))
      .limit(1);

    if (rows.length === 0) {
      // Create default preferences row
      await db.insert(launchUserPreferences).values({
        userId: ctx.user.id,
      });
      return {
        accentColor: "cyan",
        avatar: "🚀",
        notifyDailyMissions: true,
        notifyStreaks: true,
        notifyAchievements: true,
        notifyReminders: true,
        reducedMotion: false,
        highContrast: false,
      };
    }

    return rows[0];
  }),

  updateAccentColor: protectedProcedure
    .input(z.object({ accentColor: z.enum(ACCENT_COLORS) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .insert(launchUserPreferences)
        .values({ userId: ctx.user.id, accentColor: input.accentColor })
        .onDuplicateKeyUpdate({ set: { accentColor: input.accentColor } });

      return { success: true };
    }),

  updateAvatar: protectedProcedure
    .input(z.object({ avatar: z.enum(AVATARS) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .insert(launchUserPreferences)
        .values({ userId: ctx.user.id, avatar: input.avatar })
        .onDuplicateKeyUpdate({ set: { avatar: input.avatar } });

      return { success: true };
    }),

  updateNotifications: protectedProcedure
    .input(
      z.object({
        notifyDailyMissions: z.boolean().optional(),
        notifyStreaks: z.boolean().optional(),
        notifyAchievements: z.boolean().optional(),
        notifyReminders: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const updateSet: Record<string, unknown> = {};
      if (input.notifyDailyMissions !== undefined) updateSet.notifyDailyMissions = input.notifyDailyMissions;
      if (input.notifyStreaks !== undefined) updateSet.notifyStreaks = input.notifyStreaks;
      if (input.notifyAchievements !== undefined) updateSet.notifyAchievements = input.notifyAchievements;
      if (input.notifyReminders !== undefined) updateSet.notifyReminders = input.notifyReminders;

      if (Object.keys(updateSet).length === 0) return { success: true };

      await db
        .insert(launchUserPreferences)
        .values({ userId: ctx.user.id, notifyDailyMissions: input.notifyDailyMissions ?? true, notifyStreaks: input.notifyStreaks ?? true, notifyAchievements: input.notifyAchievements ?? true, notifyReminders: input.notifyReminders ?? true, ...updateSet })
        .onDuplicateKeyUpdate({ set: updateSet });

      return { success: true };
    }),

  updateAccessibility: protectedProcedure
    .input(
      z.object({
        reducedMotion: z.boolean().optional(),
        highContrast: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const updateSet: Record<string, unknown> = {};
      if (input.reducedMotion !== undefined) updateSet.reducedMotion = input.reducedMotion;
      if (input.highContrast !== undefined) updateSet.highContrast = input.highContrast;

      if (Object.keys(updateSet).length === 0) return { success: true };

      await db
        .insert(launchUserPreferences)
        .values({ userId: ctx.user.id, reducedMotion: input.reducedMotion ?? false, highContrast: input.highContrast ?? false, ...updateSet })
        .onDuplicateKeyUpdate({ set: updateSet });

      return { success: true };
    }),
});
