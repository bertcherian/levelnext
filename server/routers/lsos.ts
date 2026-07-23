import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, successPartnerProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  reports,
  commitments,
  practiceSessions,
  guideConversations,
  lsosMissions,
  lsosDailyBriefs,
  momentumPartnerCalls as successPartnerCalls,
  spAssignments,
} from "../../drizzle/schema";
import { desc, eq, and, gte, count } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ─── Leadership Health Score calculation ─────────────────────────────────────
// 5 dimensions, each 0–20, total 0–100
function calculateLHS(data: {
  diagnosticScore: number | null;       // MEI / Edge score from latest report
  practiceActivity: number;             // practice sessions in last 30 days
  guideEngagement: number;              // guide conversations in last 30 days
  commitmentReliability: number;        // % of commitments completed (0–100)
  callEngagement: number;               // calls completed vs scheduled (0–100)
}): { total: number; breakdown: Record<string, number> } {
  // Diagnostic Foundation (0–20): based on MEI score
  const diagnosticFoundation = data.diagnosticScore != null
    ? Math.round((data.diagnosticScore / 100) * 20)
    : 0;

  // Practice Momentum (0–20): 4+ sessions = 20, 3 = 15, 2 = 10, 1 = 5, 0 = 0
  const practiceMomentum = Math.min(20, data.practiceActivity * 5);

  // Guide Engagement (0–20): 4+ conversations = 20, linear below
  const guideEngagementScore = Math.min(20, data.guideEngagement * 5);

  // Commitment Reliability (0–20): % of commitments kept
  const commitmentScore = Math.round((data.commitmentReliability / 100) * 20);

  // Call Engagement (0–20): % of calls completed
  const callScore = Math.round((data.callEngagement / 100) * 20);

  const total = diagnosticFoundation + practiceMomentum + guideEngagementScore + commitmentScore + callScore;

  return {
    total,
    breakdown: {
      diagnosticFoundation,
      practiceMomentum,
      guideEngagement: guideEngagementScore,
      commitmentReliability: commitmentScore,
      callEngagement: callScore,
    },
  };
}

function getLHSZone(score: number): { zone: string; color: string; description: string } {
  if (score >= 80) return { zone: "Exceptional", color: "#22c55e", description: "Highly engaged, consistent, and growing" };
  if (score >= 65) return { zone: "Strong", color: "#84cc16", description: "Solid momentum with minor gaps" };
  if (score >= 50) return { zone: "Developing", color: "#f59e0b", description: "Progressing but needs consistent support" };
  if (score >= 35) return { zone: "At Risk", color: "#f97316", description: "Inconsistent engagement, needs intervention" };
  return { zone: "Critical", color: "#ef4444", description: "Disengaged — urgent action required" };
}

/**
 * Get the list of user IDs assigned to a given SP.
 * Admins see ALL non-admin users (no assignment filter).
 */
async function getAssignedUserIds(
  db: Awaited<ReturnType<typeof import("../db").getDb>>,
  spId: number,
  role: string
): Promise<number[]> {
  if (!db) return [];

  if (role === "admin") {
    // Admins see all non-admin users
    const allUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "user"));
    return allUsers.map((u) => u.id);
  }

  // SPs only see their assigned cohort
  const assigned = await db
    .select({ managedUserId: spAssignments.managedUserId })
    .from(spAssignments)
    .where(eq(spAssignments.spUserId, spId));
  return assigned.map((a) => a.managedUserId);
}

export const lsosRouter = router({
  // ── Full workspace data: missions + brief + cohort health ─────────────────
  getWorkspaceData: successPartnerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const spId = ctx.user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const today = now.toISOString().slice(0, 10);

    // Get assigned user IDs (scoped to SP's cohort)
    const assignedIds = await getAssignedUserIds(db, spId, ctx.user.role);

    // Fetch assigned managers
    const managers = assignedIds.length === 0
      ? []
      : await db
          .select({ id: users.id, name: users.name, email: users.email, lastSignedIn: users.lastSignedIn, createdAt: users.createdAt })
          .from(users)
          .where(eq(users.role, "user"))
          .orderBy(desc(users.lastSignedIn))
          .then((all) => all.filter((u) => assignedIds.includes(u.id)));

    // Build LHS for each manager
    const managerHealth = await Promise.all(
      managers.map(async (m) => {
        const [latestReport] = await db
          .select({ edgeScore: reports.edgeScore, moduleType: reports.moduleType, archetype: reports.archetype, zone: reports.zone })
          .from(reports)
          .where(eq(reports.userId, m.id))
          .orderBy(desc(reports.createdAt))
          .limit(1);

        const [practiceCount] = await db
          .select({ count: count() })
          .from(practiceSessions)
          .where(and(eq(practiceSessions.userId, m.id), gte(practiceSessions.createdAt, thirtyDaysAgo)));

        const [guideCount] = await db
          .select({ count: count() })
          .from(guideConversations)
          .where(and(eq(guideConversations.userId, m.id), gte(guideConversations.createdAt, thirtyDaysAgo)));

        const allCommitments = await db
          .select({ status: commitments.status })
          .from(commitments)
          .where(eq(commitments.userId, m.id));

        const completedCommitments = allCommitments.filter((c) => c.status === "completed").length;
        const commitmentReliability = allCommitments.length > 0
          ? Math.round((completedCommitments / allCommitments.length) * 100)
          : 50;

        const allCalls = await db
          .select({ status: successPartnerCalls.status })
          .from(successPartnerCalls)
          .where(eq(successPartnerCalls.userId, m.id));

        const completedCalls = allCalls.filter((c) => c.status === "completed").length;
        const callEngagement = allCalls.length > 0
          ? Math.round((completedCalls / allCalls.length) * 100)
          : 50;

        const lhs = calculateLHS({
          diagnosticScore: latestReport?.edgeScore ?? null,
          practiceActivity: practiceCount.count,
          guideEngagement: guideCount.count,
          commitmentReliability,
          callEngagement,
        });

        const zone = getLHSZone(lhs.total);

        const [activeCommitment] = await db
          .select({ text: commitments.text, dueDate: commitments.dueDate })
          .from(commitments)
          .where(and(eq(commitments.userId, m.id), eq(commitments.status, "pending")))
          .orderBy(desc(commitments.createdAt))
          .limit(1);

        const daysSinceActive = m.lastSignedIn
          ? Math.floor((now.getTime() - m.lastSignedIn.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        return {
          manager: m,
          lhs: { ...lhs, ...zone },
          latestReport: latestReport ?? null,
          activeCommitment: activeCommitment ?? null,
          activityLast30Days: { practiceSessions: practiceCount.count, guideConversations: guideCount.count },
          daysSinceActive,
        };
      })
    );

    // Today's pending missions
    const pendingMissions = await db
      .select()
      .from(lsosMissions)
      .where(and(eq(lsosMissions.spId, spId), eq(lsosMissions.status, "pending")))
      .orderBy(desc(lsosMissions.priorityScore))
      .limit(10);

    // Today's brief (if exists)
    const [todayBrief] = await db
      .select()
      .from(lsosDailyBriefs)
      .where(and(eq(lsosDailyBriefs.spId, spId), eq(lsosDailyBriefs.briefDate, today)))
      .limit(1);

    // Cohort summary
    const totalManagers = managerHealth.length;
    const avgLHS = totalManagers > 0
      ? Math.round(managerHealth.reduce((sum, m) => sum + m.lhs.total, 0) / totalManagers)
      : 0;
    const atRisk = managerHealth.filter((m) => m.lhs.total < 50).length;
    const exceptional = managerHealth.filter((m) => m.lhs.total >= 80).length;

    return {
      managerHealth,
      pendingMissions,
      todayBrief: todayBrief ?? null,
      cohortSummary: { totalManagers, avgLHS, atRisk, exceptional },
    };
  }),

  // ── Generate Today's Missions for the SP ─────────────────────────────────
  generateMissions: successPartnerProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const spId = ctx.user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get assigned user IDs (scoped to SP's cohort)
    const assignedIds = await getAssignedUserIds(db, spId, ctx.user.role);

    if (assignedIds.length === 0) return { missions: [], count: 0 };

    // Get assigned managers
    const allUsers = await db
      .select({ id: users.id, name: users.name, email: users.email, lastSignedIn: users.lastSignedIn })
      .from(users)
      .where(eq(users.role, "user"));
    const managers = allUsers.filter((u) => assignedIds.includes(u.id));

    if (managers.length === 0) return { missions: [], count: 0 };

    // Build context for each manager
    const managerContexts = await Promise.all(
      managers.map(async (m) => {
        const [latestReport] = await db
          .select({ edgeScore: reports.edgeScore, archetype: reports.archetype, zone: reports.zone, moduleType: reports.moduleType })
          .from(reports).where(eq(reports.userId, m.id)).orderBy(desc(reports.createdAt)).limit(1);

        const [practiceCount] = await db
          .select({ count: count() }).from(practiceSessions)
          .where(and(eq(practiceSessions.userId, m.id), gte(practiceSessions.createdAt, thirtyDaysAgo)));

        const [guideCount] = await db
          .select({ count: count() }).from(guideConversations)
          .where(and(eq(guideConversations.userId, m.id), gte(guideConversations.createdAt, thirtyDaysAgo)));

        const [activeCommitment] = await db
          .select({ text: commitments.text, dueDate: commitments.dueDate, createdAt: commitments.createdAt })
          .from(commitments)
          .where(and(eq(commitments.userId, m.id), eq(commitments.status, "pending")))
          .orderBy(desc(commitments.createdAt)).limit(1);

        const [lastCall] = await db
          .select({ status: successPartnerCalls.status, calledAt: successPartnerCalls.calledAt, scheduledAt: successPartnerCalls.scheduledAt })
          .from(successPartnerCalls).where(eq(successPartnerCalls.userId, m.id))
          .orderBy(desc(successPartnerCalls.scheduledAt)).limit(1);

        const daysSinceActive = m.lastSignedIn
          ? Math.floor((now.getTime() - m.lastSignedIn.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        return {
          id: m.id,
          name: m.name ?? "Unknown",
          edgeScore: latestReport?.edgeScore ?? null,
          archetype: latestReport?.archetype ?? null,
          zone: latestReport?.zone ?? null,
          moduleType: latestReport?.moduleType ?? null,
          practiceCount: practiceCount.count,
          guideCount: guideCount.count,
          activeCommitment: activeCommitment ?? null,
          lastCallStatus: lastCall?.status ?? null,
          daysSinceActive,
        };
      })
    );

    // Build AI prompt
    const managerSummary = managerContexts.map((m) =>
      `- ${m.name} (ID:${m.id}): Edge ${m.edgeScore ?? "no diagnostic"}, ${m.archetype ?? "no archetype"} (${m.zone ?? "no zone"}), ` +
      `${m.practiceCount} practice sessions, ${m.guideCount} guide conversations in last 30 days, ` +
      `commitment: "${m.activeCommitment?.text ?? "none"}", last call: ${m.lastCallStatus ?? "none"}, ` +
      `days since active: ${m.daysSinceActive}`
    ).join("\n");

    const prompt = `You are the LSOS (Leadership Success Operating System) AI for a Success Partner managing ${managers.length} leaders.

Today is ${now.toDateString()}.

Here is the current state of each leader in the cohort:
${managerSummary}

Generate the top 5 most important missions for the Success Partner today. Each mission should be a specific action with a specific leader.

For each mission, return a JSON object with:
- managerId: number (the leader's ID from the list above)
- managerName: string
- objective: string (what the SP should do — specific and actionable, e.g. "Call Priya to check on her delegation commitment")
- whySelected: string (1-2 sentences explaining why this leader needs attention today)
- expectedImpact: string (what will change if this mission is completed)
- effort: "low" | "medium" | "high"
- urgency: "low" | "medium" | "high" | "critical"
- recommendedConversation: string (the exact opening line or question to use)
- likelihoodOfSuccess: number (0–100)
- riskIfIgnored: string (what happens if the SP skips this today)
- channel: "call" | "whatsapp" | "email" | "voice_note" | "in_person"
- priorityScore: number (0–100, higher = more urgent)
- missionType: "quick_win" | "recovery" | "celebration" | "stretch" | "re_engagement" | "escalation"

Prioritise: leaders who are disengaged (days since active > 7), leaders with overdue commitments, leaders who just completed a diagnostic (celebrate + deepen), leaders at risk of dropping out.

Return a JSON array of exactly 5 mission objects. No preamble, no explanation, just the JSON array.`;

    const result = await invokeLLM({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2000,
    });

    const raw = result.choices[0]?.message?.content ?? "[]";
    const content = typeof raw === "string" ? raw : "[]";

    let missions: Array<{
      managerId: number; managerName: string; objective: string; whySelected: string;
      expectedImpact: string; effort: "low" | "medium" | "high"; urgency: "low" | "medium" | "high" | "critical";
      recommendedConversation: string; likelihoodOfSuccess: number; riskIfIgnored: string;
      channel: "call" | "whatsapp" | "email" | "voice_note" | "in_person";
      priorityScore: number; missionType: "quick_win" | "recovery" | "celebration" | "stretch" | "re_engagement" | "escalation";
    }> = [];

    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) missions = JSON.parse(jsonMatch[0]);
    } catch {
      missions = [];
    }

    // Insert missions into DB
    if (missions.length > 0) {
      await db.insert(lsosMissions).values(
        missions.map((m) => ({
          spId,
          managerId: m.managerId,
          objective: m.objective,
          whySelected: m.whySelected,
          expectedImpact: m.expectedImpact,
          effort: m.effort,
          urgency: m.urgency,
          recommendedConversation: m.recommendedConversation ?? null,
          likelihoodOfSuccess: m.likelihoodOfSuccess ?? null,
          riskIfIgnored: m.riskIfIgnored ?? null,
          channel: m.channel,
          priorityScore: m.priorityScore,
          missionType: m.missionType,
          status: "pending" as const,
        }))
      );
    }

    return { missions, count: missions.length };
  }),

  // ── Generate Daily Brief ──────────────────────────────────────────────────
  generateDailyBrief: successPartnerProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const spId = ctx.user.id;
    const today = new Date().toISOString().slice(0, 10);

    // Get assigned user IDs (scoped to SP's cohort)
    const assignedIds = await getAssignedUserIds(db, spId, ctx.user.role);

    const allUsers = await db
      .select({ id: users.id, name: users.name, lastSignedIn: users.lastSignedIn })
      .from(users).where(eq(users.role, "user"));
    const managers = allUsers.filter((u) => assignedIds.includes(u.id));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const managerData = await Promise.all(
      managers.map(async (m) => {
        const [latestReport] = await db
          .select({ edgeScore: reports.edgeScore, archetype: reports.archetype, zone: reports.zone })
          .from(reports).where(eq(reports.userId, m.id)).orderBy(desc(reports.createdAt)).limit(1);

        const [practiceCount] = await db
          .select({ count: count() }).from(practiceSessions)
          .where(and(eq(practiceSessions.userId, m.id), gte(practiceSessions.createdAt, thirtyDaysAgo)));

        const [activeCommitment] = await db
          .select({ text: commitments.text })
          .from(commitments)
          .where(and(eq(commitments.userId, m.id), eq(commitments.status, "pending")))
          .limit(1);

        const daysSinceActive = m.lastSignedIn
          ? Math.floor((Date.now() - m.lastSignedIn.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        return {
          id: m.id,
          name: m.name ?? "Unknown",
          edgeScore: latestReport?.edgeScore ?? null,
          archetype: latestReport?.archetype ?? null,
          zone: latestReport?.zone ?? null,
          practiceCount: practiceCount.count,
          activeCommitment: activeCommitment?.text ?? null,
          daysSinceActive,
        };
      })
    );

    const prompt = `You are the LSOS AI. Today is ${today}. Generate a concise daily brief for a Success Partner managing ${managers.length} leaders.

Leader data:
${managerData.map((m) => `- ${m.name}: Edge ${m.edgeScore ?? "none"}, ${m.archetype ?? "no archetype"}, ${m.practiceCount} practice sessions, ${m.daysSinceActive} days since active, commitment: "${m.activeCommitment ?? "none"}"`).join("\n")}

Return a JSON object with:
- narrative: string (3–4 sentence cohort narrative — what's the overall energy today, who's moving, who needs attention)
- celebrations: array of { managerId, managerName, reason } (leaders who deserve recognition today — recent completions, milestones, improvements)
- risks: array of { managerId, managerName, risk, severity: "low"|"medium"|"high" } (leaders who need urgent attention)

Return only the JSON object, no preamble.`;

    const result = await invokeLLM({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1000,
    });

    const raw = result.choices[0]?.message?.content ?? "{}";
    const content = typeof raw === "string" ? raw : "{}";

    let briefData: { narrative: string; celebrations: Array<{ managerId: number; managerName: string; reason: string }>; risks: Array<{ managerId: number; managerName: string; risk: string; severity: "low" | "medium" | "high" }> } = {
      narrative: "Your cohort is active and progressing.",
      celebrations: [],
      risks: [],
    };

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) briefData = JSON.parse(jsonMatch[0]);
    } catch { /* use defaults */ }

    // Upsert daily brief
    await db.insert(lsosDailyBriefs).values({
      spId,
      briefDate: today,
      narrative: briefData.narrative,
      celebrationsJson: briefData.celebrations,
      risksJson: briefData.risks,
    });

    return briefData;
  }),

  // ── Complete a mission ────────────────────────────────────────────────────
  completeMission: successPartnerProcedure
    .input(z.object({ missionId: z.number(), status: z.enum(["completed", "skipped", "snoozed"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(lsosMissions)
        .set({ status: input.status, completedAt: new Date() })
        .where(eq(lsosMissions.id, input.missionId));
      return { success: true };
    }),

  // ── Get Leadership Health Score for a single manager ─────────────────────
  getManagerLHS: successPartnerProcedure
    .input(z.object({ managerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [latestReport] = await db
        .select({ edgeScore: reports.edgeScore })
        .from(reports).where(eq(reports.userId, input.managerId))
        .orderBy(desc(reports.createdAt)).limit(1);

      const [practiceCount] = await db
        .select({ count: count() }).from(practiceSessions)
        .where(and(eq(practiceSessions.userId, input.managerId), gte(practiceSessions.createdAt, thirtyDaysAgo)));

      const [guideCount] = await db
        .select({ count: count() }).from(guideConversations)
        .where(and(eq(guideConversations.userId, input.managerId), gte(guideConversations.createdAt, thirtyDaysAgo)));

      const allCommitments = await db
        .select({ status: commitments.status }).from(commitments).where(eq(commitments.userId, input.managerId));
      const completedCommitments = allCommitments.filter((c) => c.status === "completed").length;
      const commitmentReliability = allCommitments.length > 0
        ? Math.round((completedCommitments / allCommitments.length) * 100) : 50;

      const allCalls = await db
        .select({ status: successPartnerCalls.status }).from(successPartnerCalls).where(eq(successPartnerCalls.userId, input.managerId));
      const completedCalls = allCalls.filter((c) => c.status === "completed").length;
      const callEngagement = allCalls.length > 0 ? Math.round((completedCalls / allCalls.length) * 100) : 50;

      const lhs = calculateLHS({
        diagnosticScore: latestReport?.edgeScore ?? null,
        practiceActivity: practiceCount.count,
        guideEngagement: guideCount.count,
        commitmentReliability,
        callEngagement,
      });

      return { ...lhs, ...getLHSZone(lhs.total) };
    }),
});
