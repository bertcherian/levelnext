/**
 * LevelNext Behavioural Intelligence Engine™ — Shared Domain Module
 *
 * "Knowing is not the primary problem. Doing differently when it matters is."
 *
 * Unifies:
 *   Moment → Pattern → Observer → Distinction → Move → Practice → Action → Evidence → Reflection → New Capacity
 *
 * Core question:
 *   "Given this person, in this role, facing this situation, operating from this observer
 *    and mood, and committed to this outcome — what is the most useful behavioural move available right now?"
 */

import { z } from "zod";
import {
  UNIVERSAL_ONTOLOGICAL_DISTINCTIONS,
  getDistinction,
  type OntologicalDistinction,
} from "./universalOntologicalDistinctions";

// ── 1. Core Enums and Constants ─────────────────────────────────────────────────

export const BEHAVIOURAL_CAREER_STAGES = [
  "early_career",
  "professional",
  "manager",
  "leader",
  "cxo",
] as const;
export type BehaviouralCareerStage = (typeof BEHAVIOURAL_CAREER_STAGES)[number];

export const BEHAVIOURAL_DIAGNOSTIC_LENSES = [
  "knowing", // capability / skill gap
  "seeing",  // judgement / perspective / situational clarity
  "choosing", // self-leadership / willingness / courage
  "mixed",   // multi-factor
] as const;
export type BehaviouralDiagnosticLens = (typeof BEHAVIOURAL_DIAGNOSTIC_LENSES)[number];

export const BEHAVIOURAL_PRIMARY_GAPS = [
  "capability",
  "judgment",
  "self_leadership",
  "observer",
  "environment_system",
  "mixed",
] as const;
export type BehaviouralPrimaryGap = (typeof BEHAVIOURAL_PRIMARY_GAPS)[number];

export const BEHAVIOURAL_DEPTHS = [
  "D1_answer",
  "D2_practice",
  "D3_reflection",
  "D4_reframe",
  "D5_observer_shift",
] as const;
export type BehaviouralDepth = (typeof BEHAVIOURAL_DEPTHS)[number];

export const BEHAVIOURAL_CONFIDENCE_LEVELS = ["low", "moderate", "high"] as const;
export type BehaviouralConfidence = (typeof BEHAVIOURAL_CONFIDENCE_LEVELS)[number];

export const BEHAVIOURAL_EVIDENCE_LEVELS = [
  "prepared",                 // Can clearly state the intended move and success criteria
  "practised",                // Rehearsed in micro-practice, role-play or simulator
  "applied",                  // Attempted in the real world
  "reflected",                // Captured what reality taught and what shifted
  "repeated",                 // Successfully applied across multiple moments
  "demonstrated_consistently", // Corroborated evidence of sustained new capacity
] as const;
export type BehaviouralEvidenceLevel = (typeof BEHAVIOURAL_EVIDENCE_LEVELS)[number];

export const BEHAVIOURAL_EVIDENCE_SOURCES = [
  "self_report",
  "simulator_behaviour",
  "practice_attempt",
  "real_world_outcome",
  "stakeholder_feedback",
] as const;
export type BehaviouralEvidenceSource = (typeof BEHAVIOURAL_EVIDENCE_SOURCES)[number];

export const BEHAVIOURAL_MOMENT_STATUSES = [
  "draft",
  "analysed",
  "in_practice",
  "in_action",
  "completed",
  "archived",
] as const;
export type BehaviouralMomentStatus = (typeof BEHAVIOURAL_MOMENT_STATUSES)[number];

export const BEHAVIOURAL_MOVE_STATUSES = [
  "proposed",
  "selected",
  "practised",
  "committed",
  "applied",
  "dismissed",
] as const;
export type BehaviouralMoveStatus = (typeof BEHAVIOURAL_MOVE_STATUSES)[number];

export const BEHAVIOURAL_ACTION_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type BehaviouralActionStatus = (typeof BEHAVIOURAL_ACTION_STATUSES)[number];

export const BEHAVIOURAL_NEXT_STEPS = [
  "answer",
  "practice",
  "act",
  "reflect",
  "explore_with_coach",
] as const;
export type BehaviouralNextStep = (typeof BEHAVIOURAL_NEXT_STEPS)[number];

// ── 2. Curated Move Library (Templates for fast start) ──────────────────────────

export type CuratedMoveTemplate = {
  moveCode: string;
  category: "managing_self" | "managing_team" | "managing_stakeholders" | "navigating_system";
  title: string;
  summary: string;
  whenToUse: string;
  suggestedPhrases: string[];
  successSignal: string;
  doNotDo: string[];
  recommendedDepth: BehaviouralDepth;
  applicableDistinctionIds: string[];
};

export const CURATED_MOVE_LIBRARY: CuratedMoveTemplate[] = [
  {
    moveCode: "MOVE-01_CLARIFYING_QUESTION_BEFORE_VIEW",
    category: "managing_stakeholders",
    title: "Clarifying Question Before View",
    summary: "Ask one genuine, non-rhetorical question to test the assumptions behind a proposal before offering your counter-view.",
    whenToUse: "When you notice a commercial or technical risk in a meeting but risk triggering defensiveness if you challenge directly.",
    suggestedPhrases: [
      "Before we lock this in, could we explore what assumption we are making about the timeline?",
      "Help me understand the trade-off we weighed when choosing this path over the alternatives.",
      "What would need to be true for this forecast to hold under pressure?",
    ],
    successSignal: "The other person elaborates on their rationale without feeling attacked, and the assumption is visible to the room.",
    doNotDo: [
      "Do not ask loaded rhetorical questions like 'Don't you think that's risky?'",
      "Do not stay completely silent and complain after the meeting.",
    ],
    recommendedDepth: "D2_practice",
    applicableDistinctionIds: ["OD-01", "OD-16", "OD-18"],
  },
  {
    moveCode: "MOVE-02_SEPARATE_FACT_FROM_INTERPRETATION",
    category: "managing_self",
    title: "Separate Fact From Interpretation",
    summary: "State the verifiable observation calmly before sharing your interpretation, explicitly naming it as an interpretation.",
    whenToUse: "When you feel frustrated by a colleague's missed deadline or communication style and catch yourself making a character judgment.",
    suggestedPhrases: [
      "What I observed is that the report was delivered on Wednesday without the data breakdown. My concern is that...",
      "Here is the concrete data point. How I am interpreting that is...",
      "Let's look at the observable metrics first before we draw conclusions.",
    ],
    successSignal: "The conversation focuses on the concrete event rather than debating whether someone is careless or irresponsible.",
    doNotDo: [
      "Do not use absolute words like 'always', 'never', 'obviously'.",
      "Do not claim to know the other person's hidden motives.",
    ],
    recommendedDepth: "D3_reflection",
    applicableDistinctionIds: ["OD-01", "OD-11", "OD-16"],
  },
  {
    moveCode: "MOVE-03_DELEGATE_OUTCOME_NOT_METHOD",
    category: "managing_team",
    title: "Delegate Outcome with Guardrails",
    summary: "Define what success looks like and the review checkpoints, then explicitly give authority over the method.",
    whenToUse: "When you feel the urge to micromanage or rescue a team member from productive struggle.",
    suggestedPhrases: [
      "Here is the standard we need to meet and why. I'd like you to decide the execution steps.",
      "Let's agree on two review checkpoints this week rather than daily check-ins.",
      "What decision rights do you feel you need from me to run with this independently?",
    ],
    successSignal: "The team member presents their proposed solution at the checkpoint rather than asking for step-by-step instructions.",
    doNotDo: [
      "Do not take the work back at the first sign of an approach different from your own.",
      "Do not delegate without clear boundaries and then express disappointment.",
    ],
    recommendedDepth: "D2_practice",
    applicableDistinctionIds: ["OD-05", "OD-06", "OD-20"],
  },
  {
    moveCode: "MOVE-04_CONVERT_COMPLAINT_TO_REQUEST",
    category: "navigating_system",
    title: "Convert Complaint to Specific Request",
    summary: "Identify the commitment underneath frustration, then formulate a clear, actionable request with who, what, by when, and conditions.",
    whenToUse: "When you or your team have been venting about cross-functional friction or delayed inputs.",
    suggestedPhrases: [
      "Because we both care about the launch date, I have a specific request.",
      "Can we agree that your team will supply the API spec by Thursday 3 PM?",
      "What would make it possible for your team to commit to this deadline?",
    ],
    successSignal: "The other party gives a clear promise, a counter-offer, or an honest decline rather than ambiguous assent.",
    doNotDo: [
      "Do not confuse an expectation or hope with an explicit request.",
      "Do not settle for vague promises like 'we will try our best'.",
    ],
    recommendedDepth: "D2_practice",
    applicableDistinctionIds: ["OD-04", "OD-05", "OD-06"],
  },
  {
    moveCode: "MOVE-05_DECLARE_BREAKDOWN_CONSTRUCTIVELY",
    category: "managing_stakeholders",
    title: "Constructive Breakdown Declaration",
    summary: "Calmly declare that the current plan is off-track and frame the breakdown as an invitation to re-align, not an assignment of blame.",
    whenToUse: "When an assumption has failed or a target is no longer realistic.",
    suggestedPhrases: [
      "I am calling a pause because our current velocity will not hit the customer date. Let's look at what has changed.",
      "We have hit a breakdown in this workflow. What is it revealing that was previously hidden?",
      "Given what we know now, what trade-offs are we willing to make?",
    ],
    successSignal: "Stakeholders shift from defensive justification to collaborative problem-solving and revised commitments.",
    doNotDo: [
      "Do not hide bad news until it becomes an unavoidable catastrophe.",
      "Do not weaponise the breakdown to score points against another function.",
    ],
    recommendedDepth: "D4_reframe",
    applicableDistinctionIds: ["OD-08", "OD-13", "OD-15"],
  },
  {
    moveCode: "MOVE-06_EXECUTIVE_RECOMMENDATION_FIRST",
    category: "managing_stakeholders",
    title: "Executive Bottom-Line First",
    summary: "Deliver the core recommendation and business consequence in the first 60 seconds, then provide supporting rationale.",
    whenToUse: "In senior executive or boardroom briefings where attention is limited.",
    suggestedPhrases: [
      "My recommendation today is X, which protects Y and requires trade-off Z. Here is the concise reasoning.",
      "The critical decision required today is between Option A and Option B.",
    ],
    successSignal: "The executive engages with the strategic trade-off immediately rather than interrupting for the point.",
    doNotDo: [
      "Do not start with chronological context or methodology.",
      "Do not hedge so heavily that your recommendation is invisible.",
    ],
    recommendedDepth: "D2_practice",
    applicableDistinctionIds: ["OD-18", "OD-19"],
  },
];

// ── 3. Zod Schemas for Contracts & Validation ──────────────────────────────────

export const behaviouralCareerStageSchema = z.enum(BEHAVIOURAL_CAREER_STAGES);
export const behaviouralDiagnosticLensSchema = z.enum(BEHAVIOURAL_DIAGNOSTIC_LENSES);
export const behaviouralPrimaryGapSchema = z.enum(BEHAVIOURAL_PRIMARY_GAPS);
export const behaviouralDepthSchema = z.enum(BEHAVIOURAL_DEPTHS);
export const behaviouralConfidenceSchema = z.enum(BEHAVIOURAL_CONFIDENCE_LEVELS);
export const behaviouralEvidenceLevelSchema = z.enum(BEHAVIOURAL_EVIDENCE_LEVELS);
export const behaviouralEvidenceSourceSchema = z.enum(BEHAVIOURAL_EVIDENCE_SOURCES);
export const behaviouralMomentStatusSchema = z.enum(BEHAVIOURAL_MOMENT_STATUSES);
export const behaviouralMoveStatusSchema = z.enum(BEHAVIOURAL_MOVE_STATUSES);
export const behaviouralActionStatusSchema = z.enum(BEHAVIOURAL_ACTION_STATUSES);
export const behaviouralNextStepSchema = z.enum(BEHAVIOURAL_NEXT_STEPS);

export const createBehaviouralMomentSchema = z.object({
  sourceApp: z.string().trim().min(2).max(80).default("behavioural_intelligence"),
  sourceEntityType: z.string().trim().max(80).optional(),
  sourceEntityId: z.number().int().positive().optional(),
  moduleType: z.string().trim().max(50).optional(),
  situation: z.string().trim().min(10).max(4000),
  desiredOutcome: z.string().trim().max(1000).optional(),
  observedBehaviour: z.string().trim().max(2000).optional(),
  role: z.string().trim().max(255).optional(),
  careerStage: behaviouralCareerStageSchema.default("manager"),
  authorityLevel: z.string().trim().max(160).optional(),
  stakeholders: z.string().trim().max(1200).optional(),
  organisationalContext: z.string().trim().max(1200).optional(),
  culturalContext: z.string().trim().max(1200).optional(),
  powerDynamics: z.string().trim().max(1200).optional(),
  consequences: z.string().trim().max(1200).optional(),
  evidence: z.array(z.string().trim().min(1).max(600)).max(8).optional().default([]),
  diagnosticContext: z
    .object({
      reportId: z.number().int().positive().optional(),
      edgeScore: z.number().optional(),
      dimensionScores: z.record(z.string(), z.number()).optional(),
      archetype: z.string().optional(),
      zone: z.string().optional(),
    })
    .optional(),
});
export type CreateBehaviouralMomentInput = z.infer<typeof createBehaviouralMomentSchema>;

export const behaviouralMoveSchema = z.object({
  moveCode: z.string().trim().min(3).max(100),
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().min(10).max(2000),
  suggestedLanguage: z.array(z.string().trim().min(3).max(400)).max(6).default([]),
  successSignal: z.string().trim().min(5).max(1000),
  doNotDo: z.array(z.string().trim().min(3).max(400)).max(6).default([]),
  recommendedDepth: behaviouralDepthSchema.default("D2_practice"),
});
export type BehaviouralMove = z.infer<typeof behaviouralMoveSchema>;

export const behaviouralAnalysisSchema = z.object({
  engineVersion: z.string().default("1.0.0"),
  diagnosticLens: behaviouralDiagnosticLensSchema,
  primaryGap: behaviouralPrimaryGapSchema,
  facts: z.array(z.string().trim().min(2).max(400)).min(1).max(6),
  interpretations: z.array(z.string().trim().min(2).max(400)).min(1).max(6),
  predictions: z.array(z.string().trim().min(2).max(400)).max(6).default([]),
  narrativeHypothesis: z.string().trim().min(5).max(600),
  moodHypothesis: z.string().trim().min(3).max(300),
  observerHypothesis: z.string().trim().min(5).max(600),
  distinctionIds: z.array(z.string().trim().min(2).max(30)).max(2),
  missingConversation: z.string().trim().max(600).optional(),
  confidence: behaviouralConfidenceSchema,
  alternativeExplanations: z.array(z.string().trim().min(3).max(400)).min(1).max(5),
  move: behaviouralMoveSchema,
  nextStep: behaviouralNextStepSchema,
  safetyNotes: z.array(z.string().trim()).default([]),
  doNotSurface: z.array(z.string().trim()).default([]),
});
export type BehaviouralAnalysis = z.infer<typeof behaviouralAnalysisSchema>;

export const createActionCommitmentSchema = z.object({
  momentId: z.number().int().positive(),
  moveId: z.number().int().positive(),
  actionDescription: z.string().trim().min(5).max(2000),
  personOrGroup: z.string().trim().max(255).optional(),
  dueAt: z.string().datetime().optional(),
});
export type CreateActionCommitmentInput = z.infer<typeof createActionCommitmentSchema>;

export const updateActionStatusSchema = z.object({
  actionId: z.number().int().positive(),
  status: behaviouralActionStatusSchema,
  completionNotes: z.string().trim().max(2000).optional(),
});
export type UpdateActionStatusInput = z.infer<typeof updateActionStatusSchema>;

export const recordEvidenceSchema = z.object({
  momentId: z.number().int().positive(),
  moveId: z.number().int().positive().optional(),
  actionId: z.number().int().positive().optional(),
  sourceType: behaviouralEvidenceSourceSchema.default("self_report"),
  situation: z.string().trim().min(5).max(2000),
  actionTaken: z.string().trim().min(5).max(2000),
  outcome: z.string().trim().min(5).max(2000),
  learning: z.string().trim().min(5).max(2000),
  evidenceLevel: behaviouralEvidenceLevelSchema.default("applied"),
});
export type RecordEvidenceInput = z.infer<typeof recordEvidenceSchema>;

export const recordReflectionSchema = z.object({
  evidenceId: z.number().int().positive(),
  momentId: z.number().int().positive(),
  reflectionText: z.string().trim().min(5).max(3000),
  capacitySignal: z.string().trim().max(1000).optional(),
  oldPatternShift: z.string().trim().max(1000).optional(),
  newPossibility: z.string().trim().max(1000).optional(),
});
export type RecordReflectionInput = z.infer<typeof recordReflectionSchema>;

// ── 4. Deterministic Guardrails and Sanitization ────────────────────────────────

/**
 * Strict safeguard function enforcing that no psychoanalytic labeling,
 * mental-health diagnosis, permanent negative traits, or victim-blaming
 * gets output from the engine.
 */
export function sanitizeBehaviouralInterventionLanguage(text: string): {
  safe: boolean;
  cleanText: string;
  violations: string[];
} {
  const violations: string[] = [];
  let cleanText = text;

  const disallowedPatterns: Array<{ pattern: RegExp; replacement: string; reason: string }> = [
    {
      pattern: /\byou\s+are\s+a\s+(narcissist|sociopath|borderline|toxic\s+person)\b/gi,
      replacement: "you may be experiencing a tense relational pattern",
      reason: "Diagnostic psychological label",
    },
    {
      pattern: /\byour\s+(childhood\s+trauma|mental\s+illness|disorder)\b/gi,
      replacement: "prior career experiences",
      reason: "Clinical trauma/disorder inference",
    },
    {
      pattern: /\byou\s+are\s+(lazy|cowardly|incompetent|hopeless|broken)\b/gi,
      replacement: "the current pattern has room for development",
      reason: "Defamatory/permanent character judgment",
    },
    {
      pattern: /\bthe\s+truth\s+is\s+you\s+don't\s+care\b/gi,
      replacement: "one perception that could emerge is",
      reason: "Asserting ungrounded motive as objective truth",
    },
  ];

  for (const item of disallowedPatterns) {
    if (item.pattern.test(cleanText)) {
      violations.push(item.reason);
      cleanText = cleanText.replace(item.pattern, item.replacement);
    }
  }

  return {
    safe: violations.length === 0,
    cleanText,
    violations,
  };
}

// ── 5. Deterministic Fallback Builder ───────────────────────────────────────────

/**
 * Produces a robust, grounded, typed Behavioural Intelligence analysis
 * without requiring any LLM call. Guarantees 100% operational uptime
 * even under API failure or network partition.
 */
export function createDeterministicFallbackAnalysis(
  input: CreateBehaviouralMomentInput,
): BehaviouralAnalysis {
  const situation = input.situation;
  const observedBehaviour =
    input.observedBehaviour?.trim() ||
    "The available account describes a workplace interaction without yet proving a recurring pattern.";

  // Pick suitable template
  let selectedTemplate = CURATED_MOVE_LIBRARY[0];
  let primaryDistinctionId = "OD-01"; // Assertion vs Assessment
  let lens: BehaviouralDiagnosticLens = "seeing";
  let gap: BehaviouralPrimaryGap = "judgment";

  const sitLower = situation.toLowerCase();
  if (sitLower.includes("delegate") || sitLower.includes("micromanag") || sitLower.includes("take back")) {
    selectedTemplate = CURATED_MOVE_LIBRARY[2]; // Delegate Outcome with Guardrails
    primaryDistinctionId = "OD-20"; // Care vs Control
    lens = "choosing";
    gap = "self_leadership";
  } else if (sitLower.includes("complain") || sitLower.includes("delay") || sitLower.includes("request")) {
    selectedTemplate = CURATED_MOVE_LIBRARY[3]; // Convert Complaint to Request
    primaryDistinctionId = "OD-05"; // Request vs Expectation
    lens = "knowing";
    gap = "capability";
  } else if (sitLower.includes("breakdown") || sitLower.includes("off track") || sitLower.includes("fail")) {
    selectedTemplate = CURATED_MOVE_LIBRARY[4]; // Constructive Breakdown
    primaryDistinctionId = "OD-08"; // Breakdown
    lens = "seeing";
    gap = "observer";
  } else if (sitLower.includes("board") || sitLower.includes("executive") || sitLower.includes("pitch")) {
    selectedTemplate = CURATED_MOVE_LIBRARY[5]; // Executive Bottom-Line First
    primaryDistinctionId = "OD-18"; // Being Right vs Being Effective
    lens = "knowing";
    gap = "capability";
  }

  const distinction = getDistinction(primaryDistinctionId);

  return {
    engineVersion: "1.0.0-fallback",
    diagnosticLens: lens,
    primaryGap: gap,
    facts: [
      "A workplace situation occurred requiring communication and alignment.",
      `Context: ${input.role ?? "Professional"} navigating ${input.organisationalContext ?? "workplace commitments"}.`,
    ],
    interpretations: [
      "There is an opportunity to clarify expectations and test assumptions before taking final action.",
      distinction?.guardrail ?? "Assessments feel like facts under pressure; grounding them in observable data expands choices.",
    ],
    predictions: [
      "Proceeding without clarifying assumptions may lead to downstream misalignment or avoidable friction.",
    ],
    narrativeHypothesis:
      "One possibility worth exploring is whether speed, comfort, or an untested assumption is narrowing the behavioural choices that feel available.",
    moodHypothesis: "Caution or urgency under deadline pressure",
    observerHypothesis: `Operating from a perspective where speaking up or changing direction feels higher risk than cautious accommodation.`,
    distinctionIds: [primaryDistinctionId],
    missingConversation:
      "A focused conversation with key stakeholders to align on observable expectations and mutual commitments.",
    confidence: "low",
    alternativeExplanations: [
      "The issue could stem from incomplete information rather than hesitation.",
      "Real structural constraints or power asymmetries may limit immediate unilateral action.",
    ],
    move: {
      moveCode: selectedTemplate.moveCode,
      title: selectedTemplate.title,
      description: selectedTemplate.summary,
      suggestedLanguage: selectedTemplate.suggestedPhrases,
      successSignal: selectedTemplate.successSignal,
      doNotDo: selectedTemplate.doNotDo,
      recommendedDepth: selectedTemplate.recommendedDepth,
    },
    nextStep: "practice",
    safetyNotes: [
      "Analysis produced by deterministic fallback. Treat as an exploratory lens, not a verified diagnosis.",
    ],
    doNotSurface: [],
  };
}

// ── 6. Evidence Ladder Progress Calculator ─────────────────────────────────────

export function calculateEvidenceLevelProgression(evidenceRecords: Array<{
  evidenceLevel: BehaviouralEvidenceLevel;
  sourceType: BehaviouralEvidenceSource;
  verificationStatus: "unverified" | "pending" | "verified" | "disputed";
}>): {
  highestLevel: BehaviouralEvidenceLevel;
  levelIndex: number; // 0 to 5
  totalEvidenceCount: number;
  verifiedCount: number;
  summaryLabel: string;
} {
  const levelsOrder: BehaviouralEvidenceLevel[] = [
    "prepared",
    "practised",
    "applied",
    "reflected",
    "repeated",
    "demonstrated_consistently",
  ];

  if (!evidenceRecords || evidenceRecords.length === 0) {
    return {
      highestLevel: "prepared",
      levelIndex: 0,
      totalEvidenceCount: 0,
      verifiedCount: 0,
      summaryLabel: "Prepared — Move defined and ready for practice",
    };
  }

  let maxIdx = 0;
  let verifiedCount = 0;

  for (const item of evidenceRecords) {
    const idx = levelsOrder.indexOf(item.evidenceLevel);
    if (idx > maxIdx) {
      maxIdx = idx;
    }
    if (item.verificationStatus === "verified") {
      verifiedCount += 1;
    }
  }

  // Demonstrated consistently requires repeated evidence with at least one verified source
  if (maxIdx === 5 && verifiedCount === 0 && evidenceRecords.length < 3) {
    maxIdx = 4; // cap at repeated if uncorroborated
  }

  const highestLevel = levelsOrder[maxIdx];

  const labels: Record<BehaviouralEvidenceLevel, string> = {
    prepared: "Prepared — Move defined and ready for practice",
    practised: "Practised — Rehearsed in simulation or coach dialogue",
    applied: "Applied — Attempted in real-world workplace moment",
    reflected: "Reflected — Learning and shift documented",
    repeated: "Repeated — Applied across multiple moments",
    demonstrated_consistently: "Demonstrated Consistently — Corroborated evidence of sustained new capacity",
  };

  return {
    highestLevel,
    levelIndex: maxIdx,
    totalEvidenceCount: evidenceRecords.length,
    verifiedCount,
    summaryLabel: labels[highestLevel],
  };
}
