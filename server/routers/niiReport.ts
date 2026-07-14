// ─── Navigation Intelligence™ (NII) Report Engine ────────────────────────────
// Generates the full 8-section Navigation Intelligence report using LLM.
// Sections:
//   1. Executive Summary
//   2. NII Score & Zone Interpretation
//   3. Dimension-by-Dimension Analysis
//   4. Navigation Maturity Level & Archetype
//   5. Organizational Blind Spots
//   6. 90-Day Navigation Action Plan
//   7. Stakeholder & Coalition Recommendations
//   8. Navigator AI Coach Configuration

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reports } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import {
  NII_DIMENSIONS,
  NII_ZONES,
  NII_ARCHETYPES,
  NII_MATURITY_LEVELS,
} from "../../shared/modules/niiData";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NiiDimensionAnalysis = {
  dimensionId: string;
  label: string;
  score: number;
  band: "strength" | "developing" | "gap";
  insight: string;          // 2–3 sentences: what this score reveals
  implication: string;      // 1–2 sentences: organizational impact
  quickWin: string;         // One specific action within 14 days
};

export type NiiBlindSpot = {
  title: string;
  description: string;      // What the blind spot is and why it forms
  organizationalRisk: string; // The specific risk if unaddressed
  intervention: string;     // One concrete intervention
};

export type NiiActionItem = {
  week: string;             // e.g. "Week 1–2"
  focus: string;            // The dimension or theme being addressed
  action: string;           // Specific, observable action
  successMetric: string;    // How to know it worked
};

export type NiiStakeholderRecommendation = {
  stakeholderType: string;  // e.g. "Senior Sponsors", "Peer Coalition", "Cross-functional Partners"
  currentGap: string;       // What's missing in this relationship
  strategy: string;         // Specific approach to strengthen this relationship
  firstStep: string;        // The first concrete action this week
};

export type NiiAnalysis = {
  // Section 1: Executive Summary
  executiveSummary: string;             // 3 paragraphs, boardroom-grade prose
  // Section 2: Score & Zone Interpretation
  scoreInterpretation: string;          // 2 paragraphs explaining what the score means
  maturityNarrative: string;            // 1 paragraph on the maturity level
  // Section 3: Dimension Analysis
  dimensionAnalysis: NiiDimensionAnalysis[];
  // Section 4: Maturity Level & Archetype
  archetypeNarrative: string;           // 2 paragraphs personalised to this person's profile
  maturityGrowthPath: string;           // 1 paragraph: what growth looks like from this level
  // Section 5: Organizational Blind Spots
  blindSpots: NiiBlindSpot[];           // 2–3 blind spots specific to this profile
  // Section 6: 90-Day Action Plan
  actionPlan: NiiActionItem[];          // 6 items covering weeks 1–2 through 11–12
  // Section 7: Stakeholder & Coalition Recommendations
  stakeholderRecommendations: NiiStakeholderRecommendation[];  // 3 recommendations
  // Section 8: Navigator AI Coach Configuration
  coachFocusAreas: string[];            // 3 focus areas for the Navigator coach
  coachOpeningPrompt: string;           // A personalised opening message from the Navigator
  coachChallengeQuestion: string;       // One powerful question to start the coaching conversation
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDimensionBand(score: number): "strength" | "developing" | "gap" {
  if (score >= 75) return "strength";
  if (score >= 50) return "developing";
  return "gap";
}

function getZoneLabel(zoneId: string): string {
  return NII_ZONES.find((z) => z.id === zoneId)?.label ?? zoneId.replace(/_/g, " ");
}

function getMaturityData(maturityId: string) {
  return NII_MATURITY_LEVELS.find((m) => m.id === maturityId);
}

function getArchetypeData(archetypeId: string) {
  return NII_ARCHETYPES.find((a) => a.id === archetypeId);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const niiReportRouter = router({
  /**
   * Generate the full 8-section NII analysis using LLM.
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
      if (!report) throw new TRPCError({ code: "NOT_FOUND" });
      if (report.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (report.moduleType !== "NII") throw new TRPCError({ code: "BAD_REQUEST", message: "This procedure is for NII reports only" });

      // Return cached analysis if available
      if (report.llmAnalysis && typeof report.llmAnalysis === "object" && (report.llmAnalysis as any).executiveSummary) {
        return report.llmAnalysis as NiiAnalysis;
      }

      const dimScores = (report.dimensionScores ?? {}) as Record<string, number>;
      const llmMeta = (report.llmAnalysis ?? {}) as Record<string, unknown>;
      const maturityId = (llmMeta.maturityLevelId ?? report.zone) as string;
      const archetypeId = report.archetype ?? "";
      const zoneId = report.zone ?? "";

      const archetypeData = getArchetypeData(archetypeId);
      const maturityData = getMaturityData(maturityId);
      const zoneLabel = getZoneLabel(zoneId);

      // Build dimension summary for the prompt
      const dimensionSummary = NII_DIMENSIONS.map((d) => {
        const score = dimScores[d.id] ?? 50;
        const band = getDimensionBand(score);
        return `${d.name}: ${score}/100 (${band}) — ${d.definition}`;
      }).join("\n");

      const systemPrompt = `You are a senior Organizational Navigator and executive coach on the LevelNext Leadership Intelligence platform.
You are generating a comprehensive, boardroom-grade Navigation Intelligence™ (NII) report for a mid-to-senior leader.
Your analysis must be:
- Deeply personalised to this specific score profile — not generic
- Honest and direct — name the navigation gaps without softening them
- Organizationally grounded — always connect navigation to business outcomes, stakeholder trust, and career advancement
- Actionable — every insight must lead to a specific, observable action
- Written in the second person ("You have...", "Your profile shows...")
- Professional but human — not corporate jargon
Never mention "scores", "assessment", "test", or "chatbot".
Always refer to the platform as LevelNext and the coach as Navigator.
Return ONLY valid JSON matching this exact schema — no markdown, no preamble:
{
  "executiveSummary": "string (3 paragraphs separated by \\n\\n)",
  "scoreInterpretation": "string (2 paragraphs separated by \\n\\n)",
  "maturityNarrative": "string (1 paragraph on what this maturity level means for this leader)",
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
  "maturityGrowthPath": "string (1 paragraph: what growth to the next maturity level looks like)",
  "blindSpots": [
    {
      "title": "string",
      "description": "string",
      "organizationalRisk": "string",
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
  "stakeholderRecommendations": [
    {
      "stakeholderType": "string",
      "currentGap": "string",
      "strategy": "string",
      "firstStep": "string"
    }
  ],
  "coachFocusAreas": ["string", "string", "string"],
  "coachOpeningPrompt": "string",
  "coachChallengeQuestion": "string"
}`;

      const userPrompt = `Generate the full NII report for this leader:
Name: ${report.participantName}
Role: ${report.participantRole ?? "Senior Leader"}
Organisation: ${report.organisation ?? "Not specified"}
Overall NII Score: ${report.edgeScore}/100
Zone: ${zoneLabel}
Navigation Maturity Level: ${maturityData?.name ?? maturityId} (Level ${maturityData?.level ?? "?"} of 5)
Maturity Description: ${maturityData?.description ?? ""}
Archetype: ${archetypeData?.name ?? archetypeId.replace(/_/g, " ")}
Archetype Tagline: ${archetypeData?.tagline ?? ""}
Archetype Description: ${archetypeData?.description ?? ""}
Archetype Strengths: ${archetypeData?.strengths?.join(", ") ?? ""}
Archetype Risks: ${archetypeData?.risks?.join(", ") ?? ""}

Dimension Profile:
${dimensionSummary}

For the dimensionAnalysis array, include all 10 dimensions in this exact order:
1. org_awareness
2. stakeholder_nav
3. relationship_capital
4. political_nav
5. decision_pathway
6. enterprise_alignment
7. coalition_building
8. reputation_credibility
9. timing_judgment
10. ethical_nav

For blindSpots, identify 2–3 blind spots that are specifically indicated by the pattern of high and low dimension scores — not generic ones. Focus especially on the interaction between political navigation, stakeholder navigation, and coalition building.

For the 90-day actionPlan, create 6 items: Week 1–2, Week 3–4, Week 5–6, Week 7–8, Week 9–10, Week 11–12. Prioritise the lowest-scoring dimensions first.

For stakeholderRecommendations, provide 3 recommendations targeting the most critical stakeholder relationships this leader needs to develop based on their dimension profile.

For coachFocusAreas, identify the 3 most important areas for the Navigator coach to focus on in coaching conversations based on this profile.`;

      let analysis: NiiAnalysis;
      try {
        const llmResult = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: "claude-sonnet-4-5",
        });
        const raw = (llmResult as any)?.content ?? (llmResult as any)?.choices?.[0]?.message?.content ?? "{}";
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        analysis = JSON.parse(cleaned) as NiiAnalysis;
      } catch (err) {
        console.error("[NII Report] LLM error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate NII analysis" });
      }

      // Cache the analysis in the report
      await db
        .update(reports)
        .set({ llmAnalysis: analysis as any })
        .where(eq(reports.id, input.reportId));

      return analysis;
    }),

  /**
   * Get the cached NII analysis for a report (fast path — no LLM call).
   */
  getAnalysis: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select({ llmAnalysis: reports.llmAnalysis, userId: reports.userId, moduleType: reports.moduleType })
        .from(reports)
        .where(eq(reports.id, input.reportId))
        .limit(1);

      const report = result[0];
      if (!report || report.userId !== ctx.user.id || report.moduleType !== "NII") return null;

      if (report.llmAnalysis && typeof report.llmAnalysis === "object" && (report.llmAnalysis as any).executiveSummary) {
        return report.llmAnalysis as NiiAnalysis;
      }
      return null;
    }),
});
