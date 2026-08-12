// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LaunchHome from "./LaunchHome";

const completeMutate = vi.fn();
let completionOptions: { onSuccess?: (data: { xpEarned: number; challengeBonusXp?: number; newAchievements: string[] }, variables: { missionId: string }) => void } | undefined;

vi.mock("@/components/LaunchLayout", () => ({ default: ({ children }: { children: unknown }) => createElement("main", null, children) }));
vi.mock("@/components/AchievementUnlockedModal", () => ({ default: () => null }));
vi.mock("@/components/LaunchXpBurst", () => ({ default: () => null }));
vi.mock("@/components/LaunchMissionReflectionPrompt", () => ({ default: ({ missionTitle }: { missionTitle: string }) => createElement("div", { role: "dialog" }, `Reflection for ${missionTitle}`) }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "Avery Learner" } }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/launch", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ launchDailyMissions: { getToday: { invalidate: vi.fn() } }, launchProgress: { getProgress: { invalidate: vi.fn() } } }),
    launchProgress: {
      getProgress: { useQuery: () => ({ data: { progress: { targetRole: "Product Manager", currentStreak: 0, currentLevel: "Explorer", totalXp: 0 } } }) },
      getAchievementDefs: { useQuery: () => ({ data: [] }) },
    },
    launchDailyMissions: {
      getToday: { useQuery: () => ({ data: { missions: [{ id: "mission-1", title: "Write an outreach note", description: "Draft a targeted note.", xp: 20, missionArea: "Network", status: "pending" }] } }) },
      completeMission: { useMutation: (options: typeof completionOptions) => { completionOptions = options; return { mutate: completeMutate }; } },
      saveReflection: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }) },
    },
  },
}));

afterEach(() => {
  cleanup();
  completeMutate.mockClear();
  completionOptions = undefined;
});

describe("LaunchHome reflection flow", () => {
  it("opens the optional reflection only after the mission completion mutation succeeds", async () => {
    const user = userEvent.setup();
    render(createElement(LaunchHome));

    await user.click(screen.getByRole("button", { name: "Complete Write an outreach note" }));
    expect(completeMutate).toHaveBeenCalledWith({ missionId: "mission-1" });
    expect(screen.queryByRole("dialog")).toBeNull();

    await act(async () => {
      completionOptions?.onSuccess?.({ xpEarned: 20, newAchievements: [] }, { missionId: "mission-1" });
    });
    expect(screen.getByRole("dialog").textContent).toContain("Reflection for Write an outreach note");
  });
});
