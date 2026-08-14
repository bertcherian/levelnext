import { buildUodlCoachDirective } from "./universalOntologicalDistinctions";

export const EXECUTIVE_INTELLIGENCES = [
  { id: "enterprise", label: "Enterprise", question: "Can you see the whole enterprise rather than optimise one part?" },
  { id: "strategic_commercial", label: "Strategic & commercial", question: "Can you determine where and how the business should win?" },
  { id: "financial_value", label: "Financial & value", question: "Can you translate choices into enterprise value?" },
  { id: "execution_transformation", label: "Execution & transformation", question: "Can you turn strategic intent into organisational movement?" },
  { id: "organisation_talent", label: "Organisation & talent", question: "Can you build an organisation capable of delivering the strategy?" },
  { id: "executive_stakeholder", label: "Executive & stakeholder", question: "Can you mobilise people beyond formal authority?" },
] as const;

export const EXECUTIVE_CHARACTER_DIMENSIONS = ["courage", "integrity", "authenticity", "humility", "other_centredness", "responsibility"] as const;
export const EXECUTIVE_MANDATE_AREAS = ["business_outcome", "strategic_choice", "transformation", "organisation", "stakeholder", "leadership_shift"] as const;
export const EXECUTIVE_RADAR_CATEGORIES = ["business", "customer", "strategy", "financial", "transformation", "organisation", "talent", "stakeholder", "self"] as const;
export const EXECUTIVE_ROLE_TYPES = ["ceo_bu_head", "cfo", "chro", "cio_cto", "coo", "commercial_leader", "other"] as const;
export const EXECUTIVE_TRANSITION_MODES = ["first_180_days", "executive_performance"] as const;

export type ExecutiveIntelligenceId = typeof EXECUTIVE_INTELLIGENCES[number]["id"];
export type ExecutiveMandateArea = typeof EXECUTIVE_MANDATE_AREAS[number];
export type ExecutiveRadarCategory = typeof EXECUTIVE_RADAR_CATEGORIES[number];
export type ExecutiveRoleType = typeof EXECUTIVE_ROLE_TYPES[number];
export type ExecutiveTransitionMode = typeof EXECUTIVE_TRANSITION_MODES[number];

export type ExecutivePriority = {
  id: string;
  title: string;
  area: ExecutiveMandateArea;
  outcome?: string;
  progress: "not_started" | "active" | "on_track" | "attention";
};

export type ExecutiveContext = {
  roleTitle?: string;
  roleType?: ExecutiveRoleType;
  businessName?: string;
  businessDescription?: string;
  geography?: string;
  scopeDescription?: string;
  mandateStatement?: string;
  transitionMode?: ExecutiveTransitionMode;
  runAttention?: number;
  transformAttention?: number;
  buildAttention?: number;
  stakeholderSummary?: string;
};

export type ExecutiveSituationAnalysis = {
  framing: string;
  primaryIntelligence: ExecutiveIntelligenceId;
  attentionItems: Array<{ category: ExecutiveRadarCategory; title: string; question: string; urgency: "now" | "soon" }>;
  notice: string;
  interpretation: string;
  assumptions: string[];
  alternativeOptions: string[];
  tradeOff: string;
  stakeholderLens: string;
  decisionQuality: string;
  outcomeQuality: string;
  evidenceLevel: "signal" | "repeated_signal" | "emerging_pattern" | "established_pattern";
  ontologicalDistinction?: { label: string; inquiry: string; whyUseful: string };
  nextBestAction: string;
  confidence: "low" | "moderate" | "high";
};

export function buildExecutiveCoachDirective() {
  return `LEVELNEXT EXECUTIVE INTELLIGENCE: The executive's business is the curriculum. Work from Business reality → Executive mandate → Attention → Sensemaking → Way of being → Judgment → Action → Impact → Learning. Start with context and mandate, not generic leadership advice. Distinguish RUN (today's business), TRANSFORM (changing today's business), and BUILD (tomorrow's business) without assuming balance is always right. Examine notice, interpretation, assumptions, framing, options, trade-offs, decision, mobilisation, action, outcome, and learning. Evaluate decision quality separately from outcome quality. Surface no more than three genuinely important attention items. Treat character or way-of-being observations only as evidence-based hypotheses; never moralise, diagnose, or reduce a single event to a pattern. Never make consequential business decisions for the executive; improve their thinking and preserve their judgment. ${buildUodlCoachDirective()}`;
}

export function createExecutiveAnalysisFallback(input: { situation: string; context?: ExecutiveContext; priorities?: ExecutivePriority[] }): ExecutiveSituationAnalysis {
  const primaryPriority = input.priorities?.[0]?.title ?? "the executive mandate";
  return {
    framing: `This appears to be a consequential situation connected to ${primaryPriority}; before acting, clarify the business outcome and the trade-off you are willing to own.`,
    primaryIntelligence: "enterprise",
    attentionItems: [{ category: "strategy", title: "Clarify the enterprise trade-off", question: "What changes for the whole business—not only your function—under each option?", urgency: "now" }],
    notice: "The available account describes the immediate pressure, but not yet the full enterprise system around it.",
    interpretation: "One possible interpretation is that speed is competing with the need to understand second-order consequences.",
    assumptions: ["The most visible issue is the most consequential issue.", "The current options are the only meaningful options."],
    alternativeOptions: ["Pause to test the highest-value assumption with the affected stakeholders.", "Set a short decision horizon while protecting a reversible path."],
    tradeOff: "Speed and local optimisation may be competing with enterprise resilience and stakeholder alignment.",
    stakeholderLens: "Identify who absorbs the consequences of the preferred option and whose information is currently absent.",
    decisionQuality: "Decision quality cannot yet be assessed from outcome alone; make the assumptions and alternatives explicit first.",
    outcomeQuality: "Agree a review date and compare the expected outcome with what actually happens.",
    evidenceLevel: "signal",
    ontologicalDistinction: { label: "Certainty vs Curiosity", inquiry: "What might you be missing?", whyUseful: "A broader inquiry may reveal an option or constraint before commitment hardens." },
    nextBestAction: "Write the decision in one sentence, name the assumption that most needs testing, and ask one stakeholder for disconfirming evidence today.",
    confidence: "low",
  };
}
