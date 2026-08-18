import { describe, expect, it } from "vitest";
import {
  professionalEffectivenessLoginUrl,
  professionalEffectivenessReturnTo,
} from "./PEAccessGate";

describe("Professional Effectiveness access gate", () => {
  it("preserves a Professional Effectiveness destination through sign-in", () => {
    expect(professionalEffectivenessReturnTo("/pe", "?welcome=1")).toBe("/pe?welcome=1");
    expect(professionalEffectivenessLoginUrl("/pe", "?welcome=1")).toBe(
      "/login?returnTo=%2Fpe%3Fwelcome%3D1",
    );
  });

  it("never forwards an external or unrelated destination to the login route", () => {
    expect(professionalEffectivenessReturnTo("https://untrusted.example", "?next=/pe")).toBe("/pe?next=/pe");
  });
});
