import { describe, expect, it } from "vitest";
import { calculateTechGapCost } from "./techIntelligenceCalculator";

describe("calculateTechGapCost", () => {
  it("makes annual friction exposure and addressable exposure transparent", () => {
    const result = calculateTechGapCost({ teamSize: 100, annualFullyLoadedCost: 2_400_000, weeklyFrictionHours: 2, workingWeeks: 48, addressableImprovementPercent: 15 });
    expect(result.annualFrictionExposure).toBe(12_000_000);
    expect(result.addressableExposure).toBe(1_800_000);
    expect(result.capacityDays).toBe(1_200);
  });

  it("never returns negative planning exposure when an input is invalid", () => {
    expect(calculateTechGapCost({ teamSize: -10, annualFullyLoadedCost: -1, weeklyFrictionHours: -2, workingWeeks: -48, addressableImprovementPercent: -15 })).toEqual({ annualFrictionExposure: 0, addressableExposure: 0, capacityDays: 0 });
  });
});
