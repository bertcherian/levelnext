import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { guideConversations, users, type GuideMessage, type LeadershipGraph } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

const GUIDE_SYSTEM_PROMPT = (graph: LeadershipGraph | null, userName: string) => `
You are Guide — the personal AI leadership coach inside LevelNext, The Leadership Intelligence Platform.

Your role is to help ${userName} grow their leadership Edge through practical, personalised coaching conversations.

LEADERSHIP PROFILE:
${graph ? `
- Composite Edge: ${graph.compositeEdge ?? "Not yet assessed"}/100
- Completed Modules: ${(graph.completedModules ?? []).join(", ") || "None yet"}
- Module Edges: ${JSON.stringify(graph.moduleEdges ?? {})}
- Archetypes: ${JSON.stringify(graph.archetypes ?? {})}
- Key Strengths: ${(graph.strengths ?? []).join(", ") || "To be discovered through diagnostics"}
- Growth Opportunities: ${(graph.growthOpportunities ?? []).join(", ") || "To be discovered through diagnostics"}
` : "No diagnostic data yet — encourage the leader to complete their first diagnostic."}

COACHING PRINCIPLES:
1. Be direct, practical, and executive in tone — never generic or classroom-like
2. Reference the leader's actual profile data when giving advice
3. Suggest specific, actionable "Missions" — short leadership practices for today or this week
4. Never use the words: score, assessment, test, training, course, module, bot, chatbot, weakness, failure
5. Always use: Edge, Insight, Mission, Growth, Capability, Influence, Progress
6. Keep responses concise — 2-4 paragraphs maximum unless asked for depth
7. End with a question or a suggested Mission to maintain momentum
8. You are a trusted advisor, not a cheerleader — be honest when growth is needed

Respond in a warm, executive, and confident tone.
`.trim();

export const guideRouter = router({
  // Get or create a conversation for the current user
  getConversation: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { id: null, messages: [] };

    const result = await db
      .select()
      .from(guideConversations)
      .where(eq(guideConversations.userId, ctx.user.id))
      .orderBy(desc(guideConversations.updatedAt))
      .limit(1);

    if (result[0]) {
      return { id: result[0].id, messages: result[0].messages as GuideMessage[] };
    }

    // Create a new conversation
    const [conv] = await db
      .insert(guideConversations)
      .values({ userId: ctx.user.id, messages: [] })
      .$returningId();

    return { id: conv.id, messages: [] as GuideMessage[] };
  }),

  // Send a message to Guide and get a response
  sendMessage: protectedProcedure
    .input(z.object({ message: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get user's Leadership Graph
      const userResult = await db
        .select({ leadershipGraph: users.leadershipGraph, name: users.name })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const graph = (userResult[0]?.leadershipGraph as LeadershipGraph) ?? null;
      const userName = userResult[0]?.name ?? "Leader";

      // Get or create conversation
      let conversation = await db
        .select()
        .from(guideConversations)
        .where(eq(guideConversations.userId, ctx.user.id))
        .orderBy(desc(guideConversations.updatedAt))
        .limit(1);

      let convId: number;
      let messages: GuideMessage[] = [];

      if (conversation[0]) {
        convId = conversation[0].id;
        messages = conversation[0].messages as GuideMessage[];
      } else {
        const [conv] = await db
          .insert(guideConversations)
          .values({ userId: ctx.user.id, messages: [] })
          .$returningId();
        convId = conv.id;
      }

      // Add user message
      const userMessage: GuideMessage = {
        role: "user",
        content: input.message,
        timestamp: new Date().toISOString(),
      };
      messages = [...messages, userMessage];

      // Build LLM messages (keep last 10 for context)
      const recentMessages = messages.slice(-10);
      const llmMessages = recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Call the LLM — prepend system prompt as a system message
      const systemMsg = { role: "system" as const, content: GUIDE_SYSTEM_PROMPT(graph, userName) };
      const llmResult = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [systemMsg, ...llmMessages],
        maxTokens: 800,
      });
      const rawContent = llmResult.choices[0]?.message?.content ?? "I'm here to help. What's on your mind?";
      const response = typeof rawContent === "string" ? rawContent : rawContent.map((c: any) => c.text ?? "").join("");

      const assistantMessage: GuideMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };
      messages = [...messages, assistantMessage];

      // Save updated conversation
      await db
        .update(guideConversations)
        .set({ messages })
        .where(eq(guideConversations.id, convId));

      return { message: assistantMessage, conversationId: convId };
    }),

  // Clear conversation history
  clearConversation: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db
      .update(guideConversations)
      .set({ messages: [] })
      .where(eq(guideConversations.userId, ctx.user.id));
    return { cleared: true };
  }),
});
