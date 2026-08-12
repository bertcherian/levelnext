// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import Landing from "./Landing";

afterEach(() => cleanup());

describe("LevelNext landing page interactions", () => {
  it("updates the stage narrative when a visitor chooses a different career level", async () => {
    const user = userEvent.setup();
    render(createElement(Landing));

    const journey = screen.getByRole("tablist", { name: "LevelNext experiences" });
    const leaderTab = within(journey).getByRole("tab", { name: /04.*leader/i });
    await user.click(leaderTab);

    expect(leaderTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Build the alignment required to execute through complexity.")).toBeTruthy();
    expect(screen.getByText("Enterprise execution")).toBeTruthy();
  });

  it("changes the intelligence prompt when a visitor chooses a different role context", async () => {
    const user = userEvent.setup();
    render(createElement(Landing));

    const personalisation = screen.getByRole("tablist", {
      name: "Professional intelligence by career level",
    });
    const managerTab = within(personalisation).getByRole("tab", { name: "Manager" });
    await user.click(managerTab);

    expect(managerTab.getAttribute("aria-selected")).toBe("true");
    expect(
      screen.getByText("How do I diagnose what’s blocking the team, delegate effectively and restore accountability?"),
    ).toBeTruthy();
  });

  it("updates the stage showcase when a quick-filter chip is clicked", async () => {
    const user = userEvent.setup();
    render(createElement(Landing));

    const quickFilter = screen.getByLabelText("Quick filter to your career stage");
    const earlyCareerChip = within(quickFilter).getByText("Early Career").closest("button")!;
    await user.click(earlyCareerChip);

    expect(screen.getByText(/Turn early potential into role-ready capability\./)).toBeTruthy();
  });

  it("renders a sign-up CTA at the end of the Professional Intelligence narrative", () => {
    render(createElement(Landing));

    const cta = screen.getByText("Start your diagnosis");
    expect(cta).toBeTruthy();
    expect(cta.closest("a")?.getAttribute("href")).toContain("/signup");
  });
});
