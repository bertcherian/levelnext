import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import QueryErrorState from "@/components/QueryErrorState";
import { useLocation } from "wouter";
import { CheckCircle2, Circle, ArrowRight, TrendingUp, Award, Target, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CI_MODULES, getCiZone, type CiModuleMeta } from "@shared/modules/careerData";

// ─── Journey stage order ──────────────────────────────────────────────────────
const JOURNEY_STAGES = ["Discover", "Position", "Prepare", "Activate"];

// ─── Accent colour per module ─────────────────────────────────────────────────
function hexToOklch(hex: string): string {
  // Return the module's own hex colour as an inline style
  return hex;
}

// ─── Score ring component ─────────────────────────────────────────────────────
function ScoreRing({ score, color, size = 72 }: { score: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize={size * 0.22} fontWeight="700">
        {score}
      </text>
    </svg>
  );
}

// ─── Module card ──────────────────────────────────────────────────────────────
function ModuleCard({
  mod,
  report,
  onView,
  onStart,
}: {
  mod: CiModuleMeta;
  report?: { edgeScore: number; zone?: string | null; slug?: string | null; archetype?: string | null };
  onView: () => void;
  onStart: () => void;
}) {
  const completed = !!report;
  const zone = completed ? getCiZone(mod.code, report!.edgeScore) : null;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all"
      style={{
        background: completed
          ? `linear-gradient(135deg, rgba(${hexToRgb(mod.color)}, 0.08) 0%, rgba(255,255,255,0.02) 100%)`
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${completed ? `${mod.color}40` : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{mod.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${mod.color}20`, color: mod.color }}>
                {mod.code}
              </span>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                {mod.journeyStage}
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-1">{mod.label}</p>
          </div>
        </div>
        {completed ? (
          <CheckCircle2 size={18} style={{ color: mod.color, flexShrink: 0 }} />
        ) : (
          <Circle size={18} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
        )}
      </div>

      {/* Score / CTA */}
      {completed ? (
        <div className="flex items-center gap-4">
          <ScoreRing score={Math.round(report!.edgeScore)} color={mod.color} size={64} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: mod.color }}>{zone?.label ?? report!.zone}</p>
            {report!.archetype && (
              <p className="text-xs text-white/50 mt-0.5 truncate">{report!.archetype.replace(/_/g, " ")}</p>
            )}
            <Button
              size="sm"
              onClick={onView}
              className="mt-2 h-7 text-xs font-semibold px-3"
              style={{ background: `${mod.color}20`, color: mod.color, border: `1px solid ${mod.color}40` }}>
              View Report <ArrowRight size={11} className="ml-1" />
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs text-white/40 mb-3">{mod.tagline}</p>
          <Button
            size="sm"
            onClick={onStart}
            className="h-7 text-xs font-semibold px-3"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Begin Diagnostic
          </Button>
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "255,255,255";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

// ─── Overall CI score banner ──────────────────────────────────────────────────
function CiScoreBanner({ completedReports }: { completedReports: Array<{ edgeScore: number; moduleType: string }> }) {
  if (completedReports.length === 0) return null;
  const avg = Math.round(completedReports.reduce((s, r) => s + r.edgeScore, 0) / completedReports.length);
  const completedCodes = completedReports.map((r) => r.moduleType);
  const nextMod = CI_MODULES.find((m) => !completedCodes.includes(m.code));

  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(10,26,47,0.8) 100%)",
        border: "1px solid rgba(212,175,55,0.25)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Composite score */}
        <div className="flex items-center gap-4">
          <ScoreRing score={avg} color="#D4AF37" size={80} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-1">Career Transition Intelligence Score</p>
            <p className="text-2xl font-bold text-white">{avg} / 100</p>
            <p className="text-xs text-white/40 mt-0.5">
              Average across {completedReports.length} of {CI_MODULES.length} diagnostics
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50">Journey Progress</span>
            <span className="text-xs font-semibold text-white">{completedReports.length}/{CI_MODULES.length} complete</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(completedReports.length / CI_MODULES.length) * 100}%`,
                background: "linear-gradient(90deg, #D4AF37, #F59E0B)",
              }}
            />
          </div>
          {nextMod && (
            <p className="text-xs text-white/40 mt-2">
              <span style={{ color: nextMod.color }}>Next recommended: </span>
              <span className="font-semibold text-white/70">{nextMod.label}</span>
              <span className="text-white/30"> — discuss with your coach</span>
            </p>
          )}
        </div>

        {/* Stage badges */}
        <div className="flex flex-wrap gap-2">
          {JOURNEY_STAGES.map((stage) => {
            const stageMods = CI_MODULES.filter((m) => m.journeyStage === stage);
            const stageCompleted = stageMods.filter((m) => completedCodes.includes(m.code)).length;
            const allDone = stageCompleted === stageMods.length;
            return (
              <div
                key={stage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: allDone ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${allDone ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: allDone ? "#D4AF37" : "rgba(255,255,255,0.4)",
                }}>
                {allDone ? <Award size={11} /> : <Lock size={11} />}
                {stage}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CareerProgress() {
  const [, navigate] = useLocation();
  const { data: allReports = [], isLoading, isError, refetch } = trpc.report.myReports.useQuery();

  const CI_CODES = CI_MODULES.map((m) => m.code);
  const ciReports = allReports.filter((r) => CI_CODES.includes(r.moduleType));

  // Latest report per module
  const latestByModule: Record<string, typeof ciReports[0]> = {};
  for (const r of ciReports) {
    if (!latestByModule[r.moduleType] || r.createdAt > latestByModule[r.moduleType].createdAt) {
      latestByModule[r.moduleType] = r;
    }
  }

  const completedReports = Object.values(latestByModule);

  return (
    <PlatformLayout>
      <div className="min-h-screen" style={{ background: "var(--color-ln-navy)" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} style={{ color: "#D4AF37" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#D4AF37" }}>
              Career Transition Intelligence
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Your Progress</h1>
          <p className="text-sm text-white/50">
            Track your journey across all {CI_MODULES.length} Career Transition Intelligence diagnostics. Work with your coach to decide which to take next.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
          </div>
        )}
        {isError && <QueryErrorState compact onRetry={() => { void refetch(); }} />}

        {!isLoading && !isError && (
          <>
            {/* CI score banner */}
            <CiScoreBanner completedReports={completedReports} />

            {/* Coach guidance note */}
            <div
              className="rounded-xl p-4 mb-6 flex items-start gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Target size={16} style={{ color: "#D4AF37", flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm text-white/60 leading-relaxed">
                <span className="font-semibold text-white/80">Coach-guided selection:</span>{" "}
                There is no fixed sequence. You and your coach will decide which diagnostic to take next based on your current career goals and challenges.
              </p>
            </div>

            {/* Module grid — grouped by journey stage */}
            {JOURNEY_STAGES.map((stage) => {
              const stageMods = CI_MODULES.filter((m) => m.journeyStage === stage);
              return (
                <div key={stage} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/30">{stage}</span>
                    <div className="flex-1 h-px bg-white/8" />
                    <span className="text-xs text-white/25">
                      {stageMods.filter((m) => latestByModule[m.code]).length}/{stageMods.length} complete
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stageMods.map((mod) => {
                      const report = latestByModule[mod.code];
                      return (
                        <ModuleCard
                          key={mod.code}
                          mod={mod}
                          report={report}
                          onView={() => {
                            if (report?.slug) navigate(`/ci-report/${mod.code}/${report.slug}`);
                          }}
                          onStart={() => navigate(`/diagnostics/${mod.code.toLowerCase()}`)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {completedReports.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
                  <Target size={24} style={{ color: "#D4AF37" }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No diagnostics completed yet</h3>
                <p className="text-sm text-white/40 mb-6 max-w-sm mx-auto">
                  Talk to your coach about which Career Transition Intelligence diagnostic to start with.
                </p>
                <Button
                  onClick={() => navigate("/diagnostics")}
                  style={{ background: "#D4AF37", color: "#0A1A2F" }}
                  className="font-bold">
                  View Diagnostics
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </PlatformLayout>
  );
}
