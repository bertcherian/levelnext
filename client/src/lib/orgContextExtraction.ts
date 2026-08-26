export type WebsiteExtraction = {
  companyName?: string;
  mission?: string;
  vision?: string;
  northStar?: string;
  strategicGoals?: string[];
  values?: string[];
};

export type WebsiteExtractionSources = Partial<Record<keyof WebsiteExtraction, { snippet: string; sourceUrl: string }>>;

export type OrgContextFormValues = Required<Omit<WebsiteExtraction, "strategicGoals" | "values">> & {
  strategicGoals: string[];
  values: string[];
};

const hasText = (value: string | undefined) => Boolean(value?.trim());
const hasItems = (value: string[] | undefined) => Boolean(value?.some((item) => item.trim()));

/** Prefer existing in-progress form values so scrape output never erases an admin's work. */
export function mergeWebsiteExtraction(current: OrgContextFormValues, extracted: WebsiteExtraction): OrgContextFormValues {
  return {
    companyName: hasText(current.companyName) ? current.companyName : extracted.companyName ?? "",
    mission: hasText(current.mission) ? current.mission : extracted.mission ?? "",
    vision: hasText(current.vision) ? current.vision : extracted.vision ?? "",
    northStar: hasText(current.northStar) ? current.northStar : extracted.northStar ?? "",
    strategicGoals: hasItems(current.strategicGoals) ? current.strategicGoals : extracted.strategicGoals?.length ? extracted.strategicGoals : current.strategicGoals,
    values: hasItems(current.values) ? current.values : extracted.values?.length ? extracted.values : current.values,
  };
}

export function populatedExtractionFieldCount(extracted: WebsiteExtraction) {
  return [extracted.companyName, extracted.mission, extracted.vision, extracted.northStar, extracted.strategicGoals?.length, extracted.values?.length].filter(Boolean).length;
}

/** Accept a copy-pasted domain such as www.parkcontrols.com as a safe HTTPS URL. */
export function normaliseWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}
