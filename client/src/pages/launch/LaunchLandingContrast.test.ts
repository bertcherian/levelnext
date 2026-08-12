import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const launchLandingSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/launch/LaunchLanding.tsx"),
  "utf8",
);

describe("Launch Landing Layla heading contrast", () => {
  it("uses a light, explicit foreground treatment over the dark How It Works background", () => {
    expect(launchLandingSource).toContain('color: "#F8FAFC", textShadow: "0 1px 18px rgba(0,0,0,0.24)"');
    expect(launchLandingSource).toContain("Your AI coach, Layla, guides every step");
  });
});
