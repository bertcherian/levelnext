import { describe, expect, it } from "vitest";
import { earlyCareerPracticeStartInput, earlyCareerSavedPracticeScenarioInput } from "./earlyCareer";

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

  it("accepts a bounded reusable custom scenario without adding any sharing scope", () => {
    const parsed = earlyCareerSavedPracticeScenarioInput.parse({
      title: "Deadline recovery conversation",
      context: "I need to explain a delivery risk and agree a realistic next step with my manager.",
      counterpartRole: "manager",
      objective: "Agree a recovery plan.",
    });
    expect(parsed.title).toBe("Deadline recovery conversation");
    expect(parsed.context).toContain("delivery risk");
    expect(Object.keys(parsed)).not.toContain("sharingScope");
  });

  it("rejects a saved situation that is too short to support a realistic rehearsal", () => {
    expect(() => earlyCareerSavedPracticeScenarioInput.parse({ title: "Short", context: "Too brief", counterpartRole: "manager" })).toThrow();
  });
});
