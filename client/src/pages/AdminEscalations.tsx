import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Calendar,
  MessageSquare,
  Zap,
  PhoneMissed,
  XCircle,
  Minus,
  Clock,
  ExternalLink,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

const OUTCOME_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  implemented: { label: "Implemented", color: "text-green-700", icon: <CheckCircle2 size={13} />, bg: "bg-green-500/10 border-green-500/30" },
  partial: { label: "Partial", color: "text-amber-700", icon: <Minus size={13} />, bg: "bg-amber-500/10 border-amber-500/30" },
  not_implemented: { label: "Not Done", color: "text-red-700", icon: <XCircle size={13} />, bg: "bg-red-500/10 border-red-500/30" },
  no_show: { label: "No Show", color: "text-gray-600", icon: <PhoneMissed size={13} />, bg: "bg-gray-500/10 border-gray-500/30" },
};

export default function AdminEscalations() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.momentumPartner.getEscalations.useQuery();
  const resolveEscalation = trpc.momentumPartner.resolveEscalation.useMutation({
    onSuccess: () => {
      utils.momentumPartner.getEscalations.invalidate();
      utils.momentumPartner.getCallQueue.invalidate();
      toast.success("Escalation resolved — leader removed from inbox.");
    },
    onError: () => toast.error("Could not resolve escalation. Please try again."),
  });

  return (
    <PlatformLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={20} style={{ color: "var(--color-ln-navy)" }} />
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                Escalation Inbox
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Leaders flagged by the Momentum Partner for your direct attention as Executive Coach
            </p>
          </div>
          {!isLoading && data && data.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--color-ln-navy)", color: "white" }}>
              <AlertCircle size={14} />
              {data.length} open
            </div>
          )}
        </div>

        {/* How to use this inbox */}
        <div className="rounded-xl border p-4 flex items-start gap-3"
          style={{ background: "oklch(98% 0.01 248.6)", borderColor: "var(--color-border)" }}>
          <div className="rounded-lg p-1.5 flex-shrink-0" style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.2)" }}>
            <MessageSquare size={14} style={{ color: "var(--color-ln-navy)" }} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--color-ln-navy)" }}>How to use this inbox</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Each card shows a leader the Momentum Partner flagged after a call — either a second consecutive miss, a significant blocker, or a pattern of disengagement. Review the call notes, click "View Brief" to see full context, then mark as resolved once you've taken action (called the leader, emailed them, or updated the coaching plan).
            </p>
          </div>
        </div>

        {/* Escalation list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-3">
            {data.map((row) => {
              const outcomeCfg = row.call.outcome ? OUTCOME_CONFIG[row.call.outcome] : null;
              const callDate = row.call.calledAt ?? row.call.scheduledAt;
              const daysAgo = Math.round((Date.now() - new Date(callDate).getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={row.call.id}
                  className="rounded-xl border-2 p-5 space-y-3"
                  style={{ background: "var(--color-card)", borderColor: "oklch(from var(--color-ln-navy) l c h / 0.25)" }}
                >
                  {/* Top row: leader info + call date + resolve button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: "var(--color-ln-navy)", color: "white" }}
                      >
                        {(row.user.name ?? row.user.email ?? "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{row.user.name || row.user.email}</p>
                        <p className="text-xs text-muted-foreground">{row.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={11} />
                        {daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveEscalation.mutate({ callId: row.call.id })}
                        disabled={resolveEscalation.isPending}
                        className="text-xs gap-1.5 h-8"
                        style={{ borderColor: "oklch(40% 0.15 145 / 0.5)", color: "oklch(35% 0.15 145)" }}
                      >
                        <CheckCircle2 size={12} />
                        Mark Resolved
                      </Button>
                    </div>
                  </div>

                  {/* Call outcome badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-muted-foreground">Last call outcome:</span>
                    {outcomeCfg ? (
                      <Badge
                        variant="outline"
                        className={`text-xs flex items-center gap-1 ${outcomeCfg.color} ${outcomeCfg.bg}`}
                      >
                        {outcomeCfg.icon}
                        {outcomeCfg.label}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Unknown</Badge>
                    )}
                    {row.call.leaderConfidence && (
                      <span className="text-xs text-muted-foreground">
                        Confidence: {row.call.leaderConfidence}/5
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs bg-red-500/10 text-red-700 border-red-500/30 flex items-center gap-1">
                      <AlertCircle size={11} />
                      Escalated to Coach
                    </Badge>
                  </div>

                  {/* Commitment being tracked */}
                  {row.call.commitmentText && (
                    <div className="rounded-lg px-3 py-2.5"
                      style={{ background: "oklch(97% 0.01 248.6)", border: "1px solid var(--color-border)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Commitment being tracked</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-ln-navy)" }}>
                        "{row.call.commitmentText}"
                      </p>
                    </div>
                  )}

                  {/* Blocker */}
                  {row.call.blockerMentioned && (
                    <div className="rounded-lg px-3 py-2.5 bg-amber-500/8 border border-amber-500/25">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-1">Blocker mentioned</p>
                      <p className="text-sm text-amber-900">{row.call.blockerMentioned}</p>
                    </div>
                  )}

                  {/* Call notes */}
                  {row.call.callNotes && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Momentum Partner's notes</p>
                      <p className="text-sm leading-relaxed text-foreground/80">{row.call.callNotes}</p>
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(callDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <Link href={`/admin/momentum/${row.user.id}`}>
                      <button className="text-xs flex items-center gap-1.5 font-medium transition-colors hover:opacity-80"
                        style={{ color: "var(--color-ln-navy)" }}>
                        View Full Brief <ExternalLink size={11} />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border p-16 text-center"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <Inbox size={36} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-base font-semibold text-muted-foreground">Inbox is clear</p>
            <p className="text-sm text-muted-foreground mt-1">
              No escalations from the Momentum Partner right now. When a leader misses commitments twice or has a significant blocker, they'll appear here.
            </p>
          </div>
        )}

      </div>
    </PlatformLayout>
  );
}
