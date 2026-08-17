// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("wouter", () => ({ useLocation: () => ["/home", navigate] }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Bert Cherian" }, isAuthenticated: true, loading: false }) }));
vi.mock("@/components/PlatformLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/SelfLeadershipProgressCard", () => ({ default: () => <div data-testid="leadership-progress" /> }));
vi.mock("@/lib/leaderExperience", () => ({
  LEADER_CORE_MODULES: ["ECI"],
  getNextLeadershipMove: () => ({ kind: "diagnostic", href: "/diagnostics", title: "Continue your leadership baseline", description: "Review the next leadership signal.", ctaLabel: "Continue" }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    tenant: { myTenant: { useQuery: () => ({ data: { role: "member" }, isLoading: false }) } },
    leadershipGraph: { get: { useQuery: () => ({ data: { completedModules: [], compositeEdge: 70 } }) } },
    leadershipCoach: { getActionTimeline: { useQuery: () => ({ data: [], refetch: vi.fn() }) } },
    enterpriseOnboarding: { getMyOrganisation: { useQuery: () => ({ data: { wizardStatus: "activated" } }) } },
    mission: { updateStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
  },
}));

import Home from "./Home";

describe("Leader Intelligence Growth navigation", () => {
  it("opens Growth Profile through client-side navigation without a full-page reload", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /growth review commitments/i }));
    expect(navigate).toHaveBeenCalledWith("/growth-profile");
  });
});
