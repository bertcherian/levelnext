import { buildMissionHistoryTimeline } from "./launchMissionHistory";
import { describe, expect, it } from "vitest";

describe("buildMissionHistoryTimeline", () => {
  it("unifies completed missions, achievements, and non-mission XP events using only the current user records", () => {
    const history = buildMissionHistoryTimeline({
      dailyMissions: [{
        id: 9,
        date: "2026-08-11",
        missions: [{
          id: "mission-1",
          title: "Polish your LinkedIn headline",
          description: "Write a value-led headline.",
          xp: 25,
          missionArea: "Brand",
          status: "complete",
          completedAt: "2026-08-11T10:00:00.000Z",
        }],
      }],
      ledgerRows: [
        {
          id: 21,
          action: "daily_mission_complete",
          xpEarned: 30,
          metadata: { missionId: "mission-1" },
          createdAt: new Date("2026-08-11T10:00:00.000Z"),
        },
        {
          id: 22,
          action: "weekly_challenge_complete",
          xpEarned: 100,
          metadata: { challengeId: 5 },
          createdAt: new Date("2026-08-11T12:00:00.000Z"),
        },
      ],
      userAchievements: [{
        id: 8,
        achievementCode: "FIRST_MISSION",
        earnedAt: new Date("2026-08-11T11:00:00.000Z"),
      }],
      achievementDefs: [{
        code: "FIRST_MISSION",
        name: "Mission Accepted",
        description: "Completed your first daily mission",
        icon: "✅",
        xpBonus: 0,
      }],
    });

    expect(history).toMatchObject({
      missionCount: 1,
      achievementCount: 1,
      xpAwarded: 130,
    });
    expect(history.events.map((event) => event.kind)).toEqual(["xp", "achievement", "mission"]);
    expect(history.events.at(-1)).toMatchObject({ title: "Polish your LinkedIn headline", xp: 30 });
  });

  it("falls back to the mission’s stored XP when legacy ledger metadata does not identify the mission", () => {
    const history = buildMissionHistoryTimeline({
      dailyMissions: [{
        id: 10,
        date: "2026-08-10",
        missions: [{
          id: "legacy-mission",
          title: "Research a target company",
          description: "Read its latest news.",
          xp: 25,
          missionArea: "Research",
          status: "complete",
        }],
      }],
      ledgerRows: [],
      userAchievements: [],
      achievementDefs: [],
    });

    expect(history.events).toHaveLength(1);
    expect(history.events[0]).toMatchObject({ kind: "mission", xp: 25 });
  });
});
