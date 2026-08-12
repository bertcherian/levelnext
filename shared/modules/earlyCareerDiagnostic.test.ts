import { describe, expect, it } from "vitest";
import { EARLY_CAREER_DIAGNOSTIC_QUESTIONS, getEarlyCareerDevelopmentGuidance, getEarlyCareerDiagnosticBand, scoreEarlyCareerDiagnostic } from "./earlyCareerDiagnostic";

describe("Early Career diagnostic", () => {
  it("scores all eight capabilities deterministically and selects a concrete developmental focus", () => {
    const responses = Object.fromEntries(EARLY_CAREER_DIAGNOSTIC_QUESTIONS.map((question) => [question.id, question.capabilityId === "communication" ? 1 : 4]));
    const result = scoreEarlyCareerDiagnostic(responses);
    expect(Object.keys(result.capabilityScores)).toHaveLength(8);
    expect(result.recommendedCapability).toBe("communication");
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("uses developmental—not employment-rating—guidance", () => {
    const guidance = getEarlyCareerDevelopmentGuidance("communication");
    expect(guidance.action.length).toBeGreaterThan(20);
    expect(guidance.rationale.toLowerCase()).not.toContain("performance rating");
    expect(getEarlyCareerDiagnosticBand(49).label).toBe("Building the foundations");
    expect(getEarlyCareerDiagnosticBand(80).label).toBe("Ready for broader contribution");
  });
});
