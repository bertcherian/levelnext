import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

vi.mock("../db", () => ({ getDb: vi.fn() }));

import { getDb } from "../db";
import { criticalThinkingRouter } from "./criticalThinking";

function contextFor(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: 31,
      openId: `critical-thinking-${role}`,
      name: "Critical Thinking Test User",
      email: "critical-thinking@example.com",
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function membershipDb(role: "owner" | "admin" | "member") {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.limit.mockResolvedValue([{ tenantId: 7, role }]);
  return { select: vi.fn(() => chain) };
}

function noOwnedReportDb() {
  const chain = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  };
  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.limit.mockResolvedValue([]);
  return { select: vi.fn(() => chain) };
}

function tenantCampaignCreateDb() {
  const membershipChain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
  membershipChain.from.mockReturnValue(membershipChain);
  membershipChain.where.mockReturnValue(membershipChain);
  membershipChain.limit.mockResolvedValue([{ tenantId: 7, role: "admin" }]);
  const insert = vi.fn()
    .mockReturnValueOnce({ values: vi.fn(() => ({ $returningId: vi.fn().mockResolvedValue([{ id: 44 }]) })) })
    .mockReturnValueOnce({ values: vi.fn(() => ({})) });
  return { select: vi.fn(() => membershipChain), insert };
}

function platformCampaignListDb() {
  const campaignChain = { from: vi.fn(), innerJoin: vi.fn(), orderBy: vi.fn() };
  campaignChain.from.mockReturnValue(campaignChain);
  campaignChain.innerJoin.mockReturnValue(campaignChain);
  campaignChain.orderBy.mockResolvedValue([]);
  return { select: vi.fn(() => campaignChain) };
}

function platformStatusDb() {
  const campaignChain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
  campaignChain.from.mockReturnValue(campaignChain);
  campaignChain.where.mockReturnValue(campaignChain);
  campaignChain.limit.mockResolvedValue([{ id: 8, tenantId: 7 }]);
  const updateChain = { set: vi.fn(), where: vi.fn() };
  updateChain.set.mockReturnValue(updateChain);
  updateChain.where.mockResolvedValue({});
  const insert = vi.fn(() => ({ values: vi.fn(() => ({})) }));
  return { select: vi.fn(() => campaignChain), update: vi.fn(() => updateChain), insert };
}

function queryChain(rows: unknown[]) {
  const chain = { from: vi.fn(), innerJoin: vi.fn(), leftJoin: vi.fn(), where: vi.fn(), limit: vi.fn(), orderBy: vi.fn() };
  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.leftJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.limit.mockResolvedValue(rows);
  chain.orderBy.mockResolvedValue(rows);
  return chain;
}

function directWhereQuery(rows: unknown[]) {
  const chain = { from: vi.fn(), where: vi.fn() };
  chain.from.mockReturnValue(chain);
  chain.where.mockResolvedValue(rows);
  return chain;
}

function tenantUpdateDb() {
  const updateChain = { set: vi.fn(), where: vi.fn() };
  updateChain.set.mockReturnValue(updateChain);
  updateChain.where.mockResolvedValue({});
  const insert = vi.fn(() => ({ values: vi.fn(() => ({})) }));
  return {
    select: vi.fn()
      .mockReturnValueOnce(queryChain([{ tenantId: 7, role: "admin" }]))
      .mockReturnValueOnce(queryChain([{ id: 44, tenantId: 7 }])),
    update: vi.fn(() => updateChain),
    insert,
  };
}

function tenantParticipantDb() {
  const insert = vi.fn()
    .mockReturnValueOnce({ values: vi.fn(() => ({ $returningId: vi.fn().mockResolvedValue([{ id: 123 }]) })) })
    .mockReturnValueOnce({ values: vi.fn(() => ({})) });
  return {
    select: vi.fn()
      .mockReturnValueOnce(queryChain([{ tenantId: 7, role: "admin" }]))
      .mockReturnValueOnce(queryChain([{ id: 44, tenantId: 7 }]))
      .mockReturnValueOnce(queryChain([{ id: 51, name: "Enrolled User", email: "enrolled@example.com" }])),
    insert,
  };
}

function tenantDashboardDb() {
  return {
    select: vi.fn()
      .mockReturnValueOnce(queryChain([{ tenantId: 7, role: "admin" }]))
      .mockReturnValueOnce(queryChain([{ id: 44, tenantId: 7, minTeamSize: 5, namedReportAccess: false }]))
      .mockReturnValueOnce(queryChain([]))
      .mockReturnValueOnce(directWhereQuery([])),
  };
}

describe("criticalThinking router access boundaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a participant from platform-level campaign oversight and status control before database access", async () => {
    const caller = criticalThinkingRouter.createCaller(contextFor("user"));

    await expect(caller.platformCampaigns()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.platformSetCampaignStatus({ campaignId: 8, status: "closed" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("rejects a tenant member from campaign administration", async () => {
    vi.mocked(getDb).mockResolvedValue(membershipDb("member") as never);
    const caller = criticalThinkingRouter.createCaller(contextFor("user"));

    await expect(caller.adminCampaigns()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a participant attempting to load another participant's report", async () => {
    vi.mocked(getDb).mockResolvedValue(noOwnedReportDb() as never);
    const caller = criticalThinkingRouter.createCaller(contextFor("user"));

    await expect(caller.getMyReport({ reportId: 99 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows a tenant administrator to create a campaign within their tenant", async () => {
    vi.mocked(getDb).mockResolvedValue(tenantCampaignCreateDb() as never);
    const caller = criticalThinkingRouter.createCaller(contextFor("user"));

    await expect(caller.createCampaign({ name: "Leadership cohort", reportingGroup: "Senior leaders", status: "active" })).resolves.toEqual({ campaignId: 44 });
  });

  it("allows a platform administrator to list campaign health and control an existing campaign status", async () => {
    vi.mocked(getDb).mockResolvedValue(platformCampaignListDb() as never);
    const caller = criticalThinkingRouter.createCaller(contextFor("admin"));
    await expect(caller.platformCampaigns()).resolves.toEqual([]);

    vi.mocked(getDb).mockResolvedValue(platformStatusDb() as never);
    await expect(caller.platformSetCampaignStatus({ campaignId: 8, status: "closed" })).resolves.toEqual({ updated: true });
  });

  it("allows a tenant administrator to update a campaign within their own tenant", async () => {
    vi.mocked(getDb).mockResolvedValue(tenantUpdateDb() as never);
    const caller = criticalThinkingRouter.createCaller(contextFor("user"));

    await expect(caller.updateCampaign({ campaignId: 44, name: "Updated leadership cohort" })).resolves.toEqual({ updated: true });
  });

  it("allows a tenant administrator to enrol a participant in an owned campaign", async () => {
    vi.mocked(getDb).mockResolvedValue(tenantParticipantDb() as never);
    const caller = criticalThinkingRouter.createCaller(contextFor("user"));

    await expect(caller.addParticipant({ campaignId: 44, email: "enrolled@example.com", participantRole: "Director" })).resolves.toEqual({ participantId: 123 });
  });

  it("allows a tenant administrator to view only the selected tenant campaign dashboard", async () => {
    vi.mocked(getDb).mockResolvedValue(tenantDashboardDb() as never);
    const caller = criticalThinkingRouter.createCaller(contextFor("user"));

    await expect(caller.campaignDashboard({ campaignId: 44 })).resolves.toMatchObject({
      campaign: { id: 44, tenantId: 7 },
      participantSummary: [],
      aggregateEligible: false,
      remainingForTeamReport: 5,
    });
  });
});
