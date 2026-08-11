import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "../db";
import { launchLeaderboardRouter } from "./launchLeaderboard";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 41,
    openId: "leaderboard-test-user",
    email: "test@example.com",
    name: "Leaderboard Test",
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

describe("launchLeaderboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a safe empty community state when the database is unavailable", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const caller = launchLeaderboardRouter.createCaller(createAuthContext());

    await expect(caller.getLeaderboard({ timeframe: "week" })).resolves.toEqual({
      entries: [],
      currentUser: null,
      participantCount: 0,
      trendingMissions: [],
      timeframe: "week",
    });
  });

  it("accepts only the approved leaderboard timeframes", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const caller = launchLeaderboardRouter.createCaller(createAuthContext());

    await expect(caller.getLeaderboard({ timeframe: "all" })).resolves.toMatchObject({ timeframe: "all" });
    await expect(caller.getLeaderboard({ timeframe: "year" as never })).rejects.toBeDefined();
  });
});
