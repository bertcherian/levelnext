import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
}));

vi.mock("./_core/env", () => ({
  ENV: { openRouterApiKey: "privacy-test-key" },
}));

import {
  invokeQwenComparison,
  OPENROUTER_PRIVACY_PROVIDER_PREFERENCES,
} from "./_core/openRouter";

describe("OpenRouter privacy routing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("requires a zero-retention endpoint that denies provider data collection", async () => {
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "OK" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }), { status: 200 }));
    vi.stubGlobal("fetch", mocks.fetch);

    await invokeQwenComparison({
      systemPrompt: "Reply with exactly OK.",
      userPrompt: "OK",
      maxTokens: 16,
      temperature: 0,
    });

    const request = JSON.parse(String(mocks.fetch.mock.calls[0]?.[1]?.body));
    expect(OPENROUTER_PRIVACY_PROVIDER_PREFERENCES).toEqual({
      data_collection: "deny",
      zdr: true,
    });
    expect(request.provider).toEqual(OPENROUTER_PRIVACY_PROVIDER_PREFERENCES);
  });
});
