// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LaunchMissionHistory from "./LaunchMissionHistory";
import LaunchWeeklyChallenges from "./LaunchWeeklyChallenges";

const retry = vi.fn();
const invalidate = vi.fn();

vi.mock("@/components/LaunchDarkLayout", () => ({
  default: ({ children }: { children: unknown }) => createElement("main", { className: "launch-dark ld-reduced-motion" }, children),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ launchWeeklyChallenges: { getCurrentChallenge: { invalidate }, getMyProgress: { invalidate }, getLeaderboard: { invalidate } } }),
    launchMissionHistory: { getHistory: { useQuery: () => ({ data: undefined, isLoading: true, error: null, refetch: retry }) } },
    launchWeeklyChallenges: {
      getCurrentChallenge: { useQuery: () => ({ data: { challenge: { weekKey: "2026-W33", title: "Momentum Orbit", description: "Complete five missions.", xpBonus: 100, goalTarget: 5 }, enrollment: null }, isLoading: false, error: null, refetch: retry }) },
      getLeaderboard: { useQuery: () => ({ data: { entries: [], participantCount: 0, completedCount: 0 }, isLoading: false, error: null, refetch: retry }) },
      enroll: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }) },
    },
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Launch engagement accessibility", () => {
  it("announces History loading in a polite live region", () => {
    render(createElement(LaunchMissionHistory));
    const loadingCopy = screen.getByText("Loading your momentum archive…");
    expect(loadingCopy.parentElement?.getAttribute("aria-live")).toBe("polite");
  });

  it("keeps the opt-in challenge action keyboard reachable when reduced motion is active", async () => {
    const user = userEvent.setup();
    render(createElement(LaunchWeeklyChallenges));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Join challenge" }));
    expect(screen.getByRole("main").className).toContain("ld-reduced-motion");
    expect(screen.getByText(/name, email, and profile details are never shown/i)).toBeTruthy();
  });
});
