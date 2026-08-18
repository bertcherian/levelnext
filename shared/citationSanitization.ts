export type DevelopmentSuggestionText = {
  topic?: unknown;
  why?: unknown;
  action?: unknown;
};

export function stripCitationMarkup(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<\/?cite\b[^>]*>/gi, "")
    .replace(/&lt;\/?cite\b[^&]*?&gt;/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
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
  const developmentSuggestion = sanitizeDevelopmentSuggestion(brief.developmentSuggestion);
  return developmentSuggestion ? { ...brief, developmentSuggestion } : brief;
}
