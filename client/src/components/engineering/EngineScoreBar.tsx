import * as React from "react";
import { cn } from "@/lib/utils";

const ENGINE_LABELS: Record<string, string> = {
  self: "Self-leadership",
  collaboration: "Collaboration",
  problem: "Problem framing",
  systems: "Systems thinking",
  business: "Business impact",
  human_ai_judgment: "Human–AI judgment",
};

function tone(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-[#D4A900]";
  return "bg-slate-400";
}

export default function EngineScoreBar({ engine, score, compact = false }: { engine: string; score: number; compact?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white", compact ? "p-3" : "p-4")}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[#10243E]">{ENGINE_LABELS[engine] ?? engine}</span>
        <span className="text-sm font-bold text-[#10243E]">{score}<span className="ml-0.5 text-[10px] font-medium text-slate-400">/100</span></span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${ENGINE_LABELS[engine] ?? engine}: ${score} out of 100`}>
        <div className={cn("h-full rounded-full transition-all duration-500", tone(score))} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
    </div>
  );
}
