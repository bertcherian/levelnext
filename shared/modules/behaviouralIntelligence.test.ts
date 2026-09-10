import { describe, expect, it } from "vitest";
import {
  createBehaviouralMomentSchema,
  behaviouralAnalysisSchema,
  createDeterministicFallbackAnalysis,
  sanitizeBehaviouralInterventionLanguage,
  calculateEvidenceLevelProgression,
  CURATED_MOVE_LIBRARY,
} from "./behaviouralIntelligence";

describe("shared/modules/behaviouralIntelligence", () => {
  it("validates valid moment inputs and applies sensible defaults", () => {
    const input = {
      situation: "I noticed a commercial forecast discrepancy in the executive planning meeting.",
      desiredOutcome: "Clarify the numbers without creating defensive resistance from the commercial lead.",
    };

    const parsed = createBehaviouralMomentSchema.parse(input);
    expect(parsed.sourceApp).toBe("behavioural_intelligence");
    expect(parsed.careerStage).toBe("manager");
    expect(parsed.evidence).toEqual([]);
    expect(parsed.situation).toContain("commercial forecast");
  });

  it("rejects overly brief situations that lack context", () => {
    expect(() =>
      createBehaviouralMomentSchema.parse({
        situation: "short",
      })
    ).toThrow();
  });

  it("produces a schema-compliant deterministic fallback analysis", () => {
    const fallback = createDeterministicFallbackAnalysis({
      sourceApp: "mep",
      careerStage: "manager",
      role: "Engineering Lead",
      situation: "I delegate tickets to the junior engineers but find myself taking the work back when deadlines approach.",
      observedBehaviour: "Took back 3 pull requests last sprint.",
      desiredOutcome: "Develop their capability while hitting delivery milestones.",
    });

    expect(fallback.engineVersion).toBe("1.0.0-fallback");
    expect(fallback.move.moveCode).toBe("MOVE-03_DELEGATE_OUTCOME_NOT_METHOD");
    expect(fallback.distinctionIds).toContain("OD-20");
    expect(fallback.confidence).toBe("low");
    expect(fallback.facts.length).toBeGreaterThanOrEqual(1);
    expect(fallback.interpretations.length).toBeGreaterThanOrEqual(1);

    // Verify it passes the strict Zod schema
    const validated = behaviouralAnalysisSchema.parse(fallback);
    expect(validated.move.title).toBe("Delegate Outcome with Guardrails");
  });

  it("sanitizes defamatory or clinical diagnostic language", () => {
    const dirty = "The reason is you are a narcissist and your mental illness makes you react.";
    const result = sanitizeBehaviouralInterventionLanguage(dirty);

    expect(result.safe).toBe(false);
    expect(result.violations.length).toBe(2);
    expect(result.cleanText).not.toContain("narcissist");
    expect(result.cleanText).not.toContain("mental illness");
  });

  it("correctly evaluates the evidence ladder progression", () => {
    const initial = calculateEvidenceLevelProgression([]);
    expect(initial.highestLevel).toBe("prepared");
    expect(initial.levelIndex).toBe(0);

    const progressed = calculateEvidenceLevelProgression([
      { evidenceLevel: "practised", sourceType: "practice_attempt", verificationStatus: "unverified" },
      { evidenceLevel: "applied", sourceType: "real_world_outcome", verificationStatus: "unverified" },
      { evidenceLevel: "reflected", sourceType: "self_report", verificationStatus: "verified" },
    ]);

    expect(progressed.highestLevel).toBe("reflected");
    expect(progressed.levelIndex).toBe(3);
    expect(progressed.verifiedCount).toBe(1);
  });

  it("contains curated moves with clear non-rhetorical guidance", () => {
    expect(CURATED_MOVE_LIBRARY.length).toBeGreaterThanOrEqual(6);
    for (const move of CURATED_MOVE_LIBRARY) {
      expect(move.suggestedPhrases.length).toBeGreaterThan(0);
      expect(move.doNotDo.length).toBeGreaterThan(0);
      expect(move.successSignal.length).toBeGreaterThan(10);
    }
  });
});
