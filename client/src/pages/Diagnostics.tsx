import { useState, useEffect } from "react";
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
  Upload,
  Brain,
  FileText,
  Briefcase,
} from "lucide-react";

// ── Leadership Intelligence modules ───────────────────────────────────────────
const LI_MODULES = [
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
    id: "LII",
    route: "lii",
    label: "Leadership Influence & Navigation Intelligence",
    shortLabel: "LII",
    tagline: "How effectively do you lead through influence, navigate complexity, and advance important work?",
    description: "Measure your trust capital, stakeholder alignment, decision influence, coalition building, organizational navigation, political intelligence, decision pathway mastery, strategic timing, and ethical leadership navigation.",
    questions: "40 questions · ~12 minutes",
    color: "#1a4a7a",
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
  {
    id: "STI",
    route: "sti",
    label: "Strategic Thinking Intelligence",
    shortLabel: "STI",
    tagline: "Do you think strategically — or just think you do?",
    description: "Measure your Strategic Clarity, Business Acumen, Systems Thinking, Long-Term Orientation, Market Awareness, Innovation & Opportunity, Strategic Prioritisation, Scenario Thinking, Strategic Communication, and Decision Quality.",
    questions: "30 questions · ~10 minutes",
    color: "#1e3a5f",
  },
  {
    id: "GCC",
    route: "org-intelligence",
    label: "GCC Readiness",
    shortLabel: "GCC",
    tagline: "Is your GCC operating as a strategic partner or a delivery arm?",
    description: "Evaluate your organisation's readiness across Strategic Influence, Operating Excellence, Leadership & Talent, Innovation & AI, and Enterprise Alignment. Part of the Organisation Intelligence platform.",
    questions: "Coming soon",
    color: "#0f2d4a",
    comingSoon: true,
  },
];

// ── Career Transition Intelligence modules (no gate — coach-guided selection) ─────────────
const CI_MODULES = [
  {
    id: "CPI",
    route: "cpi",
    label: "Career Positioning Intelligence",
    shortLabel: "CPI",
    tagline: "Know exactly where you stand — and where you should be.",
    description: "Measure how clearly you own and communicate your career identity. Covers your personal brand clarity, positioning in your market, differentiation from peers, and the strength of your professional narrative.",
    questions: "30 questions · ~10 minutes",
    color: "#D4AF37",
  },
  {
    id: "CMK",
    route: "cmk",
    label: "Career Marketability & Optionality Intelligence",
    shortLabel: "CMK",
    tagline: "How visible, valued, and in-demand are you — and how many real options do you have?",
    description: "Measure your external visibility, skill relevance, network strength, thought leadership presence, cross-functional mobility, entrepreneurial readiness, and the depth of your career safety net.",
    questions: "30 questions · ~10 minutes",
    color: "#22C55E",
  },
  {
    id: "AIR",
    route: "air",
    label: "AI Readiness Intelligence",
    shortLabel: "AIR",
    tagline: "Are you leading AI — or being replaced by it?",
    description: "Measure your readiness to work with and alongside AI effectively. Covers your AI literacy, workflow integration, strategic use of AI tools, and your ability to lead AI-augmented teams with confidence.",
    questions: "30 questions · ~10 minutes",
    color: "#EC4899",
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
      { toModule: toModule as "ECI" | "TII" | "LII" | "GCC" | "LDI" | "STI" | "NII" },
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

// ── LI Module card (with progressive unlock gates) ────────────────────────────
function LiModuleCard({
  mod,
  status,
  completedModules,
  reportSlug,
}: {
  mod: (typeof LI_MODULES)[0];
  status: ModuleStatus | undefined;
  completedModules: string[];
  reportSlug?: string;
}) {
  const [showGates, setShowGates] = useState(false);
  const [narrativeDismissed, setNarrativeDismissed] = useState(false);

  const isComingSoon = (mod as any).comingSoon === true;
  const done = completedModules.includes(mod.id);
  const state: UnlockState = status?.state ?? (mod.id === "ECI" ? "unlocked" : "not_started");
  const isLocked = state === "locked" || state === "not_started";
  const isUnlocked = state === "unlocked" || state === "completed";
  const narrativeReady = !!(status?.narrativeReady && !narrativeDismissed && !status.narrativeShown);

  // Coming-soon modules (e.g. GCC → Organisation Intelligence)
  if (isComingSoon) {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--color-ln-ivory)", border: "1px dashed var(--color-ln-border)", opacity: 0.75 }}
      >
        <div className="flex">
          <div className="w-1.5 flex-shrink-0" style={{ background: "var(--color-ln-border)" }} />
          <div className="flex-1 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: "var(--color-ln-border)", color: "var(--color-ln-muted)" }}>{mod.shortLabel}</span>
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded" style={{ background: "#0f2d4a18", color: "#0f2d4a" }}>Coming Soon</span>
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--color-ln-muted)" }}>{mod.label}</h2>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--color-ln-muted)" }}>{mod.tagline}</p>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-ln-muted)" }}>{mod.description}</p>
            <Link href="/org-intelligence">
              <Button variant="outline" className="font-medium text-sm" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}>
                View Organisation Intelligence Platform
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              {done && reportSlug && (
                <Link href={`/li-report/${mod.id}/${reportSlug}`}>
                  <Button variant="outline" className="font-semibold" style={{ borderColor: mod.color, color: mod.color }}>
                    View Report
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </Link>
              )}
              {mod.id === "ECI" && !done && isUnlocked && (
                <Link href="/import-eci">
                  <Button variant="outline" className="font-medium text-sm" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}>
                    <Upload size={13} className="mr-1.5" />
                    Import Existing ECI Report
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

// ── CI Module card (no gate — coach-guided selection) ─────────────────────────
function CiModuleCard({
  mod,
  completedModules,
  reportSlug,
}: {
  mod: (typeof CI_MODULES)[0];
  completedModules: string[];
  reportSlug?: string;
}) {
  const done = completedModules.includes(mod.id);

  return (
    <div
      className="rounded-2xl overflow-hidden card-lift"
      style={{
        background: "white",
        border: done ? `1px solid oklch(from var(--color-ln-yellow) l c h / 0.5)` : "1px solid var(--color-ln-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex">
        <div className="w-1.5 flex-shrink-0" style={{ background: done ? "var(--color-ln-yellow)" : mod.color }} />
        <div className="flex-1 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    background: done ? "oklch(from var(--color-ln-yellow) l c h / 0.15)" : `${mod.color}18`,
                    color: done ? "var(--color-ln-navy)" : mod.color,
                    border: `1px solid ${mod.color}30`,
                  }}
                >
                  {mod.shortLabel}
                </span>
                {done && (
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#16a34a" }}>
                    <CheckCircle2 size={13} /> Complete
                  </span>
                )}
                {!done && (
                  <span
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded"
                    style={{ background: `${mod.color}12`, color: mod.color }}
                  >
                    <Sparkles size={11} /> Available
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>{mod.label}</h2>
              <p className="text-sm font-medium mb-3" style={{ color: "var(--color-ln-muted)" }}>{mod.tagline}</p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-ln-text)" }}>{mod.description}</p>
              <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{mod.questions}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {done && reportSlug && (
              <Link href={`/ci-report/${mod.id}/${reportSlug}`}>
                <Button
                  className="font-semibold"
                  style={{ background: mod.color, color: "white" }}
                >
                  View Report
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            )}
            <Link href={`/diagnostics/${mod.route}`}>
              <Button
                variant="outline"
                className="font-semibold"
                style={{
                  borderColor: done ? "var(--color-ln-border)" : mod.color,
                  color: done ? "var(--color-ln-muted)" : mod.color,
                }}
              >
                {done ? "Retake Diagnostic" : "Begin Diagnostic"}
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simulated new-user status for the LI preview toggle
const NEW_USER_STATUSES: ModuleStatus[] = [
  { moduleId: "ECI", state: "unlocked", daysRemaining: 0, missionsCompleted: 0, missionTarget: 5, guideSessionsCompleted: 0, guideSessionTarget: 3, commitmentSet: false, focusDimension: null, narrativeReady: false, narrativeShown: false },
  { moduleId: "TII", state: "locked", daysRemaining: 18, missionsCompleted: 1, missionTarget: 5, guideSessionsCompleted: 0, guideSessionTarget: 3, commitmentSet: false, focusDimension: "Priority Clarity", narrativeReady: false, narrativeShown: false },
  { moduleId: "LII", state: "not_started", daysRemaining: 21, missionsCompleted: 0, missionTarget: 5, guideSessionsCompleted: 0, guideSessionTarget: 3, commitmentSet: false, focusDimension: null, narrativeReady: false, narrativeShown: false },
  { moduleId: "GCC", state: "not_started", daysRemaining: 21, missionsCompleted: 0, missionTarget: 5, guideSessionsCompleted: 0, guideSessionTarget: 3, commitmentSet: false, focusDimension: null, narrativeReady: false, narrativeShown: false },
  { moduleId: "LDI", state: "not_started", daysRemaining: 21, missionsCompleted: 0, missionTarget: 5, guideSessionsCompleted: 0, guideSessionTarget: 3, commitmentSet: false, focusDimension: null, narrativeReady: false, narrativeShown: false },
  { moduleId: "STI", state: "not_started", daysRemaining: 21, missionsCompleted: 0, missionTarget: 5, guideSessionsCompleted: 0, guideSessionTarget: 3, commitmentSet: false, focusDimension: null, narrativeReady: false, narrativeShown: false },
  { moduleId: "NII", state: "not_started", daysRemaining: 21, missionsCompleted: 0, missionTarget: 5, guideSessionsCompleted: 0, guideSessionTarget: 3, commitmentSet: false, focusDimension: null, narrativeReady: false, narrativeShown: false },
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
  const { data: activeProduct } = trpc.products.getActiveProduct.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch user's reports to get slugs for completed modules (both LI and CI)
  const { data: myReports } = trpc.report.myReports.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  // Build a map of moduleCode -> latest report slug for CI modules
  const ciReportSlugMap = new Map<string, string>();
  // Build a map of moduleCode -> latest report slug for LI modules
  const liReportSlugMap = new Map<string, string>();
  if (myReports) {
    const ciCodes = ["CPI","CRS","CMK","CST","CAO","AIR"];
    const liCodes = ["ECI","TII","LII","GCC","LDI","STI","NII"];
    for (const r of myReports) {
      const mc = (r.moduleType ?? "").toUpperCase();
      if (ciCodes.includes(mc) && !ciReportSlugMap.has(mc) && r.slug) {
        ciReportSlugMap.set(mc, r.slug);
      }
      if (liCodes.includes(mc) && !liReportSlugMap.has(mc) && r.slug) {
        liReportSlugMap.set(mc, r.slug);
      }
    }
  }

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [loading, isAuthenticated, navigate]);

  const activeProductId = activeProduct?.productId ?? "leadership_intelligence";
  const isCareerProduct = activeProductId === "career_intelligence";

  // When preview mode is on, simulate a fresh user who has only ECI unlocked
  const completedModules = viewAsNewUser ? [] : ((graph?.completedModules ?? []) as string[]);
  const activeStatuses = viewAsNewUser ? NEW_USER_STATUSES : (unlockStatuses ?? []);
  const statusMap = new Map<string, ModuleStatus>();
  for (const s of activeStatuses) statusMap.set(s.moduleId, s as ModuleStatus);

  // ── Career Intelligence view ─────────────────────────────────────────────────
  if (isCareerProduct) {
    return (
      <PlatformLayout title="Diagnostics">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 animate-fade-in">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase size={15} style={{ color: "var(--color-ln-yellow)" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-ln-yellow)" }}>Career Transition Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Career Diagnostics</h1>
            <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>
              Six career intelligence modules. Work with your coach to choose the diagnostic that matters most right now.
            </p>
          </div>

          {/* Coach-guided note */}
          <div className="mb-6 rounded-xl p-4 flex items-start gap-3" style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.08)", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.25)" }}>
            <MessageSquare size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--color-ln-yellow)" }} />
            <p className="text-sm" style={{ color: "var(--color-ln-navy)" }}>
              <strong>Coach-guided selection.</strong> All six diagnostics are available. Your coach will help you decide which one to take next based on your current career priorities and goals.
            </p>
          </div>

          <div className="space-y-6">
            {CI_MODULES.map((mod) => (
              <CiModuleCard key={mod.id} mod={mod} completedModules={completedModules} reportSlug={ciReportSlugMap.get(mod.id)} />
            ))}
          </div>

          {/* Prior Assessments Import Card */}
          <div className="mt-6 rounded-2xl p-5" style={{ background: "var(--color-ln-ivory-dark)", border: "1px solid var(--color-ln-border)" }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.12)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.3)" }}>
                <FileText size={18} style={{ color: "var(--color-ln-gold)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Upload Prior Assessments</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-ln-muted)" }}>
                  Already have a DISC, Hogan, Gallup StrengthsFinder, 360° feedback, or any other career assessment? Upload it and your Career Transition Coach will extract the relevant insights to enrich your coaching context.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["DISC", "Hogan", "Gallup", "360°", "EQ", "Enneagram", "MBTI"].map((tag) => (
                    <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)", color: "var(--color-ln-navy)" }}>{tag}</span>
                  ))}
                </div>
                <Link href="/import-prior-assessments">
                  <Button variant="outline" size="sm" className="mt-3 font-medium text-xs" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}>
                    <Upload size={12} className="mr-1.5" />
                    Upload Prior Assessment Report
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  // ── Leadership Intelligence view (existing gated flow) ───────────────────────
  return (
    <PlatformLayout title="Diagnostics">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 animate-fade-in">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Diagnostics</h1>
            <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>
              Seven intelligence modules. Each one builds your Leadership Edge — unlocked through application, not just completion.
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
          {LI_MODULES.map((mod) => (
            <LiModuleCard key={mod.id} mod={mod} status={statusMap.get(mod.id)} completedModules={completedModules} reportSlug={liReportSlugMap.get(mod.id)} />
          ))}
        </div>
        {/* Prior Assessments Import Card */}
        <div className="mt-6 rounded-2xl p-5" style={{ background: "var(--color-ln-ivory-dark)", border: "1px solid var(--color-ln-border)" }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.12)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.3)" }}>
              <FileText size={18} style={{ color: "var(--color-ln-gold)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Upload Prior Assessments</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-ln-muted)" }}>
                Already have an MBTI, DISC, Hogan, Gallup StrengthsFinder, 360° feedback, or any other assessment report? Upload it and Guide will extract the leadership-relevant insights to enrich your coaching context.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["MBTI", "DISC", "Hogan", "Gallup", "360°", "EQ", "Enneagram"].map((tag) => (
                  <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)", color: "var(--color-ln-navy)" }}>{tag}</span>
                ))}
              </div>
              <Link href="/import-prior-assessments">
                <Button variant="outline" size="sm" className="mt-3 font-medium text-xs" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}>
                  <Upload size={12} className="mr-1.5" />
                  Upload Prior Assessment Report
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ChatGPT Conversation Import Card */}
        <div className="mt-6 rounded-2xl p-5" style={{ background: "var(--color-ln-ivory-dark)", border: "1px solid var(--color-ln-border)" }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)", border: "1px solid oklch(from var(--color-ln-navy) l c h / 0.15)" }}>
              <Brain size={18} style={{ color: "var(--color-ln-navy)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Import Your AI Conversation Intelligence</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-ln-muted)" }}>
                Already using ChatGPT or Claude to think through leadership challenges? Import your conversation history and Guide will synthesise your patterns — without storing a single word of your raw conversations.
              </p>
              <Link href="/import-chatgpt">
                <Button variant="outline" size="sm" className="mt-3 font-medium text-xs" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}>
                  <Upload size={12} className="mr-1.5" />
                  Import ChatGPT or Claude Conversations
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl p-4 text-sm" style={{ background: "var(--color-ln-ivory-dark)", border: "1px solid var(--color-ln-border)", color: "var(--color-ln-muted)" }}>
          <p>
            <strong style={{ color: "var(--color-ln-navy)" }}>Why progressive unlocking?</strong>{" "}
            Research shows that insight without application produces almost no lasting change. Each diagnostic unlocks after 21 days of applying your previous results — 5 focused missions, 3 Guide coaching sessions, and one 30-day commitment. This is not a gate; it is the practice.
          </p>
        </div>
      </div>
    </PlatformLayout>
  );
}
