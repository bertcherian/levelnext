import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            hypotheses: [
              {
                category: "self",
                statement: "My value comes from personally solving the hardest problems.",
                historicalStrength: "Technical precision and speed",
                currentCost: "Overload and team dependency",
                emergingAssumption: "My value comes from developing capability in others.",
              },
              {
                category: "relational",
                statement: "Direct disagreement with senior stakeholders damages credibility.",
                historicalStrength: "Maintains relational warmth",
                currentCost: "Unvoiced concerns lead to execution rework",
                emergingAssumption: "Constructive challenge protects the organisation from costly blind spots.",
              },
            ],
          }),
        },
      },
    ],
  }),
}));
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number = 9999): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-narrative-user-${userId}`,
    email: `test-narrative-${userId}@example.com`,
    name: "Narrative Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Narrative Intelligence — Public Procedures", () => {
  const publicContext: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
  const caller = appRouter.createCaller(publicContext);

  it("returns curated role transitions with Manager Effectiveness priority", async () => {
    const transitions = await caller.narrativeIntelligence.getCuratedRoleTransitions();
    expect(transitions).toBeInstanceOf(Array);
    expect(transitions.length).toBeGreaterThanOrEqual(3);
    const mep = transitions.find((t) => t.module === "manager");
    expect(mep).toBeDefined();
    expect(mep?.limitingNarrative).toBeDefined();
    expect(mep?.generativeAssumption).toBeDefined();
    expect(mep?.concreteBehaviours.length).toBeGreaterThanOrEqual(2);
  });

  it("returns the non-labeling narrative pattern library", async () => {
    const library = await caller.narrativeIntelligence.getPatternLibrary();
    expect(library.length).toBeGreaterThanOrEqual(5);
    const expert = library.find((p) => p.id === "the_expert");
    expect(expert?.archetypeTitle).toBe("The Expert");
    expect(expert?.safeExplorationPrompt).toBeDefined();
  });

  it("returns capability lenses for coaching inquiry", async () => {
    const lenses = await caller.narrativeIntelligence.getCapabilityLenses();
    expect(lenses.delegation).toBeDefined();
    expect(lenses.feedback).toBeDefined();
    expect(lenses.executive_presence).toBeDefined();
    expect(lenses.conflict).toBeDefined();
    expect(lenses.delegation.lensQuestions.length).toBeGreaterThanOrEqual(2);
  });

  it("automatically logs simulator evidence when debrief completes", async () => {
    const { logSimulatorEvidenceIfApplicable } = await import("./narrativeIntelligence");
    const ctx = createTestContext(1009);
    const caller = appRouter.createCaller(ctx);
    await caller.narrativeIntelligence.getProfile();

    await logSimulatorEvidenceIfApplicable(1009, 42, {
      overallScore: 88,
      keyTakeaway: "Clear framing prevented escalation with stakeholder.",
      strengths: ["Strong empathy", "Structured boundaries"],
    });

    const ledger = await caller.narrativeIntelligence.getEvidenceLedger();
    const simEvidence = ledger.find((e) => e.sourceType === "simulator_behaviour");
    expect(simEvidence).toBeDefined();
    expect(simEvidence?.learning).toContain("Clear framing");
  });

  it("automatically logs practice coach evidence when feedback generates", async () => {
    const { logPracticeEvidenceIfApplicable } = await import("./narrativeIntelligence");
    const ctx = createTestContext(1010);
    const caller = appRouter.createCaller(ctx);
    await caller.narrativeIntelligence.getProfile();

    await logPracticeEvidenceIfApplicable(1010, 84, "Challenging Deadline Negotiation", {
      overallScore: 4.5,
      oneBehaviourToImprove: "State the trade-off in the first sentence.",
      strengths: ["Firm and respectful tone"],
    });

    const ledger = await caller.narrativeIntelligence.getEvidenceLedger();
    const pracEvidence = ledger.find((e) => e.sourceType === "practice_attempt");
    expect(pracEvidence).toBeDefined();
    expect(pracEvidence?.trigger).toContain("Challenging Deadline Negotiation");
  });

});

describe("Narrative Intelligence — Participant Lifecycle & Endpoints", () => {
  it("creates or fetches operating profile for authenticated user", async () => {
    const ctx = createTestContext(1001);
    const caller = appRouter.createCaller(ctx);

    const profile = await caller.narrativeIntelligence.getProfile();
    expect(profile).toBeDefined();
    expect(profile.userId).toBe(1001);
    expect(profile.status).toBe("active");
    expect(profile.currentRoleTransition).toBe("mep_expert_to_enabler");
  });

  it("generates hypotheses, records resonance, and updates status", async () => {
    const ctx = createTestContext(1002);
    const caller = appRouter.createCaller(ctx);

    const hypotheses = await caller.narrativeIntelligence.generateHypotheses({ sourceModule: "mep" });
    expect(hypotheses.length).toBeGreaterThanOrEqual(2);
    const first = hypotheses[0];
    expect(first.statement).toBeDefined();
    expect(first.status).toBe("test");

    // Participant responds with resonance and edits
    const responded = await caller.narrativeIntelligence.respondToHypothesis({
      narrativeId: first.id,
      resonance: "strongly_resonates",
      editedStatement: "My value often feels tied to being the smartest problem solver in the room.",
      reflectionNote: "I notice this in architecture reviews especially.",
    });

    expect(responded.participantResonance).toBe("strongly_resonates");
    expect(responded.statement).toContain("smartest problem solver");
    expect(responded.participantReflection).toContain("architecture reviews");

    // Participant updates status to expand
    const updated = await caller.narrativeIntelligence.updateNarrativeStatus({
      narrativeId: first.id,
      status: "expand",
    });
    expect(updated?.status).toBe("expand");
  });

  it("saves Week 2 question analysis (fact vs story vs prediction)", async () => {
    const ctx = createTestContext(1003);
    const caller = appRouter.createCaller(ctx);

    const [narrative] = await caller.narrativeIntelligence.generateHypotheses();
    expect(narrative).toBeDefined();

    const analyzed = await caller.narrativeIntelligence.saveQuestionAnalysis({
      narrativeId: narrative.id,
      factDescription: "The team missed the Tuesday deployment milestone by 4 hours.",
      storyInterpretation: "They cannot be trusted with critical releases unless I am watching every step.",
      predictionMade: "If I do not micromanage the next release, another delay will occur.",
      evidenceFor: ["Missed deployment last Tuesday"],
      evidenceAgainst: ["Successfully completed 8 consecutive sprints without incident"],
      exceptionHunt: "Sprint 4 was run completely autonomously by the senior engineers without delays.",
      narrativeTaxHistorical: "Helped maintain high quality in early startup days.",
      narrativeTaxCurrent: "Creates burnout and prevents team members from developing release discipline.",
    });

    expect(analyzed.factDescription).toContain("Tuesday deployment");
    expect(analyzed.exceptionHunt).toContain("Sprint 4");
    expect(analyzed.isHighPriority).toBe(true);
  });

  it("saves Week 3 Choose Next Chapter transition", async () => {
    const ctx = createTestContext(1004);
    const caller = appRouter.createCaller(ctx);

    const nextChapter = await caller.narrativeIntelligence.chooseNextChapter({
      transitionId: "mep_controller_to_builder",
      fromIdentity: "The Gatekeeper",
      toIdentity: "The High-Trust Builder",
      emergingAssumption: "True quality comes from psychological safety, guardrails, and rapid feedback.",
      commitments: [
        "Agree on checkpoints rather than monitoring ad-hoc.",
        "Acknowledge self-corrections publicly in retro.",
      ],
      futureSelfVision: "A leader whose team runs high-velocity releases with zero operational panic.",
    });

    expect(nextChapter.currentRoleTransition).toBe("mep_controller_to_builder");
    expect(nextChapter.toIdentity).toBe("The High-Trust Builder");
    expect(nextChapter.commitments).toContain("Agree on checkpoints rather than monitoring ad-hoc.");
  });

  it("runs Week 4 behavioral experiment lifecycle (plan -> outcome -> evidence)", async () => {
    const ctx = createTestContext(1005);
    const caller = appRouter.createCaller(ctx);

    const [narrative] = await caller.narrativeIntelligence.generateHypotheses();

    const experiment = await caller.narrativeIntelligence.createExperiment({
      narrativeId: narrative.id,
      title: "Silent Architecture Review",
      contextSituation: "Weekly architecture review for the billing pipeline",
      oldAssumption: "If I don't give the direction immediately, the team will choose a fragile design.",
      alternativeHypothesis: "The team will propose resilient trade-offs if I ask guiding questions first.",
      behaviourToTest: "Ask 3 inquiry questions before stating my opinion.",
      predictedOutcome: "The team will remain silent and wait for me to speak.",
      predictedProbability: 75,
      experimentType: "real_world",
    });

    expect(experiment.status).toBe("planned");
    expect(experiment.predictedProbability).toBe(75);

    // Record outcome
    const completed = await caller.narrativeIntelligence.recordExperimentOutcome({
      experimentId: experiment.id,
      actualOutcome: "Two engineers immediately spoke up and debated 2 solid approaches. We reached alignment in 20 minutes.",
      whatRealityTaught: "The team was waiting for space, not waiting for my answers.",
      narrativeImpact: "strongly_challenged",
      convictionShiftOld: 40,
      convictionShiftEmerging: 75,
    });

    expect(completed.status).toBe("completed");
    expect(completed.narrativeImpact).toBe("strongly_challenged");

    // Check evidence ledger has the auto-logged evidence
    const ledger = await caller.narrativeIntelligence.getEvidenceLedger();
    expect(ledger.length).toBeGreaterThanOrEqual(1);
    const logged = ledger.find((e) => e.experimentId === experiment.id);
    expect(logged).toBeDefined();
    expect(logged?.learning).toContain("space");
  }, 15000);

  it("executes the 90-Second Narrative Reset flow", async () => {
    const ctx = createTestContext(1006);
    const caller = appRouter.createCaller(ctx);

    const reset = await caller.narrativeIntelligence.runNarrativeReset({
      triggerSituation: "Executive asked an unexpected question about database latency during the quarterly review.",
      noticeStory: "I look unprepared and my credibility is gone.",
      separateFacts: "A technical question was asked about a metric that was not on the agenda.",
      alternativeView: "It is normal and professional to say 'I will pull the exact telemetry and reply in 15 minutes.'",
      chosenAssumption: "Senior credibility is intellectual honesty, not instant recall.",
      immediateAction: "Acknowledge the question calmly, offer the time-bound follow up, and proceed.",
      saveToEvidence: true,
    });

    expect(reset.triggerSituation).toContain("database latency");
    expect(reset.chosenAssumption).toContain("intellectual honesty");
    expect(reset.savedAsEvidence).toBe(true);

    const ledger = await caller.narrativeIntelligence.getEvidenceLedger();
    const resetEvidence = ledger.find((e) => e.trigger === "90-Second Narrative Reset");
    expect(resetEvidence).toBeDefined();
  });

  it("manages participant-controlled sharing grants", async () => {
    const ctx = createTestContext(1007);
    const caller = appRouter.createCaller(ctx);

    const grant = await caller.narrativeIntelligence.saveSharingGrant({
      recipientRole: "success_partner",
      shareNextChapter: true,
      shareBehaviours: true,
      shareExperimentCount: true,
      shareEvidenceSummary: false,
      shareSupportRequest: "Ask me how my 10-minute coaching pause experiment went this Friday.",
    });

    expect(grant.recipientRole).toBe("success_partner");
    expect(grant.shareNextChapter).toBe(true);
    expect(grant.shareEvidenceSummary).toBe(false);
    expect(grant.shareSupportRequest).toContain("coaching pause");

    const grants = await caller.narrativeIntelligence.getSharingGrants();
    expect(grants.length).toBeGreaterThanOrEqual(1);
    expect(grants[0].recipientRole).toBe("success_partner");
  });

  it("assembles complete dashboard payload with stats and movement", async () => {
    const ctx = createTestContext(1008);
    const caller = appRouter.createCaller(ctx);

    await caller.narrativeIntelligence.generateHypotheses();
    const dashboard = await caller.narrativeIntelligence.getDashboard();

    expect(dashboard.profile).toBeDefined();
    expect(dashboard.activeNarratives).toBeInstanceOf(Array);
    expect(dashboard.stats.activeNarrativeCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.currentRoleTransition).toBeDefined();
    expect(dashboard.currentRoleTransition.module).toBe("manager");
  });

  it("blocks ordinary participants from opening the Success Partner shared view", async () => {
    const ctx = createTestContext(1011);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.narrativeIntelligence.getSuccessPartnerSharedView({ participantUserId: 1001 }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("serves only approved commitments and experiment counts to an assigned partner", async () => {
    const { getDb } = await import("./db");
    const { spAssignments, users } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const partnerId = 1012;
    const participantId = 1013;

    await db.insert(users).values([
      { id: partnerId, openId: `sp-${partnerId}`, name: "Success Partner Test", email: "sp@example.com", role: "user" },
      { id: participantId, openId: `participant-${participantId}`, name: "Participant Test", email: "participant@example.com", role: "user" },
    ]).onDuplicateKeyUpdate({ set: { lastSignedIn: new Date() } });

    await db.insert(spAssignments).values({
      spUserId: partnerId,
      managedUserId: participantId,
    });

    const participantCtx = createTestContext(participantId);
    const participantCaller = appRouter.createCaller(participantCtx);

    await participantCaller.narrativeIntelligence.chooseNextChapter({
      transitionId: "mep_expert_to_enabler",
      fromIdentity: "The Technical Problem Solver",
      toIdentity: "The Capability Multiplier",
      emergingAssumption: "My value increasingly comes from creating capability and problem-solving capacity in my team.",
      commitments: ["Ask 3 coaching questions before answering."],
    });

    await participantCaller.narrativeIntelligence.saveSharingGrant({
      recipientRole: "success_partner",
      shareNextChapter: true,
      shareBehaviours: true,
      shareExperimentCount: true,
      shareEvidenceSummary: false,
      shareSupportRequest: "Ask me about my coaching questions on Friday.",
    });

    const partnerCtx: TrpcContext = {
      ...createTestContext(partnerId),
      user: {
        ...createTestContext(partnerId).user!,
        role: "admin", // Admin bypasses procedure role gate while exercising the assignment query
      },
    };
    const partnerCaller = appRouter.createCaller(partnerCtx);

    const shared = await partnerCaller.narrativeIntelligence.getSuccessPartnerSharedView({
      participantUserId: participantId,
    });

    expect(shared.nextChapter?.toIdentity).toBe("The Capability Multiplier");
    expect(shared.commitments).toContain("Ask 3 coaching questions before answering.");
    expect(shared.experimentCounts?.total).toBe(0);
    expect(shared.consent.shareSupportRequest).toContain("coaching questions");
    expect(shared.privacy.rawNarrativesIncluded).toBe(false);
  }, 15000);

  it("generates inquiry questions only from the participant-approved commitments", async () => {
    const partnerCtx: TrpcContext = {
      ...createTestContext(1012),
      user: {
        ...createTestContext(1012).user!,
        role: "admin",
      },
    };
    const partnerCaller = appRouter.createCaller(partnerCtx);

    const result = await partnerCaller.narrativeIntelligence.generateSuccessPartnerInquiryQuestions({
      participantUserId: 1013,
      focus: "delegation check-in",
    });

    expect(result.questions.length).toBeGreaterThanOrEqual(3);
    expect(result.approvedCommitmentCount).toBe(1);
    expect(result.coachingFrame).toContain("open invitations");
    expect(["ai", "safe_fallback"]).toContain(result.generatedBy);
  }, 15000);

  it("denies the shared view when a participant has not consented", async () => {
    const { getDb } = await import("./db");
    const { spAssignments, users } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const partnerId = 1014;
    const participantId = 1015;

    await db.insert(users).values([
      { id: partnerId, openId: `sp-${partnerId}`, name: "Success Partner Without Consent", email: "sp2@example.com", role: "user" },
      { id: participantId, openId: `participant-${participantId}`, name: "Unconsented Participant", email: "p2@example.com", role: "user" },
    ]).onDuplicateKeyUpdate({ set: { lastSignedIn: new Date() } });

    await db.insert(spAssignments).values({
      spUserId: partnerId,
      managedUserId: participantId,
    });

    const partnerCtx: TrpcContext = {
      ...createTestContext(partnerId),
      user: {
        ...createTestContext(partnerId).user!,
        role: "admin",
      },
    };
    const partnerCaller = appRouter.createCaller(partnerCtx);

    await expect(
      partnerCaller.narrativeIntelligence.getSuccessPartnerSharedView({ participantUserId: participantId }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
