import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENGINEERING_DIAGNOSTIC_QUESTIONS } from "../../shared/modules/engineeringIntelligence";

const getDb = vi.fn();
const analyseSelfLeadershipWithMetadata = vi.fn();
const draftPartnerNudges = vi.fn();
vi.mock("../db", () => ({ getDb }));
vi.mock("../selfLeadershipIntelligence", () => ({ analyseSelfLeadershipWithMetadata }));
vi.mock("../engineeringNudgeIntelligence", () => ({ draftPartnerNudges }));

type SelectQueue = Array<unknown[]>;

function makeDb(selectQueue: SelectQueue) {
  const insertValues = vi.fn(() => ({ $returningId: vi.fn(async () => [{ id: 77 }]), onDuplicateKeyUpdate: vi.fn(async () => undefined) }));
  const updateWhere = vi.fn(async () => undefined);
  const db = {
    select: vi.fn(() => {
      const resolve = () => selectQueue.shift() ?? [];
      const chain: any = {
        from: () => chain,
        where: () => chain,
        orderBy: () => chain,
        limit: async () => resolve(),
        then: (onFulfilled: any, onRejected: any) => Promise.resolve(resolve()).then(onFulfilled, onRejected),
      };
      return chain;
    }),
    insert: vi.fn(() => ({ values: insertValues })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
    insertValues,
    updateWhere,
  };
  return db;
}

function context(userId = 10, role: "user" | "success_partner" | "admin" = "user") {
  const now = new Date();
  return {
    user: { id: userId, openId: `engineering-${userId}`, email: `engineering-${userId}@example.com`, name: "Engineering User", loginMethod: "email", role, createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { headers: {} },
    res: {},
  } as any;
}

describe("Engineering Intelligence router boundaries", () => {
  beforeEach(() => vi.resetAllMocks());

  it("reuses an in-progress diagnostic session owned by the authenticated participant", async () => {
    const db = makeDb([[{ tenantId: 3 }], [{ id: 41, currentQuestionIndex: 4 }]]);
    getDb.mockResolvedValue(db);
    const { engineeringIntelligenceRouter } = await import("./engineeringIntelligence");

    const result = await engineeringIntelligenceRouter.createCaller(context(10)).startDiagnostic();

    expect(result).toEqual({ sessionId: 41, currentQuestionIndex: 4 });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("does not write a response when the requested session is not owned by the participant", async () => {
    const db = makeDb([[{ tenantId: 3 }], []]);
    getDb.mockResolvedValue(db);
    const { engineeringIntelligenceRouter } = await import("./engineeringIntelligence");

    await expect(engineeringIntelligenceRouter.createCaller(context(10)).saveDiagnosticResponse({ sessionId: 41, questionCode: "self_reflection", answerValue: 4 }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("forbids a Success Partner check-in for a participant outside their active assignment", async () => {
    const db = makeDb([[{ tenantId: 3 }], []]);
    getDb.mockResolvedValue(db);
    const { engineeringIntelligenceRouter } = await import("./engineeringIntelligence");

    await expect(engineeringIntelligenceRouter.createCaller(context(22, "success_partner")).logPartnerCheckIn({
      participantUserId: 44,
      summaryShared: "No check-in should be stored without an active assignment.",
      channel: "in_app",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("completes a fully answered participant-owned diagnostic exactly once and creates the first Mission", async () => {
    const responses = ENGINEERING_DIAGNOSTIC_QUESTIONS.map((question) => ({ questionCode: question.code, answerValue: 4 }));
    const db = makeDb([[{ tenantId: 3 }], [{ id: 41 }], [], responses]);
    getDb.mockResolvedValue(db);
    const { engineeringIntelligenceRouter } = await import("./engineeringIntelligence");

    const result = await engineeringIntelligenceRouter.createCaller(context(10)).completeDiagnostic({ sessionId: 41 });

    expect(result).toEqual({ resultId: 77, alreadyCompleted: false });
    expect(db.insertValues).toHaveBeenCalledTimes(2);
    expect(db.insertValues.mock.calls[0]?.[0]).toMatchObject({ tenantId: 3, userId: 10, sessionId: 41, diagnosticVersion: "engineering_mvp_v1", scoringMethodVersion: "deterministic_mvp_v1" });
    expect(db.insertValues.mock.calls[1]?.[0]).toMatchObject({ tenantId: 3, userId: 10, sourceResultId: 77, status: "recommended", partnerVisible: false });
    expect(db.updateWhere).toHaveBeenCalledTimes(1);
  });

  it("persists a participant-requested Self-Leadership analysis as a private Engineering mirror with agent lineage", async () => {
    analyseSelfLeadershipWithMetadata.mockResolvedValueOnce({
      mode: "model",
      modelId: "claude-sonnet-4-6",
      analysis: {
        situation: "I deferred a material concern in the architecture review.",
        observedBehaviour: "I agreed and raised it later.",
        diagnosticLens: "choosing",
        capabilitySignal: "No capability gap is established.",
        judgmentSignal: "The risk was visible but not surfaced in the forum.",
        selfLeadershipSignal: { primaryDimension: "courage", observation: "The concern was deferred.", evidence: ["One participant account."], confidence: "low" },
        developmentalHypothesis: "One possibility worth exploring is whether pace narrowed the available choices.",
        reflectionQuestion: "What did the decision need from you?",
        nextChoice: "Ask one evidence-seeking question.",
        microExperiment: "In your next review, ask one evidence-seeking question before agreeing.",
        followUpSignal: "Notice whether the risk is raised before the decision closes.",
        mirror: { whatWeAreNoticing: "The concern was deferred.", whyItMayMatter: "The decision may proceed without the concern.", questionToConsider: "What did the decision need?", experiment: "Ask one evidence-seeking question." },
      },
    });
    const db = makeDb([[{ tenantId: 3 }]]);
    getDb.mockResolvedValue(db);
    const { engineeringIntelligenceRouter } = await import("./engineeringIntelligence");

    const result = await engineeringIntelligenceRouter.createCaller(context(10)).analyseSelfLeadership({
      situation: "I deferred a material concern in the architecture review.",
      observedBehaviour: "I agreed and raised it later.",
      careerStage: "manager",
    });

    expect(result).toMatchObject({ mirrorId: 77, mode: "model", analysis: { selfLeadershipSignal: { primaryDimension: "courage" } } });
    expect(db.insertValues.mock.calls[0]?.[0]).toMatchObject({ tenantId: 3, actorUserId: 10, subjectUserId: 10, agentCode: "self_leadership_intelligence", purposeCode: "private_development_coaching" });
    expect(db.insertValues.mock.calls[1]?.[0]).toMatchObject({ tenantId: 3, userId: 10, sourceApp: "engineering_intelligence", primaryDimension: "courage" });
    expect(db.insertValues.mock.calls[1]?.[0]?.analysis).toBeDefined();
  });

  it("allows relevance feedback only for a participant-owned Engineering reflection", async () => {
    const db = makeDb([[{ id: 67 }]]);
    getDb.mockResolvedValue(db);
    const { engineeringIntelligenceRouter } = await import("./engineeringIntelligence");

    await expect(engineeringIntelligenceRouter.createCaller(context(10)).rateSelfLeadership({ mirrorId: 67, relevance: "up", feedbackNote: "This question is practical." }))
      .resolves.toEqual({ saved: true });
    expect(db.updateWhere).toHaveBeenCalledTimes(1);
  });

  it("generates a Partner nudge only from participant-shared Mission context and persists the allowed queue record", async () => {
    draftPartnerNudges.mockResolvedValueOnce({
      mode: "deterministic",
      modelId: null,
      drafts: [{ participantId: 44, reasonCode: "mission_due", objective: "Offer a brief coaching check-in.", whyNow: "A shared Mission is due.", suggestedQuestion: "What would make the next step more workable?", recommendedChannel: "in_app", effort: "low", urgency: "medium", priorityScore: 70 }],
    });
    const now = new Date();
    const db = makeDb([
      [{ tenantId: 3 }],
      [{ id: 12, tenantId: 3, partnerUserId: 22, participantUserId: 44, status: "active" }],
      [{ id: 44, name: "Asha" }],
      [{ id: 88, title: "Clarify an architecture decision", status: "accepted", partnerVisible: true, dueAt: new Date(now.getTime() - 60_000), updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), completedAt: null }],
      [],
      [],
    ]);
    getDb.mockResolvedValue(db);
    const { engineeringIntelligenceRouter } = await import("./engineeringIntelligence");

    const result = await engineeringIntelligenceRouter.createCaller(context(22, "success_partner")).generatePartnerNudges();

    expect(result).toEqual({ generated: [77], mode: "deterministic" });
    expect(draftPartnerNudges).toHaveBeenCalledWith([expect.objectContaining({ participantId: 44, missionId: 88, missionTitle: "Clarify an architecture decision", reasonCode: "mission_due" })]);
    expect(db.insertValues.mock.calls[0]?.[0]).toMatchObject({ tenantId: 3, actorUserId: 22, agentCode: "success_partner_nudges", purposeCode: "partner_coaching_support" });
    expect(db.insertValues.mock.calls[1]?.[0]).toMatchObject({ tenantId: 3, partnerUserId: 22, participantUserId: 44, missionId: 88, permittedContextKeys: ["participant_name", "shared_mission", "follow_up_date"] });
  });

  it("logs a Success Partner check-in for an assigned participant", async () => {
    const db = makeDb([[{ tenantId: 3 }], [{ id: 12, status: "active" }]]);
    getDb.mockResolvedValue(db);
    const { engineeringIntelligenceRouter } = await import("./engineeringIntelligence");

    const result = await engineeringIntelligenceRouter.createCaller(context(22, "success_partner")).logPartnerCheckIn({
      participantUserId: 44,
      nudgeId: 9,
      summaryShared: "We clarified one concrete next step for the architecture review.",
      channel: "call",
    });

    expect(result).toEqual({ checkInId: 77 });
    expect(db.insertValues.mock.calls[0]?.[0]).toMatchObject({ tenantId: 3, partnerUserId: 22, participantUserId: 44, nudgeId: 9, channel: "call" });
  });
});
