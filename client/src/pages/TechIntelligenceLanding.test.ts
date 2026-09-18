import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TechIntelligenceLanding from "./TechIntelligenceLanding";

describe("LevelNext Tech Intelligence landing page", () => {
  it("presents Tech Intelligence as a distinct LevelNext platform experience", () => {
    const page = renderToStaticMarkup(createElement(TechIntelligenceLanding));
    expect(page).toContain("LevelNext Tech Intelligence");
    expect(page).toContain("A LevelNext platform experience");
    expect(page).toContain('src="/logo.png"');
    expect(page).toContain('href="/demo"');
    expect(page).toContain('id="top"');
  });

  it("uses a Gap Selling current-state, consequence, and future-state narrative", () => {
    const page = renderToStaticMarkup(createElement(TechIntelligenceLanding));
    expect(page).toContain("What is the cost of");
    expect(page).toContain("Current state");
    expect(page).toContain("Business consequence");
    expect(page).toContain("Future state");
  });

  it("shows the focused platform pathway and keeps the diagnostic in Tech Intelligence", () => {
    const page = renderToStaticMarkup(createElement(TechIntelligenceLanding));
    expect(page).toContain("Tech Impact Diagnostic");
    expect(page).toContain("Private AI Coaching");
    expect(page).toContain("Practice Studio");
    expect(page).toContain("Technical Playbooks");
    expect(page).toContain("Real-Work Missions");
    expect(page).toContain("Success Partner Support");
    expect(page).toContain("Cost Calculator for Not Coaching");
    expect(page).toContain("Illustrative annual friction exposure");
    expect(page).toContain("tidycal.com/metaresults/pilot");
    expect(page).toContain('href="/engineering/diagnostic"');
    expect(page).toContain("Open diagnostic");
    expect(page).not.toContain("Evidence belongs in");
    expect(page).not.toContain("Make the next");
    expect(page).not.toContain("Bring a real");
    expect(page).not.toContain("Microsoft coaching ecosystem");
    expect(page).not.toContain("<iframe");
  });
});
