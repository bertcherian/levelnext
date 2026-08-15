import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Team Intelligence context templates", () => {
  const source = readFileSync("client/src/pages/mep/TeamIntelligence.tsx", "utf8");

  it("offers practical manager note templates in both team-member context entry points", () => {
    expect(source).toContain("CONTEXT_TEMPLATES");
    expect(source).toContain("Current priorities");
    expect(source).toContain("Strengths to build");
    expect(source).toContain("Change or concern");
    expect(source).toContain("1:1 preparation");
    expect(source).toContain("insertTemplate(template.text, \"new\")");
    expect(source).toContain("insertTemplate(template.text, \"member\")");
  });
});
