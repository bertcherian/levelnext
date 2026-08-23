import { describe, expect, it } from "vitest";
import { getMagicLinkRedemptionRedirect } from "./magicLinkRedemption";

describe("getMagicLinkRedemptionRedirect", () => {
  it("uses the organisation persisted on the redeemed token for a first-time Manager Effectiveness administrator", () => {
    expect(getMagicLinkRedemptionRedirect({
      origin: "https://levelnext.coach",
      sessionToken: "fresh-sheila-session",
      isNewUser: true,
      isSPInvite: false,
      magicLink: { returnTo: "/manager", requestedOrganisation: "Broadridge" },
    })).toBe("https://levelnext.coach/onboard?returnTo=%2Fmanager&org=Broadridge&_st=fresh-sheila-session");
  });
});
