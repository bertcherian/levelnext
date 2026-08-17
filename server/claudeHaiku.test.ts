import { describe, expect, it } from "vitest";
import { invokeLLM } from "./_core/llm";

describe("Claude Haiku evaluator route", () => {
  it.runIf(Boolean(process.env.BUILT_IN_FORGE_API_KEY))(
    "returns a minimal completion from the exact comparison model",
    async () => {
      const result = await invokeLLM({
        model: "claude-haiku-4-5",
        messages: [
          { role: "system", content: "You are a service health check. Reply with exactly OK." },
          { role: "user", content: "OK" },
        ],
        maxTokens: 32,
        temperature: 0,
      });

      const content = result.choices[0]?.message?.content;
      expect(typeof content).toBe("string");
      expect((content as string).trim().length).toBeGreaterThan(0);
      expect(result.usage?.total_tokens).toEqual(expect.any(Number));
    },
    60_000
  );
});
