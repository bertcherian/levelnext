import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  launchAchievements,
  launchDailyMissions,
  launchUserAchievements,
  launchXpLedger,
} from "../../drizzle/schema";

type MissionRecord = {
  id: string;
  title: string;
  description: string;
  xp: number;
  missionArea: string;
  status: "pending" | "complete";
  completedAt?: string;
};

const XP_EVENT_META: Record<string, { title: string; icon: string; detail: string }> = {
  onboarding_complete: { title: "Ready to Launch", icon: "🎯", detail: "Onboarding complete" },
  career_compass_complete: { title: "Career Compass complete", icon: "🧭", detail: "Career direction unlocked" },
  resume_uploaded: { title: "Resume added", icon: "📄", detail: "Resume Makeover progress" },
  resume_score_improved: { title: "Resume level-up", icon: "📈", detail: "Resume score improved" },
  linkedin_section_optimised: { title: "Profile polished", icon: "✨", detail: "LinkedIn improved" },
  mock_interview_complete: { title: "Interview practice", icon: "🎤", detail: "Practice session complete" },
  application_submitted: { title: "Application submitted", icon: "🚀", detail: "A new opportunity is in motion" },
  networking_message_sent: { title: "Connection made", icon: "🤝", detail: "Networking momentum" },
  skill_module_complete: { title: "Skill Sprint complete", icon: "⚡", detail: "Skill development progress" },
  weekly_challenge_complete: { title: "Weekly challenge complete", icon: "🏆", detail: "Momentum Orbit bonus secured" },
};

function timestampForMission(recordDate: string, completedAt?: string) {
  return completedAt ? new Date(completedAt) : new Date(`${recordDate}T12:00:00.000Z`);
}

export function buildMissionHistoryTimeline({
  dailyMissions,
  ledgerRows,
  userAchievements,
  achievementDefs,
}: {
  dailyMissions: Array<{ id: number; date: string; missions: unknown }>;
  ledgerRows: Array<{ id: number; action: string; xpEarned: number; metadata: unknown; createdAt: Date }>;
  userAchievements: Array<{ id: number; achievementCode: string; earnedAt: Date }>;
  achievementDefs: Array<{ code: string; name: string; description: string | null; icon: string | null; xpBonus: number }>;
}) {
  const missionLedger = new Map<string, { xpEarned: number }>();
  for (const row of ledgerRows) {
    if (row.action !== "daily_mission_complete") continue;
    const missionId = (row.metadata as { missionId?: string } | null)?.missionId;
    if (missionId) missionLedger.set(missionId, { xpEarned: row.xpEarned });
  }

  const achievementByCode = new Map(achievementDefs.map((achievement) => [achievement.code, achievement]));
  const missionEvents = dailyMissions.flatMap((record) => {
    const missions = record.missions as MissionRecord[];
    return missions
      .filter((mission) => mission.status === "complete")
      .map((mission) => ({
        id: `mission-${record.id}-${mission.id}`,
        kind: "mission" as const,
        title: mission.title,
        detail: `${mission.missionArea} mission complete`,
        icon: "✓",
        xp: missionLedger.get(mission.id)?.xpEarned ?? mission.xp,
        occurredAt: timestampForMission(record.date, mission.completedAt),
      }));
  });

  const achievementEvents = userAchievements.map((earned) => {
    const achievement = achievementByCode.get(earned.achievementCode);
    return {
      id: `achievement-${earned.id}`,
      kind: "achievement" as const,
      title: achievement?.name ?? earned.achievementCode.replaceAll("_", " "),
      detail: achievement?.description ?? "Achievement unlocked",
      icon: achievement?.icon ?? "✦",
      xp: achievement?.xpBonus ?? 0,
      occurredAt: earned.earnedAt,
    };
  });

  const xpEvents = ledgerRows
    .filter((row) => row.action !== "daily_mission_complete")
    .map((row) => {
      const meta = XP_EVENT_META[row.action] ?? {
        title: row.action.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
        icon: "✦",
        detail: "XP earned",
      };
      return {
        id: `xp-${row.id}`,
        kind: "xp" as const,
        title: meta.title,
        detail: meta.detail,
        icon: meta.icon,
        xp: row.xpEarned,
        occurredAt: row.createdAt,
      };
    });

  const events = [...missionEvents, ...achievementEvents, ...xpEvents]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  return {
    events,
    missionCount: missionEvents.length,
    achievementCount: achievementEvents.length,
    xpAwarded: events.reduce((total, event) => total + event.xp, 0),
  };
}

export const launchMissionHistoryRouter = router({
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().int().min(10).max(100).default(50) }).default({ limit: 50 }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { events: [], missionCount: 0, achievementCount: 0, xpAwarded: 0 };

      const [dailyMissions, ledgerRows, userAchievements, achievementDefs] = await Promise.all([
        db.select().from(launchDailyMissions).where(eq(launchDailyMissions.userId, ctx.user.id)),
        db.select().from(launchXpLedger).where(eq(launchXpLedger.userId, ctx.user.id)),
        db.select().from(launchUserAchievements).where(eq(launchUserAchievements.userId, ctx.user.id)),
        db.select().from(launchAchievements),
      ]);

      const history = buildMissionHistoryTimeline({
        dailyMissions,
        ledgerRows,
        userAchievements,
        achievementDefs,
      });

      return { ...history, events: history.events.slice(0, input.limit) };
    }),
});
