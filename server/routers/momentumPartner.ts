import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  momentumPartnerCalls,
  commitments,
  assessmentSessions,
  reports,
  practiceSessions,
  guideConversations,
  leadershipMemory,
} from "../../drizzle/schema";
import { desc, eq, and, gte, lt, count, sql, isNull } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});

export const momentumPartnerRouter = router({
  // ── Call Queue: all users with scheduled/overdue calls ──────────────────────
  getCallQueue: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get all users who have at least one completed diagnostic
    const activeUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .where(eq(users.role, "user"))
      .orderBy(desc(users.lastSignedIn));

    if (activeUsers.length === 0) return [];

    const userIds = activeUsers.map((u) => u.id);

    // For each user, get their latest scheduled/missed call and latest commitment
    const results = await Promise.all(
      activeUsers.map(async (user) => {
        // Latest call record
        const [latestCall] = await db
          .select()
          .from(momentumPartnerCalls)
          .where(eq(momentumPartnerCalls.userId, user.id))
          .orderBy(desc(momentumPartnerCalls.scheduledAt))
          .limit(1);

        // Latest active commitment
        const [latestCommitment] = await db
          .select()
          .from(commitments)
          .where(and(eq(commitments.userId, user.id), eq(commitments.status, "pending")))
          .orderBy(desc(commitments.createdAt))
          .limit(1);

        // Completed diagnostics count
        const [diagCount] = await db
          .select({ count: count() })
          .from(assessmentSessions)
          .where(and(eq(assessmentSessions.userId, user.id), eq(assessmentSessions.status, "completed")));

        // Activity since last call (practice sessions, guide conversations)
        const activitySince = latestCall?.calledAt ?? fourteenDaysAgo;
        const [practiceCount] = await db
          .select({ count: count() })
          .from(practiceSessions)
          .where(and(eq(practiceSessions.userId, user.id), gte(practiceSessions.createdAt, activitySince)));

        const [guideCount] = await db
          .select({ count: count() })
          .from(guideConversations)
          .where(and(eq(guideConversations.userId, user.id), gte(guideConversations.createdAt, activitySince)));

        // Latest report for Edge score
        const [latestReport] = await db
          .select({ edgeScore: reports.edgeScore, moduleType: reports.moduleType, archetype: reports.archetype, zone: reports.zone })
          .from(reports)
          .where(eq(reports.userId, user.id))
          .orderBy(desc(reports.createdAt))
          .limit(1);

        // Determine next call due date
        let nextCallDue: Date;
        let callStatus: "overdue" | "due_soon" | "upcoming" | "no_call_yet";

        if (!latestCall) {
          nextCallDue = new Date(user.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
          callStatus = nextCallDue <= now ? "overdue" : "no_call_yet";
        } else if (latestCall.status === "scheduled" && latestCall.scheduledAt <= now) {
          nextCallDue = latestCall.scheduledAt;
          callStatus = "overdue";
        } else if (latestCall.status === "completed" || latestCall.status === "missed") {
          nextCallDue = new Date(latestCall.scheduledAt.getTime() + 14 * 24 * 60 * 60 * 1000);
          const daysUntil = (nextCallDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          callStatus = daysUntil <= 0 ? "overdue" : daysUntil <= 3 ? "due_soon" : "upcoming";
        } else {
          nextCallDue = latestCall.scheduledAt;
          callStatus = "upcoming";
        }

        return {
          user,
          latestCall: latestCall ?? null,
          latestCommitment: latestCommitment ?? null,
          diagnosticsCompleted: diagCount.count,
          activitySinceLastCall: {
            practiceSessions: practiceCount.count,
            guideConversations: guideCount.count,
          },
          latestReport: latestReport ?? null,
          nextCallDue,
          callStatus,
        };
      })
    );

    // Sort: overdue first, then due_soon, then upcoming, then no_call_yet
    const order = { overdue: 0, due_soon: 1, upcoming: 2, no_call_yet: 3 };
    return results.sort((a, b) => {
      const diff = order[a.callStatus] - order[b.callStatus];
      if (diff !== 0) return diff;
      return a.nextCallDue.getTime() - b.nextCallDue.getTime();
    });
  }),

  // ── Pre-call Brief: full context for a single leader ────────────────────────
  getPreCallBrief: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      // All reports (diagnostic history)
      const allReports = await db
        .select({
          moduleType: reports.moduleType,
          edgeScore: reports.edgeScore,
          zone: reports.zone,
          archetype: reports.archetype,
          createdAt: reports.createdAt,
        })
        .from(reports)
        .where(eq(reports.userId, input.userId))
        .orderBy(desc(reports.createdAt));

      // Active commitments (last 3)
      const activeCommitments = await db
        .select()
        .from(commitments)
        .where(eq(commitments.userId, input.userId))
        .orderBy(desc(commitments.createdAt))
        .limit(5);

      // Call history (last 5)
      const callHistory = await db
        .select()
        .from(momentumPartnerCalls)
        .where(eq(momentumPartnerCalls.userId, input.userId))
        .orderBy(desc(momentumPartnerCalls.scheduledAt))
        .limit(5);

      // Activity signals (last 14 days)
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const [recentPractice] = await db
        .select({ count: count() })
        .from(practiceSessions)
        .where(and(eq(practiceSessions.userId, input.userId), gte(practiceSessions.createdAt, fourteenDaysAgo)));

      const [recentGuide] = await db
        .select({ count: count() })
        .from(guideConversations)
        .where(and(eq(guideConversations.userId, input.userId), gte(guideConversations.createdAt, fourteenDaysAgo)));

      // Leadership memory / AI summary
      const [memory] = await db
        .select()
        .from(leadershipMemory)
        .where(eq(leadershipMemory.userId, input.userId))
        .limit(1);

      // Last completed call
      const lastCompletedCall = callHistory.find((c) => c.status === "completed") ?? null;

      // Current scheduled call (if any)
      const scheduledCall = callHistory.find((c) => c.status === "scheduled") ?? null;

      return {
        user,
        allReports,
        activeCommitments,
        callHistory,
        activityLast14Days: {
          practiceSessions: recentPractice.count,
          guideConversations: recentGuide.count,
        },
        leadershipMemory: memory ?? null,
        lastCompletedCall,
        scheduledCall,
      };
    }),

  // ── Generate AI opening script for a call ───────────────────────────────────
  generateOpeningScript: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        commitmentText: z.string(),
        leaderName: z.string(),
        practiceSessions: z.number(),
        guideConversations: z.number(),
        lastCallNotes: z.string().optional(),
        archetype: z.string().optional(),
        zone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const prompt = `You are helping a Momentum Partner prepare for a 10-minute accountability call with a leader.

Leader: ${input.leaderName}
Their commitment (what they said they would do): "${input.commitmentText}"
${input.archetype ? `Their leadership archetype: ${input.archetype}` : ""}
${input.zone ? `Their current leadership zone: ${input.zone}` : ""}
Activity since last call: ${input.practiceSessions} practice sessions, ${input.guideConversations} Guide conversations
${input.lastCallNotes ? `Notes from last call: ${input.lastCallNotes}` : "No previous call notes."}

Write a warm, direct 2–3 sentence opening for the Momentum Partner to use at the start of the call.
- Reference the commitment by name
- Mention the activity signals naturally (if any)
- End with one open question that invites the leader to share a specific example
- Do NOT be generic. Make it feel like the Momentum Partner already knows this person.
- Keep it under 60 words.

Return only the opening script, no labels or preamble.`;

      const result = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 150,
      });

      const raw = result.choices[0]?.message?.content ?? "";
      const script = typeof raw === "string" ? raw : "";
      return { script };
    }),

  // ── Schedule a call for a user ───────────────────────────────────────────────
  scheduleCall: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        scheduledAt: z.string(), // ISO date string
        commitmentText: z.string().optional(),
        commitmentId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(momentumPartnerCalls).values({
        userId: input.userId,
        scheduledAt: new Date(input.scheduledAt),
        commitmentText: input.commitmentText ?? null,
        commitmentId: input.commitmentId ?? null,
        status: "scheduled",
      });

      return { success: true };
    }),

  // ── Log call outcome ─────────────────────────────────────────────────────────
  logOutcome: adminProcedure
    .input(
      z.object({
        callId: z.number(),
        outcome: z.enum(["implemented", "partial", "not_implemented", "no_show"]),
        leaderConfidence: z.number().min(1).max(5).optional(),
        callNotes: z.string().optional(),
        blockerMentioned: z.string().optional(),
        escalateToCoach: z.boolean().optional(),
        suggestedOpening: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(momentumPartnerCalls)
        .set({
          outcome: input.outcome,
          leaderConfidence: input.leaderConfidence ?? null,
          callNotes: input.callNotes ?? null,
          blockerMentioned: input.blockerMentioned ?? null,
          escalateToCoach: input.escalateToCoach ?? false,
          suggestedOpening: input.suggestedOpening ?? null,
          calledAt: new Date(),
          status: "completed",
        })
        .where(eq(momentumPartnerCalls.id, input.callId));

      return { success: true };
    }),

  // ── Mark a call as missed ────────────────────────────────────────────────────
  markMissed: adminProcedure
    .input(z.object({ callId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(momentumPartnerCalls)
        .set({ status: "missed" })
        .where(eq(momentumPartnerCalls.id, input.callId));

      return { success: true };
    }),

  // ── Get escalation list (leaders who need coach attention) ───────────────────
  getEscalations: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const escalated = await db
      .select({
        call: momentumPartnerCalls,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(momentumPartnerCalls)
      .innerJoin(users, eq(momentumPartnerCalls.userId, users.id))
            .where(eq(momentumPartnerCalls.escalateToCoach, true))
      .orderBy(desc(momentumPartnerCalls.calledAt))
      .limit(50);
    return escalated;
  }),

  // ── Resolve an escalation (mark as handled by coach) ─────────────────────────────────
  resolveEscalation: adminProcedure
    .input(z.object({ callId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(momentumPartnerCalls)
        .set({ escalateToCoach: false })
        .where(eq(momentumPartnerCalls.id, input.callId));
      return { resolved: true };
    }),
});
