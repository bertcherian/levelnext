import React, { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { LoaderCircle, ShieldCheck } from "lucide-react";

export function managerEffectivenessReturnTo(pathname: string, search = "") {
  const safePath = pathname.startsWith("/manager") ? pathname : "/manager";
  return `${safePath}${search}`;
}

export function managerEffectivenessLoginUrl(pathname: string, search = "") {
  return `/login?returnTo=${encodeURIComponent(managerEffectivenessReturnTo(pathname, search))}`;
}

/**
 * MEP is an authenticated workspace. Waiting for auth here prevents the sidebar
 * from mounting as a guest shell, where administrator controls are correctly
 * withheld but the page can look like a successful Admin login.
 */
export default function MEPAccessGate({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading || isAuthenticated || typeof window === "undefined") return;

    window.location.replace(
      managerEffectivenessLoginUrl(window.location.pathname, window.location.search),
    );
  }, [isAuthenticated, loading]);

  if (loading || !isAuthenticated) {
    const isSigningIn = !loading && !isAuthenticated;
    return (
      <div className="flex min-h-screen items-center justify-center px-5" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="w-full max-w-sm rounded-2xl p-6 text-center shadow-sm" style={{ background: "white", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.45)" }} role="status" aria-live="polite">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "oklch(from #34d399 l c h / 0.14)", color: "#0f9f7a" }}>
            <LoaderCircle className="animate-spin" size={24} aria-hidden="true" />
          </div>
          <p className="mt-4 text-base font-semibold" style={{ color: "var(--color-ln-navy)" }}>
            {isSigningIn ? "Opening secure sign-in…" : "Checking your secure access…"}
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "oklch(45% 0.02 248.6)" }}>
            {isSigningIn
              ? "You will return to Manager Effectiveness immediately after signing in."
              : "Please wait while we confirm your sign-in and restore your workspace."}
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#0f9f7a" }}>
            <ShieldCheck size={14} aria-hidden="true" /> Secure LevelNext access
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
