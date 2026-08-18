// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ feedbackMutate: vi.fn() }));

vi.mock("@/components/PlatformLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    careerAccess: {
      getProfile: { useQuery: () => ({ data: null, refetch: vi.fn() }) },
      getCareerStrategy: { useQuery: () => ({ data: null, refetch: vi.fn() }) },
      getOpportunityUniverse: { useQuery: () => ({ data: [], refetch: vi.fn() }) },
      saveProfile: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      generateCareerStrategy: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      generateOpportunityUniverse: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateOpportunityStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      clearOpportunityUniverse: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getCareerAccessScore: { useQuery: () => ({ data: null, refetch: vi.fn() }) },
      getTodayChiefOfStaffBriefing: { useQuery: () => ({ data: { brief: { greeting: '<cite>Good morning, Bert.</cite>', todaysPriorityAction: '<cite>Schedule one strategic conversation.</cite>', pipelineHealth: '<cite>Pipeline is building steadily.</cite>', coachingNudge: '<cite>Stay focused on evidence.</cite>', followUpsDue: [], radarAlerts: [] } }, refetch: vi.fn() }) },
      generateChiefOfStaffBriefing: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      computeCareerAccessScore: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getBriefingHistory: { useQuery: () => ({ data: [] }) },
      getScoreImprovement: { useQuery: () => ({ data: null }) },
      logAccessPathActivation: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getRelationships: { useQuery: () => ({ data: [], refetch: vi.fn() }) },
      addRelationship: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateRelationship: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      deleteRelationship: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      scoreRelationship: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      generateWeeklyReport: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    aiSuggestionFeedback: { submit: { useMutation: () => ({ mutate: mocks.feedbackMutate, isPending: false }) } },
  },
}));

import CareerAccess from "./CareerAccess";

describe("Career Access AI Chief-of-Staff card", () => {
  it("renders a populated generated briefing as plain text and flags it with Career context", () => {
    const { container } = render(<CareerAccess />);
    expect(screen.getByText("Good morning, Bert.")).toBeTruthy();
    expect(screen.getByText("Schedule one strategic conversation.")).toBeTruthy();
    expect(container.textContent).not.toContain("<cite");

    fireEvent.click(screen.getByRole("button", { name: "Rate this AI suggestion not helpful" }));
    expect(mocks.feedbackMutate).toHaveBeenCalledWith(expect.objectContaining({ surface: "career_chief_of_staff", suggestionKind: "chief_of_staff_brief", reason: "unhelpful" }), expect.any(Object));
  });
});
