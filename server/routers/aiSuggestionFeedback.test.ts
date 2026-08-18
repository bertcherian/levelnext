import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

vi.mock("../db", () => ({ getDb: vi.fn() }));

import { getDb } from "../db";
import { aiSuggestionFeedbackRouter } from "./aiSuggestionFeedback";

function context(): TrpcContext {
  return {
    user: { id: 7, openId: "feedback-user", name: "Feedback User", email: null, loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
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
});
