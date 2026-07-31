import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { launchSkillSprint } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ─── Skill Sprint Module Catalogue ────────────────────────────────────────────
export const SKILL_MODULES = [
  {
    id: "comm_01",
    title: "The Art of First Impressions",
    category: "Communication",
    emoji: "🤝",
    color: "#3B82F6",
    duration: "8 min",
    xp: 30,
    summary: "Master the science of making powerful first impressions in professional settings.",
    keyPoints: [
      "The 7-second rule: what happens in the first moments",
      "Non-verbal signals that build instant credibility",
      "The power of a confident handshake and eye contact",
      "How to open a conversation with genuine curiosity",
    ],
    challenge: "Write a 3-sentence introduction you'd use at a professional networking event. Include your name, what you do, and one thing that makes you memorable.",
    challengeType: "write" as const,
  },
  {
    id: "comm_02",
    title: "Active Listening Mastery",
    category: "Communication",
    emoji: "👂",
    color: "#3B82F6",
    duration: "7 min",
    xp: 25,
    summary: "Transform your listening skills to build deeper professional relationships.",
    keyPoints: [
      "The RASA framework: Receive, Appreciate, Summarise, Ask",
      "How to listen without preparing your response",
      "Paraphrasing techniques that show you truly heard",
      "Questions that open doors vs. questions that close them",
    ],
    challenge: "Describe a recent conversation where you could have listened better. What would you do differently using the RASA framework?",
    challengeType: "reflect" as const,
  },
  {
    id: "prod_01",
    title: "Deep Work in a Distracted World",
    category: "Productivity",
    emoji: "🎯",
    color: "#10B981",
    duration: "9 min",
    xp: 30,
    summary: "Build the ability to focus deeply and produce your best work consistently.",
    keyPoints: [
      "Cal Newport's Deep Work philosophy explained",
      "The 4 disciplines of deep work execution",
      "Designing your environment for focus",
      "Time-blocking your most important work",
    ],
    challenge: "Design your ideal deep work schedule for next week. Include 3 specific deep work blocks (time, duration, what you'll work on) and how you'll protect them from interruption.",
    challengeType: "plan" as const,
  },
  {
    id: "prod_02",
    title: "The Power of Saying No",
    category: "Productivity",
    emoji: "🚫",
    color: "#10B981",
    duration: "6 min",
    xp: 20,
    summary: "Learn to protect your time and energy by declining gracefully but firmly.",
    keyPoints: [
      "Why saying yes to everything kills your career",
      "The 'Hell Yes or No' decision framework",
      "Scripts for declining requests professionally",
      "How to negotiate scope instead of just saying no",
    ],
    challenge: "Write 3 different ways to decline a request you'd normally say yes to out of obligation. Make each response professional, warm, and firm.",
    challengeType: "write" as const,
  },
  {
    id: "presence_01",
    title: "Executive Presence Fundamentals",
    category: "Professional Presence",
    emoji: "⚡",
    color: "#8B5CF6",
    duration: "10 min",
    xp: 35,
    summary: "Develop the gravitas and confidence that makes people take you seriously.",
    keyPoints: [
      "The 3 pillars of executive presence: gravitas, communication, appearance",
      "How to enter a room with confidence",
      "Voice modulation and pace for authority",
      "The pause: your most powerful communication tool",
    ],
    challenge: "Record yourself (audio or video) answering this question: 'Tell me about a challenge you overcame at work.' Review it and identify one thing you'd change about your delivery.",
    challengeType: "reflect" as const,
  },
  {
    id: "presence_02",
    title: "Storytelling for Professionals",
    category: "Professional Presence",
    emoji: "📖",
    color: "#8B5CF6",
    duration: "8 min",
    xp: 30,
    summary: "Use narrative structures to make your ideas memorable and persuasive.",
    keyPoints: [
      "The STAR method: Situation, Task, Action, Result",
      "Why stories beat statistics every time",
      "The 3-act structure for professional narratives",
      "How to make data emotional and memorable",
    ],
    challenge: "Using the STAR method, write a professional story about a time you solved a difficult problem. Keep it under 150 words and make sure the Result is specific and measurable.",
    challengeType: "write" as const,
  },
  {
    id: "comm_03",
    title: "Email That Gets Responses",
    category: "Communication",
    emoji: "📧",
    color: "#3B82F6",
    duration: "7 min",
    xp: 25,
    summary: "Write emails that get read, understood, and acted upon.",
    keyPoints: [
      "The subject line formula that gets opens",
      "The BLUF principle: Bottom Line Up Front",
      "How to make your ask impossible to ignore",
      "Following up without being annoying",
    ],
    challenge: "Rewrite this email using BLUF and the principles from this module: 'Hi, I hope you're well. I wanted to reach out because I've been thinking about the project and I was wondering if maybe we could find a time to chat about the timeline when you get a chance.'",
    challengeType: "write" as const,
  },
  {
    id: "prod_03",
    title: "Managing Up: Working with Your Manager",
    category: "Productivity",
    emoji: "📈",
    color: "#10B981",
    duration: "9 min",
    xp: 30,
    summary: "Build a productive relationship with your manager that accelerates your career.",
    keyPoints: [
      "Understanding your manager's priorities and pressures",
      "How to communicate progress without being asked",
      "Bringing solutions, not just problems",
      "How to ask for what you need (feedback, resources, visibility)",
    ],
    challenge: "Write a 'Manager's Manual' for yourself: 3 things your manager should know about how you work best, 2 things you need from them to do your best work, and 1 thing you want to be known for.",
    challengeType: "plan" as const,
  },
  {
    id: "presence_03",
    title: "Networking That Doesn't Feel Fake",
    category: "Professional Presence",
    emoji: "🌐",
    color: "#8B5CF6",
    duration: "8 min",
    xp: 30,
    summary: "Build genuine professional relationships that open doors throughout your career.",
    keyPoints: [
      "The giver mindset: networking as value exchange",
      "How to reconnect with dormant connections",
      "The 'informational interview' playbook",
      "LinkedIn outreach messages that get replies",
    ],
    challenge: "Write a LinkedIn connection request message to someone in your target industry you've never met. It should be specific, mention something genuine about their work, and include a clear reason for connecting.",
    challengeType: "write" as const,
  },
  {
    id: "comm_04",
    title: "Navigating Difficult Conversations",
    category: "Communication",
    emoji: "🔥",
    color: "#EF4444",
    duration: "10 min",
    xp: 40,
    summary: "Handle conflict, feedback, and tough conversations with confidence and skill.",
    keyPoints: [
      "The SBI model: Situation, Behaviour, Impact",
      "How to separate the person from the problem",
      "Staying curious when you want to be defensive",
      "Closing a difficult conversation with a clear agreement",
    ],
    challenge: "Think of a difficult conversation you've been avoiding. Using the SBI model, write out exactly what you would say in the first 3 sentences of that conversation.",
    challengeType: "reflect" as const,
  },
] as const;

export type SkillModule = (typeof SKILL_MODULES)[number];

// ─── Router ───────────────────────────────────────────────────────────────────
export const launchSkillSprintRouter = router({
  // Get all modules with user progress
  getModules: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const completions = await db
      .select()
      .from(launchSkillSprint)
      .where(eq(launchSkillSprint.userId, ctx.user.id));

    const completionMap = new Map(completions.map((c) => [c.moduleId, c]));

    return SKILL_MODULES.map((m) => {
      const record = completionMap.get(m.id);
      return {
        ...m,
        status: record?.status ?? "not_started",
        challengeResponse: record?.challengeResponse ?? null,
        challengeFeedback: record?.challengeFeedback ?? null,
        challengeScore: record?.challengeScore ?? null,
        xpEarned: record?.xpEarned ?? 0,
        completedAt: record?.completedAt ?? null,
      };
    });
  }),

  // Get a single module with progress
  getModule: protectedProcedure
    .input(z.object({ moduleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const module = SKILL_MODULES.find((m) => m.id === input.moduleId);
      if (!module) throw new Error("Module not found");

      const [record] = await db
        .select()
        .from(launchSkillSprint)
        .where(
          and(
            eq(launchSkillSprint.userId, ctx.user.id),
            eq(launchSkillSprint.moduleId, input.moduleId)
          )
        );

      return {
        ...module,
        status: record?.status ?? "not_started",
        challengeResponse: record?.challengeResponse ?? null,
        challengeFeedback: record?.challengeFeedback ?? null,
        challengeScore: record?.challengeScore ?? null,
        xpEarned: record?.xpEarned ?? 0,
        completedAt: record?.completedAt ?? null,
      };
    }),

  // Submit challenge response and get AI feedback
  submitChallenge: protectedProcedure
    .input(
      z.object({
        moduleId: z.string(),
        response: z.string().min(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const module = SKILL_MODULES.find((m) => m.id === input.moduleId);
      if (!module) throw new Error("Module not found");

      // Generate AI feedback
      const llmResult = await invokeLLM({
        model: "claude-haiku-4-5",
        messages: [
          {
            role: "user",
            content: `You are Layla, an encouraging career coach for early-career professionals on LevelNext.

The user just completed the "${module.title}" skill module and submitted this challenge response:

CHALLENGE: ${module.challenge}

USER'S RESPONSE:
${input.response}

Provide brief, encouraging feedback (3-4 sentences max) that:
1. Acknowledges what they did well (be specific)
2. Gives one actionable improvement tip
3. Ends with an energising statement about their progress

Keep it warm, direct, and practical. Do NOT use bullet points — write in flowing sentences.
Score their response from 1-10 based on specificity, application of the module concepts, and practical usefulness.

Return JSON: { "feedback": "...", "score": 8 }`,
          },
        ],
        max_tokens: 400,
      });
      const rawContent = llmResult?.choices?.[0]?.message?.content ?? "";
      const feedbackText = typeof rawContent === "string" ? rawContent : "";

      let feedback = "";
      let score = 7;
      try {
        const parsed = JSON.parse(feedbackText);
        feedback = typeof parsed.feedback === "string" ? parsed.feedback : feedbackText;
        score = typeof parsed.score === "number" ? parsed.score : 7;
      } catch {
        feedback = feedbackText;
      }

      const xpEarned = Math.round(module.xp * (score / 10));

      // Upsert record
      const [existing] = await db
        .select()
        .from(launchSkillSprint)
        .where(
          and(
            eq(launchSkillSprint.userId, ctx.user.id),
            eq(launchSkillSprint.moduleId, input.moduleId)
          )
        );

      if (existing) {
        await db
          .update(launchSkillSprint)
          .set({
            challengeResponse: input.response,
            challengeFeedback: feedback,
            challengeScore: score,
            xpEarned,
            status: "completed",
            completedAt: new Date(),
          })
          .where(eq(launchSkillSprint.id, existing.id));
      } else {
        await db.insert(launchSkillSprint).values({
          userId: ctx.user.id,
          moduleId: input.moduleId,
          moduleTitle: module.title,
          category: module.category,
          challengeResponse: input.response,
          challengeFeedback: feedback,
          challengeScore: score,
          xpEarned,
          status: "completed",
          completedAt: new Date(),
        });
      }

      return { feedback, score, xpEarned };
    }),

  // Get overall Skill Sprint progress
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const completions = await db
      .select()
      .from(launchSkillSprint)
      .where(eq(launchSkillSprint.userId, ctx.user.id));

    const completed = completions.filter((c) => c.status === "completed").length;
    const totalXp = completions.reduce((sum, c) => sum + (c.xpEarned ?? 0), 0);

    return {
      completed,
      total: SKILL_MODULES.length,
      totalXp,
      pct: Math.round((completed / SKILL_MODULES.length) * 100),
    };
  }),
});
