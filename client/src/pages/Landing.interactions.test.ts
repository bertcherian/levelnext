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
  });

  it("keeps one primary hero action and defers organisational conversion to the final CTA", () => {
    render(createElement(Landing));
    expect(screen.getByText("Explore the platform")).toBeTruthy();
    expect(screen.getByText("Start a conversation")).toBeTruthy();
    expect(screen.queryByText("Find your stage:")).toBeNull();
    expect(screen.queryByText("Start your diagnosis")).toBeNull();
  });
});
