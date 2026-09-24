// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("exposes the ineffectiveness calculator and personalized Pilot Test conversion paths", () => {
    render(createElement(Landing));

    expect(screen.getAllByRole("button", { name: /Calculate Your Manager Ineffectiveness Cost/i }).length).toBeGreaterThan(0);
    const pilotLinks = screen.getAllByRole("link", { name: /Run a 30-Day Pilot Test/i });
    expect(pilotLinks.length).toBeGreaterThan(0);
    expect(pilotLinks[0].getAttribute("href")).toContain("utm_campaign=30_day_impact_test");
    expect(pilotLinks[0].getAttribute("href")).toContain("pilot_scope=small_cohort");
  });

  it("offers draggable calculator sliders and includes selected gaps in the booking URL", async () => {
    const user = userEvent.setup();
    render(createElement(Landing));

    const managerSlider = screen.getByRole("slider", { name: "Number of managers slider" });
    expect(screen.getAllByRole("slider").length).toBe(3);
    fireEvent.change(managerSlider, { target: { value: "500" } });
    expect((managerSlider as HTMLInputElement).value).toBe("500");

    await user.click(screen.getByRole("button", { name: "Feedback comes too late" }));
    const personalizedLink = screen.getAllByRole("link", { name: /Run a 30-Day Pilot Test/i })[0];
    expect(personalizedLink.getAttribute("href")).toContain("manager_behaviours=Feedback+comes+too+late");
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

  it("switches the Pilot Test card between a small cohort and business unit scope", async () => {
    const user = userEvent.setup();
    render(createElement(Landing));

    const scopeSwitch = screen.getByRole("switch", { name: "Choose pilot scope" });
    expect(scopeSwitch.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByText("A focused group of 20–30 managers.")).toBeTruthy();

    await user.click(scopeSwitch);

    expect(scopeSwitch.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("A larger 50+ manager business-unit test.")).toBeTruthy();
    expect(screen.getByText("50+ managers")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /Run a 30-Day Pilot Test/i })[0].getAttribute("href")).toContain("pilot_scope=business_unit");
  });
});
