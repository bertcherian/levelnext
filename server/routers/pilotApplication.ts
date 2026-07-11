import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { pilotApplications } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";

export const pilotApplicationRouter = router({
  // Public: submit a pilot application
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name is required"),
        email: z.string().email("Valid email required"),
        phone: z.string().optional(),
        company: z.string().min(2, "Company name is required"),
        companyUrl: z.string().optional(),
        teamSize: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.insert(pilotApplications).values({
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        company: input.company,
        companyUrl: input.companyUrl || null,
        teamSize: input.teamSize ?? null,
        message: input.message ?? null,
        status: "new",
      });
      return { success: true };
    }),

  // Admin: list all applications
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db
      .select()
      .from(pilotApplications)
      .orderBy(desc(pilotApplications.createdAt));
  }),

  // Admin: update status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "booked", "declined"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db
        .update(pilotApplications)
        .set({ status: input.status })
        .where(eq(pilotApplications.id, input.id));
      return { success: true };
    }),
});
