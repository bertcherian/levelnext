import { useEffect, useRef, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function isInStandaloneMode() { return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true); }
function participantToken() { const match = window.location.pathname.match(/^\/pilot\/participant\/([^/]+)/); return match?.[1] ?? ""; }
function isParticipantRoute() { return window.location.pathname.startsWith("/pilot/participant/"); }

export default function PWAInstallBanner() {
  const record = trpc.behaviourChangeProof.recordMobileEvent.useMutation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const shownRef = useRef(false);
  const token = participantToken();

  useEffect(() => {
    if (!isParticipantRoute() || isInStandaloneMode()) return;
    const hasFirstValue = () => localStorage.getItem("levelnext_first_value_seen") === "1" || sessionStorage.getItem("levelnext_first_value_seen") === "1";
    const maybeShow = () => {
      if (!hasFirstValue()) return;
      if (isIOS()) { setShowIOSInstructions(true); setVisible(true); return; }
      if (deferredPrompt) setVisible(true);
    };
    const handler = (event: Event) => { event.preventDefault(); setDeferredPrompt(event as BeforeInstallPromptEvent); if (hasFirstValue()) setVisible(true); };
    const valueListener = () => window.setTimeout(maybeShow, 0);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("levelnext:first-value", valueListener);
    maybeShow();
    return () => { window.removeEventListener("beforeinstallprompt", handler); window.removeEventListener("levelnext:first-value", valueListener); };
  }, [deferredPrompt]);

  useEffect(() => {
    if (!visible || shownRef.current || !token) return;
    shownRef.current = true;
    record.mutate({ token, eventType: "install_offer_shown", isMobile: true, metadata: { surface: "participant" } });
  }, [record, token, visible]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted" && token) record.mutate({ token, eventType: "install_accepted", isMobile: true, metadata: { surface: "participant" } });
    setVisible(false); setDeferredPrompt(null);
  };
  const dismiss = () => { setVisible(false); sessionStorage.setItem("levelnext-install-dismissed", "1"); };
  if (!visible || sessionStorage.getItem("levelnext-install-dismissed") === "1") return null;
  return <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 mx-3 mb-2 md:hidden" role="dialog" aria-label="Add LevelNext to your phone"><div className="rounded-2xl border border-[#D4AF37]/50 bg-[#0A1A2F] p-4 text-white shadow-2xl"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#D4AF37] text-sm font-bold text-[#0A1A2F]">LN</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold leading-tight">Add LevelNext to your phone</p><p className="mt-1 text-xs leading-5 text-white/65">Return to today’s pilot action in one tap. You can keep using the browser if you prefer.</p></div><button onClick={dismiss} className="rounded-full p-1 text-white/60 hover:bg-white/10" aria-label="Not now"><X size={16} /></button></div>{showIOSInstructions ? <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs leading-5 text-white/80"><Share className="mr-1 inline-block" size={13} />Tap <b className="text-white">Share</b> in Safari, then <b className="text-white">Add to Home Screen</b>.</p> : <button onClick={() => void handleInstall()} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 text-sm font-semibold text-[#0A1A2F] active:scale-[0.98]"><Download size={16} /> Add LevelNext</button>}</div></div>;
}
