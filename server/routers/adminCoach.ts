import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { coaches, coachAssignments, users } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Admin-only guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});

export const adminCoachRouter = router({
  // ── List all coaches ────────────────────────────────────────────────────────
  listCoaches: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const allCoaches = await db
      .select({
        id: coaches.id,
        userId: coaches.userId,
        name: coaches.name,
        email: coaches.email,
        bio: coaches.bio,
        specialisation: coaches.specialisation,
        createdAt: coaches.createdAt,
      })
      .from(coaches)
      .orderBy(desc(coaches.createdAt));

    // For each coach, count their active clients
    const enriched = await Promise.all(
      allCoaches.map(async (c: typeof allCoaches[0]) => {
        const clientCount = await db
          .select({ id: coachAssignments.id })
          .from(coachAssignments)
          .where(and(eq(coachAssignments.coachId, c.id), eq(coachAssignments.isActive, true)));
        return { ...c, clientCount: clientCount.length };
      })
    );

    return enriched;
  }),

  // ── Create a coach (promotes an existing user to coach) ────────────────────
  createCoach: adminProcedure
    .input(z.object({
      userId: z.number(),
      name: z.string().min(1),
      email: z.string().email(),
      bio: z.string().optional(),
      specialisation: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check user exists
      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });

      // Check not already a coach
      const [existing] = await db.select().from(coaches).where(eq(coaches.userId, input.userId)).limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "This user is already a coach." });

      await db.insert(coaches).values({
        userId: input.userId,
        name: input.name,
        email: input.email,
        bio: input.bio ?? null,
        specialisation: input.specialisation ?? null,
      });

      return { success: true };
    }),

  // ── Update coach profile ────────────────────────────────────────────────────
  updateCoach: adminProcedure
    .input(z.object({
      coachId: z.number(),
      name: z.string().min(1).optional(),
      bio: z.string().optional(),
      specialisation: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updates: Record<string, string> = {};
      if (input.name) updates.name = input.name;
      if (input.bio !== undefined) updates.bio = input.bio;
      if (input.specialisation !== undefined) updates.specialisation = input.specialisation;

      await db.update(coaches).set(updates).where(eq(coaches.id, input.coachId));
      return { success: true };
    }),

  // ── List all assignments (optionally filtered by coach) ────────────────────
  listAssignments: adminProcedure
    .input(z.object({ coachId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const query = db
        .select({
          id: coachAssignments.id,
          coachId: coachAssignments.coachId,
          coachName: coaches.name,
          coachEmail: coaches.email,
          clientId: users.id,
          clientName: users.name,
          clientEmail: users.email,
          notes: coachAssignments.notes,
          assignedAt: coachAssignments.assignedAt,
          isActive: coachAssignments.isActive,
        })
        .from(coachAssignments)
        .innerJoin(coaches, eq(coachAssignments.coachId, coaches.id))
        .innerJoin(users, eq(coachAssignments.clientUserId, users.id))
        .orderBy(desc(coachAssignments.assignedAt));

      if (input.coachId) {
        return query.where(eq(coachAssignments.coachId, input.coachId));
      }
      return query;
    }),

  // ── Assign a client to a coach ─────────────────────────────────────────────
  assignClient: adminProcedure
    .input(z.object({
      coachId: z.number(),
      clientUserId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check coach exists
      const [coach] = await db.select().from(coaches).where(eq(coaches.id, input.coachId)).limit(1);
      if (!coach) throw new TRPCError({ code: "NOT_FOUND", message: "Coach not found." });

      // Check client exists
      const [client] = await db.select().from(users).where(eq(users.id, input.clientUserId)).limit(1);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found." });

      // Check not already assigned
      const [existing] = await db
        .select()
        .from(coachAssignments)
        .where(and(
          eq(coachAssignments.coachId, input.coachId),
          eq(coachAssignments.clientUserId, input.clientUserId),
          eq(coachAssignments.isActive, true)
        ))
        .limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Client already assigned to this coach." });

      await db.insert(coachAssignments).values({
        coachId: input.coachId,
        clientUserId: input.clientUserId,
        notes: input.notes ?? null,
        assignedBy: ctx.user.id,
      });

      return { success: true };
    }),

  // ── Remove an assignment ────────────────────────────────────────────────────
  removeAssignment: adminProcedure
    .input(z.object({ assignmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(coachAssignments)
        .set({ isActive: false })
        .where(eq(coachAssignments.id, input.assignmentId));

      return { success: true };
    }),

  // ── List all platform users (for assignment dropdown) ──────────────────────
  listUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .orderBy(users.name);
  }),
});
