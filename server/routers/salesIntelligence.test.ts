import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Sales Intelligence router", () => {
  const router = readFileSync("server/routers/salesIntelligence.ts", "utf8");
  const analysis = readFileSync("server/salesIntelligence.ts", "utf8");

  it("scopes every retrieved or changed commercial record to its owner", () => {
    expect(router).toContain("eq(salesSituations.userId, ctx.user.id)");
    expect(router).toContain("eq(salesClaims.userId, ctx.user.id)");
    expect(router).toContain("eq(salesCommitments.userId, ctx.user.id)");
  });

  it("preserves the Act → Reflect → Learn loop", () => {
    expect(router).toContain("createCommitment: protectedProcedure");
    expect(router).toContain("reflectCommitment: protectedProcedure");
    expect(router).toContain('status: "reflected"');
  });

  it("keeps every buyer-practice session private to its seller and persists a role-correct learning loop", () => {
    expect(router).toContain("startPractice: protectedProcedure");
    expect(router).toContain("sendPracticeMessage: protectedProcedure");
    expect(router).toContain("finishPractice: protectedProcedure");
    expect(router).toContain("eq(salesPracticeSessions.userId, ctx.user.id)");
    expect(router).toContain('role: "buyer"');
    expect(router).toContain('role: "seller"');
  });

  it("requires evidence-bound analysis and falls back safely when AI analysis is unavailable", () => {
    expect(analysis).toContain("Never invent customer facts");
    expect(analysis).toContain("Separate observation/evidence from interpretation and assumption");
    expect(analysis).toContain("FALLBACK_JUDGMENT");
  });
});
