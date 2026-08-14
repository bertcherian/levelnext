import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyseExecutiveSituation: vi.fn(async (input: { mode: string }) => ({
    framing: "A protected test analysis.", primaryIntelligence: "enterprise", attentionItems: [], notice: "", interpretation: "", assumptions: [], alternativeOptions: [], tradeOff: "", stakeholderLens: "", decisionQuality: "", outcomeQuality: "", evidenceLevel: "signal", nextBestAction: "", confidence: "low", mode: input.mode,
  })),
  db: {
    select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) })),
  },
}));

vi.mock("../db", () => ({ getDb: async () => mocks.db }));
vi.mock("../executiveIntelligence", () => ({ analyseExecutiveSituation: mocks.analyseExecutiveSituation }));

import { executiveIntelligenceRouter } from "./executiveIntelligence";

const ctx = {
  user: { id: 42, openId: "executive-test", role: "user", name: "Executive", email: null, loginMethod: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as any,
  res: {} as any,
} as any;

describe("Executive Intelligence action modes", () => {
  it("accepts and forwards Prepare, Think, Challenge, and Debrief modes to executive analysis", async () => {
    const caller = executiveIntelligenceRouter.createCaller(ctx);
    for (const mode of ["prepare", "think", "challenge", "debrief"] as const) {
      await caller.thinkWithMe({ situation: `A consequential ${mode} situation requires executive attention.`, mode });
      expect(mocks.analyseExecutiveSituation).toHaveBeenLastCalledWith(expect.objectContaining({ mode }));
    }
  });
});
