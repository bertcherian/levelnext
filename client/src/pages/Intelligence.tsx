/**
 * Intelligence — User-facing Intelligence Core page
 *
 * Three-tab workspace:
 *   1. Recommendations — view, accept/reject/defer, create actions
 *   2. Actions — track planned/in-progress/completed actions, update status
 *   3. Outcomes — record and review outcome observations
 *
 * This page is the user-facing engagement loop for the Intelligence Core.
 * It connects diagnostic scores → recommendations → actions → outcomes.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Circle,
  Clock,
  X,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Plus,
  ChevronDown,
  ChevronUp,
  Award,
  Activity,
  BarChart3,
  Compass,
  AlertTriangle,
  BookOpen,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import PlatformLayout from "@/components/PlatformLayout";

// ── Status badge helpers ──────────────────────────────────────────────────────

const REC_STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  generated: { bg: "oklch(from var(--color-ln-gold) l c h / 0.12)", color: "var(--color-ln-gold)", label: "New" },
  presented: { bg: "oklch(from var(--color-ln-gold) l c h / 0.12)", color: "var(--color-ln-gold)", label: "New" },
  accepted: { bg: "oklch(from #34d399 l c h / 0.15)", color: "#059669", label: "Accepted" },
  rejected: { bg: "oklch(from #ef4444 l c h / 0.12)", color: "#dc2626", label: "Rejected" },
  deferred: { bg: "oklch(90% 0.01 248.6)", color: "oklch(45% 0.02 248.6)", label: "Deferred" },
  superseded: { bg: "oklch(90% 0.01 248.6)", color: "oklch(45% 0.02 248.6)", label: "Superseded" },
};

const ACTION_STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  planned: { bg: "oklch(from var(--color-ln-gold) l c h / 0.12)", color: "var(--color-ln-gold)", label: "Planned" },
  in_progress: { bg: "oklch(from #3b82f6 l c h / 0.15)", color: "#2563eb", label: "In Progress" },
  completed: { bg: "oklch(from #34d399 l c h / 0.15)", color: "#059669", label: "Completed" },
  cancelled: { bg: "oklch(from #ef4444 l c h / 0.12)", color: "#dc2626", label: "Cancelled" },
};

const IMPACT_STYLES: Record<string, string> = {
  none: "oklch(55% 0.02 248.6)",
  minimal: "#6b7280",
  moderate: "var(--color-ln-gold)",
  significant: "#059669",
  transformative: "#7c3aed",
};

function formatDate(ts: Date | string | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Recommendations Tab ───────────────────────────────────────────────────────

function RecommendationsTab() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionFormId, setActionFormId] = useState<number | null>(null);
  const [actionType, setActionType] = useState("practice_exercise");
  const [actionDesc, setActionDesc] = useState("");
  const [actionStart, setActionStart] = useState("");
  const [actionEnd, setActionEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const utils = trpc.useUtils();
  const { data: recData, isLoading } = trpc.intelligenceCore.myRecommendations.useQuery();
  const decideMutation = trpc.intelligenceCore.decideRecommendation.useMutation({
    onSuccess: () => { toast.success("Decision recorded."); utils.intelligenceCore.myRecommendations.invalidate(); },
    onError: () => toast.error("Could not record decision."),
  });
  const createActionMutation = trpc.intelligenceCore.createAction.useMutation({
    onSuccess: () => {
      toast.success("Action created. Find it in the Actions tab.");
      setActionFormId(null);
      setActionDesc("");
      setActionStart("");
      setActionEnd("");
      setSaving(false);
      utils.intelligenceCore.myRecommendations.invalidate();
      utils.intelligenceCore.myActions.invalidate();
    },
    onError: () => { toast.error("Could not create action."); setSaving(false); },
  });

  const recommendations = recData?.recommendations ?? [];
  const pending = recommendations.filter(r => r.status === "generated" || r.status === "presented");
  const decided = recommendations.filter(r => ["accepted", "rejected", "deferred"].includes(r.status));

  const handleDecide = (recId: number, decision: "accepted" | "rejected" | "deferred") => {
    decideMutation.mutate({ recommendationId: recId, decision });
  };

  const handleCreateAction = (recId: number) => {
    if (!actionDesc.trim()) { toast.error("Please describe the action you will take."); return; }
    setSaving(true);
    createActionMutation.mutate({
      recommendationId: recId,
      actionTypeCode: actionType,
      actionDescription: actionDesc.trim(),
      plannedStartAt: actionStart ? new Date(actionStart) : undefined,
      plannedCompleteAt: actionEnd ? new Date(actionEnd) : undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>
          Recommendations
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>
          Intelligence Core analyses your diagnostic scores and recommends targeted development actions.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-ln-gold)" }} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && recommendations.length === 0 && (
        <div className="rounded-2xl px-6 py-10 text-center" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
          <Lightbulb size={28} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
          <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>No recommendations yet</h3>
          <p className="text-xs mb-4" style={{ color: "oklch(55% 0.02 248.6)" }}>
            Complete a diagnostic assessment to receive personalised intelligence recommendations.
          </p>
          <Button size="sm" onClick={() => window.location.href = "/diagnostics"}>
            Take a Diagnostic
          </Button>
        </div>
      )}

      {/* Pending recommendations */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(45% 0.02 248.6)" }}>
            Awaiting Your Decision ({pending.length})
          </p>
          {pending.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const showActionForm = actionFormId === rec.id;
            const style = REC_STATUS_STYLES[rec.status] ?? REC_STATUS_STYLES.generated;
            return (
              <div key={rec.id} className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
                {/* Card header */}
                <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : rec.id)}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded inline-block mb-2"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {style.label}
                      </span>
                      <h3 className="text-sm font-semibold leading-snug" style={{ color: "var(--color-ln-navy)" }}>
                        {rec.title}
                      </h3>
                    </div>
                    {isExpanded ? <ChevronUp size={16} style={{ color: "oklch(60% 0.02 248.6)" }} /> : <ChevronDown size={16} style={{ color: "oklch(60% 0.02 248.6)" }} />}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "oklch(50% 0.02 248.6)" }}>
                    {isExpanded ? rec.description : `${rec.description.slice(0, 140)}${rec.description.length > 140 ? "…" : ""}`}
                  </p>
                  {isExpanded && rec.explanation && (
                    <div className="mt-3 rounded-xl p-3" style={{ background: "oklch(97% 0.01 248.6)" }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles size={11} style={{ color: "var(--color-ln-gold)" }} />
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-ln-gold)" }}>Intelligence Reasoning</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: "oklch(45% 0.02 248.6)" }}>{rec.explanation}</p>
                    </div>
                  )}
                </div>

                {/* Decision buttons */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 text-xs font-semibold"
                        style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                        onClick={() => handleDecide(rec.id, "accepted")}
                        disabled={decideMutation.isPending}
                      >
                        <CheckCircle2 size={13} className="mr-1.5" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs font-semibold"
                        onClick={() => handleDecide(rec.id, "deferred")}
                        disabled={decideMutation.isPending}
                      >
                        <Clock size={13} className="mr-1.5" /> Defer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs font-semibold"
                        style={{ color: "#dc2626", borderColor: "oklch(from #ef4444 l c h / 0.3)" }}
                        onClick={() => handleDecide(rec.id, "rejected")}
                        disabled={decideMutation.isPending}
                      >
                        <X size={13} className="mr-1.5" /> Reject
                      </Button>
                    </div>

                    {/* Create action link */}
                    <button
                      className="text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      style={{ color: showActionForm ? "oklch(45% 0.02 248.6)" : "var(--color-ln-gold)" }}
                      onClick={() => setActionFormId(showActionForm ? null : rec.id)}
                    >
                      {showActionForm ? <X size={12} /> : <Plus size={12} />}
                      {showActionForm ? "Cancel" : "Create an action commitment"}
                    </button>

                    {/* Action form */}
                    {showActionForm && (
                      <div className="rounded-xl p-4 space-y-3" style={{ background: "oklch(97% 0.01 248.6)", border: "1px solid oklch(90% 0.01 248.6)" }}>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>Action Type</label>
                          <Select value={actionType} onValueChange={setActionType}>
                            <SelectTrigger className="text-xs h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="practice_exercise">Practice Exercise</SelectItem>
                              <SelectItem value="ai_simulation">AI Simulation</SelectItem>
                              <SelectItem value="coaching_session">Coaching Session</SelectItem>
                              <SelectItem value="reflection">Reflection Journal</SelectItem>
                              <SelectItem value="stakeholder_conversation">Stakeholder Conversation</SelectItem>
                              <SelectItem value="reading">Reading / Study</SelectItem>
                              <SelectItem value="workshop">Workshop Attendance</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>What will you do?</label>
                          <Textarea
                            value={actionDesc}
                            onChange={(e) => setActionDesc(e.target.value)}
                            placeholder="Describe the specific action you will take…"
                            className="text-xs resize-none min-h-[60px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>Start Date</label>
                            <Input type="date" value={actionStart} onChange={(e) => setActionStart(e.target.value)} className="text-xs h-9" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>Target Completion</label>
                            <Input type="date" value={actionEnd} onChange={(e) => setActionEnd(e.target.value)} className="text-xs h-9" />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full text-xs font-semibold"
                          style={{ background: "var(--color-ln-navy)", color: "white" }}
                          onClick={() => handleCreateAction(rec.id)}
                          disabled={saving}
                        >
                          {saving ? <><Loader2 size={12} className="mr-1.5 animate-spin" />Creating…</> : <><Target size={12} className="mr-1.5" />Create Action</>}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Decided recommendations */}
      {decided.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(45% 0.02 248.6)" }}>
            Reviewed ({decided.length})
          </p>
          {decided.map((rec) => {
            const style = REC_STATUS_STYLES[rec.status] ?? REC_STATUS_STYLES.deferred;
            return (
              <div key={rec.id} className="rounded-xl p-4" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)", opacity: rec.status === "rejected" ? 0.6 : 1 }}>
                <div className="flex items-start gap-3">
                  {rec.status === "accepted" ? (
                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#34d399" }} />
                  ) : rec.status === "rejected" ? (
                    <X size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#dc2626" }} />
                  ) : (
                    <Clock size={16} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(60% 0.02 248.6)" }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-ln-navy)" }}>{rec.title}</p>
                    <p className="text-[11px] mt-1" style={{ color: "oklch(55% 0.02 248.6)" }}>
                      {formatDate(rec.decidedAt)} · {style.label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Actions Tab ───────────────────────────────────────────────────────────────

function ActionsTab() {
  const [outcomeFormId, setOutcomeFormId] = useState<number | null>(null);
  const [impactLevel, setImpactLevel] = useState<"none" | "minimal" | "moderate" | "significant" | "transformative">("moderate");
  const [recValue, setRecValue] = useState<"not_helpful" | "slightly_helpful" | "helpful" | "very_helpful" | "essential">("helpful");
  const [outcomeSummary, setOutcomeSummary] = useState("");
  const [saving, setSaving] = useState(false);

  const utils = trpc.useUtils();
  const { data: actionData, isLoading } = trpc.intelligenceCore.myActions.useQuery();
  const updateStatusMutation = trpc.intelligenceCore.updateActionStatus.useMutation({
    onSuccess: () => { toast.success("Action updated."); utils.intelligenceCore.myActions.invalidate(); },
    onError: () => toast.error("Could not update action."),
  });
  const recordOutcomeMutation = trpc.intelligenceCore.recordOutcome.useMutation({
    onSuccess: () => {
      toast.success("Outcome recorded. Thank you for sharing your progress.");
      setOutcomeFormId(null);
      setOutcomeSummary("");
      setSaving(false);
      utils.intelligenceCore.myActions.invalidate();
      utils.intelligenceCore.myOutcomes.invalidate();
    },
    onError: () => { toast.error("Could not record outcome."); setSaving(false); },
  });

  const actions = actionData?.actions ?? [];
  const active = actions.filter(a => a.status === "planned" || a.status === "in_progress");
  const completed = actions.filter(a => a.status === "completed" || a.status === "cancelled");

  const handleRecordOutcome = (actionId: number, recommendationId: number) => {
    if (!outcomeSummary.trim()) { toast.error("Please describe the outcome you observed."); return; }
    setSaving(true);
    recordOutcomeMutation.mutate({
      actionId,
      recommendationId,
      impactLevel,
      recommendationValue: recValue,
      outcomeSummary: outcomeSummary.trim(),
      evidence: { evidenceSource: "self_report" },
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h2 className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>My Actions</h2>
        <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>
          Track the development actions you've committed to. Update status as you progress.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-ln-gold)" }} />
        </div>
      )}

      {!isLoading && actions.length === 0 && (
        <div className="rounded-2xl px-6 py-10 text-center" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
          <Target size={28} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
          <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>No actions yet</h3>
          <p className="text-xs mb-4" style={{ color: "oklch(55% 0.02 248.6)" }}>
            Accept a recommendation and create an action commitment to get started.
          </p>
          <Button size="sm" onClick={() => window.location.href = "/intelligence"}>
            View Recommendations
          </Button>
        </div>
      )}

      {/* Active actions */}
      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(45% 0.02 248.6)" }}>
            Active ({active.length})
          </p>
          {active.map((action) => {
            const style = ACTION_STATUS_STYLES[action.status] ?? ACTION_STATUS_STYLES.planned;
            const showOutcomeForm = outcomeFormId === action.id;
            return (
              <div key={action.id} className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
                <div className="flex items-start gap-3">
                  <Circle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(70% 0.01 248.6)" }} />
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded inline-block mb-2"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {style.label}
                    </span>
                    <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-ln-navy)" }}>
                      {action.actionDescription}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "oklch(55% 0.02 248.6)" }}>
                      {formatDate(action.createdAt)} · {action.actionTypeCode.replace(/_/g, " ")}
                    </p>
                    {action.plannedCompleteAt && (
                      <p className="text-[11px] mt-0.5" style={{ color: "oklch(55% 0.02 248.6)" }}>
                        Target: {formatDate(action.plannedCompleteAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status update buttons */}
                <div className="flex gap-2 pl-7">
                  {action.status === "planned" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-semibold"
                      onClick={() => updateStatusMutation.mutate({ actionId: action.id, status: "in_progress" })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <ArrowRight size={12} className="mr-1.5" /> Start
                    </Button>
                  )}
                  {action.status === "in_progress" && (
                    <Button
                      size="sm"
                      className="text-xs font-semibold"
                      style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                      onClick={() => updateStatusMutation.mutate({ actionId: action.id, status: "completed" })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle2 size={12} className="mr-1.5" /> Mark Complete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-semibold"
                    style={{ color: "#dc2626", borderColor: "oklch(from #ef4444 l c h / 0.3)" }}
                    onClick={() => updateStatusMutation.mutate({ actionId: action.id, status: "cancelled" })}
                    disabled={updateStatusMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Outcome recording for completed actions */}
                {action.status === "completed" && (
                  <div className="pl-7">
                    <button
                      className="text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      style={{ color: showOutcomeForm ? "oklch(45% 0.02 248.6)" : "var(--color-ln-gold)" }}
                      onClick={() => setOutcomeFormId(showOutcomeForm ? null : action.id)}
                    >
                      {showOutcomeForm ? <X size={12} /> : <TrendingUp size={12} />}
                      {showOutcomeForm ? "Cancel" : "Record Outcome"}
                    </button>

                    {showOutcomeForm && (
                      <div className="mt-3 rounded-xl p-4 space-y-3" style={{ background: "oklch(97% 0.01 248.6)", border: "1px solid oklch(90% 0.01 248.6)" }}>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>Impact Level</label>
                          <Select value={impactLevel} onValueChange={(v) => setImpactLevel(v as typeof impactLevel)}>
                            <SelectTrigger className="text-xs h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No noticeable impact</SelectItem>
                              <SelectItem value="minimal">Minimal impact</SelectItem>
                              <SelectItem value="moderate">Moderate impact</SelectItem>
                              <SelectItem value="significant">Significant impact</SelectItem>
                              <SelectItem value="transformative">Transformative</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>Was this recommendation helpful?</label>
                          <Select value={recValue} onValueChange={(v) => setRecValue(v as typeof recValue)}>
                            <SelectTrigger className="text-xs h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_helpful">Not helpful</SelectItem>
                              <SelectItem value="slightly_helpful">Slightly helpful</SelectItem>
                              <SelectItem value="helpful">Helpful</SelectItem>
                              <SelectItem value="very_helpful">Very helpful</SelectItem>
                              <SelectItem value="essential">Essential</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>What changed?</label>
                          <Textarea
                            value={outcomeSummary}
                            onChange={(e) => setOutcomeSummary(e.target.value)}
                            placeholder="Describe the outcome you observed after taking this action…"
                            className="text-xs resize-none min-h-[60px]"
                          />
                        </div>
                        <Button
                          size="sm"
                          className="w-full text-xs font-semibold"
                          style={{ background: "var(--color-ln-navy)", color: "white" }}
                          onClick={() => handleRecordOutcome(action.id, action.recommendationId)}
                          disabled={saving}
                        >
                          {saving ? <><Loader2 size={12} className="mr-1.5 animate-spin" />Saving…</> : <><Award size={12} className="mr-1.5" />Record Outcome</>}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed/cancelled actions */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(45% 0.02 248.6)" }}>
            History ({completed.length})
          </p>
          {completed.map((action) => {
            const style = ACTION_STATUS_STYLES[action.status] ?? ACTION_STATUS_STYLES.completed;
            return (
              <div key={action.id} className="rounded-xl p-4 opacity-70" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
                <div className="flex items-start gap-3">
                  {action.status === "completed" ? (
                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#34d399" }} />
                  ) : (
                    <X size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#dc2626" }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded inline-block mb-2"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {style.label}
                    </span>
                    <p className="text-sm leading-snug" style={{ color: "var(--color-ln-navy)" }}>{action.actionDescription}</p>
                    <p className="text-[11px] mt-1" style={{ color: "oklch(55% 0.02 248.6)" }}>
                      {formatDate(action.completedAt ?? action.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Outcomes Tab ──────────────────────────────────────────────────────────────

function OutcomesTab() {
  const { data: outcomeData, isLoading } = trpc.intelligenceCore.myOutcomes.useQuery();
  const { data: actionData } = trpc.intelligenceCore.myActions.useQuery();
  // Note: query invalidation handled by recordOutcomeMutation in ActionsTab
  const outcomes = outcomeData?.outcomes ?? [];
  const actions = actionData?.actions ?? [];

  // Compute summary stats
  const totalActions = actions.length;
  const completedActions = actions.filter(a => a.status === "completed").length;
  const cancelledActions = actions.filter(a => a.status === "cancelled").length;
  const outcomesRecorded = outcomes.length;
  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // Impact distribution
  const impactLevels = ["none", "minimal", "moderate", "significant", "transformative"] as const;
  const impactCounts = impactLevels.map(level => ({
    level,
    count: outcomes.filter(o => o.impactLevel === level).length,
    color: IMPACT_STYLES[level] ?? "oklch(55% 0.02 248.6)",
  }));
  const maxImpactCount = Math.max(...impactCounts.map(c => c.count), 1);

  // Recommendation value distribution
  const recValueLevels = ["not_helpful", "slightly_helpful", "helpful", "very_helpful", "essential"] as const;
  const recValueCounts = recValueLevels.map(level => ({
    level,
    label: level.replace(/_/g, " "),
    count: outcomes.filter(o => o.recommendationValue === level).length,
  }));
  const maxRecValueCount = Math.max(...recValueCounts.map(c => c.count), 1);

  // Impact score: weighted average (none=0, minimal=1, moderate=2, significant=3, transformative=4)
  const impactWeight: Record<string, number> = { none: 0, minimal: 1, moderate: 2, significant: 3, transformative: 4 };
  const avgImpactScore = outcomes.length > 0
    ? (outcomes.reduce((sum, o) => sum + (impactWeight[o.impactLevel] ?? 0), 0) / outcomes.length).toFixed(1)
    : "0.0";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h2 className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>Outcome History</h2>
        <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>
          Outcomes you've recorded after completing development actions.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-ln-gold)" }} />
        </div>
      )}

      {!isLoading && outcomes.length === 0 && totalActions === 0 && (
        <div className="rounded-2xl px-6 py-10 text-center" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
          <Activity size={28} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
          <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>No outcomes recorded yet</h3>
          <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>
            Complete an action and record the outcome to track your development impact.
          </p>
        </div>
      )}

      {/* Progress Summary Chart — shown whenever there are actions or outcomes */}
      {(outcomes.length > 0 || totalActions > 0) && !isLoading && (
        <>
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} style={{ color: "var(--color-ln-gold)" }} />
              <h3 className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>Your Progress</h3>
            </div>

            {/* Summary stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{totalActions}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "oklch(55% 0.02 248.6)" }}>Total Actions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#059669" }}>{completedActions}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "oklch(55% 0.02 248.6)" }}>Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--color-ln-gold)" }}>{outcomesRecorded}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "oklch(55% 0.02 248.6)" }}>Outcomes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#7c3aed" }}>{avgImpactScore}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "oklch(55% 0.02 248.6)" }}>Avg Impact</p>
              </div>
            </div>

            {/* Completion rate bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold" style={{ color: "oklch(45% 0.02 248.6)" }}>Completion Rate</span>
                <span className="text-[11px] font-bold" style={{ color: "var(--color-ln-navy)" }}>{completionRate}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(93% 0.01 248.6)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${completionRate}%`,
                    background: "linear-gradient(90deg, var(--color-ln-gold), #059669)",
                  }}
                />
              </div>
            </div>

            {/* Impact distribution bars */}
            <div className="mb-5">
              <p className="text-[11px] font-semibold mb-2" style={{ color: "oklch(45% 0.02 248.6)" }}>Impact Distribution</p>
              <div className="space-y-2">
                {impactCounts.map(({ level, count, color }) => (
                  <div key={level} className="flex items-center gap-2">
                    <span className="text-[10px] font-medium w-20 flex-shrink-0 capitalize" style={{ color: "oklch(45% 0.02 248.6)" }}>
                      {level}
                    </span>
                    <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: "oklch(95% 0.005 248.6)" }}>
                      <div
                        className="h-full rounded-md transition-all duration-500 flex items-center justify-end px-1.5"
                        style={{
                          width: `${(count / maxImpactCount) * 100}%`,
                          background: count > 0 ? color : "transparent",
                          minWidth: count > 0 ? "24px" : "0",
                        }}
                      >
                        {count > 0 && (
                          <span className="text-[9px] font-bold text-white">{count}</span>
                        )}
                      </div>
                    </div>
                    {count === 0 && (
                      <span className="text-[9px]" style={{ color: "oklch(70% 0.01 248.6)" }}>0</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation value distribution */}
            <div>
              <p className="text-[11px] font-semibold mb-2" style={{ color: "oklch(45% 0.02 248.6)" }}>Recommendation Value</p>
              <div className="space-y-2">
                {recValueCounts.map(({ level, label, count }) => (
                  <div key={level} className="flex items-center gap-2">
                    <span className="text-[10px] font-medium w-24 flex-shrink-0 capitalize" style={{ color: "oklch(45% 0.02 248.6)" }}>
                      {label}
                    </span>
                    <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: "oklch(95% 0.005 248.6)" }}>
                      <div
                        className="h-full rounded-md transition-all duration-500 flex items-center justify-end px-1.5"
                        style={{
                          width: `${(count / maxRecValueCount) * 100}%`,
                          background: count > 0 ? "var(--color-ln-navy)" : "transparent",
                          minWidth: count > 0 ? "24px" : "0",
                        }}
                      >
                        {count > 0 && (
                          <span className="text-[9px] font-bold text-white">{count}</span>
                        )}
                      </div>
                    </div>
                    {count === 0 && (
                      <span className="text-[9px]" style={{ color: "oklch(70% 0.01 248.6)" }}>0</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Outcome history list */}
          {outcomes.length > 0 && (
            <div className="space-y-3">
              {outcomes.map((outcome) => {
                const impactColor = IMPACT_STYLES[outcome.impactLevel] ?? "oklch(55% 0.02 248.6)";
                return (
                  <div key={outcome.id} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: `oklch(from ${impactColor} l c h / 0.12)` }}
                      >
                        <TrendingUp size={14} style={{ color: impactColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                            style={{ background: `oklch(from ${impactColor} l c h / 0.12)`, color: impactColor }}
                          >
                            {outcome.impactLevel}
                          </span>
                          <span className="text-[10px]" style={{ color: "oklch(55% 0.02 248.6)" }}>
                            {formatDate(outcome.observedAt)}
                          </span>
                        </div>
                        {outcome.outcomeSummary && (
                          <p className="text-sm leading-relaxed" style={{ color: "var(--color-ln-navy)" }}>
                            {outcome.outcomeSummary}
                          </p>
                        )}
                        <p className="text-[11px] mt-1.5" style={{ color: "oklch(55% 0.02 248.6)" }}>
                          Recommendation value: {outcome.recommendationValue.replace(/_/g, " ")} · Confidence: {outcome.causalConfidence}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Intelligence() {
  const { data: eciProfile, isLoading: profileLoading } = trpc.intelligenceCore.getEciProfile.useQuery();
  const [profileExpanded, setProfileExpanded] = useState(false);

  const hasProfile = eciProfile && "hasEciDiagnostic" in eciProfile && eciProfile.hasEciDiagnostic;
  const profile = hasProfile ? eciProfile : null;

  return (
    <PlatformLayout>
      <div className="min-h-screen" style={{ background: "oklch(98% 0.005 248.6)" }}>
        {/* Page header */}
        <div className="border-b" style={{ background: "var(--color-ln-navy)", borderColor: "oklch(from var(--color-ln-navy) l c h / 0.2)" }}>
          <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.15)" }}
              >
                <Sparkles size={20} style={{ color: "var(--color-ln-gold)" }} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Intelligence Core</h1>
                <p className="text-xs" style={{ color: "oklch(70% 0.01 248.6)" }}>
                  Diagnostic insights → Recommendations → Actions → Outcomes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ECI Profile Section */}
        {profileLoading && (
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
              <Loader2 size={16} className="animate-spin" style={{ color: "var(--color-ln-gold)" }} />
              <span className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>Loading your ECI profile…</span>
            </div>
          </div>
        )}

        {hasProfile && profile && (
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
              {/* Archetype header */}
              {profile.archetype && (
                <div className="p-5" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.03)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Compass size={16} style={{ color: "var(--color-ln-gold)" }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "oklch(55% 0.02 248.6)" }}>Your Communication Archetype</span>
                  </div>
                  <h3 className="text-base font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>{profile.archetype.label}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "oklch(50% 0.02 248.6)" }}>{profile.archetype.description}</p>

                  {/* Core strengths & blind spots */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#059669" }}>Core Strengths</p>
                      <ul className="space-y-1">
                        {(profile.archetype.coreStrengths ?? []).slice(0, 3).map((s: string, i: number) => (
                          <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>
                            <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#34d399" }} />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#dc2626" }}>Blind Spots</p>
                      <ul className="space-y-1">
                        {(profile.archetype.blindSpots ?? []).slice(0, 3).map((s: string, i: number) => (
                          <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>
                            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Development priorities */}
                  {(profile.archetype.developmentPriorities ?? []).length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-ln-gold)" }}>Development Priorities</p>
                      <div className="flex flex-wrap gap-2">
                        {(profile.archetype.developmentPriorities ?? []).map((p: string, i: number) => (
                          <span key={i} className="text-[11px] px-2 py-1 rounded-full" style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.1)", color: "var(--color-ln-navy)" }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Expandable details */}
              <button
                onClick={() => setProfileExpanded(!profileExpanded)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold"
                style={{ color: "var(--color-ln-navy)", borderTop: "1px solid oklch(90% 0.01 248.6)" }}
              >
                <span>{profileExpanded ? "Hide" : "Show"} development details, risks & practice scenarios</span>
                {profileExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {profileExpanded && (
                <div className="px-5 pb-5 space-y-5">
                  {/* Triggered executive risks */}
                  {(profile.triggeredRisks ?? []).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} style={{ color: "#dc2626" }} />
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#dc2626" }}>Executive Risks to Watch</p>
                      </div>
                      <div className="space-y-2">
                        {(profile.triggeredRisks ?? []).map((risk: any) => (
                          <div key={risk.id} className="rounded-lg p-3" style={{ background: "oklch(from #ef4444 l c h / 0.05)", border: "1px solid oklch(from #ef4444 l c h / 0.15)" }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>{risk.label}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>Indicators</p>
                                <ul className="space-y-0.5">
                                  {risk.behaviouralIndicators.slice(0, 2).map((ind: string, i: number) => (
                                    <li key={i} className="text-[10px]" style={{ color: "oklch(50% 0.02 248.6)" }}>• {ind}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>Coaching Focus</p>
                                <ul className="space-y-0.5">
                                  {risk.coachingPriorities.slice(0, 2).map((c: string, i: number) => (
                                    <li key={i} className="text-[10px]" style={{ color: "oklch(50% 0.02 248.6)" }}>• {c}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended coaching interventions */}
                  {(profile.recommendedInterventions ?? []).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={14} style={{ color: "var(--color-ln-gold)" }} />
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-gold)" }}>Recommended Development Pathways</p>
                      </div>
                      <div className="space-y-3">
                        {(profile.recommendedInterventions ?? []).map((int: any) => (
                          <div key={int.id} className="rounded-lg p-4" style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.05)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.15)" }}>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold" style={{ color: "var(--color-ln-navy)" }}>{int.objective}</p>
                              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--color-ln-navy)", color: "white" }}>
                                {int.suggestedDurationWeeks} weeks
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>Practice Exercises</p>
                                <ul className="space-y-0.5">
                                  {int.practiceExercises.slice(0, 3).map((ex: string, i: number) => (
                                    <li key={i} className="text-[10px]" style={{ color: "oklch(50% 0.02 248.6)" }}>• {ex}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>AI Simulations</p>
                                <ul className="space-y-0.5">
                                  {int.aiSimulations.slice(0, 2).map((sim: string, i: number) => (
                                    <li key={i} className="text-[10px]" style={{ color: "oklch(50% 0.02 248.6)" }}>• {sim}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#059669" }}>Success Metrics</p>
                              <div className="flex flex-wrap gap-1.5">
                                {int.successMetrics.map((m: string, i: number) => (
                                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "oklch(from #34d399 l c h / 0.1)", color: "#059669" }}>{m}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Practice scenarios */}
                  {(profile.recommendedScenarios ?? []).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap size={14} style={{ color: "var(--color-ln-gold)" }} />
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-gold)" }}>Practice Scenarios for Your Weakest Dimensions</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(profile.recommendedScenarios ?? []).map((ps: any) => (
                          <div key={ps.id} className="rounded-lg p-3" style={{ background: "oklch(98% 0.005 248.6)", border: "1px solid oklch(90% 0.01 248.6)" }}>
                            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-gold)" }}>{ps.difficulty}</span>
                            <p className="text-[11px] mt-1" style={{ color: "var(--color-ln-navy)" }}>{ps.scenario}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Promotion readiness */}
                  {(profile.promotionReadiness ?? []).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} style={{ color: "var(--color-ln-navy)" }} />
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>Promotion Readiness Assessment</p>
                      </div>
                      <div className="space-y-2">
                        {(profile.promotionReadiness ?? []).map((pr: any) => (
                          <div key={pr.id} className="rounded-lg p-3" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.03)" }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>{pr.label}</p>
                            <p className="text-[11px]" style={{ color: "oklch(50% 0.02 248.6)" }}>{pr.readinessAssessment}</p>
                            <p className="text-[10px] mt-1" style={{ color: "var(--color-ln-gold)" }}>Focus: {pr.developmentFocus}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="recommendations" className="w-full">
          <div className="sticky top-0 z-10 border-b" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
            <div className="max-w-3xl mx-auto px-4">
              <TabsList className="w-full justify-start bg-transparent h-12 p-0 gap-1">
                <TabsTrigger
                  value="recommendations"
                  className="text-xs font-semibold data-[state=active]:text-ln-navy data-[state=active]:border-b-2 data-[state=active]:border-ln-gold rounded-none h-12 px-4"
                >
                  Recommendations
                </TabsTrigger>
                <TabsTrigger
                  value="actions"
                  className="text-xs font-semibold data-[state=active]:text-ln-navy data-[state=active]:border-b-2 data-[state=active]:border-ln-gold rounded-none h-12 px-4"
                >
                  Actions
                </TabsTrigger>
                <TabsTrigger
                  value="outcomes"
                  className="text-xs font-semibold data-[state=active]:text-ln-navy data-[state=active]:border-b-2 data-[state=active]:border-ln-gold rounded-none h-12 px-4"
                >
                  Outcomes
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="recommendations" className="mt-0">
            <RecommendationsTab />
          </TabsContent>
          <TabsContent value="actions" className="mt-0">
            <ActionsTab />
          </TabsContent>
          <TabsContent value="outcomes" className="mt-0">
            <OutcomesTab />
          </TabsContent>
        </Tabs>
      </div>
    </PlatformLayout>
  );
}
