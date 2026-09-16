/**
 * Career Prepare — unified tabbed page combining:
 *   Tab 1: Resume         (formerly ResumeMakeover)
 *   Tab 2: Interview Prep (formerly InterviewPrep)
 *   Tab 3: Negotiation    (formerly NegotiationIntelligence)
 *
 * Each tab renders the original page component directly — no logic is duplicated.
 */
import { useState } from "react";
import { FileText, ClipboardList, Scale } from "lucide-react";
import PlatformLayout from "@/components/PlatformLayout";
import ResumeMakeover from "@/pages/ci/ResumeMakeover";
import InterviewPrep from "@/pages/InterviewPrep";
import NegotiationIntelligence from "@/pages/NegotiationIntelligence";

type PrepTab = "resume" | "interview" | "negotiation";

const TABS: { key: PrepTab; label: string; icon: React.ElementType; description: string }[] = [
  { key: "resume", label: "Resume", icon: FileText, description: "AI-powered resume rewrite and analysis" },
  { key: "interview", label: "Interview Prep", icon: ClipboardList, description: "Generate mock interview questions by role and company" },
  { key: "negotiation", label: "Negotiation", icon: Scale, description: "AI salary negotiation strategy generator" },
];

export default function CareerPrepare() {
  const [activeTab, setActiveTab] = useState<PrepTab>("resume");

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
        {activeTab === "resume" && <ResumeMakeover />}
        {activeTab === "interview" && <InterviewPrep />}
        {activeTab === "negotiation" && <NegotiationIntelligence />}
      </div>
      </div>
    </PlatformLayout>
  );
}
