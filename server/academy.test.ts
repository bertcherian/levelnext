import { describe, expect, it } from "vitest";
import {
  academyFluencyLevel,
  academyStageForScore,
  confidenceSignal,
  scoreAcademyFluency,
  type AcademyDimensionScores,
} from "../shared/modules/academy";
import { ACADEMY_DIAGNOSTIC_ITEMS } from "./academyService";
import { ACADEMY_SEED_KNOWLEDGE } from "./academySeedData";

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

  it("includes newcomer guidance and deep-link metadata for leadership transition tiers", () => {
    const family = ACADEMY_SEED_KNOWLEDGE.find((item) => item.slug === "product-family-leadership-core");
    const content = family?.content as Record<string, unknown>;
    const tiers = content.tiers as Array<Record<string, unknown>>;

    expect(content.howToUnderstand).toBeTruthy();
    expect(content.definitions).toBeTruthy();
    expect(content.tooltips).toBeTruthy();
    expect(tiers).toHaveLength(5);
    expect(tiers.every((tier) => typeof tier.route === "string")).toBe(true);
    expect(tiers.every((tier) => Array.isArray(tier.primaryDerailers))).toBe(true);
    expect(tiers.every((tier) => Array.isArray(tier.targetPersonas))).toBe(true);
    expect(tiers.every((tier) => Array.isArray(tier.recommendedBehaviouralMoves))).toBe(true);
  });

  it("explains every Behavioural Intelligence stage for newcomers", () => {
    const engine = ACADEMY_SEED_KNOWLEDGE.find((item) => item.slug === "engine-behavioural-intelligence");
    const stages = (engine?.content as Record<string, unknown>).stages as Array<Record<string, unknown>>;

    expect(stages).toHaveLength(6);
    expect(stages.every((stage) => typeof stage.label === "string")).toBe(true);
    expect(stages.every((stage) => typeof stage.whatItMeans === "string" && String(stage.whatItMeans).length > 40)).toBe(true);
    expect(stages.every((stage) => typeof stage.example === "string" && String(stage.example).length > 20)).toBe(true);
    expect(stages.every((stage) => typeof stage.output === "string" && String(stage.output).length > 20)).toBe(true);
  });
});
