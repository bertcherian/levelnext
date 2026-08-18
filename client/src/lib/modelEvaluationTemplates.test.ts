import { describe, expect, it } from "vitest";
import { MODEL_EVALUATION_TEMPLATES } from "./modelEvaluationTemplates";

describe("model evaluator templates", () => {
  it("includes reusable coaching and report templates with viable evaluator settings", () => {
    expect(MODEL_EVALUATION_TEMPLATES.filter((template) => template.category === "Coaching")).toHaveLength(2);
    expect(MODEL_EVALUATION_TEMPLATES.filter((template) => template.category === "Report")).toHaveLength(2);
    MODEL_EVALUATION_TEMPLATES.forEach((template) => {
      expect(template.systemPrompt.length).toBeGreaterThan(30);
      expect(template.userPrompt).toContain("anonymised");
      expect(template.maxTokens).toBeGreaterThanOrEqual(64);
      expect(template.temperature).toBeGreaterThanOrEqual(0);
    });
  });
});
