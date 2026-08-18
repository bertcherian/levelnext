import { ENV } from "./env";

const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";

export const QWEN_AB_MODEL_ID = "qwen/qwen3-30b-a3b";

/**
 * Privacy is a hard requirement for LevelNext user-content comparisons.
 * OpenRouter will reject the request rather than route it to an endpoint that
 * may collect, retain, or train on submitted prompts and completions.
 */
export const OPENROUTER_PRIVACY_PROVIDER_PREFERENCES = {
  data_collection: "deny" as const,
  zdr: true,
};

type OpenRouterChatResponse = {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export type QwenComparisonResponse = {
  model: typeof QWEN_AB_MODEL_ID;
  content: string;
  finishReason: string | null;
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  };
};

export async function invokeQwenComparison(input: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  timeoutMs?: number;
}): Promise<QwenComparisonResponse> {
  if (!ENV.openRouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${ENV.openRouterApiKey}`,
      "content-type": "application/json",
      "http-referer": "https://levelnext.coach",
      "x-title": "LevelNext Model Evaluator",
    },
    body: JSON.stringify({
      model: QWEN_AB_MODEL_ID,
      messages: [
        { role: "system", content: input.systemPrompt },
        {
          role: "user",
          content: `${input.userPrompt}\n\n/no_think`,
        },
      ],
      max_tokens: input.maxTokens,
      temperature: input.temperature,
      provider: OPENROUTER_PRIVACY_PROVIDER_PREFERENCES,
    }),
    signal: AbortSignal.timeout(input.timeoutMs ?? 90_000),
  });

  const payload = (await response.json().catch(() => null)) as OpenRouterChatResponse | null;
  if (!response.ok) {
    throw new Error(
      `Qwen inference failed: ${response.status} ${response.statusText}`
    );
  }

  const choice = payload?.choices?.[0];
  const content = choice?.message?.content?.trim();
  if (!content) {
    throw new Error("Qwen inference returned no text content");
  }

  return {
    model: QWEN_AB_MODEL_ID,
    content,
    finishReason: choice?.finish_reason ?? null,
    usage: {
      promptTokens: payload?.usage?.prompt_tokens ?? null,
      completionTokens: payload?.usage?.completion_tokens ?? null,
      totalTokens: payload?.usage?.total_tokens ?? null,
    },
  };
}
