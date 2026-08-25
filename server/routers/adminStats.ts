import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, tenantUsers, pilotApplications, platformInvites, assessmentSessions, reports, practiceSessions, playbookSessions } from "../../drizzle/schema";
import { and, desc, eq, gte, count, sql } from "drizzle-orm";
import { z } from "zod";

export const adminStatsRouter = router({
  // Returns all key platform metrics for the admin dashboard
  getDashboardStats: protectedProcedure.input(z.object({ tenantId: z.number().int().positive().nullable().optional() }).optional()).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tenantId = input?.tenantId ?? null;

    // Users
    const [totalUsersRow] = tenantId
      ? await db.select({ count: count() }).from(tenantUsers).where(eq(tenantUsers.tenantId, tenantId))
      : await db.select({ count: count() }).from(users);
    const [newUsersRow] = tenantId
      ? await db.select({ count: count() }).from(users).innerJoin(tenantUsers, eq(users.id, tenantUsers.userId)).where(and(eq(tenantUsers.tenantId, tenantId), gte(users.createdAt, thirtyDaysAgo)))
      : await db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo));

    // Pilot applications
    const [totalAppsRow] = tenantId ? [{ count: 0 }] : await db.select({ count: count() }).from(pilotApplications);
    const [newAppsRow] = tenantId ? [{ count: 0 }] : await db.select({ count: count() }).from(pilotApplications).where(gte(pilotApplications.createdAt, sevenDaysAgo));

    // Invites
    const [pendingInvitesRow] = await db.select({ count: count() }).from(platformInvites).where(and(eq(platformInvites.status, "pending"), ...(tenantId ? [eq(platformInvites.tenantId, tenantId)] : [])));
    const [acceptedInvitesRow] = await db.select({ count: count() }).from(platformInvites).where(and(eq(platformInvites.status, "accepted"), ...(tenantId ? [eq(platformInvites.tenantId, tenantId)] : [])));

    // Assessments completed
    const [completedAssessmentsRow] = await db.select({ count: count() }).from(assessmentSessions).where(and(eq(assessmentSessions.status, "completed"), ...(tenantId ? [eq(assessmentSessions.tenantId, tenantId)] : [])));
    const [recentAssessmentsRow] = await db.select({ count: count() }).from(assessmentSessions)
      .where(and(sql`${assessmentSessions.status} = 'completed' AND ${assessmentSessions.completedAt} >= ${thirtyDaysAgo}`, ...(tenantId ? [eq(assessmentSessions.tenantId, tenantId)] : [])));

    // Reports generated
    const [totalReportsRow] = await db.select({ count: count() }).from(reports).where(tenantId ? eq(reports.tenantId, tenantId) : undefined);

    // Practice sessions
    const [totalPracticeRow] = tenantId
      ? await db.select({ count: count() }).from(practiceSessions).innerJoin(tenantUsers, eq(practiceSessions.userId, tenantUsers.userId)).where(eq(tenantUsers.tenantId, tenantId))
      : await db.select({ count: count() }).from(practiceSessions);
    const [recentPracticeRow] = tenantId
      ? await db.select({ count: count() }).from(practiceSessions).innerJoin(tenantUsers, eq(practiceSessions.userId, tenantUsers.userId)).where(and(eq(tenantUsers.tenantId, tenantId), gte(practiceSessions.createdAt, thirtyDaysAgo)))
      : await db.select({ count: count() }).from(practiceSessions).where(gte(practiceSessions.createdAt, thirtyDaysAgo));

    // Assessments by module type
    const moduleBreakdown = await db
      .select({
        moduleType: assessmentSessions.moduleType,
        total: count(),
      })
      .from(assessmentSessions)
      .where(and(eq(assessmentSessions.status, "completed"), ...(tenantId ? [eq(assessmentSessions.tenantId, tenantId)] : [])))
      .groupBy(assessmentSessions.moduleType);

    // Recent users (last 10 sign-ups)
    const recentUsers = (tenantId ? await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .innerJoin(tenantUsers, eq(users.id, tenantUsers.userId))
      .where(eq(tenantUsers.tenantId, tenantId))
      .orderBy(desc(users.createdAt))
      .limit(10) : await db
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
      .limit(10));

    // Recent pilot applications (last 5)
    const recentApplications = tenantId ? [] : await db
      .select()
      .from(pilotApplications)
      .orderBy(desc(pilotApplications.createdAt))
      .limit(5);

    // Playbook sessions
    const [totalPlaybookRow] = tenantId
      ? await db.select({ count: count() }).from(playbookSessions).innerJoin(tenantUsers, eq(playbookSessions.userId, tenantUsers.userId)).where(eq(tenantUsers.tenantId, tenantId))
      : await db.select({ count: count() }).from(playbookSessions);
    const [recentPlaybookRow] = tenantId
      ? await db.select({ count: count() }).from(playbookSessions).innerJoin(tenantUsers, eq(playbookSessions.userId, tenantUsers.userId)).where(and(eq(tenantUsers.tenantId, tenantId), gte(playbookSessions.createdAt, thirtyDaysAgo)))
      : await db.select({ count: count() }).from(playbookSessions).where(gte(playbookSessions.createdAt, thirtyDaysAgo));

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
  getPlaybookStats: protectedProcedure.input(z.object({ tenantId: z.number().int().positive().nullable().optional() }).optional()).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const tenantId = input?.tenantId ?? null;

    // Per-user session counts
    const perUser = (tenantId ? await db
      .select({
        userId: playbookSessions.userId,
        userName: users.name,
        userEmail: users.email,
        sessionCount: count(),
      })
      .from(playbookSessions)
      .leftJoin(users, eq(playbookSessions.userId, users.id))
      .innerJoin(tenantUsers, eq(playbookSessions.userId, tenantUsers.userId))
      .where(eq(tenantUsers.tenantId, tenantId))
      .groupBy(playbookSessions.userId, users.name, users.email)
      .orderBy(desc(count()))
      .limit(20) : await db
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
      .limit(20));

    // Top situation types
    const topSituations = (tenantId ? await db
      .select({
        playbookType: playbookSessions.playbookType,
        total: count(),
      })
      .from(playbookSessions)
      .innerJoin(tenantUsers, eq(playbookSessions.userId, tenantUsers.userId))
      .where(eq(tenantUsers.tenantId, tenantId))
      .groupBy(playbookSessions.playbookType)
      .orderBy(desc(count()))
      .limit(10) : await db
      .select({
        playbookType: playbookSessions.playbookType,
        total: count(),
      })
      .from(playbookSessions)
      .groupBy(playbookSessions.playbookType)
      .orderBy(desc(count()))
      .limit(10));

    return { perUser, topSituations };
  }),
});
