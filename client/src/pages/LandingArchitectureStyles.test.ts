import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const landingStyles = readFileSync(
  resolve(process.cwd(), "client/src/pages/landing.css"),
  "utf8",
);

describe("LevelNext landing simplification", () => {
  it("uses a deliberately short hero without a competing journey rail", () => {
    expect(landingStyles).toContain(".ln-hero--simple { min-height: min(640px, calc(100vh - 76px));");
    expect(landingStyles).toContain(".ln-hero--simple .ln-hero__content { max-width: 820px;");
  });

  it("keeps the audience selector compact within the hero and wraps it safely on mobile", () => {
    expect(landingStyles).toContain(".ln-audience-selector { width: min(100%, 760px);");
    expect(landingStyles).toContain(".ln-audience-selector__choices { flex-wrap: wrap;");
  });

  it("animates selector details through transform and opacity only when motion is allowed", () => {
    expect(landingStyles).toContain("@media (prefers-reduced-motion: no-preference) { .ln-audience-selector__answer");
    expect(landingStyles).toContain("@keyframes ln-audience-answer-in { from { opacity: 0; transform: translateY(5px);");
  });

  it("uses lighter proof systems for the Intelligence Core and organisation pathway", () => {
    expect(landingStyles).toContain(".ln-core__simple-list { max-width: 900px;");
    expect(landingStyles).toContain(".ln-enterprise__benefits { display: grid; grid-template-columns: repeat(3, 1fr);");
    expect(landingStyles).toContain(".ln-loop--simple .ln-loop__capabilities { display: grid; grid-template-columns: repeat(3, 1fr);");
  });

  it("stacks the simplified proof sections on mobile", () => {
    expect(landingStyles).toContain(".ln-loop--simple .ln-loop__capabilities, .ln-core__simple-list, .ln-enterprise__benefits { grid-template-columns: 1fr;");
  });
});
