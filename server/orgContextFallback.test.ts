import { describe, expect, it } from "vitest";
import { enrichWithOrganisationFallbacks } from "./orgContextFallback";

const empty = { plainText: "Homepage menu only", extracted: {}, extractionSources: {} };

describe("Organisation Context fallbacks", () => {
  it("continues from an unavailable About page to a useful Our Story page", async () => {
    const result = await enrichWithOrganisationFallbacks({
      websiteUrl: "https://www.parkcontrols.com/",
      initial: empty,
      analyseCandidate: async (url) => {
        if (url.endsWith("/about")) throw new Error("HTTP 404");
        if (url.endsWith("/our-story")) return { plainText: "Our Story: reliable automation for safer operations.", extracted: { mission: "Reliable automation for safer operations.", values: ["Safety"] }, extractionSources: { mission: { snippet: "Our Story: reliable automation for safer operations.", sourceUrl: url } } };
        throw new Error("Should not request values after sufficient context");
      },
    });

    expect(result.extracted.mission).toContain("Reliable automation");
    expect(result.extractionSources.mission?.sourceUrl).toBe("https://www.parkcontrols.com/our-story");
    expect(result.fallbackPagesTried.map((page) => [page.key, page.available, page.contributed])).toEqual([["about", false, false], ["our-story", true, true]]);
  });

  it("records exhausted candidates without inventing contextual data", async () => {
    const result = await enrichWithOrganisationFallbacks({
      websiteUrl: "https://www.parkcontrols.com/",
      initial: empty,
      analyseCandidate: async () => { throw new Error("not available"); },
    });

    expect(result.extracted).toEqual({});
    expect(result.usedFallback).toBe(false);
    expect(result.fallbackPagesTried).toHaveLength(3);
    expect(result.fallbackPagesTried.every((page) => !page.available && !page.contributed)).toBe(true);
  });
});
