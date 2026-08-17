// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const startCoachMutation = vi.hoisted(() => vi.fn());
const startPracticeMutation = vi.hoisted(() => vi.fn());

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/components/AIChatBox", () => ({ AIChatBox: () => <div>Private chat</div> }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    earlyCareer: {
      getCoachStarters: { useQuery: () => ({ data: [], isLoading: false }) },
      getCoachSessions: { useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) },
      getCoachMessages: { useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) },
      startCoachSession: { useMutation: () => ({ mutate: startCoachMutation, isPending: false }) },
      sendCoachMessage: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getPracticeScenarios: { useQuery: () => ({ data: [{ id: "receive_feedback", capabilityId: "learning_agility", title: "Respond well to feedback", situation: "A colleague gave you feedback." }], isLoading: false, isError: false, refetch: vi.fn() }) },
      startPracticeSession: { useMutation: () => ({ mutate: startPracticeMutation, isPending: false }) },
      sendPracticeMessage: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      endPracticeSession: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import EarlyCareerCoach from "./EarlyCareerCoach";
import EarlyCareerPractice from "./EarlyCareerPractice";

describe("Early Career self-directed support", () => {
  it("uses a practical example to begin a private Guide conversation", () => {
    render(<EarlyCareerCoach />);
    fireEvent.click(screen.getByRole("button", { name: "Prepare for a manager check-in" }));
    expect(startCoachMutation).toHaveBeenCalledWith(expect.objectContaining({ context: expect.stringContaining("check-in with my manager") }));
  });

  it("starts a user-led practice session with private workplace context", () => {
    render(<EarlyCareerPractice />);
    fireEvent.change(screen.getByLabelText("What is happening?"), { target: { value: "I need to explain that a delivery date is at risk because another team has not sent information." } });
    fireEvent.change(screen.getByLabelText("Who are you speaking with?"), { target: { value: "project sponsor" } });
    fireEvent.click(screen.getByRole("button", { name: "Start my practice" }));
    expect(startPracticeMutation).toHaveBeenCalledWith(expect.objectContaining({ customContext: expect.stringContaining("delivery date is at risk"), customCounterpartRole: "project sponsor", difficulty: "realistic" }));
  });
});
