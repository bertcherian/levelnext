import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import QueryErrorState from "@/components/QueryErrorState";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Radar,
  RefreshCw,
  X,
  Zap,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Handshake,
  Award,
  Building2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Radio,
  Send,
  ClipboardList,
} from "lucide-react";

// ─── Signal type config ───────────────────────────────────────────────────────
const SIGNAL_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  hiring: {
    label: "Hiring Signal",
    icon: <Users size={14} />,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  expansion: {
    label: "Expansion",
    icon: <TrendingUp size={14} />,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  leadership_change: {
    label: "Leadership Change",
    icon: <Zap size={14} />,
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
  },
  funding: {
    label: "Funding",
    icon: <DollarSign size={14} />,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  product_launch: {
    label: "Product Launch",
    icon: <Package size={14} />,
    color: "text-cyan-700",
    bg: "bg-cyan-50 border-cyan-200",
  },
  partnership: {
    label: "Partnership",
    icon: <Handshake size={14} />,
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
  },
  award: {
    label: "Award / Recognition",
    icon: <Award size={14} />,
    color: "text-rose-700",
    bg: "bg-rose-50 border-rose-200",
  },
};

const URGENCY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  high: { label: "High", color: "text-red-600", dot: "bg-red-500" },
  medium: { label: "Medium", color: "text-amber-600", dot: "bg-amber-400" },
  low: { label: "Low", color: "text-gray-500", dot: "bg-gray-300" },
};

// ─── Signal Card ──────────────────────────────────────────────────────────────
function SignalCard({
  signal,
  onDismiss,
}: {
  signal: {
    id: number;
    company: string;
    signalType: string;
    description: string;
    recommendedAction: string | null;
    urgency: string | null;
    createdAt: Date;
  };
  onDismiss: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [, navigate] = useLocation();
  const cfg = SIGNAL_CONFIG[signal.signalType] ?? SIGNAL_CONFIG.hiring;
  const urgency = URGENCY_CONFIG[signal.urgency ?? "medium"] ?? URGENCY_CONFIG.medium;

  function handleDraftOutreach() {
    // Deep-link to Outreach Engine with company and signal context pre-filled
    const params = new URLSearchParams({
      tab: "outreach",
      company: signal.company,
      context: `${cfg.label}: ${signal.description}`,
    });
    navigate(`/career/brand?${params.toString()}`);
  }

  function handlePrepInterview() {
    // Deep-link to Interview Prep with company pre-filled
    const params = new URLSearchParams({
      company: signal.company,
      context: signal.description,
    });
    navigate(`/career/interview-prep?${params.toString()}`);
  }

  return (
    <div
      className="rounded-xl border p-4 transition-all hover:shadow-sm"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start gap-3">
        {/* Urgency dot */}
        <div className="mt-1.5 flex-shrink-0">
          <span className={`block w-2 h-2 rounded-full ${urgency.dot}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>
              {signal.company}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}
            </span>
            <span className={`text-[10px] font-medium ${urgency.color}`}>
              {urgency.label} urgency
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            {signal.description}
          </p>

          {/* Recommended action (expandable) */}
          {signal.recommendedAction && (
            <div className="mb-3">
              <button
                className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                style={{ color: "var(--color-ln-navy)" }}
                onClick={() => setExpanded(!expanded)}
              >
                <ChevronRight
                  size={12}
                  className={`transition-transform ${expanded ? "rotate-90" : ""}`}
                />
                Recommended Action
              </button>
              {expanded && (
                <div
                  className="mt-2 rounded-lg p-3 text-sm"
                  style={{
                    background: "oklch(from var(--color-ln-gold) l c h / 0.08)",
                    borderLeft: "3px solid var(--color-ln-gold)",
                  }}
                >
                  {signal.recommendedAction}
                </div>
              )}
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDraftOutreach}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.97]"
              style={{ background: "var(--color-ln-navy)", color: "white" }}
            >
              <Send size={11} />
              Draft Outreach
            </button>
            {signal.signalType === "hiring" && (
              <button
                onClick={handlePrepInterview}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.97]"
                style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.15)", color: "var(--color-ln-navy)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.3)" }}
              >
                <ClipboardList size={11} />
                Prep for Interview
              </button>
            )}
          </div>
        </div>

        {/* Dismiss button */}
        <button
          className="flex-shrink-0 p-1.5 rounded hover:bg-black/8 text-muted-foreground hover:text-red-500 transition-colors"
          onClick={() => onDismiss(signal.id)}
          title="Dismiss signal"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onGenerate, isPending }: { onGenerate: () => void; isPending: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}
      >
        <Radio size={36} style={{ color: "var(--color-ln-navy)" }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>
        Your Radar Feed is Empty
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-8">
        AI scans your target companies for hiring signals, leadership changes, funding rounds, expansions, and more — then tells you exactly what to do next.
      </p>
      <Button
        onClick={onGenerate}
        disabled={isPending}
        className="h-11 px-8 font-semibold"
        style={{ background: "var(--color-ln-navy)", color: "white" }}
      >
        {isPending ? (
          <><RefreshCw size={16} className="mr-2 animate-spin" /> Scanning companies…</>
        ) : (
          <><Sparkles size={16} className="mr-2" /> Generate Radar Signals</>
        )}
      </Button>
      <p className="text-xs text-muted-foreground mt-4">
        Requires target organisations in your Opportunity Universe
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RadarSignals() {
  const utils = trpc.useUtils();
  const [showDismissed, setShowDismissed] = useState(false);

  const { data: signals, isLoading, isError, refetch } = trpc.radarSignals.listSignals.useQuery({
    includesDismissed: showDismissed,
  });

  const generateMutation = trpc.radarSignals.generateSignals.useMutation({
    onSuccess: (data) => {
      utils.radarSignals.listSignals.invalidate();
      toast.success(`${data.generated} new signals generated!`);
    },
    onError: (e) => toast.error(e.message),
  });

  const dismissMutation = trpc.radarSignals.dismissSignal.useMutation({
    onSuccess: () => {
      utils.radarSignals.listSignals.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const highUrgency = signals?.filter((s) => s.urgency === "high") ?? [];
  const mediumUrgency = signals?.filter((s) => s.urgency === "medium") ?? [];
  const lowUrgency = signals?.filter((s) => s.urgency === "low") ?? [];

  if (isError) {
    return (
      <PlatformLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <QueryErrorState
            title="Opportunity Radar couldn't be loaded"
            message="Your signal feed did not respond. Your saved signals are unchanged; try again."
            onRetry={() => { void refetch(); }}
          />
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <div
              className="rounded-xl p-3 flex-shrink-0"
              style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}
            >
              <Radar size={24} style={{ color: "var(--color-ln-navy)" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                Opportunity Radar
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI-generated signals from your target companies — hiring, expansion, leadership changes, and more.
              </p>
            </div>
          </div>

          {signals && signals.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="gap-2 flex-shrink-0"
            >
              {generateMutation.isPending ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Refresh
            </Button>
          )}
        </div>

        {/* Stats row */}
        {signals && signals.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "High Urgency", count: highUrgency.length, color: "text-red-600", bg: "bg-red-50" },
              { label: "Medium Urgency", count: mediumUrgency.length, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Low Urgency", count: lowUrgency.length, color: "text-gray-600", bg: "bg-gray-50" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl p-3 text-center ${stat.bg}`}>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Signal feed */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : !signals || signals.length === 0 ? (
          <EmptyState
            onGenerate={() => generateMutation.mutate()}
            isPending={generateMutation.isPending}
          />
        ) : (
          <div className="space-y-3">
            {/* High urgency first */}
            {highUrgency.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={13} className="text-red-500" />
                  <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                    High Urgency — Act Now
                  </p>
                </div>
                <div className="space-y-2">
                  {highUrgency.map((s) => (
                    <SignalCard key={s.id} signal={s} onDismiss={(id) => dismissMutation.mutate({ id })} />
                  ))}
                </div>
              </div>
            )}

            {/* Medium urgency */}
            {mediumUrgency.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 mt-4">
                  <Building2 size={13} className="text-amber-500" />
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                    Medium Urgency — This Week
                  </p>
                </div>
                <div className="space-y-2">
                  {mediumUrgency.map((s) => (
                    <SignalCard key={s.id} signal={s} onDismiss={(id) => dismissMutation.mutate({ id })} />
                  ))}
                </div>
              </div>
            )}

            {/* Low urgency */}
            {lowUrgency.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 mt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Low Urgency — On Your Radar
                  </p>
                </div>
                <div className="space-y-2">
                  {lowUrgency.map((s) => (
                    <SignalCard key={s.id} signal={s} onDismiss={(id) => dismissMutation.mutate({ id })} />
                  ))}
                </div>
              </div>
            )}

            {/* Toggle dismissed */}
            <div className="pt-4 text-center">
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                onClick={() => setShowDismissed(!showDismissed)}
              >
                {showDismissed ? "Hide dismissed signals" : "Show dismissed signals"}
              </button>
            </div>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
