import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/CareerAccess.tsx"), "utf8");

describe("Career dashboard AI reliability", () => {
  it("normalises Chief-of-Staff and weekly-report text and exposes feedback on both AI surfaces", () => {
    expect(source).toContain("normalizeAiData(rawBrief)");
    expect(source).toContain("normalizeAiText(data.narrative)");
    expect(source).toContain('surface="career_chief_of_staff"');
    expect(source).toContain('surface="career_weekly_report"');
  });
});
