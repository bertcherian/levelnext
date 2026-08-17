import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const mockGetDb = vi.hoisted(() => vi.fn());
vi.mock("../db", () => ({ getDb: mockGetDb }));

import { earlyCareerRouter } from "./earlyCareer";

function queryResult(value: unknown) {
  const chain: any = {
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: async () => value,
    then: (resolve: (result: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(value).then(resolve, reject),
  };
  return chain;
}

function makeDb(selectResults: unknown[]) {
  const returningId = vi.fn(async () => [{ id: 77 }]);
  const values = vi.fn(() => ({ $returningId: returningId }));
  const deleteWhere = vi.fn(async () => undefined);
  return {
    select: vi.fn(() => queryResult(selectResults.shift() ?? [])),
    insert: vi.fn(() => ({ values })),
    delete: vi.fn(() => ({ where: deleteWhere })),
    values,
    deleteWhere,
  };
}

function context(userId: number): TrpcContext {
  return {
    user: { id: userId, openId: `early-user-${userId}`, email: `user-${userId}@example.com`, name: "Early Career User", loginMethod: "email", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Early Career saved practice privacy", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns saved scenarios through the caller-owned query", async () => {
    const db = makeDb([[{ id: 5, userId: 1, title: "Deadline update" }]]);
    mockGetDb.mockResolvedValue(db);
    await expect(earlyCareerRouter.createCaller(context(1)).getSavedPracticeScenarios()).resolves.toEqual([{ id: 5, userId: 1, title: "Deadline update" }]);
  });

  it("persists a saved scenario under the authenticated employee and their tenant", async () => {
    const db = makeDb([[{ tenantId: 9 }]]);
    mockGetDb.mockResolvedValue(db);
    await expect(earlyCareerRouter.createCaller(context(1)).savePracticeScenario({ title: "Deadline update", context: "I need to explain that a delivery date is at risk because a dependency is late.", counterpartRole: "manager", objective: "Agree a recovery plan." })).resolves.toEqual({ id: 77 });
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ userId: 1, tenantId: 9, title: "Deadline update" }));
  });

  it("does not delete a saved scenario that is not owned by the caller", async () => {
    const db = makeDb([[]]);
    mockGetDb.mockResolvedValue(db);
    await expect(earlyCareerRouter.createCaller(context(2)).deleteSavedPracticeScenario({ id: 5 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("deletes a saved scenario only after finding the caller-owned record", async () => {
    const db = makeDb([[{ id: 5 }]]);
    mockGetDb.mockResolvedValue(db);
    await expect(earlyCareerRouter.createCaller(context(1)).deleteSavedPracticeScenario({ id: 5 })).resolves.toEqual({ success: true });
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.deleteWhere).toHaveBeenCalledTimes(1);
  });

  it("returns only the caller's private practice-session history", async () => {
    const db = makeDb([[{ id: 12, userId: 1, scenarioTitle: "Deadline update", status: "completed" }]]);
    mockGetDb.mockResolvedValue(db);
    await expect(earlyCareerRouter.createCaller(context(1)).getPracticeHistory()).resolves.toEqual([{ id: 12, userId: 1, scenarioTitle: "Deadline update", status: "completed" }]);
  });
});
