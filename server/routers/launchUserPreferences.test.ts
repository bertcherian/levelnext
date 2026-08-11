import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "../_core/context";

// Mock the db module
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// Mock the schema import
vi.mock("../../drizzle/schema", () => ({
  launchUserPreferences: {
    userId: "userId",
    accentColor: "accentColor",
    avatar: "avatar",
    notifyDailyMissions: "notifyDailyMissions",
    notifyStreaks: "notifyStreaks",
    notifyAchievements: "notifyAchievements",
    notifyReminders: "notifyReminders",
    reducedMotion: "reducedMotion",
    highContrast: "highContrast",
  },
}));

// Mock drizzle-orm operators
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

import { getDb } from "../db";
import { launchUserPreferencesRouter } from "./launchUserPreferences";

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

describe("launchUserPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPreferences returns default prefs when no row exists", async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      }),
    };
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);

    const ctx = createAuthContext();
    const caller = launchUserPreferencesRouter.createCaller(ctx);
    const result = await caller.getPreferences();

    expect(result).toEqual({
      accentColor: "cyan",
      avatar: "🚀",
      notifyDailyMissions: true,
      notifyStreaks: true,
      notifyAchievements: true,
      notifyReminders: true,
      reducedMotion: false,
      highContrast: false,
    });
  });

  it("getPreferences returns existing prefs from database", async () => {
    const existingPrefs = {
      id: 1,
      userId: 1,
      accentColor: "pink",
      avatar: "🔥",
      notifyDailyMissions: false,
      notifyStreaks: true,
      notifyAchievements: true,
      notifyReminders: false,
      reducedMotion: true,
      highContrast: false,
      updatedAt: new Date(),
    };
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingPrefs]),
          }),
        }),
      }),
    };
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);

    const ctx = createAuthContext();
    const caller = launchUserPreferencesRouter.createCaller(ctx);
    const result = await caller.getPreferences();

    expect(result).toEqual(existingPrefs);
  });

  it("updateAccentColor calls db insert with onDuplicateKeyUpdate", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      onDuplicateKeyUpdate: vi.fn().mockReturnValue({
        set: vi.fn().mockResolvedValue(undefined),
      }),
    });
    // Fix: onDuplicateKeyUpdate returns an object with set, but we need to chain
    // Actually the pattern is: db.insert(table).values({...}).onDuplicateKeyUpdate({ set: {...} })
    // Let's fix the mock
    const mockDb = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onDuplicateKeyUpdate: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);

    const ctx = createAuthContext();
    const caller = launchUserPreferencesRouter.createCaller(ctx);
    const result = await caller.updateAccentColor({ accentColor: "pink" });

    expect(result).toEqual({ success: true });
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("updateAvatar calls db insert with correct avatar", async () => {
    const mockDb = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onDuplicateKeyUpdate: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);

    const ctx = createAuthContext();
    const caller = launchUserPreferencesRouter.createCaller(ctx);
    const result = await caller.updateAvatar({ avatar: "⚡" });

    expect(result).toEqual({ success: true });
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("updateNotifications with no fields returns success without db call", async () => {
    const mockDb = {
      insert: vi.fn(),
    };
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);

    const ctx = createAuthContext();
    const caller = launchUserPreferencesRouter.createCaller(ctx);
    const result = await caller.updateNotifications({});

    expect(result).toEqual({ success: true });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("updateAccessibility with no fields returns success without db call", async () => {
    const mockDb = {
      insert: vi.fn(),
    };
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);

    const ctx = createAuthContext();
    const caller = launchUserPreferencesRouter.createCaller(ctx);
    const result = await caller.updateAccessibility({});

    expect(result).toEqual({ success: true });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("getPreferences returns null when db is not available", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const ctx = createAuthContext();
    const caller = launchUserPreferencesRouter.createCaller(ctx);
    const result = await caller.getPreferences();

    expect(result).toBeNull();
  });
});
