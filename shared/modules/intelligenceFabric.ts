import { z } from "zod";

export const INTELLIGENCE_TIERS = [0, 1, 2, 3, 4, 5, 6] as const;
export type IntelligenceTier = (typeof INTELLIGENCE_TIERS)[number];

export const DECISION_CLASSES = [
  "classification",
  "prioritisation",
  "intervention_selection",
  "engagement_risk",
  "difficulty",
  "routing",
  "confidence",
  "evidence_classification",
  "escalation",
  "model_selection",
  "completion_assessment",
  "tool_guarding",
] as const;
export type DecisionClass = (typeof DECISION_CLASSES)[number];

export const DECISION_MATURITY_LEVELS = ["D0", "D1", "D2", "D3", "D4"] as const;
export type DecisionMaturity = (typeof DECISION_MATURITY_LEVELS)[number];

export const PRIVACY_CLASSES = ["public", "standard", "internal_restricted", "sensitive"] as const;
export type PrivacyClass = (typeof PRIVACY_CLASSES)[number];

export const DECISION_OUTCOMES = ["jev", "deterministic_fallback", "blocked", "error"] as const;
export type DecisionOutcome = (typeof DECISION_OUTCOMES)[number];

export const jevNoulQuestionSchema = z.object({
  type: z.literal("noul"),
  instructions: z.union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())]),
  criteria: z.object({ true: z.unknown().optional(), false: z.unknown().optional() }).optional(),
});

export const jevChoiceQuestionSchema = z.object({
  type: z.literal("choice"),
  instructions: z.union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())]),
  criteria: z.record(z.string(), z.unknown()),
});

export const jevScoreQuestionSchema = z.object({
  type: z.literal("score"),
  instructions: z.union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())]),
  criteria: z.array(z.unknown()).min(2).max(10),
});

export const jevQuestionSchema = z.discriminatedUnion("type", [
  jevNoulQuestionSchema,
  jevChoiceQuestionSchema,
  jevScoreQuestionSchema,
]);
export type JevQuestion = z.infer<typeof jevQuestionSchema>;

export const decisionRequirementSchema = z.object({
  qualityFloor: z.number().min(0).max(100).default(70),
  maxLatencyMs: z.number().int().positive().max(60_000).default(2_000),
  maxCostUsd: z.number().nonnegative().max(100).default(0.01),
  privacyClass: z.enum(PRIVACY_CLASSES).default("standard"),
  allowExternalProvider: z.boolean().default(false),
  maturity: z.enum(DECISION_MATURITY_LEVELS).default("D0"),
});
export type DecisionRequirements = z.infer<typeof decisionRequirementSchema>;

export const intelligenceDecisionRequestSchema = z.object({
  feature: z.string().trim().min(1).max(100),
  task: z.string().trim().min(1).max(160),
  decisionClass: z.enum(DECISION_CLASSES),
  state: z.union([z.string().trim().min(1).max(12_000), z.record(z.string(), z.unknown()), z.array(z.unknown())]),
  questions: z.record(z.string(), jevQuestionSchema),
  requirements: decisionRequirementSchema.optional(),
  fallbackDecision: z.record(z.string(), z.unknown()).optional(),
});
export type IntelligenceDecisionRequest = z.infer<typeof intelligenceDecisionRequestSchema>;

export type IntelligenceDecisionResult = {
  outcome: DecisionOutcome;
  provider: "typesafe" | "levelnext" | "none";
  model: string | null;
  tier: IntelligenceTier;
  maturity: DecisionMaturity;
  answers: Record<string, unknown>;
  confidence: number | null;
  latencyMs: number;
  usage: { inputTokens: number | null; outputTokens: number | null };
  contextFields: string[];
  fallbackReason: string | null;
  explanation: string;
};

export type ModelRegistryEntry = {
  provider: string;
  model: string;
  deploymentType: "managed_api" | "platform_gateway" | "self_hosted";
  ownership: "open_weight" | "proprietary" | "decision_model";
  tier: IntelligenceTier;
  privacyClass: PrivacyClass;
  costNote: string;
  latencyNote: string;
  capabilities: string[];
  productionApproved: boolean;
};

export const INTELLIGENCE_MODEL_REGISTRY: ModelRegistryEntry[] = [
  {
    provider: "levelnext",
    model: "deterministic-rules",
    deploymentType: "platform_gateway",
    ownership: "proprietary",
    tier: 1,
    privacyClass: "sensitive",
    costNote: "No model cost",
    latencyNote: "Sub-second",
    capabilities: ["routing", "release gates", "privacy enforcement", "scoring"],
    productionApproved: true,
  },
  {
    provider: "typesafe",
    model: "jev-latest",
    deploymentType: "managed_api",
    ownership: "decision_model",
    tier: 2,
    privacyClass: "standard",
    costNote: "Provider usage pricing applies",
    latencyNote: "Designed for fast structured decisions",
    capabilities: ["choice", "score", "noul", "classification", "routing", "confidence"],
    productionApproved: false,
  },
  {
    provider: "manus-forge",
    model: "gpt-5-mini",
    deploymentType: "platform_gateway",
    ownership: "proprietary",
    tier: 3,
    privacyClass: "standard",
    costNote: "Platform model usage applies",
    latencyNote: "Low to moderate",
    capabilities: ["structured generation", "classification", "summarisation"],
    productionApproved: true,
  },
  {
    provider: "manus-forge",
    model: "claude-haiku-4-5",
    deploymentType: "platform_gateway",
    ownership: "proprietary",
    tier: 5,
    privacyClass: "standard",
    costNote: "Platform model usage applies",
    latencyNote: "Low to moderate",
    capabilities: ["coaching", "simulation", "structured generation"],
    productionApproved: true,
  },
  {
    provider: "openrouter",
    model: "qwen/qwen3-30b-a3b",
    deploymentType: "managed_api",
    ownership: "open_weight",
    tier: 3,
    privacyClass: "standard",
    costNote: "External provider pricing applies",
    latencyNote: "Requires separate provider validation",
    capabilities: ["generation", "model comparison"],
    productionApproved: false,
  },
];

export const INTERVENTION_OPTIONS = {
  do_nothing: "No intervention; continue observing",
  reflection: "Ask one focused reflection question",
  commitment: "Create a specific real-world commitment",
  practice: "Offer a short Behaviour Rep",
  simulation: "Offer a realistic conversation simulation",
  human_support: "Recommend human coach or manager support",
} as const;

export function deterministicInterventionFallback(state: unknown): { intervention: keyof typeof INTERVENTION_OPTIONS; reason: string } {
  const text = typeof state === "string" ? state.toLowerCase() : JSON.stringify(state).toLowerCase();
  if (/(safety|harass|threat|self-harm|discriminat)/.test(text)) {
    return { intervention: "human_support", reason: "Potential safety or sensitive-risk language requires human judgement." };
  }
  if (/(avoid|putting off|defensive|conflict|difficult conversation)/.test(text)) {
    return { intervention: "simulation", reason: "The state indicates an upcoming high-friction conversation." };
  }
  if (/(deadline|overdue|missed|stalled|blocked)/.test(text)) {
    return { intervention: "commitment", reason: "The state indicates a need for a concrete next action and date." };
  }
  if (/(practice|rehearse|role-play)/.test(text)) {
    return { intervention: "practice", reason: "The state explicitly points to rehearsal." };
  }
  return { intervention: "reflection", reason: "A focused question is the least intrusive next step." };
}

export function normaliseConfidence(answer: unknown): number | null {
  if (!answer || typeof answer !== "object") return null;
  const value = (answer as { confidence?: unknown }).confidence;
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null;
}
