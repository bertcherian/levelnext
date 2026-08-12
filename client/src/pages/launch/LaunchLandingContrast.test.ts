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

describe("Launch Intelligence B2C acquisition page", () => {
  it("uses a neo-brutalist visual system instead of a dark SaaS treatment", () => {
    expect(launchLandingSource).toContain('className="launch-brutal"');
    expect(launchLandingSource).toContain("Not another generic career course");
    expect(launchLandingSource).toContain("Are your first");
    expect(launchLandingSource).toContain("Start the 7-mission sprint");
    expect(launchLandingSource).toContain('import "./launchLanding.css"');
  });

  it("keeps Navi consistent and omits fabricated reviews or ratings", () => {
    expect(launchCoachSources).toContain("Navi");
    expect(launchCoachSources).not.toContain("Layla");
    expect(launchLandingSource).not.toContain("TESTIMONIALS");
    expect(launchLandingSource).not.toContain("Rated by early-career professionals");
    expect(launchLandingSource).not.toContain("5.0");
  });
});
