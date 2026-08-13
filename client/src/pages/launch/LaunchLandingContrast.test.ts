import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const launchLandingSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/launch/LaunchLanding.tsx"),
  "utf8",
);
const launchLandingStyles = readFileSync(
  resolve(process.cwd(), "client/src/pages/launch/launchLanding.css"),
  "utf8",
);
const globalStyles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
const publicLandingStyles = readFileSync(resolve(process.cwd(), "client/src/pages/landing.css"), "utf8");
const launchCoachSources = [
  "client/src/pages/launch/LaunchLanding.tsx",
  "client/src/pages/launch/LaunchResumeMakeover.tsx",
  "client/src/pages/launch/LaunchSkillSprint.tsx",
  "server/routers/launchSkillSprint.ts",
].map((path) => readFileSync(resolve(process.cwd(), path), "utf8")).join("\n");

function relativeLuminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => parseInt(channel, 16) / 255) ?? [];
  const linearChannels = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linearChannels[0] + 0.7152 * linearChannels[1] + 0.0722 * linearChannels[2];
}

function contrastRatio(foreground: string, background: string) {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

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

  it("uses explicit ivory text for the dark Less Guessing, More Evidence section", () => {
    expect(launchLandingSource).toContain("Less guessing.<br />More evidence.");
    expect(launchLandingStyles).toContain(".launch-brutal__section--ink h2 { color: var(--launch-paper); }");
    expect(launchLandingStyles).toContain(".launch-brutal__section--ink .launch-brutal__section-label, .launch-brutal__section--ink .launch-brutal__section-head > p:last-child { color: var(--launch-paper); }");
  });

  it("maintains contrast-safe dark-surface defaults across the public and Launch landing pages", () => {
    expect(globalStyles).toMatch(/h1, h2, h3, h4, h5, h6\s*\{[\s\S]*?color: inherit;/);
    expect(globalStyles).toMatch(/p\s*\{\s*color: inherit;/);
    expect(publicLandingStyles).toContain(".ln-landing h1, .ln-landing h2, .ln-landing h3 { color: inherit; }");
    expect(contrastRatio("#fff8e7", "#151515")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#ffffff", "#0a1d2f")).toBeGreaterThanOrEqual(4.5);
  });
});
