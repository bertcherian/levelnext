import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPersonaCoachSafeSummary, isPersonaCertificateEligible } from "./personaBuilder";

describe("Persona Builder consent, certificate, and reminder enhancements", () => {
  it("builds a coach-safe summary without private reflection or completion-review text", () => {
    const privateReflection = "I froze when challenged and felt embarrassed.";
    const privateCompletionText = "I still worry about the VP's reaction.";
    const summary = buildPersonaCoachSafeSummary({
      journey: { id: 42, currentStage: "completed", startedAt: new Date("2026-09-01T00:00:00Z"), completedAt: new Date("2026-09-14T00:00:00Z"), targetEndAt: new Date("2026-09-15T00:00:00Z") },
      desiredOutcome: "Contribute a clear recommendation.",
      commitment: "Contribution over proving.",
      personaName: "The Contributor",
      days: [{ status: "complete", evidenceCount: 1, adaptation: { decision: "increase_difficulty" }, practiceSessionId: 8 }],
      completion: { overallShift: privateCompletionText, rating: 4, nextChoice: "retire_persona" },
    });
    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain(privateReflection);
    expect(serialized).not.toContain(privateCompletionText);
    expect(summary.completion).toEqual({ rating: 4, nextChoice: "retire_persona" });
    expect(summary.progress).toMatchObject({ completedDays: 1, evidenceCount: 1, practiceSessions: 1, simulatorSessions: 0 });
  });

  it("requires a completed Day 14 and a valid review rating before certificate issuance", () => {
    expect(isPersonaCertificateEligible({ day14Complete: true, reviewRating: 5 })).toBe(true);
    expect(isPersonaCertificateEligible({ day14Complete: false, reviewRating: 5 })).toBe(false);
    expect(isPersonaCertificateEligible({ day14Complete: true, reviewRating: null })).toBe(false);
    expect(isPersonaCertificateEligible({ day14Complete: true, reviewRating: 6 })).toBe(false);
  });

  it("keeps the coach view and daily reminder endpoint explicitly privacy and cron bounded", () => {
    const coachPage = readFileSync("client/src/pages/PersonaCoachSummary.tsx", "utf8");
    const personaContract = readFileSync("shared/modules/personaBuilder.ts", "utf8");
    const scheduledHandlers = readFileSync("server/scheduledHandlers.ts", "utf8");
    const serverIndex = readFileSync("server/_core/index.ts", "utf8");
    expect(personaContract).toContain("Private episodes, check-in reflections");
    expect(coachPage).not.toContain("summary.completion.overallShift");
    expect(scheduledHandlers).toContain("cron-only");
    expect(scheduledHandlers).toContain("already-sent-today");
    expect(serverIndex).toContain('/api/scheduled/personaBuilderReminder');
  });
});
