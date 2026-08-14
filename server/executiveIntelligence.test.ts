import { describe, expect, it } from "vitest";
import { EXECUTIVE_INTELLIGENCES, buildExecutiveCoachDirective, createExecutiveAnalysisFallback } from "../shared/modules/executiveIntelligence";

describe("Executive Intelligence model", () => {
  it("preserves the six enterprise intelligences and mandate-led coaching safeguards", () => {
    expect(EXECUTIVE_INTELLIGENCES).toHaveLength(6);
    expect(buildExecutiveCoachDirective()).toContain("Never make consequential business decisions");
    expect(buildExecutiveCoachDirective()).toContain("RUN");
  });
  it("provides an evidence-calibrated fallback that separates decision and outcome quality", () => {
    const analysis = createExecutiveAnalysisFallback({ situation: "A business unit is behind plan and the executive must decide where to protect investment." });
    expect(analysis.confidence).toBe("low");
    expect(analysis.evidenceLevel).toBe("signal");
    expect(analysis.decisionQuality).toContain("Decision quality");
    expect(analysis.outcomeQuality).toContain("expected outcome");
  });
});
