import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "auth-user",
      email: "leader@example.com",
      name: "Leader",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Verbatim phrase telemetry persistence", () => {
  it("persists keyed phrase telemetry during practice completion without throwing", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const moment = await caller.behaviouralIntelligence.createMoment({
      sourceApp: "unit_test",
      situation: "Challenging an overly aggressive product timeline in a review.",
      role: "Engineering Manager",
      careerStage: "manager",
    });

    await caller.behaviouralIntelligence.analyseMoment({ momentId: moment.id, forceFallback: true });
    const lineage = await caller.behaviouralIntelligence.getMomentWithLineage({ momentId: moment.id });
    const move = lineage.moves[0];
    expect(move).toBeDefined();

    const link = await caller.behaviouralIntelligence.createPracticeLink({
      moveId: move.id,
      momentId: moment.id,
      providerType: "voice_simulator",
      scenarioContext: { moveTitle: move.title },
    });

    const completed = await caller.behaviouralIntelligence.recordPracticeResult({
      practiceLinkId: link.id,
      practiceStatus: "completed",
      phraseTelemetry: [
        { phraseKey: "phrase_1", matched: true, matchCount: 2 },
        { phraseKey: "phrase_2", matched: false, matchCount: 0 },
      ],
      feedbackScores: { overallScore: 84 },
    });

    expect(completed.practiceStatus).toBe("completed");
    expect(completed.evidenceLevel).toBe("practised");
    expect((completed.feedbackScores as any)?.phraseTelemetry).toEqual([
      { phraseKey: "phrase_1", matched: true, matchCount: 2 },
      { phraseKey: "phrase_2", matched: false, matchCount: 0 },
    ]);
  }, 25000);
});
