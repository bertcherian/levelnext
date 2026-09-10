import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "bert@metaresults.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Behavioural Intelligence sponsor heatmap privacy", () => {
  it("returns an aggregate-only contract with no individual records", async () => {
    const result = await appRouter.createCaller(createAdminContext()).behaviouralIntelligence.getSponsorHeatmap();

    expect(result).toHaveProperty("eligible");
    expect(result).toHaveProperty("threshold", 5);
    expect(result).toHaveProperty("privacyBoundary");
    expect(JSON.stringify(result)).not.toContain("userId");
    expect(JSON.stringify(result)).not.toContain("reflectionText");
    expect(JSON.stringify(result)).not.toContain("suggestedLanguage");
    expect(JSON.stringify(result)).not.toContain("actionDescription");
    expect(JSON.stringify(result)).not.toContain("situation");
  }, 10000);
});
