// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const contextMutate = vi.fn();
const thinkMutate = vi.fn();

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { name: "Bert Cherian" }, loading: false, isAuthenticated: true }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ executiveIntelligence: { getWorkspace: { invalidate: vi.fn() } } }),
    executiveIntelligence: {
      getWorkspace: { useQuery: () => ({ data: { profile: null, mandate: null, decisions: [] }, isLoading: false }) },
      saveContext: { useMutation: () => ({ mutate: contextMutate, isPending: false }) },
      saveMandate: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      thinkWithMe: { useMutation: () => ({ mutate: thinkMutate, isPending: false, data: null }) },
      createDecision: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import ExecutiveIntelligence from "./ExecutiveIntelligence";

describe("Executive Intelligence rendered workflows", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    contextMutate.mockReset();
    thinkMutate.mockReset();
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("persists the visible Executive Context Map fields rather than leaving stakeholder context as a placeholder", () => {
    render(<ExecutiveIntelligence />);
    fireEvent.change(screen.getByPlaceholderText("e.g. Country Head, India"), { target: { value: "Managing Director" } });
    fireEvent.change(screen.getByPlaceholderText("What is changing in the business, market, or enterprise environment?"), { target: { value: "The market is consolidating." } });
    fireEvent.change(screen.getByPlaceholderText("What business, functions, people, customers, or P&L are in your remit?"), { target: { value: "India P&L and customer operations." } });
    fireEvent.change(screen.getByPlaceholderText("Describe the enterprise outcome, change, or responsibility that defines this role."), { target: { value: "Stabilise growth while improving execution quality." } });
    fireEvent.change(screen.getByPlaceholderText("Board, CEO, peers, customers, investors, regulators, and critical relationships."), { target: { value: "Board, CEO, customers, and regulators." } });
    fireEvent.click(screen.getByRole("button", { name: /save context/i }));

    expect(contextMutate).toHaveBeenCalledWith(expect.objectContaining({
      roleTitle: "Managing Director",
      businessDescription: "The market is consolidating.",
      scopeDescription: "India P&L and customer operations.",
      mandateStatement: "Stabilise growth while improving execution quality.",
      stakeholderSummary: "Board, CEO, customers, and regulators.",
    }));
  });

  it("switches Prepare and Debrief into their distinct executive thinking workflows", () => {
    render(<ExecutiveIntelligence />);
    fireEvent.click(screen.getByRole("button", { name: /prepare me/i }));
    expect(screen.getByText("Prepare for the room that matters.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("What meeting, conversation, or commitment are you preparing for?"), { target: { value: "A board review of a recovery plan." } });
    fireEvent.click(screen.getByRole("button", { name: /prepare the conversation/i }));
    expect(thinkMutate).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "prepare" }));

    fireEvent.click(screen.getByRole("button", { name: /debrief with me/i }));
    expect(screen.getByText("Turn a significant event into learning.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("What happened, and what response or outcome do you want to understand?"), { target: { value: "The leadership team rejected the first proposal." } });
    fireEvent.click(screen.getByRole("button", { name: /debrief the event/i }));
    expect(thinkMutate).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "debrief" }));
  });

  it("switches Think and Challenge into their distinct executive thinking workflows", () => {
    render(<ExecutiveIntelligence />);
    fireEvent.click(screen.getByRole("button", { name: /think with me/i }));
    expect(screen.getByText("Bring an issue that matters.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("What is happening? Describe the business situation, choice, or tension in your own words."), { target: { value: "An important customer is reconsidering the contract." } });
    fireEvent.click(screen.getByRole("button", { name: /examine the situation/i }));
    expect(thinkMutate).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "think" }));

    fireEvent.click(screen.getByRole("button", { name: /challenge my decision/i }));
    expect(screen.getByText("Test the thinking before commitment hardens.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("What decision, recommendation, or position do you want to pressure-test?"), { target: { value: "Approve a major discount for a strategic renewal." } });
    fireEvent.click(screen.getByRole("button", { name: /challenge the decision/i }));
    expect(thinkMutate).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "challenge" }));
  });
});
