import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  canCreateAnotherWeeklyOrder,
  isDecisionRequired,
  warRoomCampaignInputSchema,
  warRoomEvidenceInputSchema,
} from "../shared/modules/warRoom";

function createMockContext(user?: { id: number; role: "user" | "admin" | "success_partner"; name?: string | null } | null): TrpcContext {
  return {
    user: user
      ? {
          id: user.id,
          openId: `openid-${user.id}`,
          email: `${user.role}@example.com`,
          name: user.name ?? "Test User",
          loginMethod: "email",
          role: user.role,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("War Room access control and core rules", () => {
  it("rejects unauthenticated requests with FORBIDDEN via admin middleware", async () => {
    const caller = appRouter.createCaller(createMockContext(null));
    await expect(caller.warRoom.commandCenter()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects non-admin users with FORBIDDEN", async () => {
    const caller = appRouter.createCaller(createMockContext({ id: 10, role: "user" }));
    await expect(caller.warRoom.commandCenter()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows admin users to query the command center", async () => {
    const caller = appRouter.createCaller(createMockContext({ id: 1, role: "admin", name: "Bert Cherian" }));
    const result = await caller.warRoom.commandCenter();
    expect(result).toHaveProperty("tenant");
    expect(result).toHaveProperty("weeklyOrderCount");
    expect(result).toHaveProperty("decisionRequired");
  });

  it("enforces weekly order limits deterministically", () => {
    expect(canCreateAnotherWeeklyOrder(0)).toBe(true);
    expect(canCreateAnotherWeeklyOrder(1)).toBe(true);
    expect(canCreateAnotherWeeklyOrder(2)).toBe(true);
    expect(canCreateAnotherWeeklyOrder(3)).toBe(false);
  });

  it("detects no-decision-required state correctly", () => {
    expect(
      isDecisionRequired({
        materialEvidenceCount: 0,
        hasDueDecision: false,
        hasDueOrder: false,
        reviewRequested: false,
      }),
    ).toBe(false);

    expect(
      isDecisionRequired({
        materialEvidenceCount: 1,
        hasDueDecision: false,
        hasDueOrder: false,
        reviewRequested: false,
      }),
    ).toBe(true);
  });

  it("validates campaign indicator constraints via shared schema", () => {
    const parsed = warRoomCampaignInputSchema.safeParse({
      tenantId: 1,
      name: "Q4 Expansion",
      objective: "Win enterprise logos",
      victoryCondition: "3 signed enterprise agreements",
      ownerUserId: 1,
      deadline: new Date().toISOString(),
      reviewDate: new Date().toISOString(),
      indicators: [
        {
          key: "pipeline",
          label: "Stage 3 Pipeline",
          definition: "Active opportunities",
          decisionImplication: "Increase outreach if pipeline drops",
        },
      ],
    });
    expect(parsed.success).toBe(true);

    const overLimit = warRoomCampaignInputSchema.safeParse({
      tenantId: 1,
      name: "Too many",
      objective: "Invalid",
      victoryCondition: "Invalid",
      ownerUserId: 1,
      deadline: new Date().toISOString(),
      reviewDate: new Date().toISOString(),
      indicators: [
        { key: "1", label: "1", definition: "1", decisionImplication: "1" },
        { key: "2", label: "2", definition: "2", decisionImplication: "2" },
        { key: "3", label: "3", definition: "3", decisionImplication: "3" },
        { key: "4", label: "4", definition: "4", decisionImplication: "4" },
      ],
    });
    expect(overLimit.success).toBe(false);
  });
});
