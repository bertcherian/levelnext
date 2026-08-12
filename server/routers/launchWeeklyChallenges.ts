import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  launchChallengeEnrollments,
  launchWeeklyChallenges,
} from "../../drizzle/schema";
import { awardLaunchXp } from "./launchProgress";

const CHALLENGE_TEMPLATE = {
  title: "Momentum Orbit",
  description: "Complete 5 daily missions this week. Small moves, strong momentum.",
  goalTarget: 5,
  xpBonus: 100,
} as const;

type WeeklyChallengeWindow = {
  weekKey: string;
  startsAt: Date;
  endsAt: Date;
};

export function getWeeklyChallengeWindow(now = new Date()): WeeklyChallengeWindow {
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayOfWeek = utcDate.getUTCDay() || 7;
  const startsAt = new Date(utcDate);
  startsAt.setUTCDate(startsAt.getUTCDate() - dayOfWeek + 1);

  const thursday = new Date(startsAt);
  thursday.setUTCDate(thursday.getUTCDate() + 3);
  const weekYear = thursday.getUTCFullYear();
  const januaryFourth = new Date(Date.UTC(weekYear, 0, 4));
  const januaryFourthDay = januaryFourth.getUTCDay() || 7;
  const firstMonday = new Date(januaryFourth);
  firstMonday.setUTCDate(firstMonday.getUTCDate() - januaryFourthDay + 1);
  const weekNumber = Math.floor((startsAt.getTime() - firstMonday.getTime()) / 604800000) + 1;

  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + 7);

  return {
    weekKey: `${weekYear}-W${String(weekNumber).padStart(2, "0")}`,
    startsAt,
    endsAt,
  };
}

export function anonymousPeerLabel(rank: number) {
  return `Challenger #${String(rank).padStart(2, "0")}`;
}

export function getNextChallengeProgress(currentProgress: number, goalTarget: number) {
  const progress = Math.min(goalTarget, currentProgress + 1);
  return { progress, completed: progress >= goalTarget };
}

async function getOrCreateCurrentChallenge(now = new Date()) {
  const db = await getDb();
  if (!db) return null;

  const window = getWeeklyChallengeWindow(now);
  const [existing] = await db
    .select()
    .from(launchWeeklyChallenges)
    .where(eq(launchWeeklyChallenges.weekKey, window.weekKey))
    .limit(1);
  if (existing) return existing;

  try {
    await db.insert(launchWeeklyChallenges).values({
      weekKey: window.weekKey,
      startsAt: window.startsAt,
      endsAt: window.endsAt,
      title: CHALLENGE_TEMPLATE.title,
      description: CHALLENGE_TEMPLATE.description,
      goalTarget: CHALLENGE_TEMPLATE.goalTarget,
      xpBonus: CHALLENGE_TEMPLATE.xpBonus,
    });
  } catch {
    // Concurrent first visitors may both attempt to create the same unique week key.
  }

  const [created] = await db
    .select()
    .from(launchWeeklyChallenges)
    .where(eq(launchWeeklyChallenges.weekKey, window.weekKey))
    .limit(1);
  return created ?? null;
}

async function getEnrollmentForUser(userId: number, challengeId: number) {
  const db = await getDb();
  if (!db) return null;
  const [enrollment] = await db
    .select()
    .from(launchChallengeEnrollments)
    .where(and(
      eq(launchChallengeEnrollments.userId, userId),
      eq(launchChallengeEnrollments.challengeId, challengeId),
    ))
    .limit(1);
  return enrollment ?? null;
}

function toChallengeState(challenge: NonNullable<Awaited<ReturnType<typeof getOrCreateCurrentChallenge>>>, enrollment: Awaited<ReturnType<typeof getEnrollmentForUser>>) {
  if (!challenge) return null;
  return {
    challenge: {
      id: challenge.id,
      weekKey: challenge.weekKey,
      startsAt: challenge.startsAt,
      endsAt: challenge.endsAt,
      title: challenge.title,
      description: challenge.description,
      goalTarget: challenge.goalTarget,
      xpBonus: challenge.xpBonus,
    },
    enrollment: enrollment
      ? {
          progress: enrollment.progress,
          status: enrollment.status,
          joinedAt: enrollment.joinedAt,
          completedAt: enrollment.completedAt,
          progressPct: Math.min(100, Math.round((enrollment.progress / challenge.goalTarget) * 100)),
        }
      : null,
  };
}

export async function advanceWeeklyChallengeProgress(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const challenge = await getOrCreateCurrentChallenge();
  if (!challenge) return null;
  const enrollment = await getEnrollmentForUser(userId, challenge.id);
  if (!enrollment || enrollment.status === "completed") return null;

  const { progress: nextProgress, completed } = getNextChallengeProgress(
    enrollment.progress,
    challenge.goalTarget,
  );
  await db
    .update(launchChallengeEnrollments)
    .set({
      progress: nextProgress,
      status: completed ? "completed" : "active",
      completedAt: completed ? new Date() : enrollment.completedAt,
    })
    .where(eq(launchChallengeEnrollments.id, enrollment.id));

  const completionXp = completed
    ? await awardLaunchXp(userId, "weekly_challenge_complete", {
        challengeId: challenge.id,
        weekKey: challenge.weekKey,
      }, challenge.xpBonus)
    : null;

  return {
    progress: nextProgress,
    goalTarget: challenge.goalTarget,
    completed,
    completionXp,
  };
}

export const launchWeeklyChallengesRouter = router({
  getCurrentChallenge: protectedProcedure.query(async ({ ctx }) => {
    const challenge = await getOrCreateCurrentChallenge();
    if (!challenge) return null;
    const enrollment = await getEnrollmentForUser(ctx.user.id, challenge.id);
    return toChallengeState(challenge, enrollment);
  }),

  enroll: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const challenge = await getOrCreateCurrentChallenge();
    if (!challenge) throw new Error("Weekly challenge unavailable");

    let enrollment = await getEnrollmentForUser(ctx.user.id, challenge.id);
    if (!enrollment) {
      try {
        await db.insert(launchChallengeEnrollments).values({
          userId: ctx.user.id,
          challengeId: challenge.id,
        });
      } catch {
        // A second request may have created the unique enrollment already.
      }
      enrollment = await getEnrollmentForUser(ctx.user.id, challenge.id);
    }
    return toChallengeState(challenge, enrollment);
  }),

  getMyProgress: protectedProcedure.query(async ({ ctx }) => {
    const challenge = await getOrCreateCurrentChallenge();
    if (!challenge) return null;
    const enrollment = await getEnrollmentForUser(ctx.user.id, challenge.id);
    return toChallengeState(challenge, enrollment);
  }),

  getLeaderboard: protectedProcedure
    .input(z.object({ limit: z.number().int().min(3).max(50).default(10) }).default({ limit: 10 }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const challenge = await getOrCreateCurrentChallenge();
      if (!db || !challenge) {
        return { entries: [], participantCount: 0, completedCount: 0, target: 0 };
      }

      const enrollments = await db
        .select()
        .from(launchChallengeEnrollments)
        .where(eq(launchChallengeEnrollments.challengeId, challenge.id))
        .orderBy(desc(launchChallengeEnrollments.progress), launchChallengeEnrollments.joinedAt);

      const participantCount = enrollments.length;
      const completedCount = enrollments.filter((enrollment) => enrollment.status === "completed").length;
      const rankedEntries = enrollments
        .slice(0, input.limit)
        .map((enrollment, index) => ({
          rank: index + 1,
          label: enrollment.userId === ctx.user.id ? "You" : anonymousPeerLabel(index + 1),
          progress: enrollment.progress,
          target: challenge.goalTarget,
          status: enrollment.status,
          isCurrentUser: enrollment.userId === ctx.user.id,
        }));

      return {
        entries: rankedEntries,
        participantCount,
        completedCount,
        target: challenge.goalTarget,
      };
    }),
});
