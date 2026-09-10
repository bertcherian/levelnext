export const ACADEMY_DIMENSIONS = ["understand", "navigate", "apply", "explain"] as const;
export type AcademyDimension = (typeof ACADEMY_DIMENSIONS)[number];

export const ACADEMY_ROLE_TRACKS = [
  "developer",
  "sales_growth",
  "success_partner",
  "gtm_marketing",
  "operations",
  "leadership",
  "other",
] as const;
export type AcademyRoleTrack = (typeof ACADEMY_ROLE_TRACKS)[number];

export const ACADEMY_FLUENCY_LEVELS = [
  "product_aware",
  "product_working",
  "product_confident",
  "product_fluent",
  "product_guide",
] as const;
export type AcademyFluencyLevel = (typeof ACADEMY_FLUENCY_LEVELS)[number];

export type AcademyDimensionScores = Record<AcademyDimension, number>;

export const ACADEMY_DIMENSION_WEIGHTS: Record<AcademyDimension, number> = {
  understand: 0.2,
  navigate: 0.2,
  apply: 0.3,
  explain: 0.3,
};

export function scoreAcademyFluency(scores: AcademyDimensionScores): number {
  return Math.round(
    ACADEMY_DIMENSIONS.reduce(
      (total, dimension) => total + scores[dimension] * ACADEMY_DIMENSION_WEIGHTS[dimension],
      0,
    ),
  );
}

export function academyFluencyLevel(score: number): AcademyFluencyLevel {
  if (score >= 90) return "product_guide";
  if (score >= 75) return "product_fluent";
  if (score >= 60) return "product_confident";
  if (score >= 40) return "product_working";
  return "product_aware";
}

export function academyStageForScore(score: number): string {
  if (score >= 75) return "explain";
  if (score >= 40) return "experience";
  return "diagnostic";
}

export function confidenceSignal(isCorrect: boolean, confidence: "low" | "medium" | "high") {
  if (isCorrect && confidence === "high") return "strong_understanding" as const;
  if (isCorrect && confidence === "low") return "needs_reinforcement" as const;
  if (!isCorrect && confidence === "high") return "misconception" as const;
  return "learning_gap" as const;
}

export function slugToLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
