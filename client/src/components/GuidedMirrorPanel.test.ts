import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Guided Mirror panel", () => {
  const source = readFileSync("client/src/components/GuidedMirrorPanel.tsx", "utf8");
  const guide = readFileSync("client/src/pages/Guide.tsx", "utf8");
  it("creates private mirror analysis and supports relevance plus experiment feedback", () => {
    expect(source).toContain("createGuidedMirror.useMutation");
    expect(source).toContain("rateGuidedMirror.useMutation");
    expect(source).toContain("updateGuidedMirrorExperiment.useMutation");
    expect(source).toContain("Private to you");
    expect(source).toContain("Was this useful?");
    expect(source).toContain("Why Guide chose this lens");
    expect(source).toContain("getDistinction(analysis?.ontology?.primaryDistinctionId)");
    expect(source).toContain("Reminder timezone");
  });

  it("does not block the Guide home and Guided Mirror behind conversation history loading", () => {
    expect(guide).toContain("if (loading) {");
    expect(guide).not.toContain("if (loading || convLoading) {");
  });
});
