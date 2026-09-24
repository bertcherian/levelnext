import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Landing from "./Landing";

describe("LevelNext business-diagnostic landing page", () => {
  it("leads with business pain and the management leakage chain", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain("What are ineffective managers costing your business?");
    expect(page).toContain("Delayed feedback. Avoided conversations. Poor delegation. Weak accountability. Slow decisions.");
    expect(page).toContain("lost time, rework, slower execution, manager overload and unwanted attrition");
    expect(page).toContain("MANAGEMENT BEHAVIOUR");
    expect(page).toContain("BUSINESS IMPACT");
    expect(page).toContain("Poor management behaviour has a business cost.");
    expect(page).not.toContain("Trained your Managers?");
    expect(page).not.toContain("One platform for every stage");
  });

  it("includes the three-input manager cost calculator", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain("How much could manager performance leakage");
    expect(page).toContain("be costing you?");
    expect(page).toContain("Calculate Your Manager Ineffectiveness Cost");
    expect(page).toContain("Quick baseline");
    expect(page).toContain("50 managers");
    expect(page).toContain("100 managers");
    expect(page).toContain("250 managers");
    expect(page).toContain("500+ managers");
    expect(page).toContain("Number of managers");
    expect(page).toContain("Average team size");
    expect(page).toContain("Estimated avoidable hours lost per manager/team each week");
    expect(page).toContain("Estimated productivity capacity at risk");
    expect(page).toContain("Indicative estimate based on your assumptions.");
    expect(page).toContain("Refine the Estimate");
    expect(page).toContain("Export Summary");
  });

  it("lets buyers diagnose up to three behaviour gaps and shows the adaptive focus", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    ["Feedback comes too late", "Difficult conversations are avoided", "Managers don’t delegate enough", "Weak accountability", "Slow decision-making", "Too much escalation", "Low ownership", "Manager overload", "Rework", "Unwanted attrition"].forEach((gap) => expect(page).toContain(gap));
    expect(page).toContain("Where does manager effectiveness");
    expect(page).toContain("Your 30-Day Impact Test could focus on:");
    expect(page).toContain("Test These Behaviours");
  });

  it("shows the gap, real-work conversation, evidence, and privacy story", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain("Your managers probably know");
    expect(page).toContain("The problem is doing it when the moment arrives.");
    expect(page).toContain("Change behaviour where");
    expect(page).toContain("the work actually happens.");
    expect(page).toContain("No course to find. No pathway to choose.");
    expect(page).toContain("THINK");
    expect(page).toContain("PRACTICE");
    expect(page).toContain("COMMIT");
    expect(page).toContain("TIME TO ACTION");
    expect(page).toContain("Private for the individual.");
    expect(page).toContain("Evidence for the organization.");
    expect(page).toContain("Private coaching stays private.");
  });

  it("offers a controlled 30-day Impact Test without pathway marketing", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain("Give us 30 days.");
    expect(page).toContain("30-Day Manager Impact Test");
    expect(page).toContain("Run a 30-Day Pilot Test");
    expect(page).toContain("Choose pilot scope");
    expect(page).toContain("Small cohort");
    expect(page).toContain("Business unit");
    expect(page).toContain("pilot_scope=small_cohort");
    expect(page).toContain("20–30 managers");
    expect(page).toContain("Day-30 Impact Review booked before launch");
    expect(page).toContain("Scale what works. Stop what doesn’t.");
    expect(page).toContain("utm_campaign=30_day_impact_test");
    expect(page).not.toContain("Early Career Intelligence");
    expect(page).not.toContain("One platform.");
    expect(page).not.toContain("60-day pilot journey");
  });

  it("uses the new premium landing-page visual system", () => {
    const styles = readFileSync("client/src/pages/landing.css", "utf8");

    expect(styles).toContain(".ln-business-chain");
    expect(styles).toContain(".ln-calculator__layout");
    expect(styles).toContain(".ln-gap-grid");
    expect(styles).toContain(".ln-evidence-flow");
    expect(styles).toContain(".ln-test-card");
    expect(styles).toContain(".ln-input-range");
    expect(styles).toContain(".ln-pilot-toggle");
    expect(styles).toContain(".ln-preset-row");
    expect(styles).toContain(".ln-export-button");
    expect(styles).toContain("--ln-gold:#D4AF37");
  });
});
