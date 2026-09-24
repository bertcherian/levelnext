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

  it("exposes the cost calculator and Impact Test conversion paths", () => {
    render(createElement(Landing));

    expect(screen.getAllByRole("button", { name: /Calculate Your Manager Cost/i }).length).toBeGreaterThan(0);
    const impactLinks = screen.getAllByRole("link", { name: /Run a 30-Day Impact Test/i });
    expect(impactLinks.length).toBeGreaterThan(0);
    expect(impactLinks[0].getAttribute("href")).toContain("utm_campaign=30_day_impact_test");
  });

  it("selects up to three behaviour gaps and enables the test CTA", async () => {
    const user = userEvent.setup();
    render(createElement(Landing));

    const testButton = screen.getByRole("button", { name: "Test These Behaviours" });
    expect(testButton).toHaveProperty("disabled", true);
    await user.click(screen.getByRole("button", { name: "Feedback comes too late" }));
    await user.click(screen.getByRole("button", { name: "Weak accountability" }));
    await user.click(screen.getByRole("button", { name: "Rework" }));

    expect(screen.getByRole("button", { name: "Test These Behaviours" })).toHaveProperty("disabled", false);
    expect(screen.getByText("Feedback comes too late • Weak accountability • Rework")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Slow decision-making" }));
    expect(screen.getByRole("button", { name: "Slow decision-making" }).getAttribute("aria-pressed")).toBe("false");
  });
});
