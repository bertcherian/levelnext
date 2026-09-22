import { describe, expect, it } from "vitest";
import { chooseFallbackIntervention, deriveNextDayNumber, deriveNextPersonaAction, getPersonaDayPlan, PERSONA_DAY_PLANS, PERSONA_PATTERN_FALLBACK } from "./personaBuilder";

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

  it("defines a bounded 14-day path with a completion review", () => {
    expect(PERSONA_DAY_PLANS).toHaveLength(14);
    expect(getPersonaDayPlan(1)).toMatchObject({ dayNumber: 1, title: "Name the Moment" });
    expect(getPersonaDayPlan(14)).toMatchObject({ dayNumber: 14, title: "Complete the review" });
    expect(getPersonaDayPlan(99).dayNumber).toBe(14);
  });

  it("advances only when the evidence decision calls for progression", () => {
    expect(deriveNextDayNumber(6, "increase_difficulty")).toBe(7);
    expect(deriveNextDayNumber(6, "keep_rep")).toBe(7);
    expect(deriveNextDayNumber(6, "repeat_with_adjustment")).toBe(6);
    expect(deriveNextDayNumber(6, "simplify_and_practice")).toBe(6);
    expect(deriveNextDayNumber(14, "increase_difficulty")).toBe(14);
  });
});
