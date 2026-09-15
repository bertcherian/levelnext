import { and, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  biActions,
  biEvidence,
  biMoments,
  biMoves,
  biPracticeLinks,
  biReflections,
  tenantUsers,
} from "../drizzle/schema";

export const BEHAVIOURAL_SPONSOR_THRESHOLD = 5;

const EVIDENCE_LEVEL_INDEX: Record<string, number> = {
  prepared: 0,
  practised: 1,
  applied: 2,
  reflected: 3,
  repeated: 4,
  demonstrated_consistently: 5,
};

const HEATMAP_STAGES = [
  { key: "prepared", label: "Prepared" },
  { key: "practised", label: "Practised" },
  { key: "applied", label: "Applied" },
  { key: "reflected", label: "Reflected" },
  { key: "repeated", label: "Repeated" },
  { key: "demonstrated_consistently", label: "Demonstrated consistently" },
] as const;

type HeatmapParticipant = {
  userId: number;
  levelIndex: number;
};

type HeatmapDimension = {
  key: string;
  label: string;
  participants: Map<number, HeatmapParticipant>;
};

function dimensionLabel(key: string) {
  return key
    .replace(/^LDI[_:-]?/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function setHighestLevel(map: Map<number, HeatmapParticipant>, userId: number, levelIndex: number) {
  const existing = map.get(userId);
  if (!existing || existing.levelIndex < levelIndex) {
    map.set(userId, { userId, levelIndex });
  }
}

function heatmapCellLabel(value: number) {
  if (value >= 4.5) return "Consistent demonstration";
  if (value >= 3.5) return "Repeated application";
  if (value >= 2.5) return "Reflection emerging";
  if (value >= 1.5) return "Real-world application";
  if (value >= 0.5) return "Practice underway";
  return "Prepared to practise";
}

export async function assertSponsorAccess(user: { id: number; role: string }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  if (user.role === "admin") {
    const [membership] = await db
      .select({ tenantId: tenantUsers.tenantId })
      .from(tenantUsers)
      .where(eq(tenantUsers.userId, user.id))
      .limit(1);
    return membership?.tenantId ?? null;
  }

  const [membership] = await db
    .select({ tenantId: tenantUsers.tenantId })
    .from(tenantUsers)
    .where(and(eq(tenantUsers.userId, user.id), inArray(tenantUsers.role, ["owner", "admin"])))
    .limit(1);

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organisation owner or sponsor-admin access is required.",
    });
  }
  return membership.tenantId;
}

/**
 * Returns only cohort-level progress. The service intentionally never returns
 * user IDs, names, raw moments, phrases, action descriptions, reflections,
 * transcripts, or row-level diagnostic narratives.
 */
export async function getBehaviouralSponsorHeatmap(user: { id: number; role: string }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const tenantId = await assertSponsorAccess(user);
  if (!tenantId) {
    return {
      eligible: false,
      threshold: BEHAVIOURAL_SPONSOR_THRESHOLD,
      participantCount: null,
      dimensions: [],
      privacyBoundary: "Behavioural progress is withheld until at least five participants contribute. Individual moments, reflections, phrases, and transcripts are never included.",
    } as const;
  }

  const moments = await db
    .select()
    .from(biMoments)
    .where(eq(biMoments.tenantId, tenantId));

  const participantIds = Array.from(new Set(moments.map((moment) => moment.userId)));
  if (participantIds.length < BEHAVIOURAL_SPONSOR_THRESHOLD) {
    return {
      eligible: false,
      threshold: BEHAVIOURAL_SPONSOR_THRESHOLD,
      participantCount: null,
      dimensions: [],
      privacyBoundary: `Aggregate Behavioural Intelligence progress unlocks at ${BEHAVIOURAL_SPONSOR_THRESHOLD}+ participants. Current progress is withheld to prevent small-cohort inference.`,
    } as const;
  }

  const momentIds = moments.map((moment) => moment.id);
  const [moves, practiceLinks, actions, evidence, reflections] = await Promise.all([
    momentIds.length ? db.select().from(biMoves).where(inArray(biMoves.momentId, momentIds)) : Promise.resolve([]),
    momentIds.length ? db.select().from(biPracticeLinks).where(inArray(biPracticeLinks.momentId, momentIds)) : Promise.resolve([]),
    momentIds.length ? db.select().from(biActions).where(inArray(biActions.momentId, momentIds)) : Promise.resolve([]),
    momentIds.length ? db.select().from(biEvidence).where(inArray(biEvidence.momentId, momentIds)) : Promise.resolve([]),
    momentIds.length ? db.select().from(biReflections).where(inArray(biReflections.momentId, momentIds)) : Promise.resolve([]),
  ]);

  const momentById = new Map(moments.map((moment) => [moment.id, moment]));
  const dimensions = new Map<string, HeatmapDimension>();

  const getDimensionKeys = (moment: typeof moments[number]) => {
    const scores = moment.diagnosticContext?.dimensionScores;
    const keys = scores && typeof scores === "object" ? Object.keys(scores) : [];
    return keys.length ? keys : [moment.moduleType || moment.sourceApp || "behavioural_core"];
  };

  for (const moment of moments) {
    for (const key of getDimensionKeys(moment)) {
      if (!dimensions.has(key)) {
        dimensions.set(key, { key, label: dimensionLabel(key), participants: new Map() });
      }
      setHighestLevel(dimensions.get(key)!.participants, moment.userId, 0);
    }
  }

  const applyMomentLevel = (momentId: number, userId: number, levelIndex: number) => {
    const moment = momentById.get(momentId);
    if (!moment) return;
    for (const key of getDimensionKeys(moment)) {
      const dimension = dimensions.get(key);
      if (dimension) setHighestLevel(dimension.participants, userId, levelIndex);
    }
  };

  for (const link of practiceLinks) {
    if (link.practiceStatus === "completed") applyMomentLevel(link.momentId, link.userId, Math.max(1, EVIDENCE_LEVEL_INDEX[link.evidenceLevel] ?? 1));
  }
  for (const item of actions) {
    if (item.status === "completed") applyMomentLevel(item.momentId, item.userId, 2);
  }
  for (const item of evidence) {
    applyMomentLevel(item.momentId, item.userId, EVIDENCE_LEVEL_INDEX[item.evidenceLevel] ?? 2);
  }
  for (const item of reflections) {
    applyMomentLevel(item.momentId, item.userId, 3);
  }

  const eligibleDimensions = Array.from(dimensions.values())
    .filter((dimension) => dimension.participants.size >= BEHAVIOURAL_SPONSOR_THRESHOLD)
    .sort((a, b) => a.label.localeCompare(b.label));

  const dimensionRows = eligibleDimensions.map((dimension) => {
    const participantValues = Array.from(dimension.participants.values()).map((participant) => participant.levelIndex);
    const averageProgress = participantValues.reduce((total, value) => total + value, 0) / participantValues.length;
    const cells = HEATMAP_STAGES.map((stage, index) => {
      const reached = participantValues.filter((value) => value >= index).length / participantValues.length;
      return {
        stage: stage.key,
        label: stage.label,
        // Percentage is rounded and only emitted for rows with 5+ participants.
        value: Math.round(reached * 100),
        intensity: Math.max(0, Math.min(1, reached)),
      };
    });

    return {
      key: dimension.key,
      label: dimension.label,
      participantBand: `${BEHAVIOURAL_SPONSOR_THRESHOLD}+ participants`,
      averageProgressIndex: Math.round(averageProgress * 100) / 100,
      progressLabel: heatmapCellLabel(averageProgress),
      cells,
    };
  });

  return {
    eligible: true,
    threshold: BEHAVIOURAL_SPONSOR_THRESHOLD,
    participantCount: participantIds.length,
    dimensions: dimensionRows,
    privacyBoundary: "Anonymized cohort patterns only. Values are emitted only for dimensions with 5+ participants; individual moments, diagnostic answers, move phrases, actions, reflections, and simulator transcripts are excluded.",
  } as const;
}
