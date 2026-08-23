export type MagicLinkDestinationInput = {
  isNewUser: boolean;
  isSPInvite: boolean;
  returnTo: string | null;
  requestedOrganisation?: string | null;
};

export type MagicLinkRedirectInput = MagicLinkDestinationInput & {
  origin: string;
  sessionToken: string;
};

function isSafeInAppPath(path: string | null): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\"));
}

/**
 * First-time Manager Effectiveness customers are taken through onboarding so
 * an enterprise administrator can establish company context before the manager
 * workspace opens. Returning users retain their requested in-app destination.
 */
export function getMagicLinkPostLoginPath({
  isNewUser,
  isSPInvite,
  returnTo,
  requestedOrganisation,
}: MagicLinkDestinationInput): string {
  if (isSPInvite) return "/admin/lsos";
  if (isNewUser && isSafeInAppPath(returnTo) && returnTo.startsWith("/manager")) {
    const organisation = requestedOrganisation?.trim();
    const organisationParam = organisation ? `&org=${encodeURIComponent(organisation)}` : "";
    return `/onboard?returnTo=${encodeURIComponent(returnTo)}${organisationParam}`;
  }
  if (isSafeInAppPath(returnTo)) return returnTo;
  return isNewUser ? "/onboard" : "/home";
}

export function getMagicLinkRedirectLocation({
  origin,
  sessionToken,
  ...destinationInput
}: MagicLinkRedirectInput): string {
  const postLoginPath = getMagicLinkPostLoginPath(destinationInput);
  const separator = postLoginPath.includes("?") ? "&" : "?";
  return `${origin}${postLoginPath}${separator}_st=${encodeURIComponent(sessionToken)}`;
}
