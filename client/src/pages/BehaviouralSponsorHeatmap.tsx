import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LockKeyhole, ShieldCheck, UsersRound, RefreshCw, ArrowLeft, BarChart3 } from "lucide-react";
import { Link } from "wouter";

const NAVY = "#0A1A2F";
const GOLD = "#D4AF37";
const IVORY = "#F8F5F0";

function heatColor(intensity: number) {
  if (intensity <= 0) return "#EEE8DF";
  const alpha = Math.round(18 + intensity * 82).toString(16).padStart(2, "0");
  return `${GOLD}${alpha}`;
}

export default function BehaviouralSponsorHeatmap() {
  const { isAuthenticated } = useAuth();
  const heatmap = trpc.behaviouralIntelligence.getSponsorHeatmap.useQuery(undefined, { enabled: isAuthenticated });

  if (!isAuthenticated) {
    return <AccessState title="Sign in to view sponsor intelligence." message="This view is restricted to authorised organisation sponsors." />;
  }

  if (heatmap.isLoading) {
    return <div className="min-h-screen grid place-items-center" style={{ background: IVORY, color: NAVY }}>Preparing anonymized progress intelligence…</div>;
  }

  if (heatmap.isError) {
    return <AccessState title="Sponsor access is required." message={heatmap.error.message || "This view is only available to organisation owners and sponsor administrators."} onRetry={() => heatmap.refetch()} />;
  }

  const data = heatmap.data;

  return (
    <div className="min-h-screen px-4 py-8 md:px-8" style={{ background: IVORY, color: NAVY }}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/organisation" className="inline-flex items-center gap-1 text-xs font-semibold text-[#56616D] hover:text-[#0A1A2F]"><ArrowLeft size={13} /> Organisation</Link>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Sponsor intelligence</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Behavioural progress heatmap</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#56616D]">See how a cohort is moving from intention to demonstrated behavioural capacity. This is an aggregate development signal—not a performance ranking.</p>
          </div>
          <Button variant="outline" onClick={() => heatmap.refetch()} disabled={heatmap.isFetching} className="border-[#0A1A2F] text-[#0A1A2F]"><RefreshCw size={14} className={heatmap.isFetching ? "mr-2 animate-spin" : "mr-2"} /> Refresh</Button>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E1D9CE" }}><UsersRound className="h-5 w-5" style={{ color: GOLD }} /><p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#6B6258]">Participant band</p><p className="mt-2 text-2xl font-semibold">{data?.eligible ? `${data.participantCount}+` : "Withheld"}</p><p className="mt-1 text-xs text-[#56616D]">Exact small-cohort counts are not used to infer individual progress.</p></div>
          <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E1D9CE" }}><BarChart3 className="h-5 w-5" style={{ color: GOLD }} /><p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#6B6258]">Dimensions visible</p><p className="mt-2 text-2xl font-semibold">{data?.dimensions.length ?? 0}</p><p className="mt-1 text-xs text-[#56616D]">Only dimensions with at least five contributing participants appear.</p></div>
          <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E1D9CE" }}><ShieldCheck className="h-5 w-5" style={{ color: GOLD }} /><p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#6B6258]">Privacy threshold</p><p className="mt-2 text-2xl font-semibold">5+</p><p className="mt-1 text-xs text-[#56616D]">Applied before emitting each heatmap row.</p></div>
        </section>

        {!data?.eligible ? (
          <section className="mt-6 rounded-3xl border bg-white p-7 md:p-10" style={{ borderColor: "#E1D9CE" }}>
            <div className="flex items-start gap-4"><LockKeyhole className="mt-1 shrink-0" style={{ color: GOLD }} /><div><h2 className="text-xl font-semibold">Heatmap withheld for privacy</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#56616D]">{data?.privacyBoundary}</p><Badge className="mt-5 bg-[#F3EBD9] text-[#0A1A2F]">5+ participant rule active</Badge></div></div>
          </section>
        ) : (
          <section className="mt-6 rounded-3xl border bg-white p-5 md:p-7" style={{ borderColor: "#E1D9CE" }}>
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Cohort capacity movement</h2><p className="mt-2 text-sm text-[#56616D]">Percentage of the qualifying cohort reaching each evidence stage for the dimension.</p></div><Badge className="bg-[#F3EBD9] text-[#0A1A2F]">Anonymized</Badge></div>
            <div className="mt-7 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead><tr className="border-b" style={{ borderColor: "#E1D9CE" }}><th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-[#6B6258]">Behavioural dimension</th>{data.dimensions[0]?.cells.map((cell) => <th key={cell.stage} className="px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[#6B6258]">{cell.label}</th>)}<th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6B6258]">Signal</th></tr></thead>
                <tbody>{data.dimensions.map((dimension) => <tr key={dimension.key} className="border-b last:border-b-0" style={{ borderColor: "#F0EBE4" }}><th className="px-3 py-4 text-sm font-semibold">{dimension.label}<span className="mt-1 block text-[10px] font-normal text-[#8A8177]">{dimension.participantBand}</span></th>{dimension.cells.map((cell) => <td key={cell.stage} className="px-2 py-4 text-center"><div className="mx-auto flex h-12 w-16 items-center justify-center rounded-lg border text-xs font-semibold" title={`${cell.label}: ${cell.value}%`} style={{ background: heatColor(cell.intensity), borderColor: cell.intensity > 0 ? `${GOLD}55` : "#E1D9CE", color: NAVY }}>{cell.value}%</div></td>)}<td className="px-3 py-4 text-right text-xs font-semibold text-[#A47618]">{dimension.progressLabel}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-xl p-4" style={{ background: IVORY }}><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: NAVY }} /><p className="text-xs leading-5 text-[#56616D]">{data.privacyBoundary}</p></div>
          </section>
        )}
      </div>
    </div>
  );
}

function AccessState({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return <div className="min-h-screen grid place-items-center px-5" style={{ background: IVORY }}><div className="max-w-md rounded-3xl border bg-white p-8 text-center" style={{ borderColor: "#E1D9CE" }}><LockKeyhole className="mx-auto h-8 w-8" style={{ color: GOLD }} /><h1 className="mt-4 text-2xl font-semibold" style={{ color: NAVY }}>{title}</h1><p className="mt-3 text-sm leading-6 text-[#56616D]">{message}</p>{onRetry && <Button className="mt-6 bg-[#0A1A2F] text-white" onClick={onRetry}>Try again</Button>}</div></div>;
}
