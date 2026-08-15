import { describe, expect, it } from "vitest";
import { getIndividualOnboardingDestination } from "./onboardingDestination";

describe("getIndividualOnboardingDestination", () => {
  it("sends first-time individual users into Career Transition instead of the organisation-gated Home route", () => {
    expect(getIndividualOnboardingDestination(null)).toBe("/career");
    expect(getIndividualOnboardingDestination("/home")).toBe("/career");
  });

  it("preserves an intended Career sub-route for an individual user", () => {
    expect(getIndividualOnboardingDestination("/career/market-intel")).toBe("/career/market-intel");
  });

  it("rejects non-Career and protocol-relative return targets", () => {
    expect(getIndividualOnboardingDestination("/guide")).toBe("/career");
    expect(getIndividualOnboardingDestination("//example.com")).toBe("/career");
  });
});
