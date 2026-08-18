// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mutate = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: { aiSuggestionFeedback: { submit: { useMutation: () => ({ mutate, isPending: false }) } } },
}));

import { AiSuggestionFeedback } from "./AiSuggestionFeedback";

describe("AI suggestion feedback control", () => {
  afterEach(() => cleanup());

  it("lets a user flag malformed suggestion text with its card context", () => {
    render(<AiSuggestionFeedback surface="pe_daily_brief" suggestionKind="development_suggestion" contentKey="pe-daily-brief:today" suggestionText="Clean recommendation" />);
    fireEvent.click(screen.getByRole("button", { name: "Flag this AI suggestion" }));
    fireEvent.click(screen.getByRole("button", { name: "Markup or text issue" }));

    expect(mutate).toHaveBeenCalledWith({
      surface: "pe_daily_brief",
      suggestionKind: "development_suggestion",
      contentKey: "pe-daily-brief:today",
      reason: "malformed",
      contentSnapshot: "Clean recommendation",
    });
  });

  it("retains Manager and Career surface context when users flag an unhelpful recommendation", () => {
    mutate.mockClear();
    const { unmount } = render(<AiSuggestionFeedback surface="manager_daily_brief" suggestionKind="daily_focus" contentKey="manager-daily-brief:today" suggestionText="Coach one team member." />);
    fireEvent.click(screen.getByRole("button", { name: "Flag this AI suggestion" }));
    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ surface: "manager_daily_brief", suggestionKind: "daily_focus", reason: "unhelpful" }));

    unmount();
    mutate.mockClear();
    render(<AiSuggestionFeedback surface="career_chief_of_staff" suggestionKind="chief_of_staff_brief" contentKey="career-chief-of-staff:today" suggestionText="Prioritise one relationship." dark />);
    fireEvent.click(screen.getByRole("button", { name: "Flag this AI suggestion" }));
    fireEvent.click(screen.getByRole("button", { name: "Markup or text issue" }));
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ surface: "career_chief_of_staff", suggestionKind: "chief_of_staff_brief", reason: "malformed" }));
  });
});
