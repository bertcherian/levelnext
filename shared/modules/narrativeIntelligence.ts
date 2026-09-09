/**
 * LevelNext Narrative Intelligence™ — Shared Domain Module
 *
 * Core philosophy: "Don't just tell yourself a better story. Build the evidence to become it."
 *
 * This module defines the shared vocabulary, types, Zod schemas, role transitions,
 * lenses, 5-stage method helpers, and privacy rules for Narrative Intelligence.
 * It is consumed by both frontend and backend without circular dependencies.
 */

import { z } from "zod";

// ── 1. Core Vocabulary & Enums ──────────────────────────────────────────────────

export const NARRATIVE_CATEGORIES = ["self", "relational", "work_world", "future"] as const;
export type NarrativeCategory = (typeof NARRATIVE_CATEGORIES)[number];

export const NARRATIVE_CATEGORY_LABELS: Record<NarrativeCategory, { title: string; prompt: string; example: string }> = {
  self: {
    title: "Self Narrative",
    prompt: "What do I believe about myself, my natural ceiling, or where my value comes from?",
    example: '"My value comes from personally solving the hardest problems."',
  },
  relational: {
    title: "Relational Narrative",
    prompt: "What do I believe about other people, conflict, authority, and collaboration?",
    example: '"Direct disagreement with senior leaders damages relationships."',
  },
  work_world: {
    title: "Work & World Narrative",
    prompt: "What do I believe about how recognition, success, and credibility work here?",
    example: '"Good work eventually gets noticed without me speaking up."',
  },
  future: {
    title: "Future Narrative",
    prompt: "What do I believe is genuinely possible for someone in my position?",
    example: '"I have probably reached my natural organizational ceiling."',
  },
};

export const NARRATIVE_STATUSES = ["keep", "expand", "test", "retire", "create"] as const;
export type NarrativeStatus = (typeof NARRATIVE_STATUSES)[number];

export const NARRATIVE_STATUS_METADATA: Record<NarrativeStatus, { label: string; description: string; badgeVariant: string }> = {
  keep: {
    label: "Keep",
    description: "Substantially true and still serving your current role.",
    badgeVariant: "border-emerald-500/40 text-emerald-600 bg-emerald-500/10",
  },
  expand: {
    label: "Expand",
    description: "Historically useful, but requires a wider interpretation for your next level.",
    badgeVariant: "border-sky-500/40 text-sky-600 bg-sky-500/10",
  },
  test: {
    label: "Test",
    description: "An active hypothesis currently being challenged through behaviour and experiments.",
    badgeVariant: "border-amber-500/40 text-amber-600 bg-amber-500/10",
  },
  retire: {
    label: "Retire",
    description: "Recognised as no longer fitting your current mandate or trajectory.",
    badgeVariant: "border-slate-500/40 text-slate-500 bg-slate-500/10",
  },
  create: {
    label: "Create",
    description: "An emerging operating assumption being deliberately built and proven.",
    badgeVariant: "border-purple-500/40 text-purple-600 bg-purple-500/10",
  },
};

export const PARTICIPANT_RESONANCE_OPTIONS = [
  "strongly_resonates",
  "partly_resonates",
  "does_not_resonate",
  "explore",
  "edit",
  "dismiss",
] as const;
export type ParticipantResonance = (typeof PARTICIPANT_RESONANCE_OPTIONS)[number];

export const FIVE_STAGE_METHOD = ["notice", "question", "choose", "test", "prove"] as const;
export type FiveStageStep = (typeof FIVE_STAGE_METHOD)[number];

export const FOUR_WEEK_STAGES = [
  { week: 1, stage: "notice" as const, title: "Notice", subtitle: "Surface the assumptions driving your behaviour" },
  { week: 2, stage: "question" as const, title: "Question", subtitle: "Separate fact from interpretation and calculate narrative tax" },
  { week: 3, stage: "choose" as const, title: "Choose", subtitle: "Craft your Next Chapter and generative operating assumptions" },
  { week: 4, stage: "test" as const, title: "Test", subtitle: "Run behavioral experiments and test predictions against reality" },
] as const;

export const EVIDENCE_SOURCES = [
  "self_report",
  "simulator_behaviour",
  "practice_attempt",
  "real_world_outcome",
  "stakeholder_feedback",
] as const;
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];

export const EVIDENCE_SOURCE_LABELS: Record<EvidenceSource, { label: string; icon: string; description: string }> = {
  self_report: {
    label: "Self Reflection",
    icon: "FileText",
    description: "Direct participant reflection from real-world situations.",
  },
  simulator_behaviour: {
    label: "AI Simulation",
    icon: "Volume2",
    description: "Observed choices and conversational replay in the LevelNext Simulator.",
  },
  practice_attempt: {
    label: "Practice Coach",
    icon: "Target",
    description: "Scored rehearsal session and completed commitment in Practice Partner.",
  },
  real_world_outcome: {
    label: "Real-World Experiment",
    icon: "Zap",
    description: "Planned behavioral test with logged prediction vs actual outcome.",
  },
  stakeholder_feedback: {
    label: "Stakeholder Evidence",
    icon: "Users",
    description: "Voluntarily entered or explicitly authorised observations from colleagues.",
  },
};

// ── 2. Role-Transition Curated Libraries ────────────────────────────────────────

export type RoleTransitionDefinition = {
  id: string;
  module: "manager" | "leader" | "executive" | "professional" | "engineering" | "career";
  title: string;
  fromIdentity: string;
  toIdentity: string;
  limitingNarrative: string;
  generativeAssumption: string;
  historicalStrength: string;
  narrativeTax: string;
  concreteBehaviours: string[];
  suggestedExperiments: Array<{
    title: string;
    scenario: string;
    predictionPrompt: string;
  }>;
};

export const CURATED_ROLE_TRANSITIONS: RoleTransitionDefinition[] = [
  {
    id: "mep_expert_to_enabler",
    module: "manager",
    title: "From Expert to Enabler",
    fromIdentity: "The Technical Problem Solver",
    toIdentity: "The Capability Multiplier",
    limitingNarrative: "My value comes from personally having the answer and solving the hardest problems.",
    generativeAssumption: "My value increasingly comes from creating capability and problem-solving capacity in my team.",
    historicalStrength: "Deep technical competence, speed, and personal accountability.",
    narrativeTax: "Taking over tasks, weak delegation, personal overload, and team dependency.",
    concreteBehaviours: [
      "Ask before telling in technical discussions.",
      "Coach through questions before offering your own solution.",
      "Clarify ownership boundaries at the start of assignments.",
      "Allow productive struggle rather than rescuing prematurely.",
    ],
    suggestedExperiments: [
      {
        title: "The 10-Minute Coaching Pause",
        scenario: "When a team member brings a difficult blocker, ask 3 clarifying questions before offering any solution.",
        predictionPrompt: "What do you predict will happen if you do not solve it immediately?",
      },
      {
        title: "Delegating with Outcome Boundaries",
        scenario: "Delegate a high-visibility deliverable with clear outcome metrics but zero method prescription.",
        predictionPrompt: "How likely (0-100%) is it that the quality will be unacceptable without your direct intervention?",
      },
    ],
  },
  {
    id: "mep_controller_to_builder",
    module: "manager",
    title: "From Controller to Capability Builder",
    fromIdentity: "The Quality Gatekeeper",
    toIdentity: "The High-Trust System Builder",
    limitingNarrative: "If I don't stay closely involved in every detail, standards will slip and credibility is lost.",
    generativeAssumption: "True quality comes from clear operating guardrails, psychological safety, and rapid feedback loops.",
    historicalStrength: "Meticulous standards, high reliability, and deep risk awareness.",
    narrativeTax: "Micromanagement, sluggish decision velocity, and disempowered colleagues.",
    concreteBehaviours: [
      "Agree on checkpoints rather than monitoring progress ad hoc.",
      "Explicitly state what failure margin is acceptable for a given sprint.",
      "Praise team members who caught and rectified their own errors.",
    ],
    suggestedExperiments: [
      {
        title: "Checkpoint Agreement",
        scenario: "Agree in advance on exactly 2 review checkpoints for a week-long project instead of daily check-ins.",
        predictionPrompt: "What is your fear regarding what will slip between checkpoints?",
      },
    ],
  },
  {
    id: "mep_problem_solver_to_coach",
    module: "manager",
    title: "From Problem Solver to Leadership Coach",
    fromIdentity: "The Rapid Responder",
    toIdentity: "The Growth Catalyst",
    limitingNarrative: "A good manager provides quick answers so the team is never blocked.",
    generativeAssumption: "A great manager helps people develop their own discernment so they rarely need rescue.",
    historicalStrength: "Decisiveness, approachability, and rapid turnaround.",
    narrativeTax: "Becoming the single point of failure and bottleneck for team decisions.",
    concreteBehaviours: [
      "Respond to 'What should I do?' with 'What have you already weighed up?'",
      "Support reasonable decisions even if they differ slightly from your personal method.",
    ],
    suggestedExperiments: [
      {
        title: "The Reversal Question",
        scenario: "When asked for a decision, ask the team member for their recommendation and reasoning first.",
        predictionPrompt: "How confident are you that their recommendation will be workable?",
      },
    ],
  },
  {
    id: "lead_execution_to_direction",
    module: "leader",
    title: "From Execution to Strategic Direction",
    fromIdentity: "The Tactical Driver",
    toIdentity: "The Enterprise Architect",
    limitingNarrative: "My credibility depends on knowing the operational mechanics better than anyone.",
    generativeAssumption: "My credibility depends on aligning resources behind a coherent, forward-looking strategic intent.",
    historicalStrength: "Flawless operational rhythm and deep ground reality awareness.",
    narrativeTax: "Missing strategic inflection points and staying stuck in tactical escalations.",
    concreteBehaviours: [
      "Dedicate protected calendar time exclusively to strategic horizon scanning.",
      "Frame business reviews around market and customer shifts rather than internal task tracking.",
    ],
    suggestedExperiments: [
      {
        title: "Strategic Horizon Framing",
        scenario: "Lead a review meeting focusing entirely on the 6-month competitive implication rather than current sprint metrics.",
        predictionPrompt: "What do you predict peers will think if you do not dive into operational minutiae?",
      },
    ],
  },
  {
    id: "prof_invisible_to_visible",
    module: "professional",
    title: "From Invisible Performer to Visible Contributor",
    fromIdentity: "The Quiet Achiever",
    toIdentity: "The Articulate Value Creator",
    limitingNarrative: "Good work speaks for itself; self-advocacy feels political or self-serving.",
    generativeAssumption: "Sharing progress and insight is an act of service that helps colleagues and leaders make informed decisions.",
    historicalStrength: "Humility, consistent delivery, and low drama.",
    narrativeTax: "Being overlooked for high-leverage opportunities and feeling undervalued.",
    concreteBehaviours: [
      "Share one key learning or milestone in public channels weekly.",
      "Speak up within the first 15 minutes of senior stakeholder meetings.",
    ],
    suggestedExperiments: [
      {
        title: "Early Room Contribution",
        scenario: "Contribute a constructive question or synthesis within the opening 15 minutes of a cross-functional forum.",
        predictionPrompt: "What negative consequence are you predicting will occur?",
      },
    ],
  },
];

// ── 3. Capability-to-Narrative Lenses ──────────────────────────────────────────

export type NarrativeLens = {
  capabilityId: string;
  capabilityName: string;
  lensQuestions: string[];
  commonOldAssumptions: string[];
  emergingAssumptions: string[];
};

export const NARRATIVE_LENSES: Record<string, NarrativeLens> = {
  delegation: {
    capabilityId: "delegation",
    capabilityName: "Delegation & Ownership",
    lensQuestions: [
      "What do you believe will happen if you are not personally in the details?",
      "What does asking someone else to carry this deliverable feel like to you?",
    ],
    commonOldAssumptions: [
      "If I don't check every step, the standard will fall.",
      "It is faster if I just finish it myself.",
    ],
    emergingAssumptions: [
      "High standards are maintained by clear outcomes and feedback, not direct ownership of every keystroke.",
      "Investing 30 minutes in coaching now buys back 10 hours every month.",
    ],
  },
  feedback: {
    capabilityId: "feedback",
    capabilityName: "Candid Feedback & Accountability",
    lensQuestions: [
      "What do you believe direct, honest feedback does to a working relationship?",
      "What are you protecting when you soften or postpone hard feedback?",
    ],
    commonOldAssumptions: [
      "Honest feedback causes defensiveness and destroys trust.",
      "I should wait until the performance review to raise this.",
    ],
    emergingAssumptions: [
      "Clarity is kindness; withholding feedback denies people the agency to grow.",
      "Respectful candour builds durable trust faster than comfortable silence.",
    ],
  },
  executive_presence: {
    capabilityId: "executive_presence",
    capabilityName: "Executive Presence & Credibility",
    lensQuestions: [
      "What do you believe gives someone credibility in a room of senior stakeholders?",
      "What does being wrong or uncertain mean about you?",
    ],
    commonOldAssumptions: [
      "I must have all answers before speaking.",
      "Senior leaders will dismiss me if I acknowledge uncertainty.",
    ],
    emergingAssumptions: [
      "Credibility comes from clarity of thinking, framing trade-offs, and intellectual honesty, not omniscience.",
      "Acknowledging uncertainty calmly signals senior confidence, not weakness.",
    ],
  },
  conflict: {
    capabilityId: "conflict",
    capabilityName: "Constructive Disagreement",
    lensQuestions: [
      "What did you learn early in your career about workplace conflict?",
      "What is the difference between personal conflict and professional friction?",
    ],
    commonOldAssumptions: [
      "Good team players avoid open disagreement.",
      "If I push back, I will be seen as difficult.",
    ],
    emergingAssumptions: [
      "Constructive challenge protects the organization from expensive blind spots.",
      "I can advocate firmly for the business while maintaining warm regard for the person.",
    ],
  },
};

// ── 4. Narrative Pattern Library (Non-Diagnostic Reference) ────────────────────

export type NarrativePattern = {
  id: string;
  archetypeTitle: string;
  characteristicVoice: string;
  underlyingFear: string;
  strengthsToRetain: string;
  growthEdge: string;
  safeExplorationPrompt: string;
};

export const NARRATIVE_PATTERN_LIBRARY: NarrativePattern[] = [
  {
    id: "the_expert",
    archetypeTitle: "The Expert",
    characteristicVoice: '"My value comes from knowing the answer."',
    underlyingFear: "Losing authority or relevance if I am not the smartest person in the room.",
    strengthsToRetain: "Rigorous standards, deep domain knowledge, craftsmanship.",
    growthEdge: "Valuing questions over answers; building platforms for others.",
    safeExplorationPrompt: "One operating assumption sometimes observed in senior technical transitions is that credibility equals answers. Does that dynamic ever show up for you under pressure?",
  },
  {
    id: "the_controller",
    archetypeTitle: "The Controller",
    characteristicVoice: '"If I don\'t stay close to everything, things will fall apart."',
    underlyingFear: "Being surprised or held accountable for an outcome I did not personally control.",
    strengthsToRetain: "Diligent risk governance, discipline, operational clarity.",
    growthEdge: "Developing trust in guardrails rather than personal surveillance.",
    safeExplorationPrompt: "When stakes are high, does the dynamic of taking over rather than tightening checkpoints ever show up for you?",
  },
  {
    id: "the_hero",
    archetypeTitle: "The Hero / Rescuer",
    characteristicVoice: '"I need to step in and save the project."',
    underlyingFear: "Being seen as unhelpful or watching a colleague fail publicly.",
    strengthsToRetain: "High empathy, commitment, strong bias to help.",
    growthEdge: "Allowing colleagues to experience the dignity of their own problem solving.",
    safeExplorationPrompt: "Is there a situation where your impulse to help might actually be depriving a teammate of growth?",
  },
  {
    id: "the_perfectionist",
    archetypeTitle: "The Perfectionist",
    characteristicVoice: '"Mistakes destroy credibility; 95% is not enough."',
    underlyingFear: "Being judged, exposed, or considered careless.",
    strengthsToRetain: "Excellence, precision, impeccable finish.",
    growthEdge: "Distinguishing high-consequence precision from good-enough velocity.",
    safeExplorationPrompt: "Where might the desire for complete certainty be slowing down decisions that are easily reversible?",
  },
  {
    id: "the_permission_seeker",
    archetypeTitle: "The Permission Seeker",
    characteristicVoice: '"I need formal sign-off before I move."',
    underlyingFear: "Overstepping boundaries or facing backlash for initiative.",
    strengthsToRetain: "Respect for governance, stakeholder alignment.",
    growthEdge: "Acting from ownership and informing rather than asking for permission.",
    safeExplorationPrompt: "What decisions are you currently escalating that your executive would actually prefer you to decide?",
  },
  {
    id: "the_invisible_performer",
    archetypeTitle: "The Invisible Performer",
    characteristicVoice: '"My work will speak for itself; self-promotion is distasteful."',
    underlyingFear: "Appearing boastful or political.",
    strengthsToRetain: "Integrity, substance over style, dependable delivery.",
    growthEdge: "Seeing communication as alignment and service rather than self-promotion.",
    safeExplorationPrompt: "How might sharing your team's wins help other leaders connect the dots across the organization?",
  },
];

// ── 5. Zod Schemas for API & Validation ────────────────────────────────────────

export const narrativeCategorySchema = z.enum(NARRATIVE_CATEGORIES);
export const narrativeStatusSchema = z.enum(NARRATIVE_STATUSES);
export const participantResonanceSchema = z.enum(PARTICIPANT_RESONANCE_OPTIONS);
export const evidenceSourceSchema = z.enum(EVIDENCE_SOURCES);

export const createNarrativeHypothesisSchema = z.object({
  category: narrativeCategorySchema,
  statement: z.string().trim().min(5).max(500),
  sourceModule: z.string().trim().max(50).default("mep"),
  sourceContext: z.string().trim().max(1000).optional(),
  initialResonance: participantResonanceSchema.optional().default("explore"),
  historicalStrength: z.string().trim().max(500).optional(),
  currentCost: z.string().trim().max(500).optional(),
  emergingAssumption: z.string().trim().max(500).optional(),
});

export const respondToHypothesisSchema = z.object({
  narrativeId: z.number().int().positive(),
  resonance: participantResonanceSchema,
  editedStatement: z.string().trim().min(5).max(500).optional(),
  reflectionNote: z.string().trim().max(1000).optional(),
});

export const updateNarrativeStatusSchema = z.object({
  narrativeId: z.number().int().positive(),
  status: narrativeStatusSchema,
  statusReason: z.string().trim().max(500).optional(),
});

export const questionWorkspaceSchema = z.object({
  narrativeId: z.number().int().positive(),
  factDescription: z.string().trim().min(5).max(2000),
  storyInterpretation: z.string().trim().min(5).max(2000),
  predictionMade: z.string().trim().min(5).max(2000),
  evidenceFor: z.array(z.string().trim().min(1).max(500)).max(10).optional(),
  evidenceAgainst: z.array(z.string().trim().min(1).max(500)).max(10).optional(),
  exceptionHunt: z.string().trim().max(1000).optional(),
  narrativeTaxHistorical: z.string().trim().max(1000).optional(),
  narrativeTaxCurrent: z.string().trim().max(1000).optional(),
});

export const chooseNextChapterSchema = z.object({
  transitionId: z.string().trim().min(1).max(100),
  fromIdentity: z.string().trim().min(2).max(160),
  toIdentity: z.string().trim().min(2).max(160),
  emergingAssumption: z.string().trim().min(5).max(500),
  commitments: z.array(z.string().trim().min(3).max(300)).min(1).max(6),
  futureSelfVision: z.string().trim().max(2000).optional(),
});

export const createExperimentSchema = z.object({
  narrativeId: z.number().int().positive(),
  title: z.string().trim().min(3).max(200),
  contextSituation: z.string().trim().min(5).max(1000),
  oldAssumption: z.string().trim().min(5).max(500),
  alternativeHypothesis: z.string().trim().min(5).max(500),
  behaviourToTest: z.string().trim().min(5).max(500),
  predictedOutcome: z.string().trim().min(5).max(1000),
  predictedProbability: z.number().int().min(0).max(100).optional().default(70),
  experimentType: z.enum(["simulator", "practice", "real_world"]).default("real_world"),
  targetDate: z.string().optional(),
});

export const recordOutcomeSchema = z.object({
  experimentId: z.number().int().positive(),
  actualOutcome: z.string().trim().min(5).max(2000),
  whatRealityTaught: z.string().trim().min(5).max(2000),
  narrativeImpact: z.enum(["strongly_challenged", "partly_challenged", "confirmed_old", "inconclusive"]),
  convictionShiftOld: z.number().int().min(0).max(100).optional(),
  convictionShiftEmerging: z.number().int().min(0).max(100).optional(),
});

export const logEvidenceSchema = z.object({
  narrativeId: z.number().int().positive().optional(),
  experimentId: z.number().int().positive().optional(),
  sourceType: evidenceSourceSchema,
  situation: z.string().trim().min(5).max(1000),
  trigger: z.string().trim().max(500).optional(),
  actionTaken: z.string().trim().min(3).max(1000),
  outcome: z.string().trim().min(3).max(1000),
  learning: z.string().trim().min(3).max(1000),
  identityImplication: z.string().trim().max(500).optional(),
});

export const narrativeResetSchema = z.object({
  triggerSituation: z.string().trim().min(5).max(1000),
  noticeStory: z.string().trim().min(3).max(1000),
  separateFacts: z.string().trim().min(3).max(1000),
  alternativeView: z.string().trim().min(3).max(1000),
  chosenAssumption: z.string().trim().min(3).max(1000),
  immediateAction: z.string().trim().min(3).max(500),
  saveToEvidence: z.boolean().default(false),
});

export const sharingGrantSchema = z.object({
  recipientRole: z.enum(["success_partner", "coach", "manager"]),
  shareNextChapter: z.boolean().default(true),
  shareBehaviours: z.boolean().default(true),
  shareExperimentCount: z.boolean().default(true),
  shareEvidenceSummary: z.boolean().default(true),
  shareSupportRequest: z.string().trim().max(500).optional(),
  // Private content is excluded by definition
});

// ── 6. Deterministic Helper Functions ──────────────────────────────────────────

/**
 * Validates that an intervention tone adheres to the LevelNext coaching philosophy.
 * Rejects psychoanalytic, diagnostic, or coercive framing.
 */
export function sanitizeInterventionLanguage(text: string): { safe: boolean; reason?: string } {
  const disallowedPatterns = [
    /\byour\s+trauma\b/i,
    /\bchildhood\s+caused\b/i,
    /\byou\s+are\s+a\s+(narcissist|borderline|sociopath)\b/i,
    /\byour\s+mental\s+health\s+disorder\b/i,
    /\byou\s+are\s+(the\s+)?(controller|pleaser|hero|perfectionist)\b/i,
    /\bthe\s+truth\s+is\s+that\s+you\s+can't\b/i,
  ];

  for (const pattern of disallowedPatterns) {
    if (pattern.test(text)) {
      return { safe: false, reason: "Language approaches psychological diagnosis or permanent labeling." };
    }
  }

  return { safe: true };
}

/**
 * Evaluates whether an emerging conviction self-report reflects positive movement.
 */
export function calculateConvictionDelta(oldBefore: number, oldAfter: number, emergingBefore: number, emergingAfter: number): {
  oldShift: number;
  emergingShift: number;
  netProgress: number;
} {
  const oldShift = oldBefore - oldAfter; // positive means old limiting narrative has weakened
  const emergingShift = emergingAfter - emergingBefore; // positive means emerging assumption has strengthened
  const netProgress = Math.round((oldShift + emergingShift) / 2);
  return { oldShift, emergingShift, netProgress };
}
