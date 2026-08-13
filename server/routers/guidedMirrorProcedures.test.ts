import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const mockGetDb = vi.hoisted(() => vi.fn());
const MOCK_ANALYSIS = vi.hoisted(() => ({
  situation: "A manager held a concern until after a planning meeting.",
  observedBehaviour: "They agreed publicly and raised the concern later.",
  diagnosticLens: "choosing" as const,
  capabilitySignal: "No capability gap is established.",
  judgmentSignal: "The stakeholder and commercial risk can be explored further.",
  selfLeadershipSignal: {
    primaryDimension: "courage" as const,
    observation: "The response deferred a material concern.",
    evidence: ["A first-person account."],
    confidence: "low" as const,
  },
  developmentalHypothesis: "One possibility worth exploring is whether discomfort narrowed the choices available.",
  reflectionQuestion: "What did the situation need from you?",
  nextChoice: "Name the concern and invite a response.",
  microExperiment: "Ask one clarifying question before the next comparable decision.",
  followUpSignal: "Notice whether the concern is raised in the meeting.",
  mirror: {
    whatWeAreNoticing: "The concern was held back.",
    whyItMayMatter: "Risks may remain untested.",
    questionToConsider: "What did the situation need from you?",
    experiment: "Ask one clarifying question.",
  },
}));

vi.mock("../db", () => ({ getDb: mockGetDb }));
vi.mock("../selfLeadershipIntelligence", () => ({
  analyseSelfLeadership: vi.fn(async () => MOCK_ANALYSIS),
}));

function queryResult(value: unknown) {
  const chain: any = {
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: async () => value,
    then: (resolve: (result: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(value).then(resolve, reject),
  };
  return chain;
}

function makeDb(selectResults: unknown[]) {
  const insertValues = vi.fn(async () => [{ insertId: 47 }]);
  const updateWhere = vi.fn(async () => undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  return {
    select: vi.fn(() => queryResult(selectResults.shift() ?? [])),
    insert: vi.fn(() => ({ values: insertValues })),
    update: vi.fn(() => ({ set: updateSet })),
    insertValues,
    updateSet,
  };
}

function context(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `guided-mirror-user-${userId}`,
      email: `user-${userId}@example.com`,
      name: "Guided Mirror User",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Guided Mirror protected procedures", () => {
  beforeEach(() => vi.resetAllMocks());

  it("creates a private mirror owned by the authenticated learner", async () => {
    const db = makeDb([[{ tenantId: 8 }]]);
    mockGetDb.mockResolvedValue(db);
    const { intelligenceCoreRouter } = await import("./intelligenceCore");

    const result = await intelligenceCoreRouter.createCaller(context(1)).createGuidedMirror({
      situation: "I withheld a commercial concern in the planning meeting.",
      observedBehaviour: "I agreed publicly and raised it later.",
      careerStage: "manager",
    });

    expect(result).toMatchObject({ mirrorId: 47, analysis: { selfLeadershipSignal: { primaryDimension: "courage" } } });
    expect(db.insertValues.mock.calls[0]?.[0]).toMatchObject({ userId: 1, tenantId: 8, sourceApp: "guide", primaryDimension: "courage" });
  });

  it("stores relevance feedback and an experiment update only after finding the learner-owned mirror", async () => {
    const db = makeDb([[{ id: 47, userId: 1 }], [{ id: 47, userId: 1 }]]);
    mockGetDb.mockResolvedValue(db);
    const { intelligenceCoreRouter } = await import("./intelligenceCore");
    const caller = intelligenceCoreRouter.createCaller(context(1));

    await caller.rateGuidedMirror({ mirrorId: 47, relevance: "up", feedbackNote: "This feels practical." });
    await caller.updateGuidedMirrorExperiment({ mirrorId: 47, experimentStatus: "attempted" });

    expect(db.updateSet.mock.calls[0]?.[0]).toEqual({ relevance: "up", feedbackNote: "This feels practical.", feedbackReason: null });
    expect(db.updateSet.mock.calls[1]?.[0]).toEqual({ experimentStatus: "attempted" });
  });

  it("denies feedback or experiment changes when the requested mirror is not owned by the learner", async () => {
    const db = makeDb([[]]);
    mockGetDb.mockResolvedValue(db);
    const { intelligenceCoreRouter } = await import("./intelligenceCore");

    await expect(intelligenceCoreRouter.createCaller(context(2)).rateGuidedMirror({ mirrorId: 47, relevance: "down" }))
      .rejects.toThrow("Guided Mirror not found.");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("returns only the caller-owned history even if a lower layer returns mixed records", async () => {
    const db = makeDb([[{ id: 47, userId: 1, situation: "My reflection" }, { id: 48, userId: 2, situation: "Another learner's reflection" }]]);
    mockGetDb.mockResolvedValue(db);
    const { intelligenceCoreRouter } = await import("./intelligenceCore");

    const result = await intelligenceCoreRouter.createCaller(context(1)).getGuidedMirrors();
    expect(result.mirrors).toEqual([{ id: 47, userId: 1, situation: "My reflection" }]);
  });

  it("aggregates only the authenticated learner's retrieved mirror records across six dimensions", async () => {
    const db = makeDb([[{ primaryDimension: "courage", relevance: "up", experimentStatus: "attempted" }, { primaryDimension: "integrity", relevance: null, experimentStatus: "not_started" }]]);
    mockGetDb.mockResolvedValue(db);
    const { intelligenceCoreRouter } = await import("./intelligenceCore");

    const result = await intelligenceCoreRouter.createCaller(context(1)).getSelfLeadershipProgress();
    expect(result.totalReflections).toBe(2);
    expect(result.dimensions.find((dimension) => dimension.id === "courage")).toMatchObject({ reflections: 1, experimentsAttempted: 1, relevanceSignals: 1 });
    expect(result.dimensions.find((dimension) => dimension.id === "integrity")).toMatchObject({ reflections: 1, progressLabel: "Noticing" });
    expect(result.dimensions.find((dimension) => dimension.id === "authenticity")).toMatchObject({ reflections: 0, progressLabel: "Start noticing" });
  });

  it("denies coach aggregate themes to a user without a coach record", async () => {
    const db = makeDb([[]]);
    mockGetDb.mockResolvedValue(db);
    const { intelligenceCoreRouter } = await import("./intelligenceCore");
    await expect(intelligenceCoreRouter.createCaller(context(1)).getCoachGuidedMirrorThemes({ periodDays: 30 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("withholds aggregate themes when fewer than five assigned clients explicitly consent", async () => {
    const db = makeDb([
      [{ id: 9, userId: 1 }],
      [{ clientUserId: 20 }, { clientUserId: 21 }, { clientUserId: 22 }],
      [{ userId: 20 }, { userId: 21 }, { userId: 22 }],
    ]);
    mockGetDb.mockResolvedValue(db);
    const { intelligenceCoreRouter } = await import("./intelligenceCore");
    const result = await intelligenceCoreRouter.createCaller(context(1)).getCoachGuidedMirrorThemes({ periodDays: 30 });
    expect(result).toMatchObject({ eligible: false, minimumCohortSize: 5, cohortSize: 3, themes: [] });
    expect(result.privacyBoundary).toContain("never shown");
  });
});
