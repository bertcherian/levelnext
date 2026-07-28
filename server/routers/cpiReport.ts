// ─── CPI Report Router ────────────────────────────────────────────────────────
// Generates the full 8-section Career Positioning Intelligence report using LLM.
// Sections:
//   1. Executive Summary
//   2. Career Positioning Score & Band
//   3. Dimension-by-Dimension Analysis
//   4. Your Career Positioning Archetype
//   5. Hidden Blind Spots
//   6. 90-Day Career Positioning Action Plan
//   7. Personalised Learning Recommendations
//   8. AI Career Transition Coach Configuration

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reports } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import {
  CPI_DIMENSIONS,
  CPI_ZONES,
  CPI_ARCHETYPES,
} from "../../shared/modules/careerData";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CpiDimensionAnalysis = {
  dimensionId: string;
  label: string;
  score: number;
  band: "strength" | "developing" | "gap";
  insight: string;          // 2–3 sentences: what this score reveals
  implication: string;      // 1–2 sentences: career impact of this score
  quickWin: string;         // One specific action within 14 days
};

export type CpiBlindSpot = {
  title: string;
  description: string;      // What the blind spot is and why it forms
  careerRisk: string;       // The specific career risk if unaddressed
  intervention: string;     // One concrete intervention
};

export type CpiActionItem = {
  week: string;             // e.g. "Week 1–2"
  focus: string;            // The dimension or theme being addressed
  action: string;           // Specific, observable action
  successMetric: string;    // How to know it worked
};

export type CpiLearningRecommendation = {
  category: "book" | "podcast" | "exercise" | "practice";
  title: string;
  description: string;      // Why this is relevant to this specific profile
  timeInvestment: string;   // e.g. "30 minutes per week"
};

export type CpiAnalysis = {
  // Section 1: Executive Summary
  executiveSummary: string;             // 3 paragraphs, boardroom-grade prose

  // Section 2: Score Interpretation
  scoreInterpretation: string;          // 2 paragraphs explaining what the score means for this person

  // Section 3: Dimension Analysis
  dimensionAnalysis: CpiDimensionAnalysis[];

  // Section 4: Archetype
  archetypeNarrative: string;           // 2 paragraphs personalised to this person's profile
  archetypeGrowthPath: string;          // 1 paragraph: what growth looks like from this archetype

  // Section 5: Hidden Blind Spots
  blindSpots: CpiBlindSpot[];           // 2–3 blind spots specific to this profile

  // Section 6: 90-Day Action Plan
  actionPlan: CpiActionItem[];          // 6 items covering weeks 1–2, 3–4, 5–6, 7–8, 9–10, 11–12

  // Section 7: Learning Recommendations
  learningRecommendations: CpiLearningRecommendation[];  // 4–5 items

  // Section 8: AI Coach Configuration
  coachFocusAreas: string[];            // 3 focus areas for the Career Transition Coach to prioritise
  coachOpeningPrompt: string;           // A personalised opening message from the Career Transition Coach
  coachChallengeQuestion: string;       // One powerful question to start the coaching conversation
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDimensionLabel(dimensionId: string): string {
  return CPI_DIMENSIONS.find((d) => d.id === dimensionId)?.label ?? dimensionId.replace(/_/g, " ");
}

function getDimensionBand(score: number): "strength" | "developing" | "gap" {
  if (score >= 75) return "strength";
  if (score >= 55) return "developing";
  return "gap";
}

function getZoneLabel(zone: string): string {
  return CPI_ZONES.find((z) => z.id === zone)?.label ?? zone.replace(/_/g, " ");
}

function getArchetypeData(archetypeId: string) {
  return CPI_ARCHETYPES.find((a) => a.id === archetypeId);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const cpiReportRouter = router({
  /**
   * Generate the full 8-section CPI analysis using LLM.
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
      if (report.moduleType !== "CPI") throw new TRPCError({ code: "BAD_REQUEST", message: "This procedure is for CPI reports only" });

      // Return cached analysis if available
      if (report.llmAnalysis && typeof report.llmAnalysis === "object" && (report.llmAnalysis as any).executiveSummary) {
        return report.llmAnalysis as CpiAnalysis;
      }

      const dimScores = (report.dimensionScores ?? {}) as Record<string, number>;
      const archetypeData = getArchetypeData(report.archetype ?? "");
      const zoneLabel = getZoneLabel(report.zone ?? "");

      // Build dimension summary for the prompt
      const dimensionSummary = CPI_DIMENSIONS.map((d) => {
        const score = dimScores[d.id] ?? 50;
        const band = getDimensionBand(score);
        return `${d.label}: ${score}/100 (${band}) — ${d.description}`;
      }).join("\n");

      const systemPrompt = `You are a senior Career Transition Coach and executive coach on the LevelNext Career Transition Intelligence platform.
You are generating a comprehensive, boardroom-grade Career Positioning Intelligence (CPI) report for a mid-to-senior professional.

Your analysis must be:
- Deeply personalised to this specific score profile — not generic
- Honest and direct — name the gaps without softening them
- Commercially grounded — always connect positioning to career outcomes and opportunities
- Actionable — every insight must lead to a specific, observable action
- Written in the second person ("You have...", "Your profile shows...")
- Professional but human — not corporate jargon

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

      const userPrompt = `Generate the full CPI report for this professional:

Name: ${report.participantName}
Role: ${report.participantRole ?? "Senior Professional"}
Organisation: ${report.organisation ?? "Not specified"}
Overall Career Positioning Score: ${report.edgeScore}/100
Band: ${zoneLabel}
Archetype: ${archetypeData?.label ?? report.archetype?.replace(/_/g, " ")}
Archetype Description: ${archetypeData?.description ?? ""}
Archetype Strengths: ${archetypeData?.strengths?.join(", ") ?? ""}
Archetype Risks: ${archetypeData?.risks?.join(", ") ?? ""}

Dimension Profile:
${dimensionSummary}

For the dimensionAnalysis array, include all 6 dimensions in this exact order:
1. executive_value_proposition
2. executive_narrative
3. professional_credibility
4. market_visibility
5. differentiation
6. future_positioning

For blindSpots, identify 2–3 blind spots that are specifically indicated by the pattern of high and low dimension scores — not generic ones.

For the 90-day actionPlan, create 6 items: Week 1–2, Week 3–4, Week 5–6, Week 7–8, Week 9–10, Week 11–12. Prioritise the lowest-scoring dimensions first.

For learningRecommendations, provide 4–5 items (mix of books, podcasts, exercises, and practices) that are specifically relevant to the gaps in this profile.

For coachFocusAreas, identify the 3 most important areas for the Career Transition Coach to focus on in coaching conversations based on this profile.`;

      let analysis: CpiAnalysis;
      try {
        const llmResult = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: "claude-sonnet-4-6",
        });
        const raw = (llmResult as any)?.content ?? (llmResult as any)?.choices?.[0]?.message?.content ?? "{}";
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        analysis = JSON.parse(cleaned) as CpiAnalysis;
      } catch (err) {
        // Fallback analysis if LLM fails
        analysis = buildFallbackAnalysis(report.participantName, report.edgeScore, dimScores, zoneLabel, archetypeData);
      }

      // Cache in the database
      await db
        .update(reports)
        .set({ llmAnalysis: analysis as any })
        .where(eq(reports.id, input.reportId));

      return analysis;
    }),

  /**
   * Get cached CPI analysis (without regenerating).
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
      return (report.llmAnalysis as CpiAnalysis | null) ?? null;
    }),
});

// ─── Fallback Analysis ────────────────────────────────────────────────────────

function buildFallbackAnalysis(
  name: string,
  edgeScore: number,
  dimScores: Record<string, number>,
  zoneLabel: string,
  archetypeData: ReturnType<typeof getArchetypeData>
): CpiAnalysis {
  const sortedDims = CPI_DIMENSIONS
    .map((d) => ({ ...d, score: dimScores[d.id] ?? 50 }))
    .sort((a, b) => b.score - a.score);
  const topDim = sortedDims[0];
  const bottomDim = sortedDims[sortedDims.length - 1];

  return {
    executiveSummary: `${name}, your Career Positioning Intelligence score of ${edgeScore}/100 places you in the ${zoneLabel} band. This profile reveals a professional with genuine capability who has not yet fully translated that capability into a compelling, market-visible positioning.\n\nYour strongest dimension — ${getDimensionLabel(topDim.id)} — is a genuine asset that you can leverage more deliberately. Your most significant development area — ${getDimensionLabel(bottomDim.id)} — represents the gap between where you are and where you could be in the market.\n\nThe 90-day plan in this report is designed to close that gap systematically. The Career Transition Coach is configured to your specific profile and ready to work through each dimension with you.`,
    scoreInterpretation: `A score of ${edgeScore}/100 in the ${zoneLabel} band means that your professional positioning is partially developed but not yet operating at full strength. Decision-makers who encounter you may recognise your capability, but they may not immediately understand the specific value you bring or why you are the right choice.\n\nThe opportunity here is significant. Professionals who move from this band to the next typically do so by sharpening two or three specific dimensions rather than trying to improve everything at once. Your action plan focuses on exactly that.`,
    dimensionAnalysis: CPI_DIMENSIONS.map((d) => {
      const score = dimScores[d.id] ?? 50;
      const band = getDimensionBand(score);
      return {
        dimensionId: d.id,
        label: d.label,
        score,
        band,
        insight: `Your ${d.label} score of ${score}/100 indicates ${band === "strength" ? "a genuine strength that is actively working in your favour" : band === "developing" ? "a developing capability with clear room to grow" : "a significant gap that is likely limiting your career opportunities"}.`,
        implication: `This ${band === "gap" ? "gap" : "profile"} in ${d.label} ${band === "gap" ? "is likely costing you opportunities you are not even aware of" : "is contributing to your overall positioning"}.`,
        quickWin: `In the next 14 days, identify one specific action that directly addresses your ${d.label} and execute it.`,
      };
    }),
    archetypeNarrative: `As ${archetypeData?.label ?? "a senior professional"}, ${archetypeData?.description ?? "you bring a distinctive combination of experience and capability to the market"}.\n\nThe strengths of this archetype — ${archetypeData?.strengths?.join(", ") ?? "expertise, credibility, and impact"} — are genuine differentiators when they are visible and well-articulated. The risks — ${archetypeData?.risks?.join(", ") ?? "limited visibility, unclear narrative"} — are the areas this report will help you address.`,
    archetypeGrowthPath: `Growth from this archetype position means becoming more deliberate about how you present, position, and amplify your distinctive value. The next stage is not about changing who you are — it is about ensuring the market sees and understands what you bring.`,
    blindSpots: [
      {
        title: "Invisible Expertise",
        description: "Your capability may be significantly underestimated by people who have not worked with you directly, because you have not yet built the visibility infrastructure to project it externally.",
        careerRisk: "You are likely being passed over for opportunities that match your actual capability, simply because the right people do not know you exist.",
        intervention: "In the next 14 days, share one specific insight or perspective with your professional network that demonstrates your expertise.",
      },
      {
        title: "Narrative Gap",
        description: "Your career story may not yet be told in a way that makes your trajectory feel inevitable and compelling to senior audiences.",
        careerRisk: "In high-stakes conversations, your narrative may not land with the impact your experience deserves.",
        intervention: "Write a 90-second career narrative that frames your journey in terms of business impact and deliberate choices, and practice it until it feels natural.",
      },
    ],
    actionPlan: [
      { week: "Week 1–2", focus: getDimensionLabel(bottomDim.id), action: `Conduct a specific audit of your ${getDimensionLabel(bottomDim.id)} and identify the single highest-leverage improvement you can make.`, successMetric: "You have a clear, written improvement plan with one specific action you will take." },
      { week: "Week 3–4", focus: "Executive Narrative", action: "Write and refine your 90-second career narrative. Test it with one trusted senior colleague and incorporate their feedback.", successMetric: "You can deliver your narrative confidently without notes and receive positive feedback from a senior peer." },
      { week: "Week 5–6", focus: "Market Visibility", action: "Update your LinkedIn profile to reflect your current level, expertise, and career ambitions. Share one piece of professional insight.", successMetric: "Your LinkedIn profile is complete and you have received at least one engagement on your shared content." },
      { week: "Week 7–8", focus: "Value Proposition", action: "Identify three specific business outcomes you have delivered in the last 12 months and build them into your value proposition.", successMetric: "You can articulate your value proposition with three evidence-backed examples in under two minutes." },
      { week: "Week 9–10", focus: "Differentiation", action: "Identify your two or three genuine differentiators and find one opportunity to demonstrate them in a high-visibility context.", successMetric: "You have articulated your differentiators in at least one senior conversation and received a positive response." },
      { week: "Week 11–12", focus: "Future Positioning", action: "Identify the skill or perspective you need to develop for your next role and take one concrete step toward building it.", successMetric: "You have enrolled in, started, or scheduled a specific development activity aligned to your next career stage." },
    ],
    learningRecommendations: [
      { category: "book", title: "Positioning: The Battle for Your Mind — Al Ries & Jack Trout", description: "The foundational text on positioning strategy, directly applicable to career positioning. Helps you understand how to own a position in the minds of decision-makers.", timeInvestment: "4–5 hours total" },
      { category: "exercise", title: "The 'Why Me?' Exercise", description: "Write a one-page answer to the question: 'Why should a senior leader choose me over someone with similar experience?' This forces clarity on your genuine differentiators.", timeInvestment: "90 minutes, once" },
      { category: "practice", title: "Weekly Visibility Practice", description: "Share one professional insight, observation, or perspective per week on LinkedIn or in a professional forum. Builds visibility and thought leadership simultaneously.", timeInvestment: "30 minutes per week" },
      { category: "podcast", title: "The Tim Ferriss Show — Career and Positioning Episodes", description: "Interviews with world-class performers on how they built their professional positioning and reputation. Provides concrete frameworks and mental models.", timeInvestment: "1 hour per week" },
    ],
    coachFocusAreas: [
      `Sharpening ${getDimensionLabel(bottomDim.id)}`,
      "Building a compelling executive narrative",
      "Increasing market visibility and inbound opportunities",
    ],
    coachOpeningPrompt: `Welcome back, ${name}. I've reviewed your Career Positioning Intelligence profile and I want to start where the biggest opportunity is — your ${getDimensionLabel(bottomDim.id)}. This is the dimension that, when strengthened, will have the most immediate impact on how decision-makers perceive and pursue you. Where would you like to begin?`,
    coachChallengeQuestion: `If the most important decision-maker in your target market were asked to describe you in two sentences right now, what would they say — and what would you wish they had said instead?`,
  };
}
