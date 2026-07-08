import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

// Extend Window to include the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("pwa-banner-dismissed")) return;
    // Don't show if already installed (standalone mode)
    if (isInStandaloneMode()) return;

    // iOS Safari: no beforeinstallprompt event, show manual instructions
    if (isIOS()) {
      setVisible(true);
      setShowIOSInstructions(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (!visible || dismissed) return null;

  return (
    <div
      className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 mx-4 mb-2 lg:hidden"
      style={{ animation: "slideUp 0.3s cubic-bezier(0.23,1,0.32,1)" }}
    >
      <div
        className="rounded-2xl p-4 flex items-center gap-3 shadow-xl"
        style={{
          background: "var(--color-ln-navy)",
          border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.3)",
        }}
      >
        {/* LN icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--color-ln-yellow)" }}
        >
          <span className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>LN</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">Add LevelNext to your home screen</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
            Instant access, works offline
          </p>
        </div>

        {/* Install button — Android/Chrome */}
        {!showIOSInstructions && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-opacity hover:opacity-90 active:scale-[0.97]"
            style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
        )}

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* iOS-specific instructions */}
      {showIOSInstructions && (
        <div className="mt-2 rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}>
          Tap <span className="font-semibold text-white">Share</span> (⬆) at the bottom of Safari, then <span className="font-semibold text-white">Add to Home Screen</span>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
