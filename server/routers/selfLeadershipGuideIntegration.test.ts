import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Self-Leadership Intelligence cross-application wiring", () => {
  it("exposes private structured analysis through Intelligence Core", () => {
    const source = readFileSync("server/routers/intelligenceCore.ts", "utf8");
    expect(source).toContain("getSelfLeadershipExample: protectedProcedure.query");
    expect(source).toContain("analyzeSelfLeadership: protectedProcedure");
    expect(source).toContain("createGuidedMirror: protectedProcedure");
    expect(source).toContain("rateGuidedMirror: protectedProcedure");
    expect(source).toContain("getSelfLeadershipProgress: protectedProcedure.query");
    expect(source).toContain("eq(icSelfLeadershipMirrors.userId, ctx.user.id)");
    expect(source).toContain("private_development_coaching");
    expect(source).toContain("self_leadership_analysis_generated");
  });

  it("injects the shared directive into Guide, leadership coaching, and early-career coaching", () => {
    const guide = readFileSync("server/routers/guide.ts", "utf8");
    const leadershipCoach = readFileSync("server/routers/leadershipCoach.ts", "utf8");
    const earlyCareer = readFileSync("server/routers/earlyCareer.ts", "utf8");

    expect(guide).toContain("buildSelfLeadershipGuideDirective(selfLeadershipStage)");
    expect(leadershipCoach).toContain('buildSelfLeadershipGuideDirective("leader")');
    expect(earlyCareer).toContain('buildSelfLeadershipGuideDirective("early_career")');
  });
});
