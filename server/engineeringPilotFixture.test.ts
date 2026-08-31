import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../scripts/seed-engineering-pilot-walkthrough.mjs", import.meta.url), "utf8");

describe("Engineering pilot walkthrough fixture", () => {
  it("requires a non-production .test participant email and rollback-safe verification", () => {
    expect(source).toContain('participantEmail.endsWith(".test")');
    expect(source).toContain("await connection.beginTransaction()");
    expect(source).toContain("await connection.rollback()");
    expect(source).toContain("ENGINEERING_PILOT_DRY_RUN");
    expect(source).toContain("ei_partner_assignments");
  });
});
