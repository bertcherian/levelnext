const audienceAliases: Record<string, number> = {
  early: 0,
  earlycareer: 0,
  early_career: 0,
  professional: 1,
  contributor: 1,
  manager: 2,
  leadership: 3,
  leader: 3,
  executive: 4,
  organisation: 5,
  organization: 5,
  enterprise: 5,
};

export function getAudienceIndexFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const rawAudience = params.get("audience") ?? params.get("for") ?? params.get("profile") ?? "";
  const normalized = rawAudience.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return audienceAliases[normalized] ?? 0;
}
