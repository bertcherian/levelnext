import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Users,
  Briefcase,
  Link2,
  BarChart3,
  Zap,
  FileText,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  BookOpen,
} from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  ECI: "Executive Communication",
  TII: "Time Intelligence",
  LII: "Leadership Influence",
  GCC: "GCC Readiness",
  LDI: "Derailment Intelligence",
  STI: "Strategic Thinking",
};

const MODULE_COLORS: Record<string, string> = {
  ECI: "bg-blue-500",
  TII: "bg-purple-500",
  LII: "bg-emerald-500",
  GCC: "bg-amber-500",
  LDI: "bg-red-500",
  STI: "bg-cyan-500",
};

function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  href,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  href?: string;
}) {
  const inner = (
    <div
      className="rounded-xl border p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div className={`rounded-lg p-2.5 flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--color-ln-navy)" }}>{sub}</p>}
      </div>
      {href && <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function PlaybookStatsSection() {
  const { data, isLoading } = trpc.adminStats.getPlaybookStats.useQuery();

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>
        Leader Playbook Usage
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Per-user session counts */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sessions per User</p>
            {data.perUser.length > 0 ? (
              <div className="space-y-2">
                {data.perUser.map((u) => (
                  <div key={u.userId} className="flex items-center gap-3">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--color-ln-navy)", color: "white" }}
                    >
                      {(u.userName ?? u.userEmail ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.userName || <span className="text-muted-foreground italic">No name</span>}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.userEmail || "—"}</p>
                    </div>
                    <span
                      className="text-sm font-bold flex-shrink-0 px-2 py-0.5 rounded"
                      style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)", color: "var(--color-ln-navy)" }}
                    >
                      {u.sessionCount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No playbook sessions yet.</p>
            )}
          </div>
          {/* Top situation types */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Top Situation Types</p>
            {data.topSituations.length > 0 ? (
              <div className="space-y-2">
                {data.topSituations.map((s) => {
                  const max = Math.max(...data.topSituations.map((x) => x.total));
                  const pct = max > 0 ? Math.round((s.total / max) * 100) : 0;
                  return (
                    <div key={s.playbookType} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-36 truncate flex-shrink-0">{s.playbookType || "Unknown"}</span>
                      <div className="flex-1 h-2 rounded-full bg-black/8 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-5 text-right flex-shrink-0">{s.total}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No situation data yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = trpc.adminStats.getDashboardStats.useQuery();

  return (
    <PlatformLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Platform overview — pilot pipeline, engagement, and diagnostics
          </p>
        </div>

        {/* ── Key Metrics Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard
              label="Registered Users"
              value={data.users.total}
              sub={`+${data.users.newLast30Days} this month`}
              icon={<Users size={18} className="text-blue-600" />}
              iconBg="bg-blue-500/12"
            />
            <StatCard
              label="Pilot Applications"
              value={data.pilotApplications.total}
              sub={`+${data.pilotApplications.newLast7Days} this week`}
              icon={<Briefcase size={18} className="text-amber-600" />}
              iconBg="bg-amber-500/12"
              href="/admin/pilot-applications"
            />
            <StatCard
              label="Invites Accepted"
              value={data.invites.accepted}
              sub={`${data.invites.pending} pending`}
              icon={<Link2 size={18} className="text-emerald-600" />}
              iconBg="bg-emerald-500/12"
              href="/admin/invites"
            />
            <StatCard
              label="Diagnostics Completed"
              value={data.assessments.completed}
              sub={`${data.assessments.completedLast30Days} in last 30 days`}
              icon={<BarChart3 size={18} className="text-purple-600" />}
              iconBg="bg-purple-500/12"
            />
            <StatCard
              label="Reports Generated"
              value={data.reports.total}
              icon={<FileText size={18} className="text-cyan-600" />}
              iconBg="bg-cyan-500/12"
            />
            <StatCard
              label="Practice Sessions"
              value={data.practice.total}
              sub={`${data.practice.last30Days} in last 30 days`}
              icon={<Zap size={18} className="text-rose-600" />}
              iconBg="bg-rose-500/12"
            />
            <StatCard
              label="Playbook Sessions"
              value={data.playbook.total}
              sub={`${data.playbook.last30Days} in last 30 days`}
              icon={<BookOpen size={18} className="text-indigo-600" />}
              iconBg="bg-indigo-500/12"
            />
          </div>
        ) : null}

        {/* ── Two-column: Diagnostic Breakdown + Recent Users ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Diagnostic Breakdown by Module */}
          <div
            className="rounded-xl border p-6"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>
              Diagnostics Completed by Module
            </h2>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}
              </div>
            ) : data && data.assessments.byModule.length > 0 ? (
              <div className="space-y-3">
                {data.assessments.byModule
                  .sort((a, b) => b.total - a.total)
                  .map((m) => {
                    const max = Math.max(...data.assessments.byModule.map((x) => x.total));
                    const pct = max > 0 ? Math.round((m.total / max) * 100) : 0;
                    return (
                      <div key={m.moduleType} className="flex items-center gap-3">
                        <span
                          className="text-xs font-bold w-10 flex-shrink-0 text-center py-0.5 rounded"
                          style={{ background: "var(--color-ln-navy)", color: "white" }}
                        >
                          {m.moduleType}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-black/8 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${MODULE_COLORS[m.moduleType] ?? "bg-gray-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-6 text-right flex-shrink-0">{m.total}</span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No completed diagnostics yet.</p>
            )}
          </div>

          {/* Recent Users */}
          <div
            className="rounded-xl border p-6"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>
              Recent Sign-ups
            </h2>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
              </div>
            ) : data && data.recentUsers.length > 0 ? (
              <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {data.recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 py-2.5">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--color-ln-navy)", color: "white" }}
                    >
                      {(u.name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name || <span className="text-muted-foreground italic">No name</span>}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email || "—"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {u.role === "admin" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-700 bg-amber-50">
                          Admin
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No users yet.</p>
            )}
          </div>
        </div>

        {/* ── Playbook Usage ── */}
        <PlaybookStatsSection />

        {/* ── Recent Pilot Applications ── */}
        <div
          className="rounded-xl border p-6"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: "var(--color-ln-navy)" }}>
              Recent Pilot Applications
            </h2>
            <Link href="/admin/pilot-applications" className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "var(--color-ln-navy)" }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded" />)}
            </div>
          ) : data && data.recentApplications.length > 0 ? (
            <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {data.recentApplications.map((app) => (
                <div key={app.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{app.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.company} · {app.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {app.teamSize && (
                      <span className="text-xs text-muted-foreground hidden sm:block">{app.teamSize} leaders</span>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${
                        app.status === "new"
                          ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
                          : app.status === "booked"
                          ? "bg-green-500/10 text-green-700 border-green-500/30"
                          : app.status === "contacted"
                          ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/30"
                          : "bg-red-500/10 text-red-700 border-red-500/30"
                      }`}
                    >
                      {app.status === "new" ? <Clock size={10} className="mr-1" /> : <CheckCircle2 size={10} className="mr-1" />}
                      {app.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No pilot applications yet.</p>
          )}
        </div>

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              href: "/admin/pilot-applications",
              icon: <Briefcase size={20} />,
              label: "Pilot Applications",
              desc: "Review, update status, send invites",
            },
            {
              href: "/admin/invites",
              icon: <Link2 size={20} />,
              label: "Manage Invites",
              desc: "Track magic links, revoke or copy",
            },
            {
              href: "/home",
              icon: <TrendingUp size={20} />,
              label: "Your Dashboard",
              desc: "Switch to your leader view",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className="rounded-xl border p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <div className="rounded-lg p-2.5 flex-shrink-0" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)", color: "var(--color-ln-navy)" }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight size={15} className="ml-auto text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </PlatformLayout>
  );
}
