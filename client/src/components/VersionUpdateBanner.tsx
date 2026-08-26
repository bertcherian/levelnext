import { RefreshCw, Sparkles, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getMainModuleSignature, isNewBuildAvailable } from "@/lib/versionUpdate";

function currentBuildSignature() {
  if (typeof document === "undefined") return null;
  return getMainModuleSignature(document.documentElement.outerHTML);
}

export default function VersionUpdateBanner() {
  const currentSignature = useMemo(currentBuildSignature, []);
  const [availableSignature, setAvailableSignature] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (!currentSignature || document.visibilityState !== "visible" || checking) return;
    setChecking(true);
    try {
      const response = await fetch("/", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) return;
      const nextSignature = getMainModuleSignature(await response.text());
      if (!isNewBuildAvailable(currentSignature, nextSignature) || !nextSignature) return;
      if (sessionStorage.getItem(`levelnext-version-dismissed:${nextSignature}`)) return;
      setAvailableSignature(nextSignature);
    } catch {
      // A failed update check must never interrupt the user's active work.
    } finally {
      setChecking(false);
    }
  }, [checking, currentSignature]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void checkForUpdate();
    };
    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", checkForUpdate);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [checkForUpdate]);

  const dismiss = () => {
    if (availableSignature) sessionStorage.setItem(`levelnext-version-dismissed:${availableSignature}`, "1");
    setAvailableSignature(null);
  };

  if (!availableSignature) return null;

  return (
    <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2" style={{ animation: "versionUpdateEnter 220ms cubic-bezier(0.23,1,0.32,1)" }} role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl" style={{ background: "var(--color-ln-navy)", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.35)" }}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.16)", color: "var(--color-ln-yellow)" }}>
          <Sparkles size={18} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">A new version is available</p>
          <p className="mt-0.5 text-xs leading-snug" style={{ color: "oklch(78% 0.02 248.6)" }}>Refresh when convenient to receive the latest improvements.</p>
        </div>
        <button onClick={() => window.location.reload()} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold active:scale-[0.97]" style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
          <RefreshCw size={13} aria-hidden="true" /> Refresh
        </button>
        <button onClick={dismiss} className="shrink-0 rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white" aria-label="Dismiss new version notice">
          <X size={16} />
        </button>
      </div>
      <style>{`@keyframes versionUpdateEnter { from { opacity: 0; transform: translate(-50%, -0.5rem); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
    </div>
  );
}
