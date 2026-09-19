import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CareerStageLanding from "./CareerStageLanding";

const stages = [
  ["early-career", "Early Career Intelligence", "Start the Early Career diagnostic"],
  ["professional", "Professional Intelligence", "Start the Professional diagnostic"],
  ["manager", "Manager Effectiveness", "Start the Manager diagnostic"],
  ["leader", "Leader Intelligence", "Continue to Leader Intelligence"],
  ["executive", "Executive Intelligence", "Explore Executive Intelligence"],
] as const;

describe("CareerStageLanding", () => {
  it.each(stages)("renders the dedicated %s pathway page", (stageKey, stageName, ctaLabel) => {
    const page = renderToStaticMarkup(createElement(CareerStageLanding, { stageKey }));

    expect(page).toContain(stageName);
    expect(page).toContain(ctaLabel);
    expect(page).toContain("What this pathway builds");
    expect(page).toContain("Compare all five career stages");
  });
});
