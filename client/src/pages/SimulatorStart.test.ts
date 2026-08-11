// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  inferMutate: vi.fn(),
  inferReset: vi.fn(),
  ttsMutate: vi.fn(),
  startMutate: vi.fn(),
  inferOptions: null as {
    onError?: (error: unknown) => void;
    onSuccess?: (scenario: unknown) => void;
  } | null,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    simulator: {
      inferScenario: {
        useMutation: (options: {
          onError?: (error: unknown) => void;
          onSuccess?: (scenario: unknown) => void;
        }) => {
          mocks.inferOptions = options;
          return { mutate: mocks.inferMutate, reset: mocks.inferReset, isPending: false };
        },
      },
      tts: {
        useMutation: () => ({ mutate: mocks.ttsMutate, isPending: false }),
      },
      startSession: {
        useMutation: () => ({ mutate: mocks.startMutate, isPending: false }),
      },
    },
  },
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 1, name: "Test User" } }),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/manager/simulate", vi.fn()],
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import SimulatorStart from "./SimulatorStart";

afterEach(() => cleanup());

beforeEach(() => {
  window.history.pushState({}, "", "/manager/simulate");
  mocks.inferMutate.mockReset();
  mocks.inferReset.mockReset();
  mocks.inferOptions = null;
});

describe("SimulatorStart", () => {
  it("shows explicit custom scenario guidance and both regional voice groups", () => {
    render(createElement(SimulatorStart));

    expect(screen.getByLabelText("Create a custom scenario")).toBeTruthy();
    act(() => {
      mocks.inferOptions?.onSuccess?.({
        conversationType: "Accountability conversation",
        stakeholder: "A direct report",
        objective: "Agree a recovery plan.",
        expectedChallenge: "Initial defensiveness.",
        difficulty: 3,
        estimatedMinutes: 6,
        characterName: "Rohan",
        characterStyle: "Direct and thoughtful.",
        followUpQuestion: null,
      });
    });
    expect(screen.getByRole("img", { name: "India" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "United States" })).toBeTruthy();
    expect(screen.getByText("Natural Indian English voices")).toBeTruthy();
    expect(screen.getByText("International voices using US English")).toBeTruthy();
  });

  it("submits a user-authored scenario description", async () => {
    const user = userEvent.setup();
    render(createElement(SimulatorStart));

    await user.type(
      screen.getByLabelText("Create a custom scenario"),
      "Address recurring missed deadlines with a senior project lead.",
    );
    await user.click(screen.getByRole("button", { name: /build my scenario/i }));

    expect(mocks.inferMutate).toHaveBeenCalledWith({
      platform: "manager",
      prompt: "Address recurring missed deadlines with a senior project lead.",
    });
  });

  it("preserves a custom description and offers a retry after a transient generation failure", async () => {
    const user = userEvent.setup();
    const prompt = "Discuss a missed cross-functional commitment with my manager.";
    render(createElement(SimulatorStart));

    await user.type(screen.getByLabelText("Create a custom scenario"), prompt);
    await user.click(screen.getByRole("button", { name: /build my scenario/i }));

    act(() => {
      mocks.inferOptions?.onError?.({
        message: "The service is temporarily unavailable.",
        data: { httpStatus: 503 },
      });
    });

    expect(screen.getByRole("alert").textContent).toMatch(/taking longer than usual/i);
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(mocks.inferMutate).toHaveBeenLastCalledWith({ platform: "manager", prompt });
    expect(mocks.inferMutate).toHaveBeenCalledTimes(2);
  });
});
