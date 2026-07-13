import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Zap,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  XCircle,
  Minus,
  PhoneMissed,
  Sparkles,
  AlertTriangle,
  Calendar,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

const MODULE_LABELS: Record<string, string> = {
  ECI: "Executive Communication",
  TII: "Time Intelligence",
  LII: "Leadership Influence",
  GCC: "GCC Readiness",
  LDI: "Derailment Intelligence",
  STI: "Strategic Thinking",
};

const OUTCOME_OPTIONS = [
  { value: "implemented", label: "Implemented", desc: "Leader gave a specific real example", icon: <CheckCircle2 size={18} />, color: "text-green-700", bg: "bg-green-500/10 border-green-500/30 hover:bg-green-500/20" },
  { value: "partial", label: "Partial", desc: "Leader tried but faced a blocker", icon: <Minus size={18} />, color: "text-amber-700", bg: "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20" },
  { value: "not_implemented", label: "Not Done", desc: "Leader disengaged or forgot", icon: <XCircle size={18} />, color: "text-red-700", bg: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" },
  { value: "no_show", label: "No Show", desc: "Leader did not pick up", icon: <PhoneMissed size={18} />, color: "text-gray-600", bg: "bg-gray-500/10 border-gray-500/30 hover:bg-gray-500/20" },
];

export default function AdminMomentumBrief({ params }: { params: { userId: string } }) {
  const userId = parseInt(params.userId, 10);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.momentumPartner.getPreCallBrief.useQuery({ userId });
  const generateScript = trpc.momentumPartner.generateOpeningScript.useMutation();
  const scheduleCall = trpc.momentumPartner.scheduleCall.useMutation();
  const logOutcome = trpc.momentumPartner.logOutcome.useMutation();
  const markMissed = trpc.momentumPartner.markMissed.useMutation();

  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Outcome form state
  const [selectedOutcome, setSelectedOutcome] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(3);
  const [callNotes, setCallNotes] = useState("");
  const [blocker, setBlocker] = useState("");
  const [escalate, setEscalate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleGenerateScript() {
    if (!data) return;
    const commitment = data.activeCommitments[0];
    const latestReport = data.allReports[0];
    const result = await generateScript.mutateAsync({
      userId,
      commitmentText: commitment?.text ?? "No commitment recorded yet",
      leaderName: data.user.name ?? "Leader",
      practiceSessions: data.activityLast14Days.practiceSessions,
      guideConversations: data.activityLast14Days.guideConversations,
      lastCallNotes: data.lastCompletedCall?.callNotes ?? undefined,
      archetype: latestReport?.archetype ?? undefined,
      zone: latestReport?.zone ?? undefined,
    });
    setGeneratedScript(result.script);
  }

  async function handleCopyScript() {
    await navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleScheduleCall() {
    const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const commitment = data?.activeCommitments[0];
    await scheduleCall.mutateAsync({
      userId,
      scheduledAt: twoWeeks.toISOString(),
      commitmentText: commitment?.text,
      commitmentId: commitment?.id,
    });
    utils.momentumPartner.getPreCallBrief.invalidate({ userId });
    utils.momentumPartner.getCallQueue.invalidate();
    toast.success("Next call scheduled for 2 weeks from now");
  }

  async function handleLogOutcome() {
    if (!selectedOutcome || !data?.scheduledCall) return;
    setSubmitting(true);
    try {
      await logOutcome.mutateAsync({
        callId: data.scheduledCall.id,
        outcome: selectedOutcome as "implemented" | "partial" | "not_implemented" | "no_show",
        leaderConfidence: confidence,
        callNotes: callNotes || undefined,
        blockerMentioned: blocker || undefined,
        escalateToCoach: escalate,
        suggestedOpening: generatedScript || undefined,
      });
      utils.momentumPartner.getPreCallBrief.invalidate({ userId });
      utils.momentumPartner.getCallQueue.invalidate();
      toast.success("Call outcome logged successfully");
      setSelectedOutcome("");
      setCallNotes("");
      setBlocker("");
      setEscalate(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <PlatformLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </PlatformLayout>
    );
  }

  if (!data) {
    return (
      <PlatformLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-muted-foreground">Leader not found.</div>
      </PlatformLayout>
    );
  }

  const latestReport = data.allReports[0] ?? null;
  const primaryCommitment = data.activeCommitments[0] ?? null;
  const hasScheduledCall = !!data.scheduledCall;

  return (
    <PlatformLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Back + Header */}
        <div>
          <button
            onClick={() => navigate("/admin/momentum")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Call Queue
          </button>
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ background: "var(--color-ln-navy)", color: "white" }}
            >
              {(data.user.name ?? data.user.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                {data.user.name || data.user.email}
              </h1>
              <p className="text-sm text-muted-foreground">{data.user.email}</p>
            </div>
          </div>
        </div>

        {/* ── Context Card ── */}
        <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Leader Context</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Primary Diagnostic</p>
              <p className="text-sm font-semibold mt-0.5">
                {latestReport ? MODULE_LABELS[latestReport.moduleType] ?? latestReport.moduleType : "None yet"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Edge Score</p>
              <p className="text-sm font-semibold mt-0.5">
                {latestReport ? `${Math.round(latestReport.edgeScore)} / 100` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Zone</p>
              <p className="text-sm font-semibold mt-0.5">{latestReport?.zone ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Archetype</p>
              <p className="text-sm font-semibold mt-0.5">{latestReport?.archetype ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Diagnostics Done</p>
              <p className="text-sm font-semibold mt-0.5">{data.allReports.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-semibold mt-0.5">
                {new Date(data.user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* ── Activity Signals ── */}
        <div className="rounded-xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Activity Since Last Call (14 days)</h2>
          <div className="flex gap-4 flex-wrap">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${data.activityLast14Days.practiceSessions > 0 ? "bg-emerald-500/10" : "bg-black/5"}`}>
              <Zap size={18} className={data.activityLast14Days.practiceSessions > 0 ? "text-emerald-600" : "text-muted-foreground"} />
              <div>
                <p className="text-lg font-bold leading-none">{data.activityLast14Days.practiceSessions}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Practice Sessions</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${data.activityLast14Days.guideConversations > 0 ? "bg-blue-500/10" : "bg-black/5"}`}>
              <MessageSquare size={18} className={data.activityLast14Days.guideConversations > 0 ? "text-blue-600" : "text-muted-foreground"} />
              <div>
                <p className="text-lg font-bold leading-none">{data.activityLast14Days.guideConversations}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Guide Conversations</p>
              </div>
            </div>
            {data.activityLast14Days.practiceSessions === 0 && data.activityLast14Days.guideConversations === 0 && (
              <p className="text-sm text-amber-700 bg-amber-500/10 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertTriangle size={15} />
                No platform activity — leader may be disengaged
              </p>
            )}
          </div>
        </div>

        {/* ── The Commitment ── */}
        <div className="rounded-xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">The Commitment to Track</h2>
          {primaryCommitment ? (
            <div>
              <blockquote
                className="text-base font-medium leading-relaxed pl-4 border-l-4"
                style={{ borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
              >
                "{primaryCommitment.text}"
              </blockquote>
              <p className="text-xs text-muted-foreground mt-2">
                Created {new Date(primaryCommitment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                {primaryCommitment.sourceType ? ` · from ${primaryCommitment.sourceType}` : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No active commitment recorded yet. Ask the leader to set one via their Guide session.</p>
          )}
        </div>

        {/* ── Last Call Notes ── */}
        {data.lastCompletedCall && (
          <div className="rounded-xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Last Call Summary</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="text-sm">{new Date(data.lastCompletedCall.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                {data.lastCompletedCall.outcome && (
                  <Badge variant="outline" className={`text-xs capitalize ${
                    data.lastCompletedCall.outcome === "implemented" ? "bg-green-500/10 text-green-700 border-green-500/30" :
                    data.lastCompletedCall.outcome === "partial" ? "bg-amber-500/10 text-amber-700 border-amber-500/30" :
                    "bg-red-500/10 text-red-700 border-red-500/30"
                  }`}>
                    {data.lastCompletedCall.outcome.replace("_", " ")}
                  </Badge>
                )}
                {data.lastCompletedCall.leaderConfidence && (
                  <span className="text-xs text-muted-foreground">Confidence: {data.lastCompletedCall.leaderConfidence}/5</span>
                )}
              </div>
              {data.lastCompletedCall.callNotes && (
                <p className="text-sm leading-relaxed text-foreground/80 pl-5">{data.lastCompletedCall.callNotes}</p>
              )}
              {data.lastCompletedCall.blockerMentioned && (
                <p className="text-sm text-amber-700 bg-amber-500/10 px-3 py-2 rounded-lg pl-5">
                  <strong>Blocker:</strong> {data.lastCompletedCall.blockerMentioned}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── AI Opening Script ── */}
        <div className="rounded-xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Suggested Opening Script</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateScript}
              disabled={generateScript.isPending}
              className="gap-1.5 text-xs"
            >
              <Sparkles size={13} />
              {generateScript.isPending ? "Generating…" : generatedScript ? "Regenerate" : "Generate"}
            </Button>
          </div>
          {generatedScript ? (
            <div>
              <blockquote
                className="text-sm leading-relaxed pl-4 border-l-4 italic"
                style={{ borderLeftColor: "var(--color-ln-yellow)" }}
              >
                {generatedScript}
              </blockquote>
              <button
                onClick={handleCopyScript}
                className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Click Generate to create a personalised opening based on this leader's commitment and recent activity.
            </p>
          )}
        </div>

        {/* ── Log Outcome ── */}
        <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Log Call Outcome</h2>
            {!hasScheduledCall && (
              <Button size="sm" variant="outline" onClick={handleScheduleCall} disabled={scheduleCall.isPending} className="text-xs gap-1.5">
                <Calendar size={13} />
                Schedule Next Call
              </Button>
            )}
          </div>

          {hasScheduledCall ? (
            <>
              <p className="text-xs text-muted-foreground">
                Scheduled: {new Date(data.scheduledCall!.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>

              {/* Outcome selector */}
              <div className="grid grid-cols-2 gap-2">
                {OUTCOME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedOutcome(opt.value)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      selectedOutcome === opt.value
                        ? `${opt.bg} ${opt.color} border-2`
                        : "border hover:bg-black/4"
                    }`}
                    style={selectedOutcome !== opt.value ? { borderColor: "var(--color-border)" } : {}}
                  >
                    <div className={`flex items-center gap-2 font-semibold text-sm ${selectedOutcome === opt.value ? opt.color : ""}`}>
                      {opt.icon}
                      {opt.label}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {/* Confidence slider */}
              {selectedOutcome && selectedOutcome !== "no_show" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Leader's confidence level: <strong>{confidence}/5</strong>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={confidence}
                    onChange={(e) => setConfidence(parseInt(e.target.value))}
                    className="w-full mt-1 accent-[var(--color-ln-navy)]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Low</span><span>Medium</span><span>High</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOutcome && selectedOutcome !== "no_show" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Call notes <span className="font-normal">(what the leader said, specific examples)</span>
                  </label>
                  <Textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="e.g. Ravi gave a specific example of pausing before responding in a board meeting last Tuesday…"
                    className="text-sm resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Blocker */}
              {(selectedOutcome === "partial" || selectedOutcome === "not_implemented") && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Blocker mentioned</label>
                  <Textarea
                    value={blocker}
                    onChange={(e) => setBlocker(e.target.value)}
                    placeholder="e.g. Travel schedule, team conflict, forgot the commitment…"
                    className="text-sm resize-none"
                    rows={2}
                  />
                </div>
              )}

              {/* Escalate toggle */}
              {selectedOutcome && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={escalate}
                    onChange={(e) => setEscalate(e.target.checked)}
                    className="accent-red-600"
                  />
                  <span className="text-sm font-medium text-red-700">Escalate to Executive Coach</span>
                  <span className="text-xs text-muted-foreground">(second miss or significant blocker)</span>
                </label>
              )}

              {/* Submit */}
              <Button
                onClick={handleLogOutcome}
                disabled={!selectedOutcome || submitting}
                className="w-full font-semibold"
                style={{ background: "var(--color-ln-navy)", color: "white" }}
              >
                {submitting ? "Saving…" : "Log Outcome & Schedule Next Call"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No call scheduled yet. Click "Schedule Next Call" above to set up the first fortnightly call.
            </p>
          )}
        </div>

        {/* ── Call History ── */}
        {data.callHistory.length > 0 && (
          <div className="rounded-xl border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between p-5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="uppercase tracking-wide">Call History ({data.callHistory.length})</span>
              {showHistory ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {showHistory && (
              <div className="px-5 pb-5 space-y-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                {data.callHistory.map((call) => (
                  <div key={call.id} className="flex items-start gap-3 pt-3">
                    <div className={`mt-0.5 rounded-full p-1 flex-shrink-0 ${
                      call.outcome === "implemented" ? "bg-green-500/15 text-green-700" :
                      call.outcome === "partial" ? "bg-amber-500/15 text-amber-700" :
                      call.outcome === "not_implemented" ? "bg-red-500/15 text-red-700" :
                      call.status === "missed" ? "bg-gray-500/15 text-gray-500" :
                      "bg-blue-500/15 text-blue-700"
                    }`}>
                      {call.outcome === "implemented" ? <CheckCircle2 size={14} /> :
                       call.outcome === "not_implemented" ? <XCircle size={14} /> :
                       call.status === "missed" ? <PhoneMissed size={14} /> :
                       <Clock size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {new Date(call.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {call.outcome?.replace("_", " ") ?? call.status}
                        </Badge>
                        {call.escalateToCoach && (
                          <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-700 border-red-500/30">Escalated</Badge>
                        )}
                      </div>
                      {call.callNotes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{call.callNotes}</p>}
                    </div>
                    {call.leaderConfidence && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">Conf: {call.leaderConfidence}/5</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </PlatformLayout>
  );
}
