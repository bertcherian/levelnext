import { ArrowRight, CheckCircle2, Compass, Loader2, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImmediateResultSummary, type ImmediateDiagnosticResult } from "@/lib/leaderFeedback";

type ModuleMeta = { label: string; color: string };

export function ImmediateDiagnosticResult({
  result,
  module,
  actionAdded,
  addingAction,
  onAddAction,
  onAskGuide,
  onOpenTimeline,
  onViewDetail,
}: {
  result: ImmediateDiagnosticResult;
  module: ModuleMeta;
  actionAdded: boolean;
  addingAction: boolean;
  onAddAction: (text: string) => void;
  onAskGuide: () => void;
  onOpenTimeline: () => void;
  onViewDetail: () => void;
}) {
  const summary = getImmediateResultSummary(result, module.label);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      <header className="flex items-center justify-center px-4 py-4 sm:px-6">
        <img src="/logo.png" alt="LevelNext" className="h-8 object-contain" style={{ filter: "brightness(0) saturate(100%) invert(17%) sepia(41%) saturate(800%) hue-rotate(190deg) brightness(85%)" }} />
      </header>

      <main className="mx-auto max-w-xl px-4 pb-10 pt-3 sm:px-6 sm:pt-8">
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.18)", color: "var(--color-ln-navy)" }}>
            <CheckCircle2 size={23} />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-ln-yellow)" }}>Diagnostic complete</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: "var(--color-ln-navy)" }}>{summary.headline}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: "var(--color-ln-muted)" }}>
            Take one minute to understand the signal, then choose one action to carry into your real work.
          </p>
        </div>

        <section className="mt-7 rounded-2xl p-5 sm:p-6" style={{ background: "var(--color-ln-navy)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-full border-4" style={{ borderColor: "var(--color-ln-yellow)", background: "oklch(from var(--color-ln-yellow) l c h / 0.1)" }}>
              <span className="text-3xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>{summary.score}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "oklch(72% 0.02 248.6)" }}>Edge</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-ln-yellow)" }}>{summary.zone}</p>
              <h2 className="mt-1 text-xl font-bold text-white">{summary.profile}</h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "oklch(78% 0.02 248.6)" }}>{summary.meaning}</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: "var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.16)", color: "var(--color-ln-navy)" }}><Target size={18} /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--color-ln-muted)" }}>One focus for this week</p>
              <h2 className="mt-1 text-lg font-bold" style={{ color: "var(--color-ln-navy)" }}>{summary.growthFocus}</h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-ln-muted)" }}>{summary.commitment}</p>
            </div>
          </div>

          {!actionAdded ? (
            <Button onClick={() => onAddAction(summary.commitment)} disabled={addingAction} className="mt-5 w-full font-semibold" style={{ background: "var(--color-ln-navy)", color: "white" }}>
              {addingAction ? <><Loader2 size={15} className="mr-2 animate-spin" />Adding to your timeline…</> : <><Target size={15} className="mr-2" />Add this to my action timeline</>}
            </Button>
          ) : (
            <button onClick={onOpenTimeline} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors hover:bg-[var(--color-ln-ivory)]" style={{ borderColor: "oklch(from #16a34a l c h / 0.3)", color: "#15803d" }}>
              <CheckCircle2 size={16} /> Added to your action timeline <ArrowRight size={15} />
            </button>
          )}
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button onClick={onAskGuide} className="flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-semibold transition-colors hover:bg-[var(--color-ln-ivory)]" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}><Sparkles size={16} /> Ask Guide about this</button>
          <button onClick={onViewDetail} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:opacity-80" style={{ color: "var(--color-ln-navy)" }}><Compass size={16} /> Explore detailed insight</button>
        </div>
      </main>
    </div>
  );
}
