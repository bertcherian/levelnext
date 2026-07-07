import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reports, tenantUsers } from "../../drizzle/schema";

export const reportRouter = router({
  // Get a report by slug (public — shareable link)
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(reports).where(eq(reports.slug, input.slug)).limit(1);
      return result[0] ?? null;
    }),

  // Get all reports for the current user
  myReports: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(reports)
      .where(eq(reports.userId, ctx.user.id))
      .orderBy(desc(reports.createdAt));
  }),

  // Get all reports for the current tenant (admin/owner only)
  tenantReports: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const membership = await db
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userId, ctx.user.id))
      .limit(1);

    if (!membership[0] || !["owner", "admin"].includes(membership[0].role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return db
      .select()
      .from(reports)
      .where(eq(reports.tenantId, membership[0].tenantId))
      .orderBy(desc(reports.createdAt));
  }),
});
