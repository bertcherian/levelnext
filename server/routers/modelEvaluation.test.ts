import { describe, expect, it } from "vitest";
import { comparisonStatus } from "./modelEvaluation";

describe("model evaluation workflow", () => {
  it("marks an evaluation complete only when both models returned text", () => {
    expect(comparisonStatus("Claude response", "Qwen response")).toBe("completed");
    expect(comparisonStatus("Claude response", null)).toBe("partial");
    expect(comparisonStatus(null, "Qwen response")).toBe("partial");
  });
});
