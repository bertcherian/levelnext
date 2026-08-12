import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Landing from "./Landing";
import {
  defaultStageIndex,
  getCareerStage,
  personalisationLevels,
} from "./landingData";

describe("LevelNext public landing page", () => {
  it("renders the master Professional Intelligence narrative and organisation pathway", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain("Whatever your next level");
    expect(page).toContain("Professional Intelligence");
    expect(page).toContain("One platform.");
    expect(page).toContain("Across your talent pipeline.");
    expect(page).toContain("Early Career Intelligence");
    expect(page).toContain("Manager Effectiveness");
    expect(page).toContain("Leader Intelligence");
    expect(page).not.toContain("Career Transition");
    expect(page).not.toContain("LevelNext Launch");
  });

  it("defaults the visual journey to Professional and supports each defined stage", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(getCareerStage(defaultStageIndex).name).toBe("Professional Intelligence");
    expect(getCareerStage(0).name).toBe("Early Career Intelligence");
    expect(getCareerStage(2).name).toBe("Manager Effectiveness");
    expect(getCareerStage(3).name).toBe("Leader Intelligence");
    expect(getCareerStage(99).name).toBe("Professional Intelligence");
    expect(page).toContain('aria-selected="true"');
    expect(page).toContain("Become exceptional at getting work done.");
  });

  it("renders the three role-specific personalisation controls and the default question", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(personalisationLevels).toEqual(["Professional", "Manager", "Leader"]);
    expect(page).toContain('aria-label="Professional intelligence by career level"');
    expect(page).toContain("How do I take ownership, communicate risk and get the work back on track?");
  });

  it("renders the quick-filter navigation and the narrative-end sign-up CTA", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain('aria-label="Quick filter to your career stage"');
    expect(page).toContain("Find your stage:");
    expect(page).toContain("Start your diagnosis");
    expect(page).toContain("/signup?platform=leadership");
  });

  it("makes every talent-pipeline stage a contextual link to its tailored diagnostic flow", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain("Build workplace confidence, capability and habits from day one.");
    expect(page).toContain("Turn individual output into accountable team performance.");
    expect(page).toContain("Lead across priorities, functions and organisational complexity.");
    expect(page).toContain('href="/early-career"');
    expect(page).toContain('href="/pe/assessment"');
    expect(page).toContain('href="/manager/diagnostics"');
    expect(page).toContain('href="/diagnostics/lii"');
    expect(page).not.toContain('href="/launch');
    expect(page).not.toContain('href="/career-intelligence"');
  });
});
