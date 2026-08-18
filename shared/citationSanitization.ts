export type DevelopmentSuggestionText = {
  topic?: unknown;
  why?: unknown;
  action?: unknown;
};

export function stripCitationMarkup(value: unknown): string {
  return normalizeAiText(value);
}

/** Removes presentation markup and normalises whitespace from AI-facing copy. */
export function normalizeAiText(value: unknown): string {
  if (typeof value !== "string") return "";
  const decoded = value
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
  return decoded
    .replace(/<\/?\s*(?:cite|citation|source|ref|reference)\b[^>]*>/gi, "")
    .replace(/<[^>]{1,240}>/g, "")
    .replace(/\[(?:cite|citation|source|ref|reference)(?:\s|:)[^\]]*\]/gi, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Recursively normalises JSON-shaped AI output before persistence or rendering. */
export function normalizeAiData<T>(value: T): T {
  if (typeof value === "string") return normalizeAiText(value) as T;
  if (Array.isArray(value)) return value.map((item) => normalizeAiData(item)) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalizeAiData(item)])) as T;
  }
  return value;
}

export function sanitizeDevelopmentSuggestion(suggestion: DevelopmentSuggestionText | null | undefined) {
  if (!suggestion || typeof suggestion !== "object") return null;
  return {
    ...suggestion,
    topic: stripCitationMarkup(suggestion.topic),
    why: stripCitationMarkup(suggestion.why),
    action: stripCitationMarkup(suggestion.action),
  };
}

export function sanitizeDailyBriefCitations<T extends Record<string, any>>(brief: T): T {
  if (!brief || typeof brief !== "object") return brief;
  return normalizeAiData(brief);
}
