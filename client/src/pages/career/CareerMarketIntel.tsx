/**
 * Career Market Intel — unified tabbed page combining:
 *   Tab 1: Opportunities  (formerly CareerAccess / Executive Opportunity System)
 *   Tab 2: Signals        (formerly RadarSignals)
 *   Tab 3: Relationships  (formerly RelationshipGraph)
 *   Tab 4: Access Paths   (formerly AccessPaths)
 *   Tab 5: Outreach       (formerly OutreachEngine)
 *
 * Each tab renders the original page component directly — no logic is duplicated.
 */
import { useEffect, useState } from "react";
import { Globe, Radio, Users, Route, Sparkles } from "lucide-react";
import PlatformLayout from "@/components/PlatformLayout";
import { useLocation } from "wouter";
import CareerAccess from "@/pages/CareerAccess";
import RadarSignals from "@/pages/RadarSignals";
import RelationshipGraph from "@/pages/RelationshipGraph";
import AccessPaths from "@/pages/AccessPaths";
import OutreachEngine from "@/pages/OutreachEngine";

type IntelTab = "opportunities" | "signals" | "relationships" | "access" | "outreach";

const TABS: { key: IntelTab; label: string; icon: React.ElementType; description: string }[] = [
  { key: "opportunities", label: "Opportunities", icon: Globe, description: "Weekly executive opportunity report and pipeline" },
  { key: "signals", label: "Signals", icon: Radio, description: "Market signals — hiring, expansion, leadership changes" },
  { key: "relationships", label: "Relationships", icon: Users, description: "Map and manage your professional network" },
  { key: "access", label: "Access Paths", icon: Route, description: "AI-generated paths to reach target organisations" },
  { key: "outreach", label: "Outreach", icon: Sparkles, description: "LinkedIn brand strategy, content ideas, outreach drafts" },
];

function tabFromSearch(search: string): IntelTab {
  const candidate = new URLSearchParams(search).get("tab");
  return TABS.some((tab) => tab.key === candidate) ? candidate as IntelTab : "opportunities";
}

export default function CareerMarketIntel() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<IntelTab>(() =>
    tabFromSearch(typeof window === "undefined" ? "" : window.location.search),
  );

  useEffect(() => {
    setActiveTab(tabFromSearch(typeof window === "undefined" ? "" : window.location.search));
  }, [location]);

  const handleTabChange = (tab: IntelTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
    if (tab === "opportunities") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    navigate(`/career/market-intel${query ? `?${query}` : ""}`, { replace: true });
  };

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
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => handleTabChange(key)}
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
        {activeTab === "opportunities" && <CareerAccess />}
        {activeTab === "signals" && <RadarSignals />}
        {activeTab === "relationships" && <RelationshipGraph />}
        {activeTab === "access" && <AccessPaths />}
        {activeTab === "outreach" && <OutreachEngine />}
      </div>
      </div>
    </PlatformLayout>
  );
}
