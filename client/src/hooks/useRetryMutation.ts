import { toast } from "sonner";
import { useCallback, useRef, useState } from "react";

/**
 * Detects whether a tRPC/TRPCClientError is a rate-limiting (429) error.
 */
function isRateLimitError(error: any): boolean {
  // tRPC maps HTTP 429 to TOO_MANY_REQUESTS
  if (error?.data?.code === "TOO_MANY_REQUESTS") return true;
  if (error?.data?.httpStatus === 429) return true;
  // Some proxies/rate-limiters return a generic message
  if (typeof error?.message === "string" && /too many requests|rate limit/i.test(error.message)) return true;
  return false;
}

interface RetryOptions {
  /** Maximum number of automatic retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelay?: number;
  /** Maximum delay cap in ms (default: 10000) */
  maxDelay?: number;
  /** Called when a retry is scheduled; receives attempt number and delay */
  onRetry?: (attempt: number, delay: number) => void;
}

/**
 * Wraps a tRPC mutate function to automatically retry on rate-limit (429) errors
 * with exponential backoff. For non-rate-limit errors, the original mutation's
 * error handling (onError, global toast) applies normally.
 *
 * Usage:
 *   const mutation = trpc.ciReport.generateAnalysis.useMutation({ ... });
 *   const { mutateWithRetry, isRetrying, retryCount } = useRetryMutation(mutation, {
 *     maxRetries: 3,
 *   });
 *   // Then call mutateWithRetry(variables) instead of mutation.mutate(variables)
 */
export function useRetryMutation<TVariables = unknown, TData = unknown>(
  mutation: {
    mutate: (vars: TVariables, opts?: any) => void;
    mutateAsync: (vars: TVariables, opts?: any) => Promise<TData>;
    isPending: boolean;
    isError: boolean;
    error: any;
    data: TData | undefined;
    reset: () => void;
  },
  options?: RetryOptions
) {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, onRetry } = options ?? {};
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVarsRef = useRef<TVariables | null>(null);
  const attemptRef = useRef(0);

  const clearRetryTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const doRetry = useCallback(
    (vars: TVariables) => {
      const attempt = attemptRef.current;
      if (attempt >= maxRetries) {
        setIsRetrying(false);
        // Let the original mutation error surface via global handler
        return;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      attemptRef.current += 1;
      setRetryCount(attemptRef.current);
      setIsRetrying(true);

      onRetry?.(attemptRef.current, delay);

      toast.info(`Rate limited. Retrying in ${Math.round(delay / 1000)}s… (attempt ${attemptRef.current}/${maxRetries})`, {
        duration: delay + 500,
      });

      timeoutRef.current = setTimeout(() => {
        mutation.mutate(vars, {
          onError: (err: any) => {
            if (isRateLimitError(err)) {
              doRetry(vars);
            } else {
              setIsRetrying(false);
              attemptRef.current = 0;
              setRetryCount(0);
            }
          },
          onSuccess: () => {
            setIsRetrying(false);
            attemptRef.current = 0;
            setRetryCount(0);
          },
        });
      }, delay);
    },
    [mutation, maxRetries, baseDelay, maxDelay, onRetry]
  );

  const mutateWithRetry = useCallback(
    (vars: TVariables) => {
      clearRetryTimer();
      attemptRef.current = 0;
      setRetryCount(0);
      setIsRetrying(false);
      lastVarsRef.current = vars;

      mutation.mutate(vars, {
        onError: (err: any) => {
          if (isRateLimitError(err)) {
            doRetry(vars);
          }
          // Non-rate-limit errors fall through to the global mutation cache handler
        },
      });
    },
    [mutation, clearRetryTimer, doRetry]
  );

  const cancelRetry = useCallback(() => {
    clearRetryTimer();
    setIsRetrying(false);
    attemptRef.current = 0;
    setRetryCount(0);
  }, [clearRetryTimer]);

  return {
    mutateWithRetry,
    isRetrying,
    retryCount,
    cancelRetry,
    isPending: mutation.isPending || isRetrying,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
