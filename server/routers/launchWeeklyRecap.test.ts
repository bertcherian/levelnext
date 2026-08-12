import { describe, expect, it } from "vitest";
import { countCompletedMissions } from "./launchWeeklyRecap";

describe("launchWeeklyRecap", () => {
  it("aggregates only completed private daily-mission records", () => {
    expect(countCompletedMissions([
      { missions: [{ status: "complete" }, { status: "pending" }] },
      { missions: [{ status: "complete" }, { status: "complete" }] },
    ])).toBe(3);
  });

  it("returns zero for a learner with no mission records in the recap window", () => {
    expect(countCompletedMissions([])).toBe(0);
  });
});
