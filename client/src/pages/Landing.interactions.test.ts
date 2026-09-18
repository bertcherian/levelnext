// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import Landing from "./Landing";

afterEach(() => cleanup());

describe("LevelNext landing page interactions", () => {
  it("opens and closes the mobile navigation menu", async () => {
    const user = userEvent.setup();
    render(createElement(Landing));

    const openButton = screen.getByRole("button", { name: "Open navigation menu" });
    await user.click(openButton);

    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close navigation menu" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Close navigation menu" }));
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();
  });

  it("exposes a primary pilot CTA and a how-it-works anchor in the hero", () => {
    render(createElement(Landing));

    const pilotLinks = screen.getAllByRole("link", { name: /Start a 60-day pilot/i });
    expect(pilotLinks.length).toBeGreaterThan(0);
    expect(pilotLinks[0].getAttribute("href")).toContain("utm_campaign=60_day_pilot");
    expect(screen.getByRole("link", { name: /See how it works/i }).getAttribute("href")).toBe("#how-it-works");
  });

  it("keeps the pilot flow focused on evidence and measurable change", () => {
    render(createElement(Landing));

    expect(screen.getByRole("heading", { name: /Test it for 60 days/i })).toBeTruthy();
    expect(screen.getByText("Measure first. Change behaviour. Measure again. Scale what works.")).toBeTruthy();
    const talkLinks = screen.getAllByRole("link", { name: /Talk to LevelNext/i });
    expect(talkLinks.some((link) => link.getAttribute("href")?.includes("utm_campaign=talk_to_levelnext"))).toBe(true);
  });
});
