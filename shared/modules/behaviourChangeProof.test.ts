import { describe, expect, it } from "vitest";
import { deriveEvidenceStrength, deriveMomentumState, nextBestPilotAction, recommendPilot } from "./behaviourChangeProof";

describe("30-Day Behaviour Change Proof contracts", () => {
  it("turns a difficult-conversation business problem into a bounded three-behaviour pilot", () => {
    const recommendation = recommendPilot("Managers avoid difficult performance conversations and feedback is too late.");
    expect(recommendation.targetBehaviours).toEqual(["Difficult conversations", "Timely feedback", "Ownership and accountability"]);
    expect(recommendation.defaults.durationDays).toBe(30);
    expect(recommendation.observableActions).toHaveLength(3);
  });

  it("does not claim corroborated movement without human, behavioural, and business-signal evidence", () => {
    expect(deriveEvidenceStrength({ system: 4, behavioural: 3, human: 0, businessSignal: 0 })).toBe("emerging_pattern");
    expect(deriveEvidenceStrength({ system: 2, behavioural: 1, human: 1, businessSignal: 1 })).toBe("corroborated_movement");
    expect(deriveEvidenceStrength({ system: 0, behavioural: 0, human: 0, businessSignal: 0 })).toBe("insufficient");
  });

  it("keeps a pilot focused on the earliest missing activation step", () => {
    expect(nextBestPilotAction({ participants: 0, baselineCompleted: 0, firstReps: 0, realWorkApplications: 0, day: 0 }).key).toBe("invite");
    expect(nextBestPilotAction({ participants: 10, baselineCompleted: 5, firstReps: 0, realWorkApplications: 0, day: 3 }).key).toBe("baseline");
    expect(nextBestPilotAction({ participants: 10, baselineCompleted: 10, firstReps: 4, realWorkApplications: 0, day: 8 }).key).toBe("application");
    expect(nextBestPilotAction({ participants: 10, baselineCompleted: 10, firstReps: 10, realWorkApplications: 8, day: 30 }).key).toBe("review");
  });

  it("does not label a fresh or inactive cohort as flowing", () => {
    expect(deriveMomentumState({ participants: 10, baselineCompleted: 0, firstReps: 0, realWorkApplications: 0 })).toBe("blocked");
    expect(deriveMomentumState({ participants: 10, baselineCompleted: 10, firstReps: 5, realWorkApplications: 6 })).toBe("flowing");
  });
});
