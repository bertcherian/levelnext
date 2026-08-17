// @vitest-environment jsdom
import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

let currentPath = "/home";
let requestRender: (() => void) | undefined;
let authState = { user: { id: 1, name: "Bert Cherian" }, isAuthenticated: false, loading: true };
const profileQuery = vi.hoisted(() => vi.fn());

vi.mock("wouter", () => ({
  useLocation: () => [currentPath, (nextPath: string) => {
    currentPath = nextPath;
    authState = { user: { id: 1, name: "Bert Cherian" }, isAuthenticated: false, loading: true };
    requestRender?.();
  }],
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/components/PlatformLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/SelfLeadershipProgressCard", () => ({ default: () => <div data-testid="leadership-progress" /> }));
vi.mock("@/lib/leaderExperience", () => ({
  LEADER_CORE_MODULES: ["ECI"],
  getNextLeadershipMove: () => ({ kind: "diagnostic", href: "/diagnostics", title: "Continue your leadership baseline", description: "Review the next leadership signal.", ctaLabel: "Continue" }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    tenant: { myTenant: { useQuery: () => ({ data: { role: "member" }, isLoading: false }) } },
    leadershipGraph: { get: { useQuery: () => ({ data: { completedModules: [], compositeEdge: 70 } }) } },
    leadershipCoach: {
      getGrowthProfile: { useQuery: profileQuery },
      getActionTimeline: { useQuery: () => ({ data: [], error: null, refetch: vi.fn() }) },
      generateGrowthPlan: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateCommitmentOutcome: { useMutation: () => ({ mutate: vi.fn() }) },
      generateCoachBrief: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getPrivacySettings: { useQuery: () => ({ data: null }) },
      updatePrivacySettings: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    enterpriseOnboarding: { getMyOrganisation: { useQuery: () => ({ data: { wizardStatus: "activated" } }) } },
    mission: {
      updateStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      generate: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import Home from "./Home";
import GrowthProfile from "./GrowthProfile";

function AuthenticatedAppRoute() {
  const [, setRenderVersion] = useState(0);
  requestRender = () => setRenderVersion((version) => version + 1);
  return currentPath === "/growth-profile" ? <GrowthProfile /> : <Home />;
}

describe("authenticated Leader Intelligence to Growth flow", () => {
  it("keeps protected Growth queries disabled while auth transiently resolves after client-side navigation", () => {
    currentPath = "/home";
    authState = { user: { id: 1, name: "Bert Cherian" }, isAuthenticated: true, loading: false };
    profileQuery.mockReturnValue({
      data: { memory: null, activePlan: null, recentSessions: [], recentBriefs: [], recentDebriefs: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuthenticatedAppRoute />);
    fireEvent.click(screen.getByRole("button", { name: /growth review commitments/i }));

    expect(profileQuery).toHaveBeenCalledWith(undefined, expect.objectContaining({ enabled: false, retry: 1 }));

    authState = { user: { id: 1, name: "Bert Cherian" }, isAuthenticated: true, loading: false };
    act(() => { requestRender?.(); });

    expect(screen.getByText("Leadership Growth Profile")).toBeTruthy();
    expect(profileQuery).toHaveBeenCalledWith(undefined, expect.objectContaining({ enabled: true, retry: 1 }));
  });
});
