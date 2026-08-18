import { describe, expect, it } from "vitest";
import {
  FIREWORKS_QWEN_ROUTE_DISABLED_REASON,
  invokeQwenComparison,
} from "./_core/fireworks";

describe("Fireworks privacy policy", () => {
  it("blocks the deprecated route before any user content can be sent", async () => {
    await expect(invokeQwenComparison({
      systemPrompt: "Never send this text.",
      userPrompt: "Private user content",
      maxTokens: 16,
      temperature: 0,
    })).rejects.toThrow(FIREWORKS_QWEN_ROUTE_DISABLED_REASON);
  });
});
