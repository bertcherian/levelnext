/**
 * My Journey — unified tabbed page combining:
 *   Tab 1: Progress       (formerly CareerProgress)
 *   Tab 2: Growth Profile (formerly GrowthProfile)
 *
 * Each tab renders the original page component directly — no logic is duplicated.
 */
import { useState } from "react";
import { BarChart3, Activity } from "lucide-react";
import PlatformLayout from "@/components/PlatformLayout";
import CareerProgress from "@/pages/CareerProgress";
import GrowthProfile from "@/pages/GrowthProfile";

type JourneyTab = "progress" | "growth";

const TABS: { key: JourneyTab; label: string; icon: React.ElementType; description: string }[] = [
  { key: "progress", label: "Journey Progress", icon: BarChart3, description: "Track your career transition journey across all modules" },
  { key: "growth", label: "Growth Profile", icon: Activity, description: "Your personal leadership growth profile and scores" },
];

export default function CareerMyJourney() {
  const [activeTab, setActiveTab] = useState<JourneyTab>("progress");

  return (
    <PlatformLayout>
      <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Tab bar */}
      <div
        className="flex-shrink-0 border-b overflow-x-auto"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-end min-w-max px-4">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
              style={
                activeTab === key
                  ? { borderColor: "var(--color-ln-gold)", color: "var(--foreground)" }
                  : { borderColor: "transparent", color: "var(--muted-foreground)" }
              }
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — render original page components directly */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "progress" && <CareerProgress />}
        {activeTab === "growth" && <GrowthProfile />}
      </div>
      </div>
    </PlatformLayout>
  );
}
