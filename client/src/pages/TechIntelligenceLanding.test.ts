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
  });

  it("uses a Gap Selling current-state, consequence, and future-state narrative", () => {
    const page = renderToStaticMarkup(createElement(TechIntelligenceLanding));
    expect(page).toContain("What is the cost of");
    expect(page).toContain("Current state");
    expect(page).toContain("Business consequence");
    expect(page).toContain("Future state");
  });

  it("shows the full relevant platform pathway and source-linked coaching evidence", () => {
    const page = renderToStaticMarkup(createElement(TechIntelligenceLanding));
    expect(page).toContain("Tech Impact Diagnostic");
    expect(page).toContain("Private AI Coaching");
    expect(page).toContain("Practice Studio");
    expect(page).toContain("Technical Playbooks");
    expect(page).toContain("Real-Work Missions");
    expect(page).toContain("Success Partner Support");
    expect(page).toContain("39%");
    expect(page).toContain("63%");
    expect(page).toContain("0.43–0.74");
    expect(page).toContain("World Economic Forum");
    expect(page).toContain("Cannon-Bowers");
    expect(page).toContain("Gap Selling cost calculator");
    expect(page).toContain("Illustrative annual friction exposure");
    expect(page).toContain("Live scheduling");
    expect(page).toContain("tidycal.com/metaresults/pilot");
    expect(page).toContain("Buyer resources");
    expect(page).toContain("External Coaching Evidence Brief");
    expect(page).toContain("Microsoft coaching ecosystem");
    expect(page).toContain("670.4% ROI");
    expect(page).toContain("not a LevelNext benchmark or forecast");
    expect(page).toContain("We do not publish a Gartner ROI statistic");
    expect(page).toContain("levelnext-tech-intelligence-external-coaching-evidence-brief_0237fd4c.pdf");
    expect(page).toContain('href="/manus-storage/levelnext-tech-intelligence-external-coaching-evidence-brief_0237fd4c.pdf"');
    expect(page).toContain('download="LevelNext-Tech-Intelligence-External-Coaching-Evidence-Brief.pdf"');
    expect(page).toContain('href="https://coachingfederation.org/blog/the-roi-of-coaching-why-its-worth-the-investment/"');
    expect(page).toContain('href="https://coachingfederation.org/blog/coaching-statistics-the-roi-of-coaching-in-2024/"');
  });
});
