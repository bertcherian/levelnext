// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listUseQuery: vi.fn(),
  runMutation: { mutate: vi.fn(), isPending: false },
  reviewMutation: { mutate: vi.fn(), isPending: false },
  invalidate: vi.fn(),
}));

vi.mock("@/components/PlatformLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "admin" }, loading: false }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ modelEvaluation: { list: { invalidate: mocks.invalidate } } }),
    modelEvaluation: {
      list: { useQuery: mocks.listUseQuery },
      run: { useMutation: () => mocks.runMutation },
      review: { useMutation: () => mocks.reviewMutation },
    },
  },
}));

import AdminModelEvaluator, { reviewFormValues } from "./AdminModelEvaluator";

const savedEvaluation = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  status: "completed",
  claudeModel: "claude-haiku-4-5",
  claudeResponse: "Claude response",
  claudeError: null,
  claudeLatencyMs: 500,
  claudeUsage: { totalTokens: 42 },
  qwenModel: "qwen/qwen3-30b-a3b",
  qwenResponse: "Qwen response",
  qwenError: null,
  qwenLatencyMs: 700,
  qwenUsage: { totalTokens: 48 },
  preferredModel: "qwen",
  reviewScores: { clarity: 5, usefulness: 4, leadershipTone: 3 },
  reviewerNote: "More direct and actionable.",
  userPrompt: "First saved prompt",
  createdAt: new Date("2026-08-17T12:00:00Z"),
  ...overrides,
});

describe("model evaluator reviewer controls", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mocks.listUseQuery.mockReset();
    mocks.listUseQuery.mockReturnValue({ data: [savedEvaluation()], isLoading: false });
    mocks.runMutation.mutate.mockReset();
    mocks.reviewMutation.mutate.mockReset();
    mocks.invalidate.mockReset();
  });

  it("hydrates a saved evaluation review instead of retaining default form values", () => {
    expect(reviewFormValues({
      preferredModel: "qwen",
      reviewScores: { clarity: 5, usefulness: 4, leadershipTone: 3 },
      reviewerNote: "More direct and actionable.",
    })).toEqual({
      preferredModel: "qwen",
      clarity: "5",
      usefulness: "4",
      leadershipTone: "3",
      reviewerNote: "More direct and actionable.",
    });
  });

  it("uses neutral defaults only when an evaluation has no saved review", () => {
    expect(reviewFormValues(null)).toEqual({
      preferredModel: "tie",
      clarity: "4",
      usefulness: "4",
      leadershipTone: "4",
      reviewerNote: "",
    });
  });

  it("hydrates reviewer controls from the initially displayed saved evaluation", () => {
    render(<AdminModelEvaluator />);

    expect((screen.getByLabelText("Clarity") as HTMLInputElement).value).toBe("5");
    expect((screen.getByLabelText("Usefulness") as HTMLInputElement).value).toBe("4");
    expect((screen.getByLabelText("Leadership tone") as HTMLInputElement).value).toBe("3");
    expect((screen.getByLabelText("Reviewer note") as HTMLTextAreaElement).value).toBe("More direct and actionable.");
    expect(screen.getByRole("button", { name: "qwen" }).className).toContain("text-white");
  });

  it("updates reviewer controls before save when an administrator selects another saved evaluation", () => {
    mocks.listUseQuery.mockReturnValue({
      data: [
        savedEvaluation(),
        savedEvaluation({
          id: 2,
          userPrompt: "Second saved prompt",
          preferredModel: "claude",
          reviewScores: { clarity: 2, usefulness: 3, leadershipTone: 5 },
          reviewerNote: "Warmer coaching tone.",
        }),
      ],
      isLoading: false,
    });

    render(<AdminModelEvaluator />);
    fireEvent.click(screen.getByRole("button", { name: /Second saved prompt/i }));

    expect((screen.getByLabelText("Clarity") as HTMLInputElement).value).toBe("2");
    expect((screen.getByLabelText("Usefulness") as HTMLInputElement).value).toBe("3");
    expect((screen.getByLabelText("Leadership tone") as HTMLInputElement).value).toBe("5");
    expect((screen.getByLabelText("Reviewer note") as HTMLTextAreaElement).value).toBe("Warmer coaching tone.");
    expect(screen.getByRole("button", { name: "claude" }).className).toContain("text-white");
  });

  it("keeps a model-specific error visible when a saved comparison is partial", () => {
    mocks.listUseQuery.mockReturnValue({
      data: [savedEvaluation({
        status: "partial",
        qwenResponse: null,
        qwenError: "Qwen provider unavailable.",
      })],
      isLoading: false,
    });

    render(<AdminModelEvaluator />);

    expect(screen.getByText("Claude response")).toBeTruthy();
    expect(screen.getByText("Qwen provider unavailable.")).toBeTruthy();
    expect(screen.getByText("Qwen3-30B-A3B could not complete:")).toBeTruthy();
  });
});
