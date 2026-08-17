import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
const mockGetDb = vi.hoisted(() => vi.fn());
vi.mock("../db", () => ({ getDb: mockGetDb }));
import { earlyCareerRouter } from "./earlyCareer";

function queryResult(value: unknown) { const chain: any = { from: () => chain, innerJoin: () => chain, where: () => chain, orderBy: () => chain, limit: async () => value, then: (resolve: (result: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(value).then(resolve, reject) }; return chain; }
function makeDb(results: unknown[]) { return { select: vi.fn(() => queryResult(results.shift() ?? [])) }; }
function context(): TrpcContext { return { user: { id: 9, openId: "manager-9", email: "manager@example.com", name: "Manager", loginMethod: "email", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("Manager cohort practice analytics privacy", () => {
  it("returns only scenario categories used by at least three different assigned employees", async () => {
    const employees = [1, 2, 3, 4].map((id) => ({ employee: { id, name: `Employee ${id}`, email: null }, profile: { journeyStage: "orient" } }));
    const sessions = [
      { userId: 1, scenarioId: "receive_feedback", scenarioTitle: "Respond well to feedback" },
      { userId: 2, scenarioId: "receive_feedback", scenarioTitle: "Respond well to feedback" },
      { userId: 3, scenarioId: "receive_feedback", scenarioTitle: "Respond well to feedback" },
      { userId: 4, scenarioId: "custom", scenarioTitle: "Private difficult conversation" },
    ];
    mockGetDb.mockResolvedValue(makeDb([employees, [], [], [], [], [], sessions]));
    const result = await earlyCareerRouter.createCaller(context()).getManagerCompanion();
    expect(result.practiceAnalytics.categories).toEqual([expect.objectContaining({ label: "Respond well to feedback", participantCount: 3, sessionCount: 3 })]);
    expect(result.practiceAnalytics.withheldCategoryCount).toBe(1);
    expect(JSON.stringify(result.practiceAnalytics)).not.toContain("Private difficult conversation");
  });
});
