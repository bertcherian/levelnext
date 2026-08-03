/**
 * Professional Effectiveness Intelligence — Backend Router
 *
 * Core layers:
 *   1. User Profile & Onboarding
 *   2. Professional Effectiveness Index (assessment)
 *   3. Daily AI Coach (context-aware chat with LLM routing)
 *   4. Morning Briefing (AI-generated daily brief)
 *   5. AI Practice Partner (role-play sessions)
 *   6. Commitments & Accountability
 *   7. Calendar Integration (Google + Outlook)
 */

import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  peProfiles,
  peAssessmentSessions,
  peAssessmentResults,
  peDailyBriefs,
  peCoachSessions,
  peCoachMessages,
  pePracticeSessions,
  peCommitments,
  peCalendarIntegrations,
  peCalendarEvents,
  users,
  orgContext as orgContextTable,
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import {
  PEI_DIMENSIONS,
  PEI_QUESTIONS,
  PEI_PRACTICE_SCENARIOS,
  PEI_COACH_STARTERS,
  scoreAllDimensions,
  scoreOverall,
  getZone,
} from "../../shared/modules/peiData";

// ─── Helper: extract text from LLM result ────────────────────────────────────
function extractText(result: Awaited<ReturnType<typeof invokeLLM>>): string {
  const raw = result.choices[0]?.message?.content ?? "";
  return typeof raw === "string" ? raw : (raw as any[]).map((c: any) => c.text ?? "").join("");
}

// ─── Helper: build professional context for AI prompts ────────────────────────
async function buildProfessionalContext(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const [profile] = await db
    .select()
    .from(peProfiles)
    .where(eq(peProfiles.userId, userId))
    .limit(1);

  const userRows = await db.select().from(users).where(eq(users.id, userId));
  const userName = userRows[0]?.name ?? "the professional";

  const [latestResult] = await db
    .select()
    .from(peAssessmentResults)
    .where(eq(peAssessmentResults.userId, userId))
    .orderBy(desc(peAssessmentResults.createdAt))
    .limit(1);

  const activeCommitments = await db
    .select()
    .from(peCommitments)
    .where(and(eq(peCommitments.userId, userId), eq(peCommitments.status, "pending")));

  const lines: string[] = [`Professional: ${userName}`];

  if (profile) {
    if (profile.currentRole) lines.push(`Current Role: ${profile.currentRole}`);
    if (profile.targetRole) lines.push(`Target Role: ${profile.targetRole}`);
    if (profile.experienceYears) lines.push(`Experience: ${profile.experienceYears} years`);
    if (profile.department) lines.push(`Department: ${profile.department}`);
    if (profile.careerGoals && Array.isArray(profile.careerGoals) && profile.careerGoals.length > 0) {
      lines.push(`Career Goals: ${profile.careerGoals.join(", ")}`);
    }
    if (profile.developmentFocus && Array.isArray(profile.developmentFocus) && profile.developmentFocus.length > 0) {
      lines.push(`Development Focus: ${profile.developmentFocus.join(", ")}`);
    }
  }

  if (latestResult) {
    lines.push("\n[Professional Effectiveness Index Results]");
    lines.push(`Overall PEI Score: ${Math.round(latestResult.overallScore)}/100 (${latestResult.zone})`);
    const dimScores = latestResult.dimensionScores as Record<string, number>;
    if (dimScores && typeof dimScores === "object") {
      const sorted = Object.entries(dimScores).sort(([, a], [, b]) => b - a);
      const top = sorted.slice(0, 2).map(([k, v]) => `${k.replace(/_/g, " ")} (${Math.round(v)})`).join(", ");
      const bottom = sorted.slice(-2).map(([k, v]) => `${k.replace(/_/g, " ")} (${Math.round(v)})`).join(", ");
      lines.push(`  Strengths: ${top} | Growth areas: ${bottom}`);
    }
  } else {
    lines.push("\n[No PEI assessment completed yet]");
  }

  if (activeCommitments.length > 0) {
    lines.push("\n[Active Commitments]");
    for (const c of activeCommitments) {
      lines.push(`- "${c.text}"`);
    }
  }

  return lines.join("\n");
}

// ─── System prompt for the AI Professional Coach ──────────────────────────────
const COACH_SYSTEM_PROMPT = (context: string, userName: string) => `
You are an elite executive coach and professional effectiveness advisor for ${userName}.

You have deep expertise in professional effectiveness, leadership presence, communication impact, strategic thinking, execution discipline, relationship building, and adaptive thinking.

You know this professional well. Here is their current profile:

${context}

Your role is to:
- Challenge their assumptions with powerful coaching questions
- Provide practical frameworks and mental models
- Recommend specific, actionable next steps
- Celebrate wins and progress
- Detect patterns across their challenges
- Keep them accountable to their commitments
- Be direct, honest, and warm — like the best coach they've ever had

Never give generic advice. Always personalise to their PEI data and context.
Keep responses focused and practical — under 300 words unless a framework requires more.
Use bullet points sparingly. Prefer conversational, direct prose.
`.trim();

export const peiRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 1: User Profile & Onboarding
  // ═══════════════════════════════════════════════════════════════════════════

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [profile] = await db
      .select()
      .from(peProfiles)
      .where(eq(peProfiles.userId, ctx.user.id))
      .limit(1);
    return profile ?? null;
  }),

  upsertProfile: protectedProcedure
    .input(z.object({
      currentRole: z.string().optional(),
      targetRole: z.string().optional(),
      experienceYears: z.number().optional(),
      department: z.string().optional(),
      careerGoals: z.array(z.string()).optional(),
      developmentFocus: z.array(z.string()).optional(),
      voiceProvider: z.enum(["openai", "sarvam"]).optional(),
      voiceId: z.string().optional(),
      voiceLanguage: z.string().optional(),
      onboardingComplete: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [existing] = await db
        .select()
        .from(peProfiles)
        .where(eq(peProfiles.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db
          .update(peProfiles)
          .set(input)
          .where(eq(peProfiles.id, existing.id));
        return { ...existing, ...input };
      } else {
        const [created] = await db
          .insert(peProfiles)
          .values({ userId: ctx.user.id, ...input })
          .$returningId();
        return { id: created.id, userId: ctx.user.id, ...input };
      }
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 2: Professional Effectiveness Index (Assessment)
  // ═══════════════════════════════════════════════════════════════════════════

  getAssessment: protectedProcedure.query(() => {
    return {
      dimensions: PEI_DIMENSIONS,
      questions: PEI_QUESTIONS,
      totalQuestions: PEI_QUESTIONS.length,
    };
  }),

  startAssessment: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [session] = await db
      .insert(peAssessmentSessions)
      .values({ userId: ctx.user.id, responses: {}, currentQuestionIndex: 0 })
      .$returningId();
    return { id: session.id, currentQuestionIndex: 0, totalQuestions: PEI_QUESTIONS.length };
  }),

  submitResponse: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      questionId: z.string(),
      response: z.number().min(1).max(5),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db
        .select()
        .from(peAssessmentSessions)
        .where(and(
          eq(peAssessmentSessions.id, input.sessionId),
          eq(peAssessmentSessions.userId, ctx.user.id),
        ))
        .limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      if (session.status === "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Assessment already completed" });

      const responses = (session.responses as Record<string, number>) ?? {};
      responses[input.questionId] = input.response;
      const nextIndex = session.currentQuestionIndex + 1;

      const isComplete = nextIndex >= PEI_QUESTIONS.length;
      await db
        .update(peAssessmentSessions)
        .set({
          responses,
          currentQuestionIndex: nextIndex,
          status: isComplete ? "completed" : "in_progress",
          completedAt: isComplete ? new Date() : null,
        })
        .where(eq(peAssessmentSessions.id, input.sessionId));

      if (isComplete) {
        const overallScore = scoreOverall(responses);
        const dimensionScores = scoreAllDimensions(responses);
        const zone = getZone(overallScore);

        let llmAnalysis: Record<string, any> | null = null;
        let developmentPlan: Record<string, any> | null = null;
        const devContext = await buildProfessionalContext(ctx.user.id);

        try {
          const result = await invokeLLM({
            model: "claude-sonnet-4-6",
            messages: [{
              role: "user" as const,
              content: `
You are an elite executive coach analyzing a Professional Effectiveness Index (PEI) assessment.

Professional context:
${devContext}

PEI Results:
- Overall Score: ${overallScore}/100 (${zone.label})
- Dimension Scores: ${Object.entries(dimensionScores).map(([k, v]) => `${k.replace(/_/g, " ")}: ${Math.round(v)}/100`).join(", ")}

Provide a comprehensive analysis as JSON with these exact keys:
{
  "headline": "string (one-sentence summary of their professional effectiveness)",
  "strengths": ["string", "string", "string"],
  "growthAreas": ["string", "string"],
  "blindSpots": ["string"],
  "careerImplications": "string (what this means for their career trajectory)",
  "recommendedFocus": "string (the single most important area to develop next)"
}
`.trim(),
            }],
            maxTokens: 1000,
          });
          const raw = extractText(result);
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) llmAnalysis = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("[PEI] LLM analysis failed:", e);
        }

        try {
          const result = await invokeLLM({
            model: "claude-sonnet-4-6",
            messages: [{
              role: "user" as const,
              content: `
You are an elite executive coach creating a 90-day development plan.

Professional context:
${devContext}

PEI Results:
- Overall Score: ${overallScore}/100 (${zone.label})
- Dimension Scores: ${Object.entries(dimensionScores).map(([k, v]) => `${k.replace(/_/g, " ")}: ${Math.round(v)}/100`).join(", ")}

Create a focused 90-day development plan as JSON:
{
  "focusAreas": [
    { "dimension": "string", "goal": "string", "actions": ["string", "string", "string"], "timeline": "string" },
    { "dimension": "string", "goal": "string", "actions": ["string", "string", "string"], "timeline": "string" }
  ],
  "weeklyMilestones": [
    { "week": 1, "milestone": "string" },
    { "week": 2, "milestone": "string" },
    { "week": 4, "milestone": "string" },
    { "week": 8, "milestone": "string" },
    { "week": 12, "milestone": "string" }
  ],
  "successIndicators": ["string", "string", "string"]
}
`.trim(),
            }],
            maxTokens: 1200,
          });
          const raw = extractText(result);
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) developmentPlan = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("[PEI] Development plan LLM failed:", e);
        }

        const [resultRow] = await db
          .insert(peAssessmentResults)
          .values({
            userId: ctx.user.id,
            sessionId: input.sessionId,
            overallScore,
            zone: zone.label,
            dimensionScores,
            llmAnalysis: llmAnalysis as any,
            developmentPlan: developmentPlan as any,
          })
          .$returningId();

        return {
          isComplete: true,
          overallScore,
          zone: zone.label,
          dimensionScores,
          resultId: resultRow.id,
        };
      }

      return { isComplete: false, currentQuestionIndex: nextIndex };
    }),

  getLatestResult: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [result] = await db
      .select()
      .from(peAssessmentResults)
      .where(eq(peAssessmentResults.userId, ctx.user.id))
      .orderBy(desc(peAssessmentResults.createdAt))
      .limit(1);
    return result ?? null;
  }),

  getResultsHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(peAssessmentResults)
      .where(eq(peAssessmentResults.userId, ctx.user.id))
      .orderBy(desc(peAssessmentResults.createdAt));
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 3: Daily AI Coach
  // ═══════════════════════════════════════════════════════════════════════════

  getCoachStarters: protectedProcedure.query(() => PEI_COACH_STARTERS),

  startCoachSession: protectedProcedure
    .input(z.object({
      context: z.string().optional(),
      title: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db
        .insert(peCoachSessions)
        .values({
          userId: ctx.user.id,
          title: input.title ?? input.context?.slice(0, 100) ?? "Coaching Session",
          context: input.context,
        })
        .$returningId();

      // Generate opening message from coach
      const professionalContext = await buildProfessionalContext(ctx.user.id);
      const userRows = await db.select().from(users).where(eq(users.id, ctx.user.id));
      const userName = userRows[0]?.name ?? "there";

      let opening = `Hi ${userName}, I'm your Professional Effectiveness Coach. What's on your mind today?`;
      if (input.context) {
        try {
          const result = await invokeLLM({
            model: "claude-haiku-4-5",
            messages: [{
              role: "user" as const,
              content: `
You are an elite executive coach. A professional has started a coaching session with this context: "${input.context}"

Their profile:
${professionalContext}

Generate a warm, personalized opening response (2-3 sentences) that acknowledges their situation and invites them to explore it further. Be direct and warm.
Return just the response text, no labels or quotes.
`.trim(),
            }],
            maxTokens: 200,
          });
          opening = extractText(result).trim();
        } catch (e) {
          // use default
        }
      }

      await db.insert(peCoachMessages).values({
        sessionId: session.id,
        role: "assistant",
        content: opening,
      });

      return { sessionId: session.id, opening };
    }),

  sendCoachMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [session] = await db
        .select()
        .from(peCoachSessions)
        .where(and(
          eq(peCoachSessions.id, input.sessionId),
          eq(peCoachSessions.userId, ctx.user.id),
        ))
        .limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      // Save user message
      await db.insert(peCoachMessages).values({
        sessionId: input.sessionId,
        role: "user",
        content: input.message,
      });

      // Get conversation history (last 10 messages)
      const history = await db
        .select()
        .from(peCoachMessages)
        .where(eq(peCoachMessages.sessionId, input.sessionId))
        .orderBy(peCoachMessages.createdAt)
        .limit(20);

      const professionalContext = await buildProfessionalContext(ctx.user.id);
      const userRows = await db.select().from(users).where(eq(users.id, ctx.user.id));
      const userName = userRows[0]?.name ?? "there";

      const systemPrompt = COACH_SYSTEM_PROMPT(professionalContext, userName);
      const conversationMessages = [
        { role: "system" as const, content: systemPrompt },
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      let reply = "I hear you. Let me think about this...";
      try {
        const result = await invokeLLM({
          model: "claude-sonnet-4-6",
          messages: conversationMessages,
          maxTokens: 500,
        });
        reply = extractText(result).trim();
      } catch (e) {
        console.error("[PEI Coach] LLM failed:", e);
      }

      // Save assistant reply
      await db.insert(peCoachMessages).values({
        sessionId: input.sessionId,
        role: "assistant",
        content: reply,
      });

      return { reply };
    }),

  getCoachSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(peCoachSessions)
      .where(eq(peCoachSessions.userId, ctx.user.id))
      .orderBy(desc(peCoachSessions.updatedAt))
      .limit(20);
  }),

  getCoachMessages: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(peCoachMessages)
        .where(eq(peCoachMessages.sessionId, input.sessionId))
        .orderBy(peCoachMessages.createdAt);
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 4: Morning Briefing
  // ═══════════════════════════════════════════════════════════════════════════

  getTodayBriefSnapshot: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const today = new Date().toISOString().split("T")[0];
    const [existing] = await db
      .select()
      .from(peDailyBriefs)
      .where(and(
        eq(peDailyBriefs.userId, ctx.user.id),
        eq(peDailyBriefs.briefDate, today),
      ))
      .limit(1);
    return (existing?.brief as Record<string, any>) ?? null;
  }),

  generateDailyBrief: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const today = new Date().toISOString().split("T")[0];

    // Check if already generated today
    const [existing] = await db
      .select()
      .from(peDailyBriefs)
      .where(and(
        eq(peDailyBriefs.userId, ctx.user.id),
        eq(peDailyBriefs.briefDate, today),
      ))
      .limit(1);

    if (existing?.brief) return existing.brief;

    const context = await buildProfessionalContext(ctx.user.id);
    const userRows = await db.select().from(users).where(eq(users.id, ctx.user.id));
    const userName = userRows[0]?.name ?? "there";
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

    // Get today's calendar events if available
    const calendarEvents = await db
      .select()
      .from(peCalendarEvents)
      .where(eq(peCalendarEvents.integrationId, 0)) // placeholder — will be filtered by user's integrations
      .limit(5)
      .catch(() => []);

    let brief: Record<string, any> = {};
    try {
      const result = await invokeLLM({
        model: "claude-haiku-4-5",
        messages: [{
          role: "user" as const,
          content: `
Generate a Daily Professional Effectiveness Brief for ${userName} on ${dayOfWeek}, ${today}.

Professional context:
${context}

Return a JSON object with these exact keys:
{
  "greeting": "string (warm, personalised greeting for the day)",
  "dayTheme": "string (one professional effectiveness theme to focus on today based on their data)",
  "priorityFocus": "string (the single most important professional action today)",
  "calendarItems": [],
  "developmentSuggestion": { "topic": "string", "why": "string", "action": "string" },
  "reflectionQuestion": "string (a coaching question to reflect on throughout the day)",
  "commitmentReminder": "string or null",
  "coachingNudge": "string (a brief, encouraging nudge to take one specific action today)"
}
`.trim(),
        }],
        maxTokens: 800,
      });
      const raw = extractText(result);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) brief = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("[PEI Brief] LLM failed:", e);
      brief = {
        greeting: `Good morning, ${userName}. Ready for a day of professional impact?`,
        dayTheme: "Intentional Effectiveness",
        priorityFocus: "Identify one high-impact action that will move the needle today.",
        calendarItems: [],
        developmentSuggestion: { topic: "Strategic Clarity", why: "A key growth area", action: "Take 10 minutes to connect your daily work to the bigger picture" },
        reflectionQuestion: "What would make today a great day of professional effectiveness for you?",
        commitmentReminder: null,
        coachingNudge: "Pick one thing that matters and do it exceptionally well today.",
      };
    }

    await db.insert(peDailyBriefs).values({
      userId: ctx.user.id,
      briefDate: today,
      brief: brief as any,
    });

    return brief;
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 5: AI Practice Partner
  // ═══════════════════════════════════════════════════════════════════════════

  getPracticeScenarios: protectedProcedure.query(() => PEI_PRACTICE_SCENARIOS),

  startPracticeSession: protectedProcedure
    .input(z.object({
      scenarioId: z.string(),
      scenarioLabel: z.string(),
      counterpartPersonality: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [inserted] = await db
        .insert(pePracticeSessions)
        .values({
          userId: ctx.user.id,
          scenario: input.scenarioLabel,
          scenarioType: input.scenarioId,
          counterpartPersonality: input.counterpartPersonality ?? "realistic",
          messages: [],
          status: "active",
        })
        .$returningId();

      const context = await buildProfessionalContext(ctx.user.id);
      const personalities: Record<string, string> = {
        realistic: "a realistic, average professional",
        resistant: "a defensive, resistant person who pushes back",
        emotional: "an emotional person who gets upset easily",
        passive: "a passive, disengaged person who gives minimal responses",
        aggressive: "an assertive, challenging person who questions everything",
      };
      const personalityDesc = personalities[input.counterpartPersonality ?? "realistic"] ?? "a realistic professional";

      let opening = "Hi, you wanted to speak with me?";
      try {
        const result = await invokeLLM({
          model: "claude-haiku-4-5",
          messages: [{
            role: "user" as const,
            content: `
You are playing the role of ${personalityDesc} in a professional practice scenario.
Scenario: ${input.scenarioLabel}
Professional context: ${context}
Generate a realistic opening line (1-2 sentences) that starts the conversation from the counterpart's perspective.
Return just the dialogue, no labels or quotes.
`.trim(),
          }],
          maxTokens: 100,
        });
        opening = extractText(result).trim();
      } catch (e) {
        // use default
      }

      const messages = [{ role: "counterpart", content: opening, timestamp: new Date().toISOString() }];
      await db
        .update(pePracticeSessions)
        .set({ messages })
        .where(eq(pePracticeSessions.id, inserted.id));

      return { id: inserted.id, opening };
    }),

  sendPracticeMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      message: z.string().min(1).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db
        .select()
        .from(pePracticeSessions)
        .where(and(
          eq(pePracticeSessions.id, input.sessionId),
          eq(pePracticeSessions.userId, ctx.user.id),
        ))
        .limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      if (session.status === "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Session already completed" });

      const messages = (session.messages as any[]) ?? [];
      messages.push({ role: "user", content: input.message, timestamp: new Date().toISOString() });

      const personalities: Record<string, string> = {
        realistic: "a realistic, average professional",
        resistant: "a defensive, resistant person who pushes back",
        emotional: "an emotional person who gets upset easily",
        passive: "a passive, disengaged person who gives minimal responses",
        aggressive: "an assertive, challenging person who questions everything",
      };
      const personalityDesc = personalities[session.counterpartPersonality ?? "realistic"] ?? "a realistic professional";

      const conversationHistory = messages.slice(-8).map((m: any) => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

      const systemMsg = {
        role: "system" as const,
        content: `You are playing the role of ${personalityDesc} in a professional practice scenario: ${session.scenario}. Stay in character. Respond naturally and realistically. Keep responses to 1-3 sentences. Do not break character.`,
      };

      let reply = "I see... let me think about that.";
      try {
        const result = await invokeLLM({
          model: "claude-haiku-4-5",
          messages: [systemMsg, ...conversationHistory],
          maxTokens: 150,
        });
        reply = extractText(result).trim();
      } catch (e) {
        // use default
      }

      messages.push({ role: "counterpart", content: reply, timestamp: new Date().toISOString() });
      await db
        .update(pePracticeSessions)
        .set({ messages })
        .where(eq(pePracticeSessions.id, input.sessionId));

      return { reply };
    }),

  endPracticeSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db
        .select()
        .from(pePracticeSessions)
        .where(and(
          eq(pePracticeSessions.id, input.sessionId),
          eq(pePracticeSessions.userId, ctx.user.id),
        ))
        .limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const messages = (session.messages as any[]) ?? [];
      const userMessages = messages.filter((m: any) => m.role === "user").map((m: any) => m.content).join("\n");

      let feedback: any = {
        overallRating: 3,
        headline: "Practice session completed.",
        strengths: [] as string[],
        improvements: [] as string[],
        keyMoment: "",
        nextPractice: "",
        coachingInsight: "",
      };
      try {
        const result = await invokeLLM({
          model: "claude-sonnet-4-6",
          messages: [{
            role: "user" as const,
            content: `
You are an elite executive coach reviewing a practice conversation.
Scenario: ${session.scenario}
Professional's messages: ${userMessages}
Full conversation: ${messages.map((m: any) => `${m.role === "user" ? "Professional" : "Counterpart"}: ${m.content}`).join("\n")}

Return coaching feedback as JSON:
{
  "overallRating": number (1-5),
  "headline": "string",
  "strengths": ["string", "string"],
  "improvements": ["string", "string"],
  "keyMoment": "string",
  "nextPractice": "string",
  "coachingInsight": "string"
}
`.trim(),
          }],
          maxTokens: 600,
        });
        const raw = extractText(result);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) feedback = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // use default
      }

      await db
        .update(pePracticeSessions)
        .set({ status: "completed", coachingFeedback: feedback as any })
        .where(eq(pePracticeSessions.id, input.sessionId));

      return feedback;
    }),

  listPracticeSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(pePracticeSessions)
      .where(eq(pePracticeSessions.userId, ctx.user.id))
      .orderBy(desc(pePracticeSessions.createdAt))
      .limit(20);
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 6: Commitments & Accountability
  // ═══════════════════════════════════════════════════════════════════════════

  listCommitments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(peCommitments)
      .where(eq(peCommitments.userId, ctx.user.id))
      .orderBy(desc(peCommitments.createdAt));
  }),

  createCommitment: protectedProcedure
    .input(z.object({
      text: z.string().min(5).max(500),
      dueDate: z.string().optional(),
      sourceType: z.string().optional(),
      sourceId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [created] = await db
        .insert(peCommitments)
        .values({
          userId: ctx.user.id,
          text: input.text,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          sourceType: input.sourceType ?? "manual",
          sourceId: input.sourceId,
        })
        .$returningId();
      return { id: created.id, success: true };
    }),

  updateCommitmentStatus: protectedProcedure
    .input(z.object({
      commitmentId: z.number(),
      status: z.enum(["pending", "completed", "missed"]),
      outcome: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(peCommitments)
        .set({
          status: input.status,
          outcome: input.outcome ?? null,
        })
        .where(and(
          eq(peCommitments.id, input.commitmentId),
          eq(peCommitments.userId, ctx.user.id),
        ));
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 7: Calendar Integration
  // ═══════════════════════════════════════════════════════════════════════════

  getCalendarIntegrations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const integrations = await db
      .select({
        id: peCalendarIntegrations.id,
        provider: peCalendarIntegrations.provider,
        syncStatus: peCalendarIntegrations.syncStatus,
        lastSyncAt: peCalendarIntegrations.lastSyncAt,
        createdAt: peCalendarIntegrations.createdAt,
      })
      .from(peCalendarIntegrations)
      .where(eq(peCalendarIntegrations.userId, ctx.user.id));
    return integrations;
  }),

  connectCalendar: protectedProcedure
    .input(z.object({
      provider: z.enum(["google", "outlook"]),
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Check if already connected
      const [existing] = await db
        .select()
        .from(peCalendarIntegrations)
        .where(and(
          eq(peCalendarIntegrations.userId, ctx.user.id),
          eq(peCalendarIntegrations.provider, input.provider),
        ))
        .limit(1);

      if (existing) {
        await db
          .update(peCalendarIntegrations)
          .set({
            accessToken: input.accessToken,
            refreshToken: input.refreshToken ?? existing.refreshToken,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            syncStatus: "connected",
          })
          .where(eq(peCalendarIntegrations.id, existing.id));
        return { id: existing.id, connected: true };
      }

      const [created] = await db
        .insert(peCalendarIntegrations)
        .values({
          userId: ctx.user.id,
          provider: input.provider,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          syncStatus: "connected",
        })
        .$returningId();

      return { id: created.id, connected: true };
    }),

  disconnectCalendar: protectedProcedure
    .input(z.object({ integrationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(peCalendarIntegrations)
        .where(and(
          eq(peCalendarIntegrations.id, input.integrationId),
          eq(peCalendarIntegrations.userId, ctx.user.id),
        ));
      return { success: true };
    }),

  getUpcomingEvents: protectedProcedure
    .input(z.object({ days: z.number().default(7) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const integrations = await db
        .select()
        .from(peCalendarIntegrations)
        .where(eq(peCalendarIntegrations.userId, ctx.user.id));

      if (integrations.length === 0) return [];

      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + input.days);

      const integrationIds = integrations.map((i) => i.id);
      const events: typeof peCalendarEvents.$inferSelect[] = [];

      for (const intId of integrationIds) {
        const intEvents = await db
          .select()
          .from(peCalendarEvents)
          .where(and(
            eq(peCalendarEvents.integrationId, intId),
          ))
          .limit(20);
        events.push(...intEvents);
      }

      return events.filter((e) => new Date(e.startTime) >= now && new Date(e.startTime) <= future)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 8: Dashboard Summary
  // ═══════════════════════════════════════════════════════════════════════════

  getDashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const [profile] = await db
      .select()
      .from(peProfiles)
      .where(eq(peProfiles.userId, ctx.user.id))
      .limit(1);

    const [latestResult] = await db
      .select()
      .from(peAssessmentResults)
      .where(eq(peAssessmentResults.userId, ctx.user.id))
      .orderBy(desc(peAssessmentResults.createdAt))
      .limit(1);

    const today = new Date().toISOString().split("T")[0];
    const [todayBrief] = await db
      .select()
      .from(peDailyBriefs)
      .where(and(
        eq(peDailyBriefs.userId, ctx.user.id),
        eq(peDailyBriefs.briefDate, today),
      ))
      .limit(1);

    const activeCommitments = await db
      .select()
      .from(peCommitments)
      .where(and(eq(peCommitments.userId, ctx.user.id), eq(peCommitments.status, "pending")));

    const recentPracticeSessions = await db
      .select()
      .from(pePracticeSessions)
      .where(eq(pePracticeSessions.userId, ctx.user.id))
      .orderBy(desc(pePracticeSessions.createdAt))
      .limit(5);

    const recentCoachSessions = await db
      .select()
      .from(peCoachSessions)
      .where(eq(peCoachSessions.userId, ctx.user.id))
      .orderBy(desc(peCoachSessions.updatedAt))
      .limit(5);

    return {
      profile,
      latestResult,
      hasDailyBrief: !!todayBrief,
      activeCommitmentsCount: activeCommitments.length,
      activeCommitments: activeCommitments.slice(0, 3),
      recentPracticeSessions: recentPracticeSessions,
      recentCoachSessions: recentCoachSessions,
    };
  }),
});
