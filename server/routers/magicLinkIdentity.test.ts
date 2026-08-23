import { describe, expect, it } from "vitest";
import { getMagicLinkUserName } from "./magicLinkIdentity";

describe("getMagicLinkUserName", () => {
  it("preserves a verified sign-up name rather than replacing it with the email local part", () => {
    expect(getMagicLinkUserName("sheila@metaresults.com", " Broadridge Onboarding ")).toBe("Broadridge Onboarding");
  });

  it("uses a deterministic fallback when an existing sign-in has no supplied name", () => {
    expect(getMagicLinkUserName("sheila@metaresults.com")).toBe("sheila");
  });
});
