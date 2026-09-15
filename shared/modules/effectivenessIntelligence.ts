/**
 * LevelNext Leadership Effectiveness Intelligence Platform™
 * Shared Domain Models, Types, Benchmarks, and Zod Schemas
 *
 * Implements:
 *   1. Leadership Work Genome (8 standard categories, 6-way reallocation)
 *   2. Work-at-Level Taxonomy (below_level, at_level, above_level_strategic)
 *   3. Leadership Capacity Intelligence & Gap Calculations
 *   4. 7-Level Leadership Evidence Ladder
 *   5. Opportunity Scan Synthesis & 3 High-Leverage Behaviors
 *   6. Leadership Behavior Change Contracts
 *   7. Next Best Leadership Action (NBLA) Engine
 */

import { z } from "zod";

// ── 1. Work Genome Vocabulary ──────────────────────────────────────────────────

export const LEADERSHIP_WORK_CATEGORIES = [
  "strategic_thinking",
  "people_development",
  "stakeholder_leadership",
  "decision_making",
  "operational_execution",
  "meetings_coordination",
  "administrative_reporting",
  "firefighting_reactive",
] as const;

export type LeadershipWorkCategory = typeof LEADERSHIP_WORK_CATEGORIES[number];

export const LEADERSHIP_WORK_CATEGORY_LABELS: Record<LeadershipWorkCategory, string> = {
  strategic_thinking: "Strategic Thinking & Vision",
  people_development: "People Development & Coaching",
  stakeholder_leadership: "Stakeholder Management & Alignment",
  decision_making: "High-Leverage Decision Making",
  operational_execution: "Operational Execution & Oversight",
  meetings_coordination: "Coordination & Status Syncs",
  administrative_reporting: "Reporting & Administration",
  firefighting_reactive: "Reactive Firefighting & Escalations",
};

export const WORK_AT_LEVEL_STATUS = [
  "below_level",
  "at_level",
  "above_level_strategic",
] as const;

export type WorkAtLevelStatus = typeof WORK_AT_LEVEL_STATUS[number];

export const WORK_REALLOCATION_TAXONOMY = [
  "eliminate",
  "simplify",
  "automate",
  "autonomize",
  "augment",
  "elevate",
] as const;

export type WorkReallocationTaxonomy = typeof WORK_REALLOCATION_TAXONOMY[number];

export const WORK_REALLOCATION_LABELS: Record<WorkReallocationTaxonomy, { label: string; action: string }> = {
  eliminate: { label: "Eliminate", action: "Stop doing this; question if the work creates any real outcome." },
  simplify: { label: "Simplify", action: "Redesign, shorten, or compress the process to reduce friction." },
  automate: { label: "Automate", action: "Hand over to deterministic rules, templates, or system tools." },
  autonomize: { label: "Autonomize", action: "Let AI synthesize drafts, status rollups, or prep notes." },
  augment: { label: "Augment", action: "Retain leader responsibility, but accelerate analysis using AI." },
  elevate: { label: "Elevate", action: "Protect and expand time spent here; this drives outsized leadership impact." },
};

// ── 2. Standard Capacity Benchmarks ───────────────────────────────────────────

export type CareerAltitude = "manager" | "senior_leader" | "executive";

export interface CapacityAllocation {
  strategic_thinking: number;
  people_development: number;
  stakeholder_leadership: number;
  decision_making: number;
  operational_execution: number;
  meetings_coordination: number;
  administrative_reporting: number;
  firefighting_reactive: number;
}

export const ALTITUDE_CAPACITY_TARGETS: Record<CareerAltitude, CapacityAllocation> = {
  manager: {
    strategic_thinking: 15,
    people_development: 20,
    stakeholder_leadership: 15,
    decision_making: 15,
    operational_execution: 15,
    meetings_coordination: 10,
    administrative_reporting: 5,
    firefighting_reactive: 5,
  },
  senior_leader: {
    strategic_thinking: 25,
    people_development: 20,
    stakeholder_leadership: 20,
    decision_making: 15,
    operational_execution: 10,
    meetings_coordination: 5,
    administrative_reporting: 3,
    firefighting_reactive: 2,
  },
  executive: {
    strategic_thinking: 35,
    people_development: 15,
    stakeholder_leadership: 25,
    decision_making: 15,
    operational_execution: 5,
    meetings_coordination: 3,
    administrative_reporting: 1,
    firefighting_reactive: 1,
  },
};

// ── 3. Evidence Ladder ────────────────────────────────────────────────────────

export const LEADERSHIP_EVIDENCE_LEVELS = [
  "L1_insight",
  "L2_practice",
  "L3_commitment",
  "L4_application",
  "L5_repetition",
  "L6_external_observation",
  "L7_business_effect",
] as const;

export type LeadershipEvidenceLevel = typeof LEADERSHIP_EVIDENCE_LEVELS[number];

export const EVIDENCE_LEVEL_METADATA: Record<LeadershipEvidenceLevel, { rank: number; label: string; description: string }> = {
  L1_insight: { rank: 1, label: "Level 1: Insight", description: "Leader reflects on and understands the underlying pattern or assumption." },
  L2_practice: { rank: 2, label: "Level 2: Practice", description: "Leader rehearses or simulates the behavior in Arena or voice simulator." },
  L3_commitment: { rank: 3, label: "Level 3: Commitment", description: "Leader formally contracts a specific real-world action with a deadline." },
  L4_application: { rank: 4, label: "Level 4: Real Application", description: "Leader conducts the action in the actual workplace with real stakeholders." },
  L5_repetition: { rank: 5, label: "Level 5: Repetition", description: "Behavior repeated multiple times over 3–6 weeks without regressing." },
  L6_external_observation: { rank: 6, label: "Level 6: External Observation", description: "Direct reports, peers, or managers observe and validate the shift." },
  L7_business_effect: { rank: 7, label: "Level 7: Business Effect", description: "Measurable recovery of leadership capacity, decision speed, or team ownership." },
};

export const CLAIM_TYPES = ["fact", "inference", "hypothesis"] as const;
export type ClaimType = typeof CLAIM_TYPES[number];

// ── 4. Next Best Leadership Action Types ──────────────────────────────────────

export const NBLA_ACTION_TYPES = [
  "do_nothing",
  "micro_reflection",
  "ontological_distinction",
  "simulation_practice",
  "real_world_commitment",
  "delegation_transfer",
  "meeting_redesign",
  "stakeholder_alignment",
  "coaching_conversation",
  "human_coach_escalation",
] as const;

export type NblaActionType = typeof NBLA_ACTION_TYPES[number];

// ── 5. Zod Schemas for API & Structured Output ────────────────────────────────

export const workActivityInputSchema = z.object({
  title: z.string().min(3).max(255),
  category: z.enum(LEADERSHIP_WORK_CATEGORIES),
  weeklyHours: z.number().min(0.25).max(40),
  frequency: z.string().max(100),
  workAtLevel: z.enum(WORK_AT_LEVEL_STATUS),
  reallocation: z.enum(WORK_REALLOCATION_TAXONOMY),
  decisionLevel: z.string().optional(),
  judgmentRequirement: z.enum(["low", "medium", "high"]).default("medium"),
  delegationPotential: z.enum(["none", "partial", "full"]).default("none"),
  aiAugmentationPotential: z.enum(["none", "drafting", "analysis", "full"]).default("none"),
  notes: z.string().max(1000).optional(),
});

export type WorkActivityInput = z.infer<typeof workActivityInputSchema>;

export const createWorkScanInputSchema = z.object({
  altitude: z.enum(["manager", "senior_leader", "executive"]).default("manager"),
  totalWorkHours: z.number().min(20).max(90).default(45),
  activities: z.array(workActivityInputSchema).min(3),
  contextNotes: z.string().max(2000).optional(),
});

export type CreateWorkScanInput = z.infer<typeof createWorkScanInputSchema>;

export const behaviorContractInputSchema = z.object({
  behaviorTitle: z.string().min(3).max(255),
  targetCategory: z.enum(LEADERSHIP_WORK_CATEGORIES),
  currentPattern: z.string().min(10).max(1000),
  desiredBehavior: z.string().min(10).max(1000),
  whyItMatters: z.string().min(10).max(1000),
  realWorldMoment: z.string().min(10).max(1000),
  targetEvidence: z.string().min(10).max(1000),
  targetCompletionDate: z.string().optional(),
  ontologicalDistinction: z.string().optional(),
  limitingNarrative: z.string().optional(),
});

export type BehaviorContractInput = z.infer<typeof behaviorContractInputSchema>;

export const recordEvidenceInputSchema = z.object({
  contractId: z.number().int().positive(),
  evidenceLevel: z.enum(LEADERSHIP_EVIDENCE_LEVELS),
  claimType: z.enum(CLAIM_TYPES).default("fact"),
  situation: z.string().min(10).max(1500),
  actionTaken: z.string().min(10).max(1500),
  observedOutcome: z.string().min(5).max(1500),
  capacityHoursRecovered: z.number().min(0).max(40).optional(),
  stakeholderConfirmed: z.boolean().default(false),
  reflectionNotes: z.string().max(2000).optional(),
});

export type RecordEvidenceInput = z.infer<typeof recordEvidenceInputSchema>;

// ── 6. Deterministic Capacity Calculation Helpers ─────────────────────────────

export function calculateCapacityAllocation(
  activities: WorkActivityInput[],
  totalWorkHours: number
): {
  currentAllocation: CapacityAllocation;
  recoverableHours: number;
  workBelowLevelHours: number;
  workBelowLevelPercent: number;
} {
  const totals: Record<LeadershipWorkCategory, number> = {
    strategic_thinking: 0,
    people_development: 0,
    stakeholder_leadership: 0,
    decision_making: 0,
    operational_execution: 0,
    meetings_coordination: 0,
    administrative_reporting: 0,
    firefighting_reactive: 0,
  };

  let workBelowLevelHours = 0;
  let recoverableHours = 0;

  for (const act of activities) {
    totals[act.category] = (totals[act.category] || 0) + act.weeklyHours;

    if (act.workAtLevel === "below_level") {
      workBelowLevelHours += act.weeklyHours;
    }

    if (
      act.reallocation === "eliminate" ||
      act.reallocation === "automate" ||
      act.reallocation === "autonomize"
    ) {
      recoverableHours += act.weeklyHours;
    } else if (act.reallocation === "simplify" || act.reallocation === "augment") {
      recoverableHours += act.weeklyHours * 0.4; // Conservative 40% reduction
    }
  }

  const denominator = Math.max(totalWorkHours, 1);
  const currentAllocation: CapacityAllocation = {
    strategic_thinking: Math.round((totals.strategic_thinking / denominator) * 100),
    people_development: Math.round((totals.people_development / denominator) * 100),
    stakeholder_leadership: Math.round((totals.stakeholder_leadership / denominator) * 100),
    decision_making: Math.round((totals.decision_making / denominator) * 100),
    operational_execution: Math.round((totals.operational_execution / denominator) * 100),
    meetings_coordination: Math.round((totals.meetings_coordination / denominator) * 100),
    administrative_reporting: Math.round((totals.administrative_reporting / denominator) * 100),
    firefighting_reactive: Math.round((totals.firefighting_reactive / denominator) * 100),
  };

  const workBelowLevelPercent = Math.round((workBelowLevelHours / denominator) * 100);

  return {
    currentAllocation,
    recoverableHours: Math.round(recoverableHours * 10) / 10,
    workBelowLevelHours: Math.round(workBelowLevelHours * 10) / 10,
    workBelowLevelPercent,
  };
}

export function calculateCapacityGap(
  current: CapacityAllocation,
  target: CapacityAllocation
): {
  gapScore: number;
  largestDeficit: { category: LeadershipWorkCategory; diffPercent: number };
  largestSurplus: { category: LeadershipWorkCategory; diffPercent: number };
} {
  let totalAbsDiff = 0;
  let maxDeficit = { category: "strategic_thinking" as LeadershipWorkCategory, diffPercent: 0 };
  let maxSurplus = { category: "operational_execution" as LeadershipWorkCategory, diffPercent: 0 };

  for (const cat of LEADERSHIP_WORK_CATEGORIES) {
    const diff = current[cat] - target[cat];
    totalAbsDiff += Math.abs(diff);

    if (diff < 0 && Math.abs(diff) > maxDeficit.diffPercent) {
      maxDeficit = { category: cat, diffPercent: Math.abs(diff) };
    }
    if (diff > 0 && diff > maxSurplus.diffPercent) {
      maxSurplus = { category: cat, diffPercent: diff };
    }
  }

  // Gap score: normalized 0-100 where 0 is perfect alignment and 100 is complete mismatch
  const gapScore = Math.min(100, Math.round(totalAbsDiff / 2));

  return {
    gapScore,
    largestDeficit: maxDeficit,
    largestSurplus: maxSurplus,
  };
}
