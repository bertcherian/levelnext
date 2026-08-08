import { toast } from "sonner";

/**
 * Default error handler for tRPC useMutation calls.
 * Logs the error to the console and shows a user-friendly toast notification.
 *
 * Usage:
 *   const mutate = trpc.foo.bar.useMutation(defaultMutationError("foo.bar"));
 *
 * Or spread into an existing options object:
 *   const mutate = trpc.foo.bar.useMutation({
 *     ...defaultMutationError("foo.bar"),
 *     onSuccess: () => { ... },
 *   });
 */
export function defaultMutationError(context?: string) {
  return {
    onError: (error: any) => {
      const label = context ? `[${context}]` : "[Mutation]";
      console.error(`${label} Error:`, error);

      const message =
        error?.data?.zodError?.formErrors?.errors?.[0] ??
        error?.message ??
        error?.shape?.message ??
        "Something went wrong. Please try again.";

      toast.error(
        typeof message === "string" ? message : "Something went wrong. Please try again.",
        {
          duration: 6000,
          action: {
            label: "Dismiss",
            onClick: () => {},
          },
        }
      );
    },
  };
}
