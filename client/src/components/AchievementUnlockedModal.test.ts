// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AchievementUnlockedModal from "./AchievementUnlockedModal";
import LaunchXpBurst from "./LaunchXpBurst";

const ACHIEVEMENT = {
  id: "first-move",
  title: "First Move",
  description: "You completed your first mission.",
  icon: "🚀",
  xp: 25,
};

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
});

describe("Launch celebration feedback", () => {
  it("announces an XP burst and exposes a challenge bonus without relying on animation", () => {
    render(createElement(LaunchXpBurst, { earned: 75, bonusXp: 100 }));

    expect(screen.getByRole("status", { name: "75 XP earned" })).toBeTruthy();
    expect(screen.getByText("+75 XP")).toBeTruthy();
    expect(screen.getByText("+100 challenge bonus")).toBeTruthy();
  });

  it("uses the non-destructive DOM copy fallback when Clipboard API access is unavailable", async () => {
    const user = userEvent.setup();
    const execCommand = vi.fn(() => true);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });

    render(createElement(AchievementUnlockedModal, { achievement: ACHIEVEMENT, onClose: vi.fn() }));
    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(screen.getByRole("button", { name: "Copied!" })).toBeTruthy();
  });
});
