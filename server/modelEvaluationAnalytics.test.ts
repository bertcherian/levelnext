import { describe, expect, it } from "vitest";
import { buildModelEvaluationDashboard, estimateModelCost } from "./modelEvaluationAnalytics";

describe("model evaluation analytics", () => {
  it("calculates reviewed win rates, quality, latency, and transparent token-cost estimates", () => {
    const dashboard = buildModelEvaluationDashboard([
      {
        preferredModel: "claude",
        reviewedAt: new Date("2026-08-01"),
        reviewScores: { clarity: 5, usefulness: 4, leadershipTone: 3 },
        claudeLatencyMs: 1_000,
        qwenLatencyMs: 500,
        claudeUsage: { promptTokens: 1_000_000, completionTokens: 1_000_000, totalTokens: 2_000_000 },
        qwenUsage: { promptTokens: 1_000_000, completionTokens: 1_000_000, totalTokens: 2_000_000 },
      },
      {
        preferredModel: "qwen",
        reviewedAt: new Date("2026-08-02"),
        reviewScores: { clarity: 3, usefulness: 3, leadershipTone: 3 },
        claudeLatencyMs: 3_000,
        qwenLatencyMs: 1_500,
        claudeUsage: null,
        qwenUsage: { promptTokens: 1_000_000, completionTokens: 0, totalTokens: 1_000_000 },
      },
      {
        preferredModel: "tie",
        reviewedAt: new Date("2026-08-03"),
        reviewScores: { clarity: 4, usefulness: 5, leadershipTone: 3 },
        claudeLatencyMs: null,
        qwenLatencyMs: null,
        claudeUsage: null,
        qwenUsage: null,
      },
    ]);

    expect(dashboard.preference).toMatchObject({ claudeWins: 1, qwenWins: 1, ties: 1, decisiveReviews: 2, claudeWinRate: 0.5, qwenWinRate: 0.5 });
    expect(dashboard.quality).toMatchObject({ averageScore: 3.6666666666666665, scoredReviews: 3 });
    expect(dashboard.latency).toEqual({ claudeAverageMs: 2_000, qwenAverageMs: 1_000 });
    expect(dashboard.cost.claudeEstimatedUsd).toBe(6);
    expect(dashboard.cost.qwenEstimatedUsd).toBeCloseTo(0.74);
    expect(dashboard.cost.qwenEstimatedSavingsUsd).toBeCloseTo(6.26);
  });

  it("returns zero for missing token usage", () => {
    expect(estimateModelCost(null, "qwen")).toBe(0);
  });
});
