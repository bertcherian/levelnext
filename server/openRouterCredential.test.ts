import { describe, expect, it } from "vitest";

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

describe("OpenRouter credential", () => {
  it.runIf(Boolean(openRouterApiKey))(
    "authorizes a lightweight model-catalog request",
    async () => {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { authorization: `Bearer ${openRouterApiKey}` },
      });

      expect(response.ok).toBe(true);
    },
    20_000
  );
});
