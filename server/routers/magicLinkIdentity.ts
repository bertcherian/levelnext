const FALLBACK_NAME = "LevelNext member";

/** Returns the verified sign-up name, or a deterministic email-derived fallback. */
export function getMagicLinkUserName(email: string, requestedName?: string | null) {
  const normalizedName = requestedName?.trim();
  if (normalizedName) return normalizedName;

  const localPart = email.trim().split("@")[0]?.trim();
  return localPart || FALLBACK_NAME;
}
