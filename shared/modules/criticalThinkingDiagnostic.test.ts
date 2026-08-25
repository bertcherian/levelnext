import { describe, expect, it } from "vitest";
import {
  CTDM_BEHAVIOUR_ITEMS,
  CTDM_ENVIRONMENT_ITEMS,
  CTDM_REFLECTIVE_QUESTIONS,
  CTDM_SCENARIOS,
  getConfidenceCalibration,
  scoreCriticalThinkingDiagnostic,
} from "./criticalThinkingDiagnostic";
import { canShowCriticalThinkingTeamReport, isCriticalThinkingTenantAdmin } from "./criticalThinkingAccess";

function completeResponse() {
  return {
    behaviour: Object.fromEntries(CTDM_BEHAVIOUR_ITEMS.map((item) => [item.id, 4])),
    scenarios: Object.fromEntries(CTDM_SCENARIOS.map((scenario) => [scenario.id, { optionId: "c", confidence: 80 }])),
    environment: Object.fromEntries(CTDM_ENVIRONMENT_ITEMS.map((item) => [item.id, 5])),
    reflections: Object.fromEntries(CTDM_REFLECTIVE_QUESTIONS.map((question) => [question.id, "A concise, non-confidential development reflection."])),
  };
}

describe("Critical Thinking in Decision Making scoring", () => {
  it("keeps behavioural practice, applied judgment, confidence calibration, and environment as distinct results", () => {
    const result = scoreCriticalThinkingDiagnostic(completeResponse());

    expect(result.appliedJudgmentScore).toBe(100);
    expect(result.meanConfidence).toBe(80);
    expect(result.environmentScore).toBe(100);
    expect(result.environmentBand).toBe("Enabling");
    expect(result.behaviouralScore).not.toBe(result.appliedJudgmentScore);
    expect(result.dimensionScores.frame).toBeDefined();
    expect(result.strengths).toHaveLength(2);
    expect(result.priorities).toHaveLength(2);
  });

  it("excludes N/A responses and withholds a core dimension until three observations are available", () => {
    const response = completeResponse();
    response.behaviour.ctdm_b01 = 0;
    response.behaviour.ctdm_b02 = 0;

    const result = scoreCriticalThinkingDiagnostic(response);

    expect(result.answeredCounts.frame).toBe(2);
    expect(result.dimensionScores.frame).toBeUndefined();
  });

  it("does not label calibration as precise when scenario accuracy and confidence are not both available", () => {
    expect(getConfidenceCalibration(null, null).label).toBe("Insufficient data");
    expect(getConfidenceCalibration(80, 5).label).toBe("Strong judgment with appropriately high confidence");
    expect(getConfidenceCalibration(40, 35).label).toBe("Weak judgment with overconfidence");
  });

  it("enforces tenant administration roles and the minimum anonymous group size", () => {
    expect(isCriticalThinkingTenantAdmin("owner")).toBe(true);
    expect(isCriticalThinkingTenantAdmin("admin")).toBe(true);
    expect(isCriticalThinkingTenantAdmin("member")).toBe(false);
    expect(isCriticalThinkingTenantAdmin("platform_admin")).toBe(false);
    expect(canShowCriticalThinkingTeamReport(4, 5)).toBe(false);
    expect(canShowCriticalThinkingTeamReport(5, 5)).toBe(true);
    expect(canShowCriticalThinkingTeamReport(6, 4)).toBe(false);
  });
});
