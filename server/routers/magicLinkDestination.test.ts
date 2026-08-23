import { describe, expect, it } from "vitest";
import { getMagicLinkPostLoginPath, getMagicLinkRedirectLocation } from "./magicLinkDestination";

describe("getMagicLinkPostLoginPath", () => {
  it("takes a first-time manager-effectiveness user through onboarding while preserving the requested workspace", () => {
    expect(getMagicLinkPostLoginPath({
      isNewUser: true,
      isSPInvite: false,
      returnTo: "/manager",
      requestedOrganisation: "Broadridge",
    })).toBe("/onboard?returnTo=%2Fmanager&org=Broadridge");
  });

  it("builds a magic-link redirect that carries the new manager through organisation setup", () => {
    expect(getMagicLinkRedirectLocation({
      origin: "https://www.levelnext.coach",
      sessionToken: "session-token",
      isNewUser: true,
      isSPInvite: false,
      returnTo: "/manager",
      requestedOrganisation: "Broadridge",
    })).toBe("https://www.levelnext.coach/onboard?returnTo=%2Fmanager&org=Broadridge&_st=session-token");
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
