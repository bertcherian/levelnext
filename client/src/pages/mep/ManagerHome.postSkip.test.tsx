// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MEP_DEFERRED_ORG_SETUP_KEY, MEP_POST_SKIP_WELCOME_KEY } from "@/lib/mepPostSkip";

const toastSuccess = vi.hoisted(() => vi.fn());

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "Bert Cherian" } }) }));
vi.mock("sonner", () => ({ toast: { success: toastSuccess } }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    mep: {
      getMyResults: { useQuery: () => ({ data: [] }) },
      listPlaybookSessions: { useQuery: () => ({ data: [] }) },
      listCommitments: { useQuery: () => ({ data: [] }) },
      listPracticeSessions: { useQuery: () => ({ data: [] }) },
      getTodayBriefSnapshot: { useQuery: () => ({ data: { priorityFocus: "Coach one team member today." }, refetch: vi.fn() }) },
      getDailyBrief: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    tenant: { myTenant: { useQuery: () => ({ data: null }) } },
    aiSuggestionFeedback: {
      submit: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      listMine: { useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) },
      getMyFeedbackAnalytics: { useQuery: () => ({ data: { trend: [], distribution: { total: 0, helpful: 0, unhelpful: 0, malformed: 0 } }, isLoading: false, isError: false, refetch: vi.fn() }) },
    },
  },
}));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import ManagerHome from "./ManagerHome";

describe("Manager dashboard post-skip experience", () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/manager?onboarding=skipped");
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/manager");
  });

  it("acknowledges a just-skipped organisation setup and provides a deferrable setup reminder", () => {
    window.sessionStorage.setItem(MEP_POST_SKIP_WELCOME_KEY, "true");
    window.localStorage.setItem(MEP_DEFERRED_ORG_SETUP_KEY, "true");

    render(<ManagerHome />);

    expect(toastSuccess).toHaveBeenCalledWith(
      "Welcome to Manager Effectiveness",
      expect.objectContaining({ description: expect.stringContaining("complete organisation setup") })
    );
    expect(window.location.search).toBe("");
    expect(screen.getByRole("region", { name: "Organisation setup reminder" })).toBeTruthy();
    expect(screen.getByText("Complete organisation setup")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss organisation setup reminder" }));
    expect(window.localStorage.getItem(MEP_DEFERRED_ORG_SETUP_KEY)).toBeNull();
    expect(screen.queryByRole("region", { name: "Organisation setup reminder" })).toBeNull();
  });
});
