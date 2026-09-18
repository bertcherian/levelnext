import { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Landing from "./Landing";
import {
  defaultStageIndex,
  getCareerStage,
} from "./landingData";

describe("LevelNext public landing page", () => {
  const appRoutes = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

  it("renders the simplified master narrative and organisation pathway", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain("Professional intelligence");
    expect(page).toContain("for what comes next.");
    expect(page).toContain("LevelNext helps people build the judgment and everyday capability required for the level they are stepping into.");
    expect(page).toContain("Professional Intelligence");
    expect(page).toContain("A clearer next move.");
    expect(page).toContain("At every career stage.");
    expect(page).toContain("Capability development");
    expect(page).toContain("that fits the work.");
    expect(page).toContain("Early Career Intelligence");
    expect(page).toContain("Manager Effectiveness");
    expect(page).toContain("Leader Intelligence");
    expect(page).toContain("Executive Intelligence");
    expect(page).toContain("One system.");
    expect(page).toContain("Many next-level moments.");
    expect(page).toContain('aria-label="LevelNext Intelligence Core workflow"');
    expect(page).toContain("AI Coaching");
    expect(page).toContain("Outcomes");
    expect(page).toContain("Learning");
    expect(page).toContain('aria-label="Who LevelNext is for"');
    expect(page).toContain("Who it is for");
    expect(page).not.toContain("Career Transition");
    expect(page).not.toContain("LevelNext Launch");
  });

  it("defaults the visual journey to Professional and supports each defined stage", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(getCareerStage(defaultStageIndex).name).toBe("Professional Intelligence");
    expect(getCareerStage(0).name).toBe("Early Career Intelligence");
    expect(getCareerStage(2).name).toBe("Manager Effectiveness");
    expect(getCareerStage(3).name).toBe("Leader Intelligence");
    expect(getCareerStage(4).name).toBe("Executive Intelligence");
    expect(getCareerStage(99).name).toBe("Professional Intelligence");
    expect(page).toContain('aria-selected="true"');
    expect(page).toContain("Make execution more reliable across the work that matters.");
  });

  it("removes duplicated stage navigation, scenario, and ecosystem sections", () => {
    const page = renderToStaticMarkup(createElement(Landing));
    expect(page).not.toContain('aria-label="Quick filter to your career stage"');
    expect(page).not.toContain('aria-label="Professional intelligence by career level"');
    expect(page).not.toContain("Illustrative organisation scenario");
    expect(page).not.toContain("One B2B platform.");
  });

  it("retains direct product pathways without repeating the removed enterprise pipeline narrative", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain('href="/early-career"');
    expect(page).toContain('href="/pe"');
    expect(page).toContain('href="/manager-effectiveness"');
    expect(page).toContain('href="/leader"');
    expect(page).toContain('href="/executive"');
    expect(page).not.toContain("Accelerate role readiness with common work standards and clear development signals.");
    expect(page).not.toContain("Build coaching, delegation and accountability into the manager’s operating rhythm.");
    expect(page).not.toContain('href="/diagnostics/lii"');
    expect(page).not.toContain('href="/signup?experience=leader"');
    expect(page).not.toContain('href="/launch');
    expect(page).not.toContain('href="/career-intelligence"');
  });

  it("targets the registered Leader Intelligence home route rather than a diagnostic route", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(appRoutes).toContain('<Route path="/leader" component={Home} />');
    expect(page).toContain('href="/leader"');
    expect(page).not.toContain('href="/diagnostics/lii"');
  });

  it("shows Executive Intelligence as a direct platform pathway to its registered route", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(appRoutes).toContain('<Route path="/executive" component={ExecutiveIntelligence} />');
    expect(page).toContain("Executive Intelligence");
    expect(page).toContain('href="/executive"');
  });

  it("uses a centred outcome-and-learning pair rather than an unused third-cell placeholder", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain('class="ln-core__simple-outcomes"');
    expect(page).toContain('class="ln-core__step ln-core__step--outcome"');
    expect(page).not.toContain('class="ln-core__simple-list"><article');
  });
});
