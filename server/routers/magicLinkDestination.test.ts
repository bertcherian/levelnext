import { describe, expect, it } from "vitest";
import { getMagicLinkPostLoginPath, getMagicLinkRedirectLocation } from "./magicLinkDestination";

describe("getMagicLinkPostLoginPath", () => {
  it("takes a first-time manager-effectiveness user directly to Manager Effectiveness", () => {
    expect(getMagicLinkPostLoginPath({
      isNewUser: true,
      isSPInvite: false,
      returnTo: "/manager",
    })).toBe("/manager");
  });

  it("builds the magic-link verify redirect directly to Manager Effectiveness for a new user", () => {
    expect(getMagicLinkRedirectLocation({
      origin: "https://www.levelnext.coach",
      sessionToken: "session-token",
      isNewUser: true,
      isSPInvite: false,
      returnTo: "/manager",
    })).toBe("https://www.levelnext.coach/manager?_st=session-token");
  });

  it("keeps generic first-time sign-ins on onboarding when no product was requested", () => {
    expect(getMagicLinkPostLoginPath({
      isNewUser: true,
      isSPInvite: false,
      returnTo: null,
    })).toBe("/onboard");
  });

  it("rejects unsafe external destinations and preserves the success-partner workspace", () => {
    expect(getMagicLinkPostLoginPath({
      isNewUser: false,
      isSPInvite: false,
      returnTo: "//example.com",
    })).toBe("/home");
    expect(getMagicLinkPostLoginPath({
      isNewUser: true,
      isSPInvite: true,
      returnTo: "/manager",
    })).toBe("/admin/lsos");
  });
});
