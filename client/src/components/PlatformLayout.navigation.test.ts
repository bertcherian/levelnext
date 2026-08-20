import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const layoutSource = readFileSync(resolve(process.cwd(), "client/src/components/PlatformLayout.tsx"), "utf8");
const navigationSource = readFileSync(resolve(process.cwd(), "client/src/components/platformNavigation.ts"), "utf8");

describe("PlatformLayout navigation composition", () => {
  it("uses one typed navigation source for Career and Manager sidebar projections", () => {
    expect(layoutSource).toContain('from "@/components/platformNavigation"');
    expect(navigationSource).toContain("export const CI_NAV_ITEMS");
    expect(navigationSource).toContain("export const MEP_NAV_ITEMS");
    expect(navigationSource).toContain("export type PlatformNavItem");
  });

  it("uses the same primary renderer for mobile and desktop while retaining the distinct bottom-tab projection", () => {
    expect((layoutSource.match(/<ProductNavigationItems/g) ?? []).length).toBe(2);
    expect(layoutSource).toContain("LEADER_BOTTOM_TABS.map");
    expect(layoutSource).toContain("compact={false}");
    expect(layoutSource).toContain("compact");
  });

  it("retains role-gated visibility and routes admin and Success Partner projections through the shared renderer", () => {
    expect((layoutSource.match(/user\?\.role === "admin"/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect((layoutSource.match(/user\?\.role === "success_partner"/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect(layoutSource).toContain("const ADMIN_NAV_ITEMS");
    expect(layoutSource).toContain("const SUCCESS_PARTNER_NAV_ITEMS");
    expect((layoutSource.match(/<RoleNavigationSection/g) ?? []).length).toBe(2);
    expect(layoutSource).toContain('onNavigate={() => setSidebarOpen(false)}');
    expect(layoutSource).toContain("const isActive = isNavActive(item.href);");
    expect(layoutSource).toContain("<StandardNavItem item={item} isActive={isActive}");
  });
});
