import { describe, expect, it } from "vitest";

const fireworksApiKey = process.env.FIREWORKS_API_KEY;

describe("Fireworks credential", () => {
  it.runIf(Boolean(fireworksApiKey))(
    "authorizes a lightweight model-catalog request",
    async () => {
      const response = await fetch("https://api.fireworks.ai/inference/v1/models", {
        headers: {
          authorization: `Bearer ${fireworksApiKey}`,
        },
      });

      expect(response.ok).toBe(true);
    },
    20_000
  );

  it.skipIf(Boolean(fireworksApiKey))(
    "requires FIREWORKS_API_KEY to run the integration check",
    () => {
      expect(fireworksApiKey).toBeUndefined();
    }
  );
});
