import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { launchCareerCompass, launchUserProgress } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ─── Career Compass Question Bank ────────────────────────────────────────────
// 4 dimensions × 4 questions = 16 questions total
export const CAREER_COMPASS_QUESTIONS = {
  strengths: [
    { id: "s1", text: "When you help someone solve a problem, what kind of problem do you enjoy solving most?", placeholder: "e.g. technical puzzles, people challenges, creative problems..." },
    { id: "s2", text: "What activity makes you lose track of time because you're so absorbed in it?", placeholder: "e.g. writing, coding, designing, analysing data..." },
    { id: "s3", text: "Think of a time you felt genuinely proud of something you did. What skill did you use?", placeholder: "e.g. I organised a college event and..." },
    { id: "s4", text: "What do friends or classmates often come to you for help with?", placeholder: "e.g. advice, technical help, creative ideas..." },
  ],
  interests: [
    { id: "i1", text: "If you could spend a whole day learning about any topic, what would it be?", placeholder: "e.g. how businesses grow, how AI works, how people behave..." },
    { id: "i2", text: "What industry or field do you find yourself reading about or watching videos on — even when you don't have to?", placeholder: "e.g. startups, healthcare, sustainability, finance..." },
    { id: "i3", text: "What kind of work would you do even if you weren't paid for it?", placeholder: "e.g. teaching, building things, helping people, creating content..." },
    { id: "i4", text: "What problem in the world do you most want to be part of solving?", placeholder: "e.g. climate change, financial inclusion, mental health..." },
  ],
  workStyle: [
    { id: "w1", text: "Do you prefer working independently or collaborating closely with others? Describe your ideal work setup.", placeholder: "e.g. I like working alone on deep tasks but collaborating for..." },
    { id: "w2", text: "Do you prefer structured routines or variety and unpredictability in your day?", placeholder: "e.g. I thrive when I have a clear plan, or I get bored without variety..." },
    { id: "w3", text: "Do you prefer working with data and systems, or with people and relationships?", placeholder: "e.g. I love analysing numbers, or I'm energised by conversations..." },
    { id: "w4", text: "How do you prefer to make decisions — by analysing all options carefully, or by going with your gut?", placeholder: "e.g. I like to research thoroughly before deciding..." },
  ],
  values: [
    { id: "v1", text: "What matters most to you in a job — impact, income, learning, flexibility, or status? Pick one and explain why.", placeholder: "e.g. Learning matters most because I want to grow fast in my 20s..." },
    { id: "v2", text: "What kind of company culture would make you feel most alive at work?", placeholder: "e.g. fast-paced startup, mission-driven NGO, structured corporate..." },
    { id: "v3", text: "What would make you feel like your work is truly meaningful?", placeholder: "e.g. seeing direct impact on users, building something from scratch..." },
    { id: "v4", text: "Where do you want to be in 5 years — and what does success look like to you?", placeholder: "e.g. leading a product team, running my own business, being a domain expert..." },
  ],
};

export const launchCareerCompassRouter = router({
  // Get or create a Career Compass session for the current user
  getSession: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [existing] = await db
      .select()
      .from(launchCareerCompass)
      .where(eq(launchCareerCompass.userId, userId))
      .limit(1);
    return { session: existing ?? null, questions: CAREER_COMPASS_QUESTIONS };
  }),

  // Save responses for a dimension
  saveResponses: protectedProcedure
    .input(z.object({
      dimension: z.enum(["strengths", "interests", "workStyle", "values"]),
      responses: z.array(z.object({ questionId: z.string(), answer: z.string() })),
    }))
    .mutation(async ({ ctx, input }) => {
          const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [existing] = await db
      .select()
      .from(launchCareerCompass)
      .where(eq(launchCareerCompass.userId, userId))
      .limit(1);

      const fieldMap: Record<string, string> = {
        strengths: "strengthsResponses",
        interests: "interestResponses",
        workStyle: "workStyleResponses",
        values: "valuesResponses",
      };
      const field = fieldMap[input.dimension];

      if (existing) {
        await db
          .update(launchCareerCompass)
          .set({ [field]: input.responses } as any)
          .where(eq(launchCareerCompass.userId, userId));
      } else {
        await db.insert(launchCareerCompass).values({
          userId,
          [field]: input.responses,
        } as any);
      }
      return { success: true };
    }),

  // Complete the Career Compass and generate the Career Direction Card via LLM
  complete: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [session] = await db
      .select()
      .from(launchCareerCompass)
      .where(eq(launchCareerCompass.userId, userId))
      .limit(1);

    if (!session) throw new Error("No Career Compass session found");

    // Get user progress for context
    const [progress] = await db
      .select()
      .from(launchUserProgress)
      .where(eq(launchUserProgress.userId, userId))
      .limit(1);

    const targetRole = progress?.targetRole ?? "not specified";
    const targetIndustry = progress?.targetIndustry ?? "not specified";
    const experienceLevel = progress?.experienceLevel ?? "0-1 years";

    // Build a rich context from all responses
    const allResponses = [
      ...(session.strengthsResponses ?? []),
      ...(session.interestResponses ?? []),
      ...(session.workStyleResponses ?? []),
      ...(session.valuesResponses ?? []),
    ];

    const responseText = allResponses
      .map((r) => `Q: ${r.questionId} → A: ${r.answer}`)
      .join("\n");

    const prompt = `You are a warm, insightful career coach helping a young professional (${experienceLevel} experience, target role: ${targetRole}, target industry: ${targetIndustry}) discover their ideal career direction.

Based on their Career Compass responses below, generate a structured Career Direction Card.

RESPONSES:
${responseText}

Return a JSON object with this exact structure:
{
  "primaryDirection": "specific career path (e.g. Product Management in FinTech)",
  "secondaryDirection": "alternative career path",
  "tertiaryDirection": "third option",
  "topStrengths": ["strength 1", "strength 2", "strength 3"],
  "coreInterests": ["interest 1", "interest 2", "interest 3"],
  "workStyleProfile": "2-3 sentence description of their ideal work environment",
  "coreValues": ["value 1", "value 2", "value 3"],
  "narrative": "A warm, encouraging 3-paragraph narrative explaining their career direction, why it fits them, and what their first 90 days should focus on. Write in second person (you). Be specific and actionable.",
  "nextActions": ["specific action 1", "specific action 2", "specific action 3"],
  "roleExamples": ["specific job title 1", "specific job title 2", "specific job title 3"]
}`;

    let directionCard: Record<string, unknown> = {};
    let narrative = "";
    let primaryDirection = "Career path being discovered";
    let secondaryDirection = "";
    let tertiaryDirection = "";

    try {
    const result = await invokeLLM({
      model: "claude-haiku-4-5",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
    });
    const rawContent = result?.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "";
      directionCard = JSON.parse(content);
      narrative = (directionCard.narrative as string) ?? "";
      primaryDirection = (directionCard.primaryDirection as string) ?? "Career path being discovered";
      secondaryDirection = (directionCard.secondaryDirection as string) ?? "";
      tertiaryDirection = (directionCard.tertiaryDirection as string) ?? "";
    } catch {
      narrative = `Based on your responses, you have a unique combination of strengths, interests, and values that point toward ${targetRole || "a fulfilling career path"}. Your natural abilities and what energises you are strong signals for where you'll thrive. Take time to explore the directions suggested and remember — your first job is a starting point, not a destination.`;
      primaryDirection = targetRole || "Career path being discovered";
    }

    await db
      .update(launchCareerCompass)
      .set({
        directionCardJson: directionCard,
        llmNarrative: narrative,
        primaryDirection,
        secondaryDirection,
        tertiaryDirection,
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(launchCareerCompass.userId, userId));

    // Award XP for completing Career Compass
    try {
      const [prog] = await db
        .select()
        .from(launchUserProgress)
        .where(eq(launchUserProgress.userId, userId))
        .limit(1);
      if (prog) {
        const newXp = (prog.totalXp ?? 0) + 100;
        const newLevel = getLevel(newXp);
        await db
          .update(launchUserProgress)
          .set({ totalXp: newXp, currentLevel: newLevel })
          .where(eq(launchUserProgress.userId, userId));
      }
    } catch { /* non-critical */ }

    return { success: true, primaryDirection, narrative };
  }),

  // Get the completed Career Direction Card
  getDirectionCard: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [session] = await db
      .select()
      .from(launchCareerCompass)
      .where(eq(launchCareerCompass.userId, userId))
      .limit(1);
    return session ?? null;
  }),
});

function getLevel(xp: number): string {
  if (xp >= 5000) return "Career Starter";
  if (xp >= 3500) return "Offer Winner";
  if (xp >= 2000) return "Interview Pro";
  if (xp >= 1200) return "Candidate";
  if (xp >= 700) return "Professional";
  if (xp >= 300) return "Builder";
  return "Explorer";
}
