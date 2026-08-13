import { describe, expect, it } from "vitest";
import {
  SELF_LEADERSHIP_DIMENSIONS,
  buildSelfLeadershipGuideDirective,
  createSelfLeadershipFallback,
  getSelfLeadershipStageFocus,
} from "../shared/modules/selfLeadershipIntelligence";

describe("Self-Leadership Intelligence Engine", () => {
  it("keeps the six behavioural dimensions and calibrates expectations by career stage", () => {
    expect(SELF_LEADERSHIP_DIMENSIONS).toEqual([
      "self_awareness", "authenticity", "courage", "responsibility", "other_centredness", "integrity",
    ]);
    expect(getSelfLeadershipStageFocus("early_career")).toContain("ownership");
    expect(getSelfLeadershipStageFocus("cxo")).toContain("enterprise responsibility");
  });

  it("produces a private, non-moralising low-confidence fallback when evidence is limited", () => {
    const analysis = createSelfLeadershipFallback({
      situation: "A finance manager did not challenge a rushed commercial assumption in a cross-functional meeting.",
      observedBehaviour: "They agreed quickly and raised the concern only after the meeting.",
      careerStage: "manager",
      evidence: ["One self-reported situation."],
    });

    expect(analysis.selfLeadershipSignal.confidence).toBe("low");
    expect(analysis.developmentalHypothesis).toMatch(/^One possibility worth exploring/);
    expect(analysis.mirror.experiment).toContain("clarifying question");
    expect(analysis.diagnosticLens).toBe("mixed");
  });

  it("gives every Guide the same safety and choice-oriented coaching directive", () => {
    const directive = buildSelfLeadershipGuideDirective("leader");
    expect(directive).toContain("KNOWING problem");
    expect(directive).toContain("Treat motives");
    expect(directive).toContain("Separate intention, behaviour, and impact");
    expect(directive).toContain("micro-experiment");
  });
});
