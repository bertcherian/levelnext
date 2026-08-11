import { describe, expect, it } from "vitest";
import { getLevelForXp, LEVELS, XP_VALUES } from "./launchProgress";

describe("Launch XP progression", () => {
  it("keeps the canonical daily mission value stable", () => {
    expect(XP_VALUES.daily_mission_complete).toBe(25);
  });

  it("starts every learner as an Explorer with a Builder next milestone", () => {
    expect(getLevelForXp(0)).toMatchObject({
      name: "Explorer",
      nextLevel: { name: "Builder", minXp: 300 },
      xpToNext: 300,
      progressPct: 0,
    });
  });

  it("transitions a learner at the Builder threshold", () => {
    expect(getLevelForXp(300)).toMatchObject({
      name: "Builder",
      nextLevel: { name: "Professional", minXp: 700 },
      xpToNext: 400,
      progressPct: 0,
    });
  });

  it("caps the final level at 100 percent progress", () => {
    const finalLevel = LEVELS.at(-1)!;
    expect(getLevelForXp(finalLevel.minXp + 10_000)).toMatchObject({
      name: "Career Starter",
      nextLevel: null,
      xpToNext: 0,
      progressPct: 100,
    });
  });
});
