import { describe, expect, it } from "vitest";
import {
  EARLY_CAREER_DOMAIN_KEY,
  EARLY_CAREER_MODULE_CODE,
  EARLY_CAREER_NEXT_MOVES,
  EARLY_CAREER_PRODUCT_ID,
  EXECUTIVE_COMMUNICATION_LEGACY_CODE,
  getEarlyCareerManagerNudge,
  getEarlyCareerNextMove,
  getEarlyCareerStage,
} from "./earlyCareerData";

describe("Early Career namespace guardrails", () => {
  it("uses a canonical early_career domain while preserving ECI for Executive Communication Intelligence", () => {
    expect(EARLY_CAREER_DOMAIN_KEY).toBe("early_career");
    expect(EARLY_CAREER_PRODUCT_ID).toBe("early_career_intelligence");
    expect(EARLY_CAREER_MODULE_CODE).toBe("EARLY_CAREER");
    expect(EXECUTIVE_COMMUNICATION_LEGACY_CODE).toBe("ECI");
    expect(EARLY_CAREER_MODULE_CODE).not.toBe(EXECUTIVE_COMMUNICATION_LEGACY_CODE);
  });
});

describe("Early Career next-move logic", () => {
  it("returns a deterministic, evidence-oriented action for every journey stage", () => {
    const moves = Object.values(EARLY_CAREER_NEXT_MOVES);
    expect(moves).toHaveLength(7);
    for (const move of moves) {
      expect(getEarlyCareerNextMove(move.stage)).toEqual(move);
      expect(move.title.length).toBeGreaterThan(3);
      expect(move.timeMinutes).toBeGreaterThan(0);
      expect(move.evidencePrompt.length).toBeGreaterThan(8);
    }
  });

  it("keeps the manager nudge within its stated privacy boundary", () => {
    const nudge = getEarlyCareerManagerNudge("deliver");
    const stage = getEarlyCareerStage("deliver");
    expect(stage.name).toBe("Deliver");
    expect(nudge.code).toBe("EARLY_CAREER.DELIVER.CHECK_IN");
    expect(nudge.questions).toHaveLength(3);
    expect(nudge.privacyBoundary).toContain("does not use private AI coaching conversations");
    expect(nudge.privacyBoundary).toContain("raw diagnostic answers");
  });
});
