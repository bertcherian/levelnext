import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dailyMissions, users, type LeadershipGraph } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

export const missionRouter = router({
  // Get today's missions for the current user
  today: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return db
      .select()
      .from(dailyMissions)
      .where(eq(dailyMissions.userId, ctx.user.id))
      .orderBy(desc(dailyMissions.createdAt))
      .limit(5);
  }),

  // Generate a new daily mission using the Leadership Graph
  generate: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const userResult = await db
      .select({ leadershipGraph: users.leadershipGraph, name: users.name })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    const graph = (userResult[0]?.leadershipGraph as LeadershipGraph) ?? null;
    const userName = userResult[0]?.name ?? "Leader";

    const prompt = `
You are Guide, an AI leadership coach inside LevelNext.

Generate ONE specific, practical leadership Mission for ${userName} based on their profile:
${graph ? `
- Composite Edge: ${graph.compositeEdge ?? "Not assessed"}/100
- Completed Modules: ${(graph.completedModules ?? []).join(", ") || "None"}
- Growth Areas: ${(graph.growthOpportunities ?? []).join(", ") || "General leadership"}
` : "No diagnostic data yet — create a foundational leadership mission."}

The Mission must:
1. Be completable in 30-60 minutes today
2. Be specific and actionable (not vague)
3. Target a real leadership behaviour (communication, influence, presence, etc.)
4. Use language like "Mission:", never "Task:" or "Exercise:"

Respond with ONLY a JSON object:
{
  "title": "Short mission title (max 8 words)",
  "description": "Specific instructions for completing this mission today (2-3 sentences)",
  "moduleType": "ECI" | "LII" | "GCC" | "GENERAL"
}
`.trim();

    let missionData: { title: string; description: string; moduleType: string } = {
      title: "Practise executive presence today",
      description: "In your next meeting, speak last on at least one agenda item. Observe how others respond when you hold back and then offer a clear, considered perspective.",
      moduleType: "GENERAL",
    };

    try {
      const result = await invokeLLM({
        model: "claude-haiku-4-5",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 300,
        responseFormat: { type: "json_object" },
      });

      const rawContent = result?.choices?.[0]?.message?.content ?? "";
      const content = typeof rawContent === "string" ? rawContent : "";

      if (content) {
        const parsed = JSON.parse(content);
        if (parsed?.title && parsed?.description) {
          missionData = parsed;
        }
      }
    } catch (llmErr) {
      console.warn("[mission.generate] LLM call failed, using default mission:", llmErr);
    }

    const [mission] = await db
      .insert(dailyMissions)
      .values({
        userId: ctx.user.id,
        moduleType: (missionData.moduleType as any) ?? "GENERAL",
        title: missionData.title,
        description: missionData.description,
      })
      .$returningId();

    return { id: mission.id, ...missionData };
  }),

  // Update mission status
  updateStatus: protectedProcedure
    .input(z.object({ missionId: z.number(), status: z.enum(["pending", "in_progress", "complete"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(dailyMissions)
        .set({
          status: input.status,
          completedAt: input.status === "complete" ? new Date() : undefined,
        })
        .where(and(eq(dailyMissions.id, input.missionId), eq(dailyMissions.userId, ctx.user.id)));
      return { updated: true };
    }),
});
