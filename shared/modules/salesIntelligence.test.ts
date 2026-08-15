import { describe, expect, it } from "vitest";
import { COMMERCIAL_CONSTRAINTS, SALES_CONFIDENCE_LEVELS, SALES_EVIDENCE_CATEGORIES } from "./salesIntelligence";

describe("Sales Intelligence commercial judgment vocabulary", () => {
  it("keeps evidence categories explicit instead of collapsing inference into fact", () => {
    expect(SALES_EVIDENCE_CATEGORIES).toEqual(["fact", "evidence", "interpretation", "assumption", "hope"]);
  });

  it("uses bounded confidence and recognises common commercial constraints", () => {
    expect(SALES_CONFIDENCE_LEVELS).toEqual(["low", "moderate", "high"]);
    expect(COMMERCIAL_CONSTRAINTS).toContain("Poor economic-buyer access");
    expect(COMMERCIAL_CONSTRAINTS).toContain("Weak customer commitment");
  });
});
