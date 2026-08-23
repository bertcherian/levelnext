import { describe, expect, it } from "vitest";
import { getMepOrganisationSetupHref } from "./mepOrganisationSetup";

describe("getMepOrganisationSetupHref", () => {
  it("sends an administrator without a workspace to organisation setup", () => {
    expect(getMepOrganisationSetupHref(false)).toBe("/onboard?returnTo=/manager");
  });

  it("sends an administrator with a workspace to organisation management", () => {
    expect(getMepOrganisationSetupHref(true)).toBe("/organisation");
  });
});
