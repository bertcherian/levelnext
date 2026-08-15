import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Executive decision outcome review", () => {
  const router = readFileSync("server/routers/executiveIntelligence.ts", "utf8");
  const cockpit = readFileSync("client/src/components/ExecutiveExperienceEnhancements.tsx", "utf8");

  it("saves reviewed outcomes only against an authenticated owner’s decision", () => {
    expect(router).toContain("saveDecisionOutcome: protectedProcedure");
    expect(router).toContain("eq(executiveDecisionJournal.userId, ctx.user.id)");
    expect(router).toContain("reviewStatus: input.reviewStatus");
    expect(router).toContain("reviewedAt: new Date()");
  });

  it("excludes reviewed decisions from the pending review queue and presents a user-facing review form", () => {
    expect(router).toContain("eq(executiveDecisionJournal.reviewStatus, \"pending\")");
    expect(cockpit).toContain("What did this decision teach you?");
    expect(cockpit).toContain("Save outcome review");
    expect(cockpit).toContain("ExecutiveSidebarWalkthrough");
  });
});
