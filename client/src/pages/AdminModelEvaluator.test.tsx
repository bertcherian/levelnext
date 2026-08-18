// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listUseQuery: vi.fn(),
  dashboardUseQuery: vi.fn(),
  exportReviewedUseQuery: vi.fn(),
  dashboardRefetch: vi.fn(),
  exportRefetch: vi.fn(),
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
      dashboard: { useQuery: mocks.dashboardUseQuery },
      exportReviewed: { useQuery: mocks.exportReviewedUseQuery },
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
    mocks.dashboardUseQuery.mockReset();
    mocks.dashboardUseQuery.mockReturnValue({ data: { totalEvaluations: 1, reviewedEvaluations: 1, preference: { claudeWinRate: 0, qwenWinRate: 1, ties: 0 }, quality: { averageScore: 4, scoredReviews: 1 }, latency: { claudeAverageMs: 500, qwenAverageMs: 700 }, cost: { claudeEstimatedUsd: 0.0001, qwenEstimatedUsd: 0.00001, qwenEstimatedSavingsUsd: 0.00009 } }, isLoading: false, isError: false, refetch: mocks.dashboardRefetch });
    mocks.exportReviewedUseQuery.mockReset();
    mocks.exportReviewedUseQuery.mockReturnValue({ data: [savedEvaluation()], isLoading: false, isError: false, refetch: mocks.exportRefetch });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:levelnext-evaluations") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    mocks.runMutation.mutate.mockReset();
    mocks.reviewMutation.mutate.mockReset();
    mocks.invalidate.mockReset();
    mocks.dashboardRefetch.mockReset();
    mocks.exportRefetch.mockReset();
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

  it("applies a coaching template to the shared evaluator prompts", () => {
    render(<AdminModelEvaluator />);
    fireEvent.click(screen.getByRole("button", { name: /Difficult conversation/i }));

    expect((screen.getByLabelText("System prompt") as HTMLTextAreaElement).value).toContain("executive coach");
    expect((screen.getByLabelText("Test prompt") as HTMLTextAreaElement).value).toContain("Context (anonymised)");
    expect((screen.getByLabelText("Max output") as HTMLInputElement).value).toBe("700");
  });

  it("renders dashboard signals and downloads the reviewed evaluation CSV", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    render(<AdminModelEvaluator />);

    expect(screen.getByText("Model selection signals")).toBeTruthy();
    expect(screen.getByText("Reviewer quality score")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Export reviewed CSV/i }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("shows a metrics failure with an in-context retry action", () => {
    mocks.dashboardUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: mocks.dashboardRefetch });
    render(<AdminModelEvaluator />);

    expect(screen.getByText("Unable to load evaluation metrics.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry metrics" }));
    expect(mocks.dashboardRefetch).toHaveBeenCalledTimes(1);
  });

  it("distinguishes an export-data failure from an empty reviewed history and retries it", () => {
    mocks.exportReviewedUseQuery.mockReturnValue({ data: [], isLoading: false, isError: true, refetch: mocks.exportRefetch });
    render(<AdminModelEvaluator />);

    expect(screen.getByText("Unable to load reviewed export data. Retry to download ratings.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry export data" }));
    expect(mocks.exportRefetch).toHaveBeenCalledTimes(1);
  });
});
