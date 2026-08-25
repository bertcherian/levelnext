import { describe, expect, it, vi } from "vitest";
import { enrolPilotParticipants, launchPilotCohort, parsePilotEmails } from "./criticalThinkingPilot";

describe("Critical Thinking pilot cohort helpers", () => {
  it("normalises, de-duplicates, and identifies invalid pilot email entries", () => {
    expect(parsePilotEmails("Alex@Company.com, priya@company.com\nalex@company.com; not-an-email")).toEqual({ emails: ["alex@company.com", "priya@company.com", "not-an-email"], invalidEmails: ["not-an-email"] });
  });

  it("enrols the validated pilot cohort in deterministic sequence after campaign creation", async () => {
    const addParticipant = vi.fn().mockResolvedValue({ participantId: 1 });
    await expect(enrolPilotParticipants({ campaignId: 44, emails: ["alex@company.com", "priya@company.com"], participantRole: "Director", addParticipant })).resolves.toBe(2);
    expect(addParticipant.mock.calls).toEqual([
      [{ campaignId: 44, email: "alex@company.com", participantRole: "Director" }],
      [{ campaignId: 44, email: "priya@company.com", participantRole: "Director" }],
    ]);
  });

  it("blocks invalid pilot input before campaign creation and returns the completion state after a successful launch", async () => {
    const createCampaign = vi.fn().mockResolvedValue({ campaignId: 44 });
    const addParticipant = vi.fn().mockResolvedValue({ participantId: 1 });
    await expect(launchPilotCohort({ rawEmails: "not-an-email", createCampaign, addParticipant })).rejects.toThrow("Correct these email addresses");
    expect(createCampaign).not.toHaveBeenCalled();
    await expect(launchPilotCohort({ rawEmails: "alex@company.com\npriya@company.com", participantRole: "Director", createCampaign, addParticipant })).resolves.toEqual({ campaignId: 44, enrolled: 2 });
    expect(createCampaign).toHaveBeenCalledTimes(1);
    expect(addParticipant.mock.calls.slice(-2)).toEqual([
      [{ campaignId: 44, email: "alex@company.com", participantRole: "Director" }],
      [{ campaignId: 44, email: "priya@company.com", participantRole: "Director" }],
    ]);
  });
});
