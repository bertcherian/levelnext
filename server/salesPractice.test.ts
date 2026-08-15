import { describe, expect, it, vi } from "vitest";

const llm = vi.hoisted(() => ({ invokeLLM: vi.fn() }));

vi.mock("./_core/llm", () => ({
  invokeLLM: llm.invokeLLM,
  safeJsonParse: <T>(raw: string, fallback: T) => {
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  },
}));

import { continueSalesPractice, createSalesPracticeScenario, debriefSalesPractice } from "./salesPractice";

describe("Sales buyer practice", () => {
  it("keeps the user as seller and preserves the requested buyer role when generating a rehearsal", async () => {
    llm.invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ buyerRole: "Ignored buyer role", buyerStance: "Cautious", openingLine: "What would change for us?", challenge: "Tests direct evidence", successSignal: "Agreed evidence-seeking next step", evidenceBoundary: "Practice only" }) } }] });
    const scenario = await createSalesPracticeScenario({ buyerRole: "Procurement lead", rawSituation: "The customer has asked for another discount while value evidence remains incomplete.", objective: "Test a discovery-first response" });
    expect(scenario.buyerRole).toBe("Procurement lead");
    expect(llm.invokeLLM.mock.calls[0][0].messages[0].content).toContain("The user is the SELLER");
  });

  it("keeps AI turns in the buyer role and returns only a buyer reply", async () => {
    llm.invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: "I need clearer evidence before I can agree to that next step." } }] });
    const reply = await continueSalesPractice({ scenario: { buyerRole: "Economic buyer", buyerStance: "Sceptical", openingLine: "Why should I change?", challenge: "Tests value", successSignal: "A clear next step", evidenceBoundary: "Practice only" }, messages: [{ role: "buyer", content: "Why should I change?", timestamp: 1 }], sellerMessage: "Could we compare the current operating cost with the target state?" });
    expect(reply).toContain("evidence");
    expect(llm.invokeLLM.mock.calls[1][0].messages[0].content).toContain("USER is always the SELLER");
  });

  it("creates a transcript-bound debrief rather than claiming knowledge of the real buyer", async () => {
    llm.invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ strengths: ["Asked a direct evidence question"], tryNext: ["Pause before proposing a concession"], evidenceQuestion: "Which evidence would change your move?", keyTakeaway: "Lead with curiosity.", evidenceBoundary: "Based on the rehearsal transcript only." }) } }] });
    const debrief = await debriefSalesPractice({ scenario: { buyerRole: "Buyer", buyerStance: "Neutral", openingLine: "What is your view?", challenge: "Clarify", successSignal: "A next step", evidenceBoundary: "Practice only" }, messages: [{ role: "seller", content: "What evidence would you need to assess the value?", timestamp: 1 }] });
    expect(debrief.evidenceBoundary).toContain("transcript");
    expect(llm.invokeLLM.mock.calls[2][0].messages[0].content).toContain("Do not diagnose");
  });
});
