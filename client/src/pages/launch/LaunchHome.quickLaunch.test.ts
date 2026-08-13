import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Launch Home Quick Launch", () => {
  it("uses high-contrast black labels and large Lucide icon tiles", () => {
    const source = readFileSync("client/src/pages/launch/LaunchHome.tsx", "utf8");

    expect(source).toContain('color: "#000000"');
    expect(source).toContain('border: "2px solid #000000"');
    expect(source).toContain("<Icon size={31} strokeWidth={2.4} />");
    expect(source).toContain("icon: Map");
    expect(source).toContain("icon: Mic2");
    expect(source).toContain("icon: FileText");
    expect(source).toContain("icon: Banknote");
    expect(source).toContain("icon: ClipboardList");
    expect(source).toContain("icon: Zap");
  });
});
