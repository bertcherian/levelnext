import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orgIntelligenceWaitlist, users } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const orgIntelligenceRouter = router({
  // ── Join Waitlist ───────────────────────────────────────────────────────────
  joinWaitlist: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        orgName: z.string().optional(),
        role: z.string().optional(),
        useCase: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Upsert: if user already registered, update their entry
      const [existing] = await db
        .select()
        .from(orgIntelligenceWaitlist)
        .where(eq(orgIntelligenceWaitlist.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db
          .update(orgIntelligenceWaitlist)
          .set({
            email: input.email,
            name: input.name,
            orgName: input.orgName ?? null,
            role: input.role ?? null,
            useCase: input.useCase ?? null,
          })
          .where(eq(orgIntelligenceWaitlist.userId, ctx.user.id));
        return { status: "updated" as const };
      }

      await db.insert(orgIntelligenceWaitlist).values({
        userId: ctx.user.id,
        email: input.email,
        name: input.name,
        orgName: input.orgName ?? null,
        role: input.role ?? null,
        useCase: input.useCase ?? null,
      });
      return { status: "joined" as const };
    }),

  // ── Get Waitlist Status ─────────────────────────────────────────────────────
  getWaitlistStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [entry] = await db
      .select()
      .from(orgIntelligenceWaitlist)
      .where(eq(orgIntelligenceWaitlist.userId, ctx.user.id))
      .limit(1);

    // Also get total waitlist count for social proof
    const [countRow] = await db
      .select({ count: orgIntelligenceWaitlist.id })
      .from(orgIntelligenceWaitlist)
      .limit(1);

    return {
      isOnWaitlist: !!entry,
      entry: entry ?? null,
    };
  }),

  // ── Admin: List Waitlist ────────────────────────────────────────────────────
  listWaitlist: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Only owner can view
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    if (user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return db
      .select()
      .from(orgIntelligenceWaitlist)
      .orderBy(orgIntelligenceWaitlist.createdAt);
  }),
});
