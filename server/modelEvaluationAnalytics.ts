export const MODEL_EVALUATION_PRICING = {
  claude: { inputPerMillionUsd: 1, outputPerMillionUsd: 5 },
  qwen: { inputPerMillionUsd: 0.12, outputPerMillionUsd: 0.5 },
} as const;

type Usage = {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
} | null;

export type EvaluationAnalyticsRecord = {
  preferredModel: "claude" | "qwen" | "tie" | "neither" | null;
  reviewedAt: Date | null;
  reviewScores: { clarity: number; usefulness: number; leadershipTone: number } | null;
  claudeLatencyMs: number | null;
  qwenLatencyMs: number | null;
  claudeUsage: Usage;
  qwenUsage: Usage;
};

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

export function estimateModelCost(usage: Usage, model: "claude" | "qwen") {
  if (!usage) return 0;
  const pricing = MODEL_EVALUATION_PRICING[model];
  return ((usage.promptTokens ?? 0) * pricing.inputPerMillionUsd + (usage.completionTokens ?? 0) * pricing.outputPerMillionUsd) / 1_000_000;
}

export function buildModelEvaluationDashboard(records: EvaluationAnalyticsRecord[]) {
  const reviewed = records.filter((record) => record.reviewedAt && record.preferredModel);
  const claudeWins = reviewed.filter((record) => record.preferredModel === "claude").length;
  const qwenWins = reviewed.filter((record) => record.preferredModel === "qwen").length;
  const ties = reviewed.filter((record) => record.preferredModel === "tie").length;
  const neither = reviewed.filter((record) => record.preferredModel === "neither").length;
  const decisiveReviews = claudeWins + qwenWins;
  const claudeCostUsd = records.reduce((sum, record) => sum + estimateModelCost(record.claudeUsage, "claude"), 0);
  const qwenCostUsd = records.reduce((sum, record) => sum + estimateModelCost(record.qwenUsage, "qwen"), 0);
  const qwenAtClaudeRateUsd = records.reduce((sum, record) => sum + estimateModelCost(record.qwenUsage, "claude"), 0);
  const qualityAverages = reviewed
    .filter((record) => record.reviewScores)
    .map((record) => {
      const scores = record.reviewScores!;
      return (scores.clarity + scores.usefulness + scores.leadershipTone) / 3;
    });

  return {
    totalEvaluations: records.length,
    reviewedEvaluations: reviewed.length,
    preference: {
      claudeWins,
      qwenWins,
      ties,
      neither,
      decisiveReviews,
      claudeWinRate: decisiveReviews ? claudeWins / decisiveReviews : null,
      qwenWinRate: decisiveReviews ? qwenWins / decisiveReviews : null,
    },
    quality: {
      averageScore: average(qualityAverages),
      scoredReviews: qualityAverages.length,
    },
    latency: {
      claudeAverageMs: average(records.map((record) => record.claudeLatencyMs)),
      qwenAverageMs: average(records.map((record) => record.qwenLatencyMs)),
    },
    cost: {
      claudeEstimatedUsd: claudeCostUsd,
      qwenEstimatedUsd: qwenCostUsd,
      qwenAtClaudeRateUsd,
      qwenEstimatedSavingsUsd: qwenAtClaudeRateUsd - qwenCostUsd,
    },
  };
}
