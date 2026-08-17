import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const mockGetDb = vi.hoisted(() => vi.fn());
vi.mock("../db", () => ({ getDb: mockGetDb }));
import { earlyCareerRouter } from "./earlyCareer";

function queryResult(value: unknown) {
  const chain: any = { from: () => chain, where: () => chain, orderBy: () => chain, limit: async () => value, then: (resolve: (result: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(value).then(resolve, reject) };
  return chain;
}
function makeDb(results: unknown[]) {
  const values = vi.fn(() => ({ $returningId: async () => [{ id: 31 }] }));
  const updateWhere = vi.fn(async () => undefined);
  const deleteWhere = vi.fn(async () => undefined);
  return { select: vi.fn(() => queryResult(results.shift() ?? [])), insert: vi.fn(() => ({ values })), update: vi.fn(() => ({ set: () => ({ where: updateWhere }) })), delete: vi.fn(() => ({ where: deleteWhere })), values, updateWhere, deleteWhere };
}
function context(userId: number, role = "user"): TrpcContext { return { user: { id: userId, openId: `cohort-${userId}`, email: `cohort-${userId}@example.com`, name: "Cohort Owner", loginMethod: "email", role: role as "user" | "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("Early Career cohort administration", () => {
  beforeEach(() => vi.resetAllMocks());
  it("allows an organisation owner to create a cohort for a same-tenant manager", async () => {
    const db = makeDb([[{ tenantId: 5, role: "owner" }], [{ tenantId: 5, userId: 9 }]]);
    mockGetDb.mockResolvedValue(db);
    await expect(earlyCareerRouter.createCaller(context(1)).createCohort({ tenantId: 5, name: "Graduate engineering", managerUserId: 9 })).resolves.toEqual({ id: 31 });
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 5, managerUserId: 9, createdByUserId: 1 }));
  });
  it("denies cohort creation to a user without owner access", async () => {
    const db = makeDb([[]]);
    mockGetDb.mockResolvedValue(db);
    await expect(earlyCareerRouter.createCaller(context(2)).createCohort({ tenantId: 5, name: "Graduate engineering", managerUserId: 9 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.insert).not.toHaveBeenCalled();
  });
  it("aligns a cohort member to the cohort manager after tenant and owner checks", async () => {
    const db = makeDb([[{ id: 12, tenantId: 5 }], [{ tenantId: 5, role: "owner" }], [{ id: 31, tenantId: 5, managerUserId: 9 }]]);
    mockGetDb.mockResolvedValue(db);
    await expect(earlyCareerRouter.createCaller(context(1)).assignCohortMember({ employeeUserId: 12, cohortId: 31 })).resolves.toEqual({ success: true, managerUserId: 9 });
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.updateWhere).toHaveBeenCalledTimes(1);
  });
  it("rejects membership assignment to a cohort outside the employee organisation", async () => {
    const db = makeDb([[{ id: 12, tenantId: 5 }], [{ tenantId: 5, role: "owner" }], []]);
    mockGetDb.mockResolvedValue(db);
    await expect(earlyCareerRouter.createCaller(context(1)).assignCohortMember({ employeeUserId: 12, cohortId: 31 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
