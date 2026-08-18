// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

const dailyBrief = {
  greeting: "Good morning, Bert.",
  dayTheme: "AI fluency",
  priorityFocus: "Explore a relevant tool.",
  calendarItems: [],
  developmentSuggestion: {
    topic: '<cite index="10-1">AI fluency and helping teams work confidently with AI and automation</cite>',
    why: '<cite index="1-24">AI is changing leadership by increasing the need for data-informed decision-making.</cite>',
    action: "Identify one AI capability relevant to your role and explore it for 15 minutes.",
  },
  reflectionQuestion: "Where could AI improve your workflow?",
  commitmentReminder: null,
  coachingNudge: "Start with one small experiment.",
};

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { name: "Bert Cherian" } }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ pei: { getTodayBriefSnapshot: { setData: vi.fn() } } }),
    pei: {
      getDashboardSummary: { useQuery: () => ({ data: { latestResult: null, activeCommitmentsCount: 0, activeCommitments: [] }, isLoading: false }) },
      getTodayBriefSnapshot: { useQuery: () => ({ data: dailyBrief, isLoading: false }) },
      getUpcomingEvents: { useQuery: () => ({ data: [] }) },
      generateDailyBrief: { useMutation: () => ({ mutate: vi.fn() }) },
    },
    aiSuggestionFeedback: { submit: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
  },
}));

vi.mock("wouter", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import PEHome from "./PEHome";

describe("Professional Effectiveness loaded daily brief", () => {
  it("removes citation markup from the rendered development suggestion in the full page", () => {
    const { container } = render(<PEHome />);

    expect(screen.getByText("AI fluency and helping teams work confidently with AI and automation")).toBeTruthy();
    expect(screen.getByText("AI is changing leadership by increasing the need for data-informed decision-making.")).toBeTruthy();
    expect(screen.getByText("Identify one AI capability relevant to your role and explore it for 15 minutes.")).toBeTruthy();
    expect(container.textContent).not.toContain("<cite");
    expect(container.textContent).not.toContain("</cite>");
  });
});
