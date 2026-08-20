export type MagicLinkDestinationInput = {
  isNewUser: boolean;
  isSPInvite: boolean;
  returnTo: string | null;
};

export type MagicLinkRedirectInput = MagicLinkDestinationInput & {
  origin: string;
  sessionToken: string;
};

function isSafeInAppPath(path: string | null): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\"));
}

/**
 * Gives product sign-ups precedence over generic first-time onboarding. A user
 * who starts from a product page should enter that product immediately; users
 * without a requested destination can still choose organisation setup later.
 */
export function getMagicLinkPostLoginPath({
  isNewUser,
  isSPInvite,
  returnTo,
}: MagicLinkDestinationInput): string {
  if (isSPInvite) return "/admin/lsos";
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
