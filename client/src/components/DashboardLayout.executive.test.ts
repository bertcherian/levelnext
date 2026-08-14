import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Executive Intelligence navigation", () => {
  it("makes the executive cockpit available from the authenticated LevelNext workspace", () => {
    const source = readFileSync("client/src/components/DashboardLayout.tsx", "utf8");
    expect(source).toContain('label: "Executive Intelligence", path: "/executive"');
    expect(source).toContain("Landmark");
  });
});
