import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./DashboardLayout.tsx", import.meta.url), "utf8");

describe("DashboardLayout administration sidebar", () => {
  it("uses a dark LevelNext logo surface so transparent light logo marks remain legible", () => {
    expect(source).toContain('bg-[#0A1A2F]');
    expect(source).toContain('alt="LevelNext"');
  });

  it("keeps Settings in its own bordered row before the separately spaced Admin navigation", () => {
    expect(source).toContain('const settingsNavItem');
    expect(source).toContain('mx-2 mt-2 shrink-0 border-t');
    expect(source).toContain('mx-2 mt-3 border-t');
    expect(source.indexOf('settingsNavItem')).toBeLessThan(source.indexOf('Admin-only section'));
  });
});
