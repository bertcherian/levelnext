/**
 * MEP Leader Documents Router
 * Handles upload, listing, and deletion of leader documents:
 * Work Goals, Individual Development Plans, Prior Assessments, Other
 */

import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { mepLeaderDocuments, tenantUsers } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { ENV } from "../_core/env";
import { invokeLLM } from "../_core/llm";

export const mepDocumentsRouter = router({
  /** Upload a new document (base64 encoded) */
  uploadDocument: protectedProcedure
    .input(z.object({
      docType: z.enum(["work_goals", "idp", "prior_assessment", "other"]),
      fileName: z.string().min(1).max(500),
      mimeType: z.string().max(100),
      fileSizeBytes: z.number().int().positive().max(20 * 1024 * 1024), // 20 MB max
      base64Data: z.string(), // base64-encoded file content
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.base64Data, "base64");
      const relKey = `mep-docs/${ctx.user.id}/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { key, url } = await storagePut(relKey, buffer, input.mimeType);

      // Get tenantId if user belongs to a tenant
      const tenantRows = await db
        .select({ tenantId: tenantUsers.tenantId })
        .from(tenantUsers)
        .where(eq(tenantUsers.userId, ctx.user.id))
        .limit(1);
      const tenantId = tenantRows[0]?.tenantId ?? null;

      const [inserted] = await db.insert(mepLeaderDocuments).values({
        userId: ctx.user.id,
        tenantId,
        docType: input.docType,
        fileName: input.fileName,
        fileUrl: url,
        fileKey: key,
        fileSizeBytes: input.fileSizeBytes,
        mimeType: input.mimeType,
        notes: input.notes ?? null,
      }).$returningId();

      return { id: inserted.id, fileUrl: url, fileName: input.fileName };
    }),

  /** List all documents for the current user */
  listDocuments: protectedProcedure
    .input(z.object({
      docType: z.enum(["work_goals", "idp", "prior_assessment", "other"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const conditions = [eq(mepLeaderDocuments.userId, ctx.user.id)];
      if (input?.docType) {
        conditions.push(eq(mepLeaderDocuments.docType, input.docType));
      }

      const docs = await db
        .select()
        .from(mepLeaderDocuments)
        .where(and(...conditions))
        .orderBy(desc(mepLeaderDocuments.uploadedAt));

      return docs;
    }),

  /** Update notes on a document */
  updateNotes: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      notes: z.string().max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [doc] = await db
        .select()
        .from(mepLeaderDocuments)
        .where(and(eq(mepLeaderDocuments.id, input.id), eq(mepLeaderDocuments.userId, ctx.user.id)));

      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(mepLeaderDocuments)
        .set({ notes: input.notes })
        .where(eq(mepLeaderDocuments.id, input.id));

      return { success: true };
    }),

  /** Extract key objectives from a Work Goals or IDP document using AI */
  extractObjectives: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [doc] = await db
        .select()
        .from(mepLeaderDocuments)
        .where(and(eq(mepLeaderDocuments.id, input.id), eq(mepLeaderDocuments.userId, ctx.user.id)));

      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      if (!doc.docType || !(["work_goals", "idp"] as string[]).includes(doc.docType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Extraction is only available for Work Goals and IDP documents." });
      }

      // Get a presigned URL for the file so the LLM can access it
      const forgeUrl = ENV.forgeApiUrl?.replace(/\/+$/, "");
      const forgeKey = ENV.forgeApiKey;
      if (!forgeUrl || !forgeKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Storage not configured" });

      // Fetch the file bytes from S3 via presigned URL and convert to base64 for LLM
      let fileContent: string;
      let mimeType = doc.mimeType ?? "application/octet-stream";
      try {
        const presignRes = await fetch(`${forgeUrl}/v1/storage/presign?path=${encodeURIComponent(doc.fileKey)}&expires=300`, {
          headers: { Authorization: `Bearer ${forgeKey}` },
        });
        const { url: presignedUrl } = await presignRes.json() as { url: string };
        const fileRes = await fetch(presignedUrl);
        const arrayBuf = await fileRes.arrayBuffer();
        fileContent = Buffer.from(arrayBuf).toString("base64");
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not retrieve document for analysis." });
      }

      const docLabel = doc.docType === "work_goals" ? "Work Goals document" : "Individual Development Plan (IDP)";
      const systemPrompt = `You are an expert leadership coach and talent development specialist. Your task is to analyse a leader's ${docLabel} and extract the key objectives, goals, and development priorities.

Return a JSON array of objectives. Each objective must have:
- "objective": a concise, action-oriented statement of the goal (max 120 chars)
- "category": one of: "performance", "development", "leadership", "business", "personal"
- "priority": one of: "high", "medium", "low" (infer from language like "critical", "must", "key", "primary" = high; "should", "aim" = medium; "nice to have", "explore" = low)

Return ONLY valid JSON array, no markdown, no explanation. Example:
[{"objective": "Lead the Q3 product launch across 3 markets", "category": "business", "priority": "high"}]`;

      let extracted: { objective: string; category: string; priority: "high" | "medium" | "low" }[] = [];
      try {
        const isPdf = mimeType === "application/pdf";
        const messages: Parameters<typeof invokeLLM>[0]["messages"] = isPdf
          ? [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: [
                  { type: "file_url" as const, file_url: { url: `data:application/pdf;base64,${fileContent}`, mime_type: "application/pdf" as const } },
                  { type: "text" as const, text: `Please extract the key objectives from this ${docLabel}.` },
                ],
              },
            ]
          : [
              { role: "system", content: systemPrompt },
              { role: "user", content: `The following is the text content of a ${docLabel}. Please extract the key objectives:\n\n${Buffer.from(fileContent, "base64").toString("utf-8").slice(0, 8000)}` },
            ];

        const llmResponse = await invokeLLM({ messages });
        const rawContent = llmResponse.choices?.[0]?.message?.content;
        const raw = typeof rawContent === "string" ? rawContent : "[]";
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        extracted = JSON.parse(cleaned);
        if (!Array.isArray(extracted)) extracted = [];
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI extraction failed. Please try again." });
      }

      // Save extracted objectives to DB
      await db
        .update(mepLeaderDocuments)
        .set({ extractedObjectives: extracted, extractedAt: new Date() })
        .where(eq(mepLeaderDocuments.id, input.id));

      return { objectives: extracted, count: extracted.length };
    }),

  /** Delete a document (removes from S3 and DB) */
  deleteDocument: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [doc] = await db
        .select()
        .from(mepLeaderDocuments)
        .where(and(eq(mepLeaderDocuments.id, input.id), eq(mepLeaderDocuments.userId, ctx.user.id)));

      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      // Delete from S3 via Forge API
      try {
        const forgeUrl = ENV.forgeApiUrl?.replace(/\/+$/, "");
        const forgeKey = ENV.forgeApiKey;
        if (forgeUrl && forgeKey && doc.fileKey) {
          await fetch(`${forgeUrl}/v1/storage/delete?path=${encodeURIComponent(doc.fileKey)}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${forgeKey}` },
          });
        }
      } catch {
        // Continue even if S3 delete fails — remove DB record regardless
      }

      await db.delete(mepLeaderDocuments).where(eq(mepLeaderDocuments.id, input.id));

      return { success: true };
    }),
});
