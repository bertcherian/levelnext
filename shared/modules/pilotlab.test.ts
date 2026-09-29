import { describe, expect, it } from "vitest";
import {
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
