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

  it("uses lighter proof systems for the Intelligence Core and organisation pathway", () => {
    expect(landingStyles).toContain(".ln-core__simple-list { max-width: 900px;");
    expect(landingStyles).toContain(".ln-enterprise__benefits { display: grid; grid-template-columns: repeat(3, 1fr);");
    expect(landingStyles).toContain(".ln-loop--simple .ln-loop__capabilities { display: grid; grid-template-columns: repeat(3, 1fr);");
  });

  it("stacks the simplified proof sections on mobile", () => {
    expect(landingStyles).toContain(".ln-loop--simple .ln-loop__capabilities, .ln-core__simple-list, .ln-enterprise__benefits { grid-template-columns: 1fr;");
  });
});
