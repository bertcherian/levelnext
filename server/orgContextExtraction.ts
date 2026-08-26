export type ExtractedOrgContext = {
  companyName?: string;
  mission?: string;
  vision?: string;
  northStar?: string;
  strategicGoals?: string[];
  values?: string[];
};

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
