import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { getNextLeadershipMove, LEADER_CORE_MODULES } from "@/lib/leaderExperience";
import SelfLeadershipProgressCard from "@/components/SelfLeadershipProgressCard";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Compass,
  Loader2,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
  Zap,
} from "lucide-react";

function ToolLink({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-xl border p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
      style={{ background: "white", borderColor: "var(--color-ln-border)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.14)", color: "var(--color-ln-navy)" }}
        >
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{title}</p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-ln-muted)" }}>{description}</p>
        </div>
        <ArrowRight size={15} className="mt-1 flex-shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-80" style={{ color: "var(--color-ln-navy)" }} />
      </div>
    </button>
  );
}

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: tenant, isLoading: tenantLoading } = trpc.tenant.myTenant.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: graph } = trpc.leadershipGraph.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: true,
  });
  const { data: actionTimeline, refetch: refetchActionTimeline } = trpc.leadershipCoach.getActionTimeline.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: myOrg } = trpc.enterpriseOnboarding.getMyOrganisation.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateMissionStatus = trpc.mission.updateStatus.useMutation({
    onSuccess: () => {
      refetchActionTimeline();
      toast.success("Mission marked complete. Keep building on the momentum.");
    },
    onError: () => toast.error("Your mission could not be updated. Please try again."),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!loading && isAuthenticated && !tenantLoading && !tenant) {
      navigate("/onboard");
    }
  }, [loading, isAuthenticated, tenantLoading, tenant, navigate]);

  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-ln-muted)" }} />
        </div>
      </PlatformLayout>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "Leader";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const completedModules = graph?.completedModules ?? [];
  const timelineMissions = actionTimeline
    ?.filter((action) => action.type === "mission")
    .map((action) => ({ id: action.entityId, title: action.title, description: action.description ?? "", status: action.status }));
  const nextMove = getNextLeadershipMove(completedModules, timelineMissions);
  const isOrgAdmin = tenant?.role === "owner" || tenant?.role === "admin";
  const showOrgSetup = isOrgAdmin && (!myOrg || myOrg.wizardStatus !== "activated");
  const completionPct = Math.round((completedModules.filter((module) => LEADER_CORE_MODULES.includes(module as typeof LEADER_CORE_MODULES[number])).length / LEADER_CORE_MODULES.length) * 100);
  const openActions = actionTimeline?.filter((action) => action.status === "pending" || action.status === "in_progress" || action.status === "postponed").slice(0, 2) ?? [];

  const handlePrimaryAction = () => {
    if (nextMove.kind === "mission") {
      updateMissionStatus.mutate({ missionId: nextMove.mission.id, status: "complete" });
      return;
    }
    navigate(nextMove.href);
  };

  return (
    <PlatformLayout title="Home">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-ln-yellow)" }}>Leadership Intelligence</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-ln-navy)" }}>{greeting}, {firstName}.</h1>
          <p className="mt-2 text-base leading-relaxed" style={{ color: "var(--color-ln-muted)" }}>
            Focus on one meaningful move today. LevelNext keeps the rest of your leadership development in the background until you need it.
          </p>
        </header>

        {showOrgSetup && (
          <button
            onClick={() => navigate("/enterprise-onboarding")}
            className="group flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-150 hover:border-[var(--color-ln-yellow)] hover:shadow-sm active:scale-[0.99]"
            style={{ background: "oklch(from var(--color-ln-yellow) 98% 0.02 82)", borderColor: "oklch(from var(--color-ln-yellow) l c h / 0.45)" }}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--color-ln-navy)", color: "var(--color-ln-yellow)" }}><Building2 size={17} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Finish your organisation context</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--color-ln-muted)" }}>Personalise coaching for your cohort and leadership context.</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--color-ln-navy)" }}>Continue <ArrowRight size={13} /></span>
          </button>
        )}

        <section
          className="relative overflow-hidden rounded-2xl p-5 sm:p-7"
          style={{ background: "linear-gradient(135deg, var(--color-ln-navy) 0%, #1e426d 100%)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full" style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.11)" }} />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.18)", color: "var(--color-ln-yellow)" }}>
                {nextMove.kind === "diagnostic" ? <Compass size={16} /> : nextMove.kind === "mission" ? <Target size={16} /> : <MessageSquare size={16} />}
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-ln-yellow)" }}>Your next leadership move</p>
            </div>
            <h2 className="mt-5 text-xl font-bold sm:text-2xl" style={{ color: "white" }}>{nextMove.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: "oklch(83% 0.02 248.6)" }}>{nextMove.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                onClick={handlePrimaryAction}
                disabled={updateMissionStatus.isPending}
                className="font-semibold"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
              >
                {updateMissionStatus.isPending ? <Loader2 size={15} className="animate-spin" /> : nextMove.kind === "mission" ? <CheckCircle2 size={15} className="mr-1.5" /> : <ArrowRight size={15} className="mr-1.5" />}
                {updateMissionStatus.isPending ? "Updating…" : nextMove.ctaLabel}
              </Button>
              {nextMove.kind !== "guide" && (
                <button onClick={() => navigate("/guide")} className="text-sm font-semibold transition-opacity hover:opacity-75" style={{ color: "white" }}>
                  Ask Guide instead
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: "var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-ln-muted)" }}>Your leadership signal</p>
                <div className="mt-3 flex items-end gap-3">
                  <span className="text-4xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{graph?.compositeEdge ?? "—"}</span>
                  <span className="pb-1 text-sm" style={{ color: "var(--color-ln-muted)" }}>Leadership Edge</span>
                </div>
              </div>
              <button onClick={() => navigate("/my-edge")} className="flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: "var(--color-ln-navy)" }}>View profile <ArrowRight size={13} /></button>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs" style={{ color: "var(--color-ln-muted)" }}><span>Core diagnostic baseline</span><span className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>{completionPct}%</span></div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--color-ln-ivory-dark)" }}><div className="h-full rounded-full" style={{ width: `${completionPct}%`, background: "var(--color-ln-yellow)" }} /></div>
              <p className="mt-2 text-xs" style={{ color: "var(--color-ln-muted)" }}>{completedModules.length} completed module{completedModules.length === 1 ? "" : "s"} recorded across your Leadership Edge.</p>
            </div>
          </div>

          <div className="rounded-2xl p-5 sm:p-6" style={{ background: "oklch(from var(--color-ln-yellow) 98% 0.02 82)", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.45)" }}>
            <div className="flex items-center gap-2"><Sparkles size={17} style={{ color: "var(--color-ln-navy)" }} /><p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Keep the loop simple</p></div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-ln-muted)" }}>Understand the pattern, prepare for the real moment, then record what changed. Your profile becomes more useful with every completed action.</p>
            <button onClick={() => navigate("/insights")} className="mt-4 flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: "var(--color-ln-navy)" }}>Review insights & reports <ArrowRight size={13} /></button>
          </div>
        </section>

        <SelfLeadershipProgressCard enabled={isAuthenticated} />

        <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: "var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-ln-muted)" }}>Your action timeline</p>
              <h2 className="mt-1 text-lg font-bold" style={{ color: "var(--color-ln-navy)" }}>One place for missions and commitments</h2>
            </div>
            <button onClick={() => navigate("/growth-profile")} className="flex shrink-0 items-center gap-1 text-xs font-semibold hover:underline" style={{ color: "var(--color-ln-navy)" }}>Open timeline <ArrowRight size={13} /></button>
          </div>
          {openActions.length > 0 ? (
            <div className="mt-4 space-y-2">
              {openActions.map((action) => (
                <button key={action.id} onClick={() => navigate("/growth-profile")} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-[var(--color-ln-ivory)]" style={{ borderColor: "var(--color-ln-border)" }}>
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: action.type === "mission" ? "var(--color-ln-navy)" : "oklch(from var(--color-ln-yellow) l c h / 0.3)", color: action.type === "mission" ? "white" : "var(--color-ln-navy)" }}>{action.type === "mission" ? <Zap size={14} /> : <Target size={14} />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-ln-muted)" }}>{action.type}</span><span className="mt-0.5 block truncate text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>{action.title}</span></span>
                  <ArrowRight size={14} className="flex-shrink-0" style={{ color: "var(--color-ln-muted)" }} />
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => navigate("/growth-profile")} className="mt-4 flex w-full items-center gap-2 rounded-xl border border-dashed p-4 text-left text-sm transition-colors hover:bg-[var(--color-ln-ivory)]" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-muted)" }}><Target size={16} /> Your next diagnostic insight or mission will appear here.</button>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--color-ln-muted)" }}>Supporting tools</p><h2 className="mt-1 text-lg font-bold" style={{ color: "var(--color-ln-navy)" }}>Use these when they help your priority</h2></div>
            <button onClick={() => navigate("/diagnostics")} className="hidden items-center gap-1 text-xs font-semibold sm:flex" style={{ color: "var(--color-ln-navy)" }}>All diagnostics <ArrowRight size={13} /></button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ToolLink icon={MessageSquare} title="Guide" description="Interpret a pattern or prepare for a decision." onClick={() => navigate("/guide")} />
            <ToolLink icon={Zap} title="Practice" description="Rehearse a real conversation before it matters." onClick={() => navigate("/practice")} />
            <ToolLink icon={Activity} title="Growth" description="Review commitments and your 30-day plan." onClick={() => navigate("/growth-profile")} />
          </div>
        </section>

        <section className="flex flex-col gap-3 border-t pt-5 sm:flex-row" style={{ borderColor: "var(--color-ln-border)" }}>
          <button onClick={() => navigate("/playbook")} className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "var(--color-ln-muted)" }}><BookOpen size={15} /> Open a leadership playbook</button>
          <span className="hidden text-sm sm:inline" style={{ color: "var(--color-ln-border)" }}>•</span>
          <button onClick={() => navigate("/next-chapter")} className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "var(--color-ln-muted)" }}><TrendingUp size={15} /> Explore Next Chapter</button>
        </section>
      </div>
    </PlatformLayout>
  );
}
