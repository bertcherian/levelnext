// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const profileQuery = vi.hoisted(() => vi.fn());
const timelineQuery = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({ isAuthenticated: true, loading: false }));

vi.mock("wouter", () => ({ useLocation: () => ["/growth-profile", vi.fn()] }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/components/PlatformLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    leadershipCoach: {
      getGrowthProfile: { useQuery: profileQuery },
      getActionTimeline: { useQuery: timelineQuery },
      generateGrowthPlan: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateCommitmentOutcome: { useMutation: () => ({ mutate: vi.fn() }) },
      generateCoachBrief: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getPrivacySettings: { useQuery: () => ({ data: null }) },
      updatePrivacySettings: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    mission: { updateStatus: { useMutation: () => ({ mutate: vi.fn() }) }, generate: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
  },
}));

import GrowthProfile from "./GrowthProfile";

describe("Growth Profile client navigation resilience", () => {
  it("renders safely when a navigation-time profile payload omits optional history arrays", () => {
    authState.isAuthenticated = true;
    authState.loading = false;
    profileQuery.mockReturnValue({ data: { memory: null, activePlan: null }, isLoading: false, error: null, refetch: vi.fn() });
    timelineQuery.mockReturnValue({ data: [], error: null, refetch: vi.fn() });
    render(<GrowthProfile />);
    expect(screen.getByText("Leadership Growth Profile")).toBeTruthy();
    expect(screen.getByText("Practice Sessions")).toBeTruthy();
    expect(profileQuery).toHaveBeenCalledWith(undefined, expect.objectContaining({ enabled: true, retry: 1 }));
  });

  it("keeps the user inside a retryable page state when the profile query fails during navigation", () => {
    authState.isAuthenticated = true;
    authState.loading = false;
    profileQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error("Failed to fetch"), refetch: vi.fn() });
    timelineQuery.mockReturnValue({ data: undefined, error: null, refetch: vi.fn() });
    render(<GrowthProfile />);
    expect(screen.getByText("Growth Profile could not load just now.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /try again/i })).toBeTruthy();
  });

  it("holds protected queries until authentication resolves during a client-side transition", () => {
    authState.isAuthenticated = false;
    authState.loading = true;
    profileQuery.mockReturnValue({ data: undefined, isLoading: false, error: null, refetch: vi.fn() });
    timelineQuery.mockReturnValue({ data: undefined, error: null, refetch: vi.fn() });
    render(<GrowthProfile />);
    expect(profileQuery).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ enabled: false, retry: 1 }));
    expect(timelineQuery).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ enabled: false, retry: 1 }));
    expect(document.querySelector("svg.animate-spin")).toBeTruthy();
  });

  it("renders a legacy serialized plan and nullable action values without reaching the global error page", () => {
    authState.isAuthenticated = true;
    authState.loading = false;
    profileQuery.mockReturnValue({ data: { memory: null, activePlan: { plan: JSON.stringify({ growthTheme: "Build clarity", whyItMatters: "Make each message easier to act on.", week1: "Practise concise updates.", realWorldActions: ["Ask for a clear decision."] }) }, recentSessions: [], recentBriefs: [], recentDebriefs: [] }, isLoading: false, error: null, refetch: vi.fn() });
    timelineQuery.mockReturnValue({ data: [{ id: "legacy-1", entityId: 1, type: "commitment", title: null, description: null, status: null, dueDate: null, createdAt: null, aiRecommendation: null }], error: null, refetch: vi.fn() });
    render(<GrowthProfile />);
    expect(screen.getByText("Build clarity")).toBeTruthy();
    expect(screen.getByText("Leadership action")).toBeTruthy();
    expect(screen.queryByText("Something went wrong")).toBeNull();
  });
});
