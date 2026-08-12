import { and, eq, gte, lt } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  launchChallengeEnrollments,
  launchDailyMissions,
  launchMissionReflections,
  launchUserProgress,
  launchXpLedger,
} from "../../drizzle/schema";
import {
  getOrCreateCurrentChallenge,
  getPersonalizedChallengeVariant,
  getWeeklyChallengeWindow,
} from "./launchWeeklyChallenges";

export function countCompletedMissions(
  records: Array<{ missions: Array<{ status: "pending" | "complete" }> }>,
) {
  return records.reduce(
    (total, record) => total + record.missions.filter((mission) => mission.status === "complete").length,
    0,
  );
}

export const launchWeeklyRecapRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const window = getWeeklyChallengeWindow();
    const startDate = window.startsAt.toISOString().slice(0, 10);
    const endDate = window.endsAt.toISOString().slice(0, 10);
    const [xpEvents, missionRecords, reflections, challenge] = await Promise.all([
      db.select({ xpEarned: launchXpLedger.xpEarned })
        .from(launchXpLedger)
        .where(and(eq(launchXpLedger.userId, ctx.user.id), gte(launchXpLedger.createdAt, window.startsAt), lt(launchXpLedger.createdAt, window.endsAt))),
      db.select({ missions: launchDailyMissions.missions })
        .from(launchDailyMissions)
        .where(and(eq(launchDailyMissions.userId, ctx.user.id), gte(launchDailyMissions.date, startDate), lt(launchDailyMissions.date, endDate))),
      db.select({ id: launchMissionReflections.id })
        .from(launchMissionReflections)
        .where(and(eq(launchMissionReflections.userId, ctx.user.id), gte(launchMissionReflections.createdAt, window.startsAt), lt(launchMissionReflections.createdAt, window.endsAt))),
      getOrCreateCurrentChallenge(),
    ]);
    const enrollment = challenge
      ? (await db.select().from(launchChallengeEnrollments).where(and(
          eq(launchChallengeEnrollments.userId, ctx.user.id),
          eq(launchChallengeEnrollments.challengeId, challenge.id),
        )).limit(1))[0]
      : null;

    const [progress] = await db
      .select({ targetRole: launchUserProgress.targetRole, targetIndustry: launchUserProgress.targetIndustry })
      .from(launchUserProgress)
      .where(eq(launchUserProgress.userId, ctx.user.id))
      .limit(1);
    const variant = getPersonalizedChallengeVariant(window.weekKey, progress?.targetRole, progress?.targetIndustry);

    return {
      weekKey: window.weekKey,
      startsAt: window.startsAt,
      endsAt: window.endsAt,
      xpEarned: xpEvents.reduce((total, event) => total + event.xpEarned, 0),
      completedMissions: countCompletedMissions(missionRecords as Array<{ missions: Array<{ status: "pending" | "complete" }> }>),
      reflectionCount: reflections.length,
      challenge: challenge ? {
        title: variant.title,
        goalTarget: challenge.goalTarget,
        progress: enrollment?.progress ?? 0,
        status: enrollment?.status ?? "not_joined",
        completed: enrollment?.status === "completed",
      } : null,
    };
  }),
});
