// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true, loading: false }) }));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ earlyCareer: { getManagerCompanion: { invalidate: vi.fn() }, getManagerAssignmentDirectory: { invalidate: vi.fn() } } }), earlyCareer: {
  getManagerCompanion: { useQuery: () => ({ isLoading: false, isError: false, data: { privacyBoundary: "Private content excluded.", employees: [], nudges: [], practiceAnalytics: { minimumParticipantCount: 3, cohortSize: 4, categories: [{ label: "Respond well to feedback", topic: "learning agility", participantCount: 3, sessionCount: 4 }], withheldCategoryCount: 1, privacyBoundary: "Only grouped categories are visible." } } }) },
  getManagerAssignmentDirectory: { useQuery: () => ({ data: { canManageAssignments: false } }) },
  createManagerNudge: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, updateManagerNudgeStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, assignManager: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
} } }));
import ManagerCompanion from "./ManagerCompanion";
afterEach(() => cleanup());
describe("Manager Companion practice analytics", () => {
  it("shows a threshold-qualified aggregate category with explicit privacy messaging", () => {
    render(<ManagerCompanion />);
    expect(screen.getByText("Cohort practice patterns")).toBeTruthy();
    expect(screen.getByText("Respond well to feedback")).toBeTruthy();
    expect(screen.getByText("3 employees across 4 rehearsals")).toBeTruthy();
    expect(screen.getByText(/less-common category is withheld/i)).toBeTruthy();
    expect(screen.getByText("Only grouped categories are visible.")).toBeTruthy();
  });
});
