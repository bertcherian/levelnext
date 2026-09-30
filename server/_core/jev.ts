import { ENV } from "./env";
import { jevQuestionSchema, type JevQuestion } from "../../shared/modules/intelligenceFabric";

export type JevRequest = {
  state: string | Record<string, unknown> | unknown[];
  questions: Record<string, JevQuestion>;
  model?: string;
  timeoutMs?: number;
};

export type JevAnswer = {
  type: "noul" | "choice" | "score";
  noul?: number;
  choice?: string;
  score?: number;
  legend?: Record<string, string>;
  probabilities?: Record<string, number>;
  confidence?: number;
};

export type JevResponse = {
  model: string;
  answers: Record<string, JevAnswer>;
  usage?: { input_tokens?: number; output_tokens?: number };
};

const RETRIES = 2;
const DEFAULT_TIMEOUT_MS = 2_000;

function endpointUrl() {
  return `${ENV.typesafeApiUrl.replace(/\/$/, "")}/v1/systemone`;
}

function retryDelay(attempt: number) {
  return 150 * 2 ** attempt;
}

function isRetryableStatus(status: number) {
  return status === 429 || status === 529 || status >= 500;
}

function safeErrorMessage(status: number, statusText: string) {
  return `Jev request failed (${status} ${statusText || "provider error"})`;
}

function parseResponse(payload: unknown): JevResponse {
  if (!payload || typeof payload !== "object") throw new Error("Jev returned an invalid response");
  const value = payload as { model?: unknown; answers?: unknown; usage?: unknown };
  if (typeof value.model !== "string" || !value.answers || typeof value.answers !== "object") {
    throw new Error("Jev returned an incomplete decision response");
  }
  return {
    model: value.model,
    answers: value.answers as Record<string, JevAnswer>,
    usage: value.usage && typeof value.usage === "object" ? value.usage as JevResponse["usage"] : undefined,
  };
}

export function isJevConfigured() {
  return Boolean(ENV.typesafeApiKey.trim());
}

export async function evaluateWithJev(input: JevRequest): Promise<JevResponse> {
  if (!isJevConfigured()) throw new Error("Jev provider is not configured");
  for (const [key, question] of Object.entries(input.questions)) {
    const result = jevQuestionSchema.safeParse(question);
    if (!result.success) throw new Error(`Invalid Jev question: ${key}`);
  }
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      const response = await fetch(endpointUrl(), {
        method: "POST",
        headers: {
          authorization: `Bearer ${ENV.typesafeApiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          state: input.state,
          model: input.model ?? "jev-latest",
          questions: input.questions,
        }),
        signal: AbortSignal.timeout(input.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      });
      if (!response.ok) {
        if (isRetryableStatus(response.status) && attempt < RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay(attempt)));
          continue;
        }
        throw new Error(safeErrorMessage(response.status, response.statusText));
      }
      return parseResponse(await response.json());
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Jev request failed");
      if (attempt >= RETRIES || lastError.message.includes("Invalid Jev") || lastError.message.includes("incomplete")) throw lastError;
      await new Promise((resolve) => setTimeout(resolve, retryDelay(attempt)));
    }
  }
  throw lastError ?? new Error("Jev request failed");
}
