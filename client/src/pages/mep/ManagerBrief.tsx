import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Lightbulb, RefreshCw, Loader2, CheckCircle2, Target,
  Zap, MessageSquare, Users, BookOpen, AlertTriangle, Star,
} from "lucide-react";
import { toast } from "sonner";
import { LLMProcessingSkeleton } from "@/components/SkeletonLoader";

// ── Type matching the server response ─────────────────────────────────────────
interface DailyBrief {
  greeting?: string;
  dayTheme?: string;
  priorityFocus?: string;
  teamPulseItems?: Array<{ type: string; person: string; note: string }>;
  managementChallenge?: string;
  reflectionQuestion?: string;
  learningRecommendation?: { topic: string; why: string; action: string };
  commitmentReminder?: string | null;
  // legacy field names (fallback)
  openingMessage?: string;
  focusAreas?: Array<{ area: string; action?: string }>;
  managementReminders?: string[];
  energyAndMindset?: string;
  coachingQuestion?: string;
  closingAffirmation?: string;
}

const PULSE_COLORS: Record<string, string> = {
  attention: "#f87171",
  risk: "#f59e0b",
  recognition: "#34d399",
  checkin: "#60a5fa",
};
const PULSE_LABELS: Record<string, string> = {
  attention: "Needs Attention",
  risk: "Risk Signal",
  recognition: "Recognition Due",
  checkin: "Check-in",
};

export default function ManagerBrief() {
  const [generating, setGenerating] = useState(false);
  const [briefData, setBriefData] = useState<DailyBrief | null>(null);

  // Also try to load today's snapshot on mount
  const { data: snapshot } = trpc.mep.getTodayBriefSnapshot.useQuery();

  useEffect(() => {
    if (snapshot && !briefData) setBriefData(snapshot as DailyBrief);
  }, [snapshot]);

  const generateMutation = trpc.mep.getDailyBrief.useMutation({
    onSuccess: (data: any) => {
      setBriefData(data as DailyBrief);
      setGenerating(false);
      toast.success("Your daily brief is ready.");
    },
    onError: () => {
      toast.error("Could not generate brief. Please try again.");
      setGenerating(false);
    },
  });

  const handleGenerate = () => {
    setGenerating(true);
    generateMutation.mutate();
  };

  // Normalise: support both old and new field names
  const b: DailyBrief | null = briefData ?? (snapshot as DailyBrief | null) ?? null;

  // Derive display values from either schema
  const greeting = b?.greeting ?? b?.openingMessage;
  const priorityFocus = b?.priorityFocus;
  const dayTheme = b?.dayTheme;
  const focusAreas = b?.focusAreas;
  const teamPulseItems = b?.teamPulseItems;
  const managementChallenge = b?.managementChallenge;
  const managementReminders = b?.managementReminders;
  const reflectionQuestion = b?.reflectionQuestion ?? b?.coachingQuestion;
  const energyAndMindset = b?.energyAndMindset;
  const learningRec = b?.learningRecommendation;
  const commitmentReminder = b?.commitmentReminder;
  const closingAffirmation = b?.closingAffirmation;

  const hasContent = !!(greeting || priorityFocus || dayTheme || focusAreas?.length || teamPulseItems?.length);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#a78bfa" }}>
              {today}
            </p>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Daily Management Brief</h1>
            <p className="text-sm mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>
              Start your day with clarity on priorities, team pulse, and focus areas.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0 text-xs"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <RefreshCw size={13} className="mr-1.5" />}
            Refresh Brief
          </Button>
        </div>

        {/* No brief yet */}
        {!hasContent && !generating && (
          <div
            className="rounded-2xl px-6 py-10 text-center"
            style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
          >
            <Lightbulb size={32} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
            <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>
              No brief generated yet
            </h2>
            <p className="text-xs mb-4" style={{ color: "oklch(55% 0.02 248.6)" }}>
              Generate your first daily brief to get AI-powered clarity on your management priorities for today.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              style={{ background: "#a78bfa", color: "white" }}
            >
              Generate Today's Brief
            </Button>
          </div>
        )}

        {/* Generating skeleton */}
        {!hasContent && generating && (
          <div className="rounded-2xl" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
            <LLMProcessingSkeleton
              title="Generating your daily brief…"
              subtitle="Our AI is analysing your team context to prepare today's management priorities."
              steps={["Reviewing team pulse", "Identifying priorities", "Crafting coaching question"]}
              className="min-h-[300px]"
            />
          </div>
        )}

        {/* Brief content */}
        {hasContent && (
          <>
            {/* Greeting */}
            {greeting && (
              <div className="rounded-2xl px-5 py-4" style={{ background: "var(--color-ln-navy)" }}>
                <p className="text-sm font-medium text-white leading-relaxed">{greeting}</p>
              </div>
            )}

            {/* Day theme + priority focus */}
            {(dayTheme || priorityFocus) && (
              <BriefSection title="Today's Focus" icon={Target} color="#a78bfa">
                {dayTheme && (
                  <div className="mb-3">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: "oklch(from #a78bfa l c h / 0.1)", color: "#a78bfa" }}
                    >
                      {dayTheme}
                    </span>
                  </div>
                )}
                {priorityFocus && (
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{priorityFocus}</p>
                )}
              </BriefSection>
            )}

            {/* Focus areas (legacy) */}
            {focusAreas && focusAreas.length > 0 && (
              <BriefSection title="Focus Areas" icon={Target} color="#a78bfa">
                <div className="space-y-3">
                  {focusAreas.map((f, i) => (
                    <div key={i} className="flex gap-3">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                        style={{ background: "#a78bfa", color: "white" }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{f.area}</p>
                        {f.action && <p className="text-xs mt-0.5" style={{ color: "oklch(45% 0.02 248.6)" }}>{f.action}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </BriefSection>
            )}

            {/* Team pulse */}
            {teamPulseItems && teamPulseItems.length > 0 && (
              <BriefSection title="Team Pulse" icon={Users} color="#60a5fa">
                <div className="space-y-3">
                  {teamPulseItems.map((item, i) => {
                    const color = PULSE_COLORS[item.type] ?? "#60a5fa";
                    const label = PULSE_LABELS[item.type] ?? item.type;
                    return (
                      <div key={i} className="flex gap-3">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                          style={{ background: color }}
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{item.person}</p>
                            <span
                              className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                              style={{ background: `oklch(from ${color} l c h / 0.1)`, color }}
                            >
                              {label}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: "oklch(45% 0.02 248.6)" }}>{item.note}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </BriefSection>
            )}

            {/* Management challenge */}
            {managementChallenge && (
              <BriefSection title="Today's Management Challenge" icon={Zap} color="#fb923c">
                <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{managementChallenge}</p>
              </BriefSection>
            )}

            {/* Management reminders (legacy) */}
            {managementReminders && managementReminders.length > 0 && (
              <BriefSection title="Management Reminders" icon={CheckCircle2} color="#34d399">
                <ul className="space-y-2">
                  {managementReminders.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "oklch(35% 0.02 248.6)" }}>
                      <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#34d399" }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </BriefSection>
            )}

            {/* Energy & mindset (legacy) */}
            {energyAndMindset && (
              <BriefSection title="Energy & Mindset" icon={Zap} color="#fb923c">
                <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{energyAndMindset}</p>
              </BriefSection>
            )}

            {/* Learning recommendation */}
            {learningRec && (
              <BriefSection title="Learning Recommendation" icon={BookOpen} color="#34d399">
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>{learningRec.topic}</p>
                <p className="text-xs mb-2" style={{ color: "oklch(50% 0.02 248.6)" }}>{learningRec.why}</p>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5" style={{ color: "#34d399" }} />
                  <p className="text-xs" style={{ color: "oklch(35% 0.02 248.6)" }}>{learningRec.action}</p>
                </div>
              </BriefSection>
            )}

            {/* Commitment reminder */}
            {commitmentReminder && (
              <div
                className="rounded-2xl px-5 py-4 flex items-start gap-3"
                style={{ background: "oklch(from #f59e0b l c h / 0.06)", border: "1px solid oklch(from #f59e0b l c h / 0.2)" }}
              >
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>Commitment Reminder</p>
                  <p className="text-sm" style={{ color: "oklch(35% 0.02 248.6)" }}>{commitmentReminder}</p>
                </div>
              </div>
            )}

            {/* Reflection question */}
            {reflectionQuestion && (
              <div
                className="rounded-2xl px-5 py-4"
                style={{ background: "oklch(from #a78bfa l c h / 0.06)", border: "1px solid oklch(from #a78bfa l c h / 0.2)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={13} style={{ color: "#a78bfa" }} />
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#a78bfa" }}>
                    Reflect On This Today
                  </p>
                </div>
                <p className="text-sm italic" style={{ color: "oklch(30% 0.02 248.6)" }}>"{reflectionQuestion}"</p>
              </div>
            )}

            {/* Closing */}
            {closingAffirmation && (
              <p className="text-xs text-center py-2" style={{ color: "oklch(55% 0.02 248.6)" }}>
                {closingAffirmation}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BriefSection({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color }} />
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}
