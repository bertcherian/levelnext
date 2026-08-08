import { describe, expect, it } from "vitest";
import { MEP_DIAGNOSTICS, getMepDiagnostic, scoreMepDiagnostic } from "./mepData";

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
