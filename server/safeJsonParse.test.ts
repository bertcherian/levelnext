import { describe, expect, it, vi } from "vitest";
import { safeJsonParse, extractJsonObject, extractJsonArray } from "./_core/llm";
import { parseInferredScenarioResponse } from "./routers/simulator";

describe("safeJsonParse", () => {
  it("parses valid JSON objects correctly", () => {
    const result = safeJsonParse<{ key: string }>('{"key":"value"}', {}, "test");
    expect(result).toEqual({ key: "value" });
  });

  it("parses valid JSON arrays correctly", () => {
    const result = safeJsonParse<number[]>("[1,2,3]", [], "test");
    expect(result).toEqual([1, 2, 3]);
  });

  it("returns fallback for invalid JSON", () => {
    const fallback = { default: true };
    const result = safeJsonParse("{invalid json}", fallback, "test");
    expect(result).toEqual(fallback);
  });

  it("returns fallback for truncated JSON", () => {
    const fallback = { error: true };
    const result = safeJsonParse('{"partial":', fallback, "test");
    expect(result).toEqual(fallback);
  });

  it("returns fallback for empty string", () => {
    const fallback = { empty: true };
    const result = safeJsonParse("", fallback, "test");
    expect(result).toEqual(fallback);
  });

  it("handles nested objects", () => {
    const result = safeJsonParse<{ a: { b: { c: number } } }>(
      '{"a":{"b":{"c":1}}}', {}, "test"
    );
    expect(result).toEqual({ a: { b: { c: 1 } } });
  });

  it("logs error to console when context is provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    safeJsonParse("{bad}", {}, "testContext");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("testContext"),
      expect.anything()
    );
    spy.mockRestore();
  });

  it("logs error with default label when context is not provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    safeJsonParse("{bad}", {});
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("[safeJsonParse]"),
      expect.anything()
    );
    spy.mockRestore();
  });
});

describe("extractJsonObject", () => {
  it("extracts and parses JSON from text with surrounding content", () => {
    const text = 'Here is the result: {"score": 85, "label": "Good"} done.';
    const result = extractJsonObject<{ score: number; label: string }>(text, {}, "test");
    expect(result).toEqual({ score: 85, label: "Good" });
  });

  it("returns fallback when no JSON object is found", () => {
    const fallback = { none: true };
    const result = extractJsonObject("no json here", fallback, "test");
    expect(result).toEqual(fallback);
  });

  it("returns fallback when JSON is malformed", () => {
    const fallback = { error: true };
    const result = extractJsonObject("{bad json}", fallback, "test");
    expect(result).toEqual(fallback);
  });

  it("handles LLM response with markdown code fences", () => {
    const text = '```json\n{"result": "success"}\n```';
    const result = extractJsonObject<{ result: string }>(text, {}, "test");
    expect(result).toEqual({ result: "success" });
  });
});

describe("extractJsonArray", () => {
  it("extracts and parses JSON array from text", () => {
    const text = 'Some text [{"a":1},{"b":2}] more text';
    const result = extractJsonArray<{ a?: number; b?: number }[]>(text, [], "test");
    expect(result).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("returns fallback when no JSON array is found", () => {
    const fallback: number[] = [];
    const result = extractJsonArray("no array here", fallback, "test");
    expect(result).toEqual(fallback);
  });

  it("returns fallback for malformed array", () => {
    const fallback: string[] = [];
    const result = extractJsonArray("[bad array", fallback, "test");
    expect(result).toEqual(fallback);
  });
});

describe("parseInferredScenarioResponse", () => {
  it("accepts a manager accountability scenario with a preamble and markdown fence", () => {
    const response = `Here is the scenario:\n\n\`\`\`json
{
  "conversationType": "Accountability Conversation",
  "stakeholder": "An underperforming direct report",
  "objective": "Reset expectations and agree a measurable improvement plan.",
  "expectedChallenge": "The employee is likely to blame workload and question the feedback.",
  "difficulty": 3,
  "estimatedMinutes": 6,
  "characterName": "Rohan",
  "characterStyle": "Defensive at first but open to concrete examples.",
  "followUpQuestion": null
}
\`\`\``;

    expect(parseInferredScenarioResponse(response)).toEqual({
      conversationType: "Accountability Conversation",
      stakeholder: "An underperforming direct report",
      objective: "Reset expectations and agree a measurable improvement plan.",
      expectedChallenge: "The employee is likely to blame workload and question the feedback.",
      difficulty: 3,
      estimatedMinutes: 6,
      characterName: "Rohan",
      characterStyle: "Defensive at first but open to concrete examples.",
      followUpQuestion: null,
    });
  });

  it("returns null when the model response does not include a JSON object", () => {
    expect(parseInferredScenarioResponse("I need more information before creating a scenario.")).toBeNull();
  });
});
