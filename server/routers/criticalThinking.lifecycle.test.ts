import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import { CTDM_BEHAVIOUR_ITEMS, CTDM_ENVIRONMENT_ITEMS, CTDM_REFLECTIVE_QUESTIONS, CTDM_SCENARIOS } from "../../shared/modules/criticalThinkingDiagnostic";

vi.mock("../db", () => ({ getDb: vi.fn() }));

import { getDb } from "../db";
import { criticalThinkingRouter } from "./criticalThinking";

function context(): TrpcContext {
  return {
    user: { id: 31, openId: "ctdm-lifecycle", name: "Lifecycle User", email: "lifecycle@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function chainedQuery(rows: unknown[]) {
  const chain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.limit.mockResolvedValue(rows);
  return chain;
}

function immediateWhereQuery(rows: unknown[]) {
  const chain = { from: vi.fn(), where: vi.fn() };
  chain.from.mockReturnValue(chain);
  chain.where.mockResolvedValue(rows);
  return chain;
}

function completePayload(assessmentId: number) {
  return {
    assessmentId,
    currentSection: "reflection" as const,
    behaviourResponses: Object.fromEntries(CTDM_BEHAVIOUR_ITEMS.map((item) => [item.id, 4])),
    scenarioResponses: Object.fromEntries(CTDM_SCENARIOS.map((scenario) => [scenario.id, { optionId: "c", confidence: 80 }])),
    environmentResponses: Object.fromEntries(CTDM_ENVIRONMENT_ITEMS.map((item) => [item.id, 5])),
    reflections: Object.fromEntries(CTDM_REFLECTIVE_QUESTIONS.map((question) => [question.id, "A concise non-confidential reflection for development."])),
  };
}

function lifecycleDb() {
  const assessment = { id: 61, campaignId: 44, tenantId: 7, participantId: 51, userId: 31, status: "in_progress", currentSection: "behaviour", behaviourResponses: {}, scenarioResponses: {}, environmentResponses: {}, reflections: {}, startedAt: new Date(), completedAt: null, updatedAt: new Date() };
  const updateChain = { set: vi.fn(), where: vi.fn() };
  updateChain.set.mockReturnValue(updateChain);
  updateChain.where.mockResolvedValue({});
  const insert = vi.fn()
    .mockReturnValueOnce({ values: vi.fn(() => ({ $returningId: vi.fn().mockResolvedValue([{ id: 61 }]) })) })
    .mockReturnValueOnce({ values: vi.fn(() => ({ $returningId: vi.fn().mockResolvedValue([{ id: 91 }]) })) });
  return {
    select: vi.fn()
      .mockReturnValueOnce(chainedQuery([{ tenantId: 7, role: "member" }]))
      .mockReturnValueOnce(chainedQuery([{ id: 44, tenantId: 7, status: "active", name: "Leadership cohort" }]))
      .mockReturnValueOnce(immediateWhereQuery([{ id: 51, campaignId: 44, tenantId: 7, userId: 31, email: "lifecycle@example.com", participantRole: null, status: "invited", consentAt: null }]))
      .mockReturnValueOnce(chainedQuery([]))
      .mockReturnValueOnce(chainedQuery([assessment]))
      .mockReturnValueOnce(chainedQuery([assessment]))
      .mockReturnValueOnce(chainedQuery([assessment])),
    insert,
    update: vi.fn(() => updateChain),
  };
}

describe("criticalThinking assessment lifecycle", () => {
  it("starts an enrolled assessment, saves all response components, and creates a private report on submission", async () => {
    vi.mocked(getDb).mockResolvedValue(lifecycleDb() as never);
    const caller = criticalThinkingRouter.createCaller(context());

    const started = await caller.start({ campaignId: 44, participantRole: "Director" });
    expect(started.assessment.id).toBe(61);

    const payload = completePayload(61);
    await expect(caller.saveProgress(payload)).resolves.toEqual({ saved: true });
    await expect(caller.submit(payload)).resolves.toMatchObject({ reportId: 91, scores: { appliedJudgmentScore: 100, environmentScore: 100 } });
  });
});
