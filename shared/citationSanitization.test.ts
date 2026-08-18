import { describe, expect, it } from "vitest";
import { sanitizeDailyBriefCitations, sanitizeDevelopmentSuggestion, stripCitationMarkup } from "./citationSanitization";

describe("citation sanitisation", () => {
  it("removes literal and HTML-escaped cite wrappers while preserving the recommendation text", () => {
    expect(stripCitationMarkup('<cite index="10-1">AI fluency</cite>')).toBe("AI fluency");
    expect(stripCitationMarkup('&lt;cite index="1-24"&gt;Evidence&lt;/cite&gt;')).toBe("Evidence");
  });

  it("sanitises every visible field in a development suggestion", () => {
    expect(sanitizeDevelopmentSuggestion({
      topic: '<cite index="10-1">AI fluency</cite>',
      why: '<cite index="1-24">Digital fluency matters.</cite>',
      action: "Explore one relevant tool.",
    })).toEqual({
      topic: "AI fluency",
      why: "Digital fluency matters.",
      action: "Explore one relevant tool.",
    });
  });

  it("preserves the rest of a daily brief while cleaning its development suggestion", () => {
    expect(sanitizeDailyBriefCitations({ greeting: "Good morning", developmentSuggestion: { topic: "<cite>Focus</cite>", why: "Why", action: "Act" } })).toEqual({ greeting: "Good morning", developmentSuggestion: { topic: "Focus", why: "Why", action: "Act" } });
  });
});
