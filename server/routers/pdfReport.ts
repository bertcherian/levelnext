import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reports } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";

// Brand constants
const NAVY = "#12345A";
const YELLOW = "#F2B705";
const IVORY = "#FAFAF7";
const CHARCOAL = "#2D3748";

// Module metadata
const MODULE_META: Record<string, { label: string; tagline: string; dimensionLabel: string }> = {
  ECI: {
    label: "Executive Communication",
    tagline: "Leadership Intelligence Diagnostic",
    dimensionLabel: "Pillar Breakdown",
  },
  LII: {
    label: "Leadership Influence",
    tagline: "Leadership Intelligence Diagnostic",
    dimensionLabel: "Influence Dimension Breakdown",
  },
  GCC: {
    label: "GCC Readiness",
    tagline: "Leadership Intelligence Diagnostic",
    dimensionLabel: "Readiness Dimension Breakdown",
  },
};

// Dimension labels per module
const DIMENSION_LABELS: Record<string, Record<string, string>> = {
  ECI: {
    strategic_communication: "Strategic Communication",
    executive_presence: "Executive Presence",
    influence_stakeholder: "Influence & Stakeholder",
    narrative_visibility: "Narrative & Visibility",
    conversational_leadership: "Conversational Leadership",
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
};

// Zone colours
const ZONE_COLORS: Record<string, string> = {
  // ECI
  emerging_voice: "#EF4444",
  developing_communicator: "#F97316",
  capable_communicator: "#EAB308",
  executive_communicator: "#22C55E",
  elite_communicator: "#10B981",
  // LII
  atRisk: "#EF4444",
  developing: "#F97316",
  good: "#EAB308",
  excellent: "#22C55E",
  // GCC
  critical: "#EF4444",
  emerging: "#F59E0B",
  capable: "#3B82F6",
  strategic: "#22C55E",
};

function getZoneColor(zone: string): string {
  return ZONE_COLORS[zone] ?? "#22C55E";
}

function buildDimensionBars(
  dimensionScores: Record<string, number>,
  moduleType: string
): string {
  const labels = DIMENSION_LABELS[moduleType] ?? {};
  const entries = Object.entries(dimensionScores)
    .filter(([k]) => labels[k])
    .sort(([, a], [, b]) => b - a);

  if (entries.length === 0) return "";

  // For LII, convert 1-5 scale to 0-100
  const normalize = (score: number) =>
    moduleType === "LII" ? Math.round(((score - 1) / 4) * 100) : Math.round(score);

  return entries
    .map(([key, score]) => {
      const pct = normalize(score);
      const label = labels[key] ?? key;
      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
            <span style="font-size:12px;font-weight:500;color:${CHARCOAL};">${label}</span>
            <span style="font-size:12px;font-weight:700;color:${NAVY};">${pct}</span>
          </div>
          <div style="height:8px;background:#E2E8F0;border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${NAVY};border-radius:4px;"></div>
          </div>
        </div>`;
    })
    .join("");
}

function buildPdfHtml(report: any, llmNarrative: string): string {
  const moduleType = report.moduleType as string;
  const meta = MODULE_META[moduleType] ?? MODULE_META.ECI;
  const zoneColor = getZoneColor(report.zone ?? "");
  const dimScores = (report.dimensionScores ?? {}) as Record<string, number>;
  const dimensionBars = buildDimensionBars(dimScores, moduleType);
  const completedDate = new Date(report.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background:${IVORY}; color:${CHARCOAL}; }
  .page { width:794px; min-height:1123px; margin:0 auto; background:white; }

  /* Cover */
  .cover { background:${NAVY}; padding:60px 56px 48px; min-height:320px; position:relative; }
  .cover-logo { font-size:26px; font-weight:800; color:white; letter-spacing:-0.5px; margin-bottom:4px; }
  .cover-tagline { font-size:11px; color:${YELLOW}; letter-spacing:2px; text-transform:uppercase; margin-bottom:48px; }
  .cover-module { font-size:13px; font-weight:600; color:${YELLOW}; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:12px; }
  .cover-title { font-size:32px; font-weight:800; color:white; line-height:1.2; margin-bottom:8px; }
  .cover-subtitle { font-size:14px; color:rgba(255,255,255,0.65); }
  .cover-meta { margin-top:40px; display:flex; gap:40px; }
  .cover-meta-item label { font-size:10px; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:3px; }
  .cover-meta-item span { font-size:13px; color:white; font-weight:500; }

  /* Body sections */
  .section { padding:40px 56px; border-bottom:1px solid #EDF2F7; }
  .section:last-child { border-bottom:none; }
  .section-label { font-size:10px; font-weight:700; color:${YELLOW}; letter-spacing:2px; text-transform:uppercase; margin-bottom:16px; }
  .section-title { font-size:20px; font-weight:700; color:${NAVY}; margin-bottom:8px; }

  /* Edge score */
  .edge-hero { display:flex; align-items:center; gap:40px; margin-bottom:0; }
  .edge-circle { width:100px; height:100px; border-radius:50%; border:4px solid ${YELLOW}; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; }
  .edge-number { font-size:36px; font-weight:800; color:${NAVY}; line-height:1; }
  .edge-label { font-size:10px; color:#718096; margin-top:2px; }
  .zone-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; font-size:11px; font-weight:700; margin-bottom:10px; }
  .zone-dot { width:7px; height:7px; border-radius:50%; }
  .archetype-name { font-size:22px; font-weight:700; color:${NAVY}; margin-bottom:6px; }
  .archetype-desc { font-size:13px; line-height:1.65; color:${CHARCOAL}; }

  /* Two-col */
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:20px; }
  .col-card { background:${IVORY}; border-radius:10px; padding:20px; }
  .col-card h4 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:12px; }
  .col-card ul { list-style:none; }
  .col-card ul li { font-size:12px; line-height:1.6; color:${CHARCOAL}; padding-left:14px; position:relative; margin-bottom:6px; }
  .col-card ul li::before { content:""; position:absolute; left:0; top:7px; width:5px; height:5px; border-radius:50%; }

  /* Narrative */
  .narrative { font-size:13px; line-height:1.8; color:${CHARCOAL}; }
  .narrative p { margin-bottom:14px; }

  /* Footer */
  .footer { background:${NAVY}; padding:20px 56px; display:flex; align-items:center; justify-content:space-between; }
  .footer-brand { font-size:12px; font-weight:700; color:white; }
  .footer-copy { font-size:10px; color:rgba(255,255,255,0.5); }
  .footer-contact { font-size:10px; color:${YELLOW}; }
</style>
</head>
<body>
<div class="page">

  <!-- Cover -->
  <div class="cover">
    <div class="cover-logo">LevelNext</div>
    <div class="cover-tagline">The Leadership Intelligence Platform</div>
    <div class="cover-module">${meta.label} Diagnostic</div>
    <div class="cover-title">Leadership Intelligence Report</div>
    <div class="cover-subtitle">Prepared for ${report.participantName ?? "Leader"}</div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <label>Participant</label>
        <span>${report.participantName ?? "—"}</span>
      </div>
      ${report.participantRole ? `<div class="cover-meta-item"><label>Role</label><span>${report.participantRole}</span></div>` : ""}
      <div class="cover-meta-item">
        <label>Completed</label>
        <span>${completedDate}</span>
      </div>
    </div>
  </div>

  <!-- Edge Score & Zone -->
  <div class="section">
    <div class="section-label">Your Leadership Edge</div>
    <div class="edge-hero">
      <div class="edge-circle">
        <div class="edge-number">${Math.round(report.edgeScore ?? 0)}</div>
        <div class="edge-label">Edge</div>
      </div>
      <div>
        <div class="zone-badge" style="background:${zoneColor}22;color:${zoneColor};border:1px solid ${zoneColor}44;">
          <div class="zone-dot" style="background:${zoneColor};"></div>
          ${(report.zone ?? "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
        </div>
        <div class="archetype-name">${report.archetype?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? ""}</div>
        <div class="archetype-desc">${meta.tagline} — ${moduleType} Module</div>
      </div>
    </div>
  </div>

  <!-- Dimension Breakdown -->
  ${dimensionBars ? `
  <div class="section">
    <div class="section-label">${meta.dimensionLabel}</div>
    ${dimensionBars}
  </div>` : ""}

  <!-- AI Narrative -->
  ${llmNarrative ? `
  <div class="section">
    <div class="section-label">Guide's Analysis</div>
    <div class="narrative">${llmNarrative.split("\n\n").map(p => `<p>${p}</p>`).join("")}</div>
  </div>` : ""}

  <!-- Footer -->
  <div class="footer">
    <div class="footer-brand">LevelNext — The Leadership Intelligence Platform</div>
    <div>
      <div class="footer-copy">Copyright: Meta Results Pvt. Ltd., Bangalore, India.</div>
      <div class="footer-contact">reports@metaresults.com</div>
    </div>
  </div>

</div>
</body>
</html>`;
}

export const pdfReportRouter = router({
  generate: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Fetch the report
      const result = await db
        .select()
        .from(reports)
        .where(eq(reports.id, input.reportId))
        .limit(1);
      const report = result[0];
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      if (report.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // If PDF already exists, return it
      if (report.pdfUrl) return { pdfUrl: report.pdfUrl };

      // Generate AI narrative
      const moduleType = report.moduleType as string;
      const dimScores = (report.dimensionScores ?? {}) as Record<string, number>;
      const dimLabels = DIMENSION_LABELS[moduleType] ?? {};
      const dimSummary = Object.entries(dimScores)
        .filter(([k]) => dimLabels[k])
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => {
          const pct = moduleType === "LII" ? Math.round(((v - 1) / 4) * 100) : Math.round(v);
          return `${dimLabels[k]}: ${pct}`;
        })
        .join(", ");

      let llmNarrative = "";
      try {
        const llmResult = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are Guide, an executive leadership coach on the LevelNext platform. 
Write a concise, boardroom-grade 3-paragraph coaching narrative for a leadership diagnostic report.
Use professional, direct language. Do not use bullet points. Do not mention scores numerically.
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
        llmNarrative = (llmResult as any)?.content ?? (llmResult as any)?.choices?.[0]?.message?.content ?? "";
      } catch {
        llmNarrative = "";
      }

      // Build HTML and convert to PDF via WeasyPrint
      const html = buildPdfHtml(report, llmNarrative);

      // Write HTML to temp file and convert with WeasyPrint
      const { execSync } = await import("child_process");
      const { writeFileSync, readFileSync, unlinkSync } = await import("fs");
      const tmpHtml = `/tmp/report_${report.id}_${Date.now()}.html`;
      const tmpPdf = tmpHtml.replace(".html", ".pdf");
      writeFileSync(tmpHtml, html, "utf8");

      try {
        execSync(`weasyprint "${tmpHtml}" "${tmpPdf}"`, { timeout: 30000 });
      } catch (err) {
        unlinkSync(tmpHtml);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "PDF generation failed" });
      }

      const pdfBuffer = readFileSync(tmpPdf);
      unlinkSync(tmpHtml);
      unlinkSync(tmpPdf);

      // Upload to S3
      const key = `reports/${report.slug}.pdf`;
      const { url: pdfUrl } = await storagePut(key, pdfBuffer, "application/pdf");

      // Save pdfUrl to report
      await db.update(reports).set({ pdfUrl, pdfKey: key }).where(eq(reports.id, report.id));

      return { pdfUrl };
    }),
});
