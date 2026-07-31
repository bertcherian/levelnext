import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { launchBrandKit, launchUserProgress } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const launchStoryBuilderRouter = router({
  // Get or create the user's Brand Kit
  getBrandKit: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [existing] = await db
      .select()
      .from(launchBrandKit)
      .where(eq(launchBrandKit.userId, userId))
      .limit(1);
    return existing ?? null;
  }),

  // Step 1: Save origin story and optionally refine with AI
  saveOriginStory: protectedProcedure
    .input(z.object({
      originStory: z.string().min(50, "Please write at least 50 characters"),
      refineWithAI: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      let refined = input.originStory;

      if (input.refineWithAI) {
        const [progress] = await db
          .select()
          .from(launchUserProgress)
          .where(eq(launchUserProgress.userId, userId))
          .limit(1);

        const prompt = `You are a warm career coach helping a young professional (${progress?.experienceLevel ?? "0-2 years"} experience, targeting: ${progress?.targetRole ?? "a professional role"}) craft their professional origin story.

Their raw origin story:
"${input.originStory}"

Refine this into a compelling, authentic 3-4 sentence professional origin story that:
1. Starts with what sparked their interest in their field
2. Highlights a key experience or turning point
3. Connects to where they want to go
4. Sounds natural and human — not corporate

Return ONLY the refined story text, no preamble or explanation.`;

        try {
          const result = await invokeLLM({
            model: "claude-haiku-4-5",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 400,
          });
          const rawContent = result?.choices?.[0]?.message?.content;
          if (typeof rawContent === "string" && rawContent.length > 50) {
            refined = rawContent.trim();
          }
        } catch { /* use original */ }
      }

      const [existing] = await db
        .select()
        .from(launchBrandKit)
        .where(eq(launchBrandKit.userId, userId))
        .limit(1);

      if (existing) {
        await db
          .update(launchBrandKit)
          .set({
            originStory: input.originStory,
            originStoryRefined: refined,
            originStoryComplete: true,
          })
          .where(eq(launchBrandKit.userId, userId));
      } else {
        await db.insert(launchBrandKit).values({
          userId,
          originStory: input.originStory,
          originStoryRefined: refined,
          originStoryComplete: true,
        });
      }

      return { success: true, refinedStory: refined };
    }),

  // Step 2: Generate value proposition from user inputs
  generateValueProposition: protectedProcedure
    .input(z.object({
      topSkills: z.array(z.string()).min(1),
      targetAudience: z.string(),
      uniqueQuality: z.string(),
      desiredOutcome: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [progress] = await db
        .select()
        .from(launchUserProgress)
        .where(eq(launchUserProgress.userId, userId))
        .limit(1);

      const prompt = `You are a career branding expert helping a young professional (${progress?.experienceLevel ?? "0-2 years"} experience, targeting: ${progress?.targetRole ?? "a professional role"}) craft their professional value proposition.

Their inputs:
- Top skills: ${input.topSkills.join(", ")}
- Target audience (who they want to help/work with): ${input.targetAudience}
- What makes them unique: ${input.uniqueQuality}
- Desired outcome they deliver: ${input.desiredOutcome}

Generate:
1. A concise 1-2 sentence professional value proposition (the "I help X do Y through Z" format)
2. A LinkedIn headline (max 220 characters)

Return JSON:
{
  "valueProposition": "...",
  "linkedinHeadline": "..."
}`;

      let valueProposition = "";
      let linkedinHeadline = "";

      try {
        const result = await invokeLLM({
          model: "claude-haiku-4-5",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 400,
        });
        const rawContent = result?.choices?.[0]?.message?.content;
        if (typeof rawContent === "string") {
          const parsed = JSON.parse(rawContent);
          valueProposition = parsed.valueProposition ?? "";
          linkedinHeadline = parsed.linkedinHeadline ?? "";
        }
      } catch {
        valueProposition = `I help ${input.targetAudience} ${input.desiredOutcome} through my expertise in ${input.topSkills.slice(0, 2).join(" and ")}.`;
        linkedinHeadline = `${progress?.targetRole ?? "Professional"} | ${input.topSkills.slice(0, 2).join(" & ")}`;
      }

      const [existing] = await db
        .select()
        .from(launchBrandKit)
        .where(eq(launchBrandKit.userId, userId))
        .limit(1);

      if (existing) {
        await db
          .update(launchBrandKit)
          .set({
            valueProposition,
            valuePropositionRefined: valueProposition,
            linkedinHeadline,
            valuePropositionComplete: true,
          })
          .where(eq(launchBrandKit.userId, userId));
      } else {
        await db.insert(launchBrandKit).values({
          userId,
          valueProposition,
          valuePropositionRefined: valueProposition,
          linkedinHeadline,
          valuePropositionComplete: true,
        });
      }

      return { success: true, valueProposition, linkedinHeadline };
    }),

  // Step 3: Generate elevator pitch (30s and 60s versions)
  generateElevatorPitch: protectedProcedure
    .input(z.object({
      context: z.string().optional(), // e.g. "networking event", "job interview"
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [brandKit] = await db
        .select()
        .from(launchBrandKit)
        .where(eq(launchBrandKit.userId, userId))
        .limit(1);

      const [progress] = await db
        .select()
        .from(launchUserProgress)
        .where(eq(launchUserProgress.userId, userId))
        .limit(1);

      const context = input.context ?? "a professional networking event";

      const prompt = `You are a career coach helping a young professional craft their elevator pitch.

Their professional profile:
- Target role: ${progress?.targetRole ?? "professional role"}
- Industry: ${progress?.targetIndustry ?? "their industry"}
- Origin story: ${brandKit?.originStoryRefined ?? brandKit?.originStory ?? "not provided"}
- Value proposition: ${brandKit?.valuePropositionRefined ?? "not provided"}
- LinkedIn headline: ${brandKit?.linkedinHeadline ?? "not provided"}
- Context: ${context}

Generate two elevator pitches:
1. A 30-second version (60-80 words) — punchy, memorable, ends with a hook
2. A 60-second version (120-150 words) — adds a specific achievement or story

Return JSON:
{
  "pitch30": "...",
  "pitch60": "...",
  "linkedinAbout": "A 3-paragraph LinkedIn About section (200-250 words) that expands on their story, value, and what they're looking for"
}`;

      let pitch30 = "";
      let pitch60 = "";
      let linkedinAbout = "";

      try {
        const result = await invokeLLM({
          model: "claude-haiku-4-5",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800,
        });
        const rawContent = result?.choices?.[0]?.message?.content;
        if (typeof rawContent === "string") {
          const parsed = JSON.parse(rawContent);
          pitch30 = parsed.pitch30 ?? "";
          pitch60 = parsed.pitch60 ?? "";
          linkedinAbout = parsed.linkedinAbout ?? "";
        }
      } catch {
        pitch30 = `Hi, I'm ${progress?.targetRole ? `aspiring to be a ${progress.targetRole}` : "a young professional"} with a passion for ${progress?.targetIndustry ?? "my field"}. I'm currently building my skills and looking for opportunities to make an impact. I'd love to connect and learn more about what you do.`;
        pitch60 = pitch30;
      }

      await db
        .update(launchBrandKit)
        .set({
          elevatorPitch30: pitch30,
          elevatorPitch60: pitch60,
          linkedinAbout,
          elevatorPitchComplete: true,
        })
        .where(eq(launchBrandKit.userId, userId));

      return { success: true, pitch30, pitch60, linkedinAbout };
    }),

  // Update any field in the brand kit manually
  updateBrandKit: protectedProcedure
    .input(z.object({
      originStoryRefined: z.string().optional(),
      valuePropositionRefined: z.string().optional(),
      linkedinHeadline: z.string().max(220).optional(),
      linkedinAbout: z.string().optional(),
      elevatorPitch30: z.string().optional(),
      elevatorPitch60: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [existing] = await db
        .select()
        .from(launchBrandKit)
        .where(eq(launchBrandKit.userId, userId))
        .limit(1);

      const updates = Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined)
      );

      if (existing) {
        await db
          .update(launchBrandKit)
          .set(updates)
          .where(eq(launchBrandKit.userId, userId));
      } else {
        await db.insert(launchBrandKit).values({ userId, ...updates });
      }

      return { success: true };
    }),
});
