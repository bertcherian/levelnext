import type { Request } from "express";
import { describe, expect, it } from "vitest";
import { getSessionCookieDomain, getSessionCookieOptions } from "./cookies";

function requestFor(hostname: string, protocol = "https") {
  return {
    hostname,
    protocol,
    headers: {},
  } as Request;
}

describe("LevelNext session cookie domain", () => {
  it("shares authenticated sessions between the apex and www public hosts", () => {
    expect(getSessionCookieDomain(requestFor("levelnext.coach"))).toBe(".levelnext.coach");
    expect(getSessionCookieDomain(requestFor("www.levelnext.coach"))).toBe(".levelnext.coach");
  });

  it("keeps preview and localhost cookies host-only", () => {
    expect(getSessionCookieDomain(requestFor("levelnextai-m9hb5g5z.manus.space"))).toBeUndefined();
    expect(getSessionCookieDomain(requestFor("localhost"))).toBeUndefined();
  });

  it("preserves secure, HttpOnly cookie protections on the public domain", () => {
    expect(getSessionCookieOptions(requestFor("www.levelnext.coach"))).toMatchObject({
      domain: ".levelnext.coach",
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
    });
  });
});
