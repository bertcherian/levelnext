import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Executive Intelligence protected workflow", () => {
  const source = readFileSync("server/routers/executiveIntelligence.ts", "utf8");

  it("exposes private context, mandate, thinking, and decision workflows through protected procedures", () => {
    expect(source).toContain("getWorkspace: protectedProcedure");
    expect(source).toContain("saveContext: protectedProcedure");
    expect(source).toContain("saveMandate: protectedProcedure");
    expect(source).toContain("thinkWithMe: protectedProcedure");
    expect(source).toContain("createDecision: protectedProcedure");
    expect(source).toContain("mode: z.enum([\"prepare\", \"think\", \"challenge\", \"debrief\"])");
  });

  it("scopes all executive records to the authenticated user rather than a sponsor or organisation", () => {
    expect(source).toContain("eq(executiveProfiles.userId, ctx.user.id)");
    expect(source).toContain("eq(executiveMandates.userId, ctx.user.id)");
    expect(source).toContain("eq(executiveDecisionJournal.userId, ctx.user.id)");
    expect(source).toContain("userId: ctx.user.id");
    expect(source).toContain("stakeholderSummary");
  });
});
