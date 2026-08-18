// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ feedbackMutate: vi.fn() }));
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
    aiSuggestionFeedback: { submit: { useMutation: () => ({ mutate: mocks.feedbackMutate, isPending: false }) } },
  },
}));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import ManagerHome from "./ManagerHome";

describe("Manager dashboard AI focus card", () => {
  it("renders citation-marked brief content as plain text and flags it with Manager context", () => {
    const { container } = render(<ManagerHome />);
    expect(screen.getByText("Coach one team member today.")).toBeTruthy();
    expect(screen.getByText("Challenge: Clarify the one outcome that matters most.")).toBeTruthy();
    expect(container.textContent).not.toContain("<cite");

    fireEvent.click(screen.getByRole("button", { name: "Flag this AI suggestion" }));
    fireEvent.click(screen.getByRole("button", { name: "Markup or text issue" }));
    expect(mocks.feedbackMutate).toHaveBeenCalledWith(expect.objectContaining({ surface: "manager_daily_brief", suggestionKind: "daily_focus", reason: "malformed" }));
  });
});
