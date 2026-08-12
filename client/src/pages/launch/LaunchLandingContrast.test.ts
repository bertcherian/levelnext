import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const launchLandingSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/launch/LaunchLanding.tsx"),
  "utf8",
);
const launchCoachSources = [
  "client/src/pages/launch/LaunchLanding.tsx",
  "client/src/pages/launch/LaunchResumeMakeover.tsx",
  "client/src/pages/launch/LaunchSkillSprint.tsx",
  "server/routers/launchSkillSprint.ts",
].map((path) => readFileSync(resolve(process.cwd(), path), "utf8")).join("\n");

describe("Launch Landing Navi heading contrast", () => {
  it("uses a light, explicit foreground treatment over the dark How It Works background", () => {
    expect(launchLandingSource).toContain('color: "#F8FAFC", textShadow: "0 1px 18px rgba(0,0,0,0.24)"');
    expect(launchLandingSource).toContain("Your AI coach, Navi, guides every step");
  });

  it("uses Navi consistently throughout the Launch coach experience", () => {
    expect(launchCoachSources).toContain("Navi");
    expect(launchCoachSources).not.toContain("Layla");
  });
});
