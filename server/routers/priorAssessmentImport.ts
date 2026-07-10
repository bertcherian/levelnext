import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { priorAssessments } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import type { PriorAssessmentData, PriorAssessmentTheme } from "../../drizzle/schema";

// ─── Known assessment types ───────────────────────────────────────────────────
const ASSESSMENT_LABELS: Record<string, string> = {
  MBTI: "Myers-Briggs Type Indicator (MBTI)",
  DISC: "DISC Personality Assessment",
  HOGAN: "Hogan Personality Inventory",
  GALLUP: "Gallup CliftonStrengths",
  "360": "360-Degree Feedback Report",
  ENNEAGRAM: "Enneagram Assessment",
  BIG5: "Big Five Personality Assessment",
  BELBIN: "Belbin Team Roles",
  EQ: "Emotional Intelligence (EQ) Assessment",
  OTHER: "Other Assessment",
};

// ─── LLM extraction ───────────────────────────────────────────────────────────
async function extractAssessmentInsights(
  pdfText: string,
  assessmentType: string
): Promise<PriorAssessmentData> {
  const prompt = `You are an expert executive coach analysing a ${assessmentType} assessment report.

Extract the key leadership-relevant insights from the following assessment report text. Focus on:
1. What this tells us about the leader's natural strengths and working style
2. Potential blind spots or derailers
3. How this relates to leadership effectiveness
4. Patterns that a coach should be aware of

Return a JSON object with exactly this structure:
{
  "assessmentType": "${assessmentType}",
  "assessmentLabel": "${ASSESSMENT_LABELS[assessmentType] ?? assessmentType}",
  "participantName": "extracted name or 'Not specified'",
  "reportDate": "extracted date or 'Not specified'",
  "keyResult": "the primary result/type/score e.g. 'INTJ', 'High D / Low S', 'Achiever, Learner, Strategic'",
  "overallSummary": "3-4 sentence executive synthesis of what this assessment reveals about the leader's style, strengths, and development areas",
  "coachingContext": "2-3 sentences on how this assessment context should inform leadership coaching and development conversations",
  "themes": [
    {
      "id": "snake_case_slug",
      "title": "Theme Title",
      "description": "2-3 sentence description of this theme and its leadership implications",
      "category": "strength | challenge | pattern | blind_spot | growth_area",
      "relevance": "high | medium | low"
    }
  ],
  "importedAt": "${new Date().toISOString()}"
}

Extract 4-8 themes. Only include themes that are genuinely relevant to leadership effectiveness.

Assessment report text:
${pdfText.slice(0, 8000)}`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
    responseFormat: { type: "json_object" },
  });

  const content = response.choices[0].message.content as string;
  const parsed = JSON.parse(content) as PriorAssessmentData;

  // Ensure themes is always an array
  if (!Array.isArray(parsed.themes)) parsed.themes = [];

  return parsed;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const priorAssessmentImportRouter = router({
  // Step 1: Upload PDF, extract insights, return for review (nothing saved yet)
  uploadAssessmentPdf: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string(),
        fileName: z.string(),
        assessmentType: z.enum(["MBTI", "DISC", "HOGAN", "GALLUP", "360", "ENNEAGRAM", "BIG5", "BELBIN", "EQ", "OTHER"]),
      })
    )
    .mutation(async ({ input }) => {
      // Decode base64 PDF and extract text
      const pdfBuffer = Buffer.from(input.fileBase64, "base64");

      // Use pdf-parse to extract text
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      let pdfText = "";
      try {
        const parsed = await pdfParse(pdfBuffer);
        pdfText = parsed.text ?? "";
      } catch {
        throw new Error("Could not read the PDF. Please ensure it is a valid, text-based PDF.");
      }

      if (!pdfText || pdfText.trim().length < 100) {
        throw new Error("The PDF appears to be scanned or image-based. Please upload a text-based PDF report.");
      }

      // Extract insights via LLM
      const extracted = await extractAssessmentInsights(pdfText, input.assessmentType);

      // Return extracted data for user review — nothing saved yet
      return extracted;
    }),

  // Step 2: User approves and saves the extracted insights
  confirmAssessmentImport: protectedProcedure
    .input(
      z.object({
        assessmentType: z.string(),
        assessmentLabel: z.string(),
        data: z.any(), // Full PriorAssessmentData
        approvedThemes: z.array(z.string()), // IDs of themes the user approved
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const fullData = input.data as PriorAssessmentData;
      const approvedThemes = (fullData.themes ?? []).filter((t: PriorAssessmentTheme) =>
        input.approvedThemes.includes(t.id)
      );

      await db.insert(priorAssessments).values({
        userId: ctx.user.id,
        assessmentType: input.assessmentType,
        assessmentLabel: input.assessmentLabel,
        data: { ...fullData, themes: approvedThemes },
        themes: approvedThemes,
        rawFileDeleted: true,
      });

      return { success: true };
    }),

  // Get all prior assessments for the current user
  getMyAssessments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(priorAssessments)
      .where(eq(priorAssessments.userId, ctx.user.id))
      .orderBy(desc(priorAssessments.createdAt));
  }),
});
