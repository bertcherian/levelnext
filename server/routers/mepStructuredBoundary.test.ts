import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mepSource = readFileSync(new URL("./mep.ts", import.meta.url), "utf8");

describe("MEP structured LLM boundary", () => {
  it("routes every JSON-producing MEP flow through the shared helper", () => {
    for (const context of [
      "mep.submitDiagnostic",
      "mep.generatePlaybook",
      "mep.getDailyBrief",
      "mep.endPracticeSession",
      "mep.generateTeamMemberInsight",
      "mep.suggestCommitments",
    ]) {
      expect(mepSource).toContain(`context: "${context}"`);
    }

    expect(mepSource).toContain('import { invokeStructured } from "../structuredLlm";');
    expect(mepSource).not.toContain("safeJsonParse");
    expect(mepSource).not.toContain("match(/\\{[\\s\\S]*\\}/)");
  });

  it("keeps declared fallback contracts for persisted MEP content", () => {
    expect(mepSource).toContain("DAILY_BRIEF_FALLBACK");
    expect(mepSource).toContain("PRACTICE_FEEDBACK_FALLBACK");
    expect(mepSource).toContain("TEAM_MEMBER_INSIGHT_FALLBACK");
    expect(mepSource).toContain("fallback: { suggestions: [] }");
    expect(mepSource).toContain("fallback: {}");
  });
});
