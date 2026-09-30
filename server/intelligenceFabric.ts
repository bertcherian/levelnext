import { desc } from "drizzle-orm";
import {
  intelligenceDecisionLogs,
  intelligenceModelRegistry,
} from "../drizzle/schema";
import { getDb } from "./db";
import { evaluateWithJev, isJevConfigured } from "./_core/jev";
import {
  deterministicInterventionFallback,
  INTELLIGENCE_MODEL_REGISTRY,
  normaliseConfidence,
  decisionRequirementSchema,
  type DecisionRequirements,
  type IntelligenceDecisionRequest,
  type IntelligenceDecisionResult,
} from "../shared/modules/intelligenceFabric";

const SENSITIVE_KEY = /(password|secret|token|email|phone|mobile|compensation|salary|medical|health|address|private|reflection|transcript)/i;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/g;

function redactText(value: string) {
  return value.replace(EMAIL, "[redacted-email]").replace(PHONE, "[redacted-phone]").slice(0, 1_200);
}

function minimiseState(value: unknown, depth = 0): unknown {
  if (depth > 2) return "[context-depth-limit]";
  if (typeof value === "string") return redactText(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((entry) => minimiseState(entry, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_KEY.test(key))
        .slice(0, 30)
        .map(([key, entry]) => [key, minimiseState(entry, depth + 1)]),
    );
  }
  return "[unsupported-context]";
}

function contextFields(state: unknown) {
  if (state && typeof state === "object" && !Array.isArray(state)) {
    return Object.keys(state).filter((key) => !SENSITIVE_KEY.test(key)).slice(0, 30);
  }
  return ["state.redacted"];
}

function confidenceFromAnswers(answers: Record<string, unknown>) {
  const values = Object.values(answers).map(normaliseConfidence).filter((value): value is number => value !== null);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function defaultRequirements(input?: Partial<DecisionRequirements>) {
  return decisionRequirementSchema.parse(input ?? {});
}

function fallbackResult(
  input: IntelligenceDecisionRequest,
  requirements: DecisionRequirements,
  reason: string,
  outcome: "deterministic_fallback" | "blocked" = "deterministic_fallback",
): IntelligenceDecisionResult {
  const fallback = input.fallbackDecision ?? deterministicInterventionFallback(input.state);
  return {
    outcome,
    provider: outcome === "blocked" ? "none" : "levelnext",
    model: outcome === "blocked" ? null : "deterministic-rules",
    tier: outcome === "blocked" ? 0 : 1,
    maturity: requirements.maturity,
    answers: fallback,
    confidence: null,
    latencyMs: 0,
    usage: { inputTokens: null, outputTokens: null },
    contextFields: contextFields(input.state),
    fallbackReason: reason,
    explanation: outcome === "blocked"
      ? "The policy gateway stopped this request before external processing."
      : "A deterministic LevelNext rule selected the safest available next step.",
  };
}

async function writeDecisionLog(userId: number | undefined, input: IntelligenceDecisionRequest, result: IntelligenceDecisionResult) {
  const db = await getDb();
  if (!db) return;
  await db.insert(intelligenceDecisionLogs).values({
    createdByUserId: userId ?? null,
    feature: input.feature,
    task: input.task,
    decisionClass: input.decisionClass,
    provider: result.provider,
    model: result.model,
    tier: result.tier,
    maturity: result.maturity,
    outcome: result.outcome,
    confidence: result.confidence,
    latencyMs: result.latencyMs,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    contextFields: result.contextFields,
    answer: result.answers,
    fallbackReason: result.fallbackReason,
    explanation: result.explanation,
  });
}

export async function runIntelligenceDecision(
  input: IntelligenceDecisionRequest,
  userId?: number,
): Promise<IntelligenceDecisionResult> {
  const requirements = defaultRequirements(input.requirements);
  const externalAllowed = requirements.allowExternalProvider && requirements.privacyClass === "standard";
  if (!externalAllowed) {
    const reason = requirements.privacyClass !== "standard"
      ? "External decisions are limited to standard privacy-class context."
      : "External providers are disabled for this decision.";
    const result = fallbackResult(input, requirements, reason, requirements.privacyClass !== "standard" ? "blocked" : "deterministic_fallback");
    await writeDecisionLog(userId, input, result);
    return result;
  }
  if (!isJevConfigured()) {
    const result = fallbackResult(input, requirements, "Jev is not configured; deterministic routing remains active.");
    await writeDecisionLog(userId, input, result);
    return result;
  }

  const startedAt = Date.now();
  try {
    const response = await evaluateWithJev({
      state: minimiseState(input.state) as string | Record<string, unknown> | unknown[],
      questions: input.questions,
      timeoutMs: Math.min(requirements.maxLatencyMs, 10_000),
    });
    const answers = response.answers as Record<string, unknown>;
    const result: IntelligenceDecisionResult = {
      outcome: "jev",
      provider: "typesafe",
      model: response.model,
      tier: 2,
      maturity: requirements.maturity,
      answers,
      confidence: confidenceFromAnswers(answers),
      latencyMs: Date.now() - startedAt,
      usage: {
        inputTokens: response.usage?.input_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
      },
      contextFields: contextFields(input.state),
      fallbackReason: null,
      explanation: "Jev returned typed decision signals; deterministic LevelNext policy remains responsible for whether to act.",
    };
    await writeDecisionLog(userId, input, result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Jev decision failed";
    const result = fallbackResult(input, requirements, message);
    result.latencyMs = Date.now() - startedAt;
    await writeDecisionLog(userId, input, result);
    return result;
  }
}

export async function getIntelligenceFabricStatus() {
  const db = await getDb();
  const recentDecisions = db
    ? await db.select().from(intelligenceDecisionLogs).orderBy(desc(intelligenceDecisionLogs.createdAt)).limit(20)
    : [];
  const registry = db
    ? await db.select().from(intelligenceModelRegistry).orderBy(intelligenceModelRegistry.tier, intelligenceModelRegistry.provider)
    : [];
  return {
    jev: {
      configured: isJevConfigured(),
      model: "jev-latest",
      endpoint: "https://api.typesafe.ai/v1/systemone",
      productionApproved: false,
      note: "Shadow/assisted evaluation only until calibration evidence is reviewed.",
    },
    registry: registry.length ? registry : INTELLIGENCE_MODEL_REGISTRY,
    recentDecisions,
  };
}
