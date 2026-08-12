// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WeeklyRecap } from "./LaunchDashboard";

vi.mock("@/lib/trpc", () => ({ trpc: {} }));
vi.mock("@/components/LaunchDarkLayout", () => ({ default: ({ children }: { children: unknown }) => createElement("main", null, children) }));

const recap = {
  weekKey: "2026-W33",
  xpEarned: 140,
  completedMissions: 3,
  reflectionCount: 1,
  challenge: null,
};

afterEach(cleanup);

describe("WeeklyRecap accessibility", () => {
  it("announces a non-interactive loading state inside the reduced-motion shell", () => {
    render(createElement("div", { className: "launch-dark ld-reduced-motion" }, createElement(WeeklyRecap, { isLoading: true, error: false, onRetry: vi.fn() })));
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Building your recap…");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps the retry action keyboard reachable when the recap is unavailable", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(createElement("div", { className: "launch-dark ld-reduced-motion" }, createElement(WeeklyRecap, { isLoading: false, error: true, onRetry })));
    await user.tab();
    const retry = screen.getByRole("button", { name: "Retry loading your weekly recap" });
    expect(document.activeElement).toBe(retry);
    await user.keyboard("{Enter}");
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders recap metrics as private, non-interactive content", () => {
    render(createElement("div", { className: "launch-dark ld-reduced-motion" }, createElement(WeeklyRecap, { isLoading: false, error: false, recap, onRetry: vi.fn() })));
    expect(screen.getByText("Only you can see this summary.")).toBeTruthy();
    expect(screen.getByText("+140")).toBeTruthy();
    expect(screen.getByText("Not joined")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
