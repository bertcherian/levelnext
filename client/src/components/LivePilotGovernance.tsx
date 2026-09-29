import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function keyFromLabel(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 100);
}

export function LivePilotGovernance({ pilotId }: { pilotId: number }) {
  const governance = trpc.behaviourChangeProof.livePilotGovernance.useQuery({ pilotId });
  const [reviewOwnerName, setReviewOwnerName] = useState("");
  const [reviewOwnerEmail, setReviewOwnerEmail] = useState("");
  const [dataBoundaryAcknowledged, setDataBoundaryAcknowledged] = useState(false);
  const [baselinePlanAcknowledged, setBaselinePlanAcknowledged] = useState(false);
  const [label, setLabel] = useState("");
  const [baselineValue, setBaselineValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("count");
  const [source, setSource] = useState("");
  const [definition, setDefinition] = useState("");
  const [decision, setDecision] = useState<"continue_controlled" | "extend_pilot" | "prepare_scale_review" | "stop">("continue_controlled");
  const [reviewSummary, setReviewSummary] = useState("");
  const [evidenceBoundaryAcknowledged, setEvidenceBoundaryAcknowledged] = useState(false);

  useEffect(() => {
    const current = governance.data?.governance;
    if (!current) return;
    setReviewOwnerName(current.reviewOwnerName ?? "");
    setReviewOwnerEmail(current.reviewOwnerEmail ?? "");
    setDataBoundaryAcknowledged(current.dataBoundaryAcknowledged);
    setBaselinePlanAcknowledged(current.baselinePlanAcknowledged);
  }, [governance.data?.governance]);
  useEffect(() => {
    const review = governance.data?.review;
    if (!review) return;
    setDecision(review.decision);
    setReviewSummary(review.summary);
    setEvidenceBoundaryAcknowledged(review.evidenceBoundaryAcknowledged);
  }, [governance.data?.review]);

  const refresh = () => void governance.refetch();
  const saveConsent = trpc.behaviourChangeProof.recordSponsorConsent.useMutation({ onSuccess: refresh });
  const saveMeasure = trpc.behaviourChangeProof.saveBaselineMeasure.useMutation({
    onSuccess: () => {
      setLabel(""); setBaselineValue(""); setTargetValue(""); setUnit("count"); setSource(""); setDefinition(""); refresh();
    },
  });
  const saveReview = trpc.behaviourChangeProof.saveDay30Review.useMutation({ onSuccess: refresh });
  const error = governance.error?.message ?? saveConsent.error?.message ?? saveMeasure.error?.message ?? saveReview.error?.message;
  const data = governance.data;
  const canSaveConsent = dataBoundaryAcknowledged && baselinePlanAcknowledged && reviewOwnerName.trim().length >= 2 && /\S+@\S+\.\S+/.test(reviewOwnerEmail);
  const canSaveMeasure = label.trim().length >= 3 && Number.isFinite(Number(baselineValue)) && unit.trim().length > 0 && source.trim().length >= 3 && definition.trim().length >= 8;
  const canSaveReview = reviewSummary.trim().length >= 20 && evidenceBoundaryAcknowledged;

  return <Card className="mt-8 border-[#0A1A2F]/15 bg-white">
    <CardHeader>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A78418]">Consented live pilot</p>
          <CardTitle className="mt-1 flex items-center gap-2 text-2xl text-[#0A1A2F]"><ShieldCheck size={22} /> Governance, baseline, and Day-30 decision</CardTitle>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Record the live-pilot boundary before invitations, keep baseline measures aggregate, and complete a Day-30 review only when consent and evidence conditions are met.</p>
        </div>
        {data?.readiness.ready ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Day-30 review ready</Badge> : <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Review controls active</Badge>}
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      <div className="grid gap-5 xl:grid-cols-3">
        <section className="rounded-xl border border-[#DCE3EA] bg-[#F8F5F0] p-5">
          <div className="flex items-center gap-2"><LockKeyhole size={18} className="text-[#A78418]" /><h3 className="font-semibold text-[#0A1A2F]">1. Sponsor consent</h3></div>
          <p className="mt-2 text-xs leading-5 text-slate-600">This is a governance record, not a legal substitute. Confirm the participant and data boundary before the cohort is invited.</p>
          <div className="mt-4 space-y-3">
            <Input value={reviewOwnerName} onChange={(event) => setReviewOwnerName(event.target.value)} placeholder="Day-30 review owner" />
            <Input value={reviewOwnerEmail} onChange={(event) => setReviewOwnerEmail(event.target.value)} placeholder="review.owner@company.com" type="email" />
            <label className="flex gap-2 text-xs leading-5 text-slate-700"><input type="checkbox" checked={dataBoundaryAcknowledged} onChange={(event) => setDataBoundaryAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#D4AF37]" />I confirm participants will see the development purpose and plain-language privacy boundary before sharing a baseline.</label>
            <label className="flex gap-2 text-xs leading-5 text-slate-700"><input type="checkbox" checked={baselinePlanAcknowledged} onChange={(event) => setBaselinePlanAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#D4AF37]" />I confirm baseline measures are aggregate and the review will not make causal or financial claims from this pilot alone.</label>
            <Button className="w-full bg-[#0A1A2F] text-white" disabled={!canSaveConsent || saveConsent.isPending} onClick={() => saveConsent.mutate({ pilotId, dataBoundaryAcknowledged: true, baselinePlanAcknowledged: true, reviewOwnerName, reviewOwnerEmail })}>{saveConsent.isPending ? "Recording…" : data?.governance ? "Update consent record" : "Record sponsor consent"}</Button>
          </div>
        </section>
        <section className="rounded-xl border border-[#DCE3EA] bg-white p-5">
          <div className="flex items-center gap-2"><Scale size={18} className="text-[#A78418]" /><h3 className="font-semibold text-[#0A1A2F]">2. Aggregate baseline</h3></div>
          <p className="mt-2 text-xs leading-5 text-slate-600">Use an observable team-level measure—not private reflection text. Reusing a measure label updates its baseline record.</p>
          <div className="mt-4 grid gap-3">
            <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Feedback conversations opened" />
            <div className="grid grid-cols-2 gap-3"><Input value={baselineValue} onChange={(event) => setBaselineValue(event.target.value)} type="number" placeholder="Baseline" /><Input value={targetValue} onChange={(event) => setTargetValue(event.target.value)} type="number" placeholder="Optional target" /></div>
            <Input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Unit: count, %, days" />
            <Input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Source: manager pulse, team tracker" />
            <Textarea value={definition} onChange={(event) => setDefinition(event.target.value)} placeholder="Define exactly what is counted and how the measure is read." className="min-h-20 text-sm" />
            <Button className="w-full bg-[#D4AF37] text-[#0A1A2F]" disabled={!canSaveMeasure || saveMeasure.isPending} onClick={() => saveMeasure.mutate({ pilotId, measureKey: keyFromLabel(label), label, baselineValue: Number(baselineValue), targetValue: targetValue ? Number(targetValue) : undefined, unit, source, definition })}>{saveMeasure.isPending ? "Saving…" : "Save baseline measure"}</Button>
          </div>
          {data?.baselineMeasures.length ? <div className="mt-4 space-y-2">{data.baselineMeasures.map((measure) => <div key={measure.id} className="rounded-lg bg-[#EEF4F9] p-3 text-xs text-slate-700"><b className="text-[#0A1A2F]">{measure.label}:</b> {measure.baselineValue} {measure.unit}{measure.targetValue !== null ? ` → ${measure.targetValue}` : ""}<br /><span className="text-slate-500">{measure.source}</span></div>)}</div> : null}
        </section>
        <section className="rounded-xl border border-[#DCE3EA] bg-white p-5">
          <div className="flex items-center gap-2"><ClipboardList size={18} className="text-[#A78418]" /><h3 className="font-semibold text-[#0A1A2F]">3. Day-30 review</h3></div>
          <p className="mt-2 text-xs leading-5 text-slate-600">Draft at any time. Completion is gated by Day 30, governance consent, a baseline measure, and participant consent coverage.</p>
          <div className="mt-4 space-y-3">
            <Label className="text-xs text-slate-600">Decision posture</Label>
            <select value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)} className="h-10 w-full rounded-md border border-[#C9D4DF] bg-white px-3 text-sm text-[#0A1A2F]"><option value="continue_controlled">Continue controlled testing</option><option value="extend_pilot">Extend this pilot</option><option value="prepare_scale_review">Prepare a scale review</option><option value="stop">Stop the pilot</option></select>
            <Textarea value={reviewSummary} onChange={(event) => setReviewSummary(event.target.value)} placeholder="Summarise the evidence mix, movement signals, limitations, and next decision. Do not state causal or financial impact." className="min-h-28 text-sm" />
            <label className="flex gap-2 text-xs leading-5 text-slate-700"><input type="checkbox" checked={evidenceBoundaryAcknowledged} onChange={(event) => setEvidenceBoundaryAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#D4AF37]" />I acknowledge this review reports movement evidence only—not causality, ROI, or financial impact.</label>
            <div className="flex gap-2"><Button variant="outline" className="flex-1 border-[#C9D4DF]" disabled={!canSaveReview || saveReview.isPending} onClick={() => saveReview.mutate({ pilotId, status: "draft", decision, summary: reviewSummary, evidenceBoundaryAcknowledged: true })}>Save draft</Button><Button className="flex-1 bg-[#0A1A2F] text-white" disabled={!canSaveReview || !data?.readiness.ready || saveReview.isPending} onClick={() => saveReview.mutate({ pilotId, status: "completed", decision, summary: reviewSummary, evidenceBoundaryAcknowledged: true })}>Complete review</Button></div>
          </div>
        </section>
      </div>
      <div className="rounded-xl border border-[#DCE3EA] bg-[#EEF4F9] p-4"><p className="text-sm font-semibold text-[#0A1A2F]">Review readiness</p>{data?.readiness.ready ? <p className="mt-1 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={16} />All consent, baseline, cohort, and Day-30 conditions are present.</p> : <ul className="mt-2 space-y-1 text-sm leading-5 text-slate-600">{data?.readiness.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul>}</div>
    </CardContent>
  </Card>;
}
