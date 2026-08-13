import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Coach Portal aggregate trend controls", () => {
  const source = readFileSync("client/src/pages/CoachPortal.tsx", "utf8");
  it("requests selectable 30- and 90-day aggregate-only comparisons and renders only returned trend rows", () => {
    expect(source).toContain("const [trendPeriodDays, setTrendPeriodDays] = useState<30 | 90>(30)");
    expect(source).toContain("getCoachGuidedMirrorThemes.useQuery({ periodDays: trendPeriodDays }");
    expect(source).toContain("([30, 90] as const)");
    expect(source).toContain("guidedMirrorThemes.trends?.map");
    expect(source).toContain("five-signal threshold in both periods");
  });
});
