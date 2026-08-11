import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  launchUserProgress,
  launchXpLedger,
  launchUserAchievements,
  launchAchievements,
} from "../../drizzle/schema";

// ─── XP Constants ─────────────────────────────────────────────────────────────
export const XP_VALUES: Record<string, number> = {
  daily_login: 10,
  daily_mission_complete: 25,
  all_daily_missions_complete: 50,
  career_compass_complete: 100,
  resume_uploaded: 50,
  resume_score_improved: 30,
  linkedin_section_optimised: 20,
  mock_interview_complete: 75,
  application_submitted: 30,
  networking_message_sent: 40,
  skill_module_complete: 60,
  weekly_challenge_complete: 100,
  streak_7_bonus: 50,
  streak_30_bonus: 150,
  onboarding_complete: 50,
};

// ─── Level Thresholds ─────────────────────────────────────────────────────────
export const LEVELS = [
  { name: "Explorer",      minXp: 0,    color: "#94A3B8" },
  { name: "Builder",       minXp: 300,  color: "#4F9CF9" },
  { name: "Professional",  minXp: 700,  color: "#3DDC97" },
  { name: "Candidate",     minXp: 1200, color: "#FFC857" },
  { name: "Interview Pro", minXp: 2000, color: "#FF6B6B" },
  { name: "Offer Winner",  minXp: 3500, color: "#A78BFA" },
  { name: "Career Starter",minXp: 5000, color: "#F59E0B" },
];

export function getLevelForXp(xp: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) level = l;
  }
  const idx = LEVELS.indexOf(level);
  const next = LEVELS[idx + 1];
  return {
    ...level,
    nextLevel: next ?? null,
    xpToNext: next ? next.minXp - xp : 0,
    progressPct: next
      ? Math.round(((xp - level.minXp) / (next.minXp - level.minXp)) * 100)
      : 100,
  };
}

// ─── Seed Achievements ────────────────────────────────────────────────────────
const ACHIEVEMENT_SEEDS = [
  { code: "FIRST_LOGIN",        name: "First Step",           icon: "🚀", description: "Logged in for the first time",                xpBonus: 0   },
  { code: "ONBOARDING_DONE",    name: "Ready to Launch",      icon: "🎯", description: "Completed onboarding",                        xpBonus: 50  },
  { code: "FIRST_MISSION",      name: "Mission Accepted",     icon: "✅", description: "Completed your first daily mission",          xpBonus: 0   },
  { code: "STREAK_3",           name: "On a Roll",            icon: "🔥", description: "3-day streak",                                xpBonus: 25  },
  { code: "STREAK_7",           name: "Week Warrior",         icon: "⚡", description: "7-day streak",                                xpBonus: 50  },
  { code: "STREAK_30",          name: "Unstoppable",          icon: "💎", description: "30-day streak",                               xpBonus: 150 },
  { code: "LEVEL_BUILDER",      name: "Builder Unlocked",     icon: "🏗️", description: "Reached Builder level",                       xpBonus: 0   },
  { code: "LEVEL_PROFESSIONAL", name: "Going Professional",   icon: "💼", description: "Reached Professional level",                  xpBonus: 0   },
  { code: "LEVEL_CANDIDATE",    name: "Serious Candidate",    icon: "🎖️", description: "Reached Candidate level",                     xpBonus: 0   },
  { code: "LEVEL_INTERVIEW_PRO",name: "Interview Pro",        icon: "🎤", description: "Reached Interview Pro level",                 xpBonus: 0   },
  { code: "LEVEL_OFFER_WINNER", name: "Offer Winner",         icon: "🏆", description: "Reached Offer Winner level",                  xpBonus: 0   },
  { code: "LEVEL_CAREER_STARTER",name:"Career Starter",       icon: "🌟", description: "Reached Career Starter — the top level",      xpBonus: 200 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getOrCreateProgress(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [existing] = await db
    .select()
    .from(launchUserProgress)
    .where(eq(launchUserProgress.userId, userId))
    .limit(1);
  if (existing) return existing;
  await db.insert(launchUserProgress).values({ userId });
  const [created] = await db
    .select()
    .from(launchUserProgress)
    .where(eq(launchUserProgress.userId, userId))
    .limit(1);
  return created!;
}

async function checkAndAwardAchievements(
  userId: number,
  totalXp: number,
  streak: number,
  newLevel: string
): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const earned = await db
    .select({ code: launchUserAchievements.achievementCode })
    .from(launchUserAchievements)
    .where(eq(launchUserAchievements.userId, userId));
  const earnedCodes = new Set(earned.map((e: { code: string }) => e.code));

  const toAward: string[] = [];
  if (!earnedCodes.has("FIRST_LOGIN")) toAward.push("FIRST_LOGIN");
  if (streak >= 3  && !earnedCodes.has("STREAK_3"))            toAward.push("STREAK_3");
  if (streak >= 7  && !earnedCodes.has("STREAK_7"))            toAward.push("STREAK_7");
  if (streak >= 30 && !earnedCodes.has("STREAK_30"))           toAward.push("STREAK_30");
  if (newLevel === "Builder"        && !earnedCodes.has("LEVEL_BUILDER"))       toAward.push("LEVEL_BUILDER");
  if (newLevel === "Professional"   && !earnedCodes.has("LEVEL_PROFESSIONAL"))  toAward.push("LEVEL_PROFESSIONAL");
  if (newLevel === "Candidate"      && !earnedCodes.has("LEVEL_CANDIDATE"))     toAward.push("LEVEL_CANDIDATE");
  if (newLevel === "Interview Pro"  && !earnedCodes.has("LEVEL_INTERVIEW_PRO")) toAward.push("LEVEL_INTERVIEW_PRO");
  if (newLevel === "Offer Winner"   && !earnedCodes.has("LEVEL_OFFER_WINNER"))  toAward.push("LEVEL_OFFER_WINNER");
  if (newLevel === "Career Starter" && !earnedCodes.has("LEVEL_CAREER_STARTER"))toAward.push("LEVEL_CAREER_STARTER");

  if (toAward.length > 0) {
    const insertDb = await getDb();
    if (insertDb) {
      await insertDb.insert(launchUserAchievements).values(
        toAward.map((code) => ({ userId, achievementCode: code }))
      );
    }
  }
  return toAward;
}

export async function awardLaunchXp(
  userId: number,
  action: string,
  metadata: Record<string, unknown> = {},
  xpOverride?: number,
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const xpEarned = xpOverride ?? XP_VALUES[action] ?? 10;
  const progress = await getOrCreateProgress(userId);
  const newXp = progress.totalXp + xpEarned;
  const newLevel = getLevelForXp(newXp).name;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let newStreak = progress.currentStreak;
  if (progress.lastActiveDate === yesterday) {
    newStreak = progress.currentStreak + 1;
  } else if (progress.lastActiveDate !== today) {
    newStreak = 1;
  }
  const newLongest = Math.max(progress.longestStreak, newStreak);

  let bonusXp = 0;
  if (newStreak === 7) bonusXp = XP_VALUES.streak_7_bonus ?? 50;
  if (newStreak === 30) bonusXp = XP_VALUES.streak_30_bonus ?? 150;
  const finalXp = newXp + bonusXp;
  const levelInfo = getLevelForXp(finalXp);

  await db.update(launchUserProgress)
    .set({
      totalXp: finalXp,
      currentLevel: levelInfo.name,
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
    })
    .where(eq(launchUserProgress.userId, userId));

  await db.insert(launchXpLedger).values({
    userId,
    action,
    xpEarned: xpEarned + bonusXp,
    metadata,
  });

  const newAchievements = await checkAndAwardAchievements(userId, finalXp, newStreak, levelInfo.name);

  return {
    xpEarned: xpEarned + bonusXp,
    totalXp: finalXp,
    newLevel: levelInfo,
    leveledUp: newLevel !== progress.currentLevel,
    newAchievements,
    newStreak,
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const launchProgressRouter = router({
  // Get full progress state for the current user
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const progress = await getOrCreateProgress(ctx.user.id);
    const levelInfo = getLevelForXp(progress.totalXp);
    const achievements = await db
      .select()
      .from(launchUserAchievements)
      .where(eq(launchUserAchievements.userId, ctx.user.id));
    const recentXp = await db
      .select()
      .from(launchXpLedger)
      .where(eq(launchXpLedger.userId, ctx.user.id))
      .orderBy(desc(launchXpLedger.createdAt))
      .limit(10);
    return { progress, levelInfo, achievements, recentXp };
  }),

  // Award XP for a specific action
  awardXp: protectedProcedure
    .input(z.object({
      action: z.string(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(({ ctx, input }) => awardLaunchXp(
      ctx.user.id,
      input.action,
      (input.metadata ?? {}) as Record<string, unknown>,
    )),

  // Complete onboarding
  completeOnboarding: protectedProcedure
    .input(z.object({
      targetRole: z.string(),
      targetIndustry: z.string(),
      experienceLevel: z.enum(["fresher", "1-2y", "3-5y"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await getOrCreateProgress(ctx.user.id);
      await db.update(launchUserProgress)
        .set({
          targetRole: input.targetRole,
          targetIndustry: input.targetIndustry,
          experienceLevel: input.experienceLevel,
          onboardingComplete: true,
        })
        .where(eq(launchUserProgress.userId, ctx.user.id));

      // Award onboarding XP
      const xpEarned = XP_VALUES.onboarding_complete ?? 50;
      const progress = await getOrCreateProgress(ctx.user.id);
      await db.update(launchUserProgress)
        .set({ totalXp: progress.totalXp + xpEarned })
        .where(eq(launchUserProgress.userId, ctx.user.id));
      await db.insert(launchXpLedger).values({
        userId: ctx.user.id,
        action: "onboarding_complete",
        xpEarned,
        metadata: {},
      });
      // Award onboarding achievement
      await db.insert(launchUserAchievements).values({
        userId: ctx.user.id,
        achievementCode: "ONBOARDING_DONE",
      }).catch(() => {}); // ignore duplicate

      return { success: true, xpEarned };
    }),

  // Seed achievement definitions (admin only — called once)
  seedAchievements: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Admin only");
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    for (const a of ACHIEVEMENT_SEEDS) {
      await db.insert(launchAchievements).values(a).catch(() => {});
    }
    return { seeded: ACHIEVEMENT_SEEDS.length };
  }),

  // Get all achievement definitions
  getAchievementDefs: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(launchAchievements).orderBy(launchAchievements.id);
  }),
});
