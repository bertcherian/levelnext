import { describe, expect, it } from "vitest";
import { z } from "zod";
import { invokeStructured } from "./structuredLlm";
import type { InvokeParams, InvokeResult } from "./_core/llm";

const response = (content: string): InvokeResult => ({
  id: "test",
  created: 0,
  model: "test-model",
  choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
});

const request: Omit<InvokeParams, "responseFormat" | "response_format" | "outputSchema" | "output_schema"> = {
  model: "claude-haiku-4-5",
  messages: [{ role: "user", content: "Return a value." }],
};

describe("invokeStructured", () => {
  const schema = z.object({ label: z.string(), score: z.number() });
  const fallback = { label: "fallback", score: 0 };

  it("returns a typed value and requests strict JSON schema output", async () => {
    let captured: InvokeParams | undefined;
    const result = await invokeStructured({
      context: "test.valid",
      schemaName: "test_response",
      schema,
      fallback,
      request,
      invoke: async params => {
        captured = params;
        return response('{"label":"validated","score":7}');
      },
    });

    expect(result).toEqual({ status: "success", value: { label: "validated", score: 7 } });
    expect(captured?.responseFormat).toMatchObject({
      type: "json_schema",
      json_schema: { name: "test_response", strict: true },
    });
  });

  it("uses the declared fallback for malformed JSON", async () => {
    const result = await invokeStructured({
      context: "test.malformed",
      schemaName: "test_response",
      schema,
      fallback,
      request,
      invoke: async () => response("{not-json}"),
    });

    expect(result).toEqual({ status: "fallback", value: fallback, failure: "invalid_json" });
  });

  it("uses the declared fallback when an AI provider returns no choices", async () => {
    const result = await invokeStructured({
      context: "test.empty-choices",
      schemaName: "test_response",
      schema,
      fallback,
      request,
      invoke: async () => ({ id: "empty", created: 0, model: "test-model", choices: [] }),
    });

    expect(result).toEqual({ status: "fallback", value: fallback, failure: "empty_response" });
  });

  it("uses the declared fallback for schema-invalid JSON", async () => {
    const result = await invokeStructured({
      context: "test.invalid-schema",
      schemaName: "test_response",
      schema,
      fallback,
      request,
      invoke: async () => response('{"label":"missing score"}'),
    });

    expect(result).toEqual({ status: "fallback", value: fallback, failure: "invalid_schema" });
  });

  it("supports JSON-object mode where feature contracts allow additional fields", async () => {
    let captured: InvokeParams | undefined;
    const result = await invokeStructured({
      context: "test.json-object",
      schemaName: "test_response",
      schema: z.object({ label: z.string() }).passthrough(),
      fallback: { label: "fallback" },
      request,
      mode: "json_object",
      invoke: async params => {
        captured = params;
        return response('{"label":"playbook","extra":"retained"}');
      },
    });

    expect(result).toEqual({ status: "success", value: { label: "playbook", extra: "retained" } });
    expect(captured?.responseFormat).toEqual({ type: "json_object" });
  });
});
