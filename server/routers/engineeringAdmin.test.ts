import { describe, expect, it, vi } from "vitest";
import { engineeringAdminRouter } from "./engineeringAdmin";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../db", () => ({ getDb: vi.fn(async () => ({ select: mocks.select, insert: mocks.insert, update: mocks.update })) }));

function chain(rows: unknown[]) {
  const terminal = {
    limit: vi.fn(async () => rows),
    orderBy: vi.fn(() => terminal),
    then: (resolve: (value: unknown[]) => unknown) => resolve(rows),
  };
  const query = {
    where: vi.fn(() => terminal),
    orderBy: vi.fn(() => terminal),
    innerJoin: vi.fn(() => query),
  };
  return { from: vi.fn(() => query) };
}

const adminCtx = { user: { id: 99, role: "admin" } } as any;

describe("engineeringAdminRouter", () => {
  it("creates an active Partner assignment only when both users belong to the tenant and writes an audit event", async () => {
    mocks.select.mockReset(); mocks.insert.mockReset();
    mocks.select
      .mockReturnValueOnce(chain([{ userId: 11, role: "success_partner" }, { userId: 22, role: "user" }]))
      .mockReturnValueOnce(chain([]));
    mocks.insert.mockReturnValueOnce({ values: vi.fn(() => ({ $returningId: vi.fn(async () => [{ id: 44 }]) })) })
      .mockReturnValueOnce({ values: vi.fn(async () => undefined) });

    const result = await engineeringAdminRouter.createCaller(adminCtx).assignPartner({ tenantId: 1, partnerUserId: 11, participantUserId: 22 });

    expect(result).toEqual({ assignmentId: 44, created: true });
    expect(mocks.insert).toHaveBeenCalledTimes(2);
  });

  it("rejects a Partner assignment when the selected Partner lacks a coaching role", async () => {
    mocks.select.mockReset();
    mocks.select.mockReturnValueOnce(chain([{ userId: 11, role: "user" }, { userId: 22, role: "user" }]));

    await expect(engineeringAdminRouter.createCaller(adminCtx).assignPartner({ tenantId: 1, partnerUserId: 11, participantUserId: 22 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("summarises per-version pass/fail evidence and release gates", async () => {
    mocks.select.mockReset();
    mocks.select
      .mockReturnValueOnce(chain([{ id: 7, agentCode: "success_partner_nudges", versionLabel: "nudges-v1", modelId: "claude-sonnet-4-6", promptHash: "abc", status: "candidate", createdAt: new Date(), updatedAt: new Date() }]))
      .mockReturnValueOnce(chain([
        { id: 1, promptVersionId: 7, agentCode: "success_partner_nudges", caseCode: "privacy", status: "passed", score: 95, evidence: {}, failureReasons: [], createdAt: new Date() },
        { id: 2, promptVersionId: 7, agentCode: "success_partner_nudges", caseCode: "tone", status: "failed", score: 40, evidence: {}, failureReasons: ["directive tone"], createdAt: new Date() },
      ]));

    const result = await engineeringAdminRouter.createCaller(adminCtx).promptEvaluationDashboard({ agentCode: "success_partner_nudges" });

    expect(result.versions[0]?.summary).toMatchObject({ total: 2, passed: 1, failed: 1, blocked: 0, passRate: 50, releaseGate: "blocked" });
  });
});
