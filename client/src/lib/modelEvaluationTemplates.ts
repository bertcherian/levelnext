export type ModelEvaluationTemplate = {
  id: string;
  category: "Coaching" | "Report";
  title: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
};

export const MODEL_EVALUATION_TEMPLATES: ModelEvaluationTemplate[] = [
  {
    id: "coaching-difficult-conversation",
    category: "Coaching",
    title: "Difficult conversation",
    description: "Prepare a senior leader for a candid, respectful intervention.",
    systemPrompt: "You are an executive coach. Help the leader prepare a calm, direct, and respectful conversation. Give a short opening, two questions, a likely pushback, and an effective response. Avoid generic motivational language.",
    userPrompt: "Context (anonymised): [Describe the situation, stakeholder, tension, and desired outcome.]\n\nCreate a concise preparation plan for the conversation.",
    maxTokens: 700,
    temperature: 0.3,
  },
  {
    id: "coaching-executive-presence",
    category: "Coaching",
    title: "Executive presence",
    description: "Turn behavioural feedback into a focused practice plan.",
    systemPrompt: "You are an evidence-based leadership coach. Translate feedback into observable behaviours, a two-week practice experiment, and one reflection question. Be specific, practical, and non-judgmental.",
    userPrompt: "Feedback (anonymised): [Insert feedback and the leadership situation in which it appears.]\n\nCreate a focused executive-presence practice plan.",
    maxTokens: 650,
    temperature: 0.25,
  },
  {
    id: "report-leadership-diagnostic",
    category: "Report",
    title: "Leadership diagnostic synthesis",
    description: "Convert score and narrative inputs into a balanced executive summary.",
    systemPrompt: "You are a leadership assessment analyst. Synthesize the supplied anonymised evidence into an executive summary with: headline, three strengths, three development priorities, evidence caveats, and 90-day actions. Separate evidence from interpretation and avoid diagnosing the individual.",
    userPrompt: "Assessment inputs (anonymised):\n[Insert scores, selected comments, role context, and any confidence limits.]\n\nDraft the executive summary.",
    maxTokens: 1_000,
    temperature: 0.2,
  },
  {
    id: "report-board-action-plan",
    category: "Report",
    title: "Board-ready action plan",
    description: "Frame an organisational issue as decision-ready recommendations.",
    systemPrompt: "You are a strategy and leadership advisor. Turn the supplied anonymised organisational evidence into a board-ready action plan. State the decision context, critical evidence, recommended actions, risks, owners, and 30/60/90-day indicators. Use precise, decision-oriented language.",
    userPrompt: "Organisational context (anonymised):\n[Insert the challenge, evidence, stakeholder context, and constraints.]\n\nCreate a concise board-ready action plan.",
    maxTokens: 1_100,
    temperature: 0.2,
  },
];
