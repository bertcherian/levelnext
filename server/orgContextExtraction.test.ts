import { describe, expect, it } from "vitest";
import { aboutPageUrl, buildExtractionSources, companyNameFromWebsiteMetadata, contextualFieldCount, normalizeExtractedOrgContext } from "./orgContextExtraction";

describe("Organisation Context extraction normalisation", () => {
  it("keeps only valid, bounded fields from a successful extraction payload", () => {
    expect(normalizeExtractedOrgContext({ companyName: " Park Controls ", strategicGoals: ["Modernise", "Modernise", ""], values: ["Safety", 42] })).toEqual({ companyName: "Park Controls", strategicGoals: ["Modernise"], values: ["Safety"] });
  });

  it("uses clear website metadata as a company-name fallback", () => {
    expect(companyNameFromWebsiteMetadata('<meta property="og:site_name" content="Park Controls"><title>Fallback title</title>')).toBe("Park Controls");
  });

  it("constructs a safe About-page fallback and records concise field provenance", () => {
    expect(aboutPageUrl("https://www.parkcontrols.com/services?x=1")).toBe("https://www.parkcontrols.com/about");
    const extracted = { mission: "Engineer safer systems", values: ["Safety"] };
    const sources = buildExtractionSources(extracted, "Park Controls exists to Engineer safer systems through Safety-first industrial controls.", "https://www.parkcontrols.com/about");
    expect(contextualFieldCount(extracted)).toBe(2);
    expect(sources.mission).toMatchObject({ sourceUrl: "https://www.parkcontrols.com/about" });
    expect(sources.values?.snippet).toContain("Safety");
  });
});
