export type ExportableDecision = {
  id: number;
  decision: string;
  context: string;
  assumptions?: string[] | null;
  options?: string[] | null;
  tradeOffs?: string | null;
  stakeholders?: string | null;
  expectedOutcome?: string | null;
  confidence?: number | null;
  reviewDate?: Date | string | null;
  createdAt: Date | string;
};

function escapeCsv(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function asDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export function createDecisionJournalCsv(decisions: ExportableDecision[]) {
  const headers = ["Recorded", "Review date", "Decision", "Context", "Assumptions", "Options", "Trade-offs", "Stakeholders", "Expected outcome", "Confidence"];
  const rows = decisions.map((entry) => [
    asDate(entry.createdAt),
    asDate(entry.reviewDate),
    entry.decision,
    entry.context,
    entry.assumptions?.join(" | ") ?? "",
    entry.options?.join(" | ") ?? "",
    entry.tradeOffs ?? "",
    entry.stakeholders ?? "",
    entry.expectedOutcome ?? "",
    entry.confidence ?? "",
  ].map(escapeCsv).join(","));
  return [headers.map(escapeCsv).join(","), ...rows].join("\n");
}

export function downloadDecisionJournal(decisions: ExportableDecision[]) {
  const blob = new Blob([createDecisionJournalCsv(decisions)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `levelnext-decision-journal-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
