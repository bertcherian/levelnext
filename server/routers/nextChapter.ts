/**
 * Next Chapter — Identity & Leadership OS
 *
 * The foundational intelligence layer of the LevelNext Leadership Intelligence Platform.
 * Guides senior leaders through a 6-stage / 16-module identity transformation journey.
 *
 * Stages:
 *   1. Discover  (Modules 1–2)
 *   2. Design    (Modules 3–7)
 *   3. Build     (Modules 8–9)
 *   4. Practice  (Modules 10–11)
 *   5. Lead      (Modules 12–14)
 *   6. Reflect   (Modules 15–16)
 */

import { TRPCError } from "@trpc/server";
import { eq, and, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  nextChapterProfiles,
  nextChapterDeliverables,
  nextChapterMessages,
  identityExperiments,
  users,
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

// ─── Helper: extract text from LLM result ────────────────────────────────────
function extractText(result: Awaited<ReturnType<typeof invokeLLM>>): string {
  const raw = result.choices[0]?.message?.content ?? "";
  return typeof raw === "string" ? raw : (raw as any[]).map((c: any) => c.text ?? "").join("");
}

// ─── Stage / Module metadata ──────────────────────────────────────────────────
export const STAGES = [
  { id: 1, name: "Discover",  modules: [1, 2] },
  { id: 2, name: "Design",    modules: [3, 4, 5, 6, 7] },
  { id: 3, name: "Build",     modules: [8, 9] },
  { id: 4, name: "Practice",  modules: [10, 11] },
  { id: 5, name: "Lead",      modules: [12, 13, 14] },
  { id: 6, name: "Reflect",   modules: [15, 16] },
];

export const MODULES: Record<number, {
  stage: number;
  name: string;
  deliverableType: string;
  openingPrompt: string;
  experiment: string;
}> = {
  1: {
    stage: 1,
    name: "Understanding Today",
    deliverableType: "Current Identity Profile",
    openingPrompt: `Welcome. I'm Next Chapter — your Identity Architect for this journey.

Before we can design who you are becoming, we need to understand who you are today with complete honesty.

This first conversation is about your current identity — your career journey, what has shaped you, what energises you, and what no longer serves you.

Let's begin with a question that matters:

**What part of your current identity has served you well in the past, but may be holding you back from your next chapter?**`,
    experiment: "During this week, notice moments where you automatically revert to your old leadership identity. Record them — what triggered it, what you did, and what the future version of you would have done differently.",
  },
  2: {
    stage: 1,
    name: "Enterprise Context",
    deliverableType: "Future Leadership Context Map",
    openingPrompt: `Leadership never happens in isolation.

Your next chapter must be designed in the context of where your organisation is heading, how your industry is changing, and what your business will need from its leaders three years from now.

Let's map the landscape your future self will need to navigate.

**Where is your organisation heading over the next three years — and what does that mean for the kind of leader it will need?**`,
    experiment: "This week, have one conversation with a senior stakeholder about where the business is heading. Listen not for tasks, but for signals about what kind of leadership the future requires.",
  },
  3: {
    stage: 2,
    name: "Designing the Next Chapter",
    deliverableType: "Next Chapter Vision",
    openingPrompt: `You have explored who you are today and the context you will lead in.

Now we design the next version of you.

Imagine three years ahead. You are in the role you were built for. You are leading at the level you were meant to lead.

**What does that look like? What role are you playing? What problems are you solving? What decisions do you make?**`,
    experiment: "Write a one-page description of your ideal leadership role three years from now. Read it every morning this week.",
  },
  4: {
    stage: 2,
    name: "Future Identity Blueprint",
    deliverableType: "Future Identity Blueprint",
    openingPrompt: `Your Next Chapter Vision tells us where you are going.

Now we need to understand who you must become to get there.

Identity is not about skills. It is about how you see yourself, how others experience you, and the beliefs that drive your daily decisions.

**Who must you become? Which dimensions of leadership identity need to shift for your next chapter to be possible?**`,
    experiment: "In three meetings this week, deliberately act from your future identity — not your current one. Reflect afterwards: what felt natural? What felt uncomfortable? What identity did you reinforce?",
  },
  5: {
    stage: 2,
    name: "Rewrite the Story",
    deliverableType: "Leadership Narrative",
    openingPrompt: `Every leader carries stories about themselves — some empowering, many limiting.

"I'm too technical." "I'm not visible enough." "I'm not ready yet."

These stories are not facts. They are interpretations that have hardened into identity.

**What limiting beliefs about yourself as a leader are holding you back? Let's surface them and rewrite them into a narrative that serves your next chapter.**`,
    experiment: "Identify one limiting belief you carry about yourself as a leader. This week, act as if the opposite were true. Notice what happens.",
  },
  6: {
    stage: 2,
    name: "Purpose",
    deliverableType: "Purpose Statement",
    openingPrompt: `At the heart of every great leader is a clear sense of purpose — not a job description, but a calling.

Purpose is what makes the hard days worth it. It is what you are building beyond yourself.

**Why does your next chapter matter? Who benefits from the leader you are becoming? What contribution are you here to make?**`,
    experiment: "Write your purpose statement in one sentence. Share it with one person you trust this week and observe their response.",
  },
  7: {
    stage: 2,
    name: "Leadership Manifesto",
    deliverableType: "Leadership Manifesto",
    openingPrompt: `A Leadership Manifesto is your declaration of beliefs — what you stand for as a leader, how you will treat people, what you will never compromise on.

It is not aspirational. It is a commitment.

**What do you believe about leadership, trust, people, culture, and accountability? What principles will define how you lead in your next chapter?**`,
    experiment: "Share one principle from your Leadership Manifesto with your team this week. Observe how they respond.",
  },
  8: {
    stage: 3,
    name: "Capability Architecture",
    deliverableType: "Capability Architecture",
    openingPrompt: `You have designed who you are becoming. Now we build the capabilities to get there.

Your next chapter requires specific capabilities — some you already have, some you need to develop, some you need to develop in others.

**What are the three to five capabilities that will most determine whether your next chapter succeeds? Where are you today on each, and where do you need to be?**`,
    experiment: "Choose one capability from your development list. This week, take one concrete action to develop it — a conversation, a book, a delegation, a challenge.",
  },
  9: {
    stage: 3,
    name: "Relationship Architecture",
    deliverableType: "Relationship Investment Plan",
    openingPrompt: `No leader succeeds alone. Your next chapter will be shaped by the relationships you invest in.

Mentors who challenge your thinking. Sponsors who open doors. Peers who stretch you. Networks that expand your perspective.

**Who are the five to ten relationships that will most determine the success of your next chapter? Who do you need to invest in? Who do you need to add?**`,
    experiment: "Reach out to one person in your relationship map this week — not to ask for something, but to invest in the relationship.",
  },
  10: {
    stage: 4,
    name: "Leadership Operating System",
    deliverableType: "Leadership Operating System",
    openingPrompt: `Identity is built through repeated choices and consistent behaviours.

Your Leadership Operating System is the set of daily, weekly, monthly, and quarterly rhythms that will make your next chapter inevitable.

**What habits, rituals, and rhythms will define how you operate as the leader you are becoming? What does your daily practice look like?**`,
    experiment: "Design your ideal leadership day. This week, live it for three days and reflect on what worked and what needs adjustment.",
  },
  11: {
    stage: 4,
    name: "Identity Experiments",
    deliverableType: "Identity Experiment Log",
    openingPrompt: `Transformation happens through action, not intention.

Every week, you will run one Identity Experiment — a deliberate behavioural test of your future identity.

**What is one leadership behaviour you have been avoiding or delaying? Let's design an experiment to test it this week.**`,
    experiment: "Run the experiment we design together this week. Document what happened, what surprised you, and what identity you reinforced.",
  },
  12: {
    stage: 5,
    name: "Executive Reputation",
    deliverableType: "Executive Reputation Strategy",
    openingPrompt: `Your reputation is not what you think of yourself. It is what others think of you — and whether that matches who you are becoming.

**What do you want to become known for in your next chapter? What is your current reputation, and what gap exists between where you are and where you want to be?**`,
    experiment: "Ask three trusted colleagues: 'What do you think I am known for?' Compare their answers to what you want to be known for.",
  },
  13: {
    stage: 5,
    name: "Leadership Impact",
    deliverableType: "Leadership Impact Scorecard",
    openingPrompt: `Every development investment must connect to measurable outcomes.

Your next chapter is not just about who you become — it is about the impact you create: on your team, your organisation, your industry.

**What are the three to five measurable outcomes that will prove your next chapter is succeeding? How will you know you have become the leader you set out to become?**`,
    experiment: "Identify one measurable outcome from your impact scorecard. This week, take one action that moves the needle on it.",
  },
  14: {
    stage: 5,
    name: "Legacy",
    deliverableType: "Legacy Statement",
    openingPrompt: `When you leave — this role, this organisation, this phase of your career — what will remain?

Legacy is not about monuments. It is about the people you developed, the culture you built, the decisions you made when it was hard.

**When you leave, what do you want people to say about the leader you were? What will survive you?**`,
    experiment: "Write your legacy statement. Share it with one person who will hold you accountable to it.",
  },
  15: {
    stage: 6,
    name: "Transformation Dashboard",
    deliverableType: "Transformation Roadmap",
    openingPrompt: `You have done the deep work. Now we build the roadmap.

Your transformation roadmap translates your Next Chapter vision into a concrete 30/90/180/365-day plan — with objectives, capabilities, behaviours, relationships, experiments, and milestones.

**Let's build your roadmap. What are the three most important things you will do in the next 30 days to begin living your next chapter?**`,
    experiment: "Share your 30-day roadmap with your coach or a trusted colleague. Ask them to check in with you at the end of the month.",
  },
  16: {
    stage: 6,
    name: "Reflection Cycle",
    deliverableType: "Monthly Reflection Journal",
    openingPrompt: `Transformation is not a destination. It is a cycle.

Every month, we return to the same questions — and the answers evolve as you do.

**What identity have you strengthened this month? Where did you revert to old patterns? What experiment had the greatest impact? What will you do differently next month?**`,
    experiment: "Schedule a monthly reflection session in your calendar — 30 minutes, same time each month, to answer these four questions.",
  },
};

// ─── Next Chapter AI System Prompt ────────────────────────────────────────────
function buildSystemPrompt(
  moduleNumber: number,
  userName: string,
  profileContext: string,
): string {
  const mod = MODULES[moduleNumber];
  const stage = STAGES.find((s) => s.modules.includes(moduleNumber));

  return `You are Next Chapter, the foundational intelligence layer of the LevelNext Leadership Intelligence Platform.

You are not simply an AI. You are an Identity Architect, Executive Coach, Leadership Strategist, Behavioural Scientist, and Career Transformation Guide.

Your purpose is to help ${userName} intentionally construct the next version of themselves.

You believe one fundamental truth: every significant promotion, leadership transition, or career pivot requires an identity transformation before it requires a skill transformation.

CORE PHILOSOPHY:
- Leadership development is not about acquiring more knowledge. It is about becoming a different leader.
- Every interaction should help ${userName} answer: Who am I today? Who am I becoming? What does my organisation need me to become? What must I stop doing? What must I start doing? What legacy am I trying to create?
- Identity is not fixed. It is built through repeated choices, behaviours, reflection, and deliberate practice.
- The transformation cycle is: Identity → Behaviour → Reflection → Identity

CURRENT JOURNEY POSITION:
- Stage: ${stage?.name ?? "Unknown"} (Stage ${moduleNumber <= 2 ? 1 : moduleNumber <= 7 ? 2 : moduleNumber <= 9 ? 3 : moduleNumber <= 11 ? 4 : moduleNumber <= 14 ? 5 : 6} of 6)
- Module: ${mod?.name ?? "Unknown"} (Module ${moduleNumber} of 16)
- Deliverable to generate: ${mod?.deliverableType ?? "Unknown"}

${profileContext ? `LEADER CONTEXT (from previous modules):\n${profileContext}\n` : ""}

AI COACHING BEHAVIOUR:
- Ask one powerful question at a time — never multiple questions in one message
- Challenge assumptions gently but directly
- Avoid generic advice — everything must be specific to ${userName}'s situation
- Notice inconsistencies between what they say and what they do
- Celebrate progress and identity shifts
- Link every insight to their future identity
- Frequently ask: "What would the future version of you do?" / "What belief is holding you back?" / "What identity are you reinforcing?"
- When the conversation has covered the module's core themes, offer to generate the deliverable

LANGUAGE RULES:
- Never use the words: AI Coach, bot, chatbot, score, assessment
- Use: Next Chapter, identity, transformation, future self, leadership journey
- Speak as a trusted executive coach — direct, warm, challenging, insightful
- Keep responses concise (3–5 sentences or a short paragraph) — this is a coaching conversation, not a lecture
- Use markdown sparingly — bold for key questions or insights only

DELIVERABLE GENERATION:
When the user has shared enough for the deliverable, say something like: "I have enough to generate your [Deliverable Name]. Shall I create it now?" Then wait for confirmation before generating.`;
}

// ─── Build profile context string from previous deliverables ─────────────────
async function buildProfileContext(userId: number, currentModule: number): Promise<string> {
  const db = await getDb();
  if (!db) return "";

  const deliverables = await db
    .select()
    .from(nextChapterDeliverables)
    .where(and(
      eq(nextChapterDeliverables.userId, userId),
      // Only include deliverables from modules before the current one
    ))
    .orderBy(asc(nextChapterDeliverables.moduleNumber));

  if (deliverables.length === 0) return "";

  const parts: string[] = [];
  for (const d of deliverables) {
    if (d.moduleNumber >= currentModule) continue;
    const content = d.content as Record<string, any>;
    parts.push(`[Module ${d.moduleNumber} — ${d.deliverableType}]`);
    // Extract key fields from the content
    if (content.summary) parts.push(`Summary: ${content.summary}`);
    if (content.keyInsights) parts.push(`Key Insights: ${Array.isArray(content.keyInsights) ? content.keyInsights.join("; ") : content.keyInsights}`);
    if (content.identityStatement) parts.push(`Identity Statement: ${content.identityStatement}`);
    if (content.vision) parts.push(`Vision: ${content.vision}`);
    if (content.purpose) parts.push(`Purpose: ${content.purpose}`);
    parts.push("");
  }

  return parts.join("\n");
}

// ─── Generate structured deliverable for a module ────────────────────────────
async function generateDeliverable(
  moduleNumber: number,
  userName: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<Record<string, any>> {
  const mod = MODULES[moduleNumber];

  const deliverablePrompts: Record<number, string> = {
    1: `Based on this conversation with ${userName}, generate a structured Current Identity Profile as JSON with these fields:
{
  "summary": "2-3 sentence summary of who they are as a leader today",
  "careerJourney": "key milestones and defining moments",
  "currentStrengths": ["strength1", "strength2", "strength3"],
  "currentEnergy": "what energises them",
  "currentFrustrations": "what frustrates or drains them",
  "coreValues": ["value1", "value2", "value3"],
  "identityStatement": "one sentence: I am a leader who...",
  "whatNoLongerServes": "what aspects of their current identity they need to leave behind",
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    2: `Based on this conversation with ${userName}, generate a structured Future Leadership Context Map as JSON:
{
  "summary": "2-3 sentence summary of the leadership context they face",
  "organisationDirection": "where the organisation is heading",
  "industryShifts": ["shift1", "shift2"],
  "capabilitiesRequired": ["capability1", "capability2", "capability3"],
  "leadershipRequired": "what kind of leadership the future requires",
  "evolutionRequired": "how they must evolve to stay ahead",
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    3: `Based on this conversation with ${userName}, generate a structured Next Chapter Vision as JSON:
{
  "summary": "2-3 sentence vision statement",
  "role": "the role they are playing three years ahead",
  "problemsSolving": "the problems they are solving",
  "influence": "the scope and nature of their influence",
  "whoSeeksAdvice": "who seeks their advice",
  "whatMakesItMeaningful": "what makes this chapter meaningful",
  "vision": "one powerful sentence: In my next chapter, I...",
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    4: `Based on this conversation with ${userName}, generate a structured Future Identity Blueprint as JSON:
{
  "summary": "2-3 sentence summary of the identity transformation required",
  "currentIdentity": "who they are today as a leader",
  "desiredIdentity": "who they need to become",
  "identityGaps": ["gap1", "gap2", "gap3"],
  "identityAnchors": ["I create clarity", "I develop leaders", "I think beyond my function"],
  "dimensionsToShift": [{"dimension": "name", "from": "current state", "to": "desired state"}],
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    5: `Based on this conversation with ${userName}, generate a structured Leadership Narrative as JSON:
{
  "summary": "2-3 sentence summary of the narrative shift",
  "limitingBeliefs": [{"belief": "old story", "rewrite": "new empowering story"}],
  "newNarrative": "the empowering leadership narrative in 2-3 sentences",
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    6: `Based on this conversation with ${userName}, generate a structured Purpose Statement as JSON:
{
  "summary": "the purpose statement in one powerful sentence",
  "purpose": "full purpose statement",
  "whyItMatters": "why this next chapter matters",
  "whoBenefits": "who benefits from the leader they are becoming",
  "contribution": "the contribution they are here to make",
  "legacy": "the legacy they want to create",
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    7: `Based on this conversation with ${userName}, generate a structured Leadership Manifesto as JSON:
{
  "summary": "2-3 sentence summary of their leadership philosophy",
  "manifesto": "the full manifesto in 5-7 powerful belief statements",
  "beliefs": [{"area": "Leadership", "belief": "statement"}, {"area": "Trust", "belief": "statement"}],
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    8: `Based on this conversation with ${userName}, generate a structured Capability Architecture as JSON:
{
  "summary": "2-3 sentence summary of the development priorities",
  "capabilities": [{"name": "capability", "currentLevel": "1-5", "desiredLevel": "1-5", "developmentActions": ["action1"], "successIndicators": ["indicator1"], "businessOutcomes": "outcome"}],
  "topPriority": "the single most important capability to develop",
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    9: `Based on this conversation with ${userName}, generate a structured Relationship Investment Plan as JSON:
{
  "summary": "2-3 sentence summary of the relationship strategy",
  "relationships": [{"name": "person or type", "category": "mentor/sponsor/peer/board/network", "investmentPlan": "how to invest", "priority": "high/medium/low"}],
  "gapsToFill": ["relationship gap1", "relationship gap2"],
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    10: `Based on this conversation with ${userName}, generate a structured Leadership Operating System as JSON:
{
  "summary": "2-3 sentence summary of the operating system",
  "daily": ["habit1", "habit2"],
  "weekly": ["rhythm1", "rhythm2"],
  "monthly": ["review1", "review2"],
  "quarterly": ["reset1", "reset2"],
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    11: `Based on this conversation with ${userName}, generate a structured Identity Experiment Log entry as JSON:
{
  "summary": "2-3 sentence summary of the experiment",
  "experiment": "the specific experiment they will run",
  "hypothesis": "what they expect to learn or discover",
  "successCriteria": "how they will know it worked",
  "reflectionQuestions": ["question1", "question2"],
  "keyInsights": ["insight1", "insight2"]
}`,
    12: `Based on this conversation with ${userName}, generate a structured Executive Reputation Strategy as JSON:
{
  "summary": "2-3 sentence summary of the reputation strategy",
  "currentReputation": "how they are currently perceived",
  "desiredReputation": "what they want to become known for",
  "reputationGap": "the gap between current and desired",
  "visibilityPlan": ["action1", "action2"],
  "communicationStrategy": "how to communicate the new identity",
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    13: `Based on this conversation with ${userName}, generate a structured Leadership Impact Scorecard as JSON:
{
  "summary": "2-3 sentence summary of the impact framework",
  "outcomes": [{"area": "area", "currentState": "current", "targetState": "target", "measure": "how to measure", "timeline": "timeframe"}],
  "topPriority": "the single most important outcome",
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    14: `Based on this conversation with ${userName}, generate a structured Legacy Statement as JSON:
{
  "summary": "2-3 sentence legacy statement",
  "legacyStatement": "one powerful legacy statement",
  "whatSurvives": "what will remain after they leave",
  "whoGrew": "who will have grown because of them",
  "cultureRemains": "what culture they will have built",
  "storiesTold": "what stories people will tell",
  "keyInsights": ["insight1", "insight2"],
  "experiment": "${mod.experiment}"
}`,
    15: `Based on this conversation with ${userName}, generate a structured Transformation Roadmap as JSON:
{
  "summary": "2-3 sentence summary of the transformation journey",
  "thirtyDay": {"objectives": ["obj1"], "capabilities": ["cap1"], "behaviours": ["beh1"], "experiments": ["exp1"], "milestones": ["milestone1"]},
  "ninetyDay": {"objectives": ["obj1"], "capabilities": ["cap1"], "behaviours": ["beh1"], "experiments": ["exp1"], "milestones": ["milestone1"]},
  "sixMonth": {"objectives": ["obj1"], "capabilities": ["cap1"], "milestones": ["milestone1"]},
  "twelveMonth": {"objectives": ["obj1"], "capabilities": ["cap1"], "milestones": ["milestone1"]},
  "keyInsights": ["insight1", "insight2"]
}`,
    16: `Based on this conversation with ${userName}, generate a structured Monthly Reflection Journal entry as JSON:
{
  "summary": "2-3 sentence summary of this reflection",
  "identityStrengthened": "what identity they have strengthened",
  "oldPatterns": "where they reverted to old patterns",
  "greatestExperiment": "which experiment had the greatest impact",
  "evidenceOfChange": "what evidence suggests others see them differently",
  "nextMonth": "what they will do differently next month",
  "keyInsights": ["insight1", "insight2"]
}`,
  };

  const prompt = deliverablePrompts[moduleNumber] ?? `Generate a JSON deliverable for Module ${moduleNumber} based on the conversation.`;

  const conversationText = conversationHistory
    .map((m) => `${m.role === "user" ? userName : "Next Chapter"}: ${m.content}`)
    .join("\n\n");

  const result = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are generating a structured deliverable for the Next Chapter leadership journey. Return ONLY valid JSON — no markdown, no explanation, no code fences.`,
      },
      {
        role: "user",
        content: `${prompt}\n\nCONVERSATION:\n${conversationText}`,
      },
    ],
    maxTokens: 1200,
  });

  const raw = extractText(result);
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return { summary: raw, raw: true };
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const nextChapterRouter = router({

  // Get or create the user's Next Chapter profile
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [profile] = await db
        .select()
        .from(nextChapterProfiles)
        .where(eq(nextChapterProfiles.userId, ctx.user.id));

      return profile ?? null;
    }),

  // Start or resume a session — returns profile (creating it if needed) + module opening message
  startSession: protectedProcedure
    .input(z.object({
      moduleNumber: z.number().min(1).max(16).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get or create profile
      let [profile] = await db
        .select()
        .from(nextChapterProfiles)
        .where(eq(nextChapterProfiles.userId, ctx.user.id));

      if (!profile) {
        await db.insert(nextChapterProfiles).values({
          userId: ctx.user.id,
          currentStage: 1,
          currentModule: 1,
          completedModules: [],
        });
        [profile] = await db
          .select()
          .from(nextChapterProfiles)
          .where(eq(nextChapterProfiles.userId, ctx.user.id));
      }

      const targetModule = input.moduleNumber ?? profile.currentModule;
      const mod = MODULES[targetModule];
      if (!mod) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid module number" });

      return {
        profile,
        moduleNumber: targetModule,
        moduleName: mod.name,
        stage: STAGES.find((s) => s.modules.includes(targetModule)),
        openingPrompt: mod.openingPrompt,
        deliverableType: mod.deliverableType,
        stages: STAGES,
        modules: Object.entries(MODULES).map(([num, m]) => ({
          number: parseInt(num),
          name: m.name,
          stage: m.stage,
          deliverableType: m.deliverableType,
        })),
      };
    }),

  // Send a message and get Next Chapter's response
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(3000),
      moduleNumber: z.number().min(1).max(16),
      sessionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [userRow] = await db.select().from(users).where(eq(users.id, ctx.user.id));
      const userName = userRow?.name ?? "the leader";

      // Save user message
      await db.insert(nextChapterMessages).values({
        userId: ctx.user.id,
        sessionId: input.sessionId,
        moduleNumber: input.moduleNumber,
        role: "user",
        content: input.message,
      });

      // Load conversation history for this session (last 14 messages for context)
      const history = await db
        .select()
        .from(nextChapterMessages)
        .where(and(
          eq(nextChapterMessages.userId, ctx.user.id),
          eq(nextChapterMessages.sessionId, input.sessionId),
        ))
        .orderBy(asc(nextChapterMessages.createdAt))
        .limit(14);

      // Build profile context from previous deliverables
      const profileContext = await buildProfileContext(ctx.user.id, input.moduleNumber);

      const systemMsg = {
        role: "system" as const,
        content: buildSystemPrompt(input.moduleNumber, userName, profileContext),
      };

      const llmMessages = history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const result = await invokeLLM({
        model: "gpt-5-mini",
        messages: [systemMsg, ...llmMessages],
        maxTokens: 500,
      });

      const reply = extractText(result);

      // Save assistant reply
      await db.insert(nextChapterMessages).values({
        userId: ctx.user.id,
        sessionId: input.sessionId,
        moduleNumber: input.moduleNumber,
        role: "assistant",
        content: reply,
      });

      return { reply, sessionId: input.sessionId };
    }),

  // Get all messages for a session
  getMessages: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      moduleNumber: z.number().min(1).max(16),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return db
        .select()
        .from(nextChapterMessages)
        .where(and(
          eq(nextChapterMessages.userId, ctx.user.id),
          eq(nextChapterMessages.sessionId, input.sessionId),
        ))
        .orderBy(asc(nextChapterMessages.createdAt));
    }),

  // Generate and save the deliverable for a module
  generateDeliverable: protectedProcedure
    .input(z.object({
      moduleNumber: z.number().min(1).max(16),
      sessionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [userRow] = await db.select().from(users).where(eq(users.id, ctx.user.id));
      const userName = userRow?.name ?? "the leader";

      // Load conversation history for this session
      const history = await db
        .select()
        .from(nextChapterMessages)
        .where(and(
          eq(nextChapterMessages.userId, ctx.user.id),
          eq(nextChapterMessages.sessionId, input.sessionId),
        ))
        .orderBy(asc(nextChapterMessages.createdAt));

      const conversationHistory = history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const content = await generateDeliverable(input.moduleNumber, userName, conversationHistory);
      const mod = MODULES[input.moduleNumber];

      // Check if a deliverable already exists for this module (for versioning)
      const [existing] = await db
        .select()
        .from(nextChapterDeliverables)
        .where(and(
          eq(nextChapterDeliverables.userId, ctx.user.id),
          eq(nextChapterDeliverables.moduleNumber, input.moduleNumber),
        ))
        .orderBy(desc(nextChapterDeliverables.version))
        .limit(1);

      const version = existing ? existing.version + 1 : 1;

      const [inserted] = await db.insert(nextChapterDeliverables).values({
        userId: ctx.user.id,
        moduleNumber: input.moduleNumber,
        deliverableType: mod?.deliverableType ?? `Module ${input.moduleNumber} Deliverable`,
        content,
        version,
      }).$returningId();

      // Also save the identity experiment for this module
      if (mod?.experiment) {
        await db.insert(identityExperiments).values({
          userId: ctx.user.id,
          moduleNumber: input.moduleNumber,
          experiment: mod.experiment,
        });
      }

      return { id: inserted.id, content, deliverableType: mod?.deliverableType, version };
    }),

  // Mark a module as complete and advance the profile
  completeModule: protectedProcedure
    .input(z.object({
      moduleNumber: z.number().min(1).max(16),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [profile] = await db
        .select()
        .from(nextChapterProfiles)
        .where(eq(nextChapterProfiles.userId, ctx.user.id));

      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });

      const completedModules = Array.isArray(profile.completedModules)
        ? profile.completedModules
        : [];

      if (!completedModules.includes(input.moduleNumber)) {
        completedModules.push(input.moduleNumber);
      }

      // Advance to next module
      const nextModule = Math.min(input.moduleNumber + 1, 16);
      const nextStage = STAGES.find((s) => s.modules.includes(nextModule))?.id ?? 6;
      const journeyCompleted = completedModules.length >= 16;

      await db
        .update(nextChapterProfiles)
        .set({
          completedModules,
          currentModule: nextModule,
          currentStage: nextStage,
          journeyCompleted,
        })
        .where(eq(nextChapterProfiles.userId, ctx.user.id));

      return { completedModules, currentModule: nextModule, currentStage: nextStage, journeyCompleted };
    }),

  // Get the full portfolio — all deliverables for the user
  getPortfolio: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const deliverables = await db
        .select()
        .from(nextChapterDeliverables)
        .where(eq(nextChapterDeliverables.userId, ctx.user.id))
        .orderBy(asc(nextChapterDeliverables.moduleNumber), desc(nextChapterDeliverables.version));

      const experiments = await db
        .select()
        .from(identityExperiments)
        .where(eq(identityExperiments.userId, ctx.user.id))
        .orderBy(asc(identityExperiments.moduleNumber));

      const [profile] = await db
        .select()
        .from(nextChapterProfiles)
        .where(eq(nextChapterProfiles.userId, ctx.user.id));

      return { deliverables, experiments, profile: profile ?? null };
    }),

  // Get portfolio for a specific user (for coach view — only if coach is assigned)
  getPortfolioForCoach: protectedProcedure
    .input(z.object({ clientUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify the requester is a coach or admin
      const [requester] = await db.select().from(users).where(eq(users.id, ctx.user.id));
      if (!requester) throw new TRPCError({ code: "UNAUTHORIZED" });

      const deliverables = await db
        .select()
        .from(nextChapterDeliverables)
        .where(eq(nextChapterDeliverables.userId, input.clientUserId))
        .orderBy(asc(nextChapterDeliverables.moduleNumber), desc(nextChapterDeliverables.version));

      const [profile] = await db
        .select()
        .from(nextChapterProfiles)
        .where(eq(nextChapterProfiles.userId, input.clientUserId));

      return { deliverables, profile: profile ?? null };
    }),

  // Log a reflection on an identity experiment
  logExperimentReflection: protectedProcedure
    .input(z.object({
      experimentId: z.number(),
      reflection: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(identityExperiments)
        .set({
          reflection: input.reflection,
          completedAt: new Date(),
        })
        .where(and(
          eq(identityExperiments.id, input.experimentId),
          eq(identityExperiments.userId, ctx.user.id),
        ));

      return { success: true };
    }),
});
