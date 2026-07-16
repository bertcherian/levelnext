import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw, Loader2, CheckCircle2, Target, Zap, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function ManagerBrief() {
  const [generating, setGenerating] = useState(false);
  const [briefData, setBriefData] = useState<any>(null);

  const generateMutation = trpc.mep.getDailyBrief.useMutation({
    onSuccess: (data) => {
      setBriefData(data);
      setGenerating(false);
      toast.success("Your daily brief is ready.");
    },
    onError: () => {
      toast.error("Could not generate brief. Please try again.");
      setGenerating(false);
    },
  });

  const handleGenerate = async () => {
    setGenerating(true);
    await generateMutation.mutateAsync();
  };

  const b = briefData?.brief as any;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

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
        {!b && (
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
              {generating ? <><Loader2 size={14} className="mr-2 animate-spin" /> Generating…</> : "Generate Today's Brief"}
            </Button>
          </div>
        )}

        {/* Brief content */}
        {b && (
          <>
            {/* Opening */}
            {b.openingMessage && (
              <div
                className="rounded-2xl px-5 py-4"
                style={{ background: "var(--color-ln-navy)" }}
              >
                <p className="text-sm font-medium text-white leading-relaxed">{b.openingMessage}</p>
              </div>
            )}

            {/* Focus areas */}
            {b.focusAreas && b.focusAreas.length > 0 && (
              <BriefSection title="Today's Focus Areas" icon={Target} color="#a78bfa">
                <div className="space-y-3">
                  {b.focusAreas.map((f: any, i: number) => (
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

            {/* Management reminders */}
            {b.managementReminders && b.managementReminders.length > 0 && (
              <BriefSection title="Management Reminders" icon={CheckCircle2} color="#34d399">
                <ul className="space-y-2">
                  {b.managementReminders.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "oklch(35% 0.02 248.6)" }}>
                      <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#34d399" }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </BriefSection>
            )}

            {/* Energy & mindset */}
            {b.energyAndMindset && (
              <BriefSection title="Energy & Mindset" icon={Zap} color="#fb923c">
                <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{b.energyAndMindset}</p>
              </BriefSection>
            )}

            {/* Coaching question */}
            {b.coachingQuestion && (
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
                <p className="text-sm italic" style={{ color: "oklch(30% 0.02 248.6)" }}>"{b.coachingQuestion}"</p>
              </div>
            )}

            {/* Closing */}
            {b.closingAffirmation && (
              <p className="text-xs text-center py-2" style={{ color: "oklch(55% 0.02 248.6)" }}>
                {b.closingAffirmation}
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
