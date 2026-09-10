import { describe, expect, it } from "vitest";
import {
  academyFluencyLevel,
  academyStageForScore,
  confidenceSignal,
  scoreAcademyFluency,
  type AcademyDimensionScores,
} from "../shared/modules/academy";
import { ACADEMY_DIAGNOSTIC_ITEMS } from "./academyService";

describe("Academy Product Fluency calculations", () => {
  it("calculates weighted fluency score correctly across 4 dimensions", () => {
    const scores: AcademyDimensionScores = {
      understand: 80, // 0.2 * 80 = 16
      navigate: 70,   // 0.2 * 70 = 14
      apply: 85,      // 0.3 * 85 = 25.5
      explain: 75,    // 0.3 * 75 = 22.5
    };
    // Total = 16 + 14 + 25.5 + 22.5 = 78
    const total = scoreAcademyFluency(scores);
    expect(total).toBe(78);
    expect(academyFluencyLevel(total)).toBe("product_fluent");
    expect(academyStageForScore(total)).toBe("explain");
  });

  it("classifies confidence signals into learning gaps and misconceptions", () => {
    expect(confidenceSignal(true, "high")).toBe("strong_understanding");
    expect(confidenceSignal(true, "low")).toBe("needs_reinforcement");
    expect(confidenceSignal(false, "high")).toBe("misconception");
    expect(confidenceSignal(false, "low")).toBe("learning_gap");
  });

  it("includes all 4 dimensions in diagnostic baseline items", () => {
    const dimensions = new Set(ACADEMY_DIAGNOSTIC_ITEMS.map((item) => item.dimension));
    expect(dimensions.has("understand")).toBe(true);
    expect(dimensions.has("navigate")).toBe(true);
    expect(dimensions.has("apply")).toBe(true);
    expect(dimensions.has("explain")).toBe(true);
  });
});
