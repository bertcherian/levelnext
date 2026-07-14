import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  practiceSessions,
  practiceAttempts,
  userProductEnrollments,
  type PracticeScenario,
  type PracticeMessage,
  type PracticeFeedback,
} from "../../drizzle/schema";

// ── Career Intelligence prompts ─────────────────────────────────────────────────────
const CI_CONVERSATION_TYPES = [
  "Salary Negotiation", "Promotion Conversation", "Internal Career Move",
  "Career Pivot Discussion", "Executive Job Interview", "Networking Conversation",
  "Managing Your Manager", "Visibility & Sponsorship Ask", "Resignation Conversation",
  "Counter-offer Handling", "Career Boundary Setting", "Asking for a Stretch Assignment",
  "Feedback on Career Trajectory", "Stakeholder Influence for Career Growth", "Difficult Career Feedback",
];

function CI_COACH_SYSTEM_PROMPT(issueText: string, userName: string): string {
  return `You are the LevelNext Career Practice Coach — a sophisticated career strategy and conversation practice system.
Your role is to help ${userName} navigate high-stakes career conversations with clarity, confidence, and strategy.
The professional has described this career situation:
"${issueText}"
Your primary responsibilities:
1. Understand the career situation and clarify the desired outcome.
2. Identify the real career challenge beneath the surface (positioning, visibility, leverage, timing).
3. Surface assumptions the professional may be making about their market value or options.
4. Clarify the specific observable behaviour or message they need to deliver.
5. Decide whether they should prepare, practise, or explore the issue more deeply with Career Strategist.
Coaching approach:
- Ask ONE focused question at a time.
- Use Socratic questioning — help the professional discover insights themselves.
- After 4–6 exchanges, provide a structured coaching summary.
Career-specific questions:
- What outcome do you want from this conversation?
- What is your BATNA here?
- What leverage do you have that you are not using?
- What assumptions are you making about what is possible?
- What would someone with more career optionality do here?
When ready, provide a structured summary in <COACHING_SUMMARY> tags with JSON:
{
  "realIssue": "...", "careerGap": "...", "behaviourToStrengthen": "...",
  "conversationNeeded": "...", "recommendedApproach": "...",
  "suggestedOpeningLines": ["...", "...", "..."],
  "likelyResistance": "...", "howToHandleResistance": "...",
  "recommendedSimulation": "...", "commitmentSuggestion": "..."
}
Tone: strategic, calm, direct, practical. Never generic. Keep responses under 120 words unless giving the final summary.`.trim();
}

function CI_SCENARIO_GENERATOR_PROMPT(issueText: string, userName: string, coachingSummary?: string): string {
  const context = coachingSummary ? `Coaching summary: ${coachingSummary}` : `Direct request from professional`;
  return `You are the LevelNext Career scenario generator. Create a realistic role play simulation for this career situation.
Professional: ${userName}
Issue: "${issueText}"
${context}
Generate a scenario in this EXACT JSON format:
{
  "conversationType": "one of: ${CI_CONVERSATION_TYPES.join(' | ')}",
  "userRole": "the professional's role (e.g., Senior Product Manager)",
  "avatarRole": "the other person's role (e.g., Hiring Manager)",
  "relationship": "one of: Hiring Manager | Current Manager | HR Business Partner | Executive Sponsor | Peer | Recruiter | Mentor | Board Member",
  "context": "2-3 sentence description of the career situation",
  "stakes": "why this conversation matters — career and financial impact",
  "desiredOutcome": "what the professional wants to achieve",
  "behaviourToStrengthen": "the specific observable career behaviour this simulation develops",
  "avatarPersonality": "one of: Skeptical | Busy Executive | Analytical | Passive | Dominant | Political | Defensive | Overloaded",
  "difficultyLevel": "Medium",
  "successCriteria": "2-3 specific behaviours that indicate the professional handled this well",
  "category": "one of: Career Positioning | Career Negotiation | Career Navigation"
}
Return ONLY the JSON object. No explanation, no markdown code blocks.`;
}

// ── System prompts ─────────────────────────────────────────────────────────────

function COACH_SYSTEM_PROMPT(issueText: string, userName: string, diagnosticContext?: string): string {
  const diagContext = diagnosticContext
    ? `\nDiagnostic context for ${userName}:\n${diagnosticContext}\n`
    : "";

  return `You are the LevelNext AI Practice Coach — a sophisticated, context-aware leadership practice system.

Your role is to help ${userName} move through this cycle: Identify → Commit → Prepare → Practise → Apply → Reflect → Repeat.
${diagContext}
The leader has described this situation:
"${issueText}"

Your primary responsibilities in this conversation:
1. Understand the situation and clarify the desired outcome.
2. Identify the interpersonal or leadership challenge beneath the surface.
3. Surface assumptions the leader may be making.
4. Clarify the specific observable behaviour the leader needs to demonstrate.
5. Decide whether the leader should prepare, practise, act, or explore the issue more deeply with Guide.

Coaching approach:
- Ask ONE focused question at a time. Never multiple questions in one message.
- Use Socratic questioning — help the leader discover insights themselves.
- Diagnose the real leadership gap, not just the surface issue.
- Challenge assumptions respectfully.
- After 4–6 exchanges, provide a structured coaching summary.

When to escalate to Guide:
- The issue is primarily emotional or identity-related.
- The same behaviour is repeatedly avoided.
- The leader expresses strong anxiety, shame, anger, or helplessness.
- The issue involves complex organisational politics.
- The leader is uncertain what outcome they want.
- A practical rehearsal will not address the real issue.

When escalating, say: "This appears to be less about how to phrase the message and more about [underlying issue]. Would you like to explore that with Guide first, or continue by preparing the conversation?"

Coaching questions to explore (choose the most relevant, in natural order):
- What outcome do you want from this conversation?
- What is happening now versus what should be happening?
- What is the cost of not having this conversation?
- What are you avoiding or finding difficult?
- What assumptions are you making about the other person?
- What would a more senior version of you do here?
- What specific commitment do you need from the other person?

When you sense the leader is ready (after 4–6 exchanges), provide a structured summary in this EXACT format wrapped in <COACHING_SUMMARY>:
<COACHING_SUMMARY>
{
  "realIssue": "...",
  "leadershipGap": "...",
  "behaviourToStrengthen": "...",
  "conversationNeeded": "...",
  "recommendedApproach": "...",
  "suggestedOpeningLines": ["...", "...", "..."],
  "likelyResistance": "...",
  "howToHandleResistance": "...",
  "recommendedSimulation": "...",
  "commitmentSuggestion": "...",
  "diagnosticLink": "..."
}
</COACHING_SUMMARY>

Tone rules:
- Intelligent, calm, concise, respectful, senior, practical.
- Encouraging WITHOUT being enthusiastic.
- Direct WITHOUT being harsh.
- Human WITHOUT pretending to be human.
- NEVER use: "crush your goals", "you've got this", "amazing job", "fantastic", "you nailed it".
- Better encouragement: "You stayed with the difficult part rather than softening the message. That is meaningful progress."
- Never give generic motivation or HR-policy language.
- Never avoid hard truths.
- Ask before advising.
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
  "conversationType": "one of: Difficult Feedback | Accountability | Stakeholder Influence | Managing Up | Conflict Resolution | Executive Pitch | Performance Conversation | Career Conversation | Delegation | Expectation Reset | Setting Boundaries | Saying No | Delivering Bad News | Coaching a Team Member | Responding Under Pressure | Challenging Groupthink | Asking for Resources | Negotiation | Navigating Organizational Politics | Building Cross-functional Coalition | Winning Support Without Authority | Presenting to Skeptical Executive | Managing Competing Priorities | Navigating Ambiguous Decision | Protecting Team from Political Pressure | Recovering Damaged Relationship",
  "userRole": "the leader's role (e.g., Senior Engineering Manager)",
  "avatarRole": "the other person's role (e.g., Senior Engineer)",
  "relationship": "one of: Direct Report | Peer | Boss | Client | Stakeholder | Executive | Team Member | Cross-functional Partner",
  "context": "2-3 sentence description of the situation",
  "stakes": "why this conversation matters — business and human impact",
  "desiredOutcome": "what the leader wants to achieve",
  "behaviourToStrengthen": "the specific observable leadership behaviour this simulation develops",
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
11. The behaviour the leader is developing: ${(scenario as any).behaviourToStrengthen ?? "effective leadership communication"}

Start the conversation by responding to whatever the leader says first. Do not introduce yourself or explain the scenario.`;
}

function PAUSE_COACHING_PROMPT(transcript: PracticeMessage[], scenario: PracticeScenario): string {
  const lastFew = transcript.slice(-6).map(m =>
    `${m.role === "user" ? "Leader" : scenario.avatarRole}: ${m.content}`
  ).join("\n");

  return `You are the LevelNext AI Practice Coach. A leader has paused their role play simulation to get tactical coaching.

SCENARIO: ${scenario.conversationType} with a ${scenario.avatarPersonality} ${scenario.avatarRole}
DESIRED OUTCOME: ${scenario.desiredOutcome}
BEHAVIOUR BEING DEVELOPED: ${(scenario as any).behaviourToStrengthen ?? "effective leadership communication"}

RECENT CONVERSATION:
${lastFew}

Provide ONE specific, tactical coaching observation in 2-3 sentences. Be direct and specific to what just happened.
Focus on ONE of these if relevant: clarity of message, naming the behaviour, asking for commitment, handling resistance, empathy before redirecting, business impact framing, or closing the conversation.

Do NOT give generic advice. Reference what the leader actually said. Give a better alternative phrase if relevant.
Keep it under 80 words. Start with the observation, not with "I notice" or "You should".
Tone: intelligent, calm, direct, practical. No excessive praise.`;
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
BEHAVIOUR BEING DEVELOPED: ${(scenario as any).behaviourToStrengthen ?? "effective leadership communication"}
SUCCESS CRITERIA: ${scenario.successCriteria}
ATTEMPT NUMBER: ${attemptNumber}

FULL TRANSCRIPT:
${fullTranscript}

Generate feedback in this EXACT JSON format:
{
  "overallScore": <number 0-100>,
  "evidenceLevel": "one of: Prepared | Practised | Applied | Reflected | Repeated | Demonstrated consistently",
  "dimensionScores": [
    {"dimension": "Clarity of Message", "score": <1-5>, "comment": "<specific observation from transcript>"},
    {"dimension": "Specificity", "score": <1-5>, "comment": "<specific observation from transcript>"},
    {"dimension": "Handling Resistance", "score": <1-5>, "comment": "<specific observation from transcript>"},
    {"dimension": "Empathy", "score": <1-5>, "comment": "<specific observation from transcript>"},
    {"dimension": "Confidence", "score": <1-5>, "comment": "<specific observation from transcript>"},
    {"dimension": "Asking for Commitment", "score": <1-5>, "comment": "<specific observation from transcript>"},
    {"dimension": "Conversation Closure", "score": <1-5>, "comment": "<specific observation from transcript>"}
  ],
  "whatWorked": "<specific observation with example from transcript>",
  "whatDidNotWork": "<specific observation with example from transcript>",
  "missedOpportunities": "<what the leader could have done at a key moment>",
  "strongerPhrases": ["<alternative phrase 1>", "<alternative phrase 2>", "<alternative phrase 3>"],
  "whereConversationShifted": "<the exact moment where things changed — for better or worse>",
  "whatOtherPersonHeard": "<what the avatar likely experienced emotionally and cognitively>",
  "oneBehaviourToImprove": "<single most impactful improvement for next attempt>",
  "recommendedNextAttempt": "<specific suggestion for retry>",
  "suggestedRealWorldAction": "<one concrete action to take in the real world>",
  "commitmentSuggestion": "<a specific, observable commitment the leader could make for a real workplace situation>",
  "momentumPrompt": "<a brief, practical question to ask before the next real-world application>"
}

Tone: intelligent, calm, specific, direct. No excessive praise. Reference actual words from the transcript.
Do not give vague praise. Return ONLY the JSON object.`;
}

function DEBRIEF_PROMPT(
  whatHappened: string,
  whatDifferent: string,
  whatWorked: string,
  whereReverted: string,
  whatNext: string,
  userName: string,
  developmentPriority?: string
): string {
  return `You are the LevelNext AI Practice Coach. A leader has completed an After-Meeting Debrief.

Leader: ${userName}
Development priority: ${developmentPriority ?? "not specified"}

Debrief responses:
1. What happened: ${whatHappened}
2. What they did differently: ${whatDifferent}
3. What worked: ${whatWorked}
4. Where they reverted to old patterns: ${whereReverted}
5. What to repeat or change next time: ${whatNext}

Provide a concise debrief response in this JSON format:
{
  "evidenceCapture": "<specific observation about what was applied — reference their actual words>",
  "progressReinforcement": "<acknowledge specific progress without exaggerated praise>",
  "patternObservation": "<observation about any reversion or repeated pattern>",
  "nextPracticeOpportunity": "<specific suggestion for the next real workplace application>",
  "commitmentSuggestion": "<a specific, observable commitment for the next situation>",
  "evidenceLevel": "one of: Prepared | Practised | Applied | Reflected | Repeated | Demonstrated consistently"
}

Tone: intelligent, calm, concise, respectful. Avoid generic praise. Reference what they actually said.
Return ONLY the JSON object.`;
}

function COMMITMENT_CREATION_PROMPT(
  situation: string,
  behaviour: string,
  userName: string,
  diagnosticContext?: string
): string {
  return `You are the LevelNext AI Practice Coach helping ${userName} create a specific practice commitment.

Situation: ${situation}
Behaviour to develop: ${behaviour}
${diagnosticContext ? `Diagnostic context: ${diagnosticContext}` : ""}

Help create a specific, observable commitment. A commitment must be behavioural and observable.

Poor: "Improve executive presence."
Better: "In Monday's leadership review, open with the recommendation, explain the rationale in under two minutes, and pause for questions."

Poor: "Delegate more."
Better: "Ask Anita to lead Thursday's client review and resist taking over unless she explicitly asks for support."

Generate a commitment in this JSON format:
{
  "developmentPriority": "<the leadership dimension being developed>",
  "specificBehaviour": "<the exact observable behaviour>",
  "situation": "<the real workplace situation>",
  "personOrGroup": "<who is involved>",
  "timing": "<when this will happen>",
  "desiredOutcome": "<what success looks like>",
  "commitmentStatement": "<a single clear sentence the leader can commit to>",
  "challengeQuestion": "<a question to test if the commitment is specific enough: 'What would someone in the room actually see or hear you do differently?'>",
  "suggestedReflectionTime": "<when to reflect after the event>"
}

Return ONLY the JSON object.`;
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

      // Detect active product to pick the right coach prompt
      let activeProductId = "leadership_intelligence";
      try {
        const enrollResult = await db.select({ productId: userProductEnrollments.productId }).from(userProductEnrollments).where(and(eq(userProductEnrollments.userId, ctx.user.id), eq(userProductEnrollments.isActive, true))).limit(1);
        if (enrollResult[0]) activeProductId = enrollResult[0].productId;
      } catch { /* non-fatal */ }
      const coachPromptContent = activeProductId === "career_intelligence"
        ? CI_COACH_SYSTEM_PROMPT(session.issueText, ctx.user.name ?? "Professional")
        : COACH_SYSTEM_PROMPT(session.issueText, ctx.user.name ?? "Leader");
      const systemMsg = { role: "system" as const, content: coachPromptContent };
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

      // Detect active product to pick the right scenario generator
      let activeProductIdForScenario = "leadership_intelligence";
      try {
        const enrollResult = await db.select({ productId: userProductEnrollments.productId }).from(userProductEnrollments).where(and(eq(userProductEnrollments.userId, ctx.user.id), eq(userProductEnrollments.isActive, true))).limit(1);
        if (enrollResult[0]) activeProductIdForScenario = enrollResult[0].productId;
      } catch { /* non-fatal */ }
      const prompt = activeProductIdForScenario === "career_intelligence"
        ? CI_SCENARIO_GENERATOR_PROMPT(session.issueText, ctx.user.name ?? "Professional", input.coachingSummary)
        : SCENARIO_GENERATOR_PROMPT(session.issueText, ctx.user.name ?? "Leader", input.coachingSummary);
      const llmResult = await invokeLLM({
        model: "gpt-4o",
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
        .set({ scenario, status: "scenario_ready" })
        .where(eq(practiceSessions.id, input.sessionId));

      return { scenario };
    }),

  // Start a new attempt
  startAttempt: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      difficulty: z.enum(["Easy", "Medium", "Hard", "Executive"]).default("Medium"),
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
      if (!session?.scenario) throw new TRPCError({ code: "BAD_REQUEST", message: "No scenario generated yet" });

      const prevAttempts = await db
        .select()
        .from(practiceAttempts)
        .where(eq(practiceAttempts.sessionId, input.sessionId));

      const result = await db
        .insert(practiceAttempts)
        .values({
          sessionId: input.sessionId,
          userId: ctx.user.id,
          attemptNumber: prevAttempts.length + 1,
          difficulty: input.difficulty,
          transcript: [],
        })
        .$returningId();

      await db.update(practiceSessions)
        .set({ status: "practicing" })
        .where(eq(practiceSessions.id, input.sessionId));

      return { attemptId: result[0].id, attemptNumber: prevAttempts.length + 1 };
    }),

  // Send a message in the simulation
  sendSimulationMessage: protectedProcedure
    .input(z.object({
      attemptId: z.number(),
      message: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(practiceAttempts)
        .where(and(eq(practiceAttempts.id, input.attemptId), eq(practiceAttempts.userId, ctx.user.id)))
        .limit(1);
      const attempt = rows[0];
      if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });

      const sessionRows = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.id, attempt.sessionId))
        .limit(1);
      const session = sessionRows[0];
      if (!session?.scenario) throw new TRPCError({ code: "BAD_REQUEST" });

      const scenario = session.scenario as PracticeScenario;
      const transcript = (attempt.transcript as PracticeMessage[]) ?? [];
      const userMsg: PracticeMessage = { role: "user", content: input.message, timestamp: new Date().toISOString() };
      const updatedTranscript = [...transcript, userMsg];

      const llmMessages = updatedTranscript.slice(-16).map(m => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      }));

      const systemMsg = { role: "system" as const, content: AVATAR_SYSTEM_PROMPT(scenario, attempt.difficulty ?? "Medium") };
      const llmResult = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [systemMsg, ...llmMessages],
        maxTokens: 300,
      });
      const rawContent = llmResult.choices[0]?.message?.content ?? "";
      const content = typeof rawContent === "string" ? rawContent : rawContent.map((c: any) => c.text ?? "").join("");

      const avatarMsg: PracticeMessage = { role: "avatar", content, timestamp: new Date().toISOString() };
      const finalTranscript = [...updatedTranscript, avatarMsg];

      await db.update(practiceAttempts)
        .set({ transcript: finalTranscript })
        .where(eq(practiceAttempts.id, input.attemptId));

      return { message: avatarMsg, transcript: finalTranscript };
    }),

  // Pause coaching — get tactical tip mid-simulation
  pauseCoach: protectedProcedure
    .input(z.object({ attemptId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(practiceAttempts)
        .where(and(eq(practiceAttempts.id, input.attemptId), eq(practiceAttempts.userId, ctx.user.id)))
        .limit(1);
      const attempt = rows[0];
      if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });

      const sessionRows = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.id, attempt.sessionId))
        .limit(1);
      const session = sessionRows[0];
      if (!session?.scenario) throw new TRPCError({ code: "BAD_REQUEST" });

      const scenario = session.scenario as PracticeScenario;
      const transcript = (attempt.transcript as PracticeMessage[]) ?? [];

      const prompt = PAUSE_COACHING_PROMPT(transcript, scenario);
      const llmResult = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 200,
      });
      const rawContent = llmResult.choices[0]?.message?.content ?? "";
      const content = typeof rawContent === "string" ? rawContent : rawContent.map((c: any) => c.text ?? "").join("");

      return { coaching: content };
    }),

  // Generate feedback for a completed attempt
  generateFeedback: protectedProcedure
    .input(z.object({ attemptId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(practiceAttempts)
        .where(and(eq(practiceAttempts.id, input.attemptId), eq(practiceAttempts.userId, ctx.user.id)))
        .limit(1);
      const attempt = rows[0];
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
        maxTokens: 1400,
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

  // Generate commitment from a situation
  generateCommitment: protectedProcedure
    .input(z.object({
      situation: z.string().min(5).max(2000),
      behaviour: z.string().min(5).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const prompt = COMMITMENT_CREATION_PROMPT(input.situation, input.behaviour, ctx.user.name ?? "Leader");
      const llmResult = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 600,
      });
      const raw = llmResult.choices[0]?.message?.content ?? "{}";
      const content = typeof raw === "string" ? raw : raw.map((c: any) => c.text ?? "").join("");

      let commitment: Record<string, string>;
      try {
        const start = content.indexOf("{");
        const end = content.lastIndexOf("}");
        commitment = JSON.parse(content.slice(start, end + 1));
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate commitment" });
      }

      return { commitment };
    }),

  // Process after-meeting debrief
  processDebrief: protectedProcedure
    .input(z.object({
      whatHappened: z.string().min(5),
      whatDifferent: z.string().min(1),
      whatWorked: z.string().min(1),
      whereReverted: z.string().min(1),
      whatNext: z.string().min(1),
      developmentPriority: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const prompt = DEBRIEF_PROMPT(
        input.whatHappened,
        input.whatDifferent,
        input.whatWorked,
        input.whereReverted,
        input.whatNext,
        ctx.user.name ?? "Leader",
        input.developmentPriority
      );
      const llmResult = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 600,
      });
      const raw = llmResult.choices[0]?.message?.content ?? "{}";
      const content = typeof raw === "string" ? raw : raw.map((c: any) => c.text ?? "").join("");

      let debrief: Record<string, string>;
      try {
        const start = content.indexOf("{");
        const end = content.lastIndexOf("}");
        debrief = JSON.parse(content.slice(start, end + 1));
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to process debrief" });
      }

      return { debrief };
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

  // Alias: sendRolePlayMessage → sendSimulationMessage (UI compatibility)
  sendRolePlayMessage: protectedProcedure
    .input(z.object({
      attemptId: z.number(),
      message: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(practiceAttempts)
        .where(and(eq(practiceAttempts.id, input.attemptId), eq(practiceAttempts.userId, ctx.user.id)))
        .limit(1);
      const attempt = rows[0];
      if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });

      const sessionRows = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.id, attempt.sessionId))
        .limit(1);
      const session = sessionRows[0];
      if (!session?.scenario) throw new TRPCError({ code: "BAD_REQUEST" });

      const scenario = session.scenario as PracticeScenario;
      const transcript = (attempt.transcript as PracticeMessage[]) ?? [];
      const userMsg: PracticeMessage = { role: "user", content: input.message, timestamp: new Date().toISOString() };
      const updatedTranscript = [...transcript, userMsg];

      const llmMessages = updatedTranscript.slice(-16).map(m => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      }));

      const systemMsg = { role: "system" as const, content: AVATAR_SYSTEM_PROMPT(scenario, attempt.difficulty ?? "Medium") };
      const llmResult = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [systemMsg, ...llmMessages],
        maxTokens: 300,
      });
      const rawContent = llmResult.choices[0]?.message?.content ?? "";
      const content = typeof rawContent === "string" ? rawContent : rawContent.map((c: any) => c.text ?? "").join("");

      const avatarMsg: PracticeMessage = { role: "avatar", content, timestamp: new Date().toISOString() };
      const finalTranscript = [...updatedTranscript, avatarMsg];

      await db.update(practiceAttempts)
        .set({ transcript: finalTranscript })
        .where(eq(practiceAttempts.id, input.attemptId));

      return { message: avatarMsg, transcript: finalTranscript };
    }),

  // Alias: pauseForCoaching → pauseCoach (UI compatibility)
  pauseForCoaching: protectedProcedure
    .input(z.object({ attemptId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(practiceAttempts)
        .where(and(eq(practiceAttempts.id, input.attemptId), eq(practiceAttempts.userId, ctx.user.id)))
        .limit(1);
      const attempt = rows[0];
      if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });

      const sessionRows = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.id, attempt.sessionId))
        .limit(1);
      const session = sessionRows[0];
      if (!session?.scenario) throw new TRPCError({ code: "BAD_REQUEST" });

      const scenario = session.scenario as PracticeScenario;
      const transcript = (attempt.transcript as PracticeMessage[]) ?? [];

      const prompt = PAUSE_COACHING_PROMPT(transcript, scenario);
      const llmResult = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 200,
      });
      const rawContent = llmResult.choices[0]?.message?.content ?? "";
      const content = typeof rawContent === "string" ? rawContent : rawContent.map((c: any) => c.text ?? "").join("");

      return { coaching: content };
    }),

  // Alias: endSimulation → generateFeedback (UI compatibility)
  endSimulation: protectedProcedure
    .input(z.object({ attemptId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(practiceAttempts)
        .where(and(eq(practiceAttempts.id, input.attemptId), eq(practiceAttempts.userId, ctx.user.id)))
        .limit(1);
      const attempt = rows[0];
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
        maxTokens: 1400,
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
