import { describe, expect, it } from "vitest";
import { MEP_NAV_ITEMS } from "./MEPLayout";

describe("Manager Effectiveness navigation", () => {
  it("provides a visible Today situation-first entry point", () => {
    expect(MEP_NAV_ITEMS).toContainEqual(expect.objectContaining({
      label: "Today",
      href: "/manager/today",
    }));
  });

  it("provides a visible organisation setup entry point", () => {
    expect(MEP_NAV_ITEMS).toContainEqual(expect.objectContaining({
      label: "Organisation Setup",
      href: "/onboard?returnTo=/manager",
    }));
  });

  it("provides a direct entry point for Narrative Intelligence", () => {
    expect(MEP_NAV_ITEMS).toContainEqual(expect.objectContaining({
      label: "Narrative",
      href: "/manager/narrative",
    }));
  });

  it("provides a direct entry point for Persona Builder", () => {
    expect(MEP_NAV_ITEMS).toContainEqual(expect.objectContaining({
      label: "Persona Builder",
      href: "/manager/persona",
    }));
  });
});
