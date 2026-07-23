import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { coaches, coachAssignments, users, reports, commitments, practiceAttempts, guideSessions, leadershipMemory, momentumPartnerCalls as successPartnerCalls } from "../../drizzle/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

// Helper: assert the current user is a coach
async function assertCoach(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const [coach] = await db
    .select()
    .from(coaches)
    .where(eq(coaches.userId, userId))
    .limit(1);
  if (!coach) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required." });
  }
  return coach;
}

export const coachRouter = router({
  // ── Get the coach's own profile ────────────────────────────────────────────
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [coach] = await db
      .select()
      .from(coaches)
      .where(eq(coaches.userId, ctx.user.id))
      .limit(1);
    return coach ?? null;
  }),

  // ── Get the list of clients assigned to this coach ─────────────────────────
  getMyClients: protectedProcedure.query(async ({ ctx }) => {
    const coach = await assertCoach(ctx.user.id);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const assignments = await db
      .select({
        assignmentId: coachAssignments.id,
        assignedAt: coachAssignments.assignedAt,
        notes: coachAssignments.notes,
        clientId: users.id,
        clientName: users.name,
        clientEmail: users.email,
      })
      .from(coachAssignments)
      .innerJoin(users, eq(coachAssignments.clientUserId, users.id))
      .where(and(eq(coachAssignments.coachId, coach.id), eq(coachAssignments.isActive, true)));

    // For each client, pull their latest report and last activity
    const enriched = await Promise.all(
      assignments.map(async (a: typeof assignments[0]) => {
        const [latestReport] = await db
          .select({ moduleType: reports.moduleType, edgeScore: reports.edgeScore, archetype: reports.archetype, createdAt: reports.createdAt })
          .from(reports)
          .where(eq(reports.userId, a.clientId))
          .orderBy(desc(reports.createdAt))
          .limit(1);

      const [activeCommitment] = await db
        .select({ text: commitments.text, dueDate: commitments.dueDate })
        .from(commitments)
        .where(and(eq(commitments.userId, a.clientId), eq(commitments.status, "pending")))
        .limit(1);

        // Activity in last 14 days
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const recentPractice = await db
          .select({ id: practiceAttempts.id })
          .from(practiceAttempts)
          .where(and(eq(practiceAttempts.userId, a.clientId), gte(practiceAttempts.createdAt, fourteenDaysAgo)));

        const recentGuide = await db
          .select({ id: guideSessions.id })
          .from(guideSessions)
          .where(and(eq(guideSessions.userId, a.clientId), gte(guideSessions.createdAt, fourteenDaysAgo)));

        return {
          ...a,
          latestReport: latestReport ?? null,
          activeCommitment: activeCommitment ?? null,
          activityLast14Days: {
            practiceSessions: recentPractice.length,
            guideSessions: recentGuide.length,
          },
        };
      })
    );

    return enriched;
  }),

  // ── Get full pre-call brief for a specific client ─────────────────────────
  getClientBrief: protectedProcedure
    .input(z.object({ clientUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      const coach = await assertCoach(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify this client is actually assigned to this coach
      const [assignment] = await db
        .select()
        .from(coachAssignments)
        .where(
          and(
            eq(coachAssignments.coachId, coach.id),
            eq(coachAssignments.clientUserId, input.clientUserId),
            eq(coachAssignments.isActive, true)
          )
        )
        .limit(1);

      if (!assignment) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This client is not assigned to you." });
      }

      // Client profile
      const [client] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, input.clientUserId))
        .limit(1);

      // All reports (all modules)
      const allReports = await db
        .select({
          id: reports.id,
          moduleType: reports.moduleType,
          edgeScore: reports.edgeScore,
          archetype: reports.archetype,
          zone: reports.zone,
          dimensionScores: reports.dimensionScores,
          createdAt: reports.createdAt,
        })
        .from(reports)
        .where(eq(reports.userId, input.clientUserId))
        .orderBy(desc(reports.createdAt));

      // Active commitment
      const [activeCommitment] = await db
        .select()
        .from(commitments)
        .where(and(eq(commitments.userId, input.clientUserId), eq(commitments.status, "pending")))
        .limit(1);

      // All commitments (last 5)
      const recentCommitments = await db
        .select()
        .from(commitments)
        .where(eq(commitments.userId, input.clientUserId))
        .orderBy(desc(commitments.createdAt))
        .limit(5);

      // Activity signals — last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentPractice = await db
        .select({ id: practiceAttempts.id, difficulty: practiceAttempts.difficulty, overallScore: practiceAttempts.overallScore, createdAt: practiceAttempts.createdAt })
        .from(practiceAttempts)
        .where(and(eq(practiceAttempts.userId, input.clientUserId), gte(practiceAttempts.createdAt, thirtyDaysAgo)))
        .orderBy(desc(practiceAttempts.createdAt))
        .limit(10);

      const recentGuide = await db
        .select({ id: guideSessions.id, createdAt: guideSessions.createdAt })
        .from(guideSessions)
        .where(and(eq(guideSessions.userId, input.clientUserId), gte(guideSessions.createdAt, thirtyDaysAgo)))
        .orderBy(desc(guideSessions.createdAt))
        .limit(10);

      // Leadership Memory (AI's running context summary)
      const [memory] = await db
        .select({ aiSummary: leadershipMemory.aiSummary, updatedAt: leadershipMemory.updatedAt })
        .from(leadershipMemory)
        .where(eq(leadershipMemory.userId, input.clientUserId))
        .limit(1);

      // Last success partner call
      const [lastCall] = await db
        .select()
        .from(successPartnerCalls)
        .where(eq(successPartnerCalls.userId, input.clientUserId))
        .orderBy(desc(successPartnerCalls.createdAt))
        .limit(1);

      return {
        client,
        assignment,
        allReports,
        activeCommitment: activeCommitment ?? null,
        recentCommitments,
        activitySignals: {
          practiceSessions: recentPractice,
          guideSessions: recentGuide,
        },
        leadershipMemory: memory ?? null,
        lastMomentumCall: lastCall ?? null,
      };
    }),

  // ── Generate AI pre-call prep narrative ───────────────────────────────────
  generateCoachPrep: protectedProcedure
    .input(z.object({ clientUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const coach = await assertCoach(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify assignment
      const [assignment] = await db
        .select()
        .from(coachAssignments)
        .where(
          and(
            eq(coachAssignments.coachId, coach.id),
            eq(coachAssignments.clientUserId, input.clientUserId),
            eq(coachAssignments.isActive, true)
          )
        )
        .limit(1);
      if (!assignment) throw new TRPCError({ code: "FORBIDDEN" });

      // Gather data
      const [client] = await db.select({ name: users.name }).from(users).where(eq(users.id, input.clientUserId)).limit(1);
      const allReports = await db
        .select({ moduleType: reports.moduleType, edgeScore: reports.edgeScore, archetype: reports.archetype, zone: reports.zone, dimensionScores: reports.dimensionScores, createdAt: reports.createdAt })
        .from(reports)
        .where(eq(reports.userId, input.clientUserId))
        .orderBy(desc(reports.createdAt));
      const [activeCommitment] = await db.select().from(commitments).where(and(eq(commitments.userId, input.clientUserId), eq(commitments.status, "pending"))).limit(1);
      const [memory] = await db.select({ aiSummary: leadershipMemory.aiSummary }).from(leadershipMemory).where(eq(leadershipMemory.userId, input.clientUserId)).limit(1);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentPractice = await db.select({ difficulty: practiceAttempts.difficulty, overallScore: practiceAttempts.overallScore }).from(practiceAttempts).where(and(eq(practiceAttempts.userId, input.clientUserId), gte(practiceAttempts.createdAt, thirtyDaysAgo))).limit(5);
      const guideCount = await db.select({ id: guideSessions.id }).from(guideSessions).where(and(eq(guideSessions.userId, input.clientUserId), gte(guideSessions.createdAt, thirtyDaysAgo)));

      const reportSummary = allReports.map((r: { moduleType: string; edgeScore: number | null; archetype: string | null; zone: string | null }) => `${r.moduleType}: Edge ${r.edgeScore}, ${r.archetype} (${r.zone})`).join("\n");
      const practiceText = recentPractice.length > 0
        ? recentPractice.map((p: { difficulty: string | null; overallScore: number | null }) => `- ${p.difficulty ?? "Standard"} difficulty (score: ${p.overallScore ?? "n/a"})`).join("\n")
        : "No practice sessions in the last 30 days.";

      const prompt = `You are preparing an executive coach for a coaching call with ${client?.name ?? "their client"}.

Here is the leader's data:

DIAGNOSTIC RESULTS:
${reportSummary || "No diagnostics completed yet."}

ACTIVE COMMITMENT:
${activeCommitment?.text ?? "No active commitment set."}

LEADERSHIP MEMORY (AI's running context):
${memory?.aiSummary ?? "No memory available."}

PRACTICE SESSIONS (last 30 days):
${practiceText}

GUIDE SESSIONS (last 30 days): ${guideCount.length} sessions

Generate a concise, practical pre-call brief for the executive coach. Structure it as:

1. **LEADER SNAPSHOT** (2-3 sentences: who they are based on diagnostics, their primary archetype and what it means)
2. **SINCE LAST CALL** (what they've been working on, practice activity, Guide engagement — be specific)
3. **CURRENT FOCUS** (their active commitment and how it connects to their diagnostic profile)
4. **WATCH FOR** (2-3 specific things the coach should probe or be alert to in this session, based on the data)
5. **SUGGESTED OPENING** (one strong opening question to start the session — specific to this leader's current state)

Be direct, practical, and coach-ready. No fluff. Use the leader's name.`;

      const result = await invokeLLM({
        model: "gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 800,
      });
      const raw = result.choices[0]?.message?.content ?? "";
      const response = typeof raw === "string" ? raw : "";

      return { prep: response };
    }),
});
