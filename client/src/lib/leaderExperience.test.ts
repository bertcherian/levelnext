import { describe, expect, it } from "vitest";
import { getNextLeadershipMove } from "./leaderExperience";

describe("getNextLeadershipMove", () => {
  it("prioritises the next core diagnostic before other activity", () => {
    const move = getNextLeadershipMove([], [
      { id: 1, title: "Prepare the executive update", description: "Practise a concise opening.", status: "pending" },
    ]);

    expect(move).toMatchObject({
      kind: "diagnostic",
      moduleCode: "ECI",
      href: "/diagnostics/eci",
    });
  });

  it("surfaces a pending mission after the core baseline is complete", () => {
    const move = getNextLeadershipMove(["ECI", "LII", "LDI", "STI"], [
      { id: 2, title: "Clarify the decision", description: "Name the trade-off before your meeting.", status: "pending" },
    ]);

    expect(move).toMatchObject({
      kind: "mission",
      title: "Clarify the decision",
      ctaLabel: "Mark complete",
    });
  });

  it("uses Guide when there is no outstanding baseline or mission", () => {
    const move = getNextLeadershipMove(["ECI", "LII", "LDI", "STI"], []);

    expect(move).toMatchObject({
      kind: "guide",
      href: "/guide",
      ctaLabel: "Open Guide",
    });
  });
});
