import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reports } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

// Module metadata
const MODULE_META: Record<string, { label: string; dimensionLabel: string }> = {
  ECI: { label: "Executive Communication", dimensionLabel: "Pillar Breakdown" },
  TII: { label: "Leadership Time Intelligence", dimensionLabel: "Time Dimension Breakdown" },
  LII: { label: "Leadership Influence", dimensionLabel: "Influence Dimension Breakdown" },
  GCC: { label: "GCC Readiness", dimensionLabel: "Readiness Dimension Breakdown" },
  LDI: { label: "Leadership Derailment Intelligence", dimensionLabel: "Derailment Risk Dimension Breakdown" },
  STI: { label: "Strategic Thinking Intelligence", dimensionLabel: "Strategic Dimension Breakdown" },
  // Career Intelligence modules
  CPI: { label: "Career Positioning Intelligence", dimensionLabel: "Positioning Dimension Breakdown" },
  CRS: { label: "Career Resilience Intelligence", dimensionLabel: "Resilience Dimension Breakdown" },
  CMK: { label: "Career Marketability Intelligence", dimensionLabel: "Marketability Dimension Breakdown" },
  CST: { label: "Career Strategy Intelligence", dimensionLabel: "Strategy Dimension Breakdown" },
  CAO: { label: "Career Optionality Intelligence", dimensionLabel: "Optionality Dimension Breakdown" },
  AIR: { label: "AI Readiness Intelligence", dimensionLabel: "AI Readiness Dimension Breakdown" },
};

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
  TII: {
    priority_clarity: "Priority Clarity",
    focus_deep_work: "Focus & Deep Work",
    execution_discipline: "Execution Discipline",
    delegation_letting_go: "Delegation & Letting Go",
    boundary_management: "Boundary Management",
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
  // Career Intelligence dimension labels
  CPI: {
    value_proposition: "Value Proposition Clarity",
    professional_identity: "Professional Identity Strength",
    positioning_differentiation: "Positioning & Differentiation",
    narrative_coherence: "Career Narrative Coherence",
    target_market_clarity: "Target Market Clarity",
  },
  CRS: {
    adversity_response: "Adversity Response",
    adaptability: "Adaptability & Flexibility",
    emotional_regulation: "Emotional Regulation Under Pressure",
    recovery_speed: "Recovery Speed",
    future_orientation: "Future Orientation",
  },
  CMK: {
    professional_brand: "Professional Brand Strength",
    network_capital: "Network Capital",
    digital_presence: "Digital Presence & Visibility",
    thought_leadership: "Thought Leadership",
    market_intelligence: "Market Intelligence",
  },
  CST: {
    strategic_clarity: "Strategic Career Clarity",
    planning_discipline: "Planning & Execution Discipline",
    opportunity_sensing: "Opportunity Sensing",
    stakeholder_strategy: "Stakeholder Strategy",
    risk_management: "Career Risk Management",
  },
  CAO: {
    role_breadth: "Role & Function Breadth",
    industry_transferability: "Industry Transferability",
    geographic_mobility: "Geographic & Work Model Flexibility",
    financial_runway: "Financial Runway",
    portfolio_readiness: "Portfolio Career Readiness",
  },
  AIR: {
    ai_literacy: "AI Literacy & Understanding",
    ai_workflow: "AI Workflow Integration",
    ai_strategy: "AI Strategic Positioning",
    human_differentiation: "Human Differentiation",
    ai_mindset: "AI Mindset & Adaptability",
  },
};

export const pdfReportRouter = router({
  /**
   * Generate a coaching narrative for the report (server-side LLM call).
   * Returns the narrative text so the client can render the PDF.
   */
  generateNarrative: protectedProcedure
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

      const moduleType = report.moduleType as string;
      const dimScores = (report.dimensionScores ?? {}) as Record<string, number>;
      const dimLabels = DIMENSION_LABELS[moduleType] ?? {};

      const dimSummary = Object.entries(dimScores)
        .filter(([k]) => dimLabels[k])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([k, v]) => {
          const pct = moduleType === "LII" ? Math.round(((v - 1) / 4) * 100) : Math.round(v);
          return `${dimLabels[k]}: ${pct}`;
        })
        .join(", ");

      let narrative = "";
      try {
        const llmResult = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are Guide, an executive leadership coach on the LevelNext platform.
Write a concise, boardroom-grade 3-paragraph coaching narrative for a leadership diagnostic report.
Use professional, direct language. Do not use bullet points. Do not mention numbers or scores.
Focus on: (1) what the profile reveals about the leader's current strengths,
(2) the key growth opportunity this profile points to,
(3) one specific, practical action the leader can take in the next 30 days.
Never use the words "score", "assessment", "test", or "chatbot".
Always refer to the platform as LevelNext and the coach as Guide.`,
            },
            {
              role: "user",
              content: `Generate a coaching narrative for this leader:
Name: ${report.participantName}
Module: ${MODULE_META[moduleType]?.label ?? moduleType}
Archetype: ${report.archetype?.replace(/_/g, " ")}
Zone: ${report.zone?.replace(/_/g, " ")}
Dimension profile: ${dimSummary}`,
            },
          ],
        });
        narrative = (llmResult as any)?.content ?? (llmResult as any)?.choices?.[0]?.message?.content ?? "";
      } catch {
        narrative = `${report.participantName} demonstrates strong leadership communication capability across multiple dimensions. This profile reflects a leader who is operating with genuine executive presence and the ability to shape outcomes through deliberate communication. The next 30 days offer a clear opportunity to deepen influence at the senior stakeholder level by initiating one high-stakes conversation per week that requires both clarity and courage.`;
      }

      return {
        narrative,
        report: {
          id: report.id,
          participantName: report.participantName,
          participantRole: report.participantRole,
          organisation: report.organisation,
          moduleType: report.moduleType,
          edgeScore: report.edgeScore,
          zone: report.zone,
          archetype: report.archetype,
          dimensionScores: report.dimensionScores,
          createdAt: report.createdAt,
        },
      };
    }),

  /**
   * Generate LDI mitigation strategies — LLM-generated, personalised per top-3 derailment risk dimensions.
   * Returns an array of { dimension, label, strategy } objects.
   */
  getMitigationStrategies: protectedProcedure
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
      if (report.moduleType !== "LDI") throw new TRPCError({ code: "BAD_REQUEST", message: "Mitigation strategies are only available for LDI reports" });

      const dimScores = (report.dimensionScores ?? {}) as Record<string, number>;
      const ldiLabels = DIMENSION_LABELS["LDI"] ?? {};

      // Top 3 highest-risk dimensions (lowest scores)
      const top3Risk = Object.entries(dimScores)
        .filter(([k]) => ldiLabels[k])
        .sort(([, a], [, b]) => a - b)
        .slice(0, 3)
        .map(([k, v]) => ({ dimension: k, label: ldiLabels[k], score: Math.round(v) }));

      const dimList = top3Risk
        .map((d, i) => `${i + 1}. ${d.label} (score: ${d.score}/100)`)
        .join("\n");

      type MitigationItem = { dimension: string; label: string; strategy: string };
      let strategies: MitigationItem[] = [];

      try {
        const llmResult = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are Guide, an executive leadership coach on the LevelNext platform.
You specialise in leadership derailment prevention and senior leader development.
Your tone is direct, practical, and boardroom-grade — never generic or motivational-poster-style.
Never use the words "score", "assessment", "test", or "chatbot".
Always refer to the platform as LevelNext and the coach as Guide.`,
            },
            {
              role: "user",
              content: `Generate personalised mitigation strategies for ${report.participantName ?? "this leader"} based on their top 3 Leadership Derailment Intelligence risk dimensions.

Leader profile:
- Name: ${report.participantName ?? "Leader"}
- Role: ${report.participantRole ?? "Senior Leader"}
- Derailment Archetype: ${report.archetype?.replace(/_/g, " ") ?? "Unknown"}
- Risk Band: ${report.zone?.replace(/_/g, " ") ?? "Unknown"}

Top 3 highest-risk dimensions:
${dimList}

For each dimension, provide a concise, specific, and actionable mitigation strategy (2-3 sentences max).
The strategy must be personalised to this leader's archetype and risk band — not generic advice.
Focus on what the leader can start doing differently in the next 30-60 days.

Respond ONLY with a valid JSON array in this exact format (no markdown, no explanation):
[
  { "dimension": "<dimension_id>", "label": "<human label>", "strategy": "<2-3 sentence strategy>" },
  ...
]`,
            },
          ],
        });

        const raw = (llmResult as any)?.content ?? (llmResult as any)?.choices?.[0]?.message?.content ?? "[]";
        // Strip markdown code fences if present
        const cleaned = raw.replace(/^```[\w]*\n?/m, "").replace(/```$/m, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          strategies = parsed.slice(0, 3).map((item: any, i: number) => ({
            dimension: item.dimension ?? top3Risk[i]?.dimension ?? "",
            label: item.label ?? top3Risk[i]?.label ?? "",
            strategy: item.strategy ?? "",
          }));
        }
      } catch {
        // Fallback: return dimension labels with a generic placeholder
        strategies = top3Risk.map((d) => ({
          dimension: d.dimension,
          label: d.label,
          strategy: `Focus on building intentional awareness around ${d.label.toLowerCase()} through weekly reflection and feedback from a trusted peer or coach. Identify one specific situation in the next 30 days where this dimension is most likely to derail you, and prepare a deliberate response in advance.`,
        }));
      }

      return { strategies };
    }),

  /**
   * Legacy generate endpoint — kept for backward compatibility.
   * Now just calls generateNarrative and returns a placeholder URL.
   */
  generate: protectedProcedure
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

      // Return existing PDF URL if already generated
      if (report.pdfUrl) return { pdfUrl: report.pdfUrl };

      // Signal to client to use client-side PDF generation
      return { pdfUrl: null, useClientPdf: true, reportId: report.id };
    }),
});
