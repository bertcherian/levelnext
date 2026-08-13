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

  it("provides concise descriptions through accessible tooltips for every action", () => {
    const source = readFileSync("client/src/pages/launch/LaunchHome.tsx", "utf8");

    expect(source).toContain("<TooltipTrigger asChild>");
    expect(source).toContain("<TooltipContent side=\"top\"");
    expect(source).toContain("View your career-launch mission path.");
    expect(source).toContain("Practise answers with guided interview feedback.");
    expect(source).toContain("Strengthen your résumé for target roles.");
    expect(source).toContain("Prepare a confident salary conversation.");
    expect(source).toContain("Track every application and its next step.");
    expect(source).toContain("Build job-ready skills through focused sprints.");
  });
});
