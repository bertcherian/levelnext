import { describe, expect, it } from "vitest";
import {
  NARRATIVE_CATEGORIES,
  NARRATIVE_STATUSES,
  PARTICIPANT_RESONANCE_OPTIONS,
  CURATED_ROLE_TRANSITIONS,
  NARRATIVE_PATTERN_LIBRARY,
  NARRATIVE_LENSES,
  calculateConvictionDelta,
  sanitizeInterventionLanguage,
  createNarrativeHypothesisSchema,
  chooseNextChapterSchema,
  createExperimentSchema,
  narrativeResetSchema,
} from "./narrativeIntelligence";

describe("Narrative Intelligence — Vocabulary & Core Metadata", () => {
  it("defines the 4 fundamental narrative categories", () => {
    expect(NARRATIVE_CATEGORIES).toEqual(["self", "relational", "work_world", "future"]);
  });

  it("defines 5 narrative statuses covering the generative lifecycle", () => {
    expect(NARRATIVE_STATUSES).toEqual(["keep", "expand", "test", "retire", "create"]);
  });

  it("provides 6 participant resonance options allowing ownership and rejection", () => {
    expect(PARTICIPANT_RESONANCE_OPTIONS).toContain("strongly_resonates");
    expect(PARTICIPANT_RESONANCE_OPTIONS).toContain("does_not_resonate");
    expect(PARTICIPANT_RESONANCE_OPTIONS).toContain("dismiss");
    expect(PARTICIPANT_RESONANCE_OPTIONS).toContain("edit");
  });

  it("contains curated role transitions for Manager Effectiveness", () => {
    const mepTransitions = CURATED_ROLE_TRANSITIONS.filter((t) => t.module === "manager");
    expect(mepTransitions.length).toBeGreaterThanOrEqual(3);
    const expertToEnabler = mepTransitions.find((t) => t.id === "mep_expert_to_enabler");
    expect(expertToEnabler).toBeDefined();
    expect(expertToEnabler?.fromIdentity).toBe("The Technical Problem Solver");
    expect(expertToEnabler?.toIdentity).toBe("The Capability Multiplier");
    expect(expertToEnabler?.concreteBehaviours.length).toBeGreaterThanOrEqual(4);
    expect(expertToEnabler?.suggestedExperiments.length).toBeGreaterThanOrEqual(1);
  });

  it("pattern library does not label participants directly", () => {
    NARRATIVE_PATTERN_LIBRARY.forEach((pattern) => {
      expect(pattern.safeExplorationPrompt).not.toMatch(/\byou are\b/i);
      expect(pattern.safeExplorationPrompt.length).toBeGreaterThan(20);
    });
  });

  it("includes capability lenses with inquiry questions", () => {
    expect(NARRATIVE_LENSES.delegation).toBeDefined();
    expect(NARRATIVE_LENSES.feedback).toBeDefined();
    expect(NARRATIVE_LENSES.executive_presence).toBeDefined();
    expect(NARRATIVE_LENSES.conflict).toBeDefined();
    expect(NARRATIVE_LENSES.delegation.lensQuestions.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Narrative Intelligence — Safety & Philosophy Helpers", () => {
  it("flags disallowed psychoanalytic and diagnostic labeling", () => {
    const diagnostic = sanitizeInterventionLanguage("The truth is your childhood caused this behaviour.");
    expect(diagnostic.safe).toBe(false);
    expect(diagnostic.reason).toBeDefined();

    const labeling = sanitizeInterventionLanguage("You are The Controller in this relationship.");
    expect(labeling.safe).toBe(false);
  });

  it("approves respectful developmental coaching language", () => {
    const developmental = sanitizeInterventionLanguage(
      "I noticed a possible operating assumption. Does the thought that credibility requires having every answer resonate?"
    );
    expect(developmental.safe).toBe(true);
  });

  it("calculates self-reported conviction shift correctly", () => {
    // Old assumption: 76% -> 44% (drop of 32)
    // Emerging assumption: 28% -> 61% (gain of 33)
    const result = calculateConvictionDelta(76, 44, 28, 61);
    expect(result.oldShift).toBe(32);
    expect(result.emergingShift).toBe(33);
    expect(result.netProgress).toBe(33);
  });
});

describe("Narrative Intelligence — Zod Schemas", () => {
  it("validates createNarrativeHypothesisSchema", () => {
    const valid = {
      category: "self",
      statement: "My value comes from solving every technical issue personally.",
      sourceModule: "mep",
      initialResonance: "strongly_resonates",
    };
    const parsed = createNarrativeHypothesisSchema.safeParse(valid);
    expect(parsed.success).toBe(true);

    const invalid = {
      category: "unknown_category",
      statement: "Short",
    };
    const failed = createNarrativeHypothesisSchema.safeParse(invalid);
    expect(failed.success).toBe(false);
  });

  it("validates chooseNextChapterSchema", () => {
    const valid = {
      transitionId: "mep_expert_to_enabler",
      fromIdentity: "Problem Solver",
      toIdentity: "Coach & Enabler",
      emergingAssumption: "My value comes from unlocking capacity in others.",
      commitments: ["Ask 3 coaching questions before answering", "Delegate product reviews"],
    };
    const parsed = chooseNextChapterSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("validates createExperimentSchema with prediction probability", () => {
    const valid = {
      narrativeId: 1,
      title: "Ask Before Telling in Sprint Planning",
      contextSituation: "Sprint planning architecture discussion",
      oldAssumption: "If I don't give the architecture direction immediately, the team will make poor choices.",
      alternativeHypothesis: "The team will propose solid solutions if given the problem boundaries.",
      behaviourToTest: "Ask the team to propose 2 approaches before sharing my view.",
      predictedOutcome: "The team will ask me to decide anyway.",
      predictedProbability: 80,
      experimentType: "real_world",
    };
    const parsed = createExperimentSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("validates narrativeResetSchema", () => {
    const valid = {
      triggerSituation: "A direct report delivered a sub-par presentation draft 2 hours before the board meeting.",
      noticeStory: "I have to rewrite the whole deck myself or we will lose credibility.",
      separateFacts: "The deck has 3 slides that need tightening. The rest is solid data.",
      alternativeView: "I can give specific bullet comments on those 3 slides in 5 minutes.",
      chosenAssumption: "Maintaining standards does not require doing the work myself.",
      immediateAction: "Send 3 concise comments and schedule a 5-minute alignment sync.",
      saveToEvidence: true,
    };
    const parsed = narrativeResetSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });
});
