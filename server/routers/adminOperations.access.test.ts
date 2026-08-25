import { describe, expect, it } from "vitest";
import type { TrpcContext } from "../_core/context";
import { adminOperationsRouter } from "./adminOperations";

function contextFor(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("adminOperations access boundary", () => {
  it("rejects participant access before any organisation or participant data can be queried", async () => {
    const caller = adminOperationsRouter.createCaller(contextFor("user"));
    await expect(caller.listOrganisations()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.getQuickMetrics({ tenantId: null })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.searchParticipants({ query: "care", tenantId: null, limit: 25 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
