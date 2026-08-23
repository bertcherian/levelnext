import { describe, expect, it } from "vitest";
import { getMostRecentMepDiagnostic } from "./mepDiagnosticHistory";

describe("getMostRecentMepDiagnostic", () => {
  it("returns null for an empty first-load history instead of dereferencing index zero", () => {
    expect(getMostRecentMepDiagnostic([])).toBeNull();
    expect(getMostRecentMepDiagnostic(null)).toBeNull();
  });

  it("returns the latest element when history is populated", () => {
    expect(getMostRecentMepDiagnostic([{ id: "latest" }, { id: "prior" }])).toEqual({ id: "latest" });
  });
});
