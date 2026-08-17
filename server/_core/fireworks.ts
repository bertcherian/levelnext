import { ENV } from "./env";

const FIREWORKS_CHAT_COMPLETIONS_URL =
  "https://api.fireworks.ai/inference/v1/chat/completions";

export const QWEN_AB_MODEL_ID = "accounts/fireworks/models/qwen3-30b-a3b";

type FireworksChatResponse = {
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
  if (!ENV.fireworksApiKey) {
    throw new Error("FIREWORKS_API_KEY is not configured");
  }

  const response = await fetch(FIREWORKS_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${ENV.fireworksApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: QWEN_AB_MODEL_ID,
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt },
      ],
      max_tokens: input.maxTokens,
      temperature: input.temperature,
    }),
    signal: AbortSignal.timeout(input.timeoutMs ?? 90_000),
  });

  const payload = (await response.json().catch(() => null)) as FireworksChatResponse | null;
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
