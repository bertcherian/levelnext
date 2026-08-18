import { TRPCError } from "@trpc/server";
import { desc, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import {
  modelEvaluations,
  type ModelEvaluationScores,
  type ModelEvaluationUsage,
} from "../../drizzle/schema";
import { invokeLLM, type InvokeResult } from "../_core/llm";
import { invokeQwenComparison, QWEN_AB_MODEL_ID } from "../_core/openRouter";
import { getDb } from "../db";
import { adminProcedure, router } from "../_core/trpc";
import { buildModelEvaluationDashboard } from "../modelEvaluationAnalytics";

const CLAUDE_AB_MODEL_ID = "claude-haiku-4-5";

type CapturedModelResult = {
  model: string;
  content: string | null;
  error: string | null;
  latencyMs: number;
  usage: ModelEvaluationUsage | null;
};

function toTextContent(result: InvokeResult): string {
  const content = result.choices[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();
  }
  return "";
}

function toSafeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown inference failure";
  return message.slice(0, 500);
}

export function comparisonStatus(claudeContent: string | null, qwenContent: string | null) {
  return claudeContent && qwenContent ? "completed" : "partial";
}

async function captureClaude(input: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
}): Promise<CapturedModelResult> {
  const startedAt = Date.now();
  try {
    const result = await invokeLLM({
      model: CLAUDE_AB_MODEL_ID,
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt },
      ],
      maxTokens: input.maxTokens,
      temperature: input.temperature,
    });
    const content = toTextContent(result);
    if (!content) throw new Error("Claude inference returned no text content");

    return {
      model: result.model || CLAUDE_AB_MODEL_ID,
      content,
      error: null,
      latencyMs: Date.now() - startedAt,
      usage: result.usage
        ? {
            promptTokens: result.usage.prompt_tokens ?? null,
            completionTokens: result.usage.completion_tokens ?? null,
            totalTokens: result.usage.total_tokens ?? null,
          }
        : null,
    };
  } catch (error) {
    return {
      model: CLAUDE_AB_MODEL_ID,
      content: null,
      error: toSafeError(error),
      latencyMs: Date.now() - startedAt,
      usage: null,
    };
  }
}

async function captureQwen(input: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
}): Promise<CapturedModelResult> {
  const startedAt = Date.now();
  try {
    const result = await invokeQwenComparison(input);
    return {
      model: result.model,
      content: result.content,
      error: null,
      latencyMs: Date.now() - startedAt,
      usage: result.usage,
    };
  } catch (error) {
    return {
      model: QWEN_AB_MODEL_ID,
      content: null,
      error: toSafeError(error),
      latencyMs: Date.now() - startedAt,
      usage: null,
    };
  }
}

const runInput = z.object({
  systemPrompt: z.string().trim().min(1).max(8_000),
  userPrompt: z.string().trim().min(1).max(12_000),
  maxTokens: z.number().int().min(64).max(2_000).default(700),
  temperature: z.number().min(0).max(1).default(0.3),
});

const reviewInput = z.object({
  evaluationId: z.number().int().positive(),
  preferredModel: z.enum(["claude", "qwen", "tie", "neither"]),
  reviewScores: z.object({
    clarity: z.number().int().min(1).max(5),
    usefulness: z.number().int().min(1).max(5),
    leadershipTone: z.number().int().min(1).max(5),
  }),
  reviewerNote: z.string().trim().max(4_000).optional(),
});

export const modelEvaluationRouter = router({
  run: adminProcedure.input(runInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [claude, qwen] = await Promise.all([captureClaude(input), captureQwen(input)]);
    const status = comparisonStatus(claude.content, qwen.content);

    const [created] = await db.insert(modelEvaluations).values({
      createdByUserId: ctx.user.id,
      systemPrompt: input.systemPrompt,
      userPrompt: input.userPrompt,
      maxTokens: input.maxTokens,
      temperature: input.temperature,
      status,
      claudeModel: claude.model,
      claudeResponse: claude.content,
      claudeError: claude.error,
      claudeLatencyMs: claude.latencyMs,
      claudeUsage: claude.usage,
      qwenModel: qwen.model,
      qwenResponse: qwen.content,
      qwenError: qwen.error,
      qwenLatencyMs: qwen.latencyMs,
      qwenUsage: qwen.usage,
    }).$returningId();

    const [evaluation] = await db.select().from(modelEvaluations).where(eq(modelEvaluations.id, created.id)).limit(1);
    if (!evaluation) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Evaluation could not be saved" });
    return evaluation;
  }),

  list: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(12) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db.select().from(modelEvaluations).orderBy(desc(modelEvaluations.createdAt)).limit(input?.limit ?? 12);
    }),

  dashboard: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const evaluations = await db.select().from(modelEvaluations);
    return buildModelEvaluationDashboard(evaluations);
  }),

  exportReviewed: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db.select().from(modelEvaluations)
      .where(isNotNull(modelEvaluations.reviewedAt))
      .orderBy(desc(modelEvaluations.reviewedAt))
      .limit(10_000);
  }),

  review: adminProcedure.input(reviewInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [existing] = await db.select({ id: modelEvaluations.id }).from(modelEvaluations).where(eq(modelEvaluations.id, input.evaluationId)).limit(1);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Evaluation not found" });

    const reviewScores: ModelEvaluationScores = input.reviewScores;
    await db.update(modelEvaluations).set({
      preferredModel: input.preferredModel,
      reviewScores,
      reviewerNote: input.reviewerNote ?? null,
      reviewedByUserId: ctx.user.id,
      reviewedAt: new Date(),
    }).where(eq(modelEvaluations.id, input.evaluationId));

    const [evaluation] = await db.select().from(modelEvaluations).where(eq(modelEvaluations.id, input.evaluationId)).limit(1);
    if (!evaluation) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Evaluation could not be updated" });
    return evaluation;
  }),
});
