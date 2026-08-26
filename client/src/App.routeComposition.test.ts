import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("product route composition", () => {
  it("wraps the Admin Dashboard lazy import with one-time stale-chunk recovery", () => {
    expect(appSource).toContain('const AdminDashboard = lazyWithRouteRecovery(() => import("@/pages/AdminDashboard"), "admin-dashboard")');
    const routePosition = appSource.indexOf('<Route path="/admin"');
    expect(routePosition).toBeGreaterThan(-1);
    expect(appSource.slice(routePosition, routePosition + 100)).toContain("component={AdminDashboard}");
  });

  it("uses shared wrappers for Manager and Early Career routes while retaining legacy paths", () => {
    expect(appSource).toContain("const withMepLayout");
    expect(appSource).toContain("const withEarlyCareerLayout");

    for (const route of ["/manager", "/manager/guide", "/manager/playbook", "/manager/brief", "/manager/commitments", "/manager/documents"]) {
      const routePosition = appSource.indexOf(`<Route path="${route}"`);
      expect(routePosition).toBeGreaterThan(-1);
      expect(appSource.slice(routePosition, routePosition + 150)).toContain("component={withMepLayout(");
    }

    for (const route of ["/early-career", "/early-career/diagnostic", "/early-career/guide", "/early-career/practice", "/early-career/hr", "/early-career/growth", "/early-career/manager"]) {
      const routePosition = appSource.indexOf(`<Route path="${route}"`);
      expect(routePosition).toBeGreaterThan(-1);
      expect(appSource.slice(routePosition, routePosition + 150)).toContain("component={withEarlyCareerLayout(");
    }
  });
});
