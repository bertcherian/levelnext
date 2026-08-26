import { CTDM_DIMENSIONS } from "./criticalThinkingDiagnostic";

export type CriticalThinkingScoreSnapshot = {
  dimensionScores?: Record<string, number>;
  appliedJudgmentScore?: number | null;
  meanConfidence?: number | null;
  biasManagementScore?: number | null;
  intellectualHabitsScore?: number | null;
  environmentScore?: number | null;
};

type MeasuredValue = number | null;

function valueOrNull(value: unknown): MeasuredValue { return typeof value === "number" ? value : null; }
function delta(current: MeasuredValue, baseline: MeasuredValue) { return current === null || baseline === null ? null : current - baseline; }

export function compareCriticalThinkingCycles(baseline: CriticalThinkingScoreSnapshot, current: CriticalThinkingScoreSnapshot) {
  const dimensions = CTDM_DIMENSIONS.map((dimension) => {
    const baselineValue = valueOrNull(baseline.dimensionScores?.[dimension.id]);
    const currentValue = valueOrNull(current.dimensionScores?.[dimension.id]);
    return { id: dimension.id, label: dimension.label, baseline: baselineValue, current: currentValue, delta: delta(currentValue, baselineValue) };
  });
  const measures = [
    ["appliedJudgmentScore", "Applied judgment"],
    ["meanConfidence", "Average confidence"],
    ["biasManagementScore", "Bias-management practices"],
    ["intellectualHabitsScore", "Intellectual habits"],
    ["environmentScore", "Decision environment"],
  ].map(([key, label]) => {
    const baselineValue = valueOrNull(baseline[key as keyof CriticalThinkingScoreSnapshot]);
    const currentValue = valueOrNull(current[key as keyof CriticalThinkingScoreSnapshot]);
    return { id: key, label, baseline: baselineValue, current: currentValue, delta: delta(currentValue, baselineValue) };
  });
  const changedDimensions = dimensions.filter((dimension) => dimension.delta !== null).sort((left, right) => Math.abs(right.delta ?? 0) - Math.abs(left.delta ?? 0));
  return {
    dimensions,
    measures,
    mostChanged: changedDimensions.slice(0, 2),
    interpretation: "Read differences as changes in this response set over time, not as proof of fixed ability or causal impact. Decision context, role, learning, and the limits of a brief scenario sample can all affect results.",
  };
}
