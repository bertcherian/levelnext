// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LaunchLanding from "./LaunchLanding";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/const", () => ({
  getLoginUrl: () => "https://example.com/login",
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/launch", vi.fn()],
}));

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    disconnect() {}
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Launch university landing branding", () => {
  it("renders the top-left logo inside a dedicated contrast tile", () => {
    render(createElement(LaunchLanding));

    const brand = screen.getByRole("link", { name: "Launch Intelligence home" });
    const logoTile = brand.querySelector(".launch-brutal__logo-tile");
    const logo = logoTile?.querySelector("img");
    const footerLogoTile = document.querySelector(".launch-brutal__footer .launch-brutal__logo-tile");
    const footerLogo = footerLogoTile?.querySelector("img");

    expect(logoTile).toBeTruthy();
    expect(logo?.getAttribute("src")).toContain("LevelNext_logo_transparent");
    expect(logo?.getAttribute("alt")).toBe("LevelNext");
    expect(footerLogoTile).toBeTruthy();
    expect(footerLogo?.getAttribute("alt")).toBe("LevelNext");
  });

  it("defines a dark, responsive surface for the white-and-gold logo asset", () => {
    const styles = readFileSync("client/src/pages/launch/launchLanding.css", "utf8");

    expect(styles).toContain(".launch-brutal__logo-tile");
    expect(styles).toContain("background: #0A1A2F");
    expect(styles).toContain(".launch-brutal__footer-brand > .launch-brutal__logo-tile");
    expect(styles).toContain(".launch-brutal__logo-tile img { width: 48px; height: 29px;");
  });
});
