import { describe, expect, it } from "vitest";
import { earlyCareerPracticeStartInput } from "./earlyCareer";

describe("Early Career custom practice input", () => {
  it("accepts a private user-led workplace situation", () => {
    const parsed = earlyCareerPracticeStartInput.parse({
      customContext: "I need to explain that a project deadline is at risk because a dependency has not arrived.",
      customCounterpartRole: "project manager",
      customObjective: "Agree a realistic recovery plan.",
      difficulty: "realistic",
    });

    expect(parsed.customContext).toContain("deadline is at risk");
    expect(parsed.scenarioId).toBeUndefined();
  });

  it("requires exactly one start path: a library scenario or custom context", () => {
    expect(() => earlyCareerPracticeStartInput.parse({ difficulty: "guided" })).toThrow(/Choose a library scenario/);
    expect(() => earlyCareerPracticeStartInput.parse({
      scenarioId: "receive_feedback",
      customContext: "I need to prepare for feedback that I received from my senior colleague.",
      difficulty: "realistic",
    })).toThrow(/Choose a library scenario/);
  });
});
