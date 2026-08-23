import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { bootstrapSessionFromUrl, MAGIC_LINK_SESSION_STORAGE_KEY } from "@/lib/sessionAuth";

// ─── Magic-link Bearer-token bootstrap ───────────────────────────────────────
// After a magic link click the server appends ?_st=<token> to the redirect URL
// so the client can store the session token in sessionStorage.  This lets the
// tRPC httpBatchLink (below) forward it as "Authorization: Bearer <token>" on
// every request, which is the fallback when the SameSite=None cookie is blocked
// (Cloud Run cross-origin, Safari ITP, private browsing, WebView, etc.).
(function initialiseSessionFromUrl() {
  try {
    bootstrapSessionFromUrl({ location: window.location, history: window.history, storage: sessionStorage });
  } catch {
    // sessionStorage unavailable (e.g. private-browsing with strict settings)
  }
})();
// ─────────────────────────────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import { toast } from "sonner";
import App from "./App";
import { } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = "/login?returnTo=" + encodeURIComponent(window.location.pathname);
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

// Track which mutations have already shown a toast to avoid duplicates
// when a per-call onError handler is also present.
const toastedMutationIds = new WeakSet<object>();

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);

    // Show a global toast only if the mutation doesn't have its own onError
    // (detected by checking if the mutation options include an onError fn).
    const hasOwnOnError = !!(event.mutation.options as any)?.onError;
    if (!hasOwnOnError) {
      const msg =
        (error as any)?.data?.zodError?.formErrors?.errors?.[0] ??
        (error as any)?.message ??
        (error as any)?.shape?.message ??
        "Something went wrong. Please try again.";
      toast.error(
        typeof msg === "string" ? msg : "Something went wrong. Please try again.",
        { duration: 6000 }
      );
    }
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Preview auto-login fallback: when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView), the runtime mirrors the
        // session into sessionStorage so we can forward it as a Bearer token.
        // The regular OAuth cookie flow keeps working and takes priority server-side.
        try {
          const raw = sessionStorage.getItem(MAGIC_LINK_SESSION_STORAGE_KEY);
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
