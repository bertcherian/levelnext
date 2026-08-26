import { describe, expect, it } from "vitest";
import {
  managerEffectivenessLoginUrl,
  managerEffectivenessReturnTo,
} from "./MEPAccessGate";

describe("Manager Effectiveness access gate", () => {
  it("preserves a Manager Effectiveness destination through sign-in", () => {
    expect(managerEffectivenessReturnTo("/manager/team", "?member=12")).toBe("/manager/team?member=12");
    expect(managerEffectivenessLoginUrl("/manager/team", "?member=12")).toBe(
      "/login?returnTo=%2Fmanager%2Fteam%3Fmember%3D12",
    );
  });

  it("never forwards an external or unrelated destination to the login route", () => {
    expect(managerEffectivenessReturnTo("https://untrusted.example", "?next=/manager")).toBe("/manager?next=/manager");
  });
});
