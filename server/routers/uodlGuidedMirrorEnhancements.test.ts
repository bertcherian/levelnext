import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("UODL and Guided Mirror enhancements", () => {
  const core = readFileSync("server/routers/intelligenceCore.ts", "utf8");
  const guide = readFileSync("client/src/components/GuidedMirrorPanel.tsx", "utf8");
  const coach = readFileSync("client/src/pages/CoachPortal.tsx", "utf8");
  const handler = readFileSync("server/scheduledHandlers.ts", "utf8");

  it("exposes reusable ontology analysis and persists its distinctions with private mirrors", () => {
    expect(core).toContain("analyzeOntology: protectedProcedure");
    expect(core).toContain("ontologyPrimaryDistinctionId");
    expect(core).toContain("createOntologyFallback");
  });

  it("accepts optional reasons only for not-yet relevance feedback and exposes a user reminder control", () => {
    expect(core).toContain("feedbackReason: z.enum");
    expect(guide).toContain("NOT_YET_REASONS");
    expect(guide).toContain("saveGuidedMirrorReminder.useMutation");
    expect(handler).toContain("guidedMirrorReminderHandler");
    expect(handler).toContain("decideGuidedMirrorReminder");
  });

  it("keeps coach themes consented, assigned, aggregated, and thresholded", () => {
    expect(core).toContain("getCoachGuidedMirrorThemes: protectedProcedure");
    expect(core).toContain("shareGuidedMirrorAggregateThemes");
    expect(core).toContain("cohortSize < 5");
    expect(coach).toContain("Consented Guided Mirror themes");
    expect(coach).toContain("No client names, situations, reflection text");
  });
});
