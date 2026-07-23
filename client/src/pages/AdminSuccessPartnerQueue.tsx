import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Phone, Clock, AlertTriangle, Calendar, Zap,
  MessageSquare, BarChart3, ChevronRight, Users,
  AlertCircle, Flame, Search, X, Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CallStatus = "overdue" | "due_soon" | "upcoming" | "no_call_yet";
type UrgencyFilter = "all" | "critical" | "overdue" | "due_soon" | "upcoming";

// ─── Priority tier logic ──────────────────────────────────────────────────────
// "Critical" = overdue AND (no activity OR escalation flag)
function getPriorityTier(row: {
  callStatus: string;
  activitySinceLastCall: { practiceSessions: number; guideConversations: number };
  latestCall?: { escalateToCoach?: boolean } | null;
}): "critical" | "overdue" | "due_soon" | "upcoming" | "no_call_yet" {
  if (row.callStatus === "overdue") {
    const hasActivity = row.activitySinceLastCall.practiceSessions > 0 || row.activitySinceLastCall.guideConversations > 0;
    if (!hasActivity || row.latestCall?.escalateToCoach) return "critical";
    return "overdue";
  }
  return row.callStatus as CallStatus;
}

// ─── Config per priority tier ─────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<
  "critical" | "overdue" | "due_soon" | "upcoming" | "no_call_yet",
  {
    label: string;
    badgeColor: string;
    badgeBg: string;
    rowBorder: string;
    rowBg: string;
    leftAccent: string;
    icon: React.ReactNode;
    sortOrder: number;
  }
> = {
  critical: {
    label: "Critical",
    badgeColor: "text-red-700",
    badgeBg: "bg-red-500/15 border-red-500/40",
    rowBorder: "border-red-300",
    rowBg: "bg-red-500/5",
    leftAccent: "bg-red-500",
    icon: <Flame size={11} />,
    sortOrder: 0,
  },
  overdue: {
    label: "Overdue",
    badgeColor: "text-orange-700",
    badgeBg: "bg-orange-500/12 border-orange-400/35",
    rowBorder: "border-orange-200",
    rowBg: "bg-orange-500/4",
    leftAccent: "bg-orange-400",
    icon: <AlertTriangle size={11} />,
    sortOrder: 1,
  },
  due_soon: {
    label: "Due Soon",
    badgeColor: "text-amber-700",
    badgeBg: "bg-amber-500/12 border-amber-400/35",
    rowBorder: "border-amber-200",
    rowBg: "bg-amber-500/3",
    leftAccent: "bg-amber-400",
    icon: <Clock size={11} />,
    sortOrder: 2,
  },
  no_call_yet: {
    label: "First Call",
    badgeColor: "text-purple-700",
    badgeBg: "bg-purple-500/10 border-purple-400/30",
    rowBorder: "border-purple-200",
    rowBg: "bg-purple-500/3",
    leftAccent: "bg-purple-400",
    icon: <Phone size={11} />,
    sortOrder: 3,
  },
  upcoming: {
    label: "Upcoming",
    badgeColor: "text-blue-700",
    badgeBg: "bg-blue-500/10 border-blue-400/30",
    rowBorder: "border-slate-200",
    rowBg: "bg-card",
    leftAccent: "bg-blue-400",
    icon: <Calendar size={11} />,
    sortOrder: 4,
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
    <span className={cn(
      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
      count > 0 ? "bg-emerald-500/12 text-emerald-700" : "bg-black/6 text-muted-foreground"
    )}>
      {icon}
      {count} {label}
    </span>
  );
}

const FILTER_CHIPS: { key: UrgencyFilter; label: string; color: string }[] = [
  { key: "all", label: "All", color: "" },
  { key: "critical", label: "Critical", color: "text-red-700 border-red-300 bg-red-500/8" },
  { key: "overdue", label: "Overdue", color: "text-orange-700 border-orange-300 bg-orange-500/8" },
  { key: "due_soon", label: "Due Soon", color: "text-amber-700 border-amber-300 bg-amber-500/8" },
  { key: "upcoming", label: "Upcoming", color: "text-blue-700 border-blue-300 bg-blue-500/8" },
];

export default function AdminMomentumQueue() {
  const { data, isLoading } = trpc.successPartner.getCallQueue.useQuery();
  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");

  // Enrich with priority tier and sort
  const enrichedData = useMemo(() => {
    if (!data) return [];
    return data
      .map((row) => ({ ...row, priorityTier: getPriorityTier(row) }))
      .sort((a, b) => PRIORITY_CONFIG[a.priorityTier].sortOrder - PRIORITY_CONFIG[b.priorityTier].sortOrder);
  }, [data]);

  // Filter by search + urgency chip
  const filteredData = useMemo(() => {
    let result = enrichedData;
    if (urgencyFilter !== "all") {
      if (urgencyFilter === "overdue") {
        result = result.filter((r) => r.priorityTier === "critical" || r.priorityTier === "overdue");
      } else {
        result = result.filter((r) => r.priorityTier === urgencyFilter);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => (r.user.name ?? "").toLowerCase().includes(q) || (r.user.email ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [enrichedData, urgencyFilter, search]);

  const criticalCount = enrichedData.filter((r) => r.priorityTier === "critical").length;
  const overdueCount = enrichedData.filter((r) => r.priorityTier === "overdue").length;
  const dueSoonCount = enrichedData.filter((r) => r.priorityTier === "due_soon").length;
  const escalations = enrichedData.filter((r) => r.latestCall?.escalateToCoach) ?? [];

  // Count per filter chip
  const chipCounts: Record<UrgencyFilter, number> = {
    all: enrichedData.length,
    critical: criticalCount,
    overdue: overdueCount + criticalCount,
    due_soon: dueSoonCount,
    upcoming: enrichedData.filter((r) => r.priorityTier === "upcoming" || r.priorityTier === "no_call_yet").length,
  };

  return (
    <PlatformLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
              Success Partner
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
              { label: "Critical", value: criticalCount, icon: <Flame size={16} />, color: "text-red-600", bg: "bg-red-500/10" },
              { label: "Overdue", value: overdueCount, icon: <AlertTriangle size={16} />, color: "text-orange-600", bg: "bg-orange-500/10" },
              { label: "Due This Week", value: dueSoonCount, icon: <Clock size={16} />, color: "text-amber-600", bg: "bg-amber-500/10" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border p-4 flex items-center gap-3"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <div className={cn("rounded-lg p-2", s.bg, s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xl font-bold leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search + filter bar */}
        {!isLoading && data && data.length > 0 && (
          <div className="space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 pr-8 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leaders by name or email…"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Urgency filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => setUrgencyFilter(chip.key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
                    urgencyFilter === chip.key
                      ? chip.key === "all"
                        ? "bg-[var(--color-ln-navy)] text-white border-[var(--color-ln-navy)]"
                        : cn("border-current", chip.color, "opacity-100 ring-1 ring-current/30")
                      : chip.key === "all"
                      ? "border-border bg-card text-muted-foreground hover:bg-muted/50"
                      : cn("border-border bg-card hover:bg-muted/30", chip.color, "opacity-70 hover:opacity-100")
                  )}
                >
                  {chip.label}
                  <span className="ml-1.5 opacity-70">{chipCounts[chip.key]}</span>
                </button>
              ))}
              {(search || urgencyFilter !== "all") && (
                <button
                  onClick={() => { setSearch(""); setUrgencyFilter("all"); }}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {(search || urgencyFilter !== "all") && (
              <p className="text-xs text-muted-foreground">
                Showing {filteredData.length} of {data.length} leader{data.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        {/* Priority legend */}
        {!isLoading && data && data.length > 0 && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {(["critical", "overdue", "due_soon", "upcoming"] as const).map((tier) => {
              const cfg = PRIORITY_CONFIG[tier];
              return (
                <span key={tier} className="flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full", cfg.leftAccent)} />
                  <span className={cfg.badgeColor}>{cfg.label}</span>
                </span>
              );
            })}
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-purple-700">First Call</span>
            </span>
          </div>
        )}

        {/* Call list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : filteredData.length > 0 ? (
          <div className="space-y-2">
            {filteredData.map((row) => {
              const cfg = PRIORITY_CONFIG[row.priorityTier];
              const lastOutcome = row.latestCall?.outcome;
              const daysUntil = Math.round(
                (new Date(row.nextCallDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Link key={row.user.id} href={`/admin/momentum/${row.user.id}`}>
                  <div
                    className={cn(
                      "rounded-xl border p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all relative overflow-hidden",
                      cfg.rowBorder,
                      cfg.rowBg
                    )}
                  >
                    {/* Left accent bar */}
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", cfg.leftAccent)} />

                    {/* Avatar */}
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ml-1"
                      style={{ background: "var(--color-ln-navy)", color: "white" }}
                    >
                      {(row.user.name ?? row.user.email ?? "?").slice(0, 1).toUpperCase()}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{row.user.name || row.user.email}</p>

                        {/* Priority badge */}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-2 py-0.5 flex items-center gap-1 font-semibold",
                            cfg.badgeColor,
                            cfg.badgeBg
                          )}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </Badge>

                        {/* Escalation badge */}
                        {row.latestCall?.escalateToCoach && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-700 border-red-500/30 font-semibold"
                          >
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
                        <ActivityPill
                          count={row.activitySinceLastCall.practiceSessions}
                          icon={<Zap size={10} />}
                          label="practice"
                        />
                        <ActivityPill
                          count={row.activitySinceLastCall.guideConversations}
                          icon={<MessageSquare size={10} />}
                          label="guide"
                        />
                      </div>
                      {row.latestReport && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <BarChart3 size={10} />
                          {row.latestReport.moduleType} · Edge {Math.round(row.latestReport.edgeScore)}
                        </span>
                      )}
                    </div>

                    {/* Call due */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[72px]">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          daysUntil < 0
                            ? row.priorityTier === "critical" ? "text-red-600" : "text-orange-600"
                            : daysUntil <= 3 ? "text-amber-600"
                            : "text-muted-foreground"
                        )}
                      >
                        {daysUntil < 0
                          ? `${Math.abs(daysUntil)}d overdue`
                          : daysUntil === 0 ? "Today"
                          : `in ${daysUntil}d`}
                      </span>
                      {lastOutcome && (
                        <span className={cn("text-[10px] font-medium", OUTCOME_CONFIG[lastOutcome]?.color ?? "text-muted-foreground")}>
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
        ) : data && data.length > 0 ? (
          <div className="rounded-xl border p-10 text-center" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <Search size={28} className="mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-muted-foreground">No leaders match your filters</p>
            <button
              onClick={() => { setSearch(""); setUrgencyFilter("all"); }}
              className="mt-3 text-xs text-[var(--color-ln-navy)] underline underline-offset-2"
            >
              Clear filters
            </button>
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
