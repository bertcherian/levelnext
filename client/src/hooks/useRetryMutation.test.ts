// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// --- Mock the sonner toast so we can assert calls without side effects
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// --- Minimal mock mutation shape that useRetryMutation expects
function createMockMutation() {
  const handlers: { onError?: (e: any) => void; onSuccess?: (d: any) => void } = {};
  const mutate = vi.fn((vars: any, opts?: any) => {
    if (opts) {
      handlers.onError = opts.onError;
      handlers.onSuccess = opts.onSuccess;
    }
  });
  const mutateAsync = vi.fn(async (vars: any, opts?: any) => {
    if (opts) {
      handlers.onError = opts.onError;
      handlers.onSuccess = opts.onSuccess;
    }
    return undefined;
  });
  return {
    mutate,
    mutateAsync,
    isPending: false,
    isError: false,
    error: null as any,
    data: undefined,
    reset: vi.fn(),
    _handlers: handlers, // internal: so tests can trigger error/success
  };
}

// Rate-limit error shape (tRPC TOO_MANY_REQUESTS)
const rateLimitError = {
  data: { code: "TOO_MANY_REQUESTS", httpStatus: 429 },
  message: "Too many requests",
};

// Generic non-rate-limit error
const genericError = {
  data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
  message: "Something went wrong",
};

describe("useRetryMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not retry on non-rate-limit errors", async () => {
    const { useRetryMutation } = await import("./useRetryMutation");
    const mock = createMockMutation();
    const { result } = renderHook(() => useRetryMutation(mock as any, { maxRetries: 3, baseDelay: 100 }));

    act(() => {
      result.current.mutateWithRetry({ foo: "bar" });
    });

    expect(mock.mutate).toHaveBeenCalledTimes(1);
    expect(mock.mutate).toHaveBeenCalledWith({ foo: "bar" }, expect.objectContaining({ onError: expect.any(Function) }));

    // Trigger a generic error
    act(() => {
      mock._handlers.onError?.(genericError);
    });

    // Should not schedule a retry
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.retryCount).toBe(0);
  });

  it("should retry on rate-limit (429) errors with exponential backoff", async () => {
    const { useRetryMutation } = await import("./useRetryMutation");
    const mock = createMockMutation();
    const { result } = renderHook(() => useRetryMutation(mock as any, { maxRetries: 3, baseDelay: 100, maxDelay: 1000 }));

    act(() => {
      result.current.mutateWithRetry({ test: true });
    });

    expect(mock.mutate).toHaveBeenCalledTimes(1);

    // Trigger a rate-limit error
    act(() => {
      mock._handlers.onError?.(rateLimitError);
    });

    // Should be retrying
    expect(result.current.isRetrying).toBe(true);
    expect(result.current.retryCount).toBe(1);

    // Advance timers by 100ms (first backoff: 100 * 2^0 = 100)
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should have called mutate again
    expect(mock.mutate).toHaveBeenCalledTimes(2);

    // Trigger another rate-limit error for second retry
    act(() => {
      mock._handlers.onError?.(rateLimitError);
    });

    expect(result.current.retryCount).toBe(2);

    // Advance timers by 200ms (second backoff: 100 * 2^1 = 200)
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mock.mutate).toHaveBeenCalledTimes(3);
  });

  it("should stop retrying after maxRetries and let the error surface", async () => {
    const { useRetryMutation } = await import("./useRetryMutation");
    const mock = createMockMutation();
    const { result } = renderHook(() => useRetryMutation(mock as any, { maxRetries: 2, baseDelay: 50 }));

    act(() => {
      result.current.mutateWithRetry({ data: 1 });
    });

    // First 429 error
    act(() => {
      mock._handlers.onError?.(rateLimitError);
    });
    expect(result.current.retryCount).toBe(1);

    act(() => vi.advanceTimersByTime(50));
    expect(mock.mutate).toHaveBeenCalledTimes(2);

    // Second 429 error
    act(() => {
      mock._handlers.onError?.(rateLimitError);
    });
    expect(result.current.retryCount).toBe(2);

    act(() => vi.advanceTimersByTime(100));
    expect(mock.mutate).toHaveBeenCalledTimes(3);

    // Third 429 error — should NOT retry (maxRetries=2)
    act(() => {
      mock._handlers.onError?.(rateLimitError);
    });

    // No more retries
    act(() => vi.advanceTimersByTime(500));
    expect(mock.mutate).toHaveBeenCalledTimes(3);
    expect(result.current.isRetrying).toBe(false);
  });

  it("should reset retry state on success", async () => {
    const { useRetryMutation } = await import("./useRetryMutation");
    const mock = createMockMutation();
    const { result } = renderHook(() => useRetryMutation(mock as any, { maxRetries: 3, baseDelay: 100 }));

    act(() => {
      result.current.mutateWithRetry({ id: 42 });
    });

    // Trigger a rate-limit error
    act(() => {
      mock._handlers.onError?.(rateLimitError);
    });

    expect(result.current.isRetrying).toBe(true);
    expect(result.current.retryCount).toBe(1);

    // Advance timer and trigger success
    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      mock._handlers.onSuccess?.({ result: "ok" });
    });

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.retryCount).toBe(0);
  });

  it("should cancel pending retry when cancelRetry is called", async () => {
    const { useRetryMutation } = await import("./useRetryMutation");
    const mock = createMockMutation();
    const { result } = renderHook(() => useRetryMutation(mock as any, { maxRetries: 3, baseDelay: 100 }));

    act(() => {
      result.current.mutateWithRetry({ x: 1 });
    });

    // Trigger rate-limit error
    act(() => {
      mock._handlers.onError?.(rateLimitError);
    });

    expect(result.current.isRetrying).toBe(true);

    // Cancel
    act(() => {
      result.current.cancelRetry();
    });

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.retryCount).toBe(0);

    // Advance timers — no retry should happen
    act(() => vi.advanceTimersByTime(500));
    expect(mock.mutate).toHaveBeenCalledTimes(1);
  });
});
