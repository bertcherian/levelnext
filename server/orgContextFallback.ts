import { contextualFieldCount, organisationFallbackPages, type ExtractedOrgContext, type ExtractionSources } from "./orgContextExtraction";

export type AnalysedOrganisationPage = {
  plainText: string;
  extracted: ExtractedOrgContext;
  extractionSources: ExtractionSources;
};

export type FallbackAttempt = { key: string; label: string; url: string; available: boolean; contributed: boolean };

/**
 * Add same-origin organisation-context fallbacks only while the accumulated
 * evidence remains thin. Failed pages never prevent the next candidate.
 */
export async function enrichWithOrganisationFallbacks(args: {
  websiteUrl: string;
  initial: AnalysedOrganisationPage;
  forceFallback?: boolean;
  analyseCandidate: (url: string) => Promise<AnalysedOrganisationPage>;
}) {
  let extracted = args.initial.extracted;
  let extractionSources = args.initial.extractionSources;
  let rawScrapedText = args.initial.plainText;
  const fallbackPagesTried: FallbackAttempt[] = [];

  if (args.forceFallback || contextualFieldCount(extracted) < 2) {
    for (const candidate of organisationFallbackPages(args.websiteUrl)) {
      if (contextualFieldCount(extracted) >= 2) break;
      try {
        const page = await args.analyseCandidate(candidate.url);
        const contributed = contextualFieldCount(page.extracted) > 0;
        fallbackPagesTried.push({ ...candidate, available: true, contributed });
        if (contributed) {
          extracted = { ...extracted, ...page.extracted };
          extractionSources = { ...extractionSources, ...page.extractionSources };
          rawScrapedText = `${rawScrapedText}\n\n${candidate.label}: ${page.plainText}`.slice(0, 12000);
        }
      } catch {
        fallbackPagesTried.push({ ...candidate, available: false, contributed: false });
      }
    }
  }

  return {
    extracted,
    extractionSources,
    rawScrapedText,
    fallbackPagesTried,
    usedFallback: fallbackPagesTried.some((page) => page.contributed),
    usedAboutFallback: fallbackPagesTried.some((page) => page.key === "about" && page.contributed),
  };
}
