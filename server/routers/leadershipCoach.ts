import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import {
  leadershipMemory,
  beforeMeetingBriefs,
  afterMeetingDebriefs,
  improvedMessages,
  conversationScripts,
  commitments,
  readinessScores,
  coachBriefs,
  privacySettings,
  growthPlans,
  practiceSessions,
  users,
} from "../../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getLeaderContext(userId: number) {
  const db = await getDb();
  if (!db) return { user: null, memory: null, graph: null, recentCommitments: [] };
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [memory] = await db.select().from(leadershipMemory).where(eq(leadershipMemory.userId, userId));
  const [graph] = await db.select({ leadershipGraph: users.leadershipGraph }).from(users).where(eq(users.id, userId));
  const recentCommitments = await db.select().from(commitments)
    .where(eq(commitments.userId, userId))
    .orderBy(desc(commitments.createdAt))
    .limit(5);
  return { user, memory, graph: graph?.leadershipGraph, recentCommitments };
}

const MODULE_FULL_NAMES: Record<string, string> = {
  ECI: 'Executive Communication Intelligence',
  LII: 'Leadership Influence Intelligence',
  GCC: 'GCC Readiness',
};

function buildLeaderContextPrompt(ctx: Awaited<ReturnType<typeof getLeaderContext>>) {
  const parts: string[] = [];
  if (ctx.user?.name) parts.push(`Leader: ${ctx.user.name}`);
  if (ctx.graph) {
    const g = ctx.graph as Record<string, unknown>;
    if (g.compositeEdge) parts.push(`Overall Leadership Edge Score: ${g.compositeEdge}/100`);
    // Module-level scores with lowest-scoring dimension flagged as primary growth focus
    if (g.moduleEdges && typeof g.moduleEdges === 'object') {
      const moduleEdges = g.moduleEdges as Record<string, number>;
      const moduleLines = Object.entries(moduleEdges)
        .map(([k, v]) => `  ${MODULE_FULL_NAMES[k] ?? k}: ${v}/100`)
        .join('\n');
      parts.push(`Diagnostic Module Scores:\n${moduleLines}`);
      const entries = Object.entries(moduleEdges);
      if (entries.length > 0) {
        const [lowestKey, lowestScore] = entries.reduce((a, b) => b[1] < a[1] ? b : a);
        parts.push(`Primary Growth Focus: ${MODULE_FULL_NAMES[lowestKey] ?? lowestKey} (${lowestScore}/100) — this is the lowest-scoring diagnostic dimension and should anchor the 30-day growth plan and practice recommendations`);
      }
    }
    if (g.archetypes && typeof g.archetypes === 'object') {
      const archetypes = g.archetypes as Record<string, string>;
      const archList = Object.entries(archetypes).map(([k, v]) => `${MODULE_FULL_NAMES[k] ?? k}: ${v}`).join(', ');
      parts.push(`Leadership Archetypes: ${archList}`);
    }
  }
  if (ctx.memory?.aiSummary) parts.push(`Leadership Memory: ${ctx.memory.aiSummary}`);
  if (ctx.recentCommitments.length > 0) {
    const commitList = ctx.recentCommitments.map(c => `- ${c.text} (${c.status})`).join('\n');
    parts.push(`Recent Commitments:\n${commitList}`);
  }
  return parts.length > 0 ? `\n\nLEADER CONTEXT:\n${parts.join('\n')}` : '';
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const leadershipCoachRouter = router({

  // ── Get Memory & Profile ──────────────────────────────────────────────────
  getMemory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [memory] = await db.select().from(leadershipMemory)
      .where(eq(leadershipMemory.userId, ctx.user.id));
    return memory ?? null;
  }),

  // ── Before-Meeting Brief ──────────────────────────────────────────────────
  generateBrief: protectedProcedure
    .input(z.object({
      meetingWith: z.string(),
      purpose: z.string(),
      desiredOutcome: z.string().optional(),
      currentIssue: z.string().optional(),
      stakes: z.string().optional(),
      possibleResistance: z.string().optional(),
      readinessBefore: z.number().min(1).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const leaderCtx = await getLeaderContext(ctx.user.id);
      const contextPrompt = buildLeaderContextPrompt(leaderCtx);

      const prompt = `You are an expert executive leadership coach. Generate a Before-Meeting Brief for a leader preparing for an important conversation.${contextPrompt}

Meeting details:
- Meeting with: ${input.meetingWith}
- Purpose: ${input.purpose}
- Desired outcome: ${input.desiredOutcome || 'Not specified'}
- Current issue: ${input.currentIssue || 'Not specified'}
- Stakes: ${input.stakes || 'Not specified'}
- Possible resistance: ${input.possibleResistance || 'Not specified'}

Generate a comprehensive Before-Meeting Brief. Return ONLY valid JSON matching this exact structure:
{
  "realObjective": "The real objective beneath the stated purpose",
  "conversationBeneathConversation": "The deeper leadership dynamic at play",
  "first60Seconds": "Exact opening line and first 60 seconds script",
  "keyMessage": "The single most important message to land",
  "likelyPushback": ["pushback 1", "pushback 2", "pushback 3"],
  "bestResponses": ["response to pushback 1", "response to pushback 2", "response to pushback 3"],
  "whatNotToSay": ["phrase to avoid 1", "phrase to avoid 2"],
  "strongAsk": "The one clear, specific ask to make",
  "howToClose": "How to close the conversation with commitment",
  "readinessScore": 7,
  "readinessAfter": null
}`;

      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
      });

      let brief;
      try {
        const text = response.choices[0].message.content as string;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        brief = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch {
        brief = {
          realObjective: "Secure alignment on the key issue",
          conversationBeneathConversation: "This may be about trust and clarity as much as the stated topic",
          first60Seconds: `"I want to align on ${input.purpose} and agree on the best path forward."`,
          keyMessage: input.purpose,
          likelyPushback: ["Not the right time", "We need more information", "I'm not sure about this"],
          bestResponses: ["I understand. What would make this the right time?", "What specific information would help you decide?", "What would make you more confident?"],
          whatNotToSay: ["You always...", "This is urgent and needs to happen now"],
          strongAsk: "Can we agree on the next step today?",
          howToClose: "Summarise what was agreed and confirm the next action with a date",
          readinessScore: input.readinessBefore ?? 5,
          readinessAfter: null,
        };
      }

      const db2 = await getDb();
      if (!db2) throw new Error('Database unavailable');
      const [saved] = await db2.insert(beforeMeetingBriefs).values({
        userId: ctx.user.id,
        meetingWith: input.meetingWith,
        purpose: input.purpose,
        desiredOutcome: input.desiredOutcome,
        currentIssue: input.currentIssue,
        stakes: input.stakes,
        possibleResistance: input.possibleResistance,
        brief,
        readinessBefore: input.readinessBefore,
      });

      const briefId = (saved as { insertId: number }).insertId;
      if (input.readinessBefore) {
        await db2.insert(readinessScores).values({
          userId: ctx.user.id,
          context: `Before meeting: ${input.meetingWith} — ${input.purpose}`,
          scoreBefore: input.readinessBefore,
          sourceType: 'brief',
          sourceId: briefId,
        });
      }

      return { briefId, brief };
    }),

  getBriefs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(beforeMeetingBriefs)
      .where(eq(beforeMeetingBriefs.userId, ctx.user.id))
      .orderBy(desc(beforeMeetingBriefs.createdAt))
      .limit(10);
  }),

  updateBriefReadiness: protectedProcedure
    .input(z.object({ briefId: z.number(), readinessAfter: z.number().min(1).max(10) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.update(beforeMeetingBriefs)
        .set({ readinessAfter: input.readinessAfter })
        .where(and(eq(beforeMeetingBriefs.id, input.briefId), eq(beforeMeetingBriefs.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── After-Meeting Debrief ─────────────────────────────────────────────────
  generateDebrief: protectedProcedure
    .input(z.object({
      conversationContext: z.string(),
      debriefAnswers: z.array(z.object({ question: z.string(), answer: z.string() })),
    }))
    .mutation(async ({ ctx, input }) => {
      const leaderCtx = await getLeaderContext(ctx.user.id);
      const contextPrompt = buildLeaderContextPrompt(leaderCtx);

      const answersText = input.debriefAnswers
        .map(a => `Q: ${a.question}\nA: ${a.answer}`)
        .join('\n\n');

      const prompt = `You are an expert executive leadership coach conducting an after-meeting debrief.${contextPrompt}

Conversation context: ${input.conversationContext}

Debrief answers from the leader:
${answersText}

Generate a comprehensive After-Meeting Debrief Report. Return ONLY valid JSON:
{
  "whatHappened": "Objective summary of what occurred",
  "whatOtherPersonHeard": "What the other person likely heard vs what was intended",
  "whereConversationShifted": "The turning point and why it shifted",
  "whatYouHandledWell": "Specific things the leader did well",
  "whatYouMissed": "What was missed or could have been done differently",
  "possibleBlindSpot": "A possible blind spot the leader may not see",
  "recoveryMove": "The best recovery move if needed",
  "suggestedFollowUpMessage": "A draft follow-up message to send",
  "recommendedPractice": "Specific practice scenario to prepare for next time",
  "growthProfileUpdate": "One-sentence update to add to the leader's growth profile"
}`;

      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
      });

      let debriefReport;
      try {
        const text = response.choices[0].message.content as string;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        debriefReport = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch {
        debriefReport = {
          whatHappened: "The conversation covered the key issue but may not have reached full resolution.",
          whatOtherPersonHeard: "They may have heard concern or urgency more than collaborative problem-solving.",
          whereConversationShifted: "The conversation shifted when the topic became more specific.",
          whatYouHandledWell: "You raised the issue directly and stayed composed.",
          whatYouMissed: "A clearer ask at the end would have created more commitment.",
          possibleBlindSpot: "You may be interpreting their response as resistance when it may be uncertainty.",
          recoveryMove: "Send a brief follow-up that frames the next step clearly.",
          suggestedFollowUpMessage: `Thanks for the conversation. I wanted to follow up with a clear next step: ${input.conversationContext}. Can we connect briefly to confirm?`,
          recommendedPractice: "Practice closing conversations with a specific commitment ask.",
          growthProfileUpdate: "Working on closing conversations with clear commitments.",
        };
      }

      const debriefTranscript = input.debriefAnswers.map(a => ({ role: 'user', content: `${a.question}: ${a.answer}` }));

      const db2 = await getDb();
      if (!db2) throw new Error('Database unavailable');
      const [saved] = await db2.insert(afterMeetingDebriefs).values({
        userId: ctx.user.id,
        conversationContext: input.conversationContext,
        debriefTranscript,
        debriefReport,
        followUpMessage: debriefReport.suggestedFollowUpMessage,
      });

      // Update leadership memory
      await updateLeadershipMemory(ctx.user.id, 'debrief', debriefReport.growthProfileUpdate);

      return { debriefId: (saved as { insertId: number }).insertId, debriefReport };
    }),

  getDebriefs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(afterMeetingDebriefs)
      .where(eq(afterMeetingDebriefs.userId, ctx.user.id))
      .orderBy(desc(afterMeetingDebriefs.createdAt))
      .limit(10);
  }),

  // ── Say It Better ─────────────────────────────────────────────────────────
  improveMessage: protectedProcedure
    .input(z.object({
      originalText: z.string(),
      context: z.string().optional(),
      variation: z.string().optional(), // warmer | firmer | shorter | more-senior | more-strategic | add-ask | add-impact
    }))
    .mutation(async ({ ctx, input }) => {
      const variationInstruction = input.variation
        ? `\n\nAdditional instruction: Make it ${input.variation.replace(/-/g, ' ')}.`
        : '';

      const prompt = `You are an expert executive communication coach. Improve this leadership message.

Original message: "${input.originalText}"
Context: ${input.context || 'General leadership communication'}${variationInstruction}

Provide three improved versions and analysis. Return ONLY valid JSON:
{
  "diplomatic": "Softer, relationship-preserving version",
  "direct": "Clear, firm, respectful version",
  "executive": "Concise, strategic, business-focused version",
  "toneAssessment": "Assessment of the original tone (e.g., too defensive, too vague, too soft)",
  "clarityScore": 65,
  "executivePresenceScore": 55,
  "whatChanged": "Brief explanation of what was improved and why",
  "shorterVersion": "A very concise version in one sentence"
}`;

      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
      });

      let result;
      try {
        const text = response.choices[0].message.content as string;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch {
        result = {
          diplomatic: "I wanted to share an observation and discuss how we might address it constructively.",
          direct: "I need to raise a specific concern and agree on a clear next step.",
          executive: "There's a business issue we need to resolve. Here's the trade-off and my recommendation.",
          toneAssessment: "The original message may come across as vague or too indirect.",
          clarityScore: 60,
          executivePresenceScore: 55,
          whatChanged: "Added business framing, made the ask explicit, and removed defensive language.",
          shorterVersion: "I need to discuss a specific issue and agree on a clear path forward.",
        };
      }

      const db2 = await getDb();
      if (!db2) throw new Error('Database unavailable');
      await db2.insert(improvedMessages).values({
        userId: ctx.user.id,
        originalText: input.originalText,
        context: input.context,
        result,
      });

      return result;
    }),

  // ── Conversation Script Builder ───────────────────────────────────────────
  buildScript: protectedProcedure
    .input(z.object({
      scriptType: z.string(),
      situationContext: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const leaderCtx = await getLeaderContext(ctx.user.id);
      const contextPrompt = buildLeaderContextPrompt(leaderCtx);

      const prompt = `You are an expert executive leadership coach. Build a structured conversation script.${contextPrompt}

Script type: ${input.scriptType}
Situation: ${input.situationContext}

Generate a complete conversation script using the appropriate framework for this type of conversation. Return ONLY valid JSON:
{
  "scriptType": "${input.scriptType}",
  "openingLine": "The exact opening line to use",
  "context": "How to set the context for the conversation",
  "observation": "The specific observation to share (factual, not judgmental)",
  "businessImpact": "The business impact of the current situation",
  "yourConcern": "Your concern framed as a leadership responsibility",
  "questionInvitation": "An open question to invite their perspective",
  "clearAsk": "The specific, actionable ask",
  "likelyResistance": "The most likely pushback or resistance",
  "responseToResistance": "How to respond to that resistance",
  "closeWithCommitment": "How to close with a specific commitment",
  "followUpNote": "A brief follow-up note to send after the conversation"
}`;

      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
      });

      let script;
      try {
        const text = response.choices[0].message.content as string;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        script = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch {
        script = {
          scriptType: input.scriptType,
          openingLine: "I want to discuss something important and agree on a clear path forward.",
          context: "Set the context by stating the specific situation factually.",
          observation: "I have noticed a specific pattern that I want to address.",
          businessImpact: "This is creating risk for the team and the business.",
          yourConcern: "My concern is that this pattern continues without resolution.",
          questionInvitation: "What is your perspective on this?",
          clearAsk: "Going forward, I need us to agree on a specific commitment.",
          likelyResistance: "They may push back or become defensive.",
          responseToResistance: "I hear you. Let me be more specific about what I am observing.",
          closeWithCommitment: "Can we agree on this specific next step by this date?",
          followUpNote: "Thanks for the conversation. As agreed, the next step is...",
        };
      }

      const db2 = await getDb();
      if (!db2) throw new Error('Database unavailable');
      const [saved] = await db2.insert(conversationScripts).values({
        userId: ctx.user.id,
        scriptType: input.scriptType,
        situationContext: input.situationContext,
        script,
      });

      return { scriptId: (saved as { insertId: number }).insertId, script };
    }),

  saveScript: protectedProcedure
    .input(z.object({ scriptId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.update(conversationScripts)
        .set({ savedAt: new Date() })
        .where(and(eq(conversationScripts.id, input.scriptId), eq(conversationScripts.userId, ctx.user.id)));
      return { success: true };
    }),

  getScripts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(conversationScripts)
      .where(eq(conversationScripts.userId, ctx.user.id))
      .orderBy(desc(conversationScripts.createdAt))
      .limit(20);
  }),

  // ── Commitments ───────────────────────────────────────────────────────────
  addCommitment: protectedProcedure
    .input(z.object({
      text: z.string(),
      dueDate: z.string().optional(),
      sourceType: z.string().optional(),
      sourceId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const [saved] = await db.insert(commitments).values({
        userId: ctx.user.id,
        text: input.text,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      });
      return { commitmentId: (saved as { insertId: number }).insertId };
    }),

  getCommitments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(commitments)
      .where(eq(commitments.userId, ctx.user.id))
      .orderBy(desc(commitments.createdAt))
      .limit(20);
  }),

  updateCommitmentOutcome: protectedProcedure
    .input(z.object({
      commitmentId: z.number(),
      status: z.enum(['done_well', 'done_partial', 'done_poorly', 'avoided', 'postponed']),
      outcome: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get AI recommendation based on outcome
      let aiRecommendation = '';
      if (input.status === 'done_poorly' || input.status === 'avoided') {
        const prompt = `A leader ${input.status === 'avoided' ? 'avoided' : 'had a difficult'} conversation. Outcome: "${input.outcome || 'Not specified'}". In one sentence, what is the best next step?`;
        const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
        aiRecommendation = response.choices[0].message.content as string;
      }

      const db = await getDb();
      if (!db) return { success: false, aiRecommendation: '' };
      await db.update(commitments)
        .set({ status: input.status, outcome: input.outcome, aiRecommendation })
        .where(and(eq(commitments.id, input.commitmentId), eq(commitments.userId, ctx.user.id)));

      return { success: true, aiRecommendation };
    }),

  // ── Growth Profile ────────────────────────────────────────────────────────
  getGrowthProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { memory: null, recentCommits: [], recentBriefs: [], recentDebriefs: [], recentSessions: [], readiness: [], activePlan: undefined };

    const [memory] = await db.select().from(leadershipMemory)
      .where(eq(leadershipMemory.userId, ctx.user.id));

    const recentCommits = await db.select().from(commitments)
      .where(eq(commitments.userId, ctx.user.id))
      .orderBy(desc(commitments.createdAt))
      .limit(10);

    const recentBriefs = await db.select().from(beforeMeetingBriefs)
      .where(eq(beforeMeetingBriefs.userId, ctx.user.id))
      .orderBy(desc(beforeMeetingBriefs.createdAt))
      .limit(5);

    const recentDebriefs = await db.select().from(afterMeetingDebriefs)
      .where(eq(afterMeetingDebriefs.userId, ctx.user.id))
      .orderBy(desc(afterMeetingDebriefs.createdAt))
      .limit(5);

    const recentSessions = await db.select().from(practiceSessions)
      .where(eq(practiceSessions.userId, ctx.user.id))
      .orderBy(desc(practiceSessions.createdAt))
      .limit(10);

    const readiness = await db.select().from(readinessScores)
      .where(eq(readinessScores.userId, ctx.user.id))
      .orderBy(desc(readinessScores.createdAt))
      .limit(20);

    const [activePlan] = await db.select().from(growthPlans)
      .where(and(eq(growthPlans.userId, ctx.user.id), eq(growthPlans.isActive, true)))
      .orderBy(desc(growthPlans.createdAt))
      .limit(1);

    return { memory, recentCommits, recentBriefs, recentDebriefs, recentSessions, readiness, activePlan };
  }),

  generateGrowthPlan: protectedProcedure.mutation(async ({ ctx }) => {
    const leaderCtx = await getLeaderContext(ctx.user.id);
    const contextPrompt = buildLeaderContextPrompt(leaderCtx);

    const db2 = await getDb();
    if (!db2) throw new Error('Database unavailable');
    const recentSessions = await db2.select().from(practiceSessions)
      .where(eq(practiceSessions.userId, ctx.user.id))
      .orderBy(desc(practiceSessions.createdAt))
      .limit(5);

    const sessionSummary = recentSessions.length > 0
      ? `Recent practice sessions: ${recentSessions.map((s: { issueText: string }) => s.issueText).join('; ')}`
      : 'No recent practice sessions';

    const prompt = `You are an expert executive leadership coach. Generate a personalised 30-Day Leadership Growth Plan.${contextPrompt}

${sessionSummary}

Create a focused, actionable 30-day plan. Return ONLY valid JSON:
{
  "growthTheme": "The primary growth theme (e.g., Stakeholder Influence)",
  "whyItMatters": "Why this theme matters for this leader's career",
  "currentPattern": "The current pattern holding them back",
  "targetBehaviour": "The specific behaviour to develop",
  "week1": "Week 1 focus and practice",
  "week2": "Week 2 focus and practice",
  "week3": "Week 3 focus and practice",
  "week4": "Week 4 focus and practice",
  "realWorldActions": ["action 1", "action 2", "action 3"],
  "recommendedRolePlays": ["roleplay 1", "roleplay 2", "roleplay 3"],
  "recommendedDrills": ["drill 1", "drill 2", "drill 3"],
  "reflectionQuestions": ["question 1", "question 2", "question 3"],
  "successIndicators": ["indicator 1", "indicator 2", "indicator 3"]
}`;

    const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });

    let plan;
    try {
      const text = response.choices[0].message.content as string;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      plan = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      plan = {
        growthTheme: "Executive Influence and Stakeholder Alignment",
        whyItMatters: "Senior leaders who can influence without authority move faster and create more impact.",
        currentPattern: "You prepare well but your message loses power because the business ask is not always explicit.",
        targetBehaviour: "Frame issues in business terms and close every conversation with a specific commitment.",
        week1: "Practice the executive update and clear ask drill daily",
        week2: "Practice influencing a skeptical stakeholder scenario",
        week3: "Practice pushback with a senior leader scenario",
        week4: "Debrief one real stakeholder conversation and update your growth profile",
        realWorldActions: ["Identify one stakeholder to pre-align before your next meeting", "Send one executive update this week", "Ask for a specific commitment in your next difficult conversation"],
        recommendedRolePlays: ["Pitch an idea to an executive", "Handle a difficult stakeholder", "Push back on an unrealistic deadline"],
        recommendedDrills: ["Make a clear ask in 30 seconds", "Reframe task into business impact", "Close with commitment"],
        reflectionQuestions: ["What am I not saying directly?", "What commitment do I need from this stakeholder?", "What is the business risk if this remains unresolved?"],
        successIndicators: ["You make clearer asks", "Stakeholders respond with specific commitments", "Your confidence before meetings improves", "You reduce over-explaining"],
      };
    }

    // Deactivate old plans
    await db2.update(growthPlans)
      .set({ isActive: false })
      .where(eq(growthPlans.userId, ctx.user.id));

    const [saved] = await db2.insert(growthPlans).values({
      userId: ctx.user.id,
      plan,
    });

    return { planId: (saved as { insertId: number }).insertId, plan };
  }),

  // ── Human Coach Brief ─────────────────────────────────────────────────────
  generateCoachBrief: protectedProcedure
    .input(z.object({
      shareLevel: z.enum(['summary', 'transcript', 'feedback', 'growth', 'selected']),
    }))
    .mutation(async ({ ctx, input }) => {
      const leaderCtx = await getLeaderContext(ctx.user.id);
      const contextPrompt = buildLeaderContextPrompt(leaderCtx);

    const db2 = await getDb();
    if (!db2) throw new Error('Database unavailable');
    const recentSessions = await db2.select().from(practiceSessions)
      .where(eq(practiceSessions.userId, ctx.user.id))
      .orderBy(desc(practiceSessions.createdAt))
      .limit(3);

      const sessionSummary = recentSessions.map((s: { issueText: string }) => s.issueText).join('; ');

      const prompt = `You are generating a Coach Brief for a human executive coach. This is a professional summary to help the coach prepare for their next session.${contextPrompt}

Recent practice topics: ${sessionSummary || 'None yet'}

Generate a professional Coach Brief. Return ONLY valid JSON:
{
  "currentIssue": "The primary leadership issue the leader is working on",
  "leaderDesiredOutcome": "What the leader wants to achieve",
  "aiObservedPattern": "The pattern the AI has observed across sessions",
  "possibleBlindSpot": "A possible blind spot worth exploring",
  "practiceCompleted": "Summary of practice completed",
  "scoresAndImprovements": "Key scores and improvement areas",
  "commitmentsMade": ["commitment 1", "commitment 2"],
  "suggestedCoachingQuestions": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "followUpItems": ["item 1", "item 2", "item 3"]
}`;

      const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });

      let brief;
      try {
        const text = response.choices[0].message.content as string;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        brief = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch {
        brief = {
          currentIssue: "Stakeholder influence and executive communication",
          leaderDesiredOutcome: "To be more effective in high-stakes conversations",
          aiObservedPattern: "The leader prepares well but delays making a direct ask",
          possibleBlindSpot: "May be interpreting resistance as lack of support when stakeholders need clearer business framing",
          practiceCompleted: "Multiple role-play sessions on stakeholder influence and feedback conversations",
          scoresAndImprovements: "Strong in empathy and preparation; developing directness and closing with commitment",
          commitmentsMade: ["Have the feedback conversation this week", "Send stakeholder alignment note before the steering meeting"],
          suggestedCoachingQuestions: [
            "What are you not saying directly in this relationship?",
            "What commitment do you need from this stakeholder?",
            "What is the business risk if this remains unresolved?",
            "Who needs to be pre-aligned before the formal meeting?",
            "What would executive-level brevity sound like here?",
          ],
          followUpItems: ["Check on the feedback conversation outcome", "Review the stakeholder alignment approach", "Explore the pattern of delayed direct asks"],
        };
      }

      const [saved] = await db2.insert(coachBriefs).values({
        userId: ctx.user.id,
        shareLevel: input.shareLevel,
        brief,
      });

      return { briefId: (saved as { insertId: number }).insertId, brief };
    }),

  // ── Privacy Settings ──────────────────────────────────────────────────────
  getPrivacySettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [settings] = await db.select().from(privacySettings)
      .where(eq(privacySettings.userId, ctx.user.id));
    return settings ?? null;
  }),

  updatePrivacySettings: protectedProcedure
    .input(z.object({
      shareWithCoach: z.enum(['nothing', 'summary', 'transcript', 'feedback', 'growth', 'selected']).optional(),
      shareWithOrg: z.boolean().optional(),
      allowAggregateAnalytics: z.boolean().optional(),
      coachEmail: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const [existing] = await db.select().from(privacySettings)
        .where(eq(privacySettings.userId, ctx.user.id));

      if (existing) {
        await db.update(privacySettings)
          .set(input)
          .where(eq(privacySettings.userId, ctx.user.id));
      } else {
        await db.insert(privacySettings).values({
          userId: ctx.user.id,
          ...input,
        });
      }
      return { success: true };
    }),

  // ── Readiness Scores ──────────────────────────────────────────────────────
  getReadinessTrend: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(readinessScores)
      .where(eq(readinessScores.userId, ctx.user.id))
      .orderBy(desc(readinessScores.createdAt))
      .limit(20);
  }),

  // ── Blind Spot Detection ──────────────────────────────────────────────────
  detectBlindSpots: protectedProcedure
    .input(z.object({ issueDescription: z.string() }))
    .mutation(async ({ input }) => {
      const prompt = `You are an expert executive leadership coach specialising in blind spot detection. Analyse this leader's description and identify possible blind spots.

Issue description: "${input.issueDescription}"

Identify the most important blind spot. Return ONLY valid JSON:
{
  "surfaceIssue": "What the leader thinks the issue is",
  "deeperIssue": "The deeper leadership issue beneath the surface",
  "possibleBlindSpot": "The specific blind spot, phrased carefully and respectfully",
  "whyItMatters": "Why this blind spot matters for their leadership",
  "evidenceFromLanguage": "Specific words or phrases from their description that suggest this blind spot",
  "reframe": "A reframe of the situation that opens new possibilities",
  "oneActionToTest": "One specific action to test whether this reframe is accurate",
  "suggestedPractice": "A specific practice scenario to address this blind spot"
}`;

      const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });

      let result;
      try {
        const text = response.choices[0].message.content as string;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch {
        result = {
          surfaceIssue: "The stated problem",
          deeperIssue: "There may be a deeper leadership dynamic at play",
          possibleBlindSpot: "You may be treating this as an external problem when it may partly be about how the issue is being framed or communicated",
          whyItMatters: "How we frame a problem determines the solutions we can see",
          evidenceFromLanguage: "The language suggests an external attribution",
          reframe: "What if the other person needs something different from what you are currently offering?",
          oneActionToTest: "Have one direct conversation where you ask them what they need from you",
          suggestedPractice: "Practice having a direct, curious conversation about expectations and needs",
        };
      }

      return result;
    }),

  // ── Diagnostic-Based Recommendations ─────────────────────────────────────
  refreshRecommendations: protectedProcedure
    .input(z.object({ topic: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const leaderCtx = await getLeaderContext(ctx.user.id);
    const contextPrompt = buildLeaderContextPrompt(leaderCtx);
    const graph = leaderCtx.graph as Record<string, unknown> | null;
    const moduleEdges = (graph?.moduleEdges as Record<string, number> | undefined) ?? {};
    const focusModules = Object.entries(moduleEdges)
      .filter(([, score]) => score < 85)
      .sort(([, a], [, b]) => a - b)
      .map(([k, v]) => `${MODULE_FULL_NAMES[k] ?? k} (${v}/100)`)
      .join(', ');
        const topicLine = input.topic ? `\n\nTopic Filter: The user has selected "${input.topic}" as their focus area. Prioritise scenarios related to this topic across all recommendation groups.` : '';
    const prompt = `You are an expert executive leadership coach. Generate fresh, varied practice scenario suggestions for a leader.${contextPrompt}${topicLine}
Focus modules (lowest scores first): ${focusModules || 'All modules'}
Generate 3 recommendation groups, one per focus module. Each group should have 3 fresh, specific, real-world practice scenarios${input.topic ? ` related to the topic "${input.topic}"` : ''} that are different from generic examples. Return ONLY valid JSON:
[
  {
    "module": "Module name",
    "score": 78,
    "reason": "One sentence on why this matters for this leader right now",
    "scenarios": ["Specific scenario 1", "Specific scenario 2", "Specific scenario 3"]
  }
]`;
    const response = await invokeLLM({ messages: [{ role: 'user', content: prompt }] });
    try {
      const text = response.choices[0].message.content as string;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : text) as Array<{ module: string; score: number; reason: string; scenarios: string[] }>;
    } catch {
      // Fallback to static recommendations
      return [];
    }
  }),

  getPersonalisedRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id));
    const graph = user?.leadershipGraph as Record<string, unknown> | null;

    const recommendations: Array<{
      module: string;
      score: number;
      scenarios: string[];
      reason: string;
    }> = [];

    if (!graph) return recommendations;

    const moduleEdges = graph.moduleEdges as Record<string, number> | undefined;
    if (!moduleEdges) return recommendations;

    if (moduleEdges.ECI && moduleEdges.ECI < 80) {
      recommendations.push({
        module: 'Executive Communication',
        score: moduleEdges.ECI,
        scenarios: [
          'Speak up in a leadership meeting',
          'Present a strategic idea to the board',
          'Handle a challenge from a senior leader',
          'Present bad news with confidence',
        ],
        reason: `Your Executive Communication score is ${moduleEdges.ECI}. These scenarios will help you build executive presence and clarity.`,
      });
    }

    if (moduleEdges.LII && moduleEdges.LII < 80) {
      recommendations.push({
        module: 'Leadership Influence',
        score: moduleEdges.LII,
        scenarios: [
          'Influence a skeptical peer',
          'Pitch an idea to an executive',
          'Push back on unrealistic expectations',
          'Handle a political stakeholder',
        ],
        reason: `Your Leadership Influence score is ${moduleEdges.LII}. These scenarios will help you build stakeholder influence and alignment.`,
      });
    }

    if (moduleEdges.GCC && moduleEdges.GCC < 80) {
      recommendations.push({
        module: 'GCC Readiness',
        score: moduleEdges.GCC,
        scenarios: [
          'Navigate cross-cultural leadership expectations',
          'Align global and local priorities',
          'Influence without direct authority across geographies',
          'Present GCC value to global leadership',
        ],
        reason: `Your GCC Readiness score is ${moduleEdges.GCC}. These scenarios will help you build cross-functional and global leadership capability.`,
      });
    }

    return recommendations;
  }),
  weeklyStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { sessionsThisWeek: 0, totalSessions: 0, streakDays: 0 };

    // Start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    const allSessions = await db
      .select({ createdAt: practiceSessions.createdAt })
      .from(practiceSessions)
      .where(eq(practiceSessions.userId, ctx.user.id))
      .orderBy(desc(practiceSessions.createdAt));

    const sessionsThisWeek = allSessions.filter(
      (s) => new Date(s.createdAt) >= weekStart
    ).length;

    // Calculate streak: consecutive days with at least one session (going back from today)
    const sessionDates = new Set(
      allSessions.map((s) => {
        const d = new Date(s.createdAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );
    let streakDays = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (sessionDates.has(key)) {
        streakDays++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return { sessionsThisWeek, totalSessions: allSessions.length, streakDays };
  }),

});

// ─── Internal helper: update leadership memory ──────────────────────────────
async function updateLeadershipMemory(userId: number, sourceType: string, update: string) {
  try {
    const db = await getDb();
    if (!db) return;
    const [existing] = await db.select().from(leadershipMemory)
      .where(eq(leadershipMemory.userId, userId));

    const prompt = `You are updating a leader's Leadership Memory profile. 

New update from ${sourceType}: "${update}"
${existing?.aiSummary ? `Current memory summary: "${existing.aiSummary}"` : ''}

Generate an updated one-paragraph memory summary (max 150 words) that captures the leader's recurring themes, patterns, and growth areas. Be specific and useful for future coaching.`;

    const response = await invokeLLM({ messages: [{ role: "user", content: prompt }] });
    const newSummary = response.choices[0].message.content as string;

    if (existing) {
      await db.update(leadershipMemory)
        .set({ aiSummary: newSummary })
        .where(eq(leadershipMemory.userId, userId));
    } else {
      await db.insert(leadershipMemory).values({
        userId,
        aiSummary: newSummary,
      });
    }
  } catch {
    // Non-blocking — memory update failure should not break the main flow
  }
}
