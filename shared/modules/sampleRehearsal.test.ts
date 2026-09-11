import { describe, expect, it } from "vitest";
import { evaluateSampleRehearsal } from "./sampleRehearsal";

describe("evaluateSampleRehearsal", () => {
  it("recognises the three target steps from a learner transcript", () => {
    const result = evaluateSampleRehearsal([
      { role: "assistant", content: "What happened?" },
      { role: "user", content: "I noticed the project missed the Friday deadline. What got in the way? We agreed that I will share a recovery plan by Monday." },
    ]);

    expect(result.score).toBe(3);
    expect(result.percentage).toBe(100);
    expect(result.steps.every((step) => step.matched)).toBe(true);
  });

  it("gives targeted feedback when the learner skips a step", () => {
    const result = evaluateSampleRehearsal([
      { role: "user", content: "The work was late and I will follow up tomorrow." },
    ]);

    expect(result.score).toBe(2);
    expect(result.steps.find((step) => step.key === "clarifying_question")?.matched).toBe(false);
    expect(result.steps.find((step) => step.key === "clarifying_question")?.evidence).toContain("open question");
  });

  it("ignores assistant speech when scoring learner application", () => {
    const result = evaluateSampleRehearsal([
      { role: "assistant", content: "What happened? We can agree the next action by Friday." },
    ]);

    expect(result.score).toBe(0);
  });
});
