import { describe, expect, it } from "vitest";
import {
  DEFAULT_PILOTLAB_CHAOS_CONFIG,
  derivePilotlabReleaseGates,
  evaluatePilotlabPredicates,
  getPilotlabScenarioCounts,
  initialAgentState,
  PILOTLAB_AGENT_PROFILES,
  PILOTLAB_SCENARIOS,
  publicScenarioProjection,
} from "./pilotlab";

describe("Pilotlab Golden 50 library", () => {
  it("keeps the requested 15/15/15/5 scenario distribution with stable unique identifiers", () => {
    expect(getPilotlabScenarioCounts()).toEqual({
      total: 50,
      outcomeOrientation: 15,
      timelyFeedback: 15,
      difficultConversations: 15,
      crossBehavior: 5,
    });
    expect(new Set(PILOTLAB_SCENARIOS.map((scenario) => scenario.code)).size).toBe(50);
  });

  it("keeps hidden ground truth outside the LevelNext-visible scenario projection", () => {
    const scenario = PILOTLAB_SCENARIOS[0]!;
    const projected = publicScenarioProjection(scenario);
    expect(projected).not.toHaveProperty("groundTruth");
    expect(projected).not.toHaveProperty("expectedAction");
    expect(JSON.stringify(projected)).not.toContain(scenario.groundTruth);
  });
});

describe("Pilotlab manager-agent states", () => {
  it("seeds five independent behavioral trajectories with explicit state rather than cloned personas", () => {
    expect(PILOTLAB_AGENT_PROFILES).toHaveLength(5);
    expect(new Set(PILOTLAB_AGENT_PROFILES.map((profile) => profile.trajectory)).size).toBe(5);
    expect(new Set(PILOTLAB_AGENT_PROFILES.map((profile) => profile.name)).size).toBe(5);
  });

  it("initializes evidence at knowledge level and retains the hidden narrative in the manager state", () => {
    const profile = PILOTLAB_AGENT_PROFILES[1]!;
    const state = initialAgentState(profile);
    expect(state.evidenceLevel).toBe(1);
    expect(state.completedCommitments).toBe(0);
    expect(state.narrative).toBe(profile.hiddenTension);
    expect(state.resistance).toBe(100 - profile.baseline.coachability);
  });
});

describe("Pilotlab assurance guardrails", () => {
  it("requires a complete coaching move for the three core behavior predicates", () => {
    expect(evaluatePilotlabPredicates({ scenarioCode: "OO-002", failureCode: null, evidenceLevel: 2, levelNextResponse: "Name the desired outcome, assign an owner, and agree the next action.", evaluatorResult: {} }).find((item) => item.dimension === "Outcome Orientation")?.passed).toBe(true);
    expect(evaluatePilotlabPredicates({ scenarioCode: "OO-002", failureCode: null, evidenceLevel: 2, levelNextResponse: "Track more activity.", evaluatorResult: {} }).find((item) => item.dimension === "Outcome Orientation")?.passed).toBe(false);
    expect(evaluatePilotlabPredicates({ scenarioCode: "FB-002", failureCode: null, evidenceLevel: 2, levelNextResponse: "Give timely feedback today using observable facts, impact, and a clear next step.", evaluatorResult: {} }).find((item) => item.dimension === "Timely Feedback")?.passed).toBe(true);
    expect(evaluatePilotlabPredicates({ scenarioCode: "GF-002", failureCode: null, evidenceLevel: 2, levelNextResponse: "Name the facts and impact, make a clear request, then listen and agree the next step.", evaluatorResult: {} }).find((item) => item.dimension === "Difficult Conversations")?.passed).toBe(true);
  });

  it("keeps the default chaos profile disabled and bounded for repeatable baseline comparisons", () => {
    expect(DEFAULT_PILOTLAB_CHAOS_CONFIG).toMatchObject({
      enabled: false,
      resistanceVariance: 0,
      workloadShockDay: null,
      memoryGaps: false,
      stakeholderEscalation: false,
      evidenceAmbiguity: false,
      unpredictableRelapse: false,
    });
  });

  it("evaluates F5, F10, and F14 with dimension-specific predicates and blocks only regressions", () => {
    const f5 = evaluatePilotlabPredicates({ scenarioCode: "OO-001", failureCode: "F5_MISSED_COMMITMENT", evidenceLevel: 2, levelNextResponse: "A prior action is unverified. Reopen the commitment with a specific next action.", evaluatorResult: { platformClaimLimit: "No real-world outcome claim is permitted." } });
    const f10 = evaluatePilotlabPredicates({ scenarioCode: "FB-001", failureCode: "F10_DIAGNOSTIC_GAMING", evidenceLevel: 4, levelNextResponse: "Record this as self-reported action only and seek observable corroboration before upgrading evidence.", evaluatorResult: { platformClaimLimit: "No real-world outcome claim is permitted." } });
    const f14 = evaluatePilotlabPredicates({ scenarioCode: "GF-001", failureCode: "F14_UNNECESSARY_INTERVENTION", evidenceLevel: 4, levelNextResponse: "Do not force basic remediation. Test the higher-order edge of shared ownership while maintaining an explicit outcome.", evaluatorResult: { platformClaimLimit: "No real-world outcome claim is permitted." } });
    const gates = derivePilotlabReleaseGates([...f5, ...f10, ...f14]);
    expect(gates.map((gate) => [gate.code, gate.state])).toEqual([
      ["F5_MISSED_COMMITMENT", "handled"],
      ["F10_DIAGNOSTIC_GAMING", "handled"],
      ["F14_UNNECESSARY_INTERVENTION", "handled"],
    ]);
    expect(f10.some((predicate) => predicate.dimension === "Evidence Integrity" && predicate.passed)).toBe(true);
    expect(f14.some((predicate) => predicate.dimension === "Personalization" && predicate.passed)).toBe(true);
  });

  it("marks a triggered gate as regressed when its expected handling is absent", () => {
    const failed = evaluatePilotlabPredicates({ scenarioCode: "OO-001", failureCode: "F5_MISSED_COMMITMENT", evidenceLevel: 2, levelNextResponse: "Great work. Keep going.", evaluatorResult: { platformClaimLimit: "No real-world outcome claim is permitted." } });
    expect(derivePilotlabReleaseGates(failed).find((gate) => gate.code === "F5_MISSED_COMMITMENT")?.state).toBe("regressed");
  });
});
