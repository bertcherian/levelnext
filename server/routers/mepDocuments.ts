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
