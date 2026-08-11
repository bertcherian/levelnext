import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "../db";
import {
  dailyMissions,
  guideSessions,
  growthPlans,
  reports,
  type AssessmentSession,
} from "../../drizzle/schema";

export const ASSESSMENT_MODULE_TYPES = [
  "ECI", "TII", "LII", "GCC", "LDI", "STI", "NII",
  "CPI", "CRS", "CMK", "CST", "CAO", "AIR",
] as const;

export type AssessmentModuleType = (typeof ASSESSMENT_MODULE_TYPES)[number];

const CAREER_MODULE_TYPES = new Set<AssessmentModuleType>(["CPI", "CRS", "CMK", "CST", "CAO", "AIR"]);
const ACTIVE_LEADERSHIP_SEQUENCE: AssessmentModuleType[] = ["ECI", "LII", "LDI", "STI"];
const LEGACY_LEADERSHIP_TYPES = new Set<AssessmentModuleType>(["TII", "GCC", "NII"]);
const TIME_GATE_DAYS = 21;
const MISSION_TARGET = 5;
const GUIDE_SESSION_TARGET = 3;

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type SessionAccessRecord = Pick<AssessmentSession, "userId" | "moduleType" | "status">;

export function assertKnownAssessmentModule(moduleType: string): asserts moduleType is AssessmentModuleType {
  if (!(ASSESSMENT_MODULE_TYPES as readonly string[]).includes(moduleType)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown diagnostic module." });
  }
}

export function assertOwnedActiveSession(
  session: SessionAccessRecord | undefined,
  userId: number,
  moduleType?: AssessmentModuleType,
): asserts session is SessionAccessRecord {
  if (!session) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Assessment session not found." });
  }
  if (session.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access another user's assessment session." });
  }
  if (moduleType && session.moduleType !== moduleType) {
    throw new TRPCError({ code: "CONFLICT", message: "The assessment session does not match this diagnostic." });
  }
  if (session.status !== "in_progress") {
    throw new TRPCError({ code: "CONFLICT", message: "This assessment session has already been completed or closed." });
  }
}

export function assertReportOwner(report: { userId: number | null } | undefined, userId: number) {
  if (!report) return;
  if (report.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access another user's report." });
  }
}

/**
 * Enforces the Leadership diagnostic journey independently of the client UI.
 * Career diagnostics currently have no progressive unlock model and remain available
 * to authenticated users. Legacy Leadership modules are read-only in the active journey.
 */
export async function assertAssessmentModuleAccess(
  db: Database,
  userId: number,
  moduleType: AssessmentModuleType,
): Promise<void> {
  if (CAREER_MODULE_TYPES.has(moduleType)) return;

  if (LEGACY_LEADERSHIP_TYPES.has(moduleType)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This diagnostic is not available in the active Leadership journey.",
    });
  }

  const moduleIndex = ACTIVE_LEADERSHIP_SEQUENCE.indexOf(moduleType);
  if (moduleIndex === -1) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported diagnostic module." });
  }
  if (moduleIndex === 0) return;

  const prerequisiteModule = ACTIVE_LEADERSHIP_SEQUENCE[moduleIndex - 1]!;
  const [prerequisiteReport] = await db
    .select({ createdAt: reports.createdAt })
    .from(reports)
    .where(and(eq(reports.userId, userId), eq(reports.moduleType, prerequisiteModule)))
    .orderBy(desc(reports.createdAt))
    .limit(1);

  if (!prerequisiteReport) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Complete ${prerequisiteModule} before starting ${moduleType}.`,
    });
  }

  const completedAt = prerequisiteReport.createdAt;
  const elapsedDays = Math.floor((Date.now() - completedAt.getTime()) / (1000 * 60 * 60 * 24));
  if (elapsedDays < TIME_GATE_DAYS) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${moduleType} unlocks after the ${TIME_GATE_DAYS}-day application period.`,
    });
  }

  const [missionRows, guideRows, commitmentRows] = await Promise.all([
    db
      .select({ id: dailyMissions.id })
      .from(dailyMissions)
      .where(and(
        eq(dailyMissions.userId, userId),
        eq(dailyMissions.moduleType, prerequisiteModule),
        eq(dailyMissions.status, "complete"),
        gte(dailyMissions.completedAt, completedAt),
      )),
    db
      .select({ id: guideSessions.id })
      .from(guideSessions)
      .where(and(
        eq(guideSessions.userId, userId),
        eq(guideSessions.moduleType, prerequisiteModule),
        gte(guideSessions.createdAt, completedAt),
      )),
    db
      .select({ id: growthPlans.id })
      .from(growthPlans)
      .where(and(
        eq(growthPlans.userId, userId),
        eq(growthPlans.isActive, true),
        gte(growthPlans.createdAt, completedAt),
      ))
      .limit(1),
  ]);

  if (
    missionRows.length < MISSION_TARGET ||
    guideRows.length < GUIDE_SESSION_TARGET ||
    commitmentRows.length === 0
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${moduleType} is still locked until all application milestones are complete.`,
    });
  }
}
