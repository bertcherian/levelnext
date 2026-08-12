import type { TrpcContext } from "../_core/context";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "../db";
import {
  anonymousPeerLabel,
  getGoalFamily,
  getNextChallengeProgress,
  getPersonalizedChallengeVariant,
  getWeeklyChallengeWindow,
  launchWeeklyChallengesRouter,
} from "./launchWeeklyChallenges";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 52,
    openId: "weekly-challenge-test-user",
    email: "test@example.com",
    name: "Weekly Challenge Test",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("launchWeeklyChallenges", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses one UTC ISO-week window for every visitor and starts it on Monday", () => {
    const window = getWeeklyChallengeWindow(new Date("2026-08-12T16:00:00.000Z"));

    expect(window.weekKey).toBe("2026-W33");
    expect(window.startsAt.toISOString()).toBe("2026-08-10T00:00:00.000Z");
    expect(window.endsAt.toISOString()).toBe("2026-08-17T00:00:00.000Z");
  });

  it("caps enrollment progress at the target and completes exactly once", () => {
    expect(getNextChallengeProgress(4, 5)).toEqual({ progress: 5, completed: true });
    expect(getNextChallengeProgress(5, 5)).toEqual({ progress: 5, completed: true });
  });

  it("never exposes an enrollment user identifier in anonymous peer labels", () => {
    expect(anonymousPeerLabel(3)).toBe("Challenger #03");
    expect(anonymousPeerLabel(12)).toBe("Challenger #12");
  });

  it("selects a career-goal family and rotates its private variant by ISO week", () => {
    expect(getGoalFamily("Product Manager", "SaaS")).toBe("product");
    expect(getGoalFamily("Data Analyst", "Financial Services")).toBe("data");
    expect(getGoalFamily("Unknown", "")).toBe("general");

    const firstWeek = getPersonalizedChallengeVariant("2026-W01", "Product Manager", "SaaS");
    const secondWeek = getPersonalizedChallengeVariant("2026-W02", "Product Manager", "SaaS");

    expect(firstWeek.isPersonalized).toBe(true);
    expect(firstWeek.focusLabel).toBe("Product Manager");
    expect(firstWeek.key).not.toBe(secondWeek.key);
  });

  it("returns a safe empty leaderboard while database access is unavailable", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const caller = launchWeeklyChallengesRouter.createCaller(createAuthContext());

    await expect(caller.getLeaderboard({ limit: 10 })).resolves.toEqual({
      entries: [],
      participantCount: 0,
      completedCount: 0,
      target: 0,
    });
  });
});
