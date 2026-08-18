import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/mep/ManagerHome.tsx"), "utf8");

describe("Manager dashboard AI reliability", () => {
  it("normalises the daily brief before rendering and exposes a surface-specific feedback action", () => {
    expect(source).toContain("normalizeAiData(todayBrief ?? undefined)");
    expect(source).toContain('surface="manager_daily_brief"');
    expect(source).toContain('suggestionKind="daily_focus"');
  });
});
