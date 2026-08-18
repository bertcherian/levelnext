import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export function professionalEffectivenessReturnTo(pathname: string, search = "") {
  const safePath = pathname.startsWith("/pe") ? pathname : "/pe";
  return `${safePath}${search}`;
}

export function professionalEffectivenessLoginUrl(pathname: string, search = "") {
  return `/login?returnTo=${encodeURIComponent(professionalEffectivenessReturnTo(pathname, search))}`;
}

export default function PEAccessGate({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading || isAuthenticated || typeof window === "undefined") return;

    window.location.replace(
      professionalEffectivenessLoginUrl(window.location.pathname, window.location.search),
    );
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-ln-ivory)" }}>
        <p className="text-sm" style={{ color: "oklch(45% 0.02 248.6)" }}>Checking secure access…</p>
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
