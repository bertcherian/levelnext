import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  products,
  productModules,
  userProductEnrollments,
  users,
  tenantUsers,
} from "../../drizzle/schema";

// ─── Admin procedure helper ────────────────────────────────────────────────────
const adminOnlyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const productsRouter = router({
  // ── Get all active products ──────────────────────────────────────────────────
  getAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(products.sortOrder);
  }),

  // ── Get the modules for a specific product (ordered by sequence) ─────────────
  getModules: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db
        .select()
        .from(productModules)
        .where(eq(productModules.productId, input.productId))
        .orderBy(productModules.sequenceOrder);
    }),

  // ── Get the products a user is enrolled in ───────────────────────────────────
  getEnrolledProducts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const enrollments = await db
      .select({
        enrollment: userProductEnrollments,
        product: products,
      })
      .from(userProductEnrollments)
      .innerJoin(products, eq(userProductEnrollments.productId, products.id))
      .where(
        and(
          eq(userProductEnrollments.userId, ctx.user.id),
          eq(userProductEnrollments.isActive, true),
          eq(products.isActive, true)
        )
      )
      .orderBy(desc(userProductEnrollments.lastActiveAt));
    // Deduplicate by productId — keep only the first (most recent) enrollment per product
    const seen = new Set<string>();
    const unique = enrollments.filter((e) => {
      if (seen.has(e.enrollment.productId)) return false;
      seen.add(e.enrollment.productId);
      return true;
    });
    return unique;
  }),

  // ── Get the user's active product (most recently used) ──────────────────────
  getActiveProduct: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    // Find the most recently active enrollment
    const [enrollment] = await db
      .select({
        enrollment: userProductEnrollments,
        product: products,
      })
      .from(userProductEnrollments)
      .innerJoin(products, eq(userProductEnrollments.productId, products.id))
      .where(
        and(
          eq(userProductEnrollments.userId, ctx.user.id),
          eq(userProductEnrollments.isActive, true),
          eq(products.isActive, true)
        )
      )
      .orderBy(desc(userProductEnrollments.lastActiveAt))
      .limit(1);

    if (!enrollment) {
      // If no enrollment exists, auto-enroll in Leadership Intelligence (default)
      await db.insert(userProductEnrollments).values({
        userId: ctx.user.id,
        productId: "leadership_intelligence",
        isActive: true,
        lastActiveAt: new Date(),
      });
      const [liProduct] = await db
        .select()
        .from(products)
        .where(eq(products.id, "leadership_intelligence"))
        .limit(1);
      return { productId: "leadership_intelligence", product: liProduct };
    }

    return {
      productId: enrollment.enrollment.productId,
      product: enrollment.product,
    };
  }),

  // ── Switch the user's active product ────────────────────────────────────────
  switchProduct: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify the user is enrolled in the target product (admins bypass enrollment check)
      const isAdmin = ctx.user.role === "admin";
      const [enrollment] = await db
        .select()
        .from(userProductEnrollments)
        .where(
          and(
            eq(userProductEnrollments.userId, ctx.user.id),
            eq(userProductEnrollments.productId, input.productId),
            eq(userProductEnrollments.isActive, true)
          )
        )
        .limit(1);

      if (!enrollment && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not enrolled in this product.",
        });
      }

      // If admin has no enrollment, auto-enroll them so switching works seamlessly
      if (!enrollment && isAdmin) {
        await db.insert(userProductEnrollments).values({
          userId: ctx.user.id,
          productId: input.productId,
          enrolledBy: ctx.user.id,
          isActive: true,
          lastActiveAt: new Date(),
        });
      }

      // Update lastActiveAt for the target product to make it the active one
      await db
        .update(userProductEnrollments)
        .set({ lastActiveAt: new Date() })
        .where(
          and(
            eq(userProductEnrollments.userId, ctx.user.id),
            eq(userProductEnrollments.productId, input.productId)
          )
        );

      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, input.productId))
        .limit(1);

      return { success: true, product };
    }),

  // ── ADMIN: Get all user enrollments ─────────────────────────────────────────
  adminGetEnrollments: adminOnlyProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const enrollments = await db
      .select({
        enrollment: userProductEnrollments,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        },
        product: {
          id: products.id,
          name: products.name,
        },
      })
      .from(userProductEnrollments)
      .innerJoin(users, eq(userProductEnrollments.userId, users.id))
      .innerJoin(products, eq(userProductEnrollments.productId, products.id))
      .orderBy(desc(userProductEnrollments.enrolledAt));
    return enrollments;
  }),

  // ── Self-enrol + activate (used by /join?product= flow) ──────────────────────
  selfEnrollAndActivate: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, input.productId), eq(products.isActive, true)))
        .limit(1);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      const [existing] = await db
        .select()
        .from(userProductEnrollments)
        .where(and(eq(userProductEnrollments.userId, ctx.user.id), eq(userProductEnrollments.productId, input.productId)))
        .limit(1);
      if (existing) {
        await db
          .update(userProductEnrollments)
          .set({ isActive: true, lastActiveAt: new Date() })
          .where(eq(userProductEnrollments.id, existing.id));
      } else {
        await db.insert(userProductEnrollments).values({
          userId: ctx.user.id,
          productId: input.productId,
          enrolledBy: ctx.user.id,
          isActive: true,
          lastActiveAt: new Date(),
        });
      }
      return { success: true, productId: input.productId, productName: product.name };
    }),

  // ── ADMIN: Enroll a user in a product ───────────────────────────────────────────
  adminEnrollUser: adminOnlyProcedure
    .input(
      z.object({
        userId: z.number(),
        productId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if already enrolled
      const [existing] = await db
        .select()
        .from(userProductEnrollments)
        .where(
          and(
            eq(userProductEnrollments.userId, input.userId),
            eq(userProductEnrollments.productId, input.productId)
          )
        )
        .limit(1);

      if (existing) {
        // Re-activate if previously deactivated
        await db
          .update(userProductEnrollments)
          .set({ isActive: true, lastActiveAt: new Date() })
          .where(eq(userProductEnrollments.id, existing.id));
        return { success: true, action: "reactivated" };
      }

      await db.insert(userProductEnrollments).values({
        userId: input.userId,
        productId: input.productId,
        enrolledBy: ctx.user.id,
        isActive: true,
        lastActiveAt: new Date(),
      });

      return { success: true, action: "enrolled" };
    }),

  // ── ADMIN: Remove a user from a product ─────────────────────────────────────
  adminUnenrollUser: adminOnlyProcedure
    .input(
      z.object({
        userId: z.number(),
        productId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db
        .update(userProductEnrollments)
        .set({ isActive: false })
        .where(
          and(
            eq(userProductEnrollments.userId, input.userId),
            eq(userProductEnrollments.productId, input.productId)
          )
        );
      return { success: true };
    }),

  // ── ADMIN: Get all users with their enrollment status ───────────────────────
  adminGetUsersWithEnrollments: adminOnlyProcedure.input(z.object({ tenantId: z.number().int().positive().nullable().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const selectedTenantId = input?.tenantId ?? null;
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(tenantUsers, eq(users.id, tenantUsers.userId))
      .where(selectedTenantId ? eq(tenantUsers.tenantId, selectedTenantId) : undefined)
      .orderBy(desc(users.createdAt));

    const allEnrollments = await db
      .select()
      .from(userProductEnrollments)
      .where(eq(userProductEnrollments.isActive, true));

    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(products.sortOrder);

    return {
      users: allUsers.map((u: typeof allUsers[number]) => ({
        ...u,
        enrolledProducts: allEnrollments
          .filter((e: typeof allEnrollments[number]) => e.userId === u.id)
          .map((e: typeof allEnrollments[number]) => e.productId),
      })),
      products: allProducts,
    };
  }),
});
