import { createElement } from "react";
import { readFileSync } from "node:fs";
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
    expect(page).toContain("60-day pilot journey");
    expect(page).toContain("Pre / post visibility");
    expect(page).toContain("Growth in action");
    expect(page).toContain("Illustrative behaviour-change signal rising from baseline to day 60");
    expect(page).toContain("Day 60");
    expect(page).not.toContain("Behaviour change cockpit");
    expect(page).not.toContain("ln-product-visual");
  });

  it("follows the buyer journey from impact to pilot", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).not.toContain("The current state");
    expect(page).not.toContain("Knowing isn’t the problem.");
    expect(page).toContain("Small action gaps.");
    expect(page).toContain("Big business costs.");
    expect(page).toContain("Manager bottlenecks");
    expect((page.match(/ln-impact-list__visual/g) ?? []).length).toBe(5);
    expect(page).not.toContain("ln-impact-list__number");
    expect(page).toContain("Delegation and team capacity");
    expect(page).toContain("Coaching and team independence");
    expect(page).toContain("Feedback and performance");
    expect(page).toContain("Influence and decision speed");
    expect(page).toContain("Strategic capacity and operating rhythm");
    expect(page).toContain("Don’t take our word.");
    expect(page).not.toContain("Don’t take our word for it.");
    expect(page).toContain("Test it for 60 days.");
    expect(page).not.toContain("The proof standard");
    expect(page).not.toContain("Built on real");
    expect(page).toContain("Every person in a LevelNext programme is assigned a Success Partner");
    expect(page).toContain("A human supports.");
    expect(page).not.toContain("A human supports you.");
    expect(page).toContain("Support");
    expect(page).toContain("Encourage");
    expect(page).toContain("Provide accountability");
  });

  it("includes the concise career-stage pathway and evidence-led pilot content", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain("One platform.");
    expect(page).toContain("Every career stage.");
    expect(page).toContain("Early Career");
    expect(page).toContain("Managers");
    expect(page).toContain("Executives");
    expect((page.match(/ln-career-path__number/g) ?? []).length).toBe(5);
    expect((page.match(/ln-career-path__icon/g) ?? []).length).toBe(5);
    expect(page).toContain("Designed for evidence");
    expect(page).toContain("A focused test of behaviour change.");
    expect(page).not.toContain("Professional intelligence for what comes next.");
    expect(page).not.toContain("The Leadership Intelligence Platform");
  });

  it("uses the canonical product pathways and repeated pilot conversion URL", () => {
    const page = renderToStaticMarkup(createElement(Landing));

    expect(page).toContain('href="/early-career-intelligence"');
    expect(page).toContain('href="/professional-intelligence"');
    expect(page).toContain('href="/manager-intelligence"');
    expect(page).toContain('href="/leader-intelligence"');
    expect(page).toContain('href="/executive-intelligence"');
    expect(page.match(/utm_campaign=60_day_pilot/g)?.length).toBeGreaterThanOrEqual(4);
    expect(page).not.toContain("Explore the platform");
    expect(page).not.toContain("One B2B platform.");
    expect(page).not.toContain("The behaviour-change engine");
    expect(page).not.toContain("Don’t just teach it.");
  });

  it("adds an accessible Chrome Yellow glow to career-stage cards", () => {
    const styles = readFileSync("client/src/pages/landing.css", "utf8");

    expect(styles).toContain(".ln-career-path a:hover,.ln-career-path a:focus-visible");
    expect(styles).toContain("outline:1px solid rgba(212,175,55,.82)");
    expect(styles).toContain("box-shadow:0 0 18px rgba(212,175,55,.16)");
  });
});
