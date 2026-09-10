import { describe, expect, it } from "vitest";
import { getMagicLinkRequestedProfile } from "./magicLinkProfile";

describe("getMagicLinkRequestedProfile", () => {
  it("preserves the requested organisation alongside the verified sign-up name for token persistence", () => {
    expect(getMagicLinkRequestedProfile(" Broadridge Onboarding ", " Broadridge ", " +91 98765 43210 ")).toEqual({
      requestedName: "Broadridge Onboarding",
      requestedOrganisation: "Broadridge",
      requestedWhatsappNumber: "+91 98765 43210",
    });
  });

  it("normalizes empty or whitespace-only WhatsApp inputs to null", () => {
    expect(getMagicLinkRequestedProfile("Bert Cherian", undefined, "   ")).toEqual({
      requestedName: "Bert Cherian",
      requestedOrganisation: null,
      requestedWhatsappNumber: null,
    });
  });
});
