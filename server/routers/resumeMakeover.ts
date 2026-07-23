/**
 * resumeMakeover.ts
 * Career Intelligence — Resume Makeover feature.
 * Handles: upload + text extraction, ATS scoring, LLM quality analysis,
 * AI rewrite (HTML preview + DOCX download), and version history.
 */
import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { userResumes, users } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { invokeLLM } from "../_core/llm";

// ─── Text extraction helpers ──────────────────────────────────────────────────

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  return result.text ?? "";
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mammoth = require("mammoth") as {
    extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>;
  };
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") return extractTextFromPdf(buffer);
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) return extractTextFromDocx(buffer);
  // Fallback: treat as plain text
  return buffer.toString("utf-8");
}

// ─── ATS Scoring (deterministic rule-based) ───────────────────────────────────

interface AtsCheck {
  score: number;
  max: number;
  passed: boolean;
  note: string;
}

function scoreAts(
  text: string,
  targetJd?: string
): { total: number; breakdown: Record<string, AtsCheck> } {
  const lower = text.toLowerCase();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const breakdown: Record<string, AtsCheck> = {};

  // 1. Standard section headings (20 pts)
  const requiredSections = ["experience", "education", "skills"];
  const foundSections = requiredSections.filter((s) => lower.includes(s));
  const hasSummary = lower.includes("summary") || lower.includes("profile") || lower.includes("objective");
  const sectionScore = Math.round((foundSections.length / requiredSections.length) * 15) + (hasSummary ? 5 : 0);
  breakdown["sections"] = {
    score: sectionScore, max: 20, passed: sectionScore >= 15,
    note: foundSections.length === 3 && hasSummary
      ? "All standard sections found."
      : `Missing: ${[...requiredSections.filter((s) => !foundSections.includes(s)), ...(hasSummary ? [] : ["summary/profile"])].join(", ")}.`,
  };

  // 2. No complex formatting (15 pts) — heuristic: tables/columns show as irregular whitespace
  const hasIrregularSpacing = (text.match(/\t{2,}/g) ?? []).length > 5;
  const hasBoxChars = /[\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B\u2510\u2514\u2534\u252C\u251C\u2500\u253C\u255E\u255F\u255A\u2554\u2569\u2566\u2560\u2550\u256C\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256B\u256A\u2518\u250C]/.test(text);
  const formattingPassed = !hasIrregularSpacing && !hasBoxChars;
  breakdown["formatting"] = {
    score: formattingPassed ? 15 : 5, max: 15, passed: formattingPassed,
    note: formattingPassed
      ? "No complex formatting detected."
      : "Possible tables or columns detected — ATS parsers may misread these.",
  };

  // 3. Keyword density (20 pts)
  let keywordScore = 10; // base
  if (targetJd) {
    // Job-specific: count JD keywords found in resume
    const jdWords = targetJd.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? [];
    const uniqueJdWords = Array.from(new Set(jdWords)).filter((w) => !STOP_WORDS.has(w));
    const matched = uniqueJdWords.filter((w) => lower.includes(w));
    const ratio = uniqueJdWords.length > 0 ? matched.length / Math.min(uniqueJdWords.length, 30) : 0;
    keywordScore = Math.round(ratio * 20);
    breakdown["keywords"] = {
      score: keywordScore, max: 20, passed: keywordScore >= 12,
      note: `${matched.length} of ${Math.min(uniqueJdWords.length, 30)} key JD terms found in resume.`,
    };
  } else {
    // Generic: check for common professional keywords
    const genericKeywords = ["managed", "led", "developed", "implemented", "achieved", "delivered",
      "collaborated", "designed", "built", "improved", "increased", "reduced", "launched", "created"];
    const found = genericKeywords.filter((k) => lower.includes(k));
    keywordScore = Math.min(20, found.length * 2);
    breakdown["keywords"] = {
      score: keywordScore, max: 20, passed: keywordScore >= 10,
      note: `${found.length} of ${genericKeywords.length} common action keywords found.`,
    };
  }

  // 4. Bullet points in experience (10 pts)
  const bulletLines = lines.filter((l) => /^[•\-\*▪▸►→]/.test(l));
  const bulletPassed = bulletLines.length >= 5;
  breakdown["bullets"] = {
    score: bulletPassed ? 10 : bulletLines.length >= 2 ? 5 : 0, max: 10, passed: bulletPassed,
    note: bulletPassed
      ? `${bulletLines.length} bullet points found.`
      : `Only ${bulletLines.length} bullet points found — use bullets in experience sections.`,
  };

  // 5. Consistent date formats (10 pts)
  const datePatterns = [
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}\b/gi,
    /\b\d{1,2}\/\d{4}\b/g,
    /\b(20|19)\d{2}\s*[-–]\s*(20|19)\d{2}\b/g,
    /\b(20|19)\d{2}\s*[-–]\s*present\b/gi,
  ];
  const dateMatches = datePatterns.flatMap((p) => text.match(p) ?? []);
  const datePassed = dateMatches.length >= 2;
  breakdown["dates"] = {
    score: datePassed ? 10 : 5, max: 10, passed: datePassed,
    note: datePassed
      ? `${dateMatches.length} date entries found.`
      : "Few or no date entries detected — ensure employment dates are clearly formatted.",
  };

  // 6. Text extractable (10 pts) — if we got here, text was extracted
  breakdown["extractable"] = {
    score: 10, max: 10, passed: true,
    note: "Resume text was successfully extracted.",
  };

  // 7. Length (5 pts)
  const wordCount = (text.match(/\b\w+\b/g) ?? []).length;
  const lengthOk = wordCount >= 200 && wordCount <= 1200;
  breakdown["length"] = {
    score: lengthOk ? 5 : 2, max: 5, passed: lengthOk,
    note: lengthOk
      ? `${wordCount} words — appropriate length.`
      : wordCount < 200
        ? `Only ${wordCount} words — resume may be too short.`
        : `${wordCount} words — resume may be too long (aim for 1–3 pages).`,
  };

  // 8. Contact info (5 pts)
  const hasEmail = /@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s\-().]{7,}\d)/.test(text);
  const contactScore = (hasEmail ? 3 : 0) + (hasPhone ? 2 : 0);
  breakdown["contact"] = {
    score: contactScore, max: 5, passed: contactScore >= 3,
    note: hasEmail && hasPhone
      ? "Email and phone found."
      : `Missing: ${[...(!hasEmail ? ["email"] : []), ...(!hasPhone ? ["phone"] : [])].join(", ")}.`,
  };

  // 9. No special chars in headers (5 pts)
  const headerLines = lines.filter((l) => l.length < 40 && /^[A-Z]/.test(l));
  const badHeaders = headerLines.filter((l) => /[^\w\s&/\-]/.test(l));
  const specialCharPassed = badHeaders.length === 0;
  breakdown["special_chars"] = {
    score: specialCharPassed ? 5 : 2, max: 5, passed: specialCharPassed,
    note: specialCharPassed
      ? "No problematic special characters in headings."
      : `${badHeaders.length} heading(s) contain special characters that may confuse ATS parsers.`,
  };

  const total = Object.values(breakdown).reduce((sum, c) => sum + c.score, 0);
  return { total, breakdown };
}

const STOP_WORDS = new Set([
  "that", "this", "with", "from", "have", "will", "your", "they", "been",
  "were", "their", "what", "when", "which", "about", "into", "more", "also",
  "than", "then", "some", "such", "each", "most", "over", "after", "before",
  "between", "through", "during", "other", "would", "could", "should",
]);

// ─── LLM Quality Analysis ─────────────────────────────────────────────────────

async function analyseQuality(resumeText: string, userName: string) {
  const prompt = `You are an elite executive resume coach. Analyse this resume and return a JSON object.

RESUME:
${resumeText.slice(0, 6000)}

Return ONLY valid JSON with this exact structure:
{
  "headline": "One sentence summary of the resume's overall quality",
  "topStrengths": ["strength 1", "strength 2", "strength 3"],
  "topImprovements": ["improvement 1", "improvement 2", "improvement 3"],
  "dimensions": [
    {
      "id": "impact_language",
      "label": "Impact Language",
      "score": <0-20>,
      "max": 20,
      "callouts": [
        { "quote": "<exact quote from resume>", "suggestion": "<improved version>" }
      ]
    },
    {
      "id": "quantification",
      "label": "Quantification of Achievements",
      "score": <0-20>,
      "max": 20,
      "callouts": [
        { "quote": "<exact quote>", "suggestion": "<improved version with numbers>" }
      ]
    },
    {
      "id": "narrative_coherence",
      "label": "Career Narrative Coherence",
      "score": <0-20>,
      "max": 20,
      "callouts": [
        { "quote": "<exact quote>", "suggestion": "<improved version>" }
      ]
    },
    {
      "id": "seniority_signalling",
      "label": "Seniority Signalling",
      "score": <0-20>,
      "max": 20,
      "callouts": [
        { "quote": "<exact quote>", "suggestion": "<improved version>" }
      ]
    },
    {
      "id": "differentiation",
      "label": "Differentiation & Memorability",
      "score": <0-20>,
      "max": 20,
      "callouts": [
        { "quote": "<exact quote>", "suggestion": "<improved version>" }
      ]
    }
  ]
}

Each dimension: provide 2 callouts with exact quotes from the resume and specific rewrites.
Be honest and direct. Score strictly — a score of 15+ means genuinely strong.`;

  const result = await invokeLLM({
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 2000,
    responseFormat: { type: "json_object" },
  });

  const text = typeof result === "string" ? result
    : (result as any)?.choices?.[0]?.message?.content
    ?? (result as any)?.content?.[0]?.text ?? "";

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ─── AI Rewrite ───────────────────────────────────────────────────────────────

async function rewriteResume(
  resumeText: string,
  atsBreakdown: Record<string, AtsCheck>,
  qualityBreakdown: any,
  targetJd?: string
): Promise<{ html: string; plainText: string }> {
  const atsIssues = Object.entries(atsBreakdown)
    .filter(([, v]) => !v.passed)
    .map(([k, v]) => `- ${k}: ${v.note}`)
    .join("\n");

  const qualityIssues = qualityBreakdown?.dimensions
    ?.filter((d: any) => d.score < 14)
    .map((d: any) => `- ${d.label} (${d.score}/20): ${d.callouts?.[0]?.suggestion ?? "improve this dimension"}`)
    .join("\n") ?? "";

  const jdSection = targetJd
    ? `\nTARGET JOB DESCRIPTION:\n${targetJd.slice(0, 2000)}\n`
    : "";

  const prompt = `You are an expert resume writer. Rewrite the resume below to:
1. Fix all ATS issues listed
2. Improve all quality dimensions listed
3. Preserve ALL factual information (companies, dates, roles, education) exactly${targetJd ? "\n4. Optimise keyword density for the target job description" : ""}

ATS ISSUES TO FIX:
${atsIssues || "None — ATS score is already good."}

QUALITY IMPROVEMENTS NEEDED:
${qualityIssues || "None — quality is already strong."}
${jdSection}
ORIGINAL RESUME:
${resumeText.slice(0, 5000)}

Return the rewritten resume as clean HTML using only these tags: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>.
Use <h1> for the person's name, <h2> for section headings, <ul><li> for bullet points.
Do NOT include <html>, <head>, <body>, or <style> tags.
Start directly with <h1>Name</h1>.`;

  const result = await invokeLLM({
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
    maxTokens: 3000,
  });

  const html = typeof result === "string" ? result
    : (result as any)?.choices?.[0]?.message?.content
    ?? (result as any)?.content?.[0]?.text ?? "";

  // Strip any markdown code fences if the model wrapped it
  const cleanHtml = html.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

  // Plain text version (strip HTML tags)
  const plainText = cleanHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return { html: cleanHtml, plainText };
}

// ─── DOCX Generation ──────────────────────────────────────────────────────────

async function generateDocx(html: string): Promise<Buffer> {
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, UnderlineType,
  } = await import("docx");

  // Parse HTML into docx paragraphs (simple parser)
  const paragraphs: InstanceType<typeof Paragraph>[] = [];
  const tagRe = /<(\/?)(\w+)([^>]*)>([^<]*)/g;
  let match: RegExpExecArray | null;
  let inList = false;

  // Simple line-by-line HTML parser
  const lines = html
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[123]>/gi, "\n")
    .split("\n");

  for (const rawLine of lines) {
    const line = rawLine.replace(/<[^>]+>/g, "").trim();
    if (!line) continue;

    const isH1 = /<h1/i.test(rawLine);
    const isH2 = /<h2/i.test(rawLine);
    const isH3 = /<h3/i.test(rawLine);
    const isLi = /<li/i.test(rawLine);
    const isBold = /<strong/i.test(rawLine);

    if (isH1) {
      paragraphs.push(new Paragraph({
        text: line,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }));
    } else if (isH2) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, bold: true, underline: { type: UnderlineType.SINGLE } })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
      }));
    } else if (isH3) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, bold: true })],
        heading: HeadingLevel.HEADING_3,
      }));
    } else if (isLi) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line })],
        bullet: { level: 0 },
      }));
    } else {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, bold: isBold })],
        spacing: { after: 60 },
      }));
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  return Packer.toBuffer(doc);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const resumeMakeoverRouter = router({

  /** Upload a resume (base64), extract text, save to DB */
  uploadResume: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      mimeType: z.string(),
      base64Data: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const buffer = Buffer.from(input.base64Data, "base64");
      const text = await extractText(buffer, input.mimeType);

      if (!text || text.trim().length < 50) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not extract text from this file. Please ensure it is a text-based PDF or DOCX (not a scanned image).",
        });
      }

      // Deactivate previous active resume
      await db
        .update(userResumes)
        .set({ isActive: false })
        .where(and(eq(userResumes.userId, ctx.user.id), eq(userResumes.isActive, true)));

      // Get next version number
      const existing = await db
        .select({ version: userResumes.version })
        .from(userResumes)
        .where(eq(userResumes.userId, ctx.user.id))
        .orderBy(desc(userResumes.version))
        .limit(1);
      const nextVersion = (existing[0]?.version ?? 0) + 1;

      // Upload to S3
      const fileKey = `resumes/${ctx.user.id}/v${nextVersion}-${Date.now()}-${input.fileName}`;
      const { key, url } = await storagePut(fileKey, buffer, input.mimeType);

      // Insert new resume record
      const [inserted] = await db.insert(userResumes).values({
        userId: ctx.user.id,
        version: nextVersion,
        isActive: true,
        originalFileName: input.fileName,
        originalFileUrl: url,
        originalFileKey: key,
        extractedText: text.slice(0, 60000), // cap at 60k chars
      }).$returningId();

      return { id: inserted.id, version: nextVersion, extractedLength: text.length };
    }),

  /** Run ATS + quality analysis on an uploaded resume */
  analyseResume: protectedProcedure
    .input(z.object({
      resumeId: z.number(),
      targetJobDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [resume] = await db
        .select()
        .from(userResumes)
        .where(and(eq(userResumes.id, input.resumeId), eq(userResumes.userId, ctx.user.id)));
      if (!resume) throw new TRPCError({ code: "NOT_FOUND" });
      if (!resume.extractedText) throw new TRPCError({ code: "BAD_REQUEST", message: "No extracted text found." });

      const userRows = await db.select({ name: users.name }).from(users).where(eq(users.id, ctx.user.id));
      const userName = userRows[0]?.name ?? "the candidate";

      // ATS score
      const { total: atsScore, breakdown: atsBreakdown } = scoreAts(
        resume.extractedText,
        input.targetJobDescription
      );

      // LLM quality analysis
      const qualityResult = await analyseQuality(resume.extractedText, userName);
      const careerQualityScore = qualityResult?.dimensions
        ? qualityResult.dimensions.reduce((sum: number, d: any) => sum + (d.score ?? 0), 0)
        : null;

      await db.update(userResumes).set({
        atsScore,
        atsBreakdown: atsBreakdown as any,
        careerQualityScore,
        qualityBreakdown: qualityResult as any,
        targetJobDescription: input.targetJobDescription ?? null,
      }).where(eq(userResumes.id, input.resumeId));

      return { atsScore, atsBreakdown, careerQualityScore, qualityBreakdown: qualityResult };
    }),

  /** AI rewrite: generate HTML preview + DOCX, save to DB */
  rewriteResume: protectedProcedure
    .input(z.object({
      resumeId: z.number(),
      targetJobDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [resume] = await db
        .select()
        .from(userResumes)
        .where(and(eq(userResumes.id, input.resumeId), eq(userResumes.userId, ctx.user.id)));
      if (!resume) throw new TRPCError({ code: "NOT_FOUND" });
      if (!resume.extractedText) throw new TRPCError({ code: "BAD_REQUEST", message: "No extracted text." });

      const atsBreakdown = (resume.atsBreakdown ?? {}) as Record<string, AtsCheck>;
      const qualityBreakdown = resume.qualityBreakdown as any;

      // Generate rewrite
      const jd = input.targetJobDescription ?? resume.targetJobDescription ?? undefined;
      const { html, plainText } = await rewriteResume(resume.extractedText, atsBreakdown, qualityBreakdown, jd);

      // Generate DOCX
      const docxBuffer = await generateDocx(html);
      const docxKey = `resumes/${ctx.user.id}/rewritten-v${resume.version}-${Date.now()}.docx`;
      const { key: docxFileKey, url: docxUrl } = await storagePut(
        docxKey, docxBuffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );

      await db.update(userResumes).set({
        rewrittenText: plainText,
        rewrittenHtml: html,
        rewrittenFileUrl: docxUrl,
        rewrittenFileKey: docxFileKey,
        rewrittenAt: new Date(),
        ...(jd ? { targetJobDescription: jd } : {}),
      }).where(eq(userResumes.id, input.resumeId));

      return { html, docxUrl };
    }),

  /** Get all resume versions for the current user */
  getMyResumes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select({
        id: userResumes.id,
        version: userResumes.version,
        isActive: userResumes.isActive,
        originalFileName: userResumes.originalFileName,
        atsScore: userResumes.atsScore,
        careerQualityScore: userResumes.careerQualityScore,
        rewrittenAt: userResumes.rewrittenAt,
        createdAt: userResumes.createdAt,
      })
      .from(userResumes)
      .where(eq(userResumes.userId, ctx.user.id))
      .orderBy(desc(userResumes.version));
  }),

  /** Get full resume detail by ID */
  getResumeById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [resume] = await db
        .select()
        .from(userResumes)
        .where(and(eq(userResumes.id, input.id), eq(userResumes.userId, ctx.user.id)));
      if (!resume) throw new TRPCError({ code: "NOT_FOUND" });
      return resume;
    }),

  /** Get the current user's active resume (for Guide integration) */
  getActiveResume: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [resume] = await db
      .select()
      .from(userResumes)
      .where(and(eq(userResumes.userId, ctx.user.id), eq(userResumes.isActive, true)))
      .limit(1);
    return resume ?? null;
  }),

  /** Set a specific version as active */
  setActiveResume: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(userResumes).set({ isActive: false }).where(eq(userResumes.userId, ctx.user.id));
      await db.update(userResumes).set({ isActive: true }).where(
        and(eq(userResumes.id, input.id), eq(userResumes.userId, ctx.user.id))
      );
      return { ok: true };
    }),
});
