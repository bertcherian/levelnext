import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Landing from "./Landing";

describe("LevelNext conversion landing page", () => {
  it("communicates the behaviour-change proposition in the hero", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain("Trained your Managers?");
    expect(page).toContain("But nothing changed, right?");
    expect(page).toContain("LevelNext turns leadership development into measurable behaviour change — through AI coaching, Human touch, Practice and Real-Work Actions.");
    expect(page).toContain("20–50 people");
    expect(page).toContain("Measure before &amp; after");
    expect(page).toContain("Scale only if it works");
    expect(page).toContain("Behaviour change cockpit");
  });

  it("follows the buyer journey from gap to impact to pilot", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain("Knowing isn’t the problem.");
    expect(page).toContain("Small behaviour gaps create");
    expect(page).toContain("Manager bottlenecks");
    expect(page).toContain("Don’t just teach it.");
    expect(page).toContain("DIAGNOSE");
    expect(page).toContain("MEASURE");
    expect(page).toContain("Don’t take our word for it.");
    expect(page).toContain("Test it for 60 days.");
  });

  it("includes the concise career-stage pathway and defensible proof standard", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain("One platform.");
    expect(page).toContain("Every career stage.");
    expect(page).toContain("Early Career");
    expect(page).toContain("Managers");
    expect(page).toContain("Executives");
    expect(page).toContain("Built on real");
    expect(page).toContain("leadership development.");
    expect(page).toContain("client-approved outcome stories");
    expect(page).not.toContain("Professional intelligence for what comes next.");
    expect(page).not.toContain("The Leadership Intelligence Platform");
  });

  it("uses the canonical product pathways and repeated pilot conversion URL", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain('href="/early-career"');
    expect(page).toContain('href="/pe"');
    expect(page).toContain('href="/manager-effectiveness"');
    expect(page).toContain('href="/leader"');
    expect(page).toContain('href="/executive"');
    expect(page.match(/utm_campaign=60_day_pilot/g)?.length).toBeGreaterThanOrEqual(4);
    expect(page).not.toContain("Explore the platform");
    expect(page).not.toContain("One B2B platform.");
  });
});
