import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { launchApplications } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const APP_STATUS = ["wishlist", "applied", "phone_screen", "interview", "offer", "rejected", "withdrawn"] as const;

export const launchApplicationsRouter = router({
  // Get all applications for the user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    return db
      .select()
      .from(launchApplications)
      .where(eq(launchApplications.userId, ctx.user.id))
      .orderBy(desc(launchApplications.updatedAt));
  }),

  // Create a new application
  create: protectedProcedure
    .input(
      z.object({
        companyName: z.string().min(1).max(200),
        roleName: z.string().min(1).max(200),
        jobUrl: z.string().url().optional().or(z.literal("")),
        location: z.string().max(150).optional(),
        salaryRange: z.string().max(100).optional(),
        status: z.enum(APP_STATUS).default("wishlist"),
        notes: z.string().optional(),
        excitement: z.number().int().min(1).max(5).default(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [result] = await db.insert(launchApplications).values({
        userId: ctx.user.id,
        companyName: input.companyName,
        roleName: input.roleName,
        jobUrl: input.jobUrl || null,
        location: input.location || null,
        salaryRange: input.salaryRange || null,
        status: input.status,
        notes: input.notes || null,
        excitement: input.excitement,
        appliedAt: input.status === "applied" ? new Date() : null,
      });

      return { id: (result as any).insertId };
    }),

  // Update an application
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        companyName: z.string().min(1).max(200).optional(),
        roleName: z.string().min(1).max(200).optional(),
        jobUrl: z.string().optional(),
        location: z.string().max(150).optional(),
        salaryRange: z.string().max(100).optional(),
        status: z.enum(APP_STATUS).optional(),
        notes: z.string().optional(),
        excitement: z.number().int().min(1).max(5).optional(),
        nextActionDate: z.string().optional(),
        nextActionNote: z.string().max(500).optional(),
        contactName: z.string().max(150).optional(),
        contactRole: z.string().max(150).optional(),
        contactLinkedin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const { id, nextActionDate, status, ...rest } = input;

      const updateData: Record<string, unknown> = { ...rest };
      if (status) {
        updateData.status = status;
        if (status === "applied") {
          updateData.appliedAt = new Date();
        }
      }
      if (nextActionDate) {
        updateData.nextActionDate = new Date(nextActionDate);
      }

      await db
        .update(launchApplications)
        .set(updateData)
        .where(
          and(
            eq(launchApplications.id, id),
            eq(launchApplications.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Update status only (for quick drag-and-drop)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        status: z.enum(APP_STATUS),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const updateData: Record<string, unknown> = { status: input.status };
      if (input.status === "applied") {
        updateData.appliedAt = new Date();
      }

      await db
        .update(launchApplications)
        .set(updateData)
        .where(
          and(
            eq(launchApplications.id, input.id),
            eq(launchApplications.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Delete an application
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      await db
        .delete(launchApplications)
        .where(
          and(
            eq(launchApplications.id, input.id),
            eq(launchApplications.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Get pipeline summary stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const apps = await db
      .select()
      .from(launchApplications)
      .where(eq(launchApplications.userId, ctx.user.id));

    const byStatus = APP_STATUS.reduce(
      (acc, s) => {
        acc[s] = apps.filter((a) => a.status === s).length;
        return acc;
      },
      {} as Record<string, number>
    );

    const active = apps.filter((a) => !["rejected", "withdrawn"].includes(a.status)).length;
    const offers = byStatus["offer"] ?? 0;
    const interviews = byStatus["interview"] ?? 0;
    const responseRate =
      apps.length > 0
        ? Math.round(
            (apps.filter((a) => a.status !== "wishlist" && a.status !== "applied").length /
              Math.max(apps.filter((a) => a.status !== "wishlist").length, 1)) *
              100
          )
        : 0;

    return {
      total: apps.length,
      active,
      offers,
      interviews,
      responseRate,
      byStatus,
    };
  }),
});
