export const ENGINEERING_DIAGNOSTIC_VERSION = "engineering_mvp_v1";

export const ENGINEERING_ENGINES = [
  "self",
  "collaboration",
  "problem",
  "systems",
  "business",
  "human_ai_judgment",
] as const;

export type EngineeringEngine = (typeof ENGINEERING_ENGINES)[number];
export type EngineeringImpactRadius = "self" | "team" | "system" | "organisation";

export type EngineeringDiagnosticQuestion = {
  code: string;
  engine: EngineeringEngine;
  prompt: string;
  detail: string;
};

export const ENGINEERING_DIAGNOSTIC_QUESTIONS: EngineeringDiagnosticQuestion[] = [
  { code: "self_reflection", engine: "self", prompt: "When a delivery or decision does not go as intended, how consistently do you examine your own contribution before explaining it away?", detail: "Self-leadership: reflection" },
  { code: "self_followthrough", engine: "self", prompt: "How reliably do you turn a stated improvement intention into one observable action in the following week?", detail: "Self-leadership: follow-through" },
  { code: "collaboration_listening", engine: "collaboration", prompt: "In cross-functional discussions, how consistently do you test your understanding of another perspective before advocating your own?", detail: "Collaboration: perspective-taking" },
  { code: "collaboration_alignment", engine: "collaboration", prompt: "How effectively do you make ownership, decisions, and next steps clear when work spans teams?", detail: "Collaboration: alignment" },
  { code: "problem_framing", engine: "problem", prompt: "Before moving into solution mode, how consistently do you clarify the real problem, constraints, and evidence needed?", detail: "Problem solving: framing" },
  { code: "problem_experimentation", engine: "problem", prompt: "When information is incomplete, how confidently do you run a proportionate experiment rather than waiting for certainty?", detail: "Problem solving: experimentation" },
  { code: "systems_tradeoffs", engine: "systems", prompt: "How consistently do you consider downstream consequences, dependencies, and trade-offs before changing a technical system?", detail: "Systems thinking: trade-offs" },
  { code: "systems_leverage", engine: "systems", prompt: "How often do you look for a reusable improvement to the system rather than repeatedly solving the same local issue?", detail: "Systems thinking: leverage" },
  { code: "business_context", engine: "business", prompt: "How clearly can you connect your technical work to the customer, commercial, risk, or operational outcome it serves?", detail: "Business impact: context" },
  { code: "business_influence", engine: "business", prompt: "How effectively do you explain technical trade-offs in a way that supports a sound stakeholder decision?", detail: "Business impact: influence" },
  { code: "ai_verification", engine: "human_ai_judgment", prompt: "When using AI-generated material, how consistently do you verify assumptions, limitations, and fit for the specific context?", detail: "Human–AI judgment: verification" },
  { code: "ai_responsibility", engine: "human_ai_judgment", prompt: "How deliberately do you retain ownership for the decision and its consequences when AI has contributed to the work?", detail: "Human–AI judgment: responsibility" },
];

export type EngineeringDiagnosticScore = {
  engineScores: Record<EngineeringEngine, number>;
  impactRadius: EngineeringImpactRadius;
  impactPattern: string;
  growthEdge: {
    engine: EngineeringEngine;
    statement: string;
  };
};

const ENGINE_LABELS: Record<EngineeringEngine, string> = {
  self: "Self-leadership",
  collaboration: "Collaboration",
  problem: "Problem framing",
  systems: "Systems thinking",
  business: "Business impact",
  human_ai_judgment: "Human–AI judgment",
};

export function getEngineeringQuestion(code: string) {
  return ENGINEERING_DIAGNOSTIC_QUESTIONS.find((question) => question.code === code);
}

export function scoreEngineeringDiagnostic(responses: Record<string, number>): EngineeringDiagnosticScore {
  const engineScores = Object.fromEntries(ENGINEERING_ENGINES.map((engine) => [engine, 0])) as Record<EngineeringEngine, number>;
  const engineCounts = Object.fromEntries(ENGINEERING_ENGINES.map((engine) => [engine, 0])) as Record<EngineeringEngine, number>;

  for (const question of ENGINEERING_DIAGNOSTIC_QUESTIONS) {
    const value = responses[question.code];
    if (typeof value === "number") {
      engineScores[question.engine] += value * 20;
      engineCounts[question.engine] += 1;
    }
  }

  for (const engine of ENGINEERING_ENGINES) {
    engineScores[engine] = engineCounts[engine] > 0
      ? Math.round(engineScores[engine] / engineCounts[engine])
      : 0;
  }

  const ranked = [...ENGINEERING_ENGINES].sort((a, b) => engineScores[b] - engineScores[a]);
  const lowest = ranked[ranked.length - 1];
  const systemsAndBusiness = (engineScores.systems + engineScores.business) / 2;
  const teamAndSystems = (engineScores.collaboration + engineScores.systems) / 2;
  const impactRadius: EngineeringImpactRadius = systemsAndBusiness >= 75
    ? "organisation"
    : teamAndSystems >= 60
      ? "system"
      : engineScores.collaboration >= 50
        ? "team"
        : "self";

  const impactPattern = ranked[0] === "systems"
    ? "Systems builder"
    : ranked[0] === "collaboration"
      ? "Collaborative builder"
      : ranked[0] === "business"
        ? "Technical translator"
        : ranked[0] === "problem"
          ? "Structured solver"
          : ranked[0] === "human_ai_judgment"
            ? "Judicious augmenter"
            : "Deliberate builder";

  return {
    engineScores,
    impactRadius,
    impactPattern,
    growthEdge: {
      engine: lowest,
      statement: `Build greater range in ${ENGINE_LABELS[lowest].toLowerCase()} through one practical workplace experiment.`,
    },
  };
}

export type PartnerNudgeCandidate = {
  participantId: number;
  participantName: string;
  missionId: number;
  missionTitle: string;
  missionStatus: string;
  reasonCode: "mission_due" | "mission_stalled" | "follow_up_due" | "celebration";
  priorityScore: number;
  dueAt?: string | null;
  lastUpdatedAt: string;
  followUpAt?: string | null;
};

export type PartnerNudgeDraft = {
  participantId: number;
  reasonCode: PartnerNudgeCandidate["reasonCode"];
  objective: string;
  whyNow: string;
  suggestedQuestion: string;
  recommendedChannel: "in_app" | "call" | "voice_note" | "email";
  effort: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high" | "critical";
  priorityScore: number;
};

export function deterministicPartnerNudge(candidate: PartnerNudgeCandidate): PartnerNudgeDraft {
  const questionByReason: Record<PartnerNudgeCandidate["reasonCode"], string> = {
    mission_due: `What would make your next step on “${candidate.missionTitle}” feel more workable this week?`,
    mission_stalled: `Would it help to look together at what has made “${candidate.missionTitle}” difficult to move forward?`,
    follow_up_due: `You asked to revisit “${candidate.missionTitle}”. What has changed since we last spoke?`,
    celebration: `What helped you make progress on “${candidate.missionTitle}”, and what would you like to carry forward?`,
  };
  const urgency = candidate.priorityScore >= 80 ? "high" : candidate.priorityScore >= 60 ? "medium" : "low";
  return {
    participantId: candidate.participantId,
    reasonCode: candidate.reasonCode,
    objective: candidate.reasonCode === "celebration" ? "Recognise a meaningful action and deepen the learning." : "Offer a brief, participant-led coaching check-in.",
    whyNow: candidate.reasonCode.replace(/_/g, " "),
    suggestedQuestion: questionByReason[candidate.reasonCode],
    recommendedChannel: "in_app",
    effort: "low",
    urgency,
    priorityScore: candidate.priorityScore,
  };
}
