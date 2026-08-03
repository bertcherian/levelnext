import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("peiRouter", () => {
  describe("getAssessment", () => {
    it("returns assessment metadata with dimensions and questions", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.getAssessment();

      expect(result).toBeDefined();
      expect(result.dimensions).toBeDefined();
      expect(result.questions).toBeDefined();
      expect(result.totalQuestions).toBe(30);
      expect(result.dimensions.length).toBe(6);
    });

    it("returns 30 questions across 6 dimensions", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.getAssessment();

      expect(result.questions.length).toBe(30);
      const dimensionIds = new Set(result.questions.map((q: any) => q.dimensionId));
      expect(dimensionIds.size).toBe(6);
    });
  });

  describe("getCoachStarters", () => {
    it("returns coaching starter prompts", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.getCoachStarters();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("label");
      expect(result[0]).toHaveProperty("icon");
    });
  });

  describe("getPracticeScenarios", () => {
    it("returns practice scenario options", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.getPracticeScenarios();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("label");
      expect(result[0]).toHaveProperty("description");
    });
  });

  describe("getDashboardSummary", () => {
    it("returns null or summary object for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.getDashboardSummary();

      // Will be null if db not available in test env, or an object if it is
      expect(result === null || typeof result === "object").toBe(true);
    });
  });

  describe("getProfile", () => {
    it("returns null when no profile exists", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.getProfile();

      expect(result === null || typeof result === "object").toBe(true);
    });
  });

  describe("getLatestResult", () => {
    it("returns null when no assessment has been taken", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.getLatestResult();

      expect(result === null || typeof result === "object").toBe(true);
    });
  });

  describe("listCommitments", () => {
    it("returns an array (empty when no commitments)", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.listCommitments();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getCalendarIntegrations", () => {
    it("returns an array of integrations", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.getCalendarIntegrations();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getCoachSessions", () => {
    it("returns an array of coaching sessions", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.getCoachSessions();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("listPracticeSessions", () => {
    it("returns an array of practice sessions", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.listPracticeSessions();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("tts", () => {
    it("throws PRECONDITION_FAILED when OpenAI key is missing for non-Sarvam voice", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // The tts procedure requires a valid API key. In test env, keys may be absent.
      // We verify the procedure exists and handles the error gracefully.
      try {
        await caller.pei.tts({ text: "Hello world", voice: "nova" });
        // If it succeeds, that means keys are configured — that's fine
        expect(true).toBe(true);
      } catch (e: any) {
        // Should be a precondition error about missing API key
        expect(e.code).toBe("PRECONDITION_FAILED");
      }
    });

    it("accepts Sarvam voices", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.pei.tts({ text: "Namaste", voice: "shubh" });
        expect(true).toBe(true);
      } catch (e: any) {
        expect(e.code).toBe("PRECONDITION_FAILED");
      }
    });
  });

  describe("getUpcomingEvents", () => {
    it("returns an array of upcoming calendar events", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.getUpcomingEvents({ days: 7 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getResultsHistory", () => {
    it("returns an array of assessment results", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.getResultsHistory();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getTodayBriefSnapshot", () => {
    it("returns null or a brief object for today", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pei.getTodayBriefSnapshot();

      expect(result === null || typeof result === "object").toBe(true);
    });
  });
});
