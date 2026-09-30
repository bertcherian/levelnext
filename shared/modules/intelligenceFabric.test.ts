import { describe, expect, it } from "vitest";
import {
  deterministicInterventionFallback,
  INTELLIGENCE_MODEL_REGISTRY,
  INTELLIGENCE_TIERS,
  normaliseConfidence,
} from "./intelligenceFabric";

describe("Intelligence Fabric contracts", () => {
  it("keeps the tier model complete and vendor-neutral", () => {
    expect(INTELLIGENCE_TIERS).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(INTELLIGENCE_MODEL_REGISTRY.find((entry) => entry.model === "jev-latest")).toMatchObject({
      provider: "typesafe",
      tier: 2,
      productionApproved: false,
    });
  });

  it("uses the smallest deterministic intervention where it is enough", () => {
    expect(deterministicInterventionFallback("I keep postponing a difficult conversation because they may become defensive.")).toMatchObject({
      intervention: "simulation",
    });
    expect(deterministicInterventionFallback("The deadline is stalled and we need an owner by Friday.")).toMatchObject({
      intervention: "commitment",
    });
    expect(deterministicInterventionFallback("I want to rehearse the opening before I speak.")).toMatchObject({
      intervention: "practice",
    });
  });

  it("routes potential safety-sensitive language to human support", () => {
    expect(deterministicInterventionFallback("There is a harassment concern in this situation.")).toMatchObject({
      intervention: "human_support",
    });
  });

  it("normalises structured confidence without treating it as truth", () => {
    expect(normaliseConfidence({ confidence: 1.3 })).toBe(1);
    expect(normaliseConfidence({ confidence: -0.2 })).toBe(0);
    expect(normaliseConfidence({ confidence: 0.74 })).toBe(0.74);
    expect(normaliseConfidence({ noul: 0.9 })).toBeNull();
  });
});
