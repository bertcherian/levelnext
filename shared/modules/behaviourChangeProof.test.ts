import { describe, expect, it } from "vitest";
import {
  anonymisePracticeText,
  buildProofCommunicationPack,
  defaultProofPrivacyConfig,
  deriveEvidenceStrength,
  deriveMomentumState,
  derivePilotHealth,
  deriveTrustState,
  getProofDailyAction,
  nextBestPilotAction,
  recommendPilot,
  safePracticeWarnings,
  PROOF_NUDGE_DAYS,
} from "./behaviourChangeProof";

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

  it("adapts daily actions through activation, practice, repetition, reinforcement, and proof", () => {
    expect(getProofDailyAction(1, ["Timely feedback"]).title).toBe("Name one live moment");
    expect(getProofDailyAction(6, ["Timely feedback"]).title).toBe("Practise the opening");
    expect(getProofDailyAction(16, ["Timely feedback"]).title).toBe("Raise the difficulty");
    expect(getProofDailyAction(30, ["Timely feedback"]).title).toBe("Prepare your proof reflection");
  });

  it("treats access or late activation friction as a validity risk before interpreting pilot evidence", () => {
    expect(derivePilotHealth({ participants: 10, baselineCompleted: 0, firstReps: 0, realWorkApplications: 0, observerPulses: 0, securityFriction: 0, day: 8 }).state).toBe("red");
    expect(derivePilotHealth({ participants: 10, baselineCompleted: 8, firstReps: 6, realWorkApplications: 5, observerPulses: 1, securityFriction: 0, day: 10 }).state).toBe("green");
    expect(derivePilotHealth({ participants: 10, baselineCompleted: 8, firstReps: 6, realWorkApplications: 5, observerPulses: 1, securityFriction: 1, day: 10 }).state).toBe("red");
  });

  it("flags likely sensitive details and offers deterministic local anonymisation without claiming infallibility", () => {
    const source = "Priya Shah emailed client@example.com about ₹3000000.";
    expect(safePracticeWarnings(source)).toEqual(expect.arrayContaining(["This may contain a person’s name.", "This may contain an email address.", "This may contain a financial figure or account identifier."]));
    expect(anonymisePracticeText(source)).toContain("[email removed]");
    expect(anonymisePracticeText(source)).toContain("[amount removed]");
  });

  it("creates a sponsor-led communication pack with actual privacy boundaries rather than generic privacy promises", () => {
    const privacy = defaultProofPrivacyConfig("Priya Shah");
    const pack = buildProofCommunicationPack({ participantName: "Alex", sponsorName: "Priya Shah", sponsorRole: "VP People", whyItMatters: "feedback delay is creating rework", behaviours: ["Timely feedback"], privacy });
    expect(pack.message).toContain("Priya Shah");
    expect(pack.message).toContain("feedback delay is creating rework");
    expect(pack.privacy.notVisibleToOrganisation.join(" ")).toContain("private coaching");
    expect(pack.faq.map((item) => item.question)).toContain("What if I do not find it useful?");
  });

  it("uses explicit, diagnostic trust states instead of a pseudo-scientific trust score", () => {
    expect(deriveTrustState({ purposeUnderstood: true, privacyViewed: true, personalGoal: true, firstValue: true })).toBe("green");
    expect(deriveTrustState({ purposeUnderstood: true, privacyViewed: false, personalGoal: false, firstValue: false })).toBe("amber");
    expect(deriveTrustState({ purposeUnderstood: true, privacyViewed: true, personalGoal: true, firstValue: true, concern: "privacy" })).toBe("red");
  });

  it("keeps the automated milestone plan bounded to Day 3, Day 7, Day 15, and Day 30", () => {
    expect(PROOF_NUDGE_DAYS).toEqual([3, 7, 15, 30]);
  });
});
