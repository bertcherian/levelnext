import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "../db";
import { assessmentRouter } from "./assessment";
import { reportRouter } from "./report";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(userId: number | null): TrpcContext {
  const user: AuthenticatedUser | null = userId === null
    ? null
    : {
      id: userId,
      openId: `user-${userId}`,
      email: `user-${userId}@example.com`,
      name: `User ${userId}`,
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

function selectResult(rows: unknown[]) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(rows),
        }),
      }),
    }),
  };
}

describe("P0 route-level access enforcement", () => {
  it("requires authentication before either slug-based report endpoint can run", async () => {
    const anonymousContext = createContext(null);

    await expect(
      reportRouter.createCaller(anonymousContext).bySlug({ slug: "private-report" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      assessmentRouter.createCaller(anonymousContext).getReport({ slug: "private-report" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("denies authenticated users access to a report owned by someone else", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(selectResult([{ userId: 22 }]));

    await expect(
      reportRouter.createCaller(createContext(11)).bySlug({ slug: "another-users-report" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("denies starting a locked Leadership diagnostic even when its route is called directly", async () => {
    const lockedJourneyDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    };
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(lockedJourneyDb);

    await expect(
      assessmentRouter.createCaller(createContext(11)).startSession({ moduleType: "LII" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("denies a submission that attempts to pair an owned session with a different diagnostic", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(selectResult([
      { userId: 11, moduleType: "LII", status: "in_progress", tenantId: null },
    ]));

    await expect(
      assessmentRouter.createCaller(createContext(11)).submit({
        sessionId: 71,
        moduleType: "ECI",
        responses: {},
        participantName: "User 11",
        participantEmail: "user-11@example.com",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("denies a save attempt against another user's in-progress session", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(selectResult([
      { userId: 22, moduleType: "ECI", status: "in_progress" },
    ]));

    await expect(
      assessmentRouter.createCaller(createContext(11)).saveProgress({
        sessionId: 71,
        responses: { "1": 4 },
        currentQuestionIndex: 1,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
