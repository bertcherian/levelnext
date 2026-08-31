import * as React from "react";
import { Check, CircleDashed, Eye, EyeOff, Flag, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mission = {
  id: number;
  title: string;
  description: string;
  status: "recommended" | "accepted" | "preparing" | "ready_to_act" | "attempted" | "complete" | "deferred" | "declined";
  dueAt: Date | null;
  partnerVisible: boolean;
};

function labelFor(status: Mission["status"]) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (value) => value.toUpperCase());
}

export default function MissionCard({ mission, busy, onStatus, onVisibility }: {
  mission: Mission;
  busy?: boolean;
  onStatus: (status: Mission["status"]) => void;
  onVisibility: (visible: boolean) => void;
}) {
  const complete = mission.status === "complete";
  const date = mission.dueAt ? new Date(mission.dueAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null;

  return (
    <article className="rounded-2xl border border-[#E7D69A] bg-[#FFFDF5] p-4 shadow-[0_10px_28px_rgba(16,36,62,0.06)] sm:p-5">
      <div className="flex gap-3">
        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#D4A900] text-[#10243E]">
          {complete ? <Check size={18} /> : <Flag size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#A37C00]">Current Mission</p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">{labelFor(mission.status)}</span>
          </div>
          <h3 className="mt-1 text-base font-bold text-[#10243E]">{mission.title}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-600">{mission.description}</p>
          {date && <p className="mt-2 text-xs font-medium text-slate-500">Suggested focus window: {date}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t border-[#E7D69A] pt-4 sm:flex-row sm:items-center">
        {!complete && mission.status === "recommended" && (
          <Button disabled={busy} onClick={() => onStatus("accepted")} className="bg-[#10243E] text-white hover:bg-[#18395F]">
            <Sparkles size={15} className="mr-2" /> Accept this Mission
          </Button>
        )}
        {!complete && mission.status !== "recommended" && mission.status !== "attempted" && (
          <Button disabled={busy} onClick={() => onStatus("attempted")} variant="outline" className="border-slate-300 bg-white text-[#10243E]">
            <CircleDashed size={15} className="mr-2" /> I attempted this
          </Button>
        )}
        {!complete && mission.status === "attempted" && (
          <Button disabled={busy} onClick={() => onStatus("complete")} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Check size={15} className="mr-2" /> Mark complete
          </Button>
        )}
        <Button disabled={busy} onClick={() => onVisibility(!mission.partnerVisible)} variant="ghost" className="text-xs text-slate-600 hover:text-[#10243E] sm:ml-auto">
          {mission.partnerVisible ? <EyeOff size={15} className="mr-2" /> : <Eye size={15} className="mr-2" />}
          {mission.partnerVisible ? "Keep Mission private" : "Share Mission focus with Partner"}
        </Button>
      </div>
      {mission.partnerVisible && <p className="mt-3 flex items-start gap-2 rounded-lg bg-white/75 px-3 py-2 text-xs leading-5 text-slate-600"><Send size={14} className="mt-0.5 shrink-0 text-[#A37C00]" /> Your Partner can see this Mission’s title, status, and focus window—not your diagnostic responses or private reflections.</p>}
    </article>
  );
}
