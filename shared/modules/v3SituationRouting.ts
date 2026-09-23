export const V3_INTENT_MODES = [
  "talk_it_through",
  "perspective",
  "decide",
  "prepare",
  "practice",
  "challenge",
  "teach",
  "listen",
] as const;

export type V3IntentMode = (typeof V3_INTENT_MODES)[number];

export const V3_ROUTE_TARGETS = [
  "coach",
  "practice_partner",
  "simulator",
  "diagnostic",
  "clarify",
] as const;

export type V3RouteTarget = (typeof V3_ROUTE_TARGETS)[number];

export type V3SituationKey =
  | "delegation"
  | "difficult_feedback"
  | "underperformance"
  | "stakeholder_challenge"
  | "conflict"
  | "executive_communication"
  | "coaching"
  | "accountability"
  | "priority_management"
  | "managing_up";

export type V3DecisionEvidence = {
  signal: string;
  matchedTerms: string[];
};

export type V3SituationDecision = {
  situationKey: V3SituationKey | null;
  situationLabel: string;
  route: V3RouteTarget;
  confidence: number;
  alternatives: V3RouteTarget[];
  evidence: V3DecisionEvidence[];
  decisionMethod: "deterministic_v3_registry";
  modelVersion: "v3-mvp-2026-09-23";
  escalation: boolean;
  clarificationPrompt: string | null;
  rationale: string;
};

type SituationDefinition = {
  key: V3SituationKey;
  label: string;
  phrases: string[];
  signal: string;
  rationale: string;
};

export const V3_SITUATION_DEFINITIONS: SituationDefinition[] = [
  {
    key: "delegation",
    label: "Delegation and ownership",
    phrases: ["delegate", "delegating", "delegation", "take the work back", "taking work back", "ownership", "do it myself", "redoing"],
    signal: "ownership is staying with the manager instead of moving to the team",
    rationale: "The situation contains signals about giving ownership, releasing work, or stepping back into delegated work.",
  },
  {
    key: "difficult_feedback",
    label: "Difficult feedback",
    phrases: ["difficult feedback", "critical feedback", "give feedback", "feedback conversation", "hard conversation", "tell them they", "feedback without"],
    signal: "a feedback conversation carries relationship or emotional stakes",
    rationale: "The situation describes preparing for feedback or a high-stakes conversation where the message must still land.",
  },
  {
    key: "underperformance",
    label: "Underperformance",
    phrases: ["underperform", "underperformance", "missing deadlines", "missed deadline", "poor performance", "not meeting expectations", "performance gap"],
    signal: "a repeated performance gap needs a clear, fair response",
    rationale: "The situation includes repeated delivery or expectation concerns that require clarity and accountability.",
  },
  {
    key: "stakeholder_challenge",
    label: "Stakeholder challenge",
    phrases: ["stakeholder", "challenge a senior", "senior stakeholder", "cross-functional", "influence", "disagree with", "push back"],
    signal: "influence is needed across authority, status, or functions",
    rationale: "The situation involves challenging, influencing, or aligning someone outside the participant's direct authority.",
  },
  {
    key: "conflict",
    label: "Conflict and repair",
    phrases: ["conflict", "tension", "disagreement", "friction", "not speaking", "relationship is strained", "team conflict"],
    signal: "relationship friction is affecting the work",
    rationale: "The situation contains interpersonal friction that may need repair before a task solution will hold.",
  },
  {
    key: "executive_communication",
    label: "Executive communication",
    phrases: ["board presentation", "executive meeting", "senior leadership", "present to", "executive presence", "speak up", "recommendation"],
    signal: "the participant must communicate clearly under senior scrutiny",
    rationale: "The situation is about framing, brevity, recommendation quality, or authority in a senior forum.",
  },
  {
    key: "coaching",
    label: "Coaching and development",
    phrases: ["coach", "coaching", "develop my team", "one-on-one", "1-on-1", "help them grow", "development conversation"],
    signal: "the participant is trying to grow another person through a useful conversation",
    rationale: "The situation is about helping someone think, learn, or take ownership rather than simply giving an answer.",
  },
  {
    key: "accountability",
    label: "Accountability and follow-through",
    phrases: ["accountability", "follow through", "follow-through", "keeps missing", "commitment", "holds them accountable", "ownership gap"],
    signal: "a commitment or expectation is not turning into follow-through",
    rationale: "The situation focuses on making commitments visible and creating a clear next step without blame.",
  },
  {
    key: "priority_management",
    label: "Priorities and capacity",
    phrases: ["too much", "overwhelmed", "priorit", "time management", "capacity", "firefighting", "everything is urgent", "workload"],
    signal: "competing demands are obscuring the next useful action",
    rationale: "The situation is about focus, trade-offs, capacity, or moving from reactive work to deliberate priorities.",
  },
  {
    key: "managing_up",
    label: "Managing upward",
    phrases: ["my boss", "my manager", "managing up", "manager keeps", "overruling me", "boss keeps", "senior leader keeps"],
    signal: "the participant needs to create clarity or influence upward",
    rationale: "The situation concerns alignment, boundaries, or influence with the participant's manager or a senior leader.",
  },
];

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[’']/g, "'").trim();

function routeForIntent(intent: V3IntentMode, key: V3SituationKey | null): V3RouteTarget {
  if (intent === "practice") return "practice_partner";
  if (intent === "prepare") return "simulator";
  if (intent === "teach") return "diagnostic";
  if (intent === "listen" || intent === "talk_it_through" || intent === "perspective" || intent === "decide" || intent === "challenge") return "coach";
  if (key === "executive_communication" || key === "stakeholder_challenge" || key === "difficult_feedback") return "simulator";
  return "coach";
}

function routeLabel(route: V3RouteTarget): string {
  switch (route) {
    case "practice_partner": return "Practice Partner";
    case "simulator": return "Voice Simulator";
    case "diagnostic": return "Relevant Diagnostic";
    case "clarify": return "Clarifying conversation";
    default: return "Coach";
  }
}

export function routeSituation(input: { situation: string; intent: V3IntentMode }): V3SituationDecision {
  const normalized = normalize(input.situation);
  const ranked = V3_SITUATION_DEFINITIONS
    .map((definition) => {
      const matchedTerms = definition.phrases.filter((phrase) => normalized.includes(phrase));
      return { definition, matchedTerms, score: matchedTerms.length };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const top = ranked[0];
  const second = ranked[1];
  const hasEnoughSignal = Boolean(top && normalized.length >= 12);
  const confidence = !hasEnoughSignal
    ? 0.34
    : Math.min(0.96, 0.56 + (top.score * 0.12) + (second && second.score === top.score ? -0.08 : 0));
  const situationKey = hasEnoughSignal ? top.definition.key : null;
  const route = hasEnoughSignal ? routeForIntent(input.intent, situationKey) : "clarify";
  const alternatives = hasEnoughSignal
    ? Array.from(new Set([
        routeForIntent(input.intent, situationKey),
        input.intent === "practice" ? "simulator" : "coach",
        "coach",
      ])).filter((candidate) => candidate !== route).slice(0, 2) as V3RouteTarget[]
    : ["coach", "practice_partner"] as V3RouteTarget[];

  if (!hasEnoughSignal) {
    return {
      situationKey: null,
      situationLabel: "A workplace situation",
      route,
      confidence,
      alternatives,
      evidence: [],
      decisionMethod: "deterministic_v3_registry",
      modelVersion: "v3-mvp-2026-09-23",
      escalation: false,
      clarificationPrompt: "What is the specific moment you need to handle, and what would a better outcome look like?",
      rationale: "There is not enough signal to confidently classify the situation yet, so LevelNext will clarify before prescribing a tool.",
    };
  }

  return {
    situationKey,
    situationLabel: top.definition.label,
    route,
    confidence,
    alternatives,
    evidence: [{ signal: top.definition.signal, matchedTerms: top.matchedTerms }],
    decisionMethod: "deterministic_v3_registry",
    modelVersion: "v3-mvp-2026-09-23",
    escalation: false,
    clarificationPrompt: null,
    rationale: `${top.definition.rationale} ${input.intent === "practice" ? "You asked to practise, so the next step is a tailored rehearsal." : input.intent === "prepare" ? "You asked to prepare, so the next step is a live simulation." : `The suggested next step is ${routeLabel(route)}.`}`,
  };
}

export function routeTargetLabel(route: V3RouteTarget): string {
  return routeLabel(route);
}
