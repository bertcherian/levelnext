import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeLLM = vi.fn();
vi.mock("./_core/llm", () => ({ invokeLLM }));

describe("draftPartnerNudges", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns a deterministic, participant-led draft if the model is unavailable", async () => {
    invokeLLM.mockRejectedValueOnce(new Error("provider unavailable"));
    const { draftPartnerNudges } = await import("./engineeringNudgeIntelligence");

    const result = await draftPartnerNudges([{
      participantId: 3,
      participantName: "Sanjay",
      missionId: 11,
      missionTitle: "Test the problem framing before proposing a fix",
      missionStatus: "accepted",
      reasonCode: "mission_due",
      priorityScore: 70,
      dueAt: "2026-08-31T00:00:00.000Z",
      lastUpdatedAt: "2026-08-24T00:00:00.000Z",
    }]);

    expect(result.mode).toBe("deterministic");
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.suggestedQuestion).toContain("Test the problem framing");
    expect(result.drafts[0]?.suggestedQuestion.toLowerCase()).not.toContain("private");
  });

  it("projects prompt context to the explicit permitted candidate fields", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ nudges: [] }) } }] });
    const { draftPartnerNudges } = await import("./engineeringNudgeIntelligence");

    await draftPartnerNudges([{
      participantId: 4,
      participantName: "Meera",
      missionId: 19,
      missionTitle: "Make a stakeholder decision clearer",
      missionStatus: "accepted",
      reasonCode: "mission_stalled",
      priorityScore: 60,
      lastUpdatedAt: "2026-08-24T00:00:00.000Z",
      privateReflection: "This must never reach the model.",
    } as any]);

    const userMessage = invokeLLM.mock.calls[0]?.[0]?.messages?.[1]?.content as string;
    expect(userMessage).toContain("Make a stakeholder decision clearer");
    expect(userMessage).not.toContain("This must never reach the model.");
  });
});
