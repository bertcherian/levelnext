import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Clock,
  Target,
  MessageSquare,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from "lucide-react";

const MODULES = [
  {
    id: "ECI",
    route: "eci",
    label: "Executive Communication Intelligence",
    shortLabel: "ECI",
    tagline: "How powerfully does your communication create followership?",
    description: "Measure your executive presence, narrative authority, listening depth, emotional regulation under pressure, and your ability to communicate across hierarchy, culture, and ambiguity.",
    questions: "30 questions · ~10 minutes",
    color: "#1e3a5f",
  },
  {
    id: "TII",
    route: "tii",
    label: "Leadership Time Intelligence",
    shortLabel: "TII",
    tagline: "Your calendar reveals your leadership system.",
    description: "Measure your Priority Clarity, Focus & Deep Work, Execution Discipline, Delegation & Letting Go, and Boundary Management — the five dimensions that determine whether you lead time or time leads you.",
    questions: "30 questions · ~10 minutes",
    color: "#1a3d5c",
  },
  {
    id: "LII",
    route: "lii",
    label: "Leadership Influence Intelligence",
    shortLabel: "LII",
    tagline: "How effectively do you lead through influence rather than authority?",
    description: "Measure your trust capital, stakeholder alignment, political intelligence, coalition building, and your ability to create followership without relying on positional power.",
    questions: "30 questions · ~10 minutes",
    color: "#1a4a7a",
  },
  {
    id: "GCC",
    route: "gcc",
    label: "GCC Readiness",
    shortLabel: "GCC",
    tagline: "Is your GCC operating as a strategic partner or a delivery arm?",
    description: "Evaluate your organisation's readiness across Strategic Influence, Operating Excellence, Leadership & Talent, Innovation & AI, and Enterprise Alignment.",
    questions: "50 questions · ~15 minutes",
    color: "#0f2d4a",
  },
  {
    id: "LDI",
    route: "ldi",
    label: "Leadership Derailment Intelligence",
    shortLabel: "LDI",
    tagline: "The hidden patterns that stall strong leaders — finally measured.",
    description: "Identify your top derailment risks across 10 dimensions: Emotional Regulation, Arrogance & Entitlement, Micromanagement, Conflict Avoidance, Poor Communication, Strategic Myopia, Low Accountability, Trust Deficit, Change Resistance, and Political Blindness.",
    questions: "30 questions · ~10 minutes",
    color: "#5c1a1a",
  },
];

type UnlockState = "unlocked" | "locked" | "completed" | "not_started";

interface ModuleStatus {
  moduleId: string;
  state: UnlockState;
  daysRemaining: number;
  missionsCompleted: number;
  missionTarget: number;
  guideSessionsCompleted: number;
  guideSessionTarget: number;
  commitmentSet: boolean;
  focusDimension: string | null;
  narrativeReady: boolean;
  narrativeShown: boolean;
}

// ── Gate progress bar ─────────────────────────────────────────────────────────
function GateBar({
  label,
  icon,
  current,
  target,
  done,
}: {
  label: string;
  icon: React.ReactNode;
  current: number;
  target: number;
  done: boolean;
}) {
  const pct = done ? 100 : Math.round((current / target) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="flex-shrink-0" style={{ color: done ? "#16a34a" : "var(--color-ln-muted)" }}>
        {icon}
      </span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{label}</span>
          <span className="text-xs font-semibold" style={{ color: done ? "#16a34a" : "var(--color-ln-navy)" }}>
            {done ? "Done" : `${current}/${target}`}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-ln-ivory-dark)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: done ? "#16a34a" : pct > 0 ? "var(--color-ln-navy)" : "transparent" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Narrative unlock banner ───────────────────────────────────────────────────
function NarrativeBanner({ toModule, onDismiss }: { toModule: string; onDismiss: () => void }) {
  const getNarrative = trpc.unlock.getNarrativeUnlock.useMutation();
  const [narrative, setNarrative] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    getNarrative.mutate(
      { toModule: toModule as "ECI" | "TII" | "LII" | "GCC" | "LDI" },
      { onSuccess: (data) => setNarrative(data.narrative) }
    );
  }, [toModule]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!narrative && !getNarrative.isPending) return null;

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 mb-4 animate-fade-in"
      style={{
        background: "linear-gradient(135deg, var(--color-ln-navy) 0%, #1a4a7a 100%)",
        border: "1px solid var(--color-ln-yellow)",
        boxShadow: "0 0 0 2px oklch(from var(--color-ln-yellow) l c h / 0.2)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5" style={{ background: "var(--color-ln-yellow)" }}>
          <Sparkles size={15} style={{ color: "var(--color-ln-navy)" }} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-ln-yellow)" }}>Guide says you are ready</p>
          {getNarrative.isPending ? (
            <div className="flex gap-1 mt-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.5)", animation: `typing-dot 1.2s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>{narrative}</p>
              <button
                onClick={() => navigate(`/guide?unlock=${toModule}`)}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.97]"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
              >
                <MessageSquare size={13} />
                Discuss with Guide
              </button>
            </>
          )}
        </div>
        <button onClick={onDismiss} className="flex-shrink-0 text-white/50 hover:text-white/80 transition-colors text-lg leading-none" aria-label="Dismiss">×</button>
      </div>
    </div>
  );
}

// ── Module card ────────────────────────────────────────────────────────────────
function ModuleCard({
  mod,
  status,
  completedModules,
}: {
  mod: (typeof MODULES)[0];
  status: ModuleStatus | undefined;
  completedModules: string[];
}) {
  const [showGates, setShowGates] = useState(false);
  const [narrativeDismissed, setNarrativeDismissed] = useState(false);

  const done = completedModules.includes(mod.id);
  const state: UnlockState = status?.state ?? (mod.id === "ECI" ? "unlocked" : "not_started");
  const isLocked = state === "locked" || state === "not_started";
  const isUnlocked = state === "unlocked" || state === "completed";
  const narrativeReady = !!(status?.narrativeReady && !narrativeDismissed && !status.narrativeShown);

  return (
    <div>
      {narrativeReady && (
        <NarrativeBanner toModule={mod.id} onDismiss={() => setNarrativeDismissed(true)} />
      )}
      <div
        className="rounded-2xl overflow-hidden card-lift"
        style={{
          background: isLocked ? "var(--color-ln-ivory)" : "white",
          border: isLocked ? "1px solid var(--color-ln-border)" : done ? "1px solid oklch(from var(--color-ln-yellow) l c h / 0.5)" : "1px solid var(--color-ln-border)",
          boxShadow: isLocked ? "none" : "var(--shadow-card)",
          opacity: state === "not_started" ? 0.6 : 1,
        }}
      >
        <div className="flex">
          <div className="w-1.5 flex-shrink-0" style={{ background: isLocked ? "var(--color-ln-border)" : done ? "var(--color-ln-yellow)" : mod.color }} />
          <div className="flex-1 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ background: isLocked ? "var(--color-ln-border)" : done ? "oklch(from var(--color-ln-yellow) l c h / 0.15)" : "var(--color-ln-ivory-dark)", color: isLocked ? "var(--color-ln-muted)" : "var(--color-ln-navy)" }}>
                    {mod.shortLabel}
                  </span>
                  {done && <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#16a34a" }}><CheckCircle2 size={13} /> Complete</span>}
                  {state === "locked" && (
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--color-ln-muted)" }}>
                      <Lock size={12} />
                      {status && status.daysRemaining > 0 ? `${status.daysRemaining} day${status.daysRemaining !== 1 ? "s" : ""} remaining` : "Complete gates to unlock"}
                    </span>
                  )}
                  {state === "not_started" && <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--color-ln-muted)" }}><Lock size={12} /> Complete prior module first</span>}
                  {isUnlocked && !done && (
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded" style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.15)", color: "var(--color-ln-navy)" }}>
                      <Sparkles size={11} /> Ready
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-bold mb-1" style={{ color: isLocked ? "var(--color-ln-muted)" : "var(--color-ln-navy)" }}>{mod.label}</h2>
                <p className="text-sm font-medium mb-3" style={{ color: "var(--color-ln-muted)" }}>{mod.tagline}</p>
                <p className="text-sm leading-relaxed mb-4" style={{ color: isLocked ? "var(--color-ln-muted)" : "var(--color-ln-text)" }}>{mod.description}</p>
                <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{mod.questions}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {isUnlocked && (
                <Link href={`/diagnostics/${mod.route}`}>
                  <Button className="font-semibold" style={{ background: done ? "var(--color-ln-ivory-dark)" : "var(--color-ln-navy)", color: done ? "var(--color-ln-navy)" : "white" }}>
                    {done ? "Retake Diagnostic" : "Begin Diagnostic"}
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </Link>
              )}
              {state === "locked" && status && (
                <button onClick={() => setShowGates((v) => !v)} className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: "var(--color-ln-navy)" }}>
                  {showGates ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  {showGates ? "Hide progress" : "View unlock progress"}
                </button>
              )}
            </div>
            {state === "locked" && status && showGates && (
              <div className="mt-4 rounded-xl p-4 space-y-3 animate-fade-in" style={{ background: "var(--color-ln-ivory-dark)", border: "1px solid var(--color-ln-border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-ln-navy)" }}>Unlock requirements</p>
                <GateBar label="21-day application period" icon={<Clock size={14} />} current={Math.max(0, 21 - status.daysRemaining)} target={21} done={status.daysRemaining === 0} />
                <GateBar label={`Module-specific missions${status.focusDimension ? ` (focus: ${status.focusDimension})` : ""}`} icon={<Target size={14} />} current={status.missionsCompleted} target={status.missionTarget} done={status.missionsCompleted >= status.missionTarget} />
                <GateBar label="Guide coaching sessions" icon={<MessageSquare size={14} />} current={status.guideSessionsCompleted} target={status.guideSessionTarget} done={status.guideSessionsCompleted >= status.guideSessionTarget} />
                <GateBar label="30-day Growth Profile commitment set" icon={<BookOpen size={14} />} current={status.commitmentSet ? 1 : 0} target={1} done={status.commitmentSet} />
                <p className="text-xs mt-2" style={{ color: "var(--color-ln-muted)" }}>All three gates must be satisfied before the next diagnostic unlocks.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simulated new-user status for the preview toggle
// Preview mode: ECI is unlocked (first module), LII is locked (prior module completed, gates not yet met),
// GCC is not_started (LII not yet completed). This gives the richest preview of all three lock states.
const NEW_USER_STATUSES: ModuleStatus[] = [
  { moduleId: "ECI", state: "unlocked", daysRemaining: 0, missionsCompleted: 0, missionTarget: 5, guideSessionsCompleted: 0, guideSessionTarget: 3, commitmentSet: false, focusDimension: null, narrativeReady: false, narrativeShown: false },
  { moduleId: "TII", state: "locked", daysRemaining: 18, missionsCompleted: 1, missionTarget: 5, guideSessionsCompleted: 0, guideSessionTarget: 3, commitmentSet: false, focusDimension: "Priority Clarity", narrativeReady: false, narrativeShown: false },
  { moduleId: "LII", state: "not_started", daysRemaining: 21, missionsCompleted: 0, missionTarget: 5, guideSessionsCompleted: 0, guideSessionTarget: 3, commitmentSet: false, focusDimension: null, narrativeReady: false, narrativeShown: false },
  { moduleId: "GCC", state: "not_started", daysRemaining: 21, missionsCompleted: 0, missionTarget: 5, guideSessionsCompleted: 0, guideSessionTarget: 3, commitmentSet: false, focusDimension: null, narrativeReady: false, narrativeShown: false },
  { moduleId: "LDI", state: "not_started", daysRemaining: 21, missionsCompleted: 0, missionTarget: 5, guideSessionsCompleted: 0, guideSessionTarget: 3, commitmentSet: false, focusDimension: null, narrativeReady: false, narrativeShown: false },
];

export default function Diagnostics() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [viewAsNewUser, setViewAsNewUser] = useState(false);

  const { data: graph } = trpc.leadershipGraph.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: unlockStatuses } = trpc.unlock.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
  });

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [loading, isAuthenticated, navigate]);

  // When preview mode is on, simulate a fresh user who has only ECI unlocked
  const completedModules = viewAsNewUser ? [] : ((graph?.completedModules ?? []) as string[]);
  const activeStatuses = viewAsNewUser ? NEW_USER_STATUSES : (unlockStatuses ?? []);
  const statusMap = new Map<string, ModuleStatus>();
  for (const s of activeStatuses) statusMap.set(s.moduleId, s as ModuleStatus);

  return (
    <PlatformLayout title="Diagnostics">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 animate-fade-in">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Diagnostics</h1>
            <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>
              Five intelligence modules. Each one builds your Leadership Edge — unlocked through application, not just completion.
            </p>
          </div>
          {/* View as new user toggle */}
          <button
            onClick={() => setViewAsNewUser((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 flex-shrink-0 active:scale-[0.97]"
            style={viewAsNewUser ? {
              background: "var(--color-ln-navy)",
              color: "white",
              borderColor: "var(--color-ln-navy)",
            } : {
              background: "transparent",
              color: "var(--color-ln-muted)",
              borderColor: "var(--color-ln-border)",
            }}
            title="Preview how this page looks to a brand-new user"
          >
            {viewAsNewUser ? <EyeOff size={13} /> : <Eye size={13} />}
            {viewAsNewUser ? "Exit preview" : "View as new user"}
          </button>
        </div>
        {viewAsNewUser && (
          <div
            className="mb-5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
            style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", color: "var(--color-ln-navy)", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.3)" }}
          >
            <Eye size={13} className="flex-shrink-0" />
            Preview mode — showing lock states as a new user would see them. Your actual progress is unchanged.
          </div>
        )}
        <div className="space-y-6">
          {MODULES.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} status={statusMap.get(mod.id)} completedModules={completedModules} />
          ))}
        </div>
        <div className="mt-8 rounded-xl p-4 text-sm" style={{ background: "var(--color-ln-ivory-dark)", border: "1px solid var(--color-ln-border)", color: "var(--color-ln-muted)" }}>
          <p>
            <strong style={{ color: "var(--color-ln-navy)" }}>Why progressive unlocking?</strong>{" "}
            Research shows that insight without application produces almost no lasting change. Each diagnostic unlocks after 21 days of applying your previous results — 5 focused missions, 3 Guide coaching sessions, and one 30-day commitment. This is not a gate; it is the practice.
          </p>
        </div>
      </div>
    </PlatformLayout>
  );
}
