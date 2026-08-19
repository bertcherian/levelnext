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

  it("retains role-gated admin visibility and computes active state through the shared primary item path", () => {
    expect((layoutSource.match(/user\?\.role === "admin"/g) ?? []).length).toBe(2);
    expect((layoutSource.match(/user\?\.role === "success_partner"/g) ?? []).length).toBe(2);
    expect(layoutSource).toContain("const isActive = isNavActive(item.href);");
    expect(layoutSource).toContain("<StandardNavItem item={item} isActive={isActive}");
  });
});
