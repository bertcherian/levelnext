import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { leadCaptures } from "../../drizzle/schema";
import { desc } from "drizzle-orm";

export const leadsRouter = router({
  // Public: capture an explicitly opted-in demo enquiry without creating a product account.
  captureDemoLead: publicProcedure
    .input(z.object({
      name: z.string().trim().min(2, "Please enter your name").max(200),
      email: z.string().trim().email("Please enter a valid work email address").max(320),
      company: z.string().trim().min(2, "Please enter your organisation").max(255),
      jobTitle: z.string().trim().max(200).optional(),
      enquiry: z.string().trim().max(2000).optional(),
      consent: z.literal(true, { error: "Please confirm that we may contact you about the demo." }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const normalizedEmail = input.email.toLowerCase();
      try {
        await db.insert(leadCaptures).values({
          email: normalizedEmail,
          name: input.name,
          company: input.company,
          jobTitle: input.jobTitle || null,
          enquiry: input.enquiry || null,
          source: "engineering_demo",
          moduleCode: "ei_demo",
          consentAt: new Date(),
          consentTextVersion: "demo_contact_v1",
          demoDedupeKey: `engineering_demo:${normalizedEmail}`,
        });
        return { success: true } as const;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("Duplicate")) return { success: true, duplicate: true } as const;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We could not save your request. Please try again." });
      }
    }),

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
