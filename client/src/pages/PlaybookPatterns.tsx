import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, Target, Lightbulb, BarChart3, AlertTriangle } from "lucide-react";

export default function PlaybookPatterns() {
  const { data: patterns, isLoading } = trpc.playbook.getPatterns.useQuery();
  const { data: sessions, isLoading: sessionsLoading } = trpc.playbook.listSessions.useQuery({ limit: 100 });

  // Compute top situations from session list (client-side aggregation)
  const situationFreq: Record<string, number> = {};
  if (sessions) {
    for (const s of sessions) {
      if (s.playbookType) {
        situationFreq[s.playbookType] = (situationFreq[s.playbookType] ?? 0) + 1;
      }
    }
  }
  const topSituations = Object.entries(situationFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Competency signals from patterns
  const competencySignals = patterns?.competencySignals as Record<string, { count: number; wins: number }> | null ?? null;
  const topCompetencies = competencySignals
    ? Object.entries(competencySignals)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 8)
    : [];

  const totalSessions = patterns?.totalSessions ?? 0;
  const totalReflections = patterns?.totalReflections ?? 0;
  const reflectionRate = totalSessions > 0 ? Math.round((totalReflections / totalSessions) * 100) : 0;

  return (
    <PlatformLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className="rounded-xl p-3 flex-shrink-0"
            style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}
          >
            <BarChart3 size={24} style={{ color: "var(--color-ln-navy)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
              Your Playbook Patterns
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Intelligence built from your leadership situations — recurring challenges, competency signals, and growth edges.
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        {isLoading || sessionsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Total Playbooks",
                value: totalSessions,
                icon: <BookOpen size={18} />,
                color: "text-indigo-600",
                bg: "bg-indigo-500/12",
              },
              {
                label: "Reflections Filed",
                value: totalReflections,
                icon: <Lightbulb size={18} />,
                color: "text-amber-600",
                bg: "bg-amber-500/12",
              },
              {
                label: "Reflection Rate",
                value: `${reflectionRate}%`,
                icon: <TrendingUp size={18} />,
                color: "text-emerald-600",
                bg: "bg-emerald-500/12",
              },
              {
                label: "Situation Types",
                value: topSituations.length,
                icon: <Target size={18} />,
                color: "text-blue-600",
                bg: "bg-blue-500/12",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border p-5 flex items-start gap-3"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <div className={`rounded-lg p-2 flex-shrink-0 ${stat.bg}`}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Two-column: Recurring Situations + Competency Signals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recurring Situations */}
          <div
            className="rounded-xl border p-6"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color: "var(--color-ln-navy)" }} />
              <h2 className="text-base font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                Recurring Situations
              </h2>
            </div>
            {sessionsLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>
            ) : topSituations.length > 0 ? (
              <div className="space-y-3">
                {topSituations.map(([type, count]) => {
                  const max = topSituations[0][1];
                  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-40 truncate flex-shrink-0">{type}</span>
                      <div className="flex-1 h-2 rounded-full bg-black/8 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: "var(--color-ln-navy)" }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-5 text-right flex-shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">No patterns yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Create your first playbook to start building your pattern intelligence.</p>
              </div>
            )}
          </div>

          {/* Competency Signals */}
          <div
            className="rounded-xl border p-6"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} style={{ color: "var(--color-ln-navy)" }} />
              <h2 className="text-base font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                Competency Signals
              </h2>
            </div>
            {isLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>
            ) : topCompetencies.length > 0 ? (
              <div className="space-y-3">
                {topCompetencies.map(([comp, data]) => {
                  const winRate = data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0;
                  return (
                    <div key={comp} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-40 truncate flex-shrink-0">{comp}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 flex-shrink-0"
                          style={{
                            borderColor: "var(--color-ln-navy)",
                            color: "var(--color-ln-navy)",
                            background: "oklch(from var(--color-ln-navy) l c h / 0.06)",
                          }}
                        >
                          {data.count}×
                        </Badge>
                        {data.wins > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 flex-shrink-0 border-emerald-400 text-emerald-700 bg-emerald-50"
                          >
                            {winRate}% wins
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">No competency signals yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Competency signals are detected as you use the Playbook.</p>
              </div>
            )}
          </div>
        </div>

        {/* Avoided Situations notice */}
        {totalSessions === 0 && (
          <div
            className="rounded-xl border border-amber-200 p-6 flex items-start gap-4"
            style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.06)" }}
          >
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                Your pattern intelligence is empty
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Use the Leader Playbook to prepare for your leadership situations. After a few sessions, this page will surface your recurring challenges, avoided situations, and competency growth edges.
              </p>
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        {sessions && sessions.length > 0 && (
          <div
            className="rounded-xl border p-6"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>
              Recent Playbook Sessions
            </h2>
            <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {sessions.slice(0, 10).map((s: { id: number; situationText: string; playbookType: string | null; createdAt: Date }) => (
                <div key={s.id} className="flex items-start gap-3 py-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}
                  >
                    <BookOpen size={14} style={{ color: "var(--color-ln-navy)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.situationText}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {s.playbookType && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {s.playbookType}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </PlatformLayout>
  );
}
