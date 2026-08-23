import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./ManagerDiagnostics.tsx", import.meta.url), "utf8");

describe("ManagerDiagnostics history safety", () => {
  it("does not dereference the first result until a most-recent result is available", () => {
    expect(source).toContain("getMostRecentMepDiagnostic(sortedResults)");
    expect(source).toContain("sortedResults.length > 0 && mostRecentResult");
    expect(source).toContain("formatDate(mostRecentResult.completedAt)");
  });
});
