import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, ChevronRight, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SITUATION_CATEGORIES = [
  "Performance Management",
  "Team Dynamics",
  "Communication",
  "Delegation",
  "Motivation & Engagement",
  "Conflict Resolution",
  "Feedback & Coaching",
  "Change Management",
  "Stakeholder Management",
  "New Manager Challenges",
];

type View = "list" | "new" | "session";

export default function ManagerPlaybook() {
  const [view, setView] = useState<View>("list");
  const [situation, setSituation] = useState("");
  const [_category, setCategory] = useState(SITUATION_CATEGORIES[0]);
  const [generating, setGenerating] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);

  const { data: sessions, refetch } = trpc.mep.listPlaybookSessions.useQuery();

  const generateMutation = trpc.mep.generatePlaybook.useMutation({
    onSuccess: (data) => {
      setActiveSession(data);
      setView("session");
      refetch();
      setGenerating(false);
    },
    onError: () => {
      toast.error("Could not generate playbook. Please try again.");
      setGenerating(false);
    },
  });

  const getSession = trpc.mep.getPlaybookSession.useQuery(
    { id: activeSession?.id ?? 0 },
    { enabled: !!activeSession?.id && view === "session" }
  );

  const handleGenerate = async () => {
    if (!situation.trim()) { toast.error("Please describe your situation."); return; }
    setGenerating(true);
    await generateMutation.mutateAsync({ situation: situation.trim() });
  };

  const displaySession = getSession.data ?? activeSession;

  // ── List view ─────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Manager Playbook</h1>
              <p className="text-sm mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>
                Situation-specific plays for common management challenges
              </p>
            </div>
            <Button
              size="sm"
              className="font-semibold text-xs"
              style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
              onClick={() => { setSituation(""); setView("new"); }}
            >
              <Plus size={14} className="mr-1.5" />
              New Play
            </Button>
          </div>

          {/* Empty state */}
          {sessions?.length === 0 && (
            <div
              className="rounded-2xl px-6 py-10 text-center"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <BookOpen size={32} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
              <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>
                Your playbook is empty
              </h2>
              <p className="text-xs mb-4" style={{ color: "oklch(55% 0.02 248.6)" }}>
                Describe a management situation and get a tailored play with specific actions, scripts, and coaching questions.
              </p>
              <Button
                size="sm"
                style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                onClick={() => setView("new")}
              >
                Create Your First Play
              </Button>
            </div>
          )}

          {/* Session list */}
          <div className="space-y-3">
            {sessions?.map((s: any) => (
              <button
                key={s.id}
                onClick={() => { setActiveSession(s); setView("session"); }}
                className="w-full text-left rounded-2xl p-4 border transition-all hover:shadow-sm"
                style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "oklch(from #f59e0b l c h / 0.1)", border: "1px solid oklch(from #f59e0b l c h / 0.2)" }}
                  >
                    <BookOpen size={14} style={{ color: "#f59e0b" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#f59e0b" }}>
                        {s.category}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-ln-navy)" }}>
                      {s.situation}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} style={{ color: "oklch(60% 0.02 248.6)" }} />
                      <span className="text-[10px]" style={{ color: "oklch(60% 0.02 248.6)" }}>
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: "oklch(60% 0.02 248.6)" }} className="flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── New play form ─────────────────────────────────────────────────────────
  if (view === "new") {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div>
            <button
              className="text-xs mb-4 flex items-center gap-1"
              style={{ color: "oklch(55% 0.02 248.6)" }}
              onClick={() => setView("list")}
            >
              ← Back to Playbook
            </button>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>New Management Play</h1>
            <p className="text-sm mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>
              Describe your situation and get a tailored play with specific actions and scripts.
            </p>
          </div>

          <div
            className="rounded-2xl p-6 space-y-5"
            style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
          >
            {/* Category */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: "oklch(45% 0.02 248.6)" }}>
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {SITUATION_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={_category === cat
                      ? { background: "#34d399", color: "var(--color-ln-navy)" }
                      : { background: "oklch(95% 0.01 248.6)", color: "oklch(40% 0.02 248.6)", border: "1px solid oklch(88% 0.01 248.6)" }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Situation */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: "oklch(45% 0.02 248.6)" }}>
                Describe Your Situation
              </label>
              <Textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g. I have a team member who consistently delivers good work but is very difficult in team meetings — interrupting others and dismissing ideas. I've tried hinting at it but nothing has changed…"
                className="text-sm min-h-[120px] resize-none"
                disabled={generating}
              />
              <p className="text-[10px] mt-1" style={{ color: "oklch(60% 0.02 248.6)" }}>
                The more specific you are, the more tailored the play will be.
              </p>
            </div>

            <Button
              className="w-full font-semibold"
              onClick={handleGenerate}
              disabled={generating || !situation.trim()}
              style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
            >
              {generating ? (
                <><Loader2 size={15} className="mr-2 animate-spin" /> Generating your play…</>
              ) : (
                <>Generate Play <ChevronRight size={15} className="ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Session / play view ───────────────────────────────────────────────────
  if (view === "session" && displaySession) {
    const play = displaySession.playbook ?? {};

    return (
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
          <div>
            <button
              className="text-xs mb-4 flex items-center gap-1"
              style={{ color: "oklch(55% 0.02 248.6)" }}
              onClick={() => setView("list")}
            >
              ← Back to Playbook
            </button>
            <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "oklch(from #f59e0b l c h / 0.12)", color: "#f59e0b" }}>
              {displaySession.situationType ?? "Management"}
            </span>
            </div>
            <h1 className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>
              {displaySession.situation}
            </h1>
          </div>

          {/* Headline */}
          {play.headline && (
            <div
              className="rounded-2xl px-5 py-4"
              style={{ background: "var(--color-ln-navy)" }}
            >
              <p className="text-sm font-medium text-white leading-relaxed">{play.headline}</p>
            </div>
          )}

          {/* Diagnosis */}
          {play.diagnosis && (
            <Section title="What's Really Happening" color="#60a5fa">
              <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{play.diagnosis}</p>
            </Section>
          )}

          {/* Immediate actions */}
          {play.immediateActions && play.immediateActions.length > 0 && (
            <Section title="Immediate Actions" color="#34d399">
              <ol className="space-y-3">
                {play.immediateActions.map((a: any, i: number) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{a.action}</p>
                      {a.detail && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "oklch(45% 0.02 248.6)" }}>{a.detail}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* Conversation script */}
          {play.conversationScript && (
            <Section title="Conversation Script" color="#a78bfa">
              <div className="space-y-3">
                {play.conversationScript.opening && (
                  <ScriptLine label="Opening" text={play.conversationScript.opening} />
                )}
                {play.conversationScript.keyPoints && play.conversationScript.keyPoints.map((p: string, i: number) => (
                  <ScriptLine key={i} label={`Key Point ${i + 1}`} text={p} />
                ))}
                {play.conversationScript.closing && (
                  <ScriptLine label="Closing" text={play.conversationScript.closing} />
                )}
              </div>
            </Section>
          )}

          {/* What to avoid */}
          {play.whatToAvoid && play.whatToAvoid.length > 0 && (
            <Section title="What to Avoid" color="#f87171">
              <ul className="space-y-1.5">
                {play.whatToAvoid.map((w: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: "oklch(35% 0.02 248.6)" }}>
                    <span style={{ color: "#f87171" }}>✕</span> {w}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Coaching question */}
          {play.coachingQuestion && (
            <div
              className="rounded-2xl px-5 py-4"
              style={{ background: "oklch(from #34d399 l c h / 0.06)", border: "1px solid oklch(from #34d399 l c h / 0.2)" }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#34d399" }}>Reflect On This</p>
              <p className="text-sm italic" style={{ color: "oklch(30% 0.02 248.6)" }}>"{play.coachingQuestion}"</p>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => { setSituation(""); setView("new"); }}
          >
            <Plus size={12} className="mr-1.5" /> Create Another Play
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
      <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color }}>{title}</h2>
      {children}
    </div>
  );
}

function ScriptLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: "oklch(97% 0.005 248.6)", border: "1px solid oklch(91% 0.01 248.6)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>{label}</p>
      <p className="text-sm leading-relaxed" style={{ color: "oklch(25% 0.02 248.6)" }}>"{text}"</p>
    </div>
  );
}
