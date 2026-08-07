/**
 * ECI PDF Import Router
 *
 * Allows leaders who completed the standalone ECI diagnostic to upload their
 * existing PDF report and have it imported into LevelNext without retaking the
 * assessment.
 *
 * Flow:
 *  1. uploadEciPdf  — accepts base64-encoded PDF, extracts text via pdf-parse,
 *                     parses scores deterministically, uses LLM to normalise
 *                     any ambiguous fields, returns a structured preview.
 *  2. confirmEciImport — persists the reviewed data as a completed ECI report
 *                        with pdf_import provenance, updates Leadership Graph.
 */

import { z } from "zod";
import { nanoid } from "nanoid";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reports } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import { updateLeadershipGraph } from "./leadershipGraph";
import { eq, and } from "drizzle-orm";

// ─── Pillar / Dimension label → ID mapping ───────────────────────────────────
// These match the labels printed in the standalone PDF report (page 2).
const PDF_PILLAR_LABEL_TO_ID: Record<string, string> = {
  "strategic communication": "strategic_communication",
  "executive presence": "executive_presence",
  "influence & stakeholder alignment": "influence_stakeholder",
  "executive narrative & visibility": "narrative_visibility",
  "conversational leadership": "conversational_leadership",
};

const PDF_DIMENSION_LABEL_TO_ID: Record<string, string> = {
  "strategic clarity & brevity": "strategic_clarity",
  "executive framing & prioritisation": "executive_framing",
  "gravitas & composure": "gravitas_composure",
  "confidence & authority": "confidence_authority",
  "stakeholder influence & persuasion": "stakeholder_influence",
  "political intelligence & navigation": "political_intelligence",
  "storytelling & vision communication": "storytelling_vision",
  "executive visibility & thought leadership": "executive_visibility",
  "accountability & delegation conversations": "accountability_conversations",
  "trust creation & alignment conversations": "trust_alignment",
};

// ─── Deterministic parser ─────────────────────────────────────────────────────
function parseEciPdfText(text: string): {
  participantName: string | null;
  participantRole: string | null;
  organisation: string | null;
  reportDate: string | null;
  edgeScore: number | null;
  archetype: string | null;
  archetypeLabel: string | null;
  zone: string | null;
  pillarScores: Record<string, number>;
  dimensionScores: Record<string, number>;
  confidence: number;
} {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let participantName: string | null = null;
  let participantRole: string | null = null;
  let organisation: string | null = null;
  let reportDate: string | null = null;
  let edgeScore: number | null = null;
  let archetype: string | null = null;
  let archetypeLabel: string | null = null;
  let zone: string | null = null;
  const pillarScores: Record<string, number> = {};
  const dimensionScores: Record<string, number> = {};

  // Extract participant info from "Prepared for: Name" pattern
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Participant name
    if (line.toLowerCase().startsWith("prepared for:")) {
      participantName = line.replace(/prepared for:/i, "").trim();
    }

    // Role and organisation (next two lines after participant name)
    if (participantName && !participantRole && i > 0) {
      const prev = lines[i - 1];
      if (prev.toLowerCase().startsWith("prepared for:")) {
        participantRole = line;
        if (lines[i + 1]) organisation = lines[i + 1];
      }
    }

    // Date — match patterns like "19 June 2026" or "June 19, 2026"
    const dateMatch = line.match(/\b(\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4})\b/);
    if (dateMatch && !reportDate) reportDate = dateMatch[1];

    // Overall ECI Score — match "78" near "/ 100" or "OVERALL ECI SCORE" context
    const scoreMatch = line.match(/^(\d{1,3})\s*\/\s*100$/);
    if (scoreMatch) {
      const val = parseInt(scoreMatch[1], 10);
      if (val >= 0 && val <= 100) edgeScore = val;
    }

    // Zone label — e.g. "STRONG INFLUENCER"
    const zonePatterns = [
      "STRONG INFLUENCER", "DEVELOPING INFLUENCER", "EMERGING INFLUENCER",
      "STRATEGIC COMMUNICATOR", "EXECUTIVE READY",
    ];
    for (const z of zonePatterns) {
      if (line.toUpperCase().includes(z)) zone = z;
    }

    // Archetype — line after "COMMUNICATION ARCHETYPE" heading
    if (line.toUpperCase().includes("COMMUNICATION ARCHETYPE") && lines[i + 1]) {
      archetypeLabel = lines[i + 1].trim();
    }

    // Pillar scores — e.g. "Strategic Communication  67/100"
    const pillarMatch = line.match(/^(.+?)\s+(\d{1,3})\/100$/);
    if (pillarMatch) {
      const label = pillarMatch[1].trim().toLowerCase();
      const score = parseInt(pillarMatch[2], 10);
      const pillarId = PDF_PILLAR_LABEL_TO_ID[label];
      if (pillarId && score >= 0 && score <= 100) {
        pillarScores[pillarId] = score;
      }
    }

    // Dimension scores — e.g. "Strategic Clarity & Brevity  50"
    const dimMatch = line.match(/^(.+?)\s+(\d{1,3})$/);
    if (dimMatch) {
      const label = dimMatch[1].trim().toLowerCase();
      const score = parseInt(dimMatch[2], 10);
      const dimId = PDF_DIMENSION_LABEL_TO_ID[label];
      if (dimId && score >= 0 && score <= 100) {
        dimensionScores[dimId] = score;
      }
    }
  }

  // Derive archetype ID from label (lowercase, underscore)
  if (archetypeLabel) {
    archetype = archetypeLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  }

  // Confidence: how many of the 5 pillars + 10 dims + edgeScore were found
  const foundFields = [
    edgeScore !== null,
    archetypeLabel !== null,
    ...Object.keys(pillarScores).map(() => true),
    ...Object.keys(dimensionScores).map(() => true),
  ].filter(Boolean).length;
  const maxFields = 1 + 1 + 5 + 10; // edgeScore + archetype + 5 pillars + 10 dims
  const confidence = Math.round((foundFields / maxFields) * 100) / 100;

  return {
    participantName,
    participantRole,
    organisation,
    reportDate,
    edgeScore,
    archetype,
    archetypeLabel,
    zone,
    pillarScores,
    dimensionScores,
    confidence,
  };
}

// ─── LLM normalisation ────────────────────────────────────────────────────────
async function normaliseMissingFields(
  parsed: ReturnType<typeof parseEciPdfText>,
  rawText: string
): Promise<ReturnType<typeof parseEciPdfText>> {
  // Only call LLM if key fields are missing
  const missingCritical =
    parsed.edgeScore === null ||
    parsed.archetypeLabel === null ||
    Object.keys(parsed.pillarScores).length < 3;

  if (!missingCritical) return parsed;

  try {
    const prompt = `You are extracting structured data from an Executive Communication Intelligence (ECI) diagnostic PDF report.

The PDF text is:
---
${rawText.slice(0, 4000)}
---

Extract the following fields and return ONLY valid JSON (no markdown, no explanation):
{
  "participantName": "string or null",
  "participantRole": "string or null",
  "organisation": "string or null",
  "reportDate": "string or null",
  "edgeScore": number or null,
  "archetypeLabel": "string or null",
  "zone": "string or null",
  "pillarScores": {
    "strategic_communication": number or null,
    "executive_presence": number or null,
    "influence_stakeholder": number or null,
    "narrative_visibility": number or null,
    "conversational_leadership": number or null
  },
  "dimensionScores": {
    "strategic_clarity": number or null,
    "executive_framing": number or null,
    "gravitas_composure": number or null,
    "confidence_authority": number or null,
    "stakeholder_influence": number or null,
    "political_intelligence": number or null,
    "storytelling_vision": number or null,
    "executive_visibility": number or null,
    "accountability_conversations": number or null,
    "trust_alignment": number or null
  }
}

All scores are out of 100. Use null for any field you cannot find.`;

    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
    });

    const rawContent = response.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return parsed;

    const extracted = JSON.parse(jsonMatch[0]);

    // Merge LLM results into parsed, only filling gaps
    const merged = { ...parsed };
    if (!merged.participantName && extracted.participantName) merged.participantName = extracted.participantName;
    if (!merged.participantRole && extracted.participantRole) merged.participantRole = extracted.participantRole;
    if (!merged.organisation && extracted.organisation) merged.organisation = extracted.organisation;
    if (!merged.reportDate && extracted.reportDate) merged.reportDate = extracted.reportDate;
    if (merged.edgeScore === null && extracted.edgeScore) merged.edgeScore = extracted.edgeScore;
    if (!merged.archetypeLabel && extracted.archetypeLabel) {
      merged.archetypeLabel = extracted.archetypeLabel;
      merged.archetype = extracted.archetypeLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    }
    if (!merged.zone && extracted.zone) merged.zone = extracted.zone;

    // Merge pillar and dimension scores
    for (const [k, v] of Object.entries(extracted.pillarScores ?? {})) {
      if (!(k in merged.pillarScores) && typeof v === "number") merged.pillarScores[k] = v;
    }
    for (const [k, v] of Object.entries(extracted.dimensionScores ?? {})) {
      if (!(k in merged.dimensionScores) && typeof v === "number") merged.dimensionScores[k] = v;
    }

    // Recalculate confidence
    const foundFields = [
      merged.edgeScore !== null,
      merged.archetypeLabel !== null,
      ...Object.keys(merged.pillarScores).map(() => true),
      ...Object.keys(merged.dimensionScores).map(() => true),
    ].filter(Boolean).length;
    const maxFields = 17;
    merged.confidence = Math.round((foundFields / maxFields) * 100) / 100;

    return merged;
  } catch {
    return parsed;
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const eciImportRouter = router({
  /**
   * Step 1: Upload and extract PDF data.
   * Accepts base64-encoded PDF bytes, extracts text, parses scores,
   * optionally calls LLM for normalisation, returns structured preview.
   */
  uploadEciPdf: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string(), // base64-encoded PDF bytes
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decode base64 → Buffer
      const pdfBuffer = Buffer.from(input.fileBase64, "base64");

      // Extract text from PDF
      let rawText = "";
      try {
        const parsed = await pdfParse(pdfBuffer);
        rawText = parsed.text;
      } catch {
        throw new Error("Could not read the PDF. Please ensure it is a valid, text-based ECI report.");
      }

      if (!rawText || rawText.length < 100) {
        throw new Error("The PDF appears to be image-based or empty. Please use a text-based ECI report PDF.");
      }

      // Deterministic parse
      let extracted = parseEciPdfText(rawText);

      // LLM normalisation for missing fields
      extracted = await normaliseMissingFields(extracted, rawText);

      // Upload the original PDF to S3 for provenance
      const fileKey = `eci-imports/${ctx.user.id}-${Date.now()}.pdf`;
      const { key: sourceFileKey, url: sourceFileUrl } = await storagePut(
        fileKey,
        pdfBuffer,
        "application/pdf"
      );

      return {
        participantName: extracted.participantName ?? "",
        participantRole: extracted.participantRole ?? "",
        organisation: extracted.organisation ?? "",
        reportDate: extracted.reportDate ?? "",
        edgeScore: extracted.edgeScore ?? 0,
        archetype: extracted.archetype ?? "unknown",
        archetypeLabel: extracted.archetypeLabel ?? "",
        zone: extracted.zone ?? "",
        pillarScores: extracted.pillarScores,
        dimensionScores: extracted.dimensionScores,
        confidence: extracted.confidence,
        sourceFileKey,
        sourceFileUrl,
      };
    }),

  /**
   * Step 2: Confirm and persist the extracted data as a completed ECI report.
   * The leader reviews the extracted data and confirms before this is called.
   */
  confirmEciImport: protectedProcedure
    .input(
      z.object({
        participantName: z.string(),
        participantEmail: z.string().email(),
        participantRole: z.string().optional(),
        organisation: z.string().optional(),
        reportDate: z.string().optional(),
        edgeScore: z.number().min(0).max(100),
        archetype: z.string(),
        archetypeLabel: z.string(),
        zone: z.string().optional(),
        pillarScores: z.record(z.string(), z.number()),
        dimensionScores: z.record(z.string(), z.number()),
        confidence: z.number(),
        sourceFileKey: z.string(),
        sourceFileUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if user already has a completed ECI report
      const existing = await db
        .select({ id: reports.id })
        .from(reports)
        .where(
          and(
            eq(reports.userId, ctx.user.id),
            eq(reports.moduleType, "ECI")
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error("You already have an ECI report in LevelNext. Import is only available for new accounts.");
      }

      const slug = nanoid(16);

      // Merge pillar + dimension scores into a single dimensionScores object
      const allDimensionScores = { ...input.pillarScores, ...input.dimensionScores };

      // Insert the report with pdf_import provenance
      const [report] = await db
        .insert(reports)
        .values({
          userId: ctx.user.id,
          moduleType: "ECI",
          slug,
          participantName: input.participantName,
          participantEmail: input.participantEmail,
          participantRole: input.participantRole,
          organisation: input.organisation,
          edgeScore: input.edgeScore,
          zone: input.zone ?? "strong_influencer",
          archetype: input.archetype,
          dimensionScores: allDimensionScores,
          responses: {}, // no question-level responses for imported reports
          sourceType: "pdf_import",
          sourceFileUrl: input.sourceFileUrl,
          sourceFileKey: input.sourceFileKey,
          extractionConfidence: input.confidence,
          originalReportDate: input.reportDate,
        })
        .$returningId();

      // Build a scored object compatible with updateLeadershipGraph
      const scoredForGraph = {
        edgeScore: input.edgeScore,
        dimensionScores: allDimensionScores,
        zone: input.zone ?? "strong_influencer",
        zoneLabel: input.zone ?? "Strong Influencer",
        archetype: input.archetype,
        archetypeLabel: input.archetypeLabel,
        archetypeDescription: "",
        archetypeStrengths: [],
        archetypeRisks: [],
      };

      // Update the Leadership Graph so the platform treats this as a completed ECI
      await updateLeadershipGraph(ctx.user.id, "ECI", scoredForGraph);

      // Auto-register with Intelligence Core and execute judgment rules
      try {
        const { autoRegisterAndExecuteRules } = await import("./intelligenceCoreHelpers");
        await autoRegisterAndExecuteRules(report.id, ctx.user.id);
      } catch (err) {
        console.error("[ECI Import] Intelligence Core auto-registration failed:", err);
      }

      return {
        reportId: report.id,
        slug,
        edgeScore: input.edgeScore,
        archetype: input.archetype,
        archetypeLabel: input.archetypeLabel,
      };
    }),

  /**
   * Check whether the current user already has a completed ECI report.
   * Used by the Diagnostics page to decide whether to show the import card.
   */
  checkEciStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { hasEci: false };

    const existing = await db
      .select({ id: reports.id, sourceType: reports.sourceType })
      .from(reports)
      .where(
        and(
          eq(reports.userId, ctx.user.id),
          eq(reports.moduleType, "ECI")
        )
      )
      .limit(1);

    return {
      hasEci: existing.length > 0,
      isImported: existing[0]?.sourceType === "pdf_import",
    };
  }),
});
