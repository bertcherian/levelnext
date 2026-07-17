import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  interviewPrepSessions,
  careerProfiles,
  reports,
} from "../../drizzle/schema";

// ─── Interview Prep Router ────────────────────────────────────────────────────
// Priority 4 of the Executive Opportunity System™
// Generates role research, likely questions, STAR story bank, and key messages

export const interviewPrepRouter = router({
  // ─── Get latest prep session ──────────────────────────────────────────────

  getLatestPrep: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [session] = await db
      .select()
      .from(interviewPrepSessions)
      .where(eq(interviewPrepSessions.userId, ctx.user.id))
      .orderBy(desc(interviewPrepSessions.createdAt))
      .limit(1);

    return session ?? null;
  }),

  // ─── List all prep sessions ───────────────────────────────────────────────

  listPreps: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db
      .select({
        id: interviewPrepSessions.id,
        targetRole: interviewPrepSessions.targetRole,
        targetCompany: interviewPrepSessions.targetCompany,
        interviewType: interviewPrepSessions.interviewType,
        createdAt: interviewPrepSessions.createdAt,
      })
      .from(interviewPrepSessions)
      .where(eq(interviewPrepSessions.userId, ctx.user.id))
      .orderBy(desc(interviewPrepSessions.createdAt));
  }),

  // ─── Generate interview prep ──────────────────────────────────────────────

  generatePrep: protectedProcedure
    .input(
      z.object({
        targetRole: z.string(),
        targetCompany: z.string(),
        interviewType: z.string().default("behavioral"),
        jobDescription: z.string().optional(),
        yourBackground: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get career profile and CI scores for context
      const [profile] = await db
        .select()
        .from(careerProfiles)
        .where(eq(careerProfiles.userId, ctx.user.id))
        .limit(1);

      const ciModules = ["CPI", "CRS", "CMK", "CST", "CAO", "AIR"];
      const allReports = await db
        .select()
        .from(reports)
        .where(eq(reports.userId, ctx.user.id))
        .orderBy(desc(reports.createdAt));
      const ciReports = allReports.filter((r) => ciModules.includes(r.moduleType));

      const profileContext = profile
        ? `Target Role: ${profile.targetRole ?? "Not specified"}
Key Achievements: ${profile.keyAchievements ?? "Not specified"}
Industry Expertise: ${profile.industryExpertise?.join(", ") ?? "Not specified"}
Career Motivation: ${profile.careerMotivation ?? "Not specified"}`
        : "No career profile available.";

      const ciContext = ciReports.length > 0
        ? `CI Scores: ${ciReports.map((r) => `${r.moduleType}: ${r.archetype ?? "N/A"} (${r.zone ?? "N/A"})`).join(", ")}`
        : "";

      const systemPrompt = `You are an elite executive interview coach with 20+ years of experience preparing senior leaders for C-suite and VP-level interviews. You know exactly what boards, CEOs, and hiring committees look for.

Generate comprehensive interview preparation for a ${input.interviewType} interview. Return ONLY valid JSON:
{
  "roleResearch": {
    "companyContext": ["Key fact about company 1", "Key fact 2", "Key fact 3", "Key fact 4"],
    "likelyPriorities": ["Priority for this role 1", "Priority 2", "Priority 3", "Priority 4"],
    "interviewerMindset": "What the interviewer is really evaluating (2-3 sentences)"
  },
  "likelyQuestions": [
    "Question 1?",
    "Question 2?",
    "Question 3?",
    "Question 4?",
    "Question 5?",
    "Question 6?"
  ],
  "suggestedAnswers": [
    "Suggested answer framework for Q1 (2-3 sentences, use the leader's background)",
    "Suggested answer for Q2",
    "Suggested answer for Q3",
    "Suggested answer for Q4",
    "Suggested answer for Q5",
    "Suggested answer for Q6"
  ],
  "storyBank": [
    {
      "title": "Story title (3-5 words)",
      "competency": "Leadership / Influence / Execution / Innovation / Resilience / Stakeholder Management",
      "situation": "Context and challenge (2 sentences)",
      "task": "What you were responsible for (1 sentence)",
      "action": "What you specifically did (2-3 sentences)",
      "result": "Measurable outcome with numbers if possible (1-2 sentences)"
    }
  ],
  "keyMessages": [
    "Key message to land in every answer 1",
    "Key message 2",
    "Key message 3"
  ],
  "questionsToAsk": [
    "Thoughtful question to ask the interviewer 1?",
    "Question 2?",
    "Question 3?",
    "Question 4?"
  ],
  "thingsToAvoid": [
    "Common mistake to avoid 1",
    "Mistake 2",
    "Mistake 3"
  ]
}

Generate 6 likely questions with answers, 3 STAR stories, 3 key messages, and 4 questions to ask. Tailor everything to the specific role, company, and interview type. Use the leader's background to make stories specific.`;

      const userMessage = `Role: ${input.targetRole}
Company: ${input.targetCompany}
Interview Type: ${input.interviewType}
${input.jobDescription ? `\nJob Description:\n${input.jobDescription}` : ""}
${input.yourBackground ? `\nYour Background:\n${input.yourBackground}` : ""}

${profileContext}
${ciContext}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        model: "claude-sonnet-4-5",
        maxTokens: 4000,
      });

      const rawText = response.choices[0]?.message?.content;
      if (!rawText || typeof rawText !== "string") {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "LLM returned empty response" });
      }

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not parse LLM response" });
      }

      const prepData = JSON.parse(jsonMatch[0]);

      const [inserted] = await db
        .insert(interviewPrepSessions)
        .values({
          userId: ctx.user.id,
          targetRole: input.targetRole,
          targetCompany: input.targetCompany,
          interviewType: input.interviewType,
          jobDescription: input.jobDescription,
          yourBackground: input.yourBackground,
          prepData,
        })
        .$returningId();

      const [result] = await db
        .select()
        .from(interviewPrepSessions)
        .where(eq(interviewPrepSessions.id, inserted.id));

      return result;
    }),

  // ─── Delete a prep session ────────────────────────────────────────────────

  deletePrep: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .delete(interviewPrepSessions)
        .where(
          eq(interviewPrepSessions.id, input.id)
        );

      return { success: true };
    }),
});
