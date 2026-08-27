/**
 * Org Context Router
 * Allows tenant admins to set their organisation's mission, vision, north star,
 * strategic goals, and values. Includes a website scraper to auto-extract text.
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orgContext, tenantUsers } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import { buildExtractionSources, companyNameFromWebsiteMetadata, normalizeExtractedOrgContext, type ExtractedOrgContext, type ExtractionSources } from "../orgContextExtraction";
import { enrichWithOrganisationFallbacks } from "../orgContextFallback";

// ─── Helper: get tenantId for current user (must be owner or admin) ───────────
async function getTenantAdminId(user: { id: number; role: string }, requestedTenantId?: number | null): Promise<number> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  if (requestedTenantId && user.role === "admin") return requestedTenantId;

  const [membership] = await db
    .select()
    .from(tenantUsers)
    .where(requestedTenantId ? and(eq(tenantUsers.userId, user.id), eq(tenantUsers.tenantId, requestedTenantId)) : eq(tenantUsers.userId, user.id));

  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not a member of any organisation." });
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only organisation owners and admins can manage org context." });
  }

  return membership.tenantId;
}

const websiteHeaders = {
  "User-Agent": "Mozilla/5.0 (compatible; LevelNext/1.0; +https://levelnext.coach)",
  Accept: "text/html,application/xhtml+xml",
};

function plainTextFromHtml(rawHtml: string) {
  return rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 8000);
}

async function fetchWebsiteHtml(url: string) {
  const response = await fetch(url, { headers: websiteHeaders, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function analyseOrganisationPage(rawHtml: string, sourceUrl: string) {
  const plainText = plainTextFromHtml(rawHtml);
  let extracted: ExtractedOrgContext = {};
  try {
    const result = await invokeLLM({
      model: "claude-haiku-4-5",
      messages: [
        { role: "system", content: `You are an expert at extracting organisational context from company websites.
Extract the following from the provided website text and return as JSON:
- companyName: the company's name
- mission: the company's mission statement (what they do and why)
- vision: the company's vision (where they are going)
- northStar: their north star metric or primary goal
- strategicGoals: array of up to 5 strategic goals or focus areas
- values: array of up to 8 company values

Only return fields clearly supported by the website text. Return ONLY valid JSON.` },
        { role: "user", content: `Website URL: ${sourceUrl}\n\nWebsite text:\n${plainText}` },
      ],
      response_format: { type: "json_object" },
    });
    const raw = result.choices[0]?.message?.content ?? "{}";
    const json = typeof raw === "string" ? raw : (raw as any[]).map((chunk: any) => chunk.text ?? "").join("");
    extracted = normalizeExtractedOrgContext(JSON.parse(json));
  } catch {
    // Raw text and metadata still support an explicit retry and manual completion.
  }

  if (!extracted.companyName) {
    const companyName = companyNameFromWebsiteMetadata(rawHtml);
    if (companyName) extracted = { ...extracted, companyName };
  }

  return { plainText, extracted, extractionSources: buildExtractionSources(extracted, plainText, sourceUrl) };
}

export const orgContextRouter = router({
  /** Get the current org context for the user's tenant */
  getOrgContext: protectedProcedure.input(z.object({ tenantId: z.number().int().positive().nullable().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    let tenantId: number;
    try { tenantId = await getTenantAdminId(ctx.user, input?.tenantId); } catch (error) {
      if (error instanceof TRPCError && error.code === "FORBIDDEN") return null;
      throw error;
    }

    const [context] = await db
      .select()
      .from(orgContext)
      .where(eq(orgContext.tenantId, tenantId));

    return context ?? null;
  }),

  /** Save (upsert) org context */
  saveOrgContext: protectedProcedure
    .input(z.object({
      tenantId: z.number().int().positive().optional(),
      websiteUrl: z.string().url().optional().or(z.literal("")),
      companyName: z.string().max(255).optional(),
      mission: z.string().max(5000).optional(),
      vision: z.string().max(5000).optional(),
      northStar: z.string().max(5000).optional(),
      strategicGoals: z.array(z.string().max(500)).max(10).optional(),
      values: z.array(z.string().max(200)).max(15).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await getTenantAdminId(ctx.user, input.tenantId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [existing] = await db
        .select()
        .from(orgContext)
        .where(eq(orgContext.tenantId, tenantId));

      const payload = {
        tenantId,
        websiteUrl: input.websiteUrl || null,
        companyName: input.companyName || null,
        mission: input.mission || null,
        vision: input.vision || null,
        northStar: input.northStar || null,
        strategicGoals: input.strategicGoals ?? null,
        values: input.values ?? null,
        lastUpdatedBy: ctx.user.id,
      };

      if (existing) {
        await db.update(orgContext).set(payload).where(eq(orgContext.tenantId, tenantId));
      } else {
        await db.insert(orgContext).values(payload);
      }

      return { success: true };
    }),

  /** Upload company logo — accepts base64 image, stores to S3, saves URL */
  uploadLogo: protectedProcedure
    .input(z.object({
      tenantId: z.number().int().positive().optional(),
      fileName: z.string().min(1).max(500),
      mimeType: z.string().regex(/^image\//),
      base64Data: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await getTenantAdminId(ctx.user, input.tenantId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const buffer = Buffer.from(input.base64Data, "base64");
      const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const relKey = `org-logos/${tenantId}/${Date.now()}-${safeFileName}`;
      const { url } = await storagePut(relKey, buffer, input.mimeType);
      const [existing] = await db.select().from(orgContext).where(eq(orgContext.tenantId, tenantId));
      if (existing) {
        await db.update(orgContext).set({ logoUrl: url, lastUpdatedBy: ctx.user.id }).where(eq(orgContext.tenantId, tenantId));
      } else {
        await db.insert(orgContext).values({ tenantId, logoUrl: url, lastUpdatedBy: ctx.user.id });
      }
      return { logoUrl: url };
    }),

  /** Save custom leadership frameworks */
  saveLeadershipFrameworks: protectedProcedure
    .input(z.object({
      tenantId: z.number().int().positive().optional(),
      frameworks: z.array(z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(2000).optional().default(""),
        competencies: z.array(z.string().max(200)).max(20),
      })).max(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await getTenantAdminId(ctx.user, input.tenantId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [existing] = await db.select().from(orgContext).where(eq(orgContext.tenantId, tenantId));
      if (existing) {
        await db.update(orgContext).set({ leadershipFrameworks: input.frameworks, lastUpdatedBy: ctx.user.id }).where(eq(orgContext.tenantId, tenantId));
      } else {
        await db.insert(orgContext).values({ tenantId, leadershipFrameworks: input.frameworks, lastUpdatedBy: ctx.user.id });
      }
      return { success: true };
    }),

  /** Scrape a website URL and extract mission/vision/goals text using LLM */
  scrapeWebsite: protectedProcedure
    .input(z.object({ url: z.string().url(), tenantId: z.number().int().positive().optional(), preferAbout: z.boolean().optional().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await getTenantAdminId(ctx.user, input.tenantId); // verify scoped admin

      let homepageHtml = "";
      try {
        homepageHtml = await fetchWebsiteHtml(input.url);
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Could not fetch website: ${err.message ?? "Unknown error"}`,
        });
      }

      const homepage = await analyseOrganisationPage(homepageHtml, input.url);
      const fallbackResult = await enrichWithOrganisationFallbacks({
        websiteUrl: input.url,
        initial: homepage,
        forceFallback: input.preferAbout,
        analyseCandidate: async (url) => analyseOrganisationPage(await fetchWebsiteHtml(url), url),
      });
      const { extracted, extractionSources, rawScrapedText, usedAboutFallback, usedFallback, fallbackPagesTried } = fallbackResult;

      // Save raw scraped text and extracted fields to DB
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      {
        const [existing] = await db
          .select()
          .from(orgContext)
          .where(eq(orgContext.tenantId, tenantId));

        const payload = {
          tenantId,
          websiteUrl: input.url,
          rawScrapedText,
          extractionSources,
          scrapedAt: new Date(),
          lastUpdatedBy: ctx.user.id,
          ...(extracted.companyName ? { companyName: extracted.companyName } : {}),
          ...(extracted.mission ? { mission: extracted.mission } : {}),
          ...(extracted.vision ? { vision: extracted.vision } : {}),
          ...(extracted.northStar ? { northStar: extracted.northStar } : {}),
          ...(extracted.strategicGoals ? { strategicGoals: extracted.strategicGoals } : {}),
          ...(extracted.values ? { values: extracted.values } : {}),
        };

        if (existing) {
          await db.update(orgContext).set(payload).where(eq(orgContext.tenantId, tenantId));
        } else {
          await db.insert(orgContext).values(payload);
        }
      }

      return {
        success: true,
        extracted,
        extractionSources,
        rawTextLength: rawScrapedText.length,
        usedAboutFallback,
        usedFallback,
        aboutAttempted: fallbackPagesTried.some((page) => page.key === "about"),
        aboutUrl: fallbackPagesTried.find((page) => page.key === "about")?.url,
        fallbackPagesTried,
      };
    }),
});
