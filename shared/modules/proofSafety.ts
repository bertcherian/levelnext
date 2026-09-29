export function safePracticeWarnings(value: string): string[] {
  const warnings: string[] = [];
  if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(value)) warnings.push("This may contain a person’s name.");
  if (/\b(?:\+?\d[\d\s().-]{7,}\d)\b/.test(value)) warnings.push("This may contain a phone number.");
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value)) warnings.push("This may contain an email address.");
  if (/(?:₹|\$|€|£)\s?\d[\d,.]*|\b\d{5,}\b/.test(value)) warnings.push("This may contain a financial figure or account identifier.");
  return warnings;
}

export function anonymisePracticeText(value: string): string {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email removed]")
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "[phone removed]")
    .replace(/(?:₹|\$|€|£)\s?\d[\d,.]*/g, "[amount removed]")
    .replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, "Person A");
}
