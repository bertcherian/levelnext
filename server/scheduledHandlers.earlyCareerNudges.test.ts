import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { earlyCareerNudgeDeliveryHandler } from "./scheduledHandlers";

function responseStub() {
  const state: { status?: number; body?: unknown } = {};
  const response = {
    status: vi.fn((status: number) => { state.status = status; return response; }),
    json: vi.fn((body: unknown) => { state.body = body; return response; }),
  };
  return { response, state };
}

function taskOwnedDb(config: Record<string, unknown>) {
  const execute = vi.fn().mockResolvedValue({});
  const limit = vi.fn().mockResolvedValue([config]);
  const where = vi.fn(() => ({ limit }));
  const db = {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
    execute,
  };
  return { db, execute, where };
}

describe("earlyCareerNudgeDeliveryHandler", () => {
  const scheduledAt = new Date("2026-08-19T08:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(scheduledAt);
    mocks.authenticateRequest.mockReset();
    mocks.getDb.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it("rejects non-cron callers before touching the database", async () => {
    mocks.authenticateRequest.mockResolvedValue({ isCron: false });
    const { response, state } = responseStub();

    await earlyCareerNudgeDeliveryHandler({} as never, response as never);

    expect(state.status).toBe(403);
    expect(state.body).toEqual({ error: "cron-only" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("selects the enabled config through the authenticated task UID and keeps retry windows stable", async () => {
    mocks.authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "task-early-career-1" });
    const { db, execute, where } = taskOwnedDb({
      id: 42,
      tenantId: 7,
      enabled: true,
      audience: "employees",
      cadence: "weekly",
      journeyStage: "all",
      dayOfWeek: 3,
      hourUtc: 8,
      scheduleCronTaskUid: "task-early-career-1",
      cadenceAnchorAt: scheduledAt,
    });
    mocks.getDb.mockResolvedValue(db);
    const first = responseStub();
    const retry = responseStub();

    await earlyCareerNudgeDeliveryHandler({} as never, first.response as never);
    await earlyCareerNudgeDeliveryHandler({} as never, retry.response as never);

    expect(where).toHaveBeenCalled();
    expect(execute).toHaveBeenCalledTimes(2);
    expect(first.state.body).toMatchObject({ ok: true, configId: 42, cadenceWindowKey: "v1:0" });
    expect(retry.state.body).toMatchObject({ ok: true, configId: 42, cadenceWindowKey: "v1:0" });
  });

  it("executes audience and stage eligibility with duplicate-key suppression", async () => {
    mocks.authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "task-early-career-managers" });
    const { db, execute } = taskOwnedDb({
      id: 43,
      tenantId: 7,
      enabled: true,
      audience: "managers",
      cadence: "monthly",
      journeyStage: "deliver",
      dayOfWeek: 3,
      hourUtc: 8,
      scheduleCronTaskUid: "task-early-career-managers",
      cadenceAnchorAt: scheduledAt,
    });
    mocks.getDb.mockResolvedValue(db);
    const { response } = responseStub();

    await earlyCareerNudgeDeliveryHandler({} as never, response as never);

    const executedSql = JSON.stringify((execute.mock.calls[0]?.[0] as { queryChunks?: unknown[] }).queryChunks ?? []);
    expect(executedSql).toContain("managerUserId");
    expect(executedSql).toContain("journeyStage");
    expect(executedSql).toContain("ON DUPLICATE KEY UPDATE");
    expect(executedSql).toContain("cadenceWindowKey");
  });
});
