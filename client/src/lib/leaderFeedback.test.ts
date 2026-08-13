import { describe, expect, it } from "vitest";
import { getImmediateResultSummary } from "./leaderFeedback";

describe("getImmediateResultSummary", () => {
  it("turns a diagnostic result into a concise first-minute action", () => {
    const summary = getImmediateResultSummary({
      edgeScore: 68.4,
      archetype: "emerging_executive_voice",
      archetypeTagline: "Your voice is gaining clarity and reach.",
      zone: "capable_communicator",
      dimensionScores: { executive_presence: 74, stakeholder_alignment: 42 },
    }, "Executive Communication");

    expect(summary).toMatchObject({
      score: 68,
      profile: "Emerging Executive Voice",
      zone: "Capable Communicator",
      growthFocus: "Stakeholder Alignment",
    });
    expect(summary.commitment).toContain("stakeholder alignment");
  });

  it("uses an archetype risk when dimension scores are unavailable", () => {
    const summary = getImmediateResultSummary({
      edgeScore: 54,
      archetype: "technical_operator",
      zone: "developing_communicator",
      archetypeRisks: ["Over-explaining under pressure"],
    }, "Executive Communication");

    expect(summary.growthFocus).toBe("Over-explaining under pressure");
  });
});
