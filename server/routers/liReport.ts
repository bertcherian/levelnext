/**
 * liReport.ts
 * Shared Leadership Intelligence report router — handles all 7 LI modules:
 * ECI, TII, LII, GCC, LDI, STI, NII
 *
 * Generates an 8-section LLM analysis and caches it in reports.llmAnalysis.
 * Mirrors the ciReport.ts pattern exactly.
 */

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reports } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

// ─── Module Metadata ──────────────────────────────────────────────────────────

const LI_MODULE_META: Record<string, {
  label: string;
  tagline: string;
  coachLabel: string;
  dimensionLabel: string;
  scoreLabel: string;
  blindSpotLabel: string;
  stakeholderLabel: string;
}> = {
  ECI: {
    label: "Executive Communication Intelligence",
    tagline: "Your communication is your leadership brand.",
    coachLabel: "Communication Coach",
    dimensionLabel: "Communication Pillar Breakdown",
    scoreLabel: "ECI Score",
    blindSpotLabel: "Communication Blind Spots",
    stakeholderLabel: "Stakeholder Communication Strategy",
  },
  TII: {
    label: "Leadership Time Intelligence",
    tagline: "Time is the only resource you cannot recover.",
    coachLabel: "Time Intelligence Coach",
    dimensionLabel: "Time Dimension Breakdown",
    scoreLabel: "TII Score",
    blindSpotLabel: "Time Management Blind Spots",
    stakeholderLabel: "Time & Delegation Strategy",
  },
  LII: {
    label: "Leadership Influence Intelligence",
    tagline: "Influence is the currency of leadership.",
    coachLabel: "Influence Coach",
    dimensionLabel: "Influence Dimension Breakdown",
    scoreLabel: "LII Score",
    blindSpotLabel: "Influence Blind Spots",
    stakeholderLabel: "Stakeholder Influence Strategy",
  },
  GCC: {
    label: "GCC Readiness Intelligence",
    tagline: "Are you ready to lead at the global capability frontier?",
    coachLabel: "GCC Readiness Coach",
    dimensionLabel: "Readiness Module Breakdown",
    scoreLabel: "GCC Readiness Score",
    blindSpotLabel: "Readiness Gaps",
    stakeholderLabel: "Global Stakeholder Strategy",
  },
  LDI: {
    label: "Leadership Derailment Intelligence",
    tagline: "Know your risks before they know you.",
    coachLabel: "Derailment Prevention Coach",
    dimensionLabel: "Derailment Risk Breakdown",
    scoreLabel: "LDI Risk Score",
    blindSpotLabel: "Critical Derailment Risks",
    stakeholderLabel: "Relationship Risk Strategy",
  },
  STI: {
    label: "Strategic Thinking Intelligence",
    tagline: "Leaders who think strategically shape the future.",
    coachLabel: "Strategy Coach",
    dimensionLabel: "Strategic Dimension Breakdown",
    scoreLabel: "STI Score",
    blindSpotLabel: "Strategic Blind Spots",
    stakeholderLabel: "Strategic Stakeholder Alignment",
  },
  NII: {
    label: "Navigation Intelligence",
    tagline: "Navigate the organisation — or be navigated by it.",
    coachLabel: "Navigator Coach",
    dimensionLabel: "Navigation Dimension Breakdown",
    scoreLabel: "NII Score",
    blindSpotLabel: "Organisational Blind Spots",
    stakeholderLabel: "Stakeholder & Coalition Strategy",
  },
};

// ─── Dimension label maps ─────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<string, Record<string, string>> = {
  ECI: {
    strategic_communication: "Strategic Communication",
    executive_presence: "Executive Presence",
    influence_stakeholder: "Influence & Stakeholder",
    narrative_visibility: "Narrative & Visibility",
    conversational_leadership: "Conversational Leadership",
    strategic_clarity: "Strategic Clarity",
    message_architecture: "Message Architecture",
    gravitas_composure: "Gravitas & Composure",
    executive_presence_signals: "Executive Presence Signals",
    stakeholder_influence: "Stakeholder Influence",
    political_intelligence: "Political Intelligence",
    narrative_construction: "Narrative Construction",
    executive_visibility: "Executive Visibility",
    accountability_conversations: "Accountability Conversations",
    psychological_safety_creation: "Psychological Safety Creation",
  },
  TII: {
    priority_clarity: "Priority Clarity",
    focus_deep_work: "Focus & Deep Work",
    execution_discipline: "Execution Discipline",
    delegation_letting_go: "Delegation & Letting Go",
    boundary_management: "Boundary Management",
  },
  LII: {
    trust_capital: "Trust Capital",
    decision_influence: "Decision Influence",
    stakeholder_alignment: "Stakeholder Alignment",
    coalition_building: "Coalition Building",
    organizational_navigation: "Organisational Navigation",
    inspirational_leadership: "Inspirational Leadership",
    change_mobilization: "Change Mobilisation",
    conflict_resistance: "Conflict Resilience",
    adaptive_influence: "Adaptive Influence",
    leadership_reputation: "Leadership Reputation",
  },
  GCC: {
    strategic_influence: "Strategic Influence",
    operating_excellence: "Operating Excellence",
    leadership_talent: "Leadership & Talent",
    innovation_ai: "Innovation & AI",
    enterprise_alignment: "Enterprise Alignment",
  },
  LDI: {
    self_awareness: "Self-Awareness",
    emotional_regulation: "Emotional Regulation",
    humility_vs_defensiveness: "Humility vs Defensiveness",
    trust_relationship_building: "Trust & Relationship Building",
    stakeholder_management: "Stakeholder Navigation",
    strategic_thinking: "Strategic Thinking",
    decision_making_ambiguity: "Decision-Making",
    accountability_courage: "Accountability & Courage",
    delegation_team_development: "Delegation & Growth",
    executive_communication: "Executive Communication",
  },
  STI: {
    strategic_clarity: "Strategic Clarity",
    business_acumen: "Business Acumen",
    systems_thinking: "Systems Thinking",
    long_term_orientation: "Long-Term Orientation",
    market_external_awareness: "Market & External Awareness",
    insight_generation: "Insight Generation",
    strategic_prioritisation: "Strategic Prioritisation",
    scenario_thinking: "Scenario Thinking",
    innovation_opportunity: "Innovation & Opportunity",
    strategic_communication: "Strategic Communication",
  },
  NII: {
    organizational_awareness: "Organizational Awareness",
    stakeholder_navigation: "Stakeholder Navigation",
    relationship_capital: "Relationship Capital",
    political_navigation: "Political Navigation",
    decision_pathway: "Decision Pathway Intelligence",
    enterprise_alignment: "Enterprise Alignment",
    coalition_building: "Coalition Building",
    reputation_credibility: "Reputation & Credibility",
    timing_strategic_judgment: "Timing & Strategic Judgment",
    ethical_navigation: "Ethical Leadership Navigation",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDimLabel(moduleType: string, dimId: string): string {
  return DIMENSION_LABELS[moduleType]?.[dimId]
    ?? dimId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function normaliseLiiScore(raw: number): number {
  // LII uses 1–5 averages; normalise to 0–100
  return Math.round(((raw - 1) / 4) * 100);
}

function buildDimensionSummary(moduleType: string, dimScores: Record<string, number>): string {
  return Object.entries(dimScores)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => {
      const score = moduleType === "LII" ? normaliseLiiScore(v) : Math.round(v);
      const label = getDimLabel(moduleType, k);
      const band = score >= 75 ? "strength" : score >= 50 ? "developing" : "gap";
      return `${label}: ${score}/100 (${band})`;
    })
    .join("\n");
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const liReportRouter = router({
  /**
   * Fetch a report by slug (ownership-checked).
   */
  getReport: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db
        .select()
        .from(reports)
        .where(eq(reports.slug, input.slug))
        .limit(1);
      const report = result[0];
      if (!report) return null;
      if (report.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const liModules = ["ECI", "TII", "LII", "GCC", "LDI", "STI", "NII"];
      if (!liModules.includes((report.moduleType ?? "").toUpperCase())) return null;
      return report;
    }),

  /**
   * Get cached LI analysis (fast path — no LLM call).
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
      if (!report || report.userId !== ctx.user.id) return null;
      if (
        report.llmAnalysis &&
        typeof report.llmAnalysis === "object" &&
        (report.llmAnalysis as any).executiveSummary
      ) {
        return report.llmAnalysis as Record<string, unknown>;
      }
      return null;
    }),

  /**
   * Generate the full 8-section LI analysis using LLM.
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

      const liModules = ["ECI", "TII", "LII", "GCC", "LDI", "STI", "NII"];
      const moduleType = (report.moduleType ?? "").toUpperCase();
      if (!liModules.includes(moduleType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This procedure is for LI reports only" });
      }

      // Return cached analysis if available
      if (
        report.llmAnalysis &&
        typeof report.llmAnalysis === "object" &&
        (report.llmAnalysis as any).executiveSummary
      ) {
        return report.llmAnalysis as Record<string, unknown>;
      }

      const meta = LI_MODULE_META[moduleType] ?? LI_MODULE_META.ECI;
      const dimScores = (report.dimensionScores ?? {}) as Record<string, number>;
      const archetypeId = (report.archetype ?? "").replace(/_/g, " ");
      const zoneId = (report.zone ?? "").replace(/_/g, " ");
      const dimensionSummary = buildDimensionSummary(moduleType, dimScores);

      // LDI: risk-oriented framing
      const isLdi = moduleType === "LDI";
      // GCC: module-level framing
      const isGcc = moduleType === "GCC";

      const systemPrompt = `You are a senior executive coach and leadership development expert on the LevelNext Leadership Intelligence Platform.
You are generating a comprehensive, boardroom-grade ${meta.label} (${moduleType}) report for a mid-to-senior leader.

Your analysis must be:
- Deeply personalised to this specific score profile — not generic
- Honest and direct — name the gaps without softening them
- Actionable — every insight must lead to a specific, observable action
- Written in the second person ("You have...", "Your profile shows...")
- Professional but human — not corporate jargon
${isLdi ? "- Frame everything through the lens of derailment risk prevention, not deficit" : ""}
${isGcc ? "- Frame everything through the lens of GCC leadership readiness and global capability" : ""}

Never mention "scores", "assessment", "test", or "chatbot".
Always refer to the platform as LevelNext and the coach as ${meta.coachLabel}.

Return ONLY valid JSON matching this exact schema — no markdown, no preamble:
{
  "executiveSummary": "string (3 paragraphs separated by \\n\\n)",
  "scoreInterpretation": "string (2 paragraphs separated by \\n\\n)",
  "maturityNarrative": "string (1 paragraph on what this profile level means for this leader)",
  "dimensionAnalysis": [
    {
      "dimensionId": "string",
      "label": "string",
      "score": number,
      "band": "strength|developing|gap",
      "insight": "string (2-3 sentences)",
      "implication": "string (1-2 sentences: leadership impact)",
      "quickWin": "string (one specific action within 14 days)"
    }
  ],
  "archetypeNarrative": "string (2 paragraphs personalised to this person's profile)",
  "archetypeGrowthPath": "string (1 paragraph: what growth to the next level looks like)",
  "blindSpots": [
    {
      "title": "string",
      "description": "string",
      "${isLdi ? "derailmentRisk" : "careerRisk"}": "string",
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

      const userPrompt = `Generate the full ${moduleType} report for this leader:
Name: ${report.participantName}
Role: ${report.participantRole ?? "Senior Leader"}
Organisation: ${report.organisation ?? "Not specified"}
Overall ${meta.scoreLabel}: ${report.edgeScore}/100
Zone / Profile Level: ${zoneId}
Archetype: ${archetypeId}

${meta.dimensionLabel}:
${dimensionSummary}

For the dimensionAnalysis array, include ALL dimensions listed above in the same order.
For blindSpots, identify 2–3 that are specifically indicated by the pattern of high and low dimension scores — not generic ones.
For the 90-day actionPlan, create 6 items: Week 1–2, Week 3–4, Week 5–6, Week 7–8, Week 9–10, Week 11–12. Prioritise the lowest-scoring dimensions first.
For stakeholderRecommendations, provide 3 recommendations targeting the most critical stakeholder relationships based on this profile.
For coachFocusAreas, identify the 3 most important areas for the ${meta.coachLabel} to focus on.`;

      let analysis: Record<string, unknown>;
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
        analysis = JSON.parse(cleaned) as Record<string, unknown>;
      } catch (err) {
        console.error(`[LI Report] LLM error for ${moduleType}:`, err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate analysis" });
      }

      // Cache the analysis
      await db
        .update(reports)
        .set({ llmAnalysis: analysis as any })
        .where(eq(reports.id, input.reportId));

      return analysis;
    }),
});
