import { describe, expect, it } from "vitest";
import {
  LAUNCH_INDUSTRY_PROFILES,
  LAUNCH_ROLE_PROFILES,
  createLaunchMissionContextKey,
  createPersonalizedDailyMissions,
  shouldRefreshPendingMissions,
} from "./launchMissionPersonalization";

const DATE = "2026-08-13";

describe("Launch daily mission personalisation", () => {
  it("creates exactly three missions for every target-role and industry combination", () => {
    for (const role of LAUNCH_ROLE_PROFILES) {
      for (const industry of LAUNCH_INDUSTRY_PROFILES) {
        const missions = createPersonalizedDailyMissions({ targetRole: role.id, targetIndustry: industry.id, date: DATE });
        const content = missions.map((mission) => `${mission.title} ${mission.description}`).join(" ");

        expect(missions).toHaveLength(3);
        expect(content).toContain(role.label);
        expect(content).toContain(industry.label);
        expect(new Set(missions.map((mission) => mission.missionArea)).size).toBe(3);
        expect(missions.every((mission) => mission.contextKey === `${role.id}:${industry.id}`)).toBe(true);
      }
    }
  });

  it("does not leak software-engineering tasks into a Finance and Media path", () => {
    const missions = createPersonalizedDailyMissions({ targetRole: "finance", targetIndustry: "media", date: DATE });
    const content = missions.map((mission) => `${mission.title} ${mission.description}`).join(" ").toLowerCase();

    expect(content).toContain("finance & accounting");
    expect(content).toContain("media & entertainment");
    expect(content).not.toMatch(/github|repository|readme|technical visibility|engineering leader|software engineer/);
  });

  it("normalises stored label values and produces a stable relevance key", () => {
    expect(createLaunchMissionContextKey("Finance & Accounting", "Media & Entertainment")).toBe("finance:media");
    expect(createLaunchMissionContextKey("UX / Product Designer", "Education & EdTech")).toBe("designer:education");
  });

  it("refreshes an all-pending legacy mission set when learner context changes", () => {
    expect(shouldRefreshPendingMissions([{ status: "pending" }], "finance:media")).toBe(true);
    expect(shouldRefreshPendingMissions([{ status: "pending", contextKey: "finance:media" }], "finance:media")).toBe(false);
    expect(shouldRefreshPendingMissions([{ status: "complete" }], "finance:media")).toBe(false);
  });
});
