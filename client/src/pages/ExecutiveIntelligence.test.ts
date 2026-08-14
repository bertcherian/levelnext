import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Executive Intelligence cockpit", () => {
  const source = readFileSync("client/src/pages/ExecutiveIntelligence.tsx", "utf8");
  it("centres the experience on context, mandate, attention, thinking, and decisions", () => {
    expect(source).toContain("Executive Context Map");
    expect(source).toContain("Run. Transform. Build.");
    expect(source).toContain("Think with me");
    expect(source).toContain("Decision journal");
    expect(source).toContain("Private executive space");
    expect(source).toContain("Stakeholder context");
    expect(source).toContain("Scope of responsibility");
  });
  it("uses the protected Executive Intelligence procedures rather than client-side decision logic", () => {
    expect(source).toContain("executiveIntelligence.getWorkspace");
    expect(source).toContain("executiveIntelligence.thinkWithMe");
    expect(source).toContain("executiveIntelligence.createDecision");
    expect(source).toContain("mode: executiveAction");
    expect(source).toContain("Prepare the conversation");
    expect(source).toContain("Debrief the event");
  });
});
