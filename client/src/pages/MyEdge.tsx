import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, CheckCircle, Lock, TrendingUp, Sparkles, Zap, Target, BarChart2 } from "lucide-react";

const MODULES = ["ECI", "TII", "LII", "GCC", "LDI"] as const;
type ModuleType = (typeof MODULES)[number];

const MODULE_LABELS: Record<ModuleType, string> = {
  ECI: "Executive Communication",
  TII: "Time Intelligence",
  LII: "Leadership Influence",
  GCC: "GCC Readiness",
  LDI: "Derailment Intelligence",
};

const MODULE_DESCRIPTIONS: Record<ModuleType, string> = {
  ECI: "How you communicate, influence, and command presence in executive contexts.",
  TII: "How you invest, protect, and reclaim your most strategic resource — time.",
  LII: "Your ability to build trust, align stakeholders, and lead through influence.",
  GCC: "Your organisation's readiness to operate as a strategic global capability centre.",
  LDI: "Identify your top derailment risks and leadership stabilizers across 10 behavioural dimensions.",
};

const MODULE_ICON: Record<ModuleType, string> = {
  ECI: "💬",
  TII: "⏱",
  LII: "🤝",
  GCC: "🌐",
  LDI: "⚠️",
};

const ZONE_COLORS: Record<string, string> = {
  excellent: "#16a34a",
  elite_communicator: "#10B981",
  executive_communicator: "#22C55E",
  good: "#2563eb",
  capable_communicator: "#EAB308",
  capable: "#3B82F6",
  strategic: "#22C55E",
  developing: "#d97706",
  developing_communicator: "#F97316",
  emerging: "#F59E0B",
  emerging_voice: "#EF4444",
  atRisk: "#dc2626",
  critical: "#EF4444",
};

function getZoneColor(zone: string | null | undefined) {
  if (!zone) return "#2563eb";
  return ZONE_COLORS[zone] ?? "#2563eb";
}

function getEdgeLabel(score: number) {
  if (score >= 85) return "Elite";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Capable";
  if (score >= 40) return "Developing";
  return "Emerging";
}

// SVG circular progress ring
function ProgressRing({ score, size = 80, stroke = 7, color }: { score: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.23,1,0.32,1)" }}
      />
    </svg>
  );
}

export default function MyEdge() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();
  const { data: graph, isLoading } = trpc.leadershipGraph.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: reports } = trpc.report.myReports.useQuery(undefined, { enabled: isAuthenticated });
  const { data: practiceHistory } = trpc.practice.getHistory.useQuery(undefined, { enabled: isAuthenticated });
  const { data: coachCommitments } = trpc.leadershipCoach.getCommitments.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [loading, isAuthenticated, navigate]);

  const completedModules = (graph?.completedModules ?? []) as string[];
  const nextModule = MODULES.find((m) => !completedModules.includes(m));
  const firstName = user?.name?.split(" ")[0] ?? "Leader";

  return (
    <PlatformLayout title="My Edge">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 animate-fade-in">

        {/* Page header */}
        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>My Edge</h1>
          <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>
            {firstName}'s unified leadership intelligence profile.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-ln-navy)" }} />
          </div>
        ) : completedModules.length === 0 ? (
          /* ── Empty state ── */
          <div className="text-center py-20 rounded-2xl" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.12)" }}>
              <TrendingUp size={28} style={{ color: "var(--color-ln-yellow)" }} />
            </div>
            <p className="text-xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>Your Edge profile is waiting</p>
            <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: "var(--color-ln-muted)" }}>
              Complete your first diagnostic to begin building your Leadership Edge. It takes about 10 minutes.
            </p>
            <Link href="/diagnostics/eci">
              <Button className="font-semibold h-11 px-8" style={{ background: "var(--color-ln-navy)", color: "white" }}>
                Begin Executive Communication Diagnostic <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-8">

            {/* ── Composite Edge Hero ── */}
            {graph?.compositeEdge !== undefined && (
              <div className="rounded-2xl p-5 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-8"
                style={{ background: "var(--color-ln-navy)" }}>
                <div className="relative flex-shrink-0">
                  <ProgressRing score={graph.compositeEdge} size={120} stroke={9} color="var(--color-ln-yellow)" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold leading-none" style={{ color: "var(--color-ln-yellow)" }}>
                      {graph.compositeEdge}
                    </span>
                    <span className="text-xs mt-0.5" style={{ color: "oklch(65% 0.02 248.6)" }}>/ 100</span>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-ln-yellow)" }}>
                    Composite Leadership Edge
                  </p>
                  <p className="text-2xl font-bold text-white mb-1">
                    {getEdgeLabel(graph.compositeEdge)} Leader
                  </p>
                  <p className="text-sm mb-4" style={{ color: "oklch(65% 0.02 248.6)" }}>
                    Based on {completedModules.length} of {MODULES.length} diagnostic{completedModules.length !== 1 ? "s" : ""} completed
                  </p>
                  {/* Completion bar */}
                  <div className="flex items-center gap-3">
                    {MODULES.map((m) => (
                      <div key={m} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full"
                          style={{ background: completedModules.includes(m) ? "var(--color-ln-yellow)" : "rgba(255,255,255,0.2)" }} />
                        <span className="text-xs" style={{ color: completedModules.includes(m) ? "var(--color-ln-yellow)" : "rgba(255,255,255,0.35)" }}>
                          {m}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {nextModule && (
                  <div className="sm:ml-auto flex-shrink-0">
                    <Link href={`/diagnostics/${nextModule.toLowerCase()}`}>
                      <Button size="sm" className="font-semibold"
                        style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                        Next: {MODULE_LABELS[nextModule]} <ArrowRight size={12} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ── Archetype Cards ── */}
            <div>
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>Your Leadership Archetypes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                {MODULES.map((mod) => {
                  const done = completedModules.includes(mod);
                  const score = graph?.moduleEdges?.[mod] as number | undefined;
                  const archetype = graph?.archetypes?.[mod] as string | undefined;
                  const zone = graph?.zones?.[mod] as string | undefined;
                  const zoneColor = getZoneColor(zone);
                  const modReports = reports?.filter((r) => r.moduleType === mod) ?? [];
                  const latestReport = modReports[0];

                  const archetypeLabel = archetype
                    ?.replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());

                  const zoneLabel = zone
                    ?.replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase());

                  return (
                    <div key={mod} className="rounded-2xl overflow-hidden card-lift"
                      style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>

                      {/* Card header */}
                      <div className="px-5 pt-5 pb-4 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{MODULE_ICON[mod]}</span>
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-muted)" }}>{mod}</span>
                          </div>
                          <h3 className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>{MODULE_LABELS[mod]}</h3>
                        </div>
                        {done ? (
                          <CheckCircle size={18} style={{ color: "#16a34a" }} />
                        ) : (
                          <Lock size={16} style={{ color: "var(--color-ln-muted)" }} />
                        )}
                      </div>

                      {done && score !== undefined ? (
                        <>
                          {/* Score + ring */}
                          <div className="px-5 pb-4 flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                              <ProgressRing score={score} size={64} stroke={6} color={zoneColor} />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>{score}</span>
                              </div>
                            </div>
                            <div>
                              {zoneLabel && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold mb-1"
                                  style={{ background: `${zoneColor}18`, color: zoneColor }}>
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: zoneColor }} />
                                  {zoneLabel}
                                </div>
                              )}
                              {archetypeLabel && (
                                <p className="text-sm font-semibold leading-tight" style={{ color: "var(--color-ln-navy)" }}>
                                  {archetypeLabel}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="px-5 pb-5 flex items-center gap-2">
                            {latestReport?.slug && (
                              <Link href={`/report/${latestReport.slug}`}>
                                <Button size="sm" variant="outline" className="text-xs flex-1">View Insight</Button>
                              </Link>
                            )}
                            <Link href={`/diagnostics/${mod.toLowerCase()}`}>
                              <Button size="sm" variant="outline" className="text-xs flex-1">Retake</Button>
                            </Link>
                          </div>
                        </>
                      ) : (
                        <div className="px-5 pb-5">
                          <p className="text-xs mb-4" style={{ color: "var(--color-ln-muted)" }}>{MODULE_DESCRIPTIONS[mod]}</p>
                          <Link href={`/diagnostics/${mod.toLowerCase()}`}>
                            <Button size="sm" className="w-full text-xs font-semibold"
                              style={{ background: "var(--color-ln-navy)", color: "white" }}>
                              Begin Diagnostic <ArrowRight size={12} className="ml-1" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Insight History ── */}
            {reports && reports.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>Insight History</h2>
                <div className="space-y-3">
                  {reports.map((r) => {
                    const archetypeLabel = (r.archetype as string | null)
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());
                    return (
                      <div key={r.id} className="rounded-xl p-4 flex items-center justify-between"
                        style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{MODULE_ICON[r.moduleType as ModuleType] ?? "📊"}</span>
                          <div>
                            <p className="font-medium text-sm" style={{ color: "var(--color-ln-navy)" }}>
                              {MODULE_LABELS[r.moduleType as ModuleType] ?? r.moduleType}
                            </p>
                            {archetypeLabel && (
                              <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{archetypeLabel}</p>
                            )}
                            <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>
                              {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{Math.round(r.edgeScore)}</p>
                            <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Edge</p>
                          </div>
                          {r.slug && (
                            <Link href={`/report/${r.slug}`}>
                              <Button size="sm" variant="outline" className="text-xs">View</Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Practice Activity ── */}
            {practiceHistory && (practiceHistory.totalAttempts > 0 || (practiceHistory.sessions?.length ?? 0) > 0) && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--color-ln-navy)" }}>
                    <Zap size={18} style={{ color: "var(--color-ln-gold)" }} />
                    Practice Activity
                  </h2>
                  <Link href="/practice">
                    <button className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--color-ln-navy)" }}>
                      Open Practice Coach <ArrowRight size={12} />
                    </button>
                  </Link>
                </div>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl p-3 text-center" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                    <p className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{practiceHistory.totalAttempts}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>Sessions</p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                    <p className="text-2xl font-bold" style={{ color: practiceHistory.averageScore && practiceHistory.averageScore >= 70 ? "#16a34a" : practiceHistory.averageScore && practiceHistory.averageScore >= 50 ? "#d97706" : "var(--color-ln-navy)" }}>
                      {practiceHistory.averageScore ?? "—"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>Avg Score</p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                    <p className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{practiceHistory.sessions?.length ?? 0}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>Scenarios</p>
                  </div>
                </div>
                {/* Last 3 sessions */}
                {practiceHistory.sessions && practiceHistory.sessions.length > 0 && (
                  <div className="space-y-2">
                    {practiceHistory.sessions.slice(0, 3).map((session) => {
                      const sessionAttempts = (practiceHistory.attempts ?? []).filter(
                        (a: { sessionId: number; overallScore: number | null }) => a.sessionId === session.id
                      );
                      const bestScore = sessionAttempts.length > 0
                        ? Math.max(...sessionAttempts.map((a: { overallScore: number | null }) => a.overallScore ?? 0))
                        : null;
                      return (
                        <div key={session.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}>
                            <Target size={14} style={{ color: "var(--color-ln-navy)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--color-ln-navy)" }}>{session.issueText}</p>
                            <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>
                              {sessionAttempts.length} attempt{sessionAttempts.length !== 1 ? 's' : ''} · {new Date(session.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </p>
                          </div>
                          {bestScore !== null && (
                            <div className="text-right flex-shrink-0">
                              <p className="text-base font-bold" style={{ color: bestScore >= 70 ? "#16a34a" : bestScore >= 50 ? "#d97706" : "#dc2626" }}>{bestScore}</p>
                              <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>best</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Current active commitment */}
                {(() => {
                  const activeCommitment = coachCommitments?.find(c => !c.status || c.status === 'pending');
                  if (!activeCommitment) return null;
                  return (
                    <div className="mt-3 rounded-xl p-3 flex items-start gap-3" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                      <CheckCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-ln-gold)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-ln-navy)" }}>Current Commitment</p>
                        <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{activeCommitment.text}</p>
                      </div>
                    </div>
                  );
                })()}
                {/* Practice score trend — last 5 completed attempts */}
                {(() => {
                  const completedAttempts = (practiceHistory?.attempts ?? [])
                    .filter((a: { overallScore: number | null }) => a.overallScore !== null)
                    .slice(0, 5)
                    .reverse();
                  if (completedAttempts.length < 2) return null;
                  const scores = completedAttempts.map((a: { overallScore: number | null }) => a.overallScore as number);
                  const min = Math.min(...scores);
                  const max = Math.max(...scores);
                  const range = max - min || 1;
                  const W = 120, H = 32;
                  const pts = scores.map((s, i) => {
                    const x = (i / (scores.length - 1)) * W;
                    const y = H - ((s - min) / range) * H;
                    return `${x},${y}`;
                  }).join(' ');
                  const trend = scores[scores.length - 1] - scores[0];
                  return (
                    <div className="mt-3 rounded-xl p-3 flex items-center gap-4" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>Score Trend</p>
                        <p className="text-xs" style={{ color: trend >= 0 ? "#16a34a" : "#dc2626" }}>
                          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)} pts over {scores.length} attempts
                        </p>
                      </div>
                      <svg width={W} height={H} className="ml-auto">
                        <polyline points={pts} fill="none" stroke={trend >= 0 ? "#16a34a" : "#dc2626"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        {scores.map((s, i) => (
                          <circle key={i} cx={(i / (scores.length - 1)) * W} cy={H - ((s - min) / range) * H} r="3"
                            fill={trend >= 0 ? "#16a34a" : "#dc2626"} />
                        ))}
                      </svg>
                    </div>
                  );
                })()}
                {/* Growth Profile link */}
                <Link href="/practice">
                  <div className="mt-3 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.08)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.25)" }}>
                    <BarChart2 size={16} style={{ color: "var(--color-ln-gold)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>View Growth Profile & 30-Day Plan</p>
                    <ArrowRight size={14} className="ml-auto" style={{ color: "var(--color-ln-navy)" }} />
                  </div>
                </Link>
              </div>
            )}

            {/* ── Guide CTA ── */}
            <div className="rounded-2xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4"
              style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.08)", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.25)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--color-ln-yellow)" }}>
                <Sparkles size={18} style={{ color: "var(--color-ln-navy)" }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>
                  Ask Guide about your profile
                </p>
                <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>
                  Guide can help you interpret your archetypes and suggest your next leadership focus.
                </p>
              </div>
              <Link href="/guide">
                <Button size="sm" className="font-semibold flex-shrink-0"
                  style={{ background: "var(--color-ln-navy)", color: "white" }}>
                  Open Guide <ArrowRight size={12} className="ml-1" />
                </Button>
              </Link>
            </div>

          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
