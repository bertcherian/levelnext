export type ReviewedEvaluationCsvRecord = {
  id: number;
  createdAt: Date;
  status: "completed" | "partial";
  systemPrompt: string;
  userPrompt: string;
  claudeModel: string;
  claudeLatencyMs: number | null;
  claudeUsage: { promptTokens: number | null; completionTokens: number | null; totalTokens: number | null } | null;
  qwenModel: string;
  qwenLatencyMs: number | null;
  qwenUsage: { promptTokens: number | null; completionTokens: number | null; totalTokens: number | null } | null;
  preferredModel: "claude" | "qwen" | "tie" | "neither" | null;
  reviewScores: { clarity: number; usefulness: number; leadershipTone: number } | null;
  reviewerNote: string | null;
  reviewedAt: Date | null;
};

function csvCell(value: string | number | null | undefined) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function reviewedEvaluationsToCsv(records: ReviewedEvaluationCsvRecord[]) {
  const header = [
    "Evaluation ID", "Created at", "Status", "System prompt", "Test prompt",
    "Claude model", "Claude latency (ms)", "Claude input tokens", "Claude output tokens", "Claude total tokens",
    "Qwen model", "Qwen latency (ms)", "Qwen input tokens", "Qwen output tokens", "Qwen total tokens",
    "Preferred model", "Clarity", "Usefulness", "Leadership tone", "Reviewer note", "Reviewed at",
  ];
  const rows = records.map((record) => [
    record.id, record.createdAt.toISOString(), record.status, record.systemPrompt, record.userPrompt,
    record.claudeModel, record.claudeLatencyMs, record.claudeUsage?.promptTokens, record.claudeUsage?.completionTokens, record.claudeUsage?.totalTokens,
    record.qwenModel, record.qwenLatencyMs, record.qwenUsage?.promptTokens, record.qwenUsage?.completionTokens, record.qwenUsage?.totalTokens,
    record.preferredModel, record.reviewScores?.clarity, record.reviewScores?.usefulness, record.reviewScores?.leadershipTone, record.reviewerNote, record.reviewedAt?.toISOString(),
  ].map(csvCell).join(","));
  return `\uFEFF${header.map(csvCell).join(",")}\n${rows.join("\n")}`;
}
