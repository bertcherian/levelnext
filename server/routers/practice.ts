import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  practiceSessions,
  practiceAttempts,
  type PracticeScenario,
  type PracticeMessage,
  type PracticeFeedback,
} from "../../drizzle/schema";

// ── System prompts ─────────────────────────────────────────────────────────────

function COACH_SYSTEM_PROMPT(issueText: string, userName: string): string {
  return `You are the LevelNext AI Practice Coach — a structured leadership coach, not a generic chatbot.

Your role is to help ${userName} prepare for a difficult leadership conversation through structured coaching.

The leader has described this situation:
"${issueText}"

Your coaching approach:
1. Ask ONE focused coaching question at a time (never multiple questions in one message).
2. Use Socratic questioning — help the leader discover insights themselves.
3. Diagnose the real leadership gap, not just the surface issue.
4. Challenge assumptions respectfully.
5. After 4-6 exchanges, provide a structured coaching summary.

Coaching questions to explore (choose the most relevant, in natural order):
- What outcome do you want from this conversation?
- What is happening now vs what should be happening?
- What is the cost of not having this conversation?
- What are you avoiding or finding difficult?
- What assumptions are you making about the other person?
- What would a more senior version of you do here?
- What commitment do you need from the other person?

When you sense the leader is ready (after 4-6 exchanges), provide a structured summary in this EXACT JSON format wrapped in <COACHING_SUMMARY>:
<COACHING_SUMMARY>
{
  "realIssue": "...",
  "leadershipGap": "...",
  "conversationNeeded": "...",
  "recommendedApproach": "...",
  "suggestedOpeningLines": ["...", "...", "..."],
  "likelyResistance": "...",
  "howToHandleResistance": "...",
  "recommendedSimulation": "..."
}
</COACHING_SUMMARY>

Rules:
- Never give generic motivation or HR-policy language.
- Never avoid hard truths.
- Ask before advising.
- Be direct, warm, and specific.
- Keep responses under 120 words unless giving the final summary.`;
}

function SCENARIO_GENERATOR_PROMPT(issueText: string, userName: string, coachingSummary?: string): string {
  const context = coachingSummary
    ? `Coaching summary: ${coachingSummary}`
    : `Direct request from leader`;

  return `You are the LevelNext scenario generator. Create a realistic role play simulation setup for this leadership situation.

Leader: ${userName}
Issue: "${issueText}"
${context}

Generate a scenario in this EXACT JSON format:
{
  "conversationType": "one of: Difficult Feedback | Accountability | Stakeholder Influence | Managing Up | Conflict Resolution | Executive Pitch | Performance Conversation | Career Conversation | Delegation | Expectation Reset",
  "userRole": "the leader's role (e.g., Senior Engineering Manager)",
  "avatarRole": "the other person's role (e.g., Senior Engineer)",
  "relationship": "one of: Direct Report | Peer | Boss | Client | Stakeholder | Executive | Team Member | Cross-functional Partner",
  "context": "2-3 sentence description of the situation",
  "stakes": "why this conversation matters — business and human impact",
  "desiredOutcome": "what the leader wants to achieve",
  "avatarPersonality": "one of: Defensive | Skeptical | Busy Executive | Passive | Political | Overloaded | High Performer with Ego | Emotional | Analytical | Avoidant | Dominant | Underconfident",
  "difficultyLevel": "Medium",
  "successCriteria": "2-3 specific behaviours that indicate the leader handled this well",
  "category": "one of: Managing Self | Managing Teams | Managing Stakeholders"
}

Return ONLY the JSON object. No explanation, no markdown code blocks.`;
}

function AVATAR_SYSTEM_PROMPT(scenario: PracticeScenario, difficulty: string): string {
  const difficultyInstructions: Record<string, string> = {
    Easy: "You are cooperative after mild resistance. You push back once or twice, then become more open when the leader is clear.",
    Medium: "You push back, ask questions, and need convincing. You require 2-3 good responses before shifting. You ask for specifics.",
    Hard: "You are defensive, emotional, skeptical, or evasive depending on your persona. You escalate if the leader is vague or unclear. You need strong handling to become cooperative.",
    Executive: "You are time-poor, sharp, and demanding. You interrupt if the leader is not concise. You expect strategic clarity and business impact. You have very low patience for vagueness.",
  };

  const personaBehaviours: Record<string, string> = {
    Defensive: "You justify your actions, blame circumstances, and resist feedback. You say things like 'That's not fair' or 'You don't understand the full picture'.",
    Skeptical: "You challenge every assumption. You ask 'Where's the evidence?' and 'Why should I believe that?'",
    "Busy Executive": "You interrupt. You say 'Get to the point' and 'What's the business impact?' You check your phone mentally.",
    Passive: "You give short answers. 'Okay', 'Sure', 'I'll try'. You avoid commitment.",
    Political: "You appear agreeable but deflect. 'That's interesting, let me think about it.' You never give a direct answer.",
    Overloaded: "You want clarity, brevity, and solutions. You say 'I have 5 minutes. What do you need?'",
    "High Performer with Ego": "You resist correction because you deliver results. 'I've always done it this way and it works.'",
    Emotional: "You feel hurt, misunderstood, or blamed. You become quiet or show frustration.",
    Analytical: "You want data, structure, and logic. 'Can you give me specific examples?' 'What's the data on this?'",
    Avoidant: "You deflect, postpone, or change topic. 'Can we talk about this later?' 'I'm not sure this is the right time.'",
    Dominant: "You push back aggressively and test confidence. You interrupt and challenge the leader's authority.",
    Underconfident: "You need encouragement and clarity. You apologise frequently and seek reassurance.",
  };

  const persona = personaBehaviours[scenario.avatarPersonality] ?? "You respond realistically to the situation.";
  const difficultyGuide = difficultyInstructions[difficulty] ?? difficultyInstructions.Medium;

  return `You are playing the role of ${scenario.avatarRole} in a leadership conversation practice simulation.

SITUATION: ${scenario.context}

YOUR ROLE: ${scenario.avatarRole}
RELATIONSHIP TO LEADER: ${scenario.relationship}
YOUR PERSONALITY: ${scenario.avatarPersonality}

HOW YOU BEHAVE:
${persona}

DIFFICULTY: ${difficulty}
${difficultyGuide}

CRITICAL RULES:
1. Stay in character at ALL times. Never break character.
2. Do NOT give coaching advice or hints.
3. Do NOT agree too quickly.
4. React to the leader's tone, clarity, confidence, and empathy.
5. If the leader is vague, ask for specifics.
6. If the leader is clear, respectful, and specific, gradually become more open.
7. Keep responses realistic and conversational — 2-4 sentences maximum.
8. Do NOT reveal that you are an AI.
9. The conversation is about: ${scenario.conversationType}
10. The stakes: ${scenario.stakes}

Start the conversation by responding to whatever the leader says first. Do not introduce yourself or explain the scenario.`;
}

function PAUSE_COACHING_PROMPT(transcript: PracticeMessage[], scenario: PracticeScenario): string {
  const lastFew = transcript.slice(-6).map(m =>
    `${m.role === "user" ? "Leader" : scenario.avatarRole}: ${m.content}`
  ).join("\n");

  return `You are the LevelNext AI Practice Coach. A leader has paused their role play simulation to get tactical coaching.

SCENARIO: ${scenario.conversationType} with a ${scenario.avatarPersonality} ${scenario.avatarRole}
DESIRED OUTCOME: ${scenario.desiredOutcome}

RECENT CONVERSATION:
${lastFew}

Provide ONE specific, tactical coaching observation in 2-3 sentences. Be direct and specific to what just happened.
Focus on ONE of these if relevant: clarity of message, naming the behaviour, asking for commitment, handling resistance, empathy before redirecting, business impact framing, or closing the conversation.

Do NOT give generic advice. Reference what the leader actually said. Give a better alternative phrase if relevant.
Keep it under 80 words. Start with the observation, not with "I notice" or "You should".`;
}

function FEEDBACK_PROMPT(transcript: PracticeMessage[], scenario: PracticeScenario, attemptNumber: number): string {
  const fullTranscript = transcript.map(m =>
    `${m.role === "user" ? "Leader" : m.role === "avatar" ? scenario.avatarRole : "Coach"}: ${m.content}`
  ).join("\n");

  return `You are the LevelNext AI Practice Coach. Generate a detailed feedback report for this role play attempt.

SCENARIO: ${scenario.conversationType}
AVATAR: ${scenario.avatarPersonality} ${scenario.avatarRole}
DIFFICULTY: ${scenario.difficultyLevel}
DESIRED OUTCOME: ${scenario.desiredOutcome}
SUCCESS CRITERIA: ${scenario.successCriteria}
ATTEMPT NUMBER: ${attemptNumber}

FULL TRANSCRIPT:
${fullTranscript}

Generate feedback in this EXACT JSON format:
{
  "overallScore": <number 0-100>,
  "dimensionScores": [
    {"dimension": "Clarity of Message", "score": <1-5>, "comment": "<specific observation>"},
    {"dimension": "Specificity", "score": <1-5>, "comment": "<specific observation>"},
    {"dimension": "Handling Resistance", "score": <1-5>, "comment": "<specific observation>"},
    {"dimension": "Empathy", "score": <1-5>, "comment": "<specific observation>"},
    {"dimension": "Confidence", "score": <1-5>, "comment": "<specific observation>"},
    {"dimension": "Asking for Commitment", "score": <1-5>, "comment": "<specific observation>"},
    {"dimension": "Conversation Closure", "score": <1-5>, "comment": "<specific observation>"}
  ],
  "whatWorked": "<specific observation with example from transcript>",
  "whatDidNotWork": "<specific observation with example from transcript>",
  "missedOpportunities": "<what the leader could have done at a key moment>",
  "strongerPhrases": ["<alternative phrase 1>", "<alternative phrase 2>", "<alternative phrase 3>"],
  "whereConversationShifted": "<the exact moment where things changed — for better or worse>",
  "whatOtherPersonHeard": "<what the avatar likely experienced emotionally and cognitively>",
  "oneBehaviourToImprove": "<single most impactful improvement for next attempt>",
  "recommendedNextAttempt": "<specific suggestion for retry>",
  "suggestedRealWorldAction": "<one concrete action to take in the real world>"
}

Be specific. Reference actual words from the transcript. Do not give vague praise. Return ONLY the JSON object.`;
}

// ── Router ─────────────────────────────────────────────────────────────────────

export const practiceRouter = router({
  // Create a new practice session
  createSession: protectedProcedure
    .input(z.object({ issueText: z.string().min(5).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db
        .insert(practiceSessions)
        .values({
          userId: ctx.user.id,
          issueText: input.issueText,
          status: "setup",
          coachingTranscript: [],
        })
        .$returningId();
      return { sessionId: result[0].id };
    }),

  // Get a session
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(practiceSessions)
        .where(and(eq(practiceSessions.id, input.sessionId), eq(practiceSessions.userId, ctx.user.id)))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return rows[0];
    }),

  // Send a coaching message (Coach Me First mode)
  sendCoachMessage: protectedProcedure
    .input(z.object({ sessionId: z.number(), message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(practiceSessions)
        .where(and(eq(practiceSessions.id, input.sessionId), eq(practiceSessions.userId, ctx.user.id)))
        .limit(1);
      const session = rows[0];
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const messages: PracticeMessage[] = (session.coachingTranscript as PracticeMessage[]) ?? [];
      const userMsg: PracticeMessage = { role: "user", content: input.message, timestamp: new Date().toISOString() };
      const updatedMessages = [...messages, userMsg];

      const llmMessages = updatedMessages.slice(-12).map(m => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      }));

      const systemMsg = { role: "system" as const, content: COACH_SYSTEM_PROMPT(session.issueText, ctx.user.name ?? "Leader") };
      const llmResult = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [systemMsg, ...llmMessages],
        maxTokens: 600,
      });
      const rawContent = llmResult.choices[0]?.message?.content ?? "";
      const content = typeof rawContent === "string" ? rawContent : rawContent.map((c: any) => c.text ?? "").join("");

      const assistantMsg: PracticeMessage = { role: "coach", content, timestamp: new Date().toISOString() };
      const finalMessages = [...updatedMessages, assistantMsg];

      // Check if response contains coaching summary
      let coachingSummary: Record<string, string> | null = null;
      const summaryMatch = content.match(/<COACHING_SUMMARY>([\s\S]*?)<\/COACHING_SUMMARY>/);
      if (summaryMatch) {
        try { coachingSummary = JSON.parse(summaryMatch[1].trim()); } catch { /* ignore */ }
      }

      await db.update(practiceSessions)
        .set({ coachingTranscript: finalMessages, status: "coaching" })
        .where(eq(practiceSessions.id, input.sessionId));

      return { message: assistantMsg, coachingSummary, messages: finalMessages };
    }),

  // Generate scenario (from issue text, optionally with coaching summary)
  generateScenario: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      coachingSummary: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(practiceSessions)
        .where(and(eq(practiceSessions.id, input.sessionId), eq(practiceSessions.userId, ctx.user.id)))
        .limit(1);
      const session = rows[0];
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const prompt = SCENARIO_GENERATOR_PROMPT(session.issueText, ctx.user.name ?? "Leader", input.coachingSummary);
      const llmResult = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 600,
      });
      const raw = llmResult.choices[0]?.message?.content ?? "{}";
      const content = typeof raw === "string" ? raw : raw.map((c: any) => c.text ?? "").join("");

      let scenario: PracticeScenario;
      try {
        const start = content.indexOf("{");
        const end = content.lastIndexOf("}");
        scenario = JSON.parse(content.slice(start, end + 1));
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate scenario" });
      }

      await db.update(practiceSessions)
        .set({ scenario, status: "setup" })
        .where(eq(practiceSessions.id, input.sessionId));

      return { scenario };
    }),

  // Update scenario (user edits)
  updateScenario: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      scenario: z.object({
        conversationType: z.string(),
        userRole: z.string(),
        avatarRole: z.string(),
        relationship: z.string(),
        context: z.string(),
        stakes: z.string(),
        desiredOutcome: z.string(),
        avatarPersonality: z.string(),
        difficultyLevel: z.enum(["Easy", "Medium", "Hard", "Executive"]),
        successCriteria: z.string(),
        category: z.string(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(practiceSessions)
        .set({ scenario: input.scenario as PracticeScenario, status: "setup" })
        .where(and(eq(practiceSessions.id, input.sessionId), eq(practiceSessions.userId, ctx.user.id)));
      return { success: true };
    }),

  // Start a new attempt (role play)
  startAttempt: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(practiceSessions)
        .where(and(eq(practiceSessions.id, input.sessionId), eq(practiceSessions.userId, ctx.user.id)))
        .limit(1);
      const session = rows[0];
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      // Count existing attempts
      const existing = await db
        .select()
        .from(practiceAttempts)
        .where(eq(practiceAttempts.sessionId, input.sessionId));
      const attemptNumber = existing.length + 1;

      const result = await db.insert(practiceAttempts)
        .values({
          sessionId: input.sessionId,
          userId: ctx.user.id,
          attemptNumber,
          transcript: [],
        })
        .$returningId();

      await db.update(practiceSessions)
        .set({ status: "roleplay" })
        .where(eq(practiceSessions.id, input.sessionId));

      return { attemptId: result[0].id, attemptNumber };
    }),

  // Send a role play message (avatar responds)
  sendRolePlayMessage: protectedProcedure
    .input(z.object({ attemptId: z.number(), message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const attemptRows = await db
        .select()
        .from(practiceAttempts)
        .where(and(eq(practiceAttempts.id, input.attemptId), eq(practiceAttempts.userId, ctx.user.id)))
        .limit(1);
      const attempt = attemptRows[0];
      if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });

      const sessionRows = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.id, attempt.sessionId))
        .limit(1);
      const session = sessionRows[0];
      if (!session?.scenario) throw new TRPCError({ code: "BAD_REQUEST", message: "No scenario set" });

      const scenario = session.scenario as PracticeScenario;
      const transcript: PracticeMessage[] = (attempt.transcript as PracticeMessage[]) ?? [];
      const userMsg: PracticeMessage = { role: "user", content: input.message, timestamp: new Date().toISOString() };
      const updatedTranscript = [...transcript, userMsg];

      const llmMessages = updatedTranscript.slice(-14).map(m => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      }));

      const systemMsg = { role: "system" as const, content: AVATAR_SYSTEM_PROMPT(scenario, scenario.difficultyLevel) };
      const llmResult = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [systemMsg, ...llmMessages],
        maxTokens: 300,
      });
      const raw = llmResult.choices[0]?.message?.content ?? "";
      const content = typeof raw === "string" ? raw : raw.map((c: any) => c.text ?? "").join("");

      const avatarMsg: PracticeMessage = { role: "avatar", content, timestamp: new Date().toISOString() };
      const finalTranscript = [...updatedTranscript, avatarMsg];

      await db.update(practiceAttempts)
        .set({ transcript: finalTranscript })
        .where(eq(practiceAttempts.id, input.attemptId));

      return { message: avatarMsg, transcript: finalTranscript };
    }),

  // Pause for coaching
  pauseForCoaching: protectedProcedure
    .input(z.object({ attemptId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const attemptRows = await db
        .select()
        .from(practiceAttempts)
        .where(and(eq(practiceAttempts.id, input.attemptId), eq(practiceAttempts.userId, ctx.user.id)))
        .limit(1);
      const attempt = attemptRows[0];
      if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });

      const sessionRows = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.id, attempt.sessionId))
        .limit(1);
      const session = sessionRows[0];
      if (!session?.scenario) throw new TRPCError({ code: "BAD_REQUEST" });

      const transcript = (attempt.transcript as PracticeMessage[]) ?? [];
      const scenario = session.scenario as PracticeScenario;

      const prompt = PAUSE_COACHING_PROMPT(transcript, scenario);
      const llmResult = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 200,
      });
      const raw = llmResult.choices[0]?.message?.content ?? "";
      const coaching = typeof raw === "string" ? raw : raw.map((c: any) => c.text ?? "").join("");

      return { coaching };
    }),

  // End simulation and generate feedback
  endSimulation: protectedProcedure
    .input(z.object({ attemptId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const attemptRows = await db
        .select()
        .from(practiceAttempts)
        .where(and(eq(practiceAttempts.id, input.attemptId), eq(practiceAttempts.userId, ctx.user.id)))
        .limit(1);
      const attempt = attemptRows[0];
      if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });

      const sessionRows = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.id, attempt.sessionId))
        .limit(1);
      const session = sessionRows[0];
      if (!session?.scenario) throw new TRPCError({ code: "BAD_REQUEST" });

      const transcript = (attempt.transcript as PracticeMessage[]) ?? [];
      const scenario = session.scenario as PracticeScenario;

      if (transcript.length < 2) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Not enough conversation to generate feedback" });
      }

      const prompt = FEEDBACK_PROMPT(transcript, scenario, attempt.attemptNumber);
      const llmResult = await invokeLLM({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1200,
      });
      const raw = llmResult.choices[0]?.message?.content ?? "{}";
      const content = typeof raw === "string" ? raw : raw.map((c: any) => c.text ?? "").join("");

      let feedback: PracticeFeedback;
      try {
        const start = content.indexOf("{");
        const end = content.lastIndexOf("}");
        feedback = JSON.parse(content.slice(start, end + 1));
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate feedback" });
      }

      await db.update(practiceAttempts)
        .set({ feedback, overallScore: feedback.overallScore, completedAt: new Date() })
        .where(eq(practiceAttempts.id, input.attemptId));

      await db.update(practiceSessions)
        .set({ status: "feedback" })
        .where(eq(practiceSessions.id, attempt.sessionId));

      return { feedback, attemptId: input.attemptId };
    }),

  // Get attempt with feedback
  getAttempt: protectedProcedure
    .input(z.object({ attemptId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(practiceAttempts)
        .where(and(eq(practiceAttempts.id, input.attemptId), eq(practiceAttempts.userId, ctx.user.id)))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return rows[0];
    }),

  // Save reflection and action commitment
  saveReflection: protectedProcedure
    .input(z.object({
      attemptId: z.number(),
      reflection: z.string().optional(),
      actionCommitment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(practiceAttempts)
        .set({ userReflection: input.reflection, actionCommitment: input.actionCommitment })
        .where(and(eq(practiceAttempts.id, input.attemptId), eq(practiceAttempts.userId, ctx.user.id)));
      return { success: true };
    }),

  // Get practice history
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const sessions = await db
      .select()
      .from(practiceSessions)
      .where(eq(practiceSessions.userId, ctx.user.id))
      .orderBy(desc(practiceSessions.createdAt))
      .limit(50);

    const sessionIds = sessions.map(s => s.id);
    if (sessionIds.length === 0) return { sessions: [], totalAttempts: 0, averageScore: null };

    const attempts = await db
      .select()
      .from(practiceAttempts)
      .where(eq(practiceAttempts.userId, ctx.user.id))
      .orderBy(desc(practiceAttempts.createdAt));

    const completedAttempts = attempts.filter(a => a.overallScore !== null);
    const averageScore = completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.overallScore ?? 0), 0) / completedAttempts.length)
      : null;

    return { sessions, attempts, totalAttempts: attempts.length, averageScore };
  }),

  // Get attempts for a session
  getSessionAttempts: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(practiceAttempts)
        .where(and(eq(practiceAttempts.sessionId, input.sessionId), eq(practiceAttempts.userId, ctx.user.id)))
        .orderBy(practiceAttempts.attemptNumber);
      return rows;
    }),
});
