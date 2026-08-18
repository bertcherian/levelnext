// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mutate = vi.fn();
const mutationState = vi.hoisted(() => ({ isPending: false }));
vi.mock("@/lib/trpc", () => ({
  trpc: { aiSuggestionFeedback: { submit: { useMutation: () => ({ mutate, isPending: mutationState.isPending }) } } },
}));
import { AiSuggestionFeedback } from "./AiSuggestionFeedback";

const props = { surface: "pe_daily_brief" as const, suggestionKind: "development_suggestion" as const, contentKey: "pe-daily-brief:today", suggestionText: "A clear response." };
const button = (name: "helpful" | "not helpful") => screen.getByRole("button", { name: `Rate this AI suggestion ${name}` }) as HTMLButtonElement;

describe("AI suggestion feedback control", () => {
  beforeEach(() => { mutate.mockReset(); mutationState.isPending = false; });
  afterEach(() => cleanup());

  it("lets a user flag malformed suggestion text with its card context", () => {
    render(<AiSuggestionFeedback {...props} suggestionText="Clean recommendation" />);
    fireEvent.click(screen.getByRole("button", { name: "Flag this AI suggestion" }));
    fireEvent.click(screen.getByRole("button", { name: "Markup or text issue" }));
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ surface: "pe_daily_brief", suggestionKind: "development_suggestion", contentKey: "pe-daily-brief:today", contentSnapshot: "Clean recommendation", reason: "malformed" }));
  });

  it("persists immediate helpful and unhelpful ratings with dashboard context", () => {
    const { unmount } = render(<AiSuggestionFeedback {...props} />);
    fireEvent.click(button("helpful"));
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ reason: "helpful" }), expect.any(Object));
    unmount();
    render(<AiSuggestionFeedback {...props} surface="manager_daily_brief" suggestionKind="daily_focus" />);
    fireEvent.click(button("not helpful"));
    expect(mutate).toHaveBeenLastCalledWith(expect.objectContaining({ surface: "manager_daily_brief", suggestionKind: "daily_focus", reason: "unhelpful" }), expect.any(Object));
  });

  it("shows distinct helpful and unhelpful pending states while feedback is being stored", () => {
    mutate.mockImplementation(() => undefined);
    const { unmount } = render(<AiSuggestionFeedback {...props} />);
    fireEvent.click(button("helpful"));
    expect(button("helpful").disabled).toBe(true);
    expect(button("helpful").getAttribute("aria-pressed")).toBe("true");
    unmount();
    render(<AiSuggestionFeedback {...props} />);
    fireEvent.click(button("not helpful"));
    expect(button("not helpful").disabled).toBe(true);
    expect(button("not helpful").getAttribute("aria-pressed")).toBe("true");
  });

  it("rolls back a failed helpful rating and makes it retryable", () => {
    mutate.mockImplementationOnce((_input, options) => options.onError());
    render(<AiSuggestionFeedback {...props} />);
    fireEvent.click(button("helpful"));
    expect(button("helpful").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Retry helpful rating" }));
    expect(mutate).toHaveBeenLastCalledWith(expect.objectContaining({ reason: "helpful" }), expect.any(Object));
  });

  it("rolls back a failed unhelpful rating and makes it retryable", () => {
    mutate.mockImplementationOnce((_input, options) => options.onError());
    render(<AiSuggestionFeedback {...props} />);
    fireEvent.click(button("not helpful"));
    expect(button("not helpful").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Retry not helpful rating" }));
    expect(mutate).toHaveBeenLastCalledWith(expect.objectContaining({ reason: "unhelpful" }), expect.any(Object));
  });

  it("disables both choices while the shared mutation is pending", () => {
    mutationState.isPending = true;
    render(<AiSuggestionFeedback {...props} />);
    expect(button("helpful").disabled).toBe(true);
    expect(button("not helpful").disabled).toBe(true);
  });
});
