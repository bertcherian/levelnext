import { describe, expect, it } from "vitest";
import { getCriticalThinkingProgress } from "./criticalThinkingProgress";

describe("getCriticalThinkingProgress", () => {
  const instrument = { behaviourItems: [{ id: "b1" }, { id: "b2" }], scenarios: [{ id: "s1" }], environmentItems: [{ id: "e1" }], reflectiveQuestions: [{ id: "r1" }] };
  it("reports completed and remaining question counts across all response types", () => {
    expect(getCriticalThinkingProgress(instrument, { behaviour: { b1: 3 }, scenarios: { s1: { optionId: "a", confidence: 70 } }, environment: {}, reflections: { r1: "A useful reflection" } })).toEqual({ completed: 3, total: 5, remaining: 2, percent: 60 });
  });
});
