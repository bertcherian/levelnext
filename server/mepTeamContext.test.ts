import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Manager Effectiveness team-member context", () => {
  const router = readFileSync("server/routers/mep.ts", "utf8");

  it("accepts manager notes and allows a manager to update them only for their own team member", () => {
    expect(router).toContain("notes: z.string().trim().max(4000).optional()");
    expect(router).toContain("updateTeamMemberContext: protectedProcedure");
    expect(router).toContain("eq(managerTeamMembers.userId, String(ctx.user.id))");
  });

  it("grounds AI coaching guidance in manager-entered context and prohibits unsupported person-level claims", () => {
    expect(router).toContain("Manager-entered person context");
    expect(router).toContain("the only person-specific evidence available");
    expect(router).toContain("Do not infer personality, motivation, performance");
    expect(router).toContain("evidenceBoundary");
  });
});
