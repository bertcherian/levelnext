import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, pilotApplications, platformInvites, assessmentSessions, reports, practiceSessions, playbookSessions } from "../../drizzle/schema";
import { desc, eq, gte, count, sql } from "drizzle-orm";

export const adminStatsRouter = router({
  // Returns all key platform metrics for the admin dashboard
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Users
    const [totalUsersRow] = await db.select({ count: count() }).from(users);
    const [newUsersRow] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo));

    // Pilot applications
    const [totalAppsRow] = await db.select({ count: count() }).from(pilotApplications);
    const [newAppsRow] = await db.select({ count: count() }).from(pilotApplications).where(gte(pilotApplications.createdAt, sevenDaysAgo));

    // Invites
    const [pendingInvitesRow] = await db.select({ count: count() }).from(platformInvites).where(eq(platformInvites.status, "pending"));
    const [acceptedInvitesRow] = await db.select({ count: count() }).from(platformInvites).where(eq(platformInvites.status, "accepted"));

    // Assessments completed
    const [completedAssessmentsRow] = await db.select({ count: count() }).from(assessmentSessions).where(eq(assessmentSessions.status, "completed"));
    const [recentAssessmentsRow] = await db.select({ count: count() }).from(assessmentSessions)
      .where(sql`${assessmentSessions.status} = 'completed' AND ${assessmentSessions.completedAt} >= ${thirtyDaysAgo}`);

    // Reports generated
    const [totalReportsRow] = await db.select({ count: count() }).from(reports);

    // Practice sessions
    const [totalPracticeRow] = await db.select({ count: count() }).from(practiceSessions);
    const [recentPracticeRow] = await db.select({ count: count() }).from(practiceSessions).where(gte(practiceSessions.createdAt, thirtyDaysAgo));

    // Assessments by module type
    const moduleBreakdown = await db
      .select({
        moduleType: assessmentSessions.moduleType,
        total: count(),
      })
      .from(assessmentSessions)
      .where(eq(assessmentSessions.status, "completed"))
      .groupBy(assessmentSessions.moduleType);

    // Recent users (last 10 sign-ups)
    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);

    // Recent pilot applications (last 5)
    const recentApplications = await db
      .select()
      .from(pilotApplications)
      .orderBy(desc(pilotApplications.createdAt))
      .limit(5);

    // Playbook sessions
    const [totalPlaybookRow] = await db.select({ count: count() }).from(playbookSessions);
    const [recentPlaybookRow] = await db.select({ count: count() }).from(playbookSessions).where(gte(playbookSessions.createdAt, thirtyDaysAgo));

    return {
      users: {
        total: totalUsersRow.count,
        newLast30Days: newUsersRow.count,
      },
      pilotApplications: {
        total: totalAppsRow.count,
        newLast7Days: newAppsRow.count,
      },
      invites: {
        pending: pendingInvitesRow.count,
        accepted: acceptedInvitesRow.count,
      },
      assessments: {
        completed: completedAssessmentsRow.count,
        completedLast30Days: recentAssessmentsRow.count,
        byModule: moduleBreakdown,
      },
      reports: {
        total: totalReportsRow.count,
      },
      practice: {
        total: totalPracticeRow.count,
        last30Days: recentPracticeRow.count,
      },
      playbook: {
        total: totalPlaybookRow.count,
        last30Days: recentPlaybookRow.count,
      },
      recentUsers,
      recentApplications,
    };
  }),

  // Returns per-user playbook usage for admin view
  getPlaybookStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Per-user session counts
    const perUser = await db
      .select({
        userId: playbookSessions.userId,
        userName: users.name,
        userEmail: users.email,
        sessionCount: count(),
      })
      .from(playbookSessions)
      .leftJoin(users, eq(playbookSessions.userId, users.id))
      .groupBy(playbookSessions.userId, users.name, users.email)
      .orderBy(desc(count()))
      .limit(20);

    // Top situation types
    const topSituations = await db
      .select({
        playbookType: playbookSessions.playbookType,
        total: count(),
      })
      .from(playbookSessions)
      .groupBy(playbookSessions.playbookType)
      .orderBy(desc(count()))
      .limit(10);

    return { perUser, topSituations };
  }),
});
