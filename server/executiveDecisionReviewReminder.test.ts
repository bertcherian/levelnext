import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Executive decision-review reminders", () => {
  const router = readFileSync("server/routers/executiveIntelligence.ts", "utf8");
  const handlers = readFileSync("server/scheduledHandlers.ts", "utf8");
  const server = readFileSync("server/_core/index.ts", "utf8");

  it("persists a user-owned configurable weekly schedule", () => {
    expect(router).toContain("saveDecisionReviewReminder: protectedProcedure");
    expect(router).toContain("createHeartbeatJob");
    expect(router).toContain("updateHeartbeatJob");
    expect(router).toContain("executiveDecisionReviewReminderSettings.userId, ctx.user.id");
  });

  it("authenticates the scheduled callback and sends only in the selected local time window", () => {
    expect(handlers).toContain("executiveDecisionReviewReminderHandler");
    expect(handlers).toContain("cronUser.isCron");
    expect(handlers).toContain("isLocalReminderTime");
    expect(handlers).toContain("recently-sent");
    expect(server).toContain("/api/scheduled/executiveDecisionReviewReminder");
  });
});
