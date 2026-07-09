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
