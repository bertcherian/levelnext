import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const mockGetDb = vi.hoisted(() => vi.fn());
vi.mock("../db", () => ({ getDb: mockGetDb }));

import { interviewPrepRouter } from "./interviewPrep";
import { negotiationRouter } from "./negotiation";

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
  const deleteWhere = vi.fn(async () => undefined);
  return {
    select: vi.fn(() => queryResult(selectResults.shift() ?? [])),
    delete: vi.fn(() => ({ where: deleteWhere })),
    deleteWhere,
  };
}

function context(userId: number): TrpcContext {
  return {
    user: { id: userId, openId: `career-user-${userId}`, email: `user-${userId}@example.com`, name: "Career User", loginMethod: "email", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Career destructive-action ownership", () => {
  beforeEach(() => vi.resetAllMocks());

  it("denies interview-prep deletion when the caller does not own the session", async () => {
    const db = makeDb([[]]);
    mockGetDb.mockResolvedValue(db);
    await expect(interviewPrepRouter.createCaller(context(2)).deletePrep({ id: 41 }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("deletes an interview-prep session only after finding the caller-owned record", async () => {
    const db = makeDb([[{ id: 41 }]]);
    mockGetDb.mockResolvedValue(db);
    await expect(interviewPrepRouter.createCaller(context(1)).deletePrep({ id: 41 })).resolves.toEqual({ success: true });
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.deleteWhere).toHaveBeenCalledTimes(1);
  });

  it("denies negotiation deletion when the caller does not own the session", async () => {
    const db = makeDb([[]]);
    mockGetDb.mockResolvedValue(db);
    await expect(negotiationRouter.createCaller(context(2)).deleteSession({ id: 42 }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("deletes a negotiation session only after finding the caller-owned record", async () => {
    const db = makeDb([[{ id: 42 }]]);
    mockGetDb.mockResolvedValue(db);
    await expect(negotiationRouter.createCaller(context(1)).deleteSession({ id: 42 })).resolves.toEqual({ success: true });
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.deleteWhere).toHaveBeenCalledTimes(1);
  });
});

describe("Career scoring and parsing safeguards", () => {
  const careerAccess = readFileSync("server/routers/careerAccess.ts", "utf8");
  const negotiation = readFileSync("server/routers/negotiation.ts", "utf8");

  it("updates only the new relationship contact after AI scoring", () => {
    expect(careerAccess).toContain("}).$returningId()");
    expect(careerAccess).toContain("eq(relationshipContacts.id, inserted.id)");
    expect(careerAccess).not.toContain(".set(scoreResult)\n          .where(eq(relationshipContacts.userId, ctx.user.id))");
  });

  it("uses safe parsing before persisting negotiation strategy data", () => {
    expect(negotiation).toContain("safeJsonParse<Record<string, unknown> | null>");
    expect(negotiation).toContain("Could not parse negotiation strategy");
    expect(negotiation).not.toContain("const strategyData = JSON.parse(jsonMatch[0])");
  });
});
