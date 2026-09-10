import { describe, expect, it } from "vitest";
import { TRPCClientError } from "@trpc/client";
import { shouldRetryAuthQuery } from "./useAuth";

describe("shouldRetryAuthQuery", () => {
  it("retries transient transport failures twice", () => {
    expect(shouldRetryAuthQuery(0, new TypeError("Failed to fetch"))).toBe(true);
    expect(shouldRetryAuthQuery(1, new TypeError("Failed to fetch"))).toBe(true);
    expect(shouldRetryAuthQuery(2, new TypeError("Failed to fetch"))).toBe(false);
  });

  it("does not retry a confirmed unauthorized response", () => {
    const unauthorized = Object.create(TRPCClientError.prototype) as TRPCClientError<any>;
    Object.defineProperty(unauthorized, "data", {
      value: { code: "UNAUTHORIZED" },
      enumerable: true,
    });

    expect(shouldRetryAuthQuery(0, unauthorized)).toBe(false);
  });
});
