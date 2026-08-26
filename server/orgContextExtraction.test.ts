import { describe, expect, it } from "vitest";
import { companyNameFromWebsiteMetadata, normalizeExtractedOrgContext } from "./orgContextExtraction";

describe("Organisation Context extraction normalisation", () => {
  it("keeps only valid, bounded fields from a successful extraction payload", () => {
    expect(normalizeExtractedOrgContext({ companyName: " Park Controls ", strategicGoals: ["Modernise", "Modernise", ""], values: ["Safety", 42] })).toEqual({ companyName: "Park Controls", strategicGoals: ["Modernise"], values: ["Safety"] });
  });

  it("uses clear website metadata as a company-name fallback", () => {
    expect(companyNameFromWebsiteMetadata('<meta property="og:site_name" content="Park Controls"><title>Fallback title</title>')).toBe("Park Controls");
  });
});
