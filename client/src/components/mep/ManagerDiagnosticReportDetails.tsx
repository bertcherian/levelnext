import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Target } from "lucide-react";
import type { MepReportFactor } from "@/lib/mepReportPdf";

export type MepDevelopmentAction = {
  priority?: number;
  focus: string;
  action: string;
  timeframe?: string;
  successSignal?: string;
};

export function MepReportDownloadButton({
  onClick,
  isExporting,
  disabled = false,
}: {
  onClick: () => void;
  isExporting: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-5 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
      onClick={onClick}
      disabled={isExporting || disabled}
      aria-label="Download Manager Effectiveness report as a PDF"
    >
      {isExporting ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Download size={14} className="mr-2" />}
      {isExporting ? "Preparing PDF…" : "Download Report"}
    </Button>
  );
}

export function MepReportDetails({
  factorReports,
  developmentActions,
}: {
  factorReports: MepReportFactor[];
  developmentActions: MepDevelopmentAction[];
}) {
  return (
    <>
      {factorReports.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
          <div className="flex items-start gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "oklch(from #D4AF37 l c h / 0.15)" }}>
              <Target size={16} style={{ color: "#9a7416" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>What Each Factor Means</h2>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "oklch(45% 0.02 248.6)" }}>
                Each score is paired with its management meaning, current strength or risk, and one action to practise next.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {factorReports.map((factor) => {
              const statusColor = factor.status === "Strength" ? "#16803d" : factor.status === "Foundation" ? "#b9780f" : "#c2410c";
              return (
                <div key={factor.label} className="rounded-xl p-4" style={{ background: "oklch(98% 0.005 248.6)", border: "1px solid oklch(92% 0.01 248.6)" }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{factor.label}</h3>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "oklch(45% 0.02 248.6)" }}>{factor.definition}</p>
                    </div>
                    <span className="text-[10px] whitespace-nowrap font-semibold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: `${statusColor}15`, color: statusColor }}>
                      {factor.score}/100 · {factor.status}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: "oklch(35% 0.02 248.6)" }}>
                    <span className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>Why it matters: </span>{factor.whyItMatters}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg p-3" style={{ background: "white" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#16803d" }}>Strength / current base</p>
                      <p className="text-xs leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{factor.strength}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "white" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#b45309" }}>Development risk</p>
                      <p className="text-xs leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{factor.weakness}</p>
                    </div>
                  </div>
                  <div className="rounded-lg p-3 mt-3" style={{ background: "oklch(from #D4AF37 l c h / 0.12)", border: "1px solid oklch(from #D4AF37 l c h / 0.25)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#8a6711" }}>Action to improve this area</p>
                    <p className="text-xs leading-relaxed" style={{ color: "oklch(30% 0.02 248.6)" }}>{factor.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {developmentActions.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>Your 30-Day Development Plan</h2>
          <p className="text-xs leading-relaxed mb-4" style={{ color: "oklch(45% 0.02 248.6)" }}>
            Start with one focused habit at a time. The sequence below turns the report into observable management practice.
          </p>
          <div className="space-y-3">
            {developmentActions.map((step, index) => (
              <div key={`${step.focus}-${index}`} className="flex gap-3 rounded-xl p-3" style={{ background: "oklch(from #D4AF37 l c h / 0.08)", border: "1px solid oklch(from #D4AF37 l c h / 0.2)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: "#D4AF37", color: "var(--color-ln-navy)" }}>
                  {step.priority ?? index + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-xs font-semibold" style={{ color: "var(--color-ln-navy)" }}>{step.focus}</h3>
                    {step.timeframe && <span className="text-[10px] font-medium" style={{ color: "#8a6711" }}>{step.timeframe}</span>}
                  </div>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: "oklch(33% 0.02 248.6)" }}>{step.action}</p>
                  {step.successSignal && <p className="text-[11px] leading-relaxed mt-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}><span className="font-semibold">Evidence of progress: </span>{step.successSignal}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
