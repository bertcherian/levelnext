import { describe, expect, it } from "vitest";
import { ADMINISTRATOR_CONTROLS, isPlatformAdministrator } from "./adminControls";

describe("administrator controls", () => {
  it("grants the cross-platform control catalogue only to global administrators", () => {
    expect(isPlatformAdministrator("admin")).toBe(true);
    expect(isPlatformAdministrator("user")).toBe(false);
    expect(isPlatformAdministrator("success_partner")).toBe(false);
    expect(isPlatformAdministrator(undefined)).toBe(false);
  });

  it("includes the core organisation and participant-management controls", () => {
    expect(ADMINISTRATOR_CONTROLS.map((control) => control.href)).toEqual(expect.arrayContaining([
      "/admin",
      "/enterprise-onboarding",
      "/admin/org-context",
      "/admin/invites",
      "/admin/participants/import",
    ]));
  });
});
