export type SampleRehearsalStepKey = "observable_facts" | "clarifying_question" | "agreed_next_action";

export type SampleRehearsalStep = {
  key: SampleRehearsalStepKey;
  label: string;
  prompt: string;
  matched: boolean;
  evidence: string;
};

export type SampleRehearsalEvaluation = {
  score: number;
  total: number;
  percentage: number;
  steps: SampleRehearsalStep[];
};

const STEP_DEFINITIONS: Array<Pick<SampleRehearsalStep, "key" | "label" | "prompt">> = [
  {
    key: "observable_facts",
    label: "Name observable facts",
    prompt: "Describe what happened without blame, assumptions, or labels.",
  },
  {
    key: "clarifying_question",
    label: "Ask one clarifying question",
    prompt: "Use a genuine question to understand the other person's context before jumping to a conclusion.",
  },
  {
    key: "agreed_next_action",
    label: "Agree the next action",
    prompt: "Close with a specific action, owner, or timing that both people can act on.",
  },
];

function normalise(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9?\s]/g, " ").replace(/\s+/g, " ").trim();
}

function evaluateStep(key: SampleRehearsalStepKey, text: string): { matched: boolean; evidence: string } {
  const value = normalise(text);
  if (!value) return { matched: false, evidence: "No learner response was detected." };

  if (key === "observable_facts") {
    const matched = /\b(observed|noticed|notice|fact|data|specific|when|on monday|on tuesday|on wednesday|on thursday|on friday|missed|delayed|late|did not|didn't|was not|wasn't)\b/.test(value);
    return { matched, evidence: matched ? "Your response included concrete or observable language." : "Try naming what was seen, heard, delayed, missed, or delivered without interpreting intent." };
  }

  if (key === "clarifying_question") {
    const matched = value.includes("?") || /\b(what|which|how|when|where|why|could you|can you|would you|is there|do you)\b/.test(value);
    return { matched, evidence: matched ? "Your response included a question or clarifying opener." : "Try one open question such as: What got in the way? or What support would help?" };
  }

  const matched = /\b(next step|next action|action|agree|agreed|will|commit|by tomorrow|by monday|by friday|follow up|follow-up|schedule|plan|owner|deadline|send|share|complete)\b/.test(value);
  return { matched, evidence: matched ? "Your response included an action, owner, commitment, or timing cue." : "End with who will do what and by when, even if the action is small." };
}

export function evaluateSampleRehearsal(messages: Array<{ role: string; content: string }>): SampleRehearsalEvaluation {
  const learnerText = messages.filter((message) => message.role === "user").map((message) => message.content).join(" ");
  const steps = STEP_DEFINITIONS.map((definition) => ({
    ...definition,
    ...evaluateStep(definition.key, learnerText),
  }));
  const score = steps.filter((step) => step.matched).length;
  return { score, total: steps.length, percentage: Math.round((score / steps.length) * 100), steps };
}
