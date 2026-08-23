import { z } from "zod";
import { invokeLLM, type InvokeParams, type InvokeResult } from "./_core/llm";

type StructuredRequest = Omit<
  InvokeParams,
  "responseFormat" | "response_format" | "outputSchema" | "output_schema"
>;

type StructuredInvoker = (request: InvokeParams) => Promise<InvokeResult>;

export type StructuredOutputFailure =
  | "invoke_failed"
  | "empty_response"
  | "invalid_json"
  | "invalid_schema";

export type StructuredOutputResult<T> =
  | { status: "success"; value: T }
  | { status: "fallback"; value: T; failure: StructuredOutputFailure };

export type InvokeStructuredOptions<T> = {
  context: string;
  schemaName: string;
  schema: z.ZodType<T>;
  fallback: T;
  request: StructuredRequest;
  mode?: "json_schema" | "json_object";
  invoke?: StructuredInvoker;
};

function extractText(result: InvokeResult): string {
  const content = result.choices?.[0]?.message?.content ?? "";
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map(part => part.text)
    .join("")
    .trim();
}

function logFallback(context: string, failure: StructuredOutputFailure) {
  // Model responses can contain assessment and coaching data. Log only the
  // failure classification, never raw model content or prompt material.
  console.warn(`[StructuredLLM] ${context}: ${failure}; using typed fallback.`);
}

/**
 * Invokes the platform LLM with an explicit JSON contract, then validates the
 * response with Zod. Callers receive either a typed value or their declared
 * fallback and can preserve feature-specific failure behaviour without owning
 * parsing, regex extraction, or raw response logging.
 */
export async function invokeStructured<T>(
  options: InvokeStructuredOptions<T>,
): Promise<StructuredOutputResult<T>> {
  const { context, schemaName, schema, fallback, request, mode = "json_schema", invoke = invokeLLM } = options;

  const responseFormat = mode === "json_schema"
    ? {
        type: "json_schema" as const,
        json_schema: {
          name: schemaName,
          strict: true,
          schema: z.toJSONSchema(schema) as Record<string, unknown>,
        },
      }
    : { type: "json_object" as const };

  let result: InvokeResult;
  try {
    result = await invoke({ ...request, responseFormat });
  } catch {
    logFallback(context, "invoke_failed");
    return { status: "fallback", value: fallback, failure: "invoke_failed" };
  }

  const raw = extractText(result);
  if (!raw) {
    logFallback(context, "empty_response");
    return { status: "fallback", value: fallback, failure: "empty_response" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    logFallback(context, "invalid_json");
    return { status: "fallback", value: fallback, failure: "invalid_json" };
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    logFallback(context, "invalid_schema");
    return { status: "fallback", value: fallback, failure: "invalid_schema" };
  }

  return { status: "success", value: validated.data };
}
