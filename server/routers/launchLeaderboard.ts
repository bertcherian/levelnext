import { desc, gte } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  launchUserPreferences,
  launchUserProgress,
  launchXpLedger,
} from "../../drizzle/schema";

const timeframeSchema = z.enum(["week", "month", "all"]);

const ACTIVITY_META: Record<string, { label: string; icon: string; color: string }> = {
  career_compass_complete: { label: "Career Compass", icon: "🧭", color: "#A78BFA" },
  daily_mission_complete: { label: "Daily Missions", icon: "🎯", color: "#22D3EE" },
  mock_interview_complete: { label: "Interview Intelligence", icon: "🎤", color: "#F472B6" },
  skill_module_complete: { label: "Skill Sprint", icon: "⚡", color: "#4ADE80" },
  resume_uploaded: { label: "Resume Makeover", icon: "📄", color: "#FB923C" },
  application_submitted: { label: "Application Tracker", icon: "🚀", color: "#38BDF8" },
  networking_message_sent: { label: "Networking", icon: "🤝", color: "#FCD34D" },
  weekly_challenge_complete: { label: "Weekly Challenge", icon: "🏆", color: "#F87171" },
};

function startOfWindow(timeframe: z.infer<typeof timeframeSchema>) {
  const now = new Date();
  if (timeframe === "week") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (timeframe === "month") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null;
}

function anonymousLabel(userId: number) {
  return `Member #${userId}`;
}

export const launchLeaderboardRouter = router({
  getLeaderboard: protectedProcedure
    .input(z.object({ timeframe: timeframeSchema.default("week") }).default({ timeframe: "week" }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return {
          entries: [],
          currentUser: null,
          participantCount: 0,
          trendingMissions: [],
          timeframe: input.timeframe,
        };
      }

      const periodStart = startOfWindow(input.timeframe);
      const weekStart = startOfWindow("week")!;

      const [progressRows, preferenceRows, weekLedgerRows, periodLedgerRows] = await Promise.all([
        db.select().from(launchUserProgress).orderBy(desc(launchUserProgress.totalXp)),
        db.select().from(launchUserPreferences),
        db.select().from(launchXpLedger).where(gte(launchXpLedger.createdAt, weekStart)),
        periodStart
          ? db.select().from(launchXpLedger).where(gte(launchXpLedger.createdAt, periodStart))
          : Promise.resolve([]),
      ]);

      const avatars = new Map(preferenceRows.map((row) => [row.userId, row.avatar]));
      const progressByUser = new Map(progressRows.map((row) => [row.userId, row]));
      const periodXp = new Map<number, number>();

      for (const row of periodLedgerRows) {
        periodXp.set(row.userId, (periodXp.get(row.userId) ?? 0) + row.xpEarned);
      }

      const candidateUserIds = input.timeframe === "all"
        ? progressRows.map((row) => row.userId)
        : Array.from(periodXp.keys());

      const entries = candidateUserIds
        .map((userId) => {
          const progress = progressByUser.get(userId);
          const xp = input.timeframe === "all" ? (progress?.totalXp ?? 0) : (periodXp.get(userId) ?? 0);
          return {
            userId,
            label: userId === ctx.user.id ? "You" : anonymousLabel(userId),
            xp,
            level: progress?.currentLevel ?? "Explorer",
            streak: progress?.currentStreak ?? 0,
            avatar: avatars.get(userId) ?? "✦",
            isCurrentUser: userId === ctx.user.id,
          };
        })
        .filter((entry) => entry.xp > 0 || entry.isCurrentUser)
        .sort((a, b) => b.xp - a.xp || a.userId - b.userId)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      const currentUser = entries.find((entry) => entry.isCurrentUser) ?? null;
      const activityByAction = new Map<string, { userIds: Set<number>; xpAwarded: number }>();

      for (const row of weekLedgerRows) {
        const aggregate = activityByAction.get(row.action) ?? { userIds: new Set<number>(), xpAwarded: 0 };
        aggregate.userIds.add(row.userId);
        aggregate.xpAwarded += row.xpEarned;
        activityByAction.set(row.action, aggregate);
      }

      const trendingMissions = Array.from(activityByAction.entries())
        .map(([action, aggregate]) => {
          const meta = ACTIVITY_META[action] ?? {
            label: action.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
            icon: "✦",
            color: "#22D3EE",
          };
          return {
            action,
            ...meta,
            participantCount: aggregate.userIds.size,
            xpAwarded: aggregate.xpAwarded,
          };
        })
        .sort((a, b) => b.participantCount - a.participantCount || b.xpAwarded - a.xpAwarded)
        .slice(0, 5);

      return {
        entries,
        currentUser,
        participantCount: entries.length,
        trendingMissions,
        timeframe: input.timeframe,
      };
    }),
});
