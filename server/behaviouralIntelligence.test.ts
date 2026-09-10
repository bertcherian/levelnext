import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  buildMepBehaviouralMomentInput,
  MEP_DIMENSION_MOMENT_PROMPTS,
} from "./adapters/mepBehaviouralAdapter";
import {
  buildLdiBehaviouralMomentInput,
  LDI_DIMENSION_MOMENT_PROMPTS,
} from "./adapters/ldiBehaviouralAdapter";

function createMockAuthContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `mock-user-${userId}`,
      email: `user${userId}@example.com`,
      name: "Mock Leader",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Behavioural Intelligence Engine — Server & Adapters", () => {
  it("builds a contextual MEP moment from delegation dimension", () => {
    const input = buildMepBehaviouralMomentInput({
      diagnosticCode: "DI",
      dimensionId: "delegation",
      dimensionLabel: "Delegation",
      score: 45,
      reportId: 101,
    });

    expect(input.sourceApp).toBe("mep");
    expect(input.careerStage).toBe("manager");
    expect(input.situation).toContain("hesitating to hand over full ownership");
    expect(input.diagnosticContext?.edgeScore).toBe(45);
    expect(input.diagnosticContext?.reportId).toBe(101);
  });

  it("builds a contextual LDI moment from executive communication dimension", () => {
    const input = buildLdiBehaviouralMomentInput({
      dimensionId: "executive_communication",
      dimensionName: "Executive Communication & Presence",
      score: 52,
      riskBand: "Moderate Risk",
      archetypeLabel: "The Overloaded Expert Leader",
      reportId: 202,
    });

    expect(input.sourceApp).toBe("leader_intelligence");
    expect(input.careerStage).toBe("leader");
    expect(input.moduleType).toBe("LDI");
    expect(input.situation).toContain("briefings with CXOs");
    expect(input.diagnosticContext?.archetype).toBe("The Overloaded Expert Leader");
  });

  it("provides comprehensive prompt mappings for all core MEP dimensions", () => {
    const requiredDimensions = ["delegation", "courage", "accountability", "stakeholder_mgmt", "coaching_1on1"];
    for (const dim of requiredDimensions) {
      expect(MEP_DIMENSION_MOMENT_PROMPTS[dim]).toBeDefined();
      expect(MEP_DIMENSION_MOMENT_PROMPTS[dim].defaultSituation.length).toBeGreaterThan(20);
      expect(MEP_DIMENSION_MOMENT_PROMPTS[dim].recommendedMoveCode).toContain("MOVE-");
    }
  });

  it("provides comprehensive prompt mappings for all 10 LDI derailment dimensions", () => {
    const ldiDims = [
      "self_awareness",
      "emotional_regulation",
      "humility_vs_defensiveness",
      "trust_relationship_building",
      "stakeholder_management",
      "strategic_thinking",
      "decision_making_ambiguity",
      "accountability_courage",
      "delegation_team_development",
      "executive_communication",
    ];
    for (const dim of ldiDims) {
      expect(LDI_DIMENSION_MOMENT_PROMPTS[dim]).toBeDefined();
      expect(LDI_DIMENSION_MOMENT_PROMPTS[dim].defaultSituation.length).toBeGreaterThan(20);
      expect(LDI_DIMENSION_MOMENT_PROMPTS[dim].desiredOutcome.length).toBeGreaterThan(10);
    }
  });

  it("executes the full end-to-end behavioural loop via tRPC router", async () => {
    const ctx = createMockAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // 1. Create Moment
    const moment = await caller.behaviouralIntelligence.createMoment({
      sourceApp: "behavioural_intelligence",
      role: "Engineering Director",
      careerStage: "leader",
      situation: "In the quarterly executive sync, the commercial lead presented aggressive revenue targets that depend on unfeasible engineering timelines. I stayed silent to avoid public confrontation.",
      desiredOutcome: "Raise the dependency and trade-off respectfully without appearing unaligned or obstructive.",
      observedBehaviour: "Remained silent during the presentation, then vented to my direct reports afterwards.",
    });

    expect(moment.id).toBeDefined();
    expect(moment.status).toBe("draft");

    // 2. Analyse Moment (using deterministic fallback to ensure fast, deterministic CI test)
    const analysisResult = await caller.behaviouralIntelligence.analyseMoment({
      momentId: moment.id,
      forceFallback: true,
    });

    expect(analysisResult.snapshot.id).toBeDefined();
    expect(analysisResult.move.id).toBeDefined();
    expect(analysisResult.snapshot.primaryDistinctionId).toBe("OD-18"); // Being Right vs Being Effective
    expect(analysisResult.move.moveCode).toBeDefined();

    // 3. Select Move
    const selectedMove = await caller.behaviouralIntelligence.selectMove({
      moveId: analysisResult.move.id,
      momentId: moment.id,
    });
    expect(selectedMove.status).toBe("selected");

    // 4. Link Practice Session
    const practiceLink = await caller.behaviouralIntelligence.createPracticeLink({
      moveId: selectedMove.id,
      momentId: moment.id,
      providerType: "standard_practice",
      scenarioContext: {
        counterpartRole: "Chief Commercial Officer",
        counterpartStyle: "Driven, high-pressure",
      },
    });
    expect(practiceLink.id).toBeDefined();

    // 5. Complete Practice
    const completedPractice = await caller.behaviouralIntelligence.recordPracticeResult({
      practiceLinkId: practiceLink.id,
      feedbackScores: { clarity: 85, courage: 80, tone: 90 },
      practiceStatus: "completed",
    });
    expect(completedPractice.practiceStatus).toBe("completed");
    expect(completedPractice.evidenceLevel).toBe("practised");

    // 6. Commit to Real-World Action
    const action = await caller.behaviouralIntelligence.createAction({
      moveId: selectedMove.id,
      momentId: moment.id,
      actionDescription: "Schedule a 15-minute 1:1 with the CCO before Friday to walk through the timeline assumptions.",
      personOrGroup: "CCO",
    });
    expect(action.id).toBeDefined();
    expect(action.status).toBe("planned");

    // 7. Complete Action
    const updatedAction = await caller.behaviouralIntelligence.updateActionStatus({
      actionId: action.id,
      status: "completed",
      completionNotes: "Met on Thursday. Walked through the two key bottlenecks; CCO agreed to prioritize Feature A.",
    });
    expect(updatedAction.status).toBe("completed");

    // 8. Record Evidence
    const evidence = await caller.behaviouralIntelligence.recordEvidence({
      momentId: moment.id,
      moveId: selectedMove.id,
      actionId: action.id,
      sourceType: "real_world_outcome",
      situation: "1:1 with CCO to discuss quarterly targets",
      actionTaken: "Used clarifying questions to separate the commercial revenue goal from the technical timeline.",
      outcome: "CCO agreed to phase delivery into two releases rather than demanding everything in Q1.",
      learning: "Asking what assumption we are making created collaboration instead of resistance.",
      evidenceLevel: "applied",
    });
    expect(evidence.id).toBeDefined();

    // 9. Record Reflection
    const reflection = await caller.behaviouralIntelligence.recordReflection({
      evidenceId: evidence.id,
      momentId: moment.id,
      reflectionText: "I learned that executive silence is far more dangerous than constructive inquiry. Naming business risk is appreciated when framed as protecting the goal.",
      capacitySignal: "Demonstrated ability to challenge senior peer with composure.",
      oldPatternShift: "Moved from silent resentment to proactive alignment.",
    });
    expect(reflection.id).toBeDefined();

    // 10. Check Lineage
    const lineage = await caller.behaviouralIntelligence.getMomentWithLineage({
      momentId: moment.id,
    });
    expect(lineage.moment.status).toBe("completed");
    expect(lineage.moves.length).toBeGreaterThanOrEqual(1);
    expect(lineage.actions.length).toBeGreaterThanOrEqual(1);
    expect(lineage.evidence.length).toBeGreaterThanOrEqual(1);
    expect(lineage.reflections.length).toBeGreaterThanOrEqual(1);

    // 11. Check Capacity Summary
    const summary = await caller.behaviouralIntelligence.getCapacitySummary();
    expect(summary.totalMoments).toBeGreaterThanOrEqual(1);
    expect(summary.totalPractices).toBeGreaterThanOrEqual(1);
    expect(summary.totalActions).toBeGreaterThanOrEqual(1);
    expect(summary.evidenceProgression.highestLevel).toBe("reflected");
  }, 15000);
});
