export const QWEN_AB_MODEL_ID = "accounts/fireworks/models/qwen3-30b-a3b";

/**
 * This route is deliberately disabled. Unlike the active OpenRouter path, it
 * does not carry LevelNext's per-request zero-retention/no-collection policy.
 */
export const FIREWORKS_QWEN_ROUTE_DISABLED_REASON =
  "Fireworks Qwen inference is disabled by LevelNext's AI data-use policy. Use the privacy-enforced OpenRouter route instead.";

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

/**
 * Kept only for backwards-compatible imports. It fails before making any
 * network request, preventing accidental transmission of user content.
 */
export async function invokeQwenComparison(_input: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  timeoutMs?: number;
}): Promise<QwenComparisonResponse> {
  throw new Error(FIREWORKS_QWEN_ROUTE_DISABLED_REASON);
}
