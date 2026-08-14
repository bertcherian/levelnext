// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import Landing from "./Landing";
import { getAudienceIndexFromSearch } from "./landingAudience";

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
  });

  it("keeps one primary hero action and defers organisational conversion to the final CTA", () => {
    render(createElement(Landing));
    expect(screen.getByText("Explore the platform")).toBeTruthy();
    expect(screen.getByText("Start a conversation")).toBeTruthy();
    expect(screen.queryByText("Find your stage:")).toBeNull();
    expect(screen.queryByText("Start your diagnosis")).toBeNull();
  });

  it("routes visitors to a role-specific LevelNext experience through the concise audience selector", async () => {
    const user = userEvent.setup();
    render(createElement(Landing));

    const selector = screen.getByRole("tablist", { name: "Who LevelNext is for" });
    const managerTab = within(selector).getByRole("tab", { name: "Manager" });
    await user.click(managerTab);

    expect(managerTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Build the operating rhythm to lead people, performance and change.")).toBeTruthy();
    expect(screen.getByText("Explore Manager Effectiveness").closest("a")?.getAttribute("href")).toBe("/manager-effectiveness");
  });

  it("shows Executive Intelligence and routes its audience selector CTA to the Executive platform", async () => {
    const user = userEvent.setup();
    render(createElement(Landing));

    const selector = screen.getByRole("tablist", { name: "Who LevelNext is for" });
    const executiveTab = within(selector).getByRole("tab", { name: "Executive" });
    await user.click(executiveTab);

    expect(executiveTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Explore Executive Intelligence").closest("a")?.getAttribute("href")).toBe("/executive");
  });

  it("preselects an audience from referral parameters and falls back safely for unknown values", () => {
    expect(getAudienceIndexFromSearch("?audience=early-career")).toBe(0);
    expect(getAudienceIndexFromSearch("?for=manager")).toBe(2);
    expect(getAudienceIndexFromSearch("?profile=enterprise")).toBe(5);
    expect(getAudienceIndexFromSearch("?audience=executive")).toBe(4);
    expect(getAudienceIndexFromSearch("?audience=unknown")).toBe(0);

    window.history.replaceState({}, "", "/?audience=leader");
    render(createElement(Landing));
    expect(screen.getByRole("tab", { name: "Leader" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Explore Leader Intelligence").closest("a")?.getAttribute("href")).toBe("/home");
    window.history.replaceState({}, "", "/");
  });
});
