import { describe, expect, it } from "vitest";
import { createDecisionJournalCsv } from "./decisionJournalExport";

describe("createDecisionJournalCsv", () => {
  it("exports private decision records with quoted fields and review dates", () => {
    const csv = createDecisionJournalCsv([{
      id: 1,
      decision: "Choose the \"focus\" market",
      context: "A strategic choice",
      assumptions: ["Demand is resilient"],
      options: ["Expand", "Hold"],
      reviewDate: "2026-09-01T00:00:00.000Z",
      createdAt: "2026-08-14T00:00:00.000Z",
    }]);
    expect(csv).toContain('"Decision"');
    expect(csv).toContain('"Choose the ""focus"" market"');
    expect(csv).toContain('"2026-09-01"');
    expect(csv).toContain('"Demand is resilient"');
  });
});
