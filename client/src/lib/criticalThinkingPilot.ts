const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parsePilotEmails(rawEmails: string) {
  const emails = Array.from(new Set(rawEmails.split(/[\s,;]+/).map((value) => value.trim().toLowerCase()).filter(Boolean)));
  return { emails, invalidEmails: emails.filter((email) => !EMAIL_PATTERN.test(email)) };
}

export async function enrolPilotParticipants(input: { campaignId: number; emails: string[]; participantRole?: string; addParticipant: (participant: { campaignId: number; email: string; participantRole?: string }) => Promise<unknown> }) {
  for (const email of input.emails) await input.addParticipant({ campaignId: input.campaignId, email, participantRole: input.participantRole });
  return input.emails.length;
}

export async function launchPilotCohort(input: {
  rawEmails: string;
  participantRole?: string;
  createCampaign: () => Promise<{ campaignId: number }>;
  addParticipant: (participant: { campaignId: number; email: string; participantRole?: string }) => Promise<unknown>;
}) {
  const { emails, invalidEmails } = parsePilotEmails(input.rawEmails);
  if (!emails.length) throw new Error("Add at least one pilot participant email address.");
  if (invalidEmails.length) throw new Error(`Correct these email addresses: ${invalidEmails.join(", ")}`);
  const campaign = await input.createCampaign();
  const enrolled = await enrolPilotParticipants({ campaignId: campaign.campaignId, emails, participantRole: input.participantRole, addParticipant: input.addParticipant });
  return { campaignId: campaign.campaignId, enrolled };
}
