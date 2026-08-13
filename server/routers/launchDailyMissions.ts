import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { launchDailyMissions, launchMissionReflections, launchUserProgress } from "../../drizzle/schema";
import { awardLaunchXp } from "./launchProgress";
import { advanceWeeklyChallengeProgress } from "./launchWeeklyChallenges";
import { createLaunchMissionContextKey, createPersonalizedDailyMissions, shouldRefreshPendingMissions } from "./launchMissionPersonalization";

// ─── Mission Templates (fallback if LLM fails) ────────────────────────────────
const MISSION_TEMPLATES = [
  { title: "Update your LinkedIn headline", description: "Write a headline that leads with value, not your job title. Use the format: [What you do] + [Who you help] + [Result you deliver].", xp: 25, missionArea: "Brand" },
  { title: "Research one target company", description: "Pick one company you want to work at. Find their latest news, understand their mission, and note one thing that excites you about working there.", xp: 25, missionArea: "Research" },
  { title: "Send one warm outreach message", description: "Find someone in your target role on LinkedIn. Send a genuine, specific message — not a template. Ask one thoughtful question.", xp: 40, missionArea: "Network" },
  { title: "Tailor your resume for one role", description: "Pick a job posting. Rewrite your top 3 bullet points to mirror the language and priorities in that job description.", xp: 30, missionArea: "Resume" },
  { title: "Practice the STAR method", description: "Choose one achievement from your past. Write it out using Situation, Task, Action, Result. Keep the Result specific and quantified.", xp: 25, missionArea: "Interview" },
  { title: "Add a skills section to your LinkedIn", description: "Add 5 skills that are relevant to your target role. Prioritise skills that appear in job descriptions you've been reading.", xp: 20, missionArea: "Brand" },
  { title: "Write your elevator pitch", description: "Write a 60-second version of who you are, what you do, and what you're looking for. Say it out loud three times.", xp: 25, missionArea: "Communication" },
  { title: "Apply to one role today", description: "Find one role that is 70–80% match (not 100%). Submit a tailored application. Done is better than perfect.", xp: 30, missionArea: "Applications" },
  { title: "Ask for one informational interview", description: "Reach out to someone in a role or company you admire. Ask for 20 minutes to learn about their career path.", xp: 35, missionArea: "Network" },
  { title: "Review your interview answers", description: "Pick 3 common interview questions. Write out your answers. Time yourself. Cut anything that takes longer than 2 minutes.", xp: 25, missionArea: "Interview" },
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function pickThreeMissions() {
  const shuffled = [...MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((m, i) => ({
    id: `m${i + 1}_${Date.now()}`,
    title: m.title,
    description: m.description,
    xp: m.xp,
    missionArea: m.missionArea,
    status: "pending" as const,
  }));
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const launchDailyMissionsRouter = router({
  // Get today's missions — generate if not yet created
  getToday: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const today = getTodayDate();

    // Read the learner context first so stale pending missions can be replaced
    // when an onboarding role or industry changes.
    const [progress] = await db
      .select()
      .from(launchUserProgress)
      .where(eq(launchUserProgress.userId, ctx.user.id))
      .limit(1);
    const contextKey = progress?.targetRole && progress?.targetIndustry
      ? createLaunchMissionContextKey(progress.targetRole, progress.targetIndustry)
      : null;

    const [existing] = await db
      .select()
      .from(launchDailyMissions)
      .where(
        and(
          eq(launchDailyMissions.userId, ctx.user.id),
          eq(launchDailyMissions.date, today)
        )
      )
      .limit(1);

    const existingMissions = existing?.missions as Array<{ contextKey?: string; status?: "pending" | "complete" }> | undefined;
    const shouldRefresh = shouldRefreshPendingMissions(existingMissions, contextKey);
    if (existing && !shouldRefresh) return existing;

    if (existing && contextKey && progress?.targetRole && progress.targetIndustry) {
      const missions = createPersonalizedDailyMissions({
        targetRole: progress.targetRole,
        targetIndustry: progress.targetIndustry,
        date: today,
      });
      await db.update(launchDailyMissions).set({ missions }).where(eq(launchDailyMissions.id, existing.id));
      return { ...existing, missions };
    }

    let missions;
    if (progress?.targetRole && progress?.targetIndustry) {
      missions = createPersonalizedDailyMissions({
        targetRole: progress.targetRole,
        targetIndustry: progress.targetIndustry,
        date: today,
      });
    }
    if (!missions) {
      missions = pickThreeMissions();
    }

    await db.insert(launchDailyMissions).values({
      userId: ctx.user.id,
      date: today,
      missions,
    });

    const [created] = await db
      .select()
      .from(launchDailyMissions)
      .where(
        and(
          eq(launchDailyMissions.userId, ctx.user.id),
          eq(launchDailyMissions.date, today)
        )
      )
      .limit(1);

    return created ?? null;
  }),

  // Complete a specific mission
  completeMission: protectedProcedure
    .input(z.object({ missionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const today = getTodayDate();

      const [record] = await db
        .select()
        .from(launchDailyMissions)
        .where(
          and(
            eq(launchDailyMissions.userId, ctx.user.id),
            eq(launchDailyMissions.date, today)
          )
        )
        .limit(1);

      if (!record) throw new Error("No missions found for today");

      const existingMission = (record.missions as Array<{
        id: string;
        title: string;
        description: string;
        xp: number;
        missionArea: string;
        status: "pending" | "complete";
        completedAt?: string;
      }>).find((mission) => mission.id === input.missionId);
      if (!existingMission) throw new Error("Mission not found");
      if (existingMission.status === "complete") {
        return { xpEarned: 0, allComplete: record.missions.every((mission) => mission.status === "complete"), missions: record.missions, alreadyComplete: true, newAchievements: [] };
      }

      const missions = (record.missions as Array<{
        id: string;
        title: string;
        description: string;
        xp: number;
        missionArea: string;
        status: "pending" | "complete";
        completedAt?: string;
      }>).map((m) =>
        m.id === input.missionId
          ? { ...m, status: "complete" as const, completedAt: new Date().toISOString() }
          : m
      );

      await db
        .update(launchDailyMissions)
        .set({ missions })
        .where(eq(launchDailyMissions.id, record.id));

      const completedMission = missions.find((m) => m.id === input.missionId);
      const allComplete = missions.every((m) => m.status === "complete");
      const xpResult = await awardLaunchXp(ctx.user.id, "daily_mission_complete", {
        missionId: input.missionId,
        missionArea: completedMission?.missionArea ?? "General",
      }, completedMission?.xp ?? 25);
      const challengeProgress = await advanceWeeklyChallengeProgress(ctx.user.id);
      const challengeCompletion = challengeProgress?.completionXp;

      return {
        xpEarned: xpResult.xpEarned + (challengeCompletion?.xpEarned ?? 0),
        missionXpEarned: xpResult.xpEarned,
        challengeBonusXp: challengeCompletion?.xpEarned ?? 0,
        allComplete,
        missions,
        alreadyComplete: false,
        newAchievements: [...xpResult.newAchievements, ...(challengeCompletion?.newAchievements ?? [])],
        leveledUp: xpResult.leveledUp || Boolean(challengeCompletion?.leveledUp),
        challengeProgress: challengeProgress
          ? {
              progress: challengeProgress.progress,
              goalTarget: challengeProgress.goalTarget,
              completed: challengeProgress.completed,
            }
          : null,
      };
    }),

  // Store one optional, private reflection after a learner completes today's mission.
  saveReflection: protectedProcedure
    .input(z.object({ missionId: z.string(), reflectionText: z.string().trim().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const today = getTodayDate();
      const [record] = await db
        .select()
        .from(launchDailyMissions)
        .where(and(eq(launchDailyMissions.userId, ctx.user.id), eq(launchDailyMissions.date, today)))
        .limit(1);
      const mission = (record?.missions as Array<{ id: string; title: string; status: "pending" | "complete" }> | undefined)
        ?.find((entry) => entry.id === input.missionId);
      if (!mission || mission.status !== "complete") throw new Error("Complete the mission before reflecting on it");

      const [existing] = await db
        .select()
        .from(launchMissionReflections)
        .where(and(
          eq(launchMissionReflections.userId, ctx.user.id),
          eq(launchMissionReflections.missionId, input.missionId),
        ))
        .limit(1);
      if (existing) {
        await db.update(launchMissionReflections)
          .set({ reflectionText: input.reflectionText })
          .where(eq(launchMissionReflections.id, existing.id));
      } else {
        await db.insert(launchMissionReflections).values({
          userId: ctx.user.id,
          missionId: input.missionId,
          missionDate: today,
          missionTitle: mission.title,
          reflectionText: input.reflectionText,
        });
      }
      return { success: true };
    }),

  // Get mission history (last 7 days)
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(launchDailyMissions)
      .where(eq(launchDailyMissions.userId, ctx.user.id))
      .orderBy(launchDailyMissions.date)
      .limit(7);
  }),
});
