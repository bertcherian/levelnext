import { describe, expect, it } from "vitest";
import { buildMepFactorReportRows, MEP_DIAGNOSTICS, getMepDiagnostic, scoreMepDiagnostic } from "./mepData";

describe("mepData — 7-point Likert scale scoring", () => {
  const mei = getMepDiagnostic("MEI");
  if (!mei) throw new Error("MEI diagnostic not found");

  it("accepts responses in the 1–7 range", () => {
    const responses: Record<string, number> = {};
    for (const q of mei.questions) {
      responses[q.id] = 5;
    }
    const result = scoreMepDiagnostic(mei, responses);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.zone).toBeTruthy();
  });

  it("scores all-7 responses as 100 (maximum)", () => {
    const responses: Record<string, number> = {};
    for (const q of mei.questions) {
      responses[q.id] = 7;
    }
    const result = scoreMepDiagnostic(mei, responses);
    expect(result.overallScore).toBe(100);
  });

  it("scores all-1 responses as 0 (minimum)", () => {
    const responses: Record<string, number> = {};
    for (const q of mei.questions) {
      responses[q.id] = 1;
    }
    const result = scoreMepDiagnostic(mei, responses);
    expect(result.overallScore).toBe(0);
  });

  it("scores all-4 responses as 50 (midpoint)", () => {
    const responses: Record<string, number> = {};
    for (const q of mei.questions) {
      responses[q.id] = 4;
    }
    const result = scoreMepDiagnostic(mei, responses);
    expect(result.overallScore).toBe(50);
  });

  it("produces dimension scores for all dimensions", () => {
    const responses: Record<string, number> = {};
    for (const q of mei.questions) {
      responses[q.id] = 6;
    }
    const result = scoreMepDiagnostic(mei, responses);
    expect(Object.keys(result.dimensionScores).length).toBe(mei.dimensions.length);
    for (const val of Object.values(result.dimensionScores)) {
      expect(val).toBeGreaterThan(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });

  it("keeps every diagnostic at 24 questions with coverage for every measured factor", () => {
    for (const diag of MEP_DIAGNOSTICS) {
      expect(diag.questions).toHaveLength(24);
      for (const dimension of diag.dimensions) {
        expect(diag.questions.some((question) => question.dimensionId === dimension.id)).toBe(true);
      }
    }
  });

  it("uses diagnostic-specific behavioural depth items instead of generic follow-up language", () => {
    const diagnosticsExpandedFromLegacyBanks = ["DI", "FI", "CI_C", "THI", "EXI", "CNFI", "O1I", "TCI", "OWI", "PST", "PFM", "CFI", "MRW"];

    for (const code of diagnosticsExpandedFromLegacyBanks) {
      const diagnostic = getMepDiagnostic(code);
      if (!diagnostic) throw new Error(`${code} diagnostic not found`);
      const depthItems = diagnostic.questions.filter((question) => question.id.includes("_depth_"));
      expect(depthItems.length).toBeGreaterThan(0);
      for (const item of depthItems) {
        expect(item.text).not.toBe("I turn setting clear, measurable goals for the team into explicit operating agreements, routines, and observable standards rather than relying on good intentions.");
        expect(item.text).not.toContain("Before consequential work, I surface the trade-offs, constraints, and early warning signals");
        expect(item.text).not.toContain("I seek candid evidence from the people closest to the work");
        expect(item.text).not.toContain("After an important outcome, I review what strengthened or weakened");
      }
    }
  });

  it("builds an actionable factor report for every measured dimension", () => {
    const responses: Record<string, number> = {};
    for (const question of mei.questions) responses[question.id] = 5;

    const result = scoreMepDiagnostic(mei, responses);
    const factors = buildMepFactorReportRows(mei, result.dimensionScores);

    expect(factors).toHaveLength(mei.dimensions.length);
    for (const factor of factors) {
      expect(factor.definition).toBeTruthy();
      expect(factor.whyItMatters).toBeTruthy();
      expect(factor.strength).toBeTruthy();
      expect(factor.weakness).toBeTruthy();
      expect(factor.action).toBeTruthy();
      expect(["Strength", "Foundation", "Priority"]).toContain(factor.status);
    }
  });

  it("handles all diagnostics without errors", () => {
    for (const diag of MEP_DIAGNOSTICS) {
      const responses: Record<string, number> = {};
      for (const q of diag.questions) {
        responses[q.id] = 5;
      }
      const result = scoreMepDiagnostic(diag, responses);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    }
  });
});
