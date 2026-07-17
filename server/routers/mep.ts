/**
 * Manager Effectiveness Platform — Backend Router
 *
 * Covers all 6 layers:
 *   1. Management Diagnostics (10 diagnostics, submit + results)
 *   2. AI Manager Guide (context-aware chat)
 *   3. Manager Playbook (situation → structured AI playbook)
 *   4. Daily Management Brief (AI-generated morning brief)
 *   5. AI Practice Partner (role-play sessions)
 *   6. Behaviour Change Engine (commitments + check-ins)
 */

import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  mepDiagnosticResults,
  managerGuideSessions,
  managerGuideMessages,
  managerPlaybookSessions,
  behaviourCommitments,
  mepDailyBriefs,
  mepPracticeSessions,
  managerTeamMembers,
  users,
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { getMepDiagnostic, scoreMepDiagnostic, MEP_DIAGNOSTICS } from "../../shared/modules/mepData";

// ─── Helper: extract text from LLM result ────────────────────────────────────
function extractText(result: Awaited<ReturnType<typeof invokeLLM>>): string {
  const raw = result.choices[0]?.message?.content ?? "";
  return typeof raw === "string" ? raw : (raw as any[]).map((c: any) => c.text ?? "").join("");
}

// ─── Helper: build manager context for AI prompts ─────────────────────────────
async function buildManagerContext(userId: number, existingDb?: Awaited<ReturnType<typeof getDb>>): Promise<string> {
  const db = existingDb ?? await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const results = await db
    .select()
    .from(mepDiagnosticResults)
    .where(eq(mepDiagnosticResults.userId, userId))
    .orderBy(desc(mepDiagnosticResults.completedAt));

  const commitments = await db
    .select()
    .from(behaviourCommitments)
    .where(and(eq(behaviourCommitments.userId, userId), eq(behaviourCommitments.status, "active")));

  const userRows = await db.select().from(users).where(eq(users.id, userId));
  const userName = userRows[0]?.name ?? "the manager";

  const lines: string[] = [`Manager: ${userName}`];

  if (results.length > 0) {
    lines.push("\n[Diagnostic Results]");
    for (const r of results) {
      const diag = getMepDiagnostic(r.diagnosticCode);
      const label = diag?.title ?? r.diagnosticCode;
      lines.push(`- ${label}: ${Math.round(r.overallScore)}/100 (${r.zone})`);
      if (r.dimensionScores && typeof r.dimensionScores === "object") {
        const dims = Object.entries(r.dimensionScores as Record<string, number>)
          .sort(([, a], [, b]) => b - a);
        const top = dims.slice(0, 2).map(([k, v]) => `${k.replace(/_/g, " ")} (${Math.round(v)})`).join(", ");
        const bottom = dims.slice(-2).map(([k, v]) => `${k.replace(/_/g, " ")} (${Math.round(v)})`).join(", ");
        lines.push(`  Strengths: ${top} | Growth areas: ${bottom}`);
      }
    }
  } else {
    lines.push("\n[No diagnostics completed yet]");
  }

  if (commitments.length > 0) {
    lines.push("\n[Active Behaviour Commitments]");
    for (const c of commitments) {
      lines.push(`- "${c.commitment}"`);
    }
  }

  return lines.join("\n");
}

// ─── System prompt for the AI Manager Guide ───────────────────────────────────
const MANAGER_GUIDE_SYSTEM_PROMPT = (context: string, userName: string) => `
You are an elite executive coach and management advisor for ${userName}.

You have deep expertise in management effectiveness, team leadership, delegation, feedback, coaching, execution, and behaviour change.

You know this manager well. Here is their current profile:

${context}

Your role is to:
- Challenge their assumptions with coaching questions
- Provide practical frameworks and models
- Recommend specific, actionable next steps
- Celebrate wins and progress
- Detect patterns across their challenges
- Keep them accountable to their commitments
- Be direct, honest, and warm — like the best coach they've ever had

Never give generic advice. Always personalise to their diagnostic data and context.
Keep responses focused and practical — under 300 words unless a framework requires more.
Use bullet points sparingly. Prefer conversational, direct prose.
`.trim();

// ─── System prompt for the Manager Playbook ──────────────────────────────────
const MANAGER_PLAYBOOK_SYSTEM_PROMPT = (context: string) => `
You are an expert management advisor. A manager has described a situation they are facing.

Manager context:
${context}

Return a structured JSON playbook for this situation with these exact keys:
{
  "situationType": "string (e.g. 'Underperformance', 'Conflict', 'Delegation')",
  "diagnosis": "string (2-3 sentences diagnosing the root issue)",
  "possibleCauses": ["string", "string", "string"],
  "framework": {
    "name": "string (e.g. 'SBI Feedback Model', 'GROW Coaching')",
    "steps": ["string", "string", "string", "string"]
  },
  "conversationGuide": {
    "opening": "string (how to open the conversation)",
    "keyPoints": ["string", "string", "string"],
    "closing": "string (how to close the conversation)"
  },
  "questions": ["string", "string", "string", "string"],
  "actionPlan": ["string", "string", "string"],
  "commonMistakes": ["string", "string", "string"],
  "followUpPlan": "string (what to do in 1 week, 2 weeks, 1 month)",
  "learningResources": [
    { "title": "string", "type": "string (book/article/framework)", "why": "string" }
  ]
}

Be specific, practical, and grounded in real management science. No generic advice.
`.trim();

export const mepRouter = router({
  // ── LAYER 1: Diagnostics ──────────────────────────────────────────────────

  getDiagnostics: protectedProcedure.query(() => {
    return MEP_DIAGNOSTICS.map((d) => ({
      code: d.code,
      title: d.title,
      tagline: d.tagline,
      description: d.description,
      icon: d.icon,
      estimatedMinutes: d.estimatedMinutes,
      dimensionCount: d.dimensions.length,
      questionCount: d.questions.length,
    }));
  }),

  getDiagnosticDetail: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(({ input }) => {
      const diag = getMepDiagnostic(input.code);
      if (!diag) throw new TRPCError({ code: "NOT_FOUND", message: "Diagnostic not found" });
      return diag;
    }),

  submitDiagnostic: protectedProcedure
    .input(z.object({
      code: z.string(),
      responses: z.record(z.string(), z.number().min(1).max(5)),
    }))
    .mutation(async ({ ctx, input }) => {
      const diag = getMepDiagnostic(input.code);
      if (!diag) throw new TRPCError({ code: "NOT_FOUND", message: "Diagnostic not found" });

      const { dimensionScores, overallScore, zone } = scoreMepDiagnostic(diag, input.responses);

      const dimSummary = Object.entries(dimensionScores)
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => {
          const dim = diag.dimensions.find((d) => d.id === k);
          return `${dim?.label ?? k}: ${Math.round(v)}/100`;
        })
        .join("\n");

      let llmAnalysis: Record<string, any> = {};
      try {
        const analysisPrompt = `
You are an expert management coach analysing a manager's ${diag.title} diagnostic results.

Overall score: ${Math.round(overallScore)}/100 (Zone: ${zone})

Dimension scores:
${dimSummary}

Return a JSON object with these exact keys:
{
  "headline": "string (one powerful sentence summarising their management effectiveness in this area)",
  "strengths": [{ "title": "string", "description": "string" }],
  "risks": [{ "title": "string", "description": "string" }],
  "blindSpots": [{ "title": "string", "description": "string" }],
  "behaviouralObservations": ["string", "string", "string"],
  "learningPath": [{ "priority": 1, "focus": "string", "action": "string", "timeframe": "string" }],
  "coachQuestion": "string (one powerful coaching question to reflect on)"
}
`.trim();

        const result = await invokeLLM({
          model: "gpt-5-mini",
          messages: [{ role: "user" as const, content: analysisPrompt }],
          maxTokens: 1200,
        });
        const raw = extractText(result);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) llmAnalysis = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("[MEP] LLM analysis failed:", e);
      }

      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [inserted] = await db.insert(mepDiagnosticResults).values({
        userId: ctx.user.id,
        diagnosticCode: input.code,
        responses: input.responses,
        dimensionScores,
        overallScore,
        zone,
        llmAnalysis,
      }).$returningId();

      return { id: inserted.id, dimensionScores, overallScore, zone, llmAnalysis };
    }),

  getMyResults: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select()
      .from(mepDiagnosticResults)
      .where(eq(mepDiagnosticResults.userId, ctx.user.id))
      .orderBy(desc(mepDiagnosticResults.completedAt));
  }),

  getLatestResult: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await db
        .select()
        .from(mepDiagnosticResults)
        .where(and(
          eq(mepDiagnosticResults.userId, ctx.user.id),
          eq(mepDiagnosticResults.diagnosticCode, input.code),
        ))
        .orderBy(desc(mepDiagnosticResults.completedAt))
        .limit(1);
      return result ?? null;
    }),

  // ── LAYER 2: AI Manager Guide ─────────────────────────────────────────────

  listGuideSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select()
      .from(managerGuideSessions)
      .where(eq(managerGuideSessions.userId, ctx.user.id))
      .orderBy(desc(managerGuideSessions.updatedAt))
      .limit(20);
  }),

  createGuideSession: protectedProcedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db.insert(managerGuideSessions).values({
        userId: ctx.user.id,
        title: input.title ?? "New conversation",
      }).$returningId();
      return { id: session.id };
    }),

  getGuideMessages: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db
        .select()
        .from(managerGuideSessions)
        .where(and(
          eq(managerGuideSessions.id, input.sessionId),
          eq(managerGuideSessions.userId, ctx.user.id),
        ));
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      return db
        .select()
        .from(managerGuideMessages)
        .where(eq(managerGuideMessages.sessionId, input.sessionId))
        .orderBy(managerGuideMessages.createdAt);
    }),

  sendGuideMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [session] = await db
        .select()
        .from(managerGuideSessions)
        .where(and(
          eq(managerGuideSessions.id, input.sessionId),
          eq(managerGuideSessions.userId, ctx.user.id),
        ));
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      await db.insert(managerGuideMessages).values({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        role: "user",
        content: input.message,
      });

      const history = await db
        .select()
        .from(managerGuideMessages)
        .where(eq(managerGuideMessages.sessionId, input.sessionId))
        .orderBy(managerGuideMessages.createdAt)
        .limit(12);

      const context = await buildManagerContext(ctx.user.id);
      const userRows = await db.select().from(users).where(eq(users.id, ctx.user.id));
      const userName = userRows[0]?.name ?? "the manager";

      const systemMsg = { role: "system" as const, content: MANAGER_GUIDE_SYSTEM_PROMPT(context, userName) };
      const llmMessages = history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const result = await invokeLLM({
        model: "gpt-5-mini",
        messages: [systemMsg, ...llmMessages],
        maxTokens: 600,
      });
      const reply = extractText(result);

      await db.insert(managerGuideMessages).values({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        role: "assistant",
        content: reply,
      });

      if (history.length === 1) {
        const shortTitle = input.message.substring(0, 60) + (input.message.length > 60 ? "…" : "");
        await db
          .update(managerGuideSessions)
          .set({ title: shortTitle })
          .where(eq(managerGuideSessions.id, input.sessionId));
      }

      return { reply };
    }),

  // ── LAYER 3: Manager Playbook ─────────────────────────────────────────────

  generatePlaybook: protectedProcedure
    .input(z.object({ situation: z.string().min(10).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const context = await buildManagerContext(ctx.user.id);

      let playbook: Record<string, any> = {};
      try {
        const systemMsg = { role: "system" as const, content: MANAGER_PLAYBOOK_SYSTEM_PROMPT(context) };
        const result = await invokeLLM({
          model: "gpt-5-mini",
          messages: [systemMsg, { role: "user" as const, content: `My situation: ${input.situation}` }],
          maxTokens: 1500,
        });
        const raw = extractText(result);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) playbook = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("[MEP Playbook] LLM failed:", e);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not generate playbook" });
      }

      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [inserted] = await db.insert(managerPlaybookSessions).values({
        userId: ctx.user.id,
        situation: input.situation,
        situationType: playbook.situationType ?? null,
        playbook,
      }).$returningId();

      return { id: inserted.id, playbook };
    }),

  listPlaybookSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select()
      .from(managerPlaybookSessions)
      .where(eq(managerPlaybookSessions.userId, ctx.user.id))
      .orderBy(desc(managerPlaybookSessions.createdAt))
      .limit(20);
  }),

  getPlaybookSession: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db
        .select()
        .from(managerPlaybookSessions)
        .where(and(
          eq(managerPlaybookSessions.id, input.id),
          eq(managerPlaybookSessions.userId, ctx.user.id),
        ));
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),

  // ── LAYER 4: Daily Management Brief ──────────────────────────────────────

  // Returns today's brief if already generated, null otherwise (no LLM call)
  getTodayBriefSnapshot: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const today = new Date().toISOString().split("T")[0];
    const [existing] = await db
      .select()
      .from(mepDailyBriefs)
      .where(and(
        eq(mepDailyBriefs.userId, ctx.user.id),
        eq(mepDailyBriefs.briefDate, today),
      ))
      .limit(1);
    return (existing?.brief as Record<string, any>) ?? null;
  }),

  getDailyBrief: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const today = new Date().toISOString().split("T")[0];

    const [existing] = await db
      .select()
      .from(mepDailyBriefs)
      .where(and(
        eq(mepDailyBriefs.userId, ctx.user.id),
        eq(mepDailyBriefs.briefDate, today),
      ));

    if (existing?.brief) return existing.brief;

    const context = await buildManagerContext(ctx.user.id);
    const userRows = await db.select().from(users).where(eq(users.id, ctx.user.id));
    const userName = userRows[0]?.name ?? "the manager";

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

    let brief: Record<string, any> = {};
    try {
      const result = await invokeLLM({
        model: "gpt-5-mini",
        messages: [{
          role: "user" as const,
          content: `
Generate a Daily Management Brief for ${userName} on ${dayOfWeek}, ${today}.

Manager context:
${context}

Return a JSON object with these exact keys:
{
  "greeting": "string (warm, personalised greeting for the day)",
  "dayTheme": "string (one management theme to focus on today based on their data)",
  "priorityFocus": "string (the single most important management action today)",
  "teamPulseItems": [
    { "type": "string (attention/recognition/checkin/risk)", "person": "string", "note": "string" }
  ],
  "managementChallenge": "string (a specific, practical challenge to try today)",
  "reflectionQuestion": "string (a coaching question to reflect on)",
  "learningRecommendation": { "topic": "string", "why": "string", "action": "string" },
  "commitmentReminder": "string or null"
}
`.trim(),
        }],
        maxTokens: 800,
      });
      const raw = extractText(result);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) brief = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("[MEP Brief] LLM failed:", e);
      brief = {
        greeting: `Good morning, ${userName}. Ready to lead well today?`,
        dayTheme: "Intentional Leadership",
        priorityFocus: "Have one meaningful coaching conversation with a team member today.",
        teamPulseItems: [],
        managementChallenge: "Before your first meeting, write down the one thing your team needs most from you today.",
        reflectionQuestion: "What would make today a great day of management for you?",
        learningRecommendation: { topic: "Delegation", why: "A key growth area", action: "Identify one task to delegate today" },
        commitmentReminder: null,
      };
    }

    await db.insert(mepDailyBriefs).values({
      userId: ctx.user.id,
      briefDate: today,
      brief,
    });

    return brief;
  }),

  // ── LAYER 5: AI Practice Partner ─────────────────────────────────────────

  getPracticeScenarios: protectedProcedure.query(() => {
    return [
      { id: "performance_review", label: "Performance Review", icon: "📊", description: "Deliver a performance review — positive or developmental" },
      { id: "salary_discussion", label: "Salary Discussion", icon: "💰", description: "Navigate a compensation conversation" },
      { id: "promotion_request", label: "Promotion Request", icon: "🚀", description: "Respond to a promotion request you can't yet approve" },
      { id: "termination", label: "Difficult Exit", icon: "🚪", description: "Handle a termination or performance exit conversation" },
      { id: "conflict", label: "Team Conflict", icon: "⚡", description: "Mediate conflict between two team members" },
      { id: "client_escalation", label: "Client Escalation", icon: "🔥", description: "Handle an angry client escalation with your team" },
      { id: "managing_upwards", label: "Managing Upwards", icon: "⬆️", description: "Push back on your manager or present a difficult update" },
      { id: "delegation", label: "Delegation Conversation", icon: "🤝", description: "Delegate a high-stakes project to a team member" },
      { id: "feedback", label: "Giving Difficult Feedback", icon: "💬", description: "Give honest developmental feedback to a resistant team member" },
      { id: "career_discussion", label: "Career Development", icon: "🗺️", description: "Have a career development conversation with an ambitious team member" },
      { id: "missed_deadline", label: "Missed Deadline", icon: "⏰", description: "Address a team member who consistently misses deadlines" },
      { id: "difficult_stakeholder", label: "Difficult Stakeholder", icon: "🧩", description: "Manage a demanding or obstructive stakeholder" },
    ];
  }),

  startPracticeSession: protectedProcedure
    .input(z.object({
      scenarioId: z.string(),
      scenarioLabel: z.string(),
      counterpartPersonality: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [inserted] = await db.insert(mepPracticeSessions).values({
        userId: ctx.user.id,
        scenario: input.scenarioLabel,
        scenarioType: input.scenarioId,
        counterpartPersonality: input.counterpartPersonality ?? "realistic",
        messages: [],
        status: "active",
      }).$returningId();

      const context = await buildManagerContext(ctx.user.id);
      const personalities: Record<string, string> = {
        realistic: "a realistic, average employee",
        resistant: "a defensive, resistant employee who pushes back",
        emotional: "an emotional employee who gets upset easily",
        passive: "a passive, disengaged employee who gives minimal responses",
        aggressive: "an assertive, challenging employee who questions everything",
      };
      const personalityDesc = personalities[input.counterpartPersonality ?? "realistic"] ?? "a realistic employee";

      let opening = "Hi, you wanted to speak with me?";
      try {
        const result = await invokeLLM({
          model: "gpt-5-mini",
          messages: [{
            role: "user" as const,
            content: `
You are playing the role of ${personalityDesc} in a management practice scenario.
Scenario: ${input.scenarioLabel}
Manager context: ${context}
Generate a realistic opening line (1-2 sentences) that starts the conversation from the employee's perspective.
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
        .update(mepPracticeSessions)
        .set({ messages })
        .where(eq(mepPracticeSessions.id, inserted.id));

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
        .from(mepPracticeSessions)
        .where(and(
          eq(mepPracticeSessions.id, input.sessionId),
          eq(mepPracticeSessions.userId, ctx.user.id),
        ));
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      if (session.status === "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Session already completed" });

      const messages = (session.messages as any[]) ?? [];
      messages.push({ role: "manager", content: input.message, timestamp: new Date().toISOString() });

      const personalities: Record<string, string> = {
        realistic: "a realistic, average employee",
        resistant: "a defensive, resistant employee who pushes back",
        emotional: "an emotional employee who gets upset easily",
        passive: "a passive, disengaged employee who gives minimal responses",
        aggressive: "an assertive, challenging employee who questions everything",
      };
      const personalityDesc = personalities[session.counterpartPersonality ?? "realistic"] ?? "a realistic employee";

      const conversationHistory = messages.slice(-8).map((m: any) => ({
        role: (m.role === "manager" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

      const systemMsg = {
        role: "system" as const,
        content: `You are playing the role of ${personalityDesc} in a management practice scenario: ${session.scenario}. Stay in character. Respond naturally and realistically. Keep responses to 1-3 sentences. Do not break character.`,
      };

      let reply = "I see... let me think about that.";
      try {
        const result = await invokeLLM({
          model: "gpt-5-mini",
          messages: [systemMsg, ...conversationHistory],
          maxTokens: 150,
        });
        reply = extractText(result).trim();
      } catch (e) {
        // use default
      }

      messages.push({ role: "counterpart", content: reply, timestamp: new Date().toISOString() });
      await db
        .update(mepPracticeSessions)
        .set({ messages })
        .where(eq(mepPracticeSessions.id, input.sessionId));

      return { reply };
    }),

  endPracticeSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [session] = await db
        .select()
        .from(mepPracticeSessions)
        .where(and(
          eq(mepPracticeSessions.id, input.sessionId),
          eq(mepPracticeSessions.userId, ctx.user.id),
        ));
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const messages = (session.messages as any[]) ?? [];
      const managerMessages = messages.filter((m: any) => m.role === "manager").map((m: any) => m.content).join("\n");

      let feedback: Record<string, any> = { overallRating: 3, headline: "Practice session completed.", strengths: [], improvements: [], keyMoment: "", nextPractice: "", coachingInsight: "" };
      try {
        const result = await invokeLLM({
          model: "gpt-5-mini",
          messages: [{
            role: "user" as const,
            content: `
You are an expert management coach reviewing a practice conversation.
Scenario: ${session.scenario}
Manager's messages: ${managerMessages}
Full conversation: ${messages.map((m: any) => `${m.role === "manager" ? "Manager" : "Employee"}: ${m.content}`).join("\n")}

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
        .update(mepPracticeSessions)
        .set({ status: "completed", coachingFeedback: feedback })
        .where(eq(mepPracticeSessions.id, input.sessionId));

      return feedback;
    }),

  listPracticeSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select()
      .from(mepPracticeSessions)
      .where(eq(mepPracticeSessions.userId, ctx.user.id))
      .orderBy(desc(mepPracticeSessions.createdAt))
      .limit(20);
  }),

  // ── LAYER 6: Behaviour Change Engine ─────────────────────────────────────

  listCommitments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select()
      .from(behaviourCommitments)
      .where(eq(behaviourCommitments.userId, ctx.user.id))
      .orderBy(desc(behaviourCommitments.createdAt));
  }),

  createCommitment: protectedProcedure
    .input(z.object({
      commitment: z.string().min(5).max(500),
      sourceDiagnostic: z.string().optional(),
      targetDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await db.insert(behaviourCommitments).values({
        userId: ctx.user.id,
        commitment: input.commitment,
        sourceDiagnostic: input.sourceDiagnostic,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        checkIns: [],
      }).$returningId();
      return { id: result.id };
    }),

  addCheckIn: protectedProcedure
    .input(z.object({
      commitmentId: z.number(),
      done: z.boolean(),
      howItWent: z.string().optional(),
      whatHappened: z.string().optional(),
      whatLearned: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [commitment] = await db
        .select()
        .from(behaviourCommitments)
        .where(and(
          eq(behaviourCommitments.id, input.commitmentId),
          eq(behaviourCommitments.userId, ctx.user.id),
        ));
      if (!commitment) throw new TRPCError({ code: "NOT_FOUND" });

      let aiCoaching = "Keep going — every attempt builds the habit.";
      try {
        const result = await invokeLLM({
          model: "gpt-5-mini",
          messages: [{
            role: "user" as const,
            content: `
A manager has checked in on their behaviour commitment: "${commitment.commitment}"
Did they do it: ${input.done ? "Yes" : "No"}
How it went: ${input.howItWent ?? "Not specified"}
What happened: ${input.whatHappened ?? "Not specified"}
What they learned: ${input.whatLearned ?? "Not specified"}

Provide a 2-3 sentence coaching response that acknowledges their effort, reinforces the learning or addresses the barrier, and gives one specific suggestion for next time. Warm, direct, practical.
`.trim(),
          }],
          maxTokens: 150,
        });
        aiCoaching = extractText(result).trim();
      } catch (e) {
        // use default
      }

      const checkIns = (commitment.checkIns as any[]) ?? [];
      checkIns.push({
        date: new Date().toISOString(),
        done: input.done,
        howItWent: input.howItWent,
        whatHappened: input.whatHappened,
        whatLearned: input.whatLearned,
        aiCoaching,
      });

      await db
        .update(behaviourCommitments)
        .set({ checkIns })
        .where(eq(behaviourCommitments.id, input.commitmentId));

      return { aiCoaching };
    }),

  updateCommitmentStatus: protectedProcedure
    .input(z.object({
      commitmentId: z.number(),
      status: z.enum(["active", "completed", "abandoned"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(behaviourCommitments)
        .set({ status: input.status })
        .where(and(
          eq(behaviourCommitments.id, input.commitmentId),
          eq(behaviourCommitments.userId, ctx.user.id),
        ));
      return { success: true };
    }),

  // ── Team Intelligence ──────────────────────────────────────────────────────
  listTeamMembers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select()
      .from(managerTeamMembers)
      .where(eq(managerTeamMembers.userId, String(ctx.user.id)))
      .orderBy(desc(managerTeamMembers.createdAt));
  }),

  addTeamMember: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      role: z.string().max(255).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await db.insert(managerTeamMembers).values({
        userId: String(ctx.user.id),
        name: input.name,
        role: input.role,
      }).$returningId();
      return { id: result.id };
    }),

  generateTeamMemberInsight: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [member] = await db
        .select()
        .from(managerTeamMembers)
        .where(and(
          eq(managerTeamMembers.id, input.memberId),
          eq(managerTeamMembers.userId, String(ctx.user.id)),
        ));
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });

      const contextLines = await buildManagerContext(ctx.user.id, db);

      const result = await invokeLLM({
        model: "gpt-5-mini",
        messages: [{
          role: "user" as const,
          content: `You are an expert management coach. A manager wants coaching insights for one of their team members.\n\nManager context:\n${contextLines}\n\nTeam member: ${member.name}${member.role ? ` (${member.role})` : ""}\n\nGenerate a structured coaching insight. Return ONLY valid JSON:\n{\n  "summary": "2-3 sentence overview of how to manage this person effectively",\n  "strengths": ["strength 1", "strength 2", "strength 3"],\n  "watchOuts": ["risk 1", "risk 2"],\n  "recommendedActions": ["action 1", "action 2", "action 3"]\n}\nBe specific, practical, and grounded in management best practice.`,
        }],
        maxTokens: 500,
        responseFormat: { type: "json_object" },
      });

      let insight: any = { summary: "", strengths: [], watchOuts: [], recommendedActions: [] };
      try {
        const raw = extractText(result);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) insight = JSON.parse(jsonMatch[0]);
      } catch (e) { /* use default */ }

      await db
        .update(managerTeamMembers)
        .set({ lastInsight: insight })
        .where(eq(managerTeamMembers.id, input.memberId));

      return { insight };
    }),
});
