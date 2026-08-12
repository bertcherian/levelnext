// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LaunchMissionReflectionPrompt from "./LaunchMissionReflectionPrompt";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("LaunchMissionReflectionPrompt", () => {
  it("keeps reflection optional and saves a trimmed private response", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(createElement(LaunchMissionReflectionPrompt, {
      missionTitle: "Write an outreach message",
      isSaving: false,
      onSave,
      onSkip: vi.fn(),
    }));

    await user.type(screen.getByLabelText("Your private reflection"), "  Specific openers feel easier.  ");
    await user.click(screen.getByRole("button", { name: "Save reflection" }));

    expect(onSave).toHaveBeenCalledWith("Specific openers feel easier.");
    expect(screen.getByText("Only you can see this.")).toBeTruthy();
  });

  it("allows the learner to skip without entering feedback", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(createElement(LaunchMissionReflectionPrompt, {
      missionTitle: "Research a target company",
      isSaving: false,
      onSave: vi.fn(),
      onSkip,
    }));

    await user.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("focuses the private response field and supports Escape dismissal", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(createElement(LaunchMissionReflectionPrompt, {
      missionTitle: "Practice an interview answer",
      isSaving: false,
      onSave: vi.fn(),
      onSkip,
    }));

    expect(document.activeElement).toBe(screen.getByLabelText("Your private reflection"));
    await user.keyboard("{Escape}");
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
