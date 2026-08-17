// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const startPracticeMutation = vi.hoisted(() => vi.fn());
const savePracticeMutation = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());
const savedQuery = vi.hoisted(() => vi.fn());
const historyQuery = vi.hoisted(() => vi.fn());

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/early-career/guide", navigate] }));
vi.mock("@/components/AIChatBox", () => ({ AIChatBox: () => <div>Private chat</div> }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ earlyCareer: { getSavedPracticeScenarios: { invalidate: vi.fn() }, getPracticeHistory: { invalidate: vi.fn() } } }),
    earlyCareer: {
      getCoachStarters: { useQuery: () => ({ data: [], isLoading: false }) },
      getCoachSessions: { useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) },
      getCoachMessages: { useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) },
      startCoachSession: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      sendCoachMessage: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getPracticeScenarios: { useQuery: () => ({ data: [{ id: "receive_feedback", capabilityId: "learning_agility", title: "Respond well to feedback", situation: "A colleague gave you feedback." }], isLoading: false, isError: false, refetch: vi.fn() }) },
      getSavedPracticeScenarios: { useQuery: () => savedQuery() },
      getPracticeHistory: { useQuery: () => historyQuery() },
      startPracticeSession: { useMutation: () => ({ mutate: startPracticeMutation, isPending: false }) },
      sendPracticeMessage: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      endPracticeSession: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      savePracticeScenario: { useMutation: () => ({ mutate: savePracticeMutation, isPending: false }) },
      deleteSavedPracticeScenario: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import EarlyCareerCoach from "./EarlyCareerCoach";
import EarlyCareerPractice from "./EarlyCareerPractice";

const refetch = vi.fn();
const normalSaved = { data: [{ id: 3, title: "Deadline update", context: "I need to explain that a delivery date is at risk because a dependency is late.", counterpartRole: "manager", objective: "Agree a recovery plan." }], isLoading: false, isError: false, refetch };
const normalHistory = { data: [{ id: 8, scenarioTitle: "Deadline update", customContext: "I need to explain that a delivery date is at risk because a dependency is late.", status: "completed", messages: [{ role: "user", content: "I need help", timestamp: "2026-01-01" }], feedback: { tryNext: "Lead with the risk and the next step." }, updatedAt: new Date("2026-01-01") }], isLoading: false, isError: false, refetch };

beforeEach(() => {
  savedQuery.mockReturnValue(normalSaved);
  historyQuery.mockReturnValue(normalHistory);
});

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.clearAllMocks();
});

describe("Early Career self-directed support", () => {
  it("moves a practical Guide example into a prefilled Practice draft", () => {
    window.sessionStorage.clear();
    render(<EarlyCareerCoach />);
    fireEvent.click(screen.getByRole("button", { name: /Prepare for a manager check-in/ }));
    expect(navigate).toHaveBeenCalledWith("/early-career/practice");
    expect(window.sessionStorage.getItem("levelnext:early-career-practice-draft")).toContain("check-in with my manager");
  });

  it("starts a user-led practice session with private workplace context", () => {
    render(<EarlyCareerPractice />);
    fireEvent.change(screen.getByLabelText("What is happening?"), { target: { value: "I need to explain that a delivery date is at risk because another team has not sent information." } });
    fireEvent.change(screen.getByLabelText("Who are you speaking with?"), { target: { value: "project sponsor" } });
    fireEvent.click(screen.getByRole("button", { name: "Start my practice" }));
    expect(startPracticeMutation).toHaveBeenCalledWith(expect.objectContaining({ customContext: expect.stringContaining("delivery date is at risk"), customCounterpartRole: "project sponsor", difficulty: "realistic" }));
  });

  it("saves a custom situation and lets the employee review private past practice", () => {
    render(<EarlyCareerPractice />);
    fireEvent.change(screen.getByLabelText("What is happening?"), { target: { value: "I need to explain that a delivery date is at risk because another team has not sent information." } });
    fireEvent.click(screen.getByRole("button", { name: /save for later/i }));
    expect(savePracticeMutation).toHaveBeenCalledWith(expect.objectContaining({ context: expect.stringContaining("delivery date is at risk") }));
    fireEvent.click(screen.getByRole("button", { name: /Review/ }));
    expect(screen.getByText("Practice review")).toBeTruthy();
    expect(screen.getByText("Lead with the risk and the next step.")).toBeTruthy();
  });

  it("distinguishes empty, loading, and failed saved/history resources", () => {
    savedQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch });
    historyQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch });
    const { rerender } = render(<EarlyCareerPractice />);
    expect(screen.getByText("No saved situations yet. Save a workplace moment above to reuse it later.")).toBeTruthy();
    expect(screen.getByText("Your completed and in-progress rehearsals will appear here.")).toBeTruthy();
    savedQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch });
    historyQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    rerender(<EarlyCareerPractice />);
    expect(screen.getByText("Loading your saved private situations…")).toBeTruthy();
    expect(screen.getByText("Practice history could not load.")).toBeTruthy();
  });
});
