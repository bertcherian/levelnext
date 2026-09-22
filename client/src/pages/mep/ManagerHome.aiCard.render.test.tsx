// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ feedbackMutate: vi.fn(), feedbackEntriesQuery: vi.fn(), feedbackAnalyticsQuery: vi.fn() }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "Bert Cherian" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    mep: {
      getMyResults: { useQuery: () => ({ data: [] }) },
      listPlaybookSessions: { useQuery: () => ({ data: [] }) },
      listCommitments: { useQuery: () => ({ data: [] }) },
      listPracticeSessions: { useQuery: () => ({ data: [] }) },
      getTodayBriefSnapshot: { useQuery: () => ({ data: { priorityFocus: '<cite index="m-1">Coach one team member today.</cite>', managementChallenge: '<cite>Clarify the one outcome that matters most.</cite>' }, refetch: vi.fn() }) },
      getDailyBrief: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    tenant: { myTenant: { useQuery: () => ({ data: null }) } },
    aiSuggestionFeedback: { submit: { useMutation: () => ({ mutate: mocks.feedbackMutate, isPending: false }) }, listMine: { useQuery: (...args: any[]) => mocks.feedbackEntriesQuery(...args) }, getMyFeedbackAnalytics: { useQuery: (...args: any[]) => mocks.feedbackAnalyticsQuery(...args) } },
  },
}));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import ManagerHome from "./ManagerHome";

afterEach(() => cleanup());

describe("Manager dashboard AI focus card", () => {
  it("renders citation-marked brief content as plain text and flags it with Manager context", () => {
    mocks.feedbackEntriesQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
    mocks.feedbackAnalyticsQuery.mockReturnValue({ data: { trend: [], distribution: { total: 0, helpful: 0, unhelpful: 0, malformed: 0 } }, isLoading: false, isError: false, refetch: vi.fn() });
    const { container } = render(<ManagerHome />);
    expect(screen.getByText("Coach one team member today.")).toBeTruthy();
    expect(screen.getByText("Challenge: Clarify the one outcome that matters most.")).toBeTruthy();
    expect(container.textContent).not.toContain("<cite");

    fireEvent.click(screen.getByRole("button", { name: "Flag this AI suggestion" }));
    fireEvent.click(screen.getByRole("button", { name: "Markup or text issue" }));
    expect(mocks.feedbackMutate).toHaveBeenCalledWith(expect.objectContaining({ surface: "manager_daily_brief", suggestionKind: "daily_focus", reason: "malformed" }));
  });

  it("filters private manager feedback entries by reliability and date", () => {
    mocks.feedbackEntriesQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
    mocks.feedbackAnalyticsQuery.mockReturnValue({ data: { trend: [], distribution: { total: 0, helpful: 0, unhelpful: 0, malformed: 0 } }, isLoading: false, isError: false, refetch: vi.fn() });
    render(<ManagerHome />);
    fireEvent.change(screen.getByLabelText("Feedback reliability status"), { target: { value: "unhelpful" } });
    fireEvent.change(screen.getByLabelText("Feedback date range"), { target: { value: "30d" } });
    fireEvent.change(screen.getByLabelText("Feedback sort order"), { target: { value: "reliability" } });
    expect(mocks.feedbackEntriesQuery).toHaveBeenLastCalledWith({ reliability: "unhelpful", dateRange: "30d", sort: "reliability" });
  });

  it("renders a private feedback trend chart and rating distribution", () => {
    mocks.feedbackEntriesQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
    mocks.feedbackAnalyticsQuery.mockReturnValue({ data: { trend: [{ date: "2026-08-18", total: 3, helpful: 2, unhelpful: 1, malformed: 0 }], distribution: { total: 3, helpful: 2, unhelpful: 1, malformed: 0 } }, isLoading: false, isError: false, refetch: vi.fn() });
    render(<ManagerHome />);
    expect(screen.getByLabelText("Fourteen-day feedback volume chart")).toBeTruthy();
    expect(screen.getByText("Rating distribution")).toBeTruthy();
    expect(screen.getByText("Helpful · 2")).toBeTruthy();
  });
});
