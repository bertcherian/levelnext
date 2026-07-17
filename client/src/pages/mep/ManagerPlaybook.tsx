import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquareWarning,
  TrendingDown,
  GitBranch,
  Users,
  Zap,
  ShieldAlert,
  Plus,
  ChevronRight,
  Loader2,
  Clock,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

// ── Playbook type definitions ─────────────────────────────────────────────────
const PLAYBOOK_TYPES = [
  {
    code: "difficult_conversation" as const,
    label: "Difficult Conversation",
    description: "Navigate a high-stakes conversation you've been avoiding",
    icon: MessageSquareWarning,
    color: "#f87171",
    bgAlpha: "oklch(from #f87171 l c h / 0.08)",
    borderAlpha: "oklch(from #f87171 l c h / 0.25)",
  },
  {
    code: "performance_gap" as const,
    label: "Performance Gap",
    description: "Address consistent underperformance with clarity and compassion",
    icon: TrendingDown,
    color: "#f59e0b",
    bgAlpha: "oklch(from #f59e0b l c h / 0.08)",
    borderAlpha: "oklch(from #f59e0b l c h / 0.25)",
  },
  {
    code: "delegation_breakdown" as const,
    label: "Delegation Breakdown",
    description: "Stop doing everything yourself — build real team ownership",
    icon: GitBranch,
    color: "#60a5fa",
    bgAlpha: "oklch(from #60a5fa l c h / 0.08)",
    borderAlpha: "oklch(from #60a5fa l c h / 0.25)",
  },
  {
    code: "team_conflict" as const,
    label: "Team Conflict",
    description: "Resolve interpersonal friction before it damages the team",
    icon: Users,
    color: "#a78bfa",
    bgAlpha: "oklch(from #a78bfa l c h / 0.08)",
    borderAlpha: "oklch(from #a78bfa l c h / 0.25)",
  },
  {
    code: "motivation_engagement" as const,
    label: "Motivation & Engagement",
    description: "Re-engage a disengaged team member who has lost their spark",
    icon: Zap,
    color: "#34d399",
    bgAlpha: "oklch(from #34d399 l c h / 0.08)",
    borderAlpha: "oklch(from #34d399 l c h / 0.25)",
  },
  {
    code: "feedback_resistance" as const,
    label: "Feedback Resistance",
    description: "Give feedback that lands even with defensive or dismissive people",
    icon: ShieldAlert,
    color: "#fb923c",
    bgAlpha: "oklch(from #fb923c l c h / 0.08)",
    borderAlpha: "oklch(from #fb923c l c h / 0.25)",
  },
] as const;

type PlaybookTypeCode = typeof PLAYBOOK_TYPES[number]["code"];

function getTypeConfig(code: string) {
  return PLAYBOOK_TYPES.find((t) => t.code === code) ?? PLAYBOOK_TYPES[0];
}

type View = "list" | "new" | "session";

export default function ManagerPlaybook() {
  const [view, setView] = useState<View>("list");
  const [situation, setSituation] = useState("");
  const [selectedType, setSelectedType] = useState<PlaybookTypeCode>("difficult_conversation");
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
    await generateMutation.mutateAsync({ situation: situation.trim(), playbookType: selectedType });
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
                Situation-specific plays for your toughest management challenges
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
          {(!sessions || sessions.length === 0) && (
            <div
              className="rounded-2xl px-6 py-10 text-center"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <BookOpen size={32} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
              <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>
                Your playbook is empty
              </h2>
              <p className="text-xs mb-4" style={{ color: "oklch(55% 0.02 248.6)" }}>
                Choose a situation type and describe what's happening. Get a tailored play with scripts, actions, and coaching questions.
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
            {sessions?.map((s: any) => {
              const typeCode = s.playbook?.playbookType ?? "";
              const typeConfig = getTypeConfig(typeCode);
              const Icon = typeConfig.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => { setActiveSession(s); setView("session"); }}
                  className="w-full text-left rounded-2xl p-4 border transition-all hover:shadow-sm"
                  style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: typeConfig.bgAlpha, border: `1px solid ${typeConfig.borderAlpha}` }}
                    >
                      <Icon size={14} style={{ color: typeConfig.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: typeConfig.color }}>
                          {typeConfig.label}
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
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── New play form ─────────────────────────────────────────────────────────
  if (view === "new") {
    const activeTypeConfig = getTypeConfig(selectedType);
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
              Choose the type of situation, then describe what's happening.
            </p>
          </div>

          {/* Playbook type selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-3" style={{ color: "oklch(45% 0.02 248.6)" }}>
              What kind of situation is this?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PLAYBOOK_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.code;
                return (
                  <button
                    key={type.code}
                    onClick={() => setSelectedType(type.code)}
                    className="text-left rounded-xl p-3.5 border-2 transition-all"
                    style={isSelected
                      ? { background: type.bgAlpha, borderColor: type.color }
                      : { background: "white", borderColor: "oklch(90% 0.01 248.6)" }}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: isSelected ? type.bgAlpha : "oklch(95% 0.01 248.6)" }}
                      >
                        <Icon size={13} style={{ color: isSelected ? type.color : "oklch(50% 0.02 248.6)" }} />
                      </div>
                      <span
                        className="text-xs font-semibold leading-tight"
                        style={{ color: isSelected ? type.color : "var(--color-ln-navy)" }}
                      >
                        {type.label}
                      </span>
                    </div>
                    <p className="text-[10px] leading-relaxed" style={{ color: "oklch(50% 0.02 248.6)" }}>
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Situation description */}
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
          >
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: "oklch(45% 0.02 248.6)" }}>
                Describe Your Situation
              </label>
              <Textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder={getPlaceholder(selectedType)}
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
              style={{ background: activeTypeConfig.color, color: "var(--color-ln-navy)" }}
            >
              {generating ? (
                <><Loader2 size={15} className="mr-2 animate-spin" /> Generating your play…</>
              ) : (
                <>Generate {activeTypeConfig.label} Play <ChevronRight size={15} className="ml-1" /></>
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
    const typeCode = play.playbookType ?? "";
    const typeConfig = getTypeConfig(typeCode);
    const Icon = typeConfig.icon;

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
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: typeConfig.bgAlpha }}
              >
                <Icon size={13} style={{ color: typeConfig.color }} />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: typeConfig.bgAlpha, color: typeConfig.color }}>
                {typeConfig.label}
              </span>
            </div>
            <h1 className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>
              {displaySession.situation}
            </h1>
          </div>

          {/* Headline */}
          {play.headline && (
            <div className="rounded-2xl px-5 py-4" style={{ background: "var(--color-ln-navy)" }}>
              <p className="text-sm font-medium text-white leading-relaxed">{play.headline}</p>
            </div>
          )}

          {/* Diagnosis */}
          {play.diagnosis && (
            <Section title="What's Really Happening" color={typeConfig.color}>
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
                {play.conversationScript.keyPoints?.map((p: string, i: number) => (
                  <ScriptLine key={i} label={`Key Point ${i + 1}`} text={p} />
                ))}
                {play.conversationScript.closing && (
                  <ScriptLine label="Closing" text={play.conversationScript.closing} />
                )}
              </div>
            </Section>
          )}

          {/* ── Type-specific sections ─────────────────────────────────────── */}

          {/* difficult_conversation: emotionalPrep, safetySignals, recoveryScript */}
          {play.emotionalPrep && (
            <Section title="Emotional Preparation" color="#f87171">
              <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{play.emotionalPrep}</p>
            </Section>
          )}
          {play.safetySignals && (
            <Section title="Safety Signals to Watch For" color="#f87171">
              <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{play.safetySignals}</p>
            </Section>
          )}
          {play.recoveryScript && (
            <Section title="If It Goes Off Track" color="#f87171">
              <p className="text-sm leading-relaxed italic" style={{ color: "oklch(35% 0.02 248.6)" }}>"{play.recoveryScript}"</p>
            </Section>
          )}

          {/* performance_gap: rootCauseMatrix, pipPlan, checkInCadence */}
          {play.rootCauseMatrix && (
            <Section title="Root Cause Matrix" color="#f59e0b">
              <div className="space-y-3">
                {[
                  { label: "Skill Gap", key: "skill" },
                  { label: "Will / Motivation", key: "will" },
                  { label: "Context / Environment", key: "context" },
                ].map(({ label, key }) => (play.rootCauseMatrix as any)[key] && (
                  <div key={key}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#f59e0b" }}>{label}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{(play.rootCauseMatrix as any)[key]}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {play.pipPlan && (
            <Section title="Improvement Plan" color="#f59e0b">
              <div className="space-y-2">
                {[
                  { label: "Week 1", key: "week1" },
                  { label: "Week 2", key: "week2" },
                  { label: "Month 1", key: "month1" },
                  { label: "Success Criteria", key: "successCriteria" },
                ].map(({ label, key }) => (play.pipPlan as any)[key] && (
                  <div key={key} className="flex gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest w-24 flex-shrink-0 pt-0.5" style={{ color: "#f59e0b" }}>{label}</span>
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{(play.pipPlan as any)[key]}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {play.checkInCadence && (
            <Section title="Check-in Cadence" color="#f59e0b">
              <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{play.checkInCadence}</p>
            </Section>
          )}

          {/* delegation_breakdown: delegationAudit, ownershipTransfer, checkpointPlan */}
          {play.delegationAudit && (play.delegationAudit as any[]).length > 0 && (
            <Section title="Delegation Audit" color="#60a5fa">
              <div className="space-y-2">
                {(play.delegationAudit as any[]).map((item: any, i: number) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: "oklch(97% 0.005 248.6)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>{item.task}</p>
                    <div className="flex gap-4 text-[10px]" style={{ color: "oklch(50% 0.02 248.6)" }}>
                      <span>Current: <strong>{item.currentOwner}</strong></span>
                      <span>Ideal: <strong>{item.idealOwner}</strong></span>
                      <span>Level: <strong>{item.delegationLevel}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {play.ownershipTransfer && (
            <Section title="Ownership Transfer Process" color="#60a5fa">
              <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{play.ownershipTransfer}</p>
            </Section>
          )}
          {play.checkpointPlan && (
            <Section title="Checkpoint Plan" color="#60a5fa">
              <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{play.checkpointPlan}</p>
            </Section>
          )}

          {/* team_conflict: conflictMap, mediationScript, groundRules */}
          {play.conflictMap && (
            <Section title="Conflict Map" color="#a78bfa">
              <div className="space-y-3">
                {(play.conflictMap as any).party1 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#a78bfa" }}>Party 1</p>
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{(play.conflictMap as any).party1}</p>
                  </div>
                )}
                {(play.conflictMap as any).party2 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#a78bfa" }}>Party 2</p>
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{(play.conflictMap as any).party2}</p>
                  </div>
                )}
                {(play.conflictMap as any).underlyingTension && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#a78bfa" }}>Underlying Tension</p>
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{(play.conflictMap as any).underlyingTension}</p>
                  </div>
                )}
              </div>
            </Section>
          )}
          {play.mediationScript && (
            <Section title="Mediation Script" color="#a78bfa">
              <p className="text-sm leading-relaxed italic" style={{ color: "oklch(35% 0.02 248.6)" }}>"{play.mediationScript}"</p>
            </Section>
          )}
          {play.groundRules && (play.groundRules as string[]).length > 0 && (
            <Section title="Ground Rules to Establish" color="#a78bfa">
              <ul className="space-y-1.5">
                {(play.groundRules as string[]).map((r: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: "oklch(35% 0.02 248.6)" }}>
                    <span style={{ color: "#a78bfa" }}>→</span> {r}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* motivation_engagement: motivationDiagnosis, reEngagementPlan, energisingActions */}
          {play.motivationDiagnosis && (
            <Section title="Motivation Diagnosis" color="#34d399">
              <div className="space-y-3">
                {[
                  { label: "Autonomy", key: "autonomy" },
                  { label: "Mastery", key: "mastery" },
                  { label: "Purpose", key: "purpose" },
                ].map(({ label, key }) => (play.motivationDiagnosis as any)[key] && (
                  <div key={key}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#34d399" }}>{label}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{(play.motivationDiagnosis as any)[key]}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {play.reEngagementPlan && (
            <Section title="Re-engagement Plan" color="#34d399">
              <div className="space-y-2">
                {[
                  { label: "This Week", key: "thisWeek" },
                  { label: "This Month", key: "thisMonth" },
                  { label: "Ongoing", key: "ongoing" },
                ].map(({ label, key }) => (play.reEngagementPlan as any)[key] && (
                  <div key={key} className="flex gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest w-20 flex-shrink-0 pt-0.5" style={{ color: "#34d399" }}>{label}</span>
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{(play.reEngagementPlan as any)[key]}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {play.energisingActions && (play.energisingActions as string[]).length > 0 && (
            <Section title="Energising Actions" color="#34d399">
              <ul className="space-y-1.5">
                {(play.energisingActions as string[]).map((a: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: "oklch(35% 0.02 248.6)" }}>
                    <span style={{ color: "#34d399" }}>⚡</span> {a}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* feedback_resistance: resistanceType, psychologicalSafetyCheck, feedbackDeliveryScript */}
          {play.resistanceType && (
            <Section title="Resistance Type" color="#fb923c">
              <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{play.resistanceType}</p>
            </Section>
          )}
          {play.psychologicalSafetyCheck && (
            <Section title="Psychological Safety Check" color="#fb923c">
              <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{play.psychologicalSafetyCheck}</p>
            </Section>
          )}
          {play.feedbackDeliveryScript && (
            <Section title="Feedback Delivery Script" color="#fb923c">
              <p className="text-sm leading-relaxed italic" style={{ color: "oklch(35% 0.02 248.6)" }}>"{play.feedbackDeliveryScript}"</p>
            </Section>
          )}

          {/* What to avoid */}
          {play.whatToAvoid && (play.whatToAvoid as string[]).length > 0 && (
            <Section title="What to Avoid" color="#f87171">
              <ul className="space-y-1.5">
                {(play.whatToAvoid as string[]).map((w: string, i: number) => (
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
    <div
      className="rounded-2xl p-5"
      style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-3"
        style={{ color }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function ScriptLine({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#a78bfa" }}>{label}</p>
      <p className="text-sm leading-relaxed italic" style={{ color: "oklch(35% 0.02 248.6)" }}>"{text}"</p>
    </div>
  );
}

function getPlaceholder(type: PlaybookTypeCode): string {
  const placeholders: Record<PlaybookTypeCode, string> = {
    difficult_conversation: "e.g. I need to speak to a team member about their attitude in meetings — they're dismissive and interrupt others. I've been avoiding it for weeks because I don't want to damage our relationship…",
    performance_gap: "e.g. One of my engineers has been missing sprint targets for 3 months. The work they do deliver is good quality but they consistently underestimate tasks and don't flag blockers early enough…",
    delegation_breakdown: "e.g. I keep ending up doing work I've delegated. Either the team member doesn't do it, does it wrong, or comes back to me with every decision. I'm working evenings to cover the gap…",
    team_conflict: "e.g. Two of my senior team members have stopped collaborating. There's visible tension in meetings and others are picking sides. It started after a disagreement about project ownership…",
    motivation_engagement: "e.g. My best performer has gone quiet. They used to be full of ideas and energy but for the past 2 months they're doing the minimum, not volunteering for anything, and seem disengaged…",
    feedback_resistance: "e.g. I gave feedback to a team member about their communication style and they immediately became defensive, said I was being unfair, and brought up unrelated past incidents. Now they're distant…",
  };
  return placeholders[type];
}
