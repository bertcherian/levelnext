import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { modelEvaluations, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { modelEvaluationRouter } from "./modelEvaluation";
import type { TrpcContext } from "../_core/context";

let createdEvaluationId: number | null = null;

afterEach(async () => {
  if (!createdEvaluationId) return;
  const db = await getDb();
  await db?.delete(modelEvaluations).where(eq(modelEvaluations.id, createdEvaluationId));
  createdEvaluationId = null;
});

function contextFor(user: typeof users.$inferSelect): TrpcContext {
  return {
    user,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("model evaluator end-to-end workflow", () => {
  it.runIf(Boolean(process.env.DATABASE_URL && process.env.OPENROUTER_API_KEY && process.env.BUILT_IN_FORGE_API_KEY))(
    "runs both models, saves a reviewer choice, and retrieves the persisted evaluation",
    async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable for evaluator integration test");
      const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
      if (!admin) throw new Error("No admin user is available for evaluator integration test");

      const caller = modelEvaluationRouter.createCaller(contextFor(admin));
      const evaluation = await caller.run({
        systemPrompt: "You are a service health check. Reply with exactly OK.",
        userPrompt: "OK",
        maxTokens: 64,
        temperature: 0,
      });
      createdEvaluationId = evaluation.id;

      expect(evaluation.status).toBe("completed");
      expect(evaluation.claudeResponse?.length).toBeGreaterThan(0);
      expect(evaluation.qwenResponse?.length).toBeGreaterThan(0);

      const reviewed = await caller.review({
        evaluationId: evaluation.id,
        preferredModel: "tie",
        reviewScores: { clarity: 5, usefulness: 5, leadershipTone: 5 },
        reviewerNote: "Automated integration validation.",
      });

      expect(reviewed.preferredModel).toBe("tie");
      expect(reviewed.reviewScores).toEqual({ clarity: 5, usefulness: 5, leadershipTone: 5 });

      const recent = await caller.list({ limit: 5 });
      expect(recent.some((record) => record.id === evaluation.id)).toBe(true);
    },
    120_000
  );
});
