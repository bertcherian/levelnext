import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Zap,
  MessageSquare,
  BarChart3,
  ChevronRight,
  Users,
  AlertCircle,
} from "lucide-react";

type CallStatus = "overdue" | "due_soon" | "upcoming" | "no_call_yet";

const STATUS_CONFIG: Record<CallStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  overdue: {
    label: "Overdue",
    color: "text-red-700",
    bg: "bg-red-500/10 border-red-500/30",
    icon: <AlertTriangle size={12} />,
  },
  due_soon: {
    label: "Due Soon",
    color: "text-amber-700",
    bg: "bg-amber-500/10 border-amber-500/30",
    icon: <Clock size={12} />,
  },
  upcoming: {
    label: "Upcoming",
    color: "text-blue-700",
    bg: "bg-blue-500/10 border-blue-500/30",
    icon: <Calendar size={12} />,
  },
  no_call_yet: {
    label: "First Call",
    color: "text-purple-700",
    bg: "bg-purple-500/10 border-purple-500/30",
    icon: <Phone size={12} />,
  },
};

const OUTCOME_CONFIG: Record<string, { label: string; color: string }> = {
  implemented: { label: "Implemented", color: "text-green-700" },
  partial: { label: "Partial", color: "text-amber-700" },
  not_implemented: { label: "Not Done", color: "text-red-700" },
  no_show: { label: "No Show", color: "text-gray-500" },
};

function ActivityPill({ count, icon, label }: { count: number; icon: React.ReactNode; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
        count > 0 ? "bg-emerald-500/12 text-emerald-700" : "bg-black/6 text-muted-foreground"
      }`}
    >
      {icon}
      {count} {label}
    </span>
  );
}

export default function AdminMomentumQueue() {
  const { data, isLoading } = trpc.momentumPartner.getCallQueue.useQuery();

  const overdue = data?.filter((r) => r.callStatus === "overdue") ?? [];
  const dueSoon = data?.filter((r) => r.callStatus === "due_soon") ?? [];
  const upcoming = data?.filter((r) => r.callStatus === "upcoming" || r.callStatus === "no_call_yet") ?? [];
  const escalations = data?.filter((r) => r.latestCall?.escalateToCoach) ?? [];

  return (
    <PlatformLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
              Momentum Partner
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Fortnightly accountability calls — pre-loaded context for every leader
            </p>
          </div>
          {escalations.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-700 text-sm font-medium">
              <AlertCircle size={15} />
              {escalations.length} escalation{escalations.length > 1 ? "s" : ""} need coach attention
            </div>
          )}
        </div>

        {/* Summary stats */}
        {!isLoading && data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Leaders", value: data.length, icon: <Users size={16} />, color: "text-blue-600", bg: "bg-blue-500/10" },
              { label: "Overdue Calls", value: overdue.length, icon: <AlertTriangle size={16} />, color: "text-red-600", bg: "bg-red-500/10" },
              { label: "Due This Week", value: dueSoon.length, icon: <Clock size={16} />, color: "text-amber-600", bg: "bg-amber-500/10" },
              { label: "Escalations", value: escalations.length, icon: <AlertCircle size={16} />, color: "text-rose-600", bg: "bg-rose-500/10" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border p-4 flex items-center gap-3" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
                <div className={`rounded-lg p-2 ${s.bg} ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-xl font-bold leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((row) => {
              const statusCfg = STATUS_CONFIG[row.callStatus as CallStatus];
              const lastOutcome = row.latestCall?.outcome;
              const daysUntil = Math.round((new Date(row.nextCallDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

              return (
                <Link key={row.user.id} href={`/admin/momentum/${row.user.id}`}>
                  <div
                    className="rounded-xl border p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
                    style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
                  >
                    {/* Avatar */}
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "var(--color-ln-navy)", color: "white" }}
                    >
                      {(row.user.name ?? row.user.email ?? "?").slice(0, 1).toUpperCase()}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{row.user.name || row.user.email}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${statusCfg.color} ${statusCfg.bg}`}
                        >
                          {statusCfg.icon}
                          {statusCfg.label}
                        </Badge>
                        {row.latestCall?.escalateToCoach && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-700 border-red-500/30">
                            ⚠ Escalate
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {row.latestCommitment
                          ? `Commitment: "${row.latestCommitment.text.slice(0, 70)}${row.latestCommitment.text.length > 70 ? "…" : ""}"`
                          : "No active commitment yet"}
                      </p>
                    </div>

                    {/* Activity signals */}
                    <div className="hidden sm:flex flex-col gap-1 items-end flex-shrink-0">
                      <div className="flex gap-1.5">
                        <ActivityPill count={row.activitySinceLastCall.practiceSessions} icon={<Zap size={10} />} label="practice" />
                        <ActivityPill count={row.activitySinceLastCall.guideConversations} icon={<MessageSquare size={10} />} label="guide" />
                      </div>
                      {row.latestReport && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <BarChart3 size={10} />
                          {row.latestReport.moduleType} · Edge {Math.round(row.latestReport.edgeScore)}
                        </span>
                      )}
                    </div>

                    {/* Call due */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[70px]">
                      <span className={`text-xs font-semibold ${daysUntil < 0 ? "text-red-600" : daysUntil <= 3 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Today" : `in ${daysUntil}d`}
                      </span>
                      {lastOutcome && (
                        <span className={`text-[10px] font-medium ${OUTCOME_CONFIG[lastOutcome]?.color ?? "text-muted-foreground"}`}>
                          Last: {OUTCOME_CONFIG[lastOutcome]?.label}
                        </span>
                      )}
                    </div>

                    <ChevronRight size={15} className="text-muted-foreground flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border p-12 text-center" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <Phone size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-muted-foreground">No leaders on the platform yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Once users sign up and start their diagnostics, they'll appear here.</p>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
