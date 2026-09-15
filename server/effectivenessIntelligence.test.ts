import { describe, expect, it } from "vitest";
import {
  calculateCapacityAllocation,
  calculateCapacityGap,
  ALTITUDE_CAPACITY_TARGETS,
  projectDiaryToWeeklyActivities,
  type WorkActivityInput,
} from "../shared/modules/effectivenessIntelligence";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(userId: number = 42): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-test-${userId}`,
      email: `leader${userId}@example.com`,
      name: "Alex Morgan",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Effectiveness Intelligence — Deterministic Domain Calculations", () => {
  const sampleActivities: WorkActivityInput[] = [
    {
      title: "Quarterly Strategy Review & Horizon Scanning",
      category: "strategic_thinking",
      weeklyHours: 4,
      frequency: "weekly",
      workAtLevel: "at_level",
      reallocation: "elevate",
      judgmentRequirement: "high",
      delegationPotential: "none",
      aiAugmentationPotential: "analysis",
    },
    {
      title: "Bi-weekly 1:1 Coaching with Direct Reports",
      category: "people_development",
      weeklyHours: 6,
      frequency: "weekly",
      workAtLevel: "at_level",
      reallocation: "elevate",
      judgmentRequirement: "high",
      delegationPotential: "none",
      aiAugmentationPotential: "none",
    },
    {
      title: "Operational Status Checking & Sprint Blocker Syncs",
      category: "operational_execution",
      weeklyHours: 12,
      frequency: "daily",
      workAtLevel: "below_level",
      reallocation: "eliminate",
      judgmentRequirement: "low",
      delegationPotential: "full",
      aiAugmentationPotential: "drafting",
    },
    {
      title: "Routine Administrative Approvals & Timesheets",
      category: "administrative_reporting",
      weeklyHours: 4,
      frequency: "weekly",
      workAtLevel: "below_level",
      reallocation: "automate",
      judgmentRequirement: "low",
      delegationPotential: "full",
      aiAugmentationPotential: "full",
    },
    {
      title: "Cross-Functional Coordination Meetings",
      category: "meetings_coordination",
      weeklyHours: 8,
      frequency: "weekly",
      workAtLevel: "at_level",
      reallocation: "simplify",
      judgmentRequirement: "medium",
      delegationPotential: "partial",
      aiAugmentationPotential: "drafting",
    },
    {
      title: "Reactive Incident Firefighting",
      category: "firefighting_reactive",
      weeklyHours: 6,
      frequency: "weekly",
      workAtLevel: "at_level",
      reallocation: "simplify",
      judgmentRequirement: "medium",
      delegationPotential: "partial",
      aiAugmentationPotential: "none",
    },
  ];

  it("calculates allocation percentages and identifies recoverable hours accurately", () => {
    const totalHours = 40;
    const result = calculateCapacityAllocation(sampleActivities, totalHours);

    expect(result.currentAllocation.strategic_thinking).toBe(10);
    expect(result.currentAllocation.people_development).toBe(15);
    expect(result.currentAllocation.operational_execution).toBe(30);
    expect(result.currentAllocation.administrative_reporting).toBe(10);
    expect(result.currentAllocation.meetings_coordination).toBe(20);
    expect(result.currentAllocation.firefighting_reactive).toBe(15);

    // Operational execution (12h eliminate) + admin (4h automate) = 16h
    // Plus 40% of meetings (8 * 0.4 = 3.2h) + firefighting (6 * 0.4 = 2.4h) = 21.6h
    expect(result.recoverableHours).toBeGreaterThanOrEqual(16);
    expect(result.workBelowLevelHours).toBe(16);
    expect(result.workBelowLevelPercent).toBe(40);
  });

  it("calculates capacity gap score against altitude targets", () => {
    const totalHours = 40;
    const { currentAllocation } = calculateCapacityAllocation(sampleActivities, totalHours);
    const target = ALTITUDE_CAPACITY_TARGETS.manager;

    const gap = calculateCapacityGap(currentAllocation, target);

    expect(gap.gapScore).toBeGreaterThan(0);
    expect(gap.gapScore).toBeLessThanOrEqual(100);
    expect(gap.largestSurplus.category).toBe("operational_execution");
  });

  it("projects participant-reported diary entries into a five-day weekly activity view", () => {
    const projected = projectDiaryToWeeklyActivities([
      { category: "meetings_coordination", hours: 2, workAtLevel: "below_level", reallocation: "simplify" },
      { category: "meetings_coordination", hours: 1, workAtLevel: "at_level", reallocation: "simplify" },
      { category: "strategic_thinking", hours: 2, workAtLevel: "above_level_strategic", reallocation: "elevate" },
    ], 2);

    expect(projected).toHaveLength(2);
    expect(projected.find((activity) => activity.category === "meetings_coordination")?.weeklyHours).toBe(7.5);
    expect(projected.find((activity) => activity.category === "meetings_coordination")?.workAtLevel).toBe("below_level");
    expect(projected.find((activity) => activity.category === "strategic_thinking")?.weeklyHours).toBe(5);
  });
});

describe("Effectiveness Intelligence — Router Procedures", () => {
  it("allows querying getDashboard cleanly even before a scan exists", async () => {
    const ctx = createMockContext(9999);
    const caller = appRouter.createCaller(ctx);

    const dashboard = await caller.effectiveness.getDashboard();

    expect(dashboard).toBeDefined();
    expect(dashboard.hasCompletedScan).toBe(false);
    expect(dashboard.scan).toBeNull();
    expect(Array.isArray(dashboard.contracts)).toBe(true);
    expect(Array.isArray(dashboard.evidence)).toBe(true);
  });
});
