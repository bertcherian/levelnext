import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { tenants, tenantUsers } from "../../drizzle/schema";
import { nanoid } from "nanoid";

export const tenantRouter = router({
  // Get the current user's tenant membership
  myTenant: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const membership = await db
      .select({ tenant: tenants, role: tenantUsers.role })
      .from(tenantUsers)
      .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
      .where(eq(tenantUsers.userId, ctx.user.id))
      .limit(1);
    return membership[0] ?? null;
  }),

  // Create a new organisation (tenant)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255),
        industry: z.string().optional(),
        size: z.string().optional(),
        hq: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check user doesn't already have a tenant
      const existing = await db
        .select()
        .from(tenantUsers)
        .where(eq(tenantUsers.userId, ctx.user.id))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "You are already a member of an organisation." });
      }

      // Generate unique slug and invite code
      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + nanoid(6);
      const inviteCode = nanoid(12).toUpperCase();

      const [tenant] = await db
        .insert(tenants)
        .values({ name: input.name, slug, industry: input.industry, size: input.size, hq: input.hq, inviteCode })
        .$returningId();

      await db.insert(tenantUsers).values({ tenantId: tenant.id, userId: ctx.user.id, role: "owner" });

      return { tenantId: tenant.id, slug, inviteCode };
    }),

  // Join an existing organisation via invite code
  join: protectedProcedure
    .input(z.object({ inviteCode: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check user doesn't already have a tenant
      const existing = await db
        .select()
        .from(tenantUsers)
        .where(eq(tenantUsers.userId, ctx.user.id))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "You are already a member of an organisation." });
      }

      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.inviteCode, input.inviteCode.toUpperCase()))
        .limit(1);

      if (!tenant[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invite code. Please check and try again." });
      }

      await db.insert(tenantUsers).values({ tenantId: tenant[0].id, userId: ctx.user.id, role: "member" });

      return { tenantId: tenant[0].id, name: tenant[0].name };
    }),

  // Get all members of the current user's tenant (admin/owner only)
  members: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const membership = await db
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userId, ctx.user.id))
      .limit(1);

    if (!membership[0]) return [];
    if (!["owner", "admin"].includes(membership[0].role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const { users } = await import("../../drizzle/schema");
    const members = await db
      .select({
        userId: tenantUsers.userId,
        role: tenantUsers.role,
        name: users.name,
        email: users.email,
        leadershipGraph: users.leadershipGraph,
        joinedAt: tenantUsers.createdAt,
      })
      .from(tenantUsers)
      .innerJoin(users, eq(tenantUsers.userId, users.id))
      .where(eq(tenantUsers.tenantId, membership[0].tenantId));

    return members;
  }),

  // Get invite code for current tenant (owner/admin only)
  getInviteCode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const membership = await db
      .select({ tenantId: tenantUsers.tenantId, role: tenantUsers.role })
      .from(tenantUsers)
      .where(eq(tenantUsers.userId, ctx.user.id))
      .limit(1);

    if (!membership[0] || !["owner", "admin"].includes(membership[0].role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const tenant = await db
      .select({ inviteCode: tenants.inviteCode, name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, membership[0].tenantId))
      .limit(1);

    return tenant[0] ?? null;
  }),
});
