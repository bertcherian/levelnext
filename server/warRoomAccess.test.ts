import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  canCreateAnotherWeeklyOrder,
  isDecisionRequired,
  warRoomCampaignInputSchema,
  warRoomProducts,
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

describe("War Room product-level access and rules", () => {
  it("rejects non-admin users with FORBIDDEN", async () => {
    const caller = appRouter.createCaller(createMockContext({ id: 10, role: "user" }));
    await expect(caller.warRoom.commandCenter("manager_effectiveness")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("lists all available LevelNext products", async () => {
    const caller = appRouter.createCaller(createMockContext({ id: 1, role: "admin" }));
    const products = await caller.warRoom.listProducts();
    expect(products.map((p) => p.key)).toEqual(
      expect.arrayContaining([
        "manager_effectiveness",
        "leader_intelligence",
        "tech_intelligence",
        "professional_intelligence",
      ]),
    );
  });

  it("queries command center scoped to a specific product", async () => {
    const caller = appRouter.createCaller(createMockContext({ id: 1, role: "admin" }));
    const result = await caller.warRoom.commandCenter("manager_effectiveness");
    expect(result.product.key).toBe("manager_effectiveness");
    expect(result.product.label).toBe("Manager Effectiveness");
    expect(result).toHaveProperty("weeklyOrderCount");
    expect(result).toHaveProperty("decisionRequired");
  });

  it("validates product-scoped campaign input schema", () => {
    const parsed = warRoomCampaignInputSchema.safeParse({
      productKey: "leader_intelligence",
      name: "Strategic Leader Pilot",
      objective: "Scale enterprise influence",
      victoryCondition: "20 leaders demonstrated cross-functional alignment",
      ownerUserId: 1,
      deadline: new Date().toISOString(),
      reviewDate: new Date().toISOString(),
      indicators: [
        {
          key: "influence_rate",
          label: "Enterprise Influence Rate",
          definition: "Active stakeholder moves",
          decisionImplication: "Adjust practice simulator if adoption dips",
        },
      ],
    });
    expect(parsed.success).toBe(true);

    const invalidProduct = warRoomCampaignInputSchema.safeParse({
      productKey: "unsupported_product",
      name: "Invalid",
      objective: "Invalid",
      victoryCondition: "Invalid",
      ownerUserId: 1,
      deadline: new Date().toISOString(),
      reviewDate: new Date().toISOString(),
      indicators: [],
    });
    expect(invalidProduct.success).toBe(false);
  });

  it("enforces weekly order limits and decision requirements", () => {
    expect(canCreateAnotherWeeklyOrder(2)).toBe(true);
    expect(canCreateAnotherWeeklyOrder(3)).toBe(false);
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
});
