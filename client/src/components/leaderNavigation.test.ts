import { describe, expect, it } from "vitest";
import { getLeaderNavigationGroups, LEADER_BOTTOM_TABS } from "./leaderNavigation";

describe("Leader Intelligence navigation", () => {
  it("keeps the primary leadership path focused and outcome-oriented", () => {
    const items = getLeaderNavigationGroups(false)
      .flatMap((group) => group.items);
    const labels = items
      .map((item) => item.label);

    expect(labels).toEqual([
      "Home",
      "Guide",
      "Practice",
      "My Edge",
      "Growth",
      "Diagnostics",
      "Behavioural Intel",
      "Insights & Reports",
      "Playbook",
      "Next Chapter",
      "Behavioural Heatmap",
      "Settings",
    ]);
    expect(items.find((item) => item.label === "Home")?.href).toBe("/leader");
    expect(labels).not.toContain("Intelligence");
    expect(labels).not.toContain("Progress");
    expect(labels).not.toContain("Patterns");
  });

  it("reveals Organisation only to tenant administrators", () => {
    const memberLabels = getLeaderNavigationGroups(false).flatMap((group) => group.items).map((item) => item.label);
    const adminLabels = getLeaderNavigationGroups(true).flatMap((group) => group.items).map((item) => item.label);

    expect(memberLabels).not.toContain("Organisation");
    expect(adminLabels).toContain("Organisation");
  });

  it("uses the focused mobile tabs", () => {
    expect(LEADER_BOTTOM_TABS.map((tab) => tab.label)).toEqual([
      "Home",
      "Guide",
      "Practice",
      "Growth",
      "More",
    ]);
  });
});
