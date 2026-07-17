/**
 * Diagnostic Unlock Router
 *
 * Implements the three-layer progressive unlock system:
 *   Layer 1 — Time gate:   21 days since the previous diagnostic was completed
 *   Layer 2 — Action gate: 5 module-specific missions completed
 *                          3 Guide sessions held (attributed to that module)
 *                          1 Growth Profile commitment set
 *   Layer 3 — Narrative:   Guide surfaces a personalised "you are ready" message
 *
 * Module sequence: ECI → TII → LII → GCC → (future modules)
 * ECI is always unlocked (it is the entry point).
 */

import { TRPCError } from "@trpc/server";
import { eq, and, gte, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  diagnosticUnlockProgress,
  guideSessions,
  dailyMissions,
  growthPlans,
  reports,
  users,
  tenantUsers,
  productModules,
  userProductEnrollments,
  type LeadershipGraph,
  type DiagnosticUnlockProgress,
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

// ── Constants ─────────────────────────────────────────────────────────────────
const TIME_GATE_DAYS = 21;
const MISSION_TARGET = 5;
const GUIDE_SESSION_TARGET = 3;

// Fallback sequence used if DB is unavailable
const FALLBACK_MODULE_SEQUENCE = ["ECI", "TII", "LII", "GCC", "LDI", "STI", "NII"];
type ModuleType = string;

// Helper: get the module sequence for a user's active product from the DB
async function getProductModuleSequence(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number
): Promise<string[]> {
  try {
    const [enrollment] = await db
      .select({ productId: userProductEnrollments.productId })
      .from(userProductEnrollments)
      .where(and(eq(userProductEnrollments.userId, userId), eq(userProductEnrollments.isActive, true)))
      .orderBy(desc(userProductEnrollments.lastActiveAt))
      .limit(1);
    const productId = enrollment?.productId ?? "leadership_intelligence";
    const modules = await db
      .select({ moduleCode: productModules.moduleCode, isEntryPoint: productModules.isEntryPoint })
      .from(productModules)
      .where(eq(productModules.productId, productId))
      .orderBy(productModules.sequenceOrder);
    if (modules.length === 0) return [...FALLBACK_MODULE_SEQUENCE];
    return modules.map((m) => m.moduleCode);
  } catch {
    return [...FALLBACK_MODULE_SEQUENCE];
  }
}

// Helper: get the entry point module code for a user's active product
async function getEntryPointModule(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number
): Promise<string> {
  try {
    const [enrollment] = await db
      .select({ productId: userProductEnrollments.productId })
      .from(userProductEnrollments)
      .where(and(eq(userProductEnrollments.userId, userId), eq(userProductEnrollments.isActive, true)))
      .orderBy(desc(userProductEnrollments.lastActiveAt))
      .limit(1);
    const productId = enrollment?.productId ?? "leadership_intelligence";
    const [entry] = await db
      .select({ moduleCode: productModules.moduleCode })
      .from(productModules)
      .where(and(eq(productModules.productId, productId), eq(productModules.isEntryPoint, true)))
      .limit(1);
    return entry?.moduleCode ?? "ECI";
  } catch {
    return "ECI";
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntilUnlock(completedAt: Date): number {
  const elapsed = daysSince(completedAt);
  return Math.max(0, TIME_GATE_DAYS - elapsed);
}

/** Find the lowest-scoring dimension in a report's dimensionScores */
function getLowestDimension(dimensionScores: Record<string, number> | null): string | null {
  if (!dimensionScores) return null;
  const entries = Object.entries(dimensionScores);
  if (entries.length === 0) return null;
  const [dim] = entries.sort(([, a], [, b]) => a - b)[0];
  return dim.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Router ────────────────────────────────────────────────────────────────────

export const unlockRouter = router({
  /**
   * Returns the unlock status for every module in the sequence.
   * Called by the Diagnostics hub to render lock states and progress.
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const userId = ctx.user.id;

    // Get the user's Leadership Graph to know which modules are completed
    const [userRow] = await db
      .select({ leadershipGraph: users.leadershipGraph })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const graph = (userRow?.leadershipGraph as LeadershipGraph) ?? null;
    const completedModules = (graph?.completedModules ?? []) as ModuleType[];

    // Get tenantId from tenantUsers join
    const [tenantRow] = await db
      .select({ tenantId: tenantUsers.tenantId })
      .from(tenantUsers)
      .where(eq(tenantUsers.userId, userId))
      .limit(1);
    const tenantId = tenantRow?.tenantId ?? null;

    // Get all unlock progress rows for this user
    const progressRows = await db
      .select()
      .from(diagnosticUnlockProgress)
      .where(eq(diagnosticUnlockProgress.userId, userId));

    const progressByTarget = new Map<string, DiagnosticUnlockProgress>();
    for (const row of progressRows) {
      progressByTarget.set(row.toModule, row);
    }

    // Get the module sequence for this user's active product
    const MODULE_SEQUENCE = await getProductModuleSequence(db, userId);
    const ENTRY_MODULE = await getEntryPointModule(db, userId);

    // Build status for each module
    const statuses = await Promise.all(
      MODULE_SEQUENCE.map(async (moduleId) => {
        // Entry point module is always unlocked
        if (moduleId === ENTRY_MODULE) {
          return {
            moduleId,
            state: "unlocked" as const,
            daysRemaining: 0,
            missionsCompleted: 0,
            missionTarget: MISSION_TARGET,
            guideSessionsCompleted: 0,
            guideSessionTarget: GUIDE_SESSION_TARGET,
            commitmentSet: true,
            focusDimension: null,
            narrativeReady: false,
            narrativeShown: false,
          };
        }

        const isDone = completedModules.includes(moduleId);
        if (isDone) {
          return {
            moduleId,
            state: "completed" as const,
            daysRemaining: 0,
            missionsCompleted: MISSION_TARGET,
            missionTarget: MISSION_TARGET,
            guideSessionsCompleted: GUIDE_SESSION_TARGET,
            guideSessionTarget: GUIDE_SESSION_TARGET,
            commitmentSet: true,
            focusDimension: null,
            narrativeReady: false,
            narrativeShown: false,
          };
        }

        // Find the prerequisite module (the one before this in the sequence)
        const prereqIdx = MODULE_SEQUENCE.indexOf(moduleId) - 1;
        const prereqModule = MODULE_SEQUENCE[prereqIdx] as string;
        const prereqCompleted = completedModules.includes(prereqModule);

        if (!prereqCompleted) {
          // Prerequisite not yet done — this module is not yet in the unlock pipeline
          return {
            moduleId,
            state: "not_started" as const,
            daysRemaining: 0,
            missionsCompleted: 0,
            missionTarget: MISSION_TARGET,
            guideSessionsCompleted: 0,
            guideSessionTarget: GUIDE_SESSION_TARGET,
            commitmentSet: false,
            focusDimension: null,
            narrativeReady: false,
            narrativeShown: false,
          };
        }

        // Prerequisite is done — get or create the unlock progress row
        let progress = progressByTarget.get(moduleId) ?? null;

        if (!progress) {
          // Find when the prereq was completed
          const [prereqReport] = await db
            .select({ createdAt: reports.createdAt, dimensionScores: reports.dimensionScores })
            .from(reports)
            .where(and(eq(reports.userId, userId), eq(reports.moduleType, prereqModule as any)))
            .orderBy(desc(reports.createdAt))
            .limit(1);

          if (!prereqReport) {
            return {
              moduleId,
              state: "not_started" as const,
              daysRemaining: 0,
              missionsCompleted: 0,
              missionTarget: MISSION_TARGET,
              guideSessionsCompleted: 0,
              guideSessionTarget: GUIDE_SESSION_TARGET,
              commitmentSet: false,
              focusDimension: null,
              narrativeReady: false,
              narrativeShown: false,
            };
          }

          const focusDimension = getLowestDimension(
            prereqReport.dimensionScores as Record<string, number> | null
          );

          // Create the progress row
          await db.insert(diagnosticUnlockProgress).values({
            userId,
            tenantId,
            fromModule: prereqModule as any,
            toModule: moduleId as any,
            fromCompletedAt: prereqReport.createdAt,
            focusDimension,
          });

          // Re-fetch
          const [newRow] = await db
            .select()
            .from(diagnosticUnlockProgress)
            .where(
              and(
                eq(diagnosticUnlockProgress.userId, userId),
                eq(diagnosticUnlockProgress.toModule, moduleId as any)
              )
            )
            .limit(1);
          progress = newRow;
        }

        if (!progress) {
          return {
            moduleId,
            state: "locked" as const,
            daysRemaining: TIME_GATE_DAYS,
            missionsCompleted: 0,
            missionTarget: MISSION_TARGET,
            guideSessionsCompleted: 0,
            guideSessionTarget: GUIDE_SESSION_TARGET,
            commitmentSet: false,
            focusDimension: null,
            narrativeReady: false,
            narrativeShown: false,
          };
        }

        // Already fully unlocked
        if (progress.unlockedAt) {
          return {
            moduleId,
            state: "unlocked" as const,
            daysRemaining: 0,
            missionsCompleted: progress.missionsCompleted,
            missionTarget: MISSION_TARGET,
            guideSessionsCompleted: progress.guideSessionsCompleted,
            guideSessionTarget: GUIDE_SESSION_TARGET,
            commitmentSet: progress.commitmentSet,
            focusDimension: progress.focusDimension,
            narrativeReady: !!progress.allGatesPassedAt,
            narrativeShown: progress.narrativeShown,
          };
        }

        // Compute live gate states
        const days = daysUntilUnlock(new Date(progress.fromCompletedAt));
        const timePassed = days === 0;

        // Count module-specific completed missions since prereq completion
        const missionRows = await db
          .select({ id: dailyMissions.id })
          .from(dailyMissions)
          .where(
            and(
              eq(dailyMissions.userId, userId),
              eq(dailyMissions.moduleType, prereqModule as any),
              eq(dailyMissions.status, "complete"),
              gte(dailyMissions.completedAt, new Date(progress.fromCompletedAt))
            )
          );
        const missionsCount = Math.min(missionRows.length, MISSION_TARGET);

        // Count module-specific guide sessions since prereq completion
        const sessionRows = await db
          .select({ id: guideSessions.id })
          .from(guideSessions)
          .where(
            and(
              eq(guideSessions.userId, userId),
              eq(guideSessions.moduleType, prereqModule as any),
              gte(guideSessions.createdAt, new Date(progress.fromCompletedAt))
            )
          );
        const sessionsCount = Math.min(sessionRows.length, GUIDE_SESSION_TARGET);

        // Check if a growth plan (commitment) exists since prereq completion
        const [planRow] = await db
          .select({ id: growthPlans.id })
          .from(growthPlans)
          .where(
            and(
              eq(growthPlans.userId, userId),
              eq(growthPlans.isActive, true),
              gte(growthPlans.createdAt, new Date(progress.fromCompletedAt))
            )
          )
          .limit(1);
        const commitmentDone = !!planRow;

        // Update the progress row with latest counts
        await db
          .update(diagnosticUnlockProgress)
          .set({
            missionsCompleted: missionsCount,
            guideSessionsCompleted: sessionsCount,
            commitmentSet: commitmentDone,
            timegatePassedAt: timePassed ? (progress.timegatePassedAt ?? new Date()) : null,
          })
          .where(eq(diagnosticUnlockProgress.id, progress.id));

        const allGatesPassed =
          timePassed &&
          missionsCount >= MISSION_TARGET &&
          sessionsCount >= GUIDE_SESSION_TARGET &&
          commitmentDone;

        if (allGatesPassed && !progress.allGatesPassedAt) {
          await db
            .update(diagnosticUnlockProgress)
            .set({ allGatesPassedAt: new Date(), unlockedAt: new Date() })
            .where(eq(diagnosticUnlockProgress.id, progress.id));
        }

        return {
          moduleId,
          state: allGatesPassed ? ("unlocked" as const) : ("locked" as const),
          daysRemaining: days,
          missionsCompleted: missionsCount,
          missionTarget: MISSION_TARGET,
          guideSessionsCompleted: sessionsCount,
          guideSessionTarget: GUIDE_SESSION_TARGET,
          commitmentSet: commitmentDone,
          focusDimension: progress.focusDimension,
          narrativeReady: allGatesPassed,
          narrativeShown: progress.narrativeShown,
        };
      })
    );

    return statuses;
  }),

  /**
   * Generates and returns the Guide narrative unlock message for a module.
   * Called when the user opens the Diagnostics hub and all gates are passed.
   * Marks narrativeShown = true after first call.
   */
  getNarrativeUnlock: protectedProcedure
    .input(z.object({ toModule: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [progress] = await db
        .select()
        .from(diagnosticUnlockProgress)
        .where(
          and(
            eq(diagnosticUnlockProgress.userId, ctx.user.id),
            eq(diagnosticUnlockProgress.toModule, input.toModule as any)
          )
        )
        .limit(1);

      if (!progress) throw new TRPCError({ code: "NOT_FOUND" });

      // Get user name
      const [userRow] = await db
        .select({ name: users.name, leadershipGraph: users.leadershipGraph })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const userName = userRow?.name ?? "Leader";
      const graph = (userRow?.leadershipGraph as LeadershipGraph) ?? null;

      const moduleLabel = (m: string) =>
        m === "ECI" ? "Executive Communication Intelligence"
        : m === "TII" ? "Leadership Time Intelligence"
        : m === "LII" ? "Leadership Influence Intelligence"
        : m === "GCC" ? "GCC Readiness"
        : m === "LDI" ? "Leadership Derailment Intelligence"
        : m === "STI" ? "Strategic Thinking Intelligence"
        : m === "NII" ? "Navigation Intelligence"
        : m;

      const fromLabel = moduleLabel(progress.fromModule);
      const toLabel = moduleLabel(input.toModule);

      const archetype =
        graph?.archetypes?.[progress.fromModule as keyof typeof graph.archetypes] ?? null;
      const archetypeLabel = archetype
        ? (archetype as string).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : null;

      const prompt = `You are Guide, a leadership coach inside LevelNext.
${userName} has just completed their 21-day application period after the ${fromLabel} diagnostic.
${archetypeLabel ? `Their archetype is: ${archetypeLabel}.` : ""}
${progress.focusDimension ? `They focused on improving: ${progress.focusDimension}.` : ""}
They have completed 5 module-specific missions, held 3 Guide sessions, and set a 30-day growth commitment.

Write a short, warm, personal message (3-4 sentences) that:
1. Acknowledges what they have demonstrated over the past 21 days
2. Connects their ${fromLabel} insights to why the ${toLabel} diagnostic is the right next step
3. Ends with an invitation to begin the ${toLabel} diagnostic

Tone: coaching, direct, encouraging. No bullet points. No markdown. Plain prose only.`;

      const result = await invokeLLM({
        model: "gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 250,
      });

      const raw = result.choices[0]?.message?.content ?? "";
      const narrative =
        typeof raw === "string"
          ? raw
          : (raw as any[]).map((c: any) => c.text ?? "").join("");

      // Mark as shown
      await db
        .update(diagnosticUnlockProgress)
        .set({ narrativeShown: true })
        .where(eq(diagnosticUnlockProgress.id, progress.id));

      return { narrative };
    }),

  /**
   * Records a Guide session attributed to the user's most recently completed module.
   * Called from the Guide router when a new conversation day begins.
   */
  recordGuideSession: protectedProcedure
    .input(
      z.object({
        moduleType: z.enum(["ECI", "TII", "LII", "GCC", "LDI", "STI", "GENERAL"]),
        conversationId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(guideSessions).values({
        userId: ctx.user.id,
        moduleType: input.moduleType,
        conversationId: input.conversationId ?? null,
      });

      return { recorded: true };
    }),
});
