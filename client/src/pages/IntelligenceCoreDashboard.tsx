/**
 * Intelligence Core — Admin Dashboard
 *
 * Platform-wide analytics for the Intelligence Core subsystem.
 * Shows engagement funnel, recommendation outcomes, rule engine status,
 * and audit log with privacy-thresholded aggregate views.
 */

import PlatformLayout from "@/components/PlatformLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  FileText,
  ArrowRight,
  Zap,
  Target,
  Award,
  Shield,
  ScrollText,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  generated: "bg-slate-100 text-slate-700",
  presented: "bg-blue-100 text-blue-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  deferred: "bg-amber-100 text-amber-700",
  superseded: "bg-gray-100 text-gray-500",
  planned: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const IMPACT_COLORS: Record<string, string> = {
  none: "bg-slate-100 text-slate-600",
  minimal: "bg-blue-100 text-blue-600",
  moderate: "bg-amber-100 text-amber-700",
  significant: "bg-emerald-100 text-emerald-700",
  transformative: "bg-purple-100 text-purple-700",
};

function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div
      className="rounded-xl border p-5 flex items-start gap-4"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div className={`rounded-lg p-2.5 flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function FunnelBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-32 text-sm text-muted-foreground">{label}</div>
      <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-medium">
          {count} ({pct}%)
        </span>
      </div>
    </div>
  );
}

export default function IntelligenceCoreDashboard() {
  const { user } = useAuth();

  const { data: analytics, isLoading } = trpc.intelligenceCore.getAnalytics.useQuery();
  const { data: auditData, isLoading: auditLoading } = trpc.intelligenceCore.getAuditLog.useQuery({
    limit: 20,
    offset: 0,
  });

  if (!user || user.role !== "admin") {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Admin Access Required</h2>
            <p className="text-muted-foreground mt-2">
              The Intelligence Core dashboard is restricted to platform administrators.
            </p>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  const totals = analytics?.totals;
  const recByStatus = analytics?.recommendationsByStatus ?? [];
  const actionByStatus = analytics?.actionsByStatus ?? [];
  const outcomeByImpact = analytics?.outcomesByImpact ?? [];

  const totalRecs = totals?.recommendations ?? 0;
  const totalActions = totals?.actions ?? 0;
  const totalOutcomes = totals?.outcomes ?? 0;

  // Funnel: diagnostics → recommendations → actions → outcomes
  const funnelSteps = [
    { label: "Diagnostics Registered", count: totals?.diagnosticInstances ?? 0, color: "bg-slate-400" },
    { label: "Recommendations Generated", count: totalRecs, color: "bg-blue-400" },
    { label: "Actions Created", count: totalActions, color: "bg-amber-400" },
    { label: "Outcomes Recorded", count: totalOutcomes, color: "bg-emerald-400" },
  ];

  return (
    <PlatformLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2.5 bg-[#0A1A2F]">
            <Brain className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Intelligence Core</h1>
            <p className="text-sm text-muted-foreground">
              Platform-wide intelligence engine analytics and audit trail
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Privacy threshold: N ≥ 5 (groups with fewer than 5 entries are suppressed)
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Diagnostic Instances"
              value={totals?.diagnosticInstances ?? 0}
              icon={<FileText className="w-5 h-5 text-white" />}
              iconBg="bg-slate-600"
            />
            <StatCard
              label="Active Rules"
              value={totals?.activeRules ?? 0}
              icon={<Zap className="w-5 h-5 text-white" />}
              iconBg="bg-amber-600"
            />
            <StatCard
              label="Recommendations"
              value={totalRecs}
              icon={<Target className="w-5 h-5 text-white" />}
              iconBg="bg-blue-600"
            />
            <StatCard
              label="Actions"
              value={totalActions}
              icon={<Activity className="w-5 h-5 text-white" />}
              iconBg="bg-purple-600"
            />
            <StatCard
              label="Outcomes"
              value={totalOutcomes}
              icon={<Award className="w-5 h-5 text-white" />}
              iconBg="bg-emerald-600"
            />
          </div>
        )}

        {/* Engagement Funnel */}
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Engagement Funnel
          </h2>
          <div className="space-y-1">
            {funnelSteps.map((step, i) => (
              <FunnelBar
                key={i}
                label={step.label}
                count={step.count}
                total={funnelSteps[0].count || 1}
                color={step.color}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recommendations by Status */}
          <div
            className="rounded-xl border p-6"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <h2 className="text-lg font-semibold mb-4">Recommendations by Status</h2>
            {recByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recommendations yet.</p>
            ) : (
              <div className="space-y-2">
                {recByStatus.map((item: any) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <Badge className={STATUS_COLORS[item.status] ?? "bg-slate-100"}>
                      {item.status}
                    </Badge>
                    {item.suppressed ? (
                      <span className="text-xs text-muted-foreground italic">&lt; 5 (suppressed)</span>
                    ) : (
                      <span className="font-semibold">{item.count}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions by Status */}
          <div
            className="rounded-xl border p-6"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <h2 className="text-lg font-semibold mb-4">Actions by Status</h2>
            {actionByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions yet.</p>
            ) : (
              <div className="space-y-2">
                {actionByStatus.map((item: any) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <Badge className={STATUS_COLORS[item.status] ?? "bg-slate-100"}>
                      {item.status}
                    </Badge>
                    {item.suppressed ? (
                      <span className="text-xs text-muted-foreground italic">&lt; 5 (suppressed)</span>
                    ) : (
                      <span className="font-semibold">{item.count}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outcomes by Impact */}
          <div
            className="rounded-xl border p-6"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <h2 className="text-lg font-semibold mb-4">Outcomes by Impact Level</h2>
            {outcomeByImpact.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outcomes recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {outcomeByImpact.map((item: any) => (
                  <div key={item.impactLevel} className="flex items-center justify-between">
                    <Badge className={IMPACT_COLORS[item.impactLevel] ?? "bg-slate-100"}>
                      {item.impactLevel}
                    </Badge>
                    {item.suppressed ? (
                      <span className="text-xs text-muted-foreground italic">&lt; 5 (suppressed)</span>
                    ) : (
                      <span className="font-semibold">{item.count}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ScrollText className="w-5 h-5" />
            Recent Audit Events
          </h2>
          {auditLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : (auditData?.events ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit events recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(auditData?.events ?? []).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {event.authorizationResult === "allowed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : event.authorizationResult === "denied" ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{event.eventType}</span>
                      {event.resourceType && (
                        <Badge variant="outline" className="text-xs">
                          {event.resourceType}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.occurredAt).toLocaleString()}
                      {event.actorUserId ? ` · Actor: User #${event.actorUserId}` : ""}
                      {event.tenantId ? ` · Tenant: #${event.tenantId}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PlatformLayout>
  );
}
