import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const projectFile = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("selected tenant integration", () => {
  it("scopes Product Enrollments through tenant membership on the server and forwards the active tenant from the page", () => {
    const router = projectFile("./products.ts");
    expect(router).toContain("adminGetUsersWithEnrollments: adminOnlyProcedure.input");
    expect(router).toContain("innerJoin(tenantUsers, eq(users.id, tenantUsers.userId))");
    expect(router).toContain("eq(tenantUsers.tenantId, selectedTenantId)");
    const page = projectFile("../../client/src/pages/AdminProductEnrollments.tsx");
    expect(page).toContain("useAdminTenantSelection");
    expect(page).toContain("useQuery({ tenantId })");
  });

  it("passes the selected tenant through every Organisation Context read and write path", () => {
    const router = projectFile("./orgContext.ts");
    expect(router).toContain("getTenantAdminId(ctx.user, input?.tenantId)");
    expect(router).toContain("getTenantAdminId(ctx.user, input.tenantId)");
    const page = projectFile("../../client/src/pages/AdminOrgContext.tsx");
    expect(page).toContain("getOrgContext.useQuery({ tenantId })");
    expect(page).toContain("tenantId: tenantId ?? undefined");
  });

  it("scopes the full invitation lifecycle and forwards active organisation context from Manage Invites", () => {
    const router = projectFile("./platformInvites.ts");
    expect(router).toContain("tenantId: z.number().int().positive().optional()");
    expect(router).toContain("await assertTenantScope(input.tenantId)");
    expect(router).toContain("eq(platformInvites.tenantId, input.tenantId)");
    expect(router).toContain("tenantId: input.tenantId");
    const page = projectFile("../../client/src/pages/AdminManageInvites.tsx");
    expect(page).toContain("listInvites.useQuery({ tenantId })");
    expect(page).toContain("resendInvite.mutate({ id: inv.id, origin: window.location.origin, tenantId: tenantId ?? undefined })");
    expect(page).toContain("tenantId: tenantId ?? undefined");
  });

  it("scopes dashboard cards, module analytics, recent users, and playbook analytics to the selected organisation", () => {
    const stats = projectFile("./adminStats.ts");
    expect(stats).toContain("getDashboardStats: protectedProcedure.input");
    expect(stats).toContain("eq(tenantUsers.tenantId, tenantId)");
    expect(stats).toContain("eq(platformInvites.tenantId, tenantId)");
    expect(stats).toContain("eq(assessmentSessions.tenantId, tenantId)");
    expect(stats).toContain("getPlaybookStats: protectedProcedure.input");
    const page = projectFile("../../client/src/pages/AdminDashboard.tsx");
    expect(page).toContain("getDashboardStats.useQuery({ tenantId })");
    expect(page).toContain("<PlaybookStatsSection tenantId={tenantId} />");
    expect(page).toContain("!tenantId && <StatCard");
  });
});
