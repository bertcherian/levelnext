import { describe, expect, it } from "vitest";
import { routeSituation } from "./v3SituationRouting";

describe("V3 situation routing", () => {
  it("routes a feedback situation to the simulator when preparation is requested", () => {
    const result = routeSituation({ situation: "I need to give difficult feedback to a defensive team member", intent: "prepare" });
    expect(result.situationKey).toBe("difficult_feedback");
    expect(result.route).toBe("simulator");
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.evidence[0]?.matchedTerms).toContain("difficult feedback");
  });

  it("routes practice intent to Practice Partner", () => {
    const result = routeSituation({ situation: "My team keeps bringing delegated decisions back to me", intent: "practice" });
    expect(result.situationKey).toBe("delegation");
    expect(result.route).toBe("practice_partner");
  });

  it("does not overclaim when the situation is ambiguous", () => {
    const result = routeSituation({ situation: "Something is difficult right now", intent: "decide" });
    expect(result.situationKey).toBeNull();
    expect(result.route).toBe("clarify");
    expect(result.clarificationPrompt).toBeTruthy();
    expect(result.confidence).toBeLessThan(0.5);
  });
});
