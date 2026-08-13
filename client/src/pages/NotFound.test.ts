// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotFound from "./NotFound";

const mocks = vi.hoisted(() => ({
  setLocation: vi.fn(),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/missing-page", mocks.setLocation],
}));

describe("NotFound page", () => {
  beforeEach(() => {
    mocks.setLocation.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("returns visitors to the homepage from the primary action", () => {
    render(createElement(NotFound));

    fireEvent.click(screen.getByRole("button", { name: "Return to Homepage" }));

    expect(mocks.setLocation).toHaveBeenCalledWith("/");
  });

  it("offers helpful links to public product entry points", () => {
    render(createElement(NotFound));

    const links = screen.getByRole("navigation", { name: "Helpful navigation" });

    expect(links.querySelector('a[href="/launch"]')?.textContent).toContain("Launch Intelligence");
    expect(links.querySelector('a[href="/career-landing"]')?.textContent).toContain("Career Transition");
    expect(links.querySelector('a[href="/manager-effectiveness"]')?.textContent).toContain("Manager Effectiveness");
  });
});
