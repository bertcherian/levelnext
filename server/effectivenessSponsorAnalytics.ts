import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { eiCapacitySnapshots, eiWorkScans } from "../drizzle/schema";
import { assertSponsorAccess, BEHAVIOURAL_SPONSOR_THRESHOLD } from "./behaviouralSponsorAnalytics";
import { INDUSTRY_CAPACITY_BASELINES } from "../shared/modules/effectivenessIntelligence";

const NAVY = "#0A1A2F";

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export async function getEffectivenessSponsorCapacity(user: { id: number; role: string }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const tenantId = await assertSponsorAccess(user);
  if (!tenantId) {
    return {
      eligible: false,
      threshold: BEHAVIOURAL_SPONSOR_THRESHOLD,
      participantCount: null,
      reportingPeriod: "All available completed scans",
      metrics: null,
      categories: [],
      industryBaselines: [],
      privacyBoundary: "Capacity intelligence is withheld until at least five participants contribute. Individual diary entries, work activities, names, and private reflections are never included.",
    } as const;
  }

  const snapshots = await db
    .select({
      snapshot: eiCapacitySnapshots,
      scan: eiWorkScans,
    })
    .from(eiCapacitySnapshots)
    .innerJoin(eiWorkScans, eq(eiCapacitySnapshots.scanId, eiWorkScans.id))
    .where(and(eq(eiCapacitySnapshots.tenantId, tenantId), eq(eiWorkScans.status, "completed")))
    .orderBy(desc(eiCapacitySnapshots.createdAt));

  const participantIds = Array.from(new Set(snapshots.map(({ snapshot }) => snapshot.userId)));
  if (participantIds.length < BEHAVIOURAL_SPONSOR_THRESHOLD) {
    return {
      eligible: false,
      threshold: BEHAVIOURAL_SPONSOR_THRESHOLD,
      participantCount: null,
      reportingPeriod: "All available completed scans",
      metrics: null,
      categories: [],
      industryBaselines: [],
      privacyBoundary: `Aggregate capacity intelligence unlocks at ${BEHAVIOURAL_SPONSOR_THRESHOLD}+ participants. Current progress is withheld to prevent small-cohort inference.`,
    } as const;
  }

  // Use each participant's most recent snapshot so repeat diaries do not overweight a person.
  const latestByParticipant = new Map<number, typeof snapshots[number]>();
  for (const row of snapshots) {
    if (!latestByParticipant.has(row.snapshot.userId)) latestByParticipant.set(row.snapshot.userId, row);
  }
  const latest = Array.from(latestByParticipant.values());
  const avg = (field: "recoverableHours" | "workBelowLevelHours" | "workBelowLevelPercent" | "gapScore") =>
    round(latest.reduce((sum, row) => sum + Number(row.snapshot[field] ?? 0), 0) / latest.length);

  const currentAllocationKeys = [
    "strategic_thinking",
    "people_development",
    "stakeholder_leadership",
    "decision_making",
    "operational_execution",
    "meetings_coordination",
    "administrative_reporting",
    "firefighting_reactive",
  ] as const;

  const categories = currentAllocationKeys.map((category) => {
    const current = latest.map((row) => Number((row.snapshot.currentAllocation as unknown as Record<string, number> | null)?.[category] ?? 0));
    const target = latest.map((row) => Number((row.snapshot.targetAllocation as unknown as Record<string, number> | null)?.[category] ?? 0));
    return {
      key: category,
      label: category.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()),
      currentPercent: round(current.reduce((sum, value) => sum + value, 0) / latest.length),
      targetPercent: round(target.reduce((sum, value) => sum + value, 0) / latest.length),
      gapPercent: round(target.reduce((sum, value, index) => sum + value - current[index], 0) / latest.length),
    };
  });

  const belowLevelReductionSignal = latest.filter((row) => row.snapshot.workBelowLevelPercent <= 20).length / latest.length;
  const highConfidenceCount = latest.filter((row) => row.snapshot.confidence === "high_measured").length;

  return {
    eligible: true,
    threshold: BEHAVIOURAL_SPONSOR_THRESHOLD,
    participantCount: participantIds.length,
    reportingPeriod: "Latest available completed Work Genome or diary-refined snapshot per participant",
    metrics: {
      averageRecoverableHours: avg("recoverableHours"),
      averageWorkBelowLevelHours: avg("workBelowLevelHours"),
      averageWorkBelowLevelPercent: avg("workBelowLevelPercent"),
      averageCapacityGap: avg("gapScore"),
      participantsWithBelowLevelReduction: Math.round(belowLevelReductionSignal * 100),
      highConfidenceSnapshotPercent: Math.round((highConfidenceCount / latest.length) * 100),
    },
    categories,
    industryBaselines: Object.entries(INDUSTRY_CAPACITY_BASELINES).map(([key, baseline]) => ({
      key,
      label: baseline.label,
      note: baseline.note,
      allocation: baseline.allocation,
    })),
    privacyBoundary: "Anonymized cohort patterns only. Values use the latest snapshot per participant, require 5+ participants, and exclude individual diary entries, names, raw activities, private reflections, and diagnostic narratives.",
    accent: { navy: NAVY, gold: "#D4AF37", ivory: "#F8F5F0" },
  } as const;
}
