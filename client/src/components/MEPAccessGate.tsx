import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-ln-ivory)" }}>
        <p className="text-sm" role="status" style={{ color: "oklch(45% 0.02 248.6)" }}>Checking secure access…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-ln-ivory)" }}>
        <p className="text-sm" role="status" style={{ color: "oklch(45% 0.02 248.6)" }}>Taking you to sign in…</p>
      </div>
    );
  }

  return <>{children}</>;
}
