import type { CookieOptions, Request } from "express";


function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

/**
 * Share a LevelNext sign-in session between the apex and www host only. Managed
 * preview hosts intentionally retain host-only cookies because they are on a
 * separate registrable domain.
 */
export function getSessionCookieDomain(req: Request) {
  const hostname = req.hostname?.trim().toLowerCase();
  if (hostname === "levelnext.coach" || hostname === "www.levelnext.coach") {
    return ".levelnext.coach";
  }

  return undefined;
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const domain = getSessionCookieDomain(req);

  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
    ...(domain ? { domain } : {}),
  };
}

/**
 * Clear both the current shared-domain session and a legacy host-only session.
 * Browsers may retain both cookies after a domain strategy change and send the
 * older identity first, which can make a fresh magic-link sign-in look like a
 * different user.
 */
export function getSessionCookieClearOptions(req: Request): Array<Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure">> {
  const shared = getSessionCookieOptions(req);
  const { domain: _domain, ...hostOnly } = shared;
  return shared.domain ? [hostOnly, shared] : [hostOnly];
}
