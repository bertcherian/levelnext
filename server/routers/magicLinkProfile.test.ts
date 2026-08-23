import { describe, expect, it } from "vitest";
import { getMagicLinkRequestedProfile } from "./magicLinkProfile";

describe("getMagicLinkRequestedProfile", () => {
  it("preserves the requested organisation alongside the verified sign-up name for token persistence", () => {
    expect(getMagicLinkRequestedProfile(" Broadridge Onboarding ", " Broadridge ")).toEqual({
      requestedName: "Broadridge Onboarding",
      requestedOrganisation: "Broadridge",
    });
  });
});
