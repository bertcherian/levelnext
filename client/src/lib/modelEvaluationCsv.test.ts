import { describe, expect, it } from "vitest";
import { reviewedEvaluationsToCsv } from "./modelEvaluationCsv";

describe("reviewed evaluation CSV export", () => {
  it("emits a spreadsheet-safe header and escapes prompts and reviewer notes", () => {
    const csv = reviewedEvaluationsToCsv([{
      id: 7,
      createdAt: new Date("2026-08-17T00:00:00Z"),
      status: "completed",
      systemPrompt: "Coach, carefully",
      userPrompt: "Use \"specific\" examples\nand do not generalise.",
      claudeModel: "claude-haiku-4-5",
      claudeLatencyMs: 500,
      claudeUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      qwenModel: "qwen/qwen3-30b-a3b",
      qwenLatencyMs: 300,
      qwenUsage: { promptTokens: 11, completionTokens: 21, totalTokens: 32 },
      preferredModel: "qwen",
      reviewScores: { clarity: 5, usefulness: 4, leadershipTone: 3 },
      reviewerNote: "Sharper, \"more practical\".",
      reviewedAt: new Date("2026-08-17T00:10:00Z"),
    }]);

    expect(csv.startsWith("\uFEFF\"Evaluation ID\"")).toBe(true);
    expect(csv).toContain('"Use ""specific"" examples\nand do not generalise."');
    expect(csv).toContain('"Sharper, ""more practical""."');
  });
});
