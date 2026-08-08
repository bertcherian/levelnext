// ─── Shared CI Report Router ──────────────────────────────────────────────────
// Generates the full 8-section Career Intelligence report for any of the 6
// CI modules: CPI | CRS | CMK | CST | CAO | AIR
//
// Sections:
//   1. Executive Summary
//   2. Score & Zone Interpretation
//   3. Dimension-by-Dimension Analysis
//   4. Your Career Archetype
//   5. Hidden Blind Spots
//   6. 90-Day Action Plan
//   7. Personalised Learning Recommendations
//   8. AI Coach Configuration

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reports } from "../../drizzle/schema";
import { invokeLLM, safeJsonParse } from "../_core/llm";
import {
  getCiDimensions,
  getCiZone,
  getCiModule,
  CI_MODULES,
  CI_MODULE_LABELS,
  CI_DIMENSION_LABELS,
  type CiArchetype,
} from "../../shared/modules/careerData";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CiDimensionAnalysis = {
  dimensionId: string;
  label: string;
  score: number;
  band: "strength" | "developing" | "gap";
  insight: string;
  implication: string;
  quickWin: string;
};

export type CiBlindSpot = {
  title: string;
  description: string;
  careerRisk: string;
  intervention: string;
};

export type CiActionItem = {
  week: string;
  focus: string;
  action: string;
  successMetric: string;
};

export type CiLearningRecommendation = {
  category: "book" | "podcast" | "exercise" | "practice";
  title: string;
  description: string;
  timeInvestment: string;
};

export type CiAnalysis = {
  executiveSummary: string;
  scoreInterpretation: string;
  dimensionAnalysis: CiDimensionAnalysis[];
  archetypeNarrative: string;
  archetypeGrowthPath: string;
  blindSpots: CiBlindSpot[];
  actionPlan: CiActionItem[];
  learningRecommendations: CiLearningRecommendation[];
  coachFocusAreas: string[];
  coachOpeningPrompt: string;
  coachChallengeQuestion: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CI_MODULE_CODES = ["CPI", "CRS", "CMK", "CST", "CAO", "AIR"] as const;
type CiModuleCode = typeof CI_MODULE_CODES[number];

function getDimensionBand(score: number): "strength" | "developing" | "gap" {
  if (score >= 75) return "strength";
  if (score >= 55) return "developing";
  return "gap";
}

function buildFallbackAnalysis(
  moduleCode: string,
  name: string,
  edgeScore: number,
  dimScores: Record<string, number>,
  zoneLabel: string,
  archetypeLabel: string
): CiAnalysis {
  const moduleMeta = getCiModule(moduleCode);
  const moduleLabel = CI_MODULE_LABELS[moduleCode] ?? moduleCode;
  const dimensions = getCiDimensions(moduleCode);
  const dimLabels = CI_DIMENSION_LABELS[moduleCode] ?? {};

  const sorted = dimensions
    .map((d) => ({ ...d, score: dimScores[d.id] ?? 50 }))
    .sort((a, b) => b.score - a.score);
  const topDim = sorted[0];
  const bottomDim = sorted[sorted.length - 1];

  return {
    executiveSummary: `${name}, your ${moduleLabel} score of ${edgeScore}/100 places you in the ${zoneLabel} band. ${moduleMeta?.description ?? "This diagnostic reveals important insights about your career transition readiness."}\n\nYour strongest dimension — ${dimLabels[topDim?.id ?? ""] ?? topDim?.label ?? "top area"} — is a genuine asset that you can leverage more deliberately. Your most significant development area — ${dimLabels[bottomDim?.id ?? ""] ?? bottomDim?.label ?? "growth area"} — represents the gap between where you are and where you could be.\n\nThe 90-day plan in this report is designed to close that gap systematically. Your Career Transition Coach is configured to your specific profile and ready to work through each dimension with you.`,
    scoreInterpretation: `A score of ${edgeScore}/100 in the ${zoneLabel} band means your ${moduleLabel.toLowerCase()} is partially developed but not yet operating at full strength. Decision-makers who encounter you may recognise your capability, but may not immediately understand the specific value you bring.\n\nThe opportunity here is significant. Professionals who move from this band to the next typically do so by sharpening two or three specific dimensions rather than trying to improve everything at once. Your action plan focuses on exactly that.`,
    dimensionAnalysis: dimensions.map((d) => {
      const score = dimScores[d.id] ?? 50;
      const band = getDimensionBand(score);
      const label = dimLabels[d.id] ?? d.label;
      return {
        dimensionId: d.id,
        label,
        score,
        band,
        insight: `Your ${label} score of ${score}/100 indicates ${band === "strength" ? "a genuine strength actively working in your favour" : band === "developing" ? "a developing capability with clear room to grow" : "a significant gap that is likely limiting your career opportunities"}.`,
        implication: `This ${band === "gap" ? "gap" : "profile"} in ${label} ${band === "gap" ? "is likely costing you opportunities you are not even aware of" : "is contributing to your overall career intelligence"}.`,
        quickWin: `In the next 14 days, identify one specific action that directly addresses your ${label} and execute it.`,
      };
    }),
    archetypeNarrative: `As ${archetypeLabel}, you bring a distinctive combination of experience and capability to your career. This archetype reflects how you currently navigate your professional landscape.\n\nThe strengths of this archetype are genuine differentiators when they are visible and well-articulated. The risks are the areas this report will help you address systematically over the next 90 days.`,
    archetypeGrowthPath: `Growth from this archetype position means becoming more deliberate about how you present, position, and amplify your distinctive value. The next stage is not about changing who you are — it is about ensuring the market sees what you already have.`,
    blindSpots: [
      {
        title: "Invisible Capability",
        description: "Your actual capability exceeds your visible positioning. Others may underestimate you because you have not made your value explicit.",
        careerRisk: "Being passed over for opportunities that match your capability because decision-makers cannot see what you bring.",
        intervention: "In the next 7 days, write a single paragraph that articulates your unique professional value. Share it with one trusted colleague for feedback.",
      },
      {
        title: "Reactive Rather Than Strategic",
        description: "Your career moves have been largely reactive — responding to opportunities rather than creating them.",
        careerRisk: "Continuing to be dependent on others to recognise and create opportunities for you, rather than engineering your own.",
        intervention: "Identify one specific career outcome you want in the next 12 months and map the three actions that would move you closest to it.",
      },
    ],
    actionPlan: [
      { week: "Week 1–2", focus: "Foundation", action: `Audit your current ${moduleLabel.toLowerCase()} across all dimensions and identify your top two development priorities.`, successMetric: "Written audit document with two clear priorities identified." },
      { week: "Week 3–4", focus: "Quick Wins", action: "Execute one visible action in your lowest-scoring dimension.", successMetric: "One completed action with documented outcome." },
      { week: "Week 5–6", focus: "Stakeholder Engagement", action: "Have one direct conversation with a key stakeholder about your career direction.", successMetric: "Conversation completed and key insights recorded." },
      { week: "Week 7–8", focus: "Skill Building", action: "Complete one learning activity (book, course, or practice) targeting your development area.", successMetric: "Learning activity completed with three key takeaways documented." },
      { week: "Week 9–10", focus: "Visibility", action: "Take one action that increases your professional visibility in your target area.", successMetric: "Visibility action completed and response tracked." },
      { week: "Week 11–12", focus: "Review & Reset", action: "Review progress against all six dimensions and set your next 90-day priorities.", successMetric: "Written 90-day review with updated priorities for the next cycle." },
    ],
    learningRecommendations: [
      { category: "book", title: "Designing Your Life", description: "Applies design thinking to career development — highly relevant to your profile.", timeInvestment: "3–4 hours" },
      { category: "practice", title: "Weekly Career Reflection", description: "15-minute weekly review of what moved your career forward and what held it back.", timeInvestment: "15 minutes per week" },
      { category: "exercise", title: "Stakeholder Mapping", description: "Map the 10 people who most influence your career trajectory and identify gaps.", timeInvestment: "2 hours once, then 30 minutes monthly" },
      { category: "podcast", title: "WorkLife with Adam Grant", description: "Evidence-based insights on career development and professional growth.", timeInvestment: "30 minutes per episode" },
    ],
    coachFocusAreas: [
      `Strengthening ${dimLabels[bottomDim?.id ?? ""] ?? "your lowest dimension"}`,
      "Translating capability into visible market positioning",
      "Building a 90-day execution discipline",
    ],
    coachOpeningPrompt: `${name}, I've reviewed your ${moduleLabel} profile. Your score of ${edgeScore}/100 tells an interesting story — there's genuine capability here that isn't fully visible yet. Let's start with what's holding you back from the next level.`,
    coachChallengeQuestion: `If you had to describe your unique professional value in one sentence to a decision-maker you've never met, what would you say — and how confident are you that they would find it compelling?`,
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const ciReportRouter = router({
  /**
   * Generate the full 8-section CI analysis using LLM.
   * Works for any of the 6 CI modules.
   * Stores the result in reports.llmAnalysis for caching.
   */
  generateAnalysis: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db
        .select()
        .from(reports)
        .where(eq(reports.id, input.reportId))
        .limit(1);
      const report = result[0];
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      if (report.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const moduleCode = report.moduleType ?? "CPI";
      if (!CI_MODULE_CODES.includes(moduleCode as CiModuleCode)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Module ${moduleCode} is not a CI module` });
      }

      // Return cached analysis if available
      if (
        report.llmAnalysis &&
        typeof report.llmAnalysis === "object" &&
        (report.llmAnalysis as any).executiveSummary
      ) {
        return report.llmAnalysis as CiAnalysis;
      }

      const dimScores = (report.dimensionScores ?? {}) as Record<string, number>;
      const moduleMeta = getCiModule(moduleCode);
      const moduleLabel = CI_MODULE_LABELS[moduleCode] ?? moduleCode;
      const dimensions = getCiDimensions(moduleCode);
      const dimLabels = CI_DIMENSION_LABELS[moduleCode] ?? {};
      const zone = getCiZone(moduleCode, report.edgeScore ?? 50);
      const archetypeLabel = (report.archetype ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      // Build dimension summary
      const dimensionSummary = dimensions
        .map((d) => {
          const score = dimScores[d.id] ?? 50;
          const band = getDimensionBand(score);
          const label = dimLabels[d.id] ?? d.label;
          return `${label}: ${score}/100 (${band}) — ${d.description}`;
        })
        .join("\n");

      const dimensionOrder = dimensions.map((d, i) => `${i + 1}. ${d.id}`).join("\n");

      const systemPrompt = `You are a senior Career Transition Coach and executive coach on the LevelNext Career Transition Intelligence platform.
You are generating a comprehensive, boardroom-grade ${moduleLabel} (${moduleCode}) report for a mid-to-senior professional.

Your analysis must be:
- Deeply personalised to this specific score profile — not generic
- Honest and direct — name the gaps without softening them
- Commercially grounded — always connect positioning to career outcomes
- Actionable — every insight must lead to a specific, observable action
- Written in the second person ("You have...", "Your profile shows...")
- Professional but human — not corporate jargon

Module context: ${moduleMeta?.description ?? ""}
Module journey stage: ${moduleMeta?.journeyStage ?? ""}

Never mention "scores", "assessment", "test", or "chatbot".
Always refer to the platform as LevelNext and the coach as Career Transition Coach.

Return ONLY valid JSON matching this exact schema — no markdown, no preamble:
{
  "executiveSummary": "string (3 paragraphs separated by \\n\\n)",
  "scoreInterpretation": "string (2 paragraphs separated by \\n\\n)",
  "dimensionAnalysis": [
    {
      "dimensionId": "string",
      "label": "string",
      "score": number,
      "band": "strength|developing|gap",
      "insight": "string (2-3 sentences)",
      "implication": "string (1-2 sentences)",
      "quickWin": "string (one specific action within 14 days)"
    }
  ],
  "archetypeNarrative": "string (2 paragraphs separated by \\n\\n)",
  "archetypeGrowthPath": "string (1 paragraph)",
  "blindSpots": [
    {
      "title": "string",
      "description": "string",
      "careerRisk": "string",
      "intervention": "string"
    }
  ],
  "actionPlan": [
    {
      "week": "string (e.g. Week 1–2)",
      "focus": "string",
      "action": "string",
      "successMetric": "string"
    }
  ],
  "learningRecommendations": [
    {
      "category": "book|podcast|exercise|practice",
      "title": "string",
      "description": "string",
      "timeInvestment": "string"
    }
  ],
  "coachFocusAreas": ["string", "string", "string"],
  "coachOpeningPrompt": "string",
  "coachChallengeQuestion": "string"
}`;

      const userPrompt = `Generate the full ${moduleCode} report for this professional:

Name: ${report.participantName}
Role: ${report.participantRole ?? "Senior Professional"}
Overall ${moduleLabel} Score: ${report.edgeScore}/100
Zone: ${zone.label}
Archetype: ${archetypeLabel}

Dimension Profile:
${dimensionSummary}

For the dimensionAnalysis array, include all dimensions in this exact order:
${dimensionOrder}

For blindSpots, identify 2–3 blind spots specifically indicated by the pattern of high and low dimension scores — not generic ones.

For the 90-day actionPlan, create 6 items: Week 1–2, Week 3–4, Week 5–6, Week 7–8, Week 9–10, Week 11–12. Prioritise the lowest-scoring dimensions first.

For learningRecommendations, provide 4–5 items (mix of books, podcasts, exercises, and practices) specifically relevant to the gaps in this profile.

For coachFocusAreas, identify the 3 most important areas for the Career Transition Coach to focus on based on this profile.`;

      let analysis: CiAnalysis;
      try {
        const llmResult = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: "claude-sonnet-4-6",
        });
        const raw =
          (llmResult as any)?.content ??
          (llmResult as any)?.choices?.[0]?.message?.content ??
          "{}";
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        analysis = safeJsonParse<CiAnalysis>(cleaned, buildFallbackAnalysis(
          moduleCode,
          report.participantName,
          report.edgeScore ?? 50,
          dimScores,
          zone.label,
          archetypeLabel
        ), "ciReport.generateAnalysis");
      } catch {
        analysis = buildFallbackAnalysis(
          moduleCode,
          report.participantName,
          report.edgeScore ?? 50,
          dimScores,
          zone.label,
          archetypeLabel
        );
      }

      // Cache in the database
      await db
        .update(reports)
        .set({ llmAnalysis: analysis as any })
        .where(eq(reports.id, input.reportId));

      return analysis;
    }),

  /**
   * Get cached CI analysis (without regenerating).
   */
  getAnalysis: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db
        .select()
        .from(reports)
        .where(eq(reports.id, input.reportId))
        .limit(1);
      const report = result[0];
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });
      if (report.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return (report.llmAnalysis as CiAnalysis | null) ?? null;
    }),

  /**
   * Get the report row (scores, zone, archetype) for display.
   */
  getReport: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db
        .select()
        .from(reports)
        .where(eq(reports.slug, input.slug))
        .limit(1);
      const report = result[0];
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });
      if (report.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return report;
    }),
});
