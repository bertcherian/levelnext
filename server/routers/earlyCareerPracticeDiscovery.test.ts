import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
const mockGetDb = vi.hoisted(() => vi.fn());
vi.mock("../db", () => ({ getDb: mockGetDb }));
import { earlyCareerRouter } from "./earlyCareer";
function queryResult(value: unknown) { const chain: any = { from: () => chain, where: () => chain, orderBy: () => chain, limit: async () => value, then: (resolve: (result: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(value).then(resolve, reject) }; return chain; }
function context(): TrpcContext { return { user: { id: 1, openId: "practice-user", email: "practice@example.com", name: "Practice User", loginMethod: "email", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
describe("Early Career practice discovery", () => {
  it("maps the in-progress discovery filter to active persisted sessions and preserves private owner scope", async () => {
    const active = { id: 1, userId: 1, scenarioId: "receive_feedback", scenarioTitle: "Respond well to feedback", status: "active", updatedAt: new Date() };
    const complete = { id: 2, userId: 1, scenarioId: "receive_feedback", scenarioTitle: "Respond well to feedback", status: "completed", updatedAt: new Date() };
    mockGetDb.mockResolvedValue({ select: vi.fn(() => queryResult([active, complete])) });
    await expect(earlyCareerRouter.createCaller(context()).getPracticeHistory({ status: "in_progress", dateRange: "all", sort: "newest" })).resolves.toEqual([active]);
  });
});
