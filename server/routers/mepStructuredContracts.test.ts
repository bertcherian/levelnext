import { describe, expect, it } from "vitest";
import { invokeStructured } from "../structuredLlm";
import type { InvokeParams, InvokeResult } from "../_core/llm";
import {
  COMMITMENT_SUGGESTIONS_FALLBACK,
  commitmentSuggestionsSchema,
  DAILY_BRIEF_FALLBACK,
  dailyBriefSchema,
  DIAGNOSTIC_ANALYSIS_FALLBACK,
  diagnosticAnalysisSchema,
  PLAYBOOK_FALLBACK,
  playbookSchema,
  PRACTICE_FEEDBACK_FALLBACK,
  practiceFeedbackSchema,
  TEAM_MEMBER_INSIGHT_FALLBACK,
  teamMemberInsightSchema,
} from "./mepStructuredContracts";

const request: Omit<InvokeParams, "responseFormat" | "response_format" | "outputSchema" | "output_schema"> = {
  model: "claude-haiku-4-5",
  messages: [{ role: "user", content: "Return valid JSON." }],
};

const malformedResponse: InvokeResult = {
  id: "test",
  created: 0,
  model: "test-model",
  choices: [{ index: 0, message: { role: "assistant", content: "not-json" }, finish_reason: "stop" }],
};

describe("MEP structured-output fallback contracts", () => {
  const contracts = [
    ["diagnostic analysis", diagnosticAnalysisSchema, DIAGNOSTIC_ANALYSIS_FALLBACK, "json_schema"],
    ["playbook", playbookSchema, PLAYBOOK_FALLBACK, "json_object"],
    ["daily brief", dailyBriefSchema, DAILY_BRIEF_FALLBACK, "json_schema"],
    ["practice feedback", practiceFeedbackSchema, PRACTICE_FEEDBACK_FALLBACK, "json_schema"],
    ["team member insight", teamMemberInsightSchema, TEAM_MEMBER_INSIGHT_FALLBACK, "json_object"],
    ["commitment suggestions", commitmentSuggestionsSchema, COMMITMENT_SUGGESTIONS_FALLBACK, "json_object"],
  ] as const;

  for (const [name, schema, fallback, mode] of contracts) {
    it(`returns the declared ${name} fallback when model content is malformed`, async () => {
      const result = await invokeStructured({
        context: `mep.${name}`,
        schemaName: `mep_${name.replaceAll(" ", "_")}`,
        schema,
        fallback,
        request,
        mode,
        invoke: async () => malformedResponse,
      });

      expect(result).toEqual({ status: "fallback", value: fallback, failure: "invalid_json" });
    });
  }
});
