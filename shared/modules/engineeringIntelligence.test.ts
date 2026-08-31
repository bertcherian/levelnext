import { describe, expect, it } from "vitest";
import {
  ENGINEERING_DIAGNOSTIC_QUESTIONS,
  deterministicPartnerNudge,
  scoreEngineeringDiagnostic,
} from "./engineeringIntelligence";

describe("Engineering Intelligence diagnostic scoring", () => {
  it("scores each engineering engine from its two visible diagnostic questions", () => {
    const answers = Object.fromEntries(ENGINEERING_DIAGNOSTIC_QUESTIONS.map((question) => [question.code, question.engine === "systems" ? 5 : 3]));
    const score = scoreEngineeringDiagnostic(answers);

    expect(score.engineScores.systems).toBe(100);
    expect(score.engineScores.self).toBe(60);
    expect(score.impactRadius).toBe("organisation");
    expect(score.impactPattern).toBe("Systems builder");
  });

  it("selects the lowest current engine as one practical growth edge", () => {
    const answers = Object.fromEntries(ENGINEERING_DIAGNOSTIC_QUESTIONS.map((question) => [question.code, question.engine === "human_ai_judgment" ? 1 : 5]));
    const score = scoreEngineeringDiagnostic(answers);

    expect(score.growthEdge.engine).toBe("human_ai_judgment");
    expect(score.growthEdge.statement).toContain("human–ai judgment");
  });
});

describe("deterministic Success Partner fallback", () => {
  it("writes a participant-led question using only the shared Mission candidate", () => {
    const nudge = deterministicPartnerNudge({
      participantId: 9,
      participantName: "Asha",
      missionId: 24,
      missionTitle: "Clarify an architecture decision",
      missionStatus: "accepted",
      reasonCode: "mission_stalled",
      priorityScore: 60,
      lastUpdatedAt: "2026-08-01T00:00:00.000Z",
    });

    expect(nudge.suggestedQuestion).toContain("Clarify an architecture decision");
    expect(nudge.suggestedQuestion.toLowerCase()).not.toContain("performance");
    expect(nudge.suggestedQuestion.toLowerCase()).not.toContain("diagnostic");
    expect(nudge.urgency).toBe("medium");
  });
});
