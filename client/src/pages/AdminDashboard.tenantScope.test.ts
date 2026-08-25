import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./AdminDashboard.tsx", import.meta.url), "utf8");

describe("AdminDashboard tenant-scoped presentation", () => {
  it("suppresses global-only pilot panels and quick links when an organisation is active", () => {
    expect(source).toContain("!tenantId && <div");
    expect(source).toContain('filter((link) => !tenantId || link.href !== "/admin/pilot-applications")');
    expect(source).toContain("getDashboardStats.useQuery({ tenantId })");
  });
});
