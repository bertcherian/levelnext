import { describe, expect, it } from "vitest";
import { compareCriticalThinkingCycles } from "./criticalThinkingComparison";

describe("compareCriticalThinkingCycles", () => {
  it("keeps dimensions and separate measures distinct while calculating transparent deltas", () => {
    const comparison = compareCriticalThinkingCycles(
      { dimensionScores: { frame: 61, question: 72 }, appliedJudgmentScore: 64, meanConfidence: 70, environmentScore: 55 },
      { dimensionScores: { frame: 74, question: 68 }, appliedJudgmentScore: 77, meanConfidence: 71, environmentScore: 55 },
    );
    expect(comparison.dimensions.find((dimension) => dimension.id === "frame")).toMatchObject({ baseline: 61, current: 74, delta: 13 });
    expect(comparison.dimensions.find((dimension) => dimension.id === "question")).toMatchObject({ baseline: 72, current: 68, delta: -4 });
    expect(comparison.measures.find((measure) => measure.id === "appliedJudgmentScore")).toMatchObject({ delta: 13 });
    expect(comparison.measures.find((measure) => measure.id === "environmentScore")).toMatchObject({ delta: 0 });
    expect(comparison.measures.find((measure) => measure.id === "biasManagementScore")?.delta).toBeNull();
  });
});
