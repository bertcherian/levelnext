import { describe, expect, it } from "vitest";
import { invokeQwenComparison, QWEN_AB_MODEL_ID } from "./_core/openRouter";

describe("Qwen3-30B-A3B OpenRouter route", () => {
  it.runIf(Boolean(process.env.OPENROUTER_API_KEY))(
    "returns a minimal completion from the exact A/B test model",
    async () => {
      const result = await invokeQwenComparison({
        systemPrompt: "You are a service health check. Reply with exactly OK.",
        userPrompt: "OK",
        maxTokens: 128,
        temperature: 0,
        timeoutMs: 90_000,
      });

      expect(result.model).toBe(QWEN_AB_MODEL_ID);
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.usage.totalTokens).toEqual(expect.any(Number));
    },
    100_000
  );
});
