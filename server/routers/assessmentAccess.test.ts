import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import {
  assertOwnedActiveSession,
  assertReportOwner,
} from "./assessmentAccess";

describe("Leader Intelligence P0 access controls", () => {
  const activeEciSession = {
    userId: 41,
    moduleType: "ECI",
    status: "in_progress",
  } as const;

  it("permits the owning user to continue an active matching assessment session", () => {
    expect(() => assertOwnedActiveSession(activeEciSession, 41, "ECI")).not.toThrow();
  });

  it("rejects an attempt to save or submit another user's assessment session", () => {
    try {
      assertOwnedActiveSession(activeEciSession, 99, "ECI");
      throw new Error("Expected session access to be denied");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
    }
  });

  it("rejects an attempt to submit a session as a different diagnostic module", () => {
    try {
      assertOwnedActiveSession(activeEciSession, 41, "LII");
      throw new Error("Expected a module mismatch to be denied");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("CONFLICT");
    }
  });

  it("rejects reuse of a completed assessment session", () => {
    try {
      assertOwnedActiveSession({ ...activeEciSession, status: "completed" }, 41, "ECI");
      throw new Error("Expected a completed session to be denied");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("CONFLICT");
    }
  });

  it("keeps a report private to its owner", () => {
    expect(() => assertReportOwner({ userId: 41 }, 41)).not.toThrow();
    try {
      assertReportOwner({ userId: 41 }, 99);
      throw new Error("Expected cross-user report access to be denied");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
    }
  });
});
