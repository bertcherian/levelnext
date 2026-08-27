import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { leadCaptures } from "../../drizzle/schema";
import { desc } from "drizzle-orm";

export const leadsRouter = router({
  // Public: capture an email lead from the landing page
  captureEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address"),
        name: z.string().max(200).optional(),
        company: z.string().max(255).optional(),
        jobTitle: z.string().max(200).optional(),
        enquiry: z.string().max(2000).optional(),
        source: z.string().max(64).default("sample_report"),
        moduleCode: z.string().max(16).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      try {
        await db.insert(leadCaptures).values({
          email: input.email.toLowerCase().trim(),
          name: input.name?.trim() ?? null,
          company: input.company?.trim() ?? null,
          jobTitle: input.jobTitle?.trim() ?? null,
          enquiry: input.enquiry?.trim() ?? null,
          source: input.source,
          moduleCode: input.moduleCode ?? null,
        });
        return { success: true };
      } catch (err: unknown) {
        // Duplicate email is fine — return success silently
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Duplicate")) return { success: true };
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save email" });
      }
    }),

  // Admin: list all captured leads
  listLeads: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const leads = await db
      .select()
      .from(leadCaptures)
      .orderBy(desc(leadCaptures.createdAt))
      .limit(500);
    return leads;
  }),
});
