import { Download, Info } from "lucide-react";
import React, { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  const displayMode = typeof window.matchMedia === "function" ? window.matchMedia("(display-mode: standalone)").matches : false;
  return displayMode || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setShowHelp(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!promptEvent) {
      setShowHelp(true);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  };

  return (
    <span className="pwa-install-wrap">
      <button type="button" className="pwa-install" onClick={install} aria-expanded={showHelp}>
        <Download size={14} /> Install app
      </button>
      {showHelp && <span className="pwa-install-note" role="status"><Info size={13} /> Use your browser menu to add LevelNext to your device.</span>}
    </span>
  );
}
