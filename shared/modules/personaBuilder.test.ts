import { describe, expect, it } from "vitest";
import { chooseFallbackIntervention, deriveNextPersonaAction, PERSONA_PATTERN_FALLBACK } from "./personaBuilder";

describe("Persona Builder behavior loop contracts", () => {
  it("routes context and power signals away from Persona theatre", () => {
    expect(chooseFallbackIntervention("I am worried about retaliation and the power dynamics with this VP")).toBe("context");
    expect(chooseFallbackIntervention("I do not know the right method or process")).toBe("skill");
    expect(chooseFallbackIntervention("I need more information before deciding")).toBe("information");
  });

  it("keeps state signals separate from identity interpretation", () => {
    expect(chooseFallbackIntervention("I freeze and feel overwhelmed before the conversation")).toBe("state");
    expect(PERSONA_PATTERN_FALLBACK.safetyNote).toContain("exploratory hypothesis");
  });

  it("adapts from evidence rather than streaks", () => {
    expect(deriveNextPersonaAction("did_not_arise", "not_applicable")).toBe("keep_rep");
    expect(deriveNextPersonaAction("arose", "yes")).toBe("increase_difficulty");
    expect(deriveNextPersonaAction("arose", "partly")).toBe("repeat_with_adjustment");
    expect(deriveNextPersonaAction("arose", "no")).toBe("simplify_and_practice");
  });
});
