import { ArrowLeft, BarChart3, LockKeyhole, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

const NAVY = "#0A1A2F";
const GOLD = "#D4AF37";
const IVORY = "#F8F5F0";

export default function SponsorCapacityDashboard() {
  const query = trpc.effectiveness.getSponsorCapacity.useQuery();

  if (query.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: IVORY, color: NAVY }}>Preparing anonymized capacity intelligence…</div>;
  if (query.isError) return <AccessState title="Sponsor access is required." message={query.error.message || "This view is restricted to authorised organisation owners and sponsor administrators."} onRetry={() => query.refetch()} />;

  const data = query.data;
  return (
    <div className="min-h-screen px-4 py-8 md:px-8" style={{ background: IVORY, color: NAVY }}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/organisation" className="inline-flex items-center gap-1 text-xs font-semibold text-[#56616D] hover:text-[#0A1A2F]"><ArrowLeft size={13} /> Organisation</Link>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Effectiveness Intelligence</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Sponsor Capacity Dashboard</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#56616D]">See how leadership capacity is moving across a qualifying cohort. This is an aggregate development signal—not an individual performance ranking.</p>
          </div>
          <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching} className="border-[#0A1A2F] text-[#0A1A2F]"><RefreshCw size={14} className={query.isFetching ? "mr-2 animate-spin" : "mr-2"} /> Refresh</Button>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <SummaryCard icon={<UsersRound className="h-5 w-5" style={{ color: GOLD }} />} label="Participant band" value={data?.eligible ? `${data.participantCount}+` : "Withheld"} detail={data?.eligible ? "Latest snapshot used once per participant." : "The cohort is below the five-person privacy threshold."} />
          <SummaryCard icon={<BarChart3 className="h-5 w-5" style={{ color: GOLD }} />} label="Recovered hours" value={data?.eligible ? `~${data.metrics?.averageRecoverableHours}h` : "Withheld"} detail="Average weekly capacity currently available for recovery." />
          <SummaryCard icon={<ShieldCheck className="h-5 w-5" style={{ color: GOLD }} />} label="Privacy threshold" value="5+" detail="Applied before any cohort metric or category row is emitted." />
        </section>

        {!data?.eligible ? (
          <section className="mt-6 rounded-3xl border bg-white p-7 md:p-10" style={{ borderColor: "#E1D9CE" }}>
            <div className="flex items-start gap-4"><LockKeyhole className="mt-1 shrink-0" style={{ color: GOLD }} /><div><h2 className="text-xl font-semibold">Capacity dashboard withheld for privacy</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#56616D]">{data?.privacyBoundary}</p><Badge className="mt-5 bg-[#F3EBD9] text-[#0A1A2F]">5+ participant rule active</Badge></div></div>
          </section>
        ) : (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-4">
              <Metric label="Avg. below-level work" value={`${data.metrics?.averageWorkBelowLevelPercent}%`} detail="Latest snapshot per participant" />
              <Metric label="Avg. gap score" value={`${data.metrics?.averageCapacityGap}/100`} detail="Current vs altitude benchmark" />
              <Metric label="Participants reducing below-level work" value={`${data.metrics?.participantsWithBelowLevelReduction}%`} detail="Participants at or below 20%" />
              <Metric label="High-confidence snapshots" value={`${data.metrics?.highConfidenceSnapshotPercent}%`} detail="Five-day diary refinement" />
            </section>

            <section className="mt-6 rounded-3xl border bg-white p-5 md:p-7" style={{ borderColor: "#E1D9CE" }}>
              <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Cohort capacity allocation</h2><p className="mt-2 text-sm text-[#56616D]">Current allocation compared with the altitude benchmark, using the latest completed snapshot per participant.</p></div><Badge className="bg-[#F3EBD9] text-[#0A1A2F]">Anonymized</Badge></div>
              <div className="mt-7 space-y-5">
                {data.categories.map((category) => <div key={category.key}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold">{category.label}</span><span className="text-xs text-[#56616D]">{category.currentPercent}% current · {category.targetPercent}% target</span></div><div className="relative mt-2 h-3 overflow-hidden rounded-full" style={{ background: "#EEE8DF" }}><div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, category.currentPercent)}%`, background: NAVY }} /><div className="absolute inset-y-0 w-0.5 bg-[#A47618]" style={{ left: `${Math.min(100, category.targetPercent)}%` }} /></div><p className="mt-1 text-right text-[10px] font-semibold text-[#A47618]">{category.gapPercent > 0 ? `Needs +${category.gapPercent} points` : category.gapPercent < 0 ? `${Math.abs(category.gapPercent)} points above target` : "At target"}</p></div>)}
              </div>
              <div className="mt-7 flex items-start gap-3 rounded-xl p-4" style={{ background: IVORY }}><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: NAVY }} /><p className="text-xs leading-5 text-[#56616D]">{data.privacyBoundary}</p></div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E1D9CE" }}>{icon}<p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#6B6258]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#56616D]">{detail}</p></div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E1D9CE" }}><p className="text-xs font-semibold uppercase tracking-widest text-[#6B6258]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#56616D]">{detail}</p></div>;
}

function AccessState({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return <div className="min-h-screen grid place-items-center px-5" style={{ background: IVORY }}><div className="max-w-md rounded-3xl border bg-white p-8 text-center" style={{ borderColor: "#E1D9CE" }}><LockKeyhole className="mx-auto h-8 w-8" style={{ color: GOLD }} /><h1 className="mt-4 text-2xl font-semibold" style={{ color: NAVY }}>{title}</h1><p className="mt-3 text-sm leading-6 text-[#56616D]">{message}</p>{onRetry && <Button className="mt-6 bg-[#0A1A2F] text-white" onClick={onRetry}>Try again</Button>}</div></div>;
}
