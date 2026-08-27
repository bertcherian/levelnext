export type ExtractedOrgContext = {
  companyName?: string;
  mission?: string;
  vision?: string;
  northStar?: string;
  strategicGoals?: string[];
  values?: string[];
};

export type ExtractionSources = Partial<Record<keyof ExtractedOrgContext, { snippet: string; sourceUrl: string }>>;

const text = (value: unknown, max = 5000) => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

const stringList = (value: unknown, maxItems: number, maxLength: number) => {
  if (!Array.isArray(value)) return undefined;
  const items = value.map((item) => text(item, maxLength)).filter((item): item is string => Boolean(item));
  return items.length ? Array.from(new Set(items)).slice(0, maxItems) : undefined;
};

/** Normalise a model payload before it reaches the tenant context or client form. */
export function normalizeExtractedOrgContext(value: unknown): ExtractedOrgContext {
  const candidate = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    ...(text(candidate.companyName, 255) ? { companyName: text(candidate.companyName, 255) } : {}),
    ...(text(candidate.mission) ? { mission: text(candidate.mission) } : {}),
    ...(text(candidate.vision) ? { vision: text(candidate.vision) } : {}),
    ...(text(candidate.northStar) ? { northStar: text(candidate.northStar) } : {}),
    ...(stringList(candidate.strategicGoals, 10, 500) ? { strategicGoals: stringList(candidate.strategicGoals, 10, 500) } : {}),
    ...(stringList(candidate.values, 15, 200) ? { values: stringList(candidate.values, 15, 200) } : {}),
  };
}

/** Use unambiguous page metadata as a company-name fallback when the model omits it. */
export function companyNameFromWebsiteMetadata(html: string): string | undefined {
  const siteName = html.match(/<meta[^>]+(?:property|name)=["'](?:og:site_name|application-name)["'][^>]+content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:site_name|application-name)["']/i)?.[1]
    ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (!siteName) return undefined;
  const cleaned = siteName.replace(/\s*[|–—-]\s*(home|official website|welcome).*$/i, "").trim();
  return cleaned && cleaned.length <= 255 ? cleaned : undefined;
}

export type ExtractionFallbackPage = { key: "about" | "our-story" | "values"; label: string; url: string };

/** Return same-origin, de-duplicated context pages in a deliberate fallback order. */
export function organisationFallbackPages(websiteUrl: string): ExtractionFallbackPage[] {
  const requested = new URL(websiteUrl);
  const requestedPath = requested.pathname.replace(/\/+$/, "") || "/";
  const candidates: Array<Pick<ExtractionFallbackPage, "key" | "label"> & { path: string }> = [
    { key: "about", label: "About page", path: "/about" },
    { key: "our-story", label: "Our Story page", path: "/our-story" },
    { key: "values", label: "Values page", path: "/values" },
  ];

  return candidates
    .filter((candidate) => candidate.path !== requestedPath)
    .map((candidate) => {
      const pageUrl = new URL(websiteUrl);
      pageUrl.pathname = candidate.path;
      pageUrl.search = "";
      pageUrl.hash = "";
      return { key: candidate.key, label: candidate.label, url: pageUrl.toString() };
    });
}

export function aboutPageUrl(websiteUrl: string) {
  const url = new URL(websiteUrl);
  url.pathname = "/about";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function contextualFieldCount(extracted: ExtractedOrgContext) {
  return [extracted.mission, extracted.vision, extracted.northStar, extracted.strategicGoals?.length, extracted.values?.length].filter(Boolean).length;
}

function sourceSnippet(text: string, terms: string[]) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const hit = terms.map((term) => normalized.toLowerCase().indexOf(term.toLowerCase())).find((index) => index >= 0) ?? -1;
  const start = Math.max(0, hit - 86);
  const end = Math.min(normalized.length, (hit >= 0 ? hit : 0) + 214);
  return normalized.slice(start, end).trim().replace(/^\S*\s/, "").slice(0, 250);
}

export function buildExtractionSources(extracted: ExtractedOrgContext, pageText: string, sourceUrl: string): ExtractionSources {
  const source: ExtractionSources = {};
  const add = (key: keyof ExtractedOrgContext, terms: string[]) => {
    if (!terms.length) return;
    const snippet = sourceSnippet(pageText, terms);
    if (snippet) source[key] = { snippet, sourceUrl };
  };
  if (extracted.companyName) add("companyName", [extracted.companyName]);
  if (extracted.mission) add("mission", [extracted.mission]);
  if (extracted.vision) add("vision", [extracted.vision]);
  if (extracted.northStar) add("northStar", [extracted.northStar]);
  if (extracted.strategicGoals?.length) add("strategicGoals", extracted.strategicGoals);
  if (extracted.values?.length) add("values", extracted.values);
  return source;
}
