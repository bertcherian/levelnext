import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const mockGetDb = vi.hoisted(() => vi.fn());
const mockAnalysis = vi.hoisted(() => ({
  whatIsHappening: "The buyer is using price pressure before value is jointly verified.",
  whatWeKnow: ["The buyer asked for a further discount."],
  whatWeAreAssuming: ["Price is the deciding issue."],
  whatMattersMost: "Test the business value and decision criteria.",
  primaryConstraint: "Unquantified value", constraintEvidence: ["No value evidence was supplied."],
  confidence: "low" as const, missingInformation: ["Who owns the business case?"],
  recommendedNextMove: "Ask for the evaluation criteria before offering any concession.",
  alternativeMove: "Pause the proposal revision until the criteria are clear.",
  whatWouldChangeJudgment: "Direct buyer confirmation of evaluation criteria.",
  practicePrompt: "Practice asking a calm, direct value question.",
}));

vi.mock("../db", () => ({ getDb: mockGetDb }));
vi.mock("../salesIntelligence", () => ({ analyzeCommercialSituation: vi.fn(async () => mockAnalysis) }));

function queryResult(value: unknown) {
  const chain: any = {
    from: () => chain, where: () => chain, orderBy: () => chain, limit: async () => value,
    then: (resolve: (result: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(value).then(resolve, reject),
  };
  return chain;
}

function insertResult(id = 71) {
  const result: any = Promise.resolve([{ insertId: id }]);
  result.$returningId = async () => [{ id }];
  return result;
}

function makeDb(selectResults: unknown[] = []) {
  const inserted: unknown[] = [];
  const values = vi.fn((value: unknown) => { inserted.push(value); return insertResult(); });
  const updateWhere = vi.fn(async () => undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  return {
    select: vi.fn(() => queryResult(selectResults.shift() ?? [])),
    insert: vi.fn(() => ({ values })), update: vi.fn(() => ({ set: updateSet })),
    inserted, updateSet,
  };
}

function context(userId = 1): TrpcContext {
  return { user: { id: userId, openId: `seller-${userId}`, email: `seller-${userId}@example.com`, name: "Seller", loginMethod: "email", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("Sales Intelligence behavioral procedures", () => {
  it("persists a seller-owned situation with evidence claims after structured analysis", async () => {
    const db = makeDb(); mockGetDb.mockResolvedValue(db);
    const { salesIntelligenceRouter } = await import("./salesIntelligence");
    const result = await salesIntelligenceRouter.createCaller(context(1)).analyzeSituation({ title: "Discount request", accountName: "Acme", situation: "The buyer asked for a further discount without confirming their evaluation criteria.", desiredOutcome: "Clarify the business case before revising price." });
    expect(result).toMatchObject({ id: 71, judgment: { primaryConstraint: "Unquantified value" } });
    expect(db.inserted[0]).toMatchObject({ userId: 1, title: "Discount request", accountName: "Acme" });
    expect(db.inserted[1]).toEqual(expect.arrayContaining([expect.objectContaining({ userId: 1, situationId: 71, category: "fact" }), expect.objectContaining({ userId: 1, situationId: 71, category: "assumption" })]));
  });

  it("only creates a commitment after confirming that the situation belongs to the caller", async () => {
    const db = makeDb([[{ id: 7 }]]); mockGetDb.mockResolvedValue(db);
    const { salesIntelligenceRouter } = await import("./salesIntelligence");
    await salesIntelligenceRouter.createCaller(context(1)).createCommitment({ situationId: 7, action: "Ask the buyer to share the evaluation criteria.", stakeholder: "Procurement" });
    expect(db.inserted[0]).toMatchObject({ userId: 1, situationId: 7, stakeholder: "Procurement" });
    expect(db.updateSet).toHaveBeenCalledWith({ status: "committed" });
  });

  it("rejects a commitment for a situation that is not owned by the caller", async () => {
    const db = makeDb([[]]); mockGetDb.mockResolvedValue(db);
    const { salesIntelligenceRouter } = await import("./salesIntelligence");
    await expect(salesIntelligenceRouter.createCaller(context(1)).createCommitment({ situationId: 9, action: "Ask for the decision criteria." })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.inserted).toEqual([]);
  });

  it("records an outcome reflection and marks the linked situation as reflected", async () => {
    const db = makeDb([[{ id: 31, situationId: 7, userId: 1 }]]); mockGetDb.mockResolvedValue(db);
    const { salesIntelligenceRouter } = await import("./salesIntelligence");
    await salesIntelligenceRouter.createCaller(context(1)).reflectCommitment({ commitmentId: 31, status: "completed", outcome: "The buyer agreed to a value discovery session.", reflection: "Clarifying criteria before price discussion changed the conversation." });
    expect(db.updateSet.mock.calls[0]?.[0]).toMatchObject({ status: "completed", outcome: "The buyer agreed to a value discovery session." });
    expect(db.updateSet.mock.calls[1]?.[0]).toEqual({ status: "reflected" });
  });
});
