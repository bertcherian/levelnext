import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const { invokeLLM } = vi.hoisted(() => ({ invokeLLM: vi.fn() }));

vi.mock("../db", () => ({ getDb: vi.fn() }));
vi.mock("../_core/llm", () => ({ invokeLLM }));

import { getDb } from "../db";
import {
  peAssessmentResults,
  peCalendarIntegrations,
  peCommitments,
  peDailyBriefs,
  peProfiles,
  users,
} from "../../drizzle/schema";
import { peiRouter, shouldReuseDailyBrief } from "./pei";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("PEI daily brief refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses the existing brief for automatic requests", () => {
    expect(shouldReuseDailyBrief({ greeting: "Good morning" }, false)).toBe(true);
  });

  it("regenerates an existing brief when the user requests a refresh", () => {
    expect(shouldReuseDailyBrief({ greeting: "Good morning" }, true)).toBe(false);
  });

  it("does not reuse an empty stored brief", () => {
    expect(shouldReuseDailyBrief(null, false)).toBe(false);
  });

  it("regenerates and overwrites an existing brief for a manual refresh", async () => {
    const existingBrief = { greeting: "Stored brief" };
    const refreshedBrief = {
      greeting: "Fresh brief",
      dayTheme: "Focused execution",
      priorityFocus: "Complete the highest-impact task.",
      calendarItems: [],
      developmentSuggestion: { topic: "Focus", why: "It matters", action: "Block time" },
      reflectionQuestion: "What can wait?",
      commitmentReminder: null,
      coachingNudge: "Start now.",
    };
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    const update = vi.fn().mockReturnValue({ set: updateSet });

    const mockDb = {
      select: vi.fn(() => ({
        from: vi.fn((table) => {
          if (table === peDailyBriefs) {
            return { where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ brief: existingBrief }]) }) };
          }
          if (table === peProfiles) {
            return { where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) };
          }
          if (table === users) {
            return { where: vi.fn().mockResolvedValue([{ name: "Test User" }]) };
          }
          if (table === peAssessmentResults) {
            return { where: vi.fn().mockReturnValue({ orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) };
          }
          if (table === peCommitments || table === peCalendarIntegrations) {
            return { where: vi.fn().mockResolvedValue([]) };
          }
          throw new Error("Unexpected table query");
        }),
      })),
      update,
      insert: vi.fn(),
    };

    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);
    invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(refreshedBrief) } }] });

    const result = await peiRouter.createCaller(createAuthContext()).generateDailyBrief({ refresh: true });

    expect(result).toEqual(refreshedBrief);
    expect(invokeLLM).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith(peDailyBriefs);
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ brief: refreshedBrief }));
    expect(updateWhere).toHaveBeenCalledOnce();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
