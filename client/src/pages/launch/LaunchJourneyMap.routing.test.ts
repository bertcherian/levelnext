import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const journeySource = readFileSync(resolve(process.cwd(), "client/src/pages/launch/LaunchJourneyMap.tsx"), "utf8");
const shellSource = readFileSync(resolve(process.cwd(), "client/src/components/LaunchDarkLayout.tsx"), "utf8");

describe("Launch Journey routing and access boundary", () => {
  it("uses registered Launch destinations for missions 4 through 7", () => {
    expect(journeySource).toContain('route: "/launch/applications"');
    expect(journeySource).toContain('route: "/launch/interview"');
    expect(journeySource).toContain('route: "/launch/dashboard"');
    expect(journeySource).toContain('route: "/launch/journey"');
    expect(journeySource).not.toMatch(/\/launch\/mission\/[4-7]/);
  });

  it("gates protected shell queries and renders a sign-in boundary", () => {
    expect(shellSource).toContain("enabled: Boolean(user)");
    expect(shellSource).toContain("if (!user)");
    expect(shellSource).toContain("Sign in to Launch Intelligence");
  });
});
