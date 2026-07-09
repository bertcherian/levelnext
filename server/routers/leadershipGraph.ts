import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, type LeadershipGraph } from "../../drizzle/schema";

// ─── Helper: update Leadership Graph after a module completes ─────────────────
export async function updateLeadershipGraph(
  userId: number,
  moduleType: "ECI" | "TII" | "LII" | "GCC",
  scored: {
    edgeScore: number;
    zone: string;
    archetype: string;
    zoneLabel?: string;
    archetypeLabel?: string;
    archetypeDescription?: string;
    archetypeStrengths?: string[];
    archetypeRisks?: string[];
    dimensionScores?: Record<string, number>;
  }
) {
  const db = await getDb();
  if (!db) return;

  const result = await db
    .select({ leadershipGraph: users.leadershipGraph })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const existing: LeadershipGraph = (result[0]?.leadershipGraph as LeadershipGraph) ?? {};

  const completedModules = Array.from(
    new Set([...(existing.completedModules ?? []), moduleType])
  ) as ("ECI" | "TII" | "LII" | "GCC")[];

  const moduleEdges = { ...(existing.moduleEdges ?? {}), [moduleType]: scored.edgeScore };
  const archetypes = { ...(existing.archetypes ?? {}), [moduleType]: scored.archetype };
  const zones = { ...(existing.zones ?? {}), [moduleType]: scored.zone };

  // Store full module data for Guide context
  const existingModules = (existing as any).modules ?? {};
  const modules = {
    ...existingModules,
    [moduleType]: {
      edgeScore: scored.edgeScore,
      zone: scored.zone,
      zoneLabel: scored.zoneLabel,
      archetype: scored.archetype,
      archetypeLabel: scored.archetypeLabel,
      archetypeDescription: scored.archetypeDescription,
      archetypeStrengths: scored.archetypeStrengths ?? [],
      archetypeRisks: scored.archetypeRisks ?? [],
      dimensionScores: scored.dimensionScores ?? {},
      completedAt: new Date().toISOString(),
    },
  };

  // Composite Edge: average of all completed module scores
  const compositeEdge = Math.round(
    Object.values(moduleEdges).reduce((a, b) => a + b, 0) / Object.values(moduleEdges).length
  );

  const updated = {
    ...existing,
    compositeEdge,
    moduleEdges,
    archetypes,
    zones,
    completedModules,
    modules,
    lastUpdated: new Date().toISOString(),
  } as LeadershipGraph;

  await db.update(users).set({ leadershipGraph: updated }).where(eq(users.id, userId));
}

export const leadershipGraphRouter = router({
  // Get the current user's Leadership Graph
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db
      .select({ leadershipGraph: users.leadershipGraph })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return (result[0]?.leadershipGraph as LeadershipGraph) ?? null;
  }),
});
