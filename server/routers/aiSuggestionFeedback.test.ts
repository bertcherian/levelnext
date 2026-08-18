import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

vi.mock("../db", () => ({ getDb: vi.fn() }));

import { getDb } from "../db";
import { aiSuggestionFeedbackRouter } from "./aiSuggestionFeedback";

function context(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: { id: 7, openId: "feedback-user", name: "Feedback User", email: null, loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function feedbackQuery(rows: unknown[]) {
  const chain: any = { from: () => chain, where: () => chain, orderBy: () => chain, limit: async () => rows };
  return chain;
}

describe("AI suggestion feedback", () => {
  it("stores an authenticated user-owned snapshot of a flagged suggestion", async () => {
    const returningId = vi.fn().mockResolvedValue([{ id: 42 }]);
    const values = vi.fn().mockReturnValue({ $returningId: returningId });
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue({ insert: vi.fn().mockReturnValue({ values }) });

    const result = await aiSuggestionFeedbackRouter.createCaller(context()).submit({
      surface: "pe_daily_brief",
      suggestionKind: "development_suggestion",
      contentKey: "pe-daily-brief:2026-08-18",
      reason: "malformed",
      contentSnapshot: "AI fluency and helping teams work confidently with AI.",
    });

    expect(result).toEqual({ id: 42, success: true });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, reason: "malformed", surface: "pe_daily_brief" }));
  });

  it("returns only matching recent feedback entries in reliability order for the authenticated manager", async () => {
    const now = new Date();
    const old = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    const entries = [
      { id: 1, userId: 7, reason: "helpful", createdAt: now, contentSnapshot: "Helpful response" },
      { id: 2, userId: 7, reason: "unhelpful", createdAt: now, contentSnapshot: "Unhelpful response" },
      { id: 3, userId: 7, reason: "malformed", createdAt: old, contentSnapshot: "Old text issue" },
    ];
    const select = vi.fn(() => feedbackQuery(entries));
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue({ select });
    const result = await aiSuggestionFeedbackRouter.createCaller(context()).listMine({ reliability: "all", dateRange: "30d", sort: "reliability" });
    expect(result.map((entry) => entry.reason)).toEqual(["unhelpful", "helpful"]);
    expect(select).toHaveBeenCalledTimes(1);
  });

  it("builds a private manager trend and rating distribution from the current user’s feedback", async () => {
    const now = new Date();
    const entries = [
      { createdAt: now, reason: "helpful" },
      { createdAt: now, reason: "helpful" },
      { createdAt: now, reason: "unhelpful" },
    ];
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue({ select: vi.fn(() => feedbackQuery(entries)) });
    const result = await aiSuggestionFeedbackRouter.createCaller(context()).getMyFeedbackAnalytics({ days: 7 });
    expect(result.distribution).toMatchObject({ total: 3, helpful: 2, unhelpful: 1, malformed: 0, helpfulRate: 67 });
    expect(result.trend.reduce((total, day) => total + day.total, 0)).toBe(3);
  });

  it("restricts weekly platform AI-quality aggregation to administrators", async () => {
    await expect(aiSuggestionFeedbackRouter.createCaller(context()).getWeeklyQualitySummary()).rejects.toMatchObject({ code: "FORBIDDEN" });
    const now = new Date();
    const entries = [{ createdAt: now, reason: "helpful", surface: "manager_daily_brief" }, { createdAt: now, reason: "malformed", surface: "manager_daily_brief" }];
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue({ select: vi.fn(() => feedbackQuery(entries)) });
    const result = await aiSuggestionFeedbackRouter.createCaller(context("admin")).getWeeklyQualitySummary();
    expect(result.feedback).toMatchObject({ total: 2, helpful: 1, malformed: 1, helpfulRate: 50 });
    expect(result.surfaces).toEqual([{ surface: "manager_daily_brief", count: 2 }]);
  });
});
