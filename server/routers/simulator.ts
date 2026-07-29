import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { simSessions } from "../../drizzle/schema";

const PLATFORM_CONTEXT: Record<string, { label: string; coachingStyle: string; behaviourDimensions: string[] }> = {
  leadership: {
    label: "Leadership Intelligence",
    coachingStyle: "Executive coaching — focus on strategic influence, presence, and systemic thinking",
    behaviourDimensions: ["Executive Presence", "Strategic Clarity", "Emotional Regulation", "Influence & Persuasion", "Listening Quality"],
  },
  manager: {
    label: "Manager Effectiveness",
    coachingStyle: "Management coaching — focus on accountability, feedback quality, and team dynamics",
    behaviourDimensions: ["Clarity of Message", "Empathy & Tone", "Accountability Language", "Active Listening", "Outcome Focus"],
  },
  career: {
    label: "Career Transition Intelligence",
    coachingStyle: "Career coaching — focus on positioning, confidence, negotiation, and narrative",
    behaviourDimensions: ["Confidence & Presence", "Value Articulation", "Negotiation Skill", "Narrative Clarity", "Resilience Under Pressure"],
  },
  young: {
    label: "Young Talent Platform",
    coachingStyle: "Early career coaching — focus on communication, initiative, and professional presence",
    behaviourDimensions: ["Professional Communication", "Initiative & Proactivity", "Listening & Curiosity", "Clarity of Thought", "Confidence"],
  },
};

function extractContent(raw: string | Array<{ text?: string } | unknown>): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw.map((c: any) => c.text ?? "").join("");
  return "";
}

export const simulatorRouter = router({

  inferScenario: protectedProcedure
    .input(z.object({
      prompt: z.string().min(3).max(500),
      platform: z.enum(["leadership", "manager", "career", "young"]),
    }))
    .mutation(async ({ input }) => {
      const ctx_platform = PLATFORM_CONTEXT[input.platform];
      const result = await invokeLLM({
        model: "claude-haiku-4-5",
        messages: [
          {
            role: "system",
            content: `You are an AI scenario designer for a leadership practice simulator.
Platform: ${ctx_platform.label}
Coaching style: ${ctx_platform.coachingStyle}

Given a user's free-form description of a conversation they want to practise, generate a concise scenario summary.
Return ONLY valid JSON with this exact structure:
{
  "conversationType": "short label e.g. Salary Negotiation",
  "stakeholder": "who they are speaking with e.g. Your VP",
  "objective": "one sentence what the user wants to achieve",
  "expectedChallenge": "one sentence what resistance or difficulty to expect",
  "difficulty": 3,
  "estimatedMinutes": 6,
  "characterName": "first name of the AI character e.g. Priya",
  "characterStyle": "brief personality note e.g. Analytical, data-driven, asks probing questions",
  "followUpQuestion": null
}
difficulty is 1-5. estimatedMinutes is 4-10.
followUpQuestion: if you genuinely need one clarification, include a short question string. Otherwise null.`,
          },
          { role: "user", content: `I want to practise: "${input.prompt}"` },
        ],
      });

      try {
        const text = extractContent(result.choices[0].message.content ?? "{}");
        const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(clean);
        return {
          conversationType: parsed.conversationType ?? "Leadership Conversation",
          stakeholder: parsed.stakeholder ?? "Your counterpart",
          objective: parsed.objective ?? "Achieve a positive outcome",
          expectedChallenge: parsed.expectedChallenge ?? "Expect pushback and probing questions",
          difficulty: Math.min(5, Math.max(1, parsed.difficulty ?? 3)),
          estimatedMinutes: Math.min(10, Math.max(4, parsed.estimatedMinutes ?? 6)),
          characterName: parsed.characterName ?? "Alex",
          characterStyle: parsed.characterStyle ?? "Professional and direct",
          followUpQuestion: parsed.followUpQuestion ?? null,
        };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not generate scenario" });
      }
    }),

  startSession: protectedProcedure
    .input(z.object({
      platform: z.enum(["leadership", "manager", "career", "young"]),
      userPrompt: z.string(),
      conversationType: z.string(),
      stakeholder: z.string(),
      objective: z.string(),
      expectedChallenge: z.string(),
      difficulty: z.number().int().min(1).max(5),
      estimatedMinutes: z.number().int().min(4).max(10),
      characterName: z.string(),
      characterStyle: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const ctx_platform = PLATFORM_CONTEXT[input.platform];

      const openingResult = await invokeLLM({
        model: "claude-haiku-4-5",
        messages: [
          {
            role: "system",
            content: `You are ${input.characterName}, a realistic character in a leadership practice simulation.
Character style: ${input.characterStyle}
Scenario: ${input.conversationType}
Objective the user wants to achieve: ${input.objective}
Expected challenge: ${input.expectedChallenge}
Platform context: ${ctx_platform.coachingStyle}

Write a single opening line (1-2 sentences) as ${input.characterName} to begin the conversation.
Be realistic, slightly challenging, and in character. Do not break the fourth wall.`,
          },
          { role: "user", content: "Begin." },
        ],
      });

      const opening = extractContent(openingResult.choices[0].message.content ?? "Hi, I'm ready when you are.");
      const now = Date.now();
      const messages: Array<{ role: "user" | "assistant"; content: string; timestamp: number }> = [
        { role: "assistant", content: opening, timestamp: now },
      ];

      const result = await db.insert(simSessions).values({
        userId: ctx.user.id,
        platform: input.platform,
        userPrompt: input.userPrompt,
        conversationType: input.conversationType,
        stakeholder: input.stakeholder,
        objective: input.objective,
        expectedChallenge: input.expectedChallenge,
        difficulty: input.difficulty,
        estimatedMinutes: input.estimatedMinutes,
        characterName: input.characterName,
        characterStyle: input.characterStyle,
        messages,
        status: "active",
      }).$returningId();

      const sessionId = result[0].id;
      return { sessionId, opening };
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number().int(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(simSessions).where(eq(simSessions.id, input.sessionId)).limit(1);
      const session = rows[0];
      if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (session.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Session already completed" });

      const ctx_platform = PLATFORM_CONTEXT[session.platform as string] ?? PLATFORM_CONTEXT.leadership;
      const existingMessages = (session.messages ?? []) as Array<{ role: "user" | "assistant"; content: string; timestamp: number }>;
      const now = Date.now();
      const updatedMessages: Array<{ role: "user" | "assistant"; content: string; timestamp: number }> = [
        ...existingMessages,
        { role: "user", content: input.message, timestamp: now },
      ];

      const llmMessages = [
        {
          role: "system" as const,
          content: `You are ${session.characterName}, a realistic character in a leadership practice simulation.
Character style: ${session.characterStyle}
Scenario: ${session.conversationType}
Objective the user wants to achieve: ${session.objective}
Expected challenge: ${session.expectedChallenge}
Platform context: ${ctx_platform.coachingStyle}
Difficulty level: ${session.difficulty}/5

Stay in character throughout. Be realistic, occasionally challenging, and human.
Do not provide coaching feedback. Just respond as ${session.characterName} would.
Keep responses concise (2-4 sentences).`,
        },
        ...existingMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: input.message },
      ];

      const replyResult = await invokeLLM({ model: "claude-haiku-4-5", messages: llmMessages });
      const reply = extractContent(replyResult.choices[0].message.content ?? "I see. Go on.");
      const finalMessages: Array<{ role: "user" | "assistant"; content: string; timestamp: number }> = [
        ...updatedMessages,
        { role: "assistant", content: reply, timestamp: Date.now() },
      ];

      await db.update(simSessions).set({ messages: finalMessages }).where(eq(simSessions.id, input.sessionId));
      return { reply };
    }),

  endSession: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(simSessions).where(eq(simSessions.id, input.sessionId)).limit(1);
      const session = rows[0];
      if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });

      const ctx_platform = PLATFORM_CONTEXT[session.platform as string] ?? PLATFORM_CONTEXT.leadership;
      const messages = (session.messages ?? []) as Array<{ role: "user" | "assistant"; content: string; timestamp: number }>;
      const userTurns = messages.filter(m => m.role === "user").map(m => m.content).join("\n\n");

      const debriefResult = await invokeLLM({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a world-class executive coach providing a post-session debrief for a leadership practice simulation.
Platform: ${ctx_platform.label}
Scenario: ${session.conversationType}
Objective: ${session.objective}
Behaviour dimensions to score: ${ctx_platform.behaviourDimensions.join(", ")}

Analyse the user's messages and return ONLY valid JSON:
{
  "overallScore": 72,
  "behaviourScores": [
    { "label": "Executive Presence", "score": 7, "max": 10 }
  ],
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "improvements": ["Specific improvement 1", "Specific improvement 2"],
  "coachingInsights": [
    { "moment": "When you said X", "tryInstead": "Try saying Y instead" }
  ],
  "keyTakeaway": "One sentence the user should remember from this session."
}
Be specific, honest, and constructive. Reference actual things the user said.`,
          },
          { role: "user", content: `User's messages:\n\n${userTurns || "(No messages yet)"}` },
        ],
      });

      try {
        const text = extractContent(debriefResult.choices[0].message.content ?? "{}");
        const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const debrief = JSON.parse(clean);

        await db.update(simSessions).set({
          status: "completed",
          overallScore: debrief.overallScore,
          behaviourScores: debrief.behaviourScores,
          strengths: debrief.strengths,
          improvements: debrief.improvements,
          coachingInsights: debrief.coachingInsights,
          keyTakeaway: debrief.keyTakeaway,
          completedAt: new Date(),
        }).where(eq(simSessions.id, input.sessionId));

        return { debrief, sessionId: input.sessionId };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not generate debrief" });
      }
    }),

  getSession: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(simSessions).where(eq(simSessions.id, input.sessionId)).limit(1);
      const session = rows[0];
      if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),

  generateActionPlan: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(simSessions).where(eq(simSessions.id, input.sessionId)).limit(1);
      const session = rows[0];
      if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (session.status !== "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Session not yet completed" });

      const ctx_platform = PLATFORM_CONTEXT[session.platform as string] ?? PLATFORM_CONTEXT.leadership;
      const behaviourScores = (session.behaviourScores ?? []) as Array<{ label: string; score: number; max: number }>;
      const improvements = (session.improvements ?? []) as string[];
      const coachingInsights = (session.coachingInsights ?? []) as Array<{ moment: string; tryInstead: string }>;
      const strengths = (session.strengths ?? []) as string[];

      const result = await invokeLLM({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a world-class executive coach creating a personalised action plan after a practice simulation debrief.
Platform: ${ctx_platform.label}
Scenario: ${session.conversationType}
Objective: ${session.objective}

Based on the debrief data below, create a concise, actionable 7-day practice plan.
Return ONLY valid JSON with this exact structure:
{
  "headline": "Short motivating headline for the plan (e.g. 'Your 7-Day Executive Presence Sprint')",
  "summary": "2-3 sentence personalised summary of what this plan addresses and why it matters for them",
  "actions": [
    {
      "day": "Day 1–2",
      "title": "Short action title",
      "description": "Specific, concrete action they can take. Reference their actual behaviour from the session.",
      "category": "practice" | "reflection" | "reading" | "conversation"
    }
  ],
  "weeklyCommitment": "One sentence on the minimum weekly commitment (e.g. '15 minutes daily')",
  "successIndicator": "How they will know they have improved — one concrete, observable behaviour"
}
Generate 4–5 actions. Be specific, honest, and reference actual things from the debrief. Avoid generic advice.`,
          },
          {
            role: "user",
            content: `Debrief data:

Overall score: ${session.overallScore}/100
Key takeaway: ${session.keyTakeaway ?? "N/A"}

Behaviour scores:\n${behaviourScores.map(b => `- ${b.label}: ${b.score}/${b.max}`).join("\n")}

Strengths:\n${strengths.map(s => `- ${s}`).join("\n")}

Areas to develop:\n${improvements.map(s => `- ${s}`).join("\n")}

Coaching insights:\n${coachingInsights.map(c => `- Said: "${c.moment}" → Try: "${c.tryInstead}"`).join("\n")}`,
          },
        ],
      });

      try {
        const text = extractContent(result.choices[0].message.content ?? "{}");
        const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const plan = JSON.parse(clean);
        return {
          headline: plan.headline ?? "Your Personalised Practice Plan",
          summary: plan.summary ?? "",
          actions: (plan.actions ?? []) as Array<{ day: string; title: string; description: string; category: string }>,
          weeklyCommitment: plan.weeklyCommitment ?? "",
          successIndicator: plan.successIndicator ?? "",
        };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not generate action plan" });
      }
    }),

  listSessions: protectedProcedure
    .input(z.object({ platform: z.enum(["leadership", "manager", "career", "young"]).optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(simSessions)
        .where(eq(simSessions.userId, ctx.user.id))
        .orderBy(desc(simSessions.createdAt))
        .limit(20);
      if (input.platform) return rows.filter(r => r.platform === input.platform);
      return rows;
    }),
});
