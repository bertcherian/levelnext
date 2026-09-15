import { ArrowLeft, BarChart3, Download, FileText, LockKeyhole, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

const NAVY = "#0A1A2F";
const GOLD = "#D4AF37";
const IVORY = "#F8F5F0";

export default function SponsorCapacityDashboard() {
  const query = trpc.effectiveness.getSponsorCapacity.useQuery();
  const [selectedBaselineKey, setSelectedBaselineKey] = useState<string | null>(null);

  if (query.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: IVORY, color: NAVY }}>Preparing anonymized capacity intelligence…</div>;
  if (query.isError) return <AccessState title="Sponsor access is required." message={query.error.message || "This view is restricted to authorised organisation owners and sponsor administrators."} onRetry={() => query.refetch()} />;

  const data = query.data;
  const selectedBaseline = data?.eligible ? data.industryBaselines.find((baseline) => baseline.key === selectedBaselineKey) : null;
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
          <div className="flex flex-wrap gap-2">
            {data?.eligible && <>
              <Button variant="outline" onClick={() => downloadSponsorCapacityCsv(data)} className="border-[#0A1A2F] text-[#0A1A2F]"><Download size={14} className="mr-2" /> CSV</Button>
              <Button variant="outline" onClick={() => printSponsorCapacityPdf(data)} className="border-[#0A1A2F] text-[#0A1A2F]"><FileText size={14} className="mr-2" /> PDF</Button>
            </>}
            <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching} className="border-[#0A1A2F] text-[#0A1A2F]"><RefreshCw size={14} className={query.isFetching ? "mr-2 animate-spin" : "mr-2"} /> Refresh</Button>
          </div>
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
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h2 className="text-xl font-semibold">Cohort capacity allocation</h2><p className="mt-2 text-sm text-[#56616D]">Current allocation compared with the altitude benchmark, using the latest completed snapshot per participant.</p></div><div className="flex flex-wrap items-center gap-2"><label className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6258]">Reference overlay<select aria-label="Industry baseline overlay" value={selectedBaselineKey ?? "none"} onChange={(event) => setSelectedBaselineKey(event.target.value === "none" ? null : event.target.value)} className="ml-2 h-9 rounded-lg border border-[#E1D9CE] bg-white px-2 text-xs font-normal normal-case tracking-normal text-[#0A1A2F]"><option value="none">None</option>{data.industryBaselines.map((baseline) => <option key={baseline.key} value={baseline.key}>{baseline.label}</option>)}</select></label><Badge className="bg-[#F3EBD9] text-[#0A1A2F]">Anonymized</Badge></div></div>
              {selectedBaseline && <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#D4AF3730] bg-[#FFFDF7] p-3 text-xs text-[#6B6258]"><span className="mt-0.5 inline-block h-3 w-0.5 shrink-0 bg-[#D4AF37]" /> <span><strong className="text-[#0A1A2F]">{selectedBaseline.label}:</strong> {selectedBaseline.note} This is a directional reference, not a target or ranking.</span></div>}
              <div className="mt-7 space-y-5">
                {data.categories.map((category) => { const baselinePercent = selectedBaseline?.allocation?.[category.key as keyof typeof selectedBaseline.allocation] ?? null; return <div key={category.key}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold">{category.label}</span><span className="text-xs text-[#56616D]">{category.currentPercent}% current · {category.targetPercent}% target{baselinePercent !== null ? ` · ${baselinePercent}% reference` : ""}</span></div><div className="relative mt-2 h-3 overflow-hidden rounded-full" style={{ background: "#EEE8DF" }}><div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, category.currentPercent)}%`, background: NAVY }} /><div className="absolute inset-y-0 w-0.5 bg-[#A47618]" style={{ left: `${Math.min(100, category.targetPercent)}%` }} />{baselinePercent !== null && <div className="absolute inset-y-0 w-1 -translate-x-1/2 rounded-full bg-[#D4AF37]" style={{ left: `${Math.min(100, baselinePercent)}%` }} aria-label={`${selectedBaseline?.label} reference ${baselinePercent}%`} />}</div><p className="mt-1 text-right text-[10px] font-semibold text-[#A47618]">{category.gapPercent > 0 ? `Needs +${category.gapPercent} points` : category.gapPercent < 0 ? `${Math.abs(category.gapPercent)} points above target` : "At target"}</p></div>; })}
              </div>
              <div className="mt-7 flex flex-col gap-3"><div className="flex flex-wrap gap-4 text-[10px] font-semibold text-[#6B6258]"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#0A1A2F]" />Cohort current</span><span><i className="mr-1 inline-block h-2 w-0.5 bg-[#A47618]" />Role-altitude target</span>{selectedBaseline && <span><i className="mr-1 inline-block h-2 w-0.5 bg-[#D4AF37]" />Industry reference</span>}</div><div className="flex items-start gap-3 rounded-xl p-4" style={{ background: IVORY }}><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: NAVY }} /><p className="text-xs leading-5 text-[#56616D]">{data.privacyBoundary}</p></div></div>
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


type SponsorCapacityExportData = {
  eligible: true;
  participantCount: number;
  reportingPeriod: string;
  metrics: {
    averageRecoverableHours: number;
    averageWorkBelowLevelHours: number;
    averageWorkBelowLevelPercent: number;
    averageCapacityGap: number;
    participantsWithBelowLevelReduction: number;
    highConfidenceSnapshotPercent: number;
  };
  categories: Array<{ label: string; currentPercent: number; targetPercent: number; gapPercent: number }>;
  privacyBoundary: string;
};

function downloadSponsorCapacityCsv(data: SponsorCapacityExportData) {
  const rows: Array<Array<string | number>> = [
    ["LevelNext Sponsor Capacity Dashboard", "Aggregate metrics only"],
    ["Reporting period", data.reportingPeriod],
    ["Participant band", `${data.participantCount}+`],
    [],
    ["Metric", "Value"],
    ["Average recoverable hours / week", data.metrics.averageRecoverableHours],
    ["Average work below level / week", data.metrics.averageWorkBelowLevelHours],
    ["Average work below level (%)", data.metrics.averageWorkBelowLevelPercent],
    ["Average capacity gap score", data.metrics.averageCapacityGap],
    ["Participants reducing below-level work (%)", data.metrics.participantsWithBelowLevelReduction],
    ["High-confidence snapshot (%)", data.metrics.highConfidenceSnapshotPercent],
    [],
    ["Category", "Current allocation (%)", "Target allocation (%)", "Gap (points)"],
    ...data.categories.map((category) => [category.label, category.currentPercent, category.targetPercent, category.gapPercent]),
    [],
    ["Privacy boundary", data.privacyBoundary],
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `levelnext-sponsor-capacity-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function printSponsorCapacityPdf(data: SponsorCapacityExportData) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const safe = (value: string | number) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
  printWindow.document.write(`<!doctype html><html><head><title>LevelNext Sponsor Capacity Dashboard</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#0A1A2F;margin:36px;line-height:1.45}h1{font-size:25px;margin:0 0 5px}h2{font-size:16px;margin:26px 0 10px;border-bottom:1px solid #D4AF37;padding-bottom:6px}.meta{color:#56616D;font-size:12px;margin-bottom:22px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.metric{border:1px solid #E1D9CE;border-radius:10px;padding:12px}.label{font-size:10px;text-transform:uppercase;color:#6B6258;letter-spacing:.06em}.value{font-size:20px;font-weight:700;margin-top:4px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{text-align:left;padding:9px;border-bottom:1px solid #EEE8DF}th{color:#6B6258;font-size:10px;text-transform:uppercase}footer{margin-top:30px;padding-top:12px;border-top:1px solid #E1D9CE;color:#6B6258;font-size:10px}@media print{body{margin:18mm}}
  </style></head><body><h1>LevelNext Sponsor Capacity Dashboard</h1><p class="meta">Aggregate cohort report · ${safe(data.reportingPeriod)} · Participant band: ${safe(`${data.participantCount}+`)}</p><div class="metrics"><div class="metric"><div class="label">Avg recoverable hours / week</div><div class="value">${safe(data.metrics.averageRecoverableHours)}h</div></div><div class="metric"><div class="label">Avg below-level work</div><div class="value">${safe(data.metrics.averageWorkBelowLevelPercent)}%</div></div><div class="metric"><div class="label">Avg capacity gap</div><div class="value">${safe(data.metrics.averageCapacityGap)}/100</div></div></div><h2>Aggregate capacity allocation</h2><table><thead><tr><th>Category</th><th>Current</th><th>Target</th><th>Gap</th></tr></thead><tbody>${data.categories.map((category) => `<tr><td>${safe(category.label)}</td><td>${safe(category.currentPercent)}%</td><td>${safe(category.targetPercent)}%</td><td>${safe(category.gapPercent)} pts</td></tr>`).join("")}</tbody></table><h2>Additional signals</h2><table><tbody><tr><td>Participants reducing below-level work</td><td>${safe(data.metrics.participantsWithBelowLevelReduction)}%</td></tr><tr><td>High-confidence snapshots</td><td>${safe(data.metrics.highConfidenceSnapshotPercent)}%</td></tr></tbody></table><footer>${safe(data.privacyBoundary)}<br/>Generated by LevelNext · ${safe(new Date().toLocaleDateString("en-IN"))}</footer></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 300);
}
