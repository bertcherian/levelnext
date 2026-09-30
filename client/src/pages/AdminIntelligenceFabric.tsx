import PlatformLayout from "@/components/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BrainCircuit, CheckCircle2, Clock3, Database, Loader2, LockKeyhole, Play, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const GOLD = "var(--color-ln-yellow)";
const NAVY = "var(--color-ln-navy)";

function statusLabel(configured: boolean) {
  return configured ? "Configured for controlled evaluation" : "Not configured — deterministic fallback active";
}

export default function AdminIntelligenceFabric() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [state, setState] = useState("I keep postponing a difficult feedback conversation because I expect the other person to become defensive.");
  const [allowExternal, setAllowExternal] = useState(false);
  const { data, isLoading } = trpc.intelligenceFabric.status.useQuery(undefined, { enabled: user?.role === "admin" });
  const runDecision = trpc.intelligenceFabric.runDecision.useMutation({
    onSuccess: (result) => {
      toast.success(result.outcome === "jev" ? "Jev decision recorded" : "Fallback decision recorded");
      utils.intelligenceFabric.status.invalidate();
    },
    onError: (error) => toast.error(error.message || "Decision test failed"),
  });

  const run = () => {
    if (!state.trim()) {
      toast.error("Add a short, non-sensitive test situation first.");
      return;
    }
    runDecision.mutate({
      feature: "intelligence-fabric-console",
      task: "Select the smallest useful intervention for a controlled test situation",
      decisionClass: "intervention_selection",
      state: state.trim(),
      requirements: {
        qualityFloor: 75,
        maxLatencyMs: 2_000,
        maxCostUsd: 0.01,
        privacyClass: "standard",
        allowExternalProvider: allowExternal,
        maturity: "D0",
      },
      questions: {
        intervention: {
          type: "choice",
          instructions: "Which single intervention is the smallest useful next step for this situation?",
          criteria: {
            do_nothing: "No intervention; there is not enough signal to act.",
            reflection: "Ask one focused question before suggesting action.",
            commitment: "Create a specific action and date.",
            practice: "Offer a short Behaviour Rep.",
            simulation: "Offer a realistic conversation simulation.",
            human_support: "Recommend human support because the situation may require it.",
          },
        },
        escalation: {
          type: "noul",
          instructions: "Does this situation require human escalation before an AI intervention?",
          criteria: { true: "Safety, serious risk, or a need for human judgement is present.", false: "A bounded low-risk intervention is appropriate." },
        },
      },
    });
  };

  const latest = data?.recentDecisions?.[0];
  return (
    <PlatformLayout title="Intelligence Fabric">
      <main className="min-h-screen px-4 py-8 sm:px-8" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "oklch(from var(--color-ln-yellow) l c h / .18)", color: NAVY }}><BrainCircuit size={14} /> DECIDE → ACT → VERIFY → LEARN</div>
              <h1 className="text-3xl font-semibold tracking-tight" style={{ color: NAVY }}>Intelligence Fabric</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">A controlled decision layer for choosing the smallest useful intervention. Jev can provide typed signals; LevelNext rules still decide whether anything is allowed to happen.</p>
            </div>
            <Badge variant="outline" className="w-fit gap-2 px-3 py-2" style={{ borderColor: "oklch(from var(--color-ln-yellow) l c h / .6)", color: NAVY }}><LockKeyhole size={14} /> Admin only</Badge>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-sm font-medium" style={{ color: NAVY }}><Sparkles size={16} style={{ color: GOLD }} /> Jev decision layer</div><p className="mt-3 text-sm text-muted-foreground">{data ? statusLabel(data.jev.configured) : "Checking provider status…"}</p><Badge className="mt-3" style={{ background: data?.jev.configured ? "#dcfce7" : "#fef3c7", color: data?.jev.configured ? "#166534" : "#92400e" }}>{data?.jev.configured ? "Available" : "Fallback"}</Badge></CardContent></Card>
            <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-sm font-medium" style={{ color: NAVY }}><ShieldCheck size={16} style={{ color: GOLD }} /> Policy gateway</div><p className="mt-3 text-sm text-muted-foreground">External decisions require explicit opt-in and standard privacy context.</p><Badge className="mt-3" style={{ background: "#dcfce7", color: "#166534" }}>Active</Badge></CardContent></Card>
            <Card><CardContent className="p-5"><div className="flex items-center gap-2 text-sm font-medium" style={{ color: NAVY }}><Database size={16} style={{ color: GOLD }} /> Audit trail</div><p className="mt-3 text-sm text-muted-foreground">Decision outcome, confidence, latency, and context fields are recorded without raw reflections.</p><Badge className="mt-3" style={{ background: "#dcfce7", color: "#166534" }}>Active</Badge></CardContent></Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ color: NAVY }}><Play size={18} style={{ color: GOLD }} /> Controlled Jev experiment</CardTitle><p className="text-sm text-muted-foreground">Use only anonymised test situations. This does not change participant routing.</p></CardHeader>
              <CardContent className="space-y-4">
                <Textarea value={state} onChange={(event) => setState(event.target.value)} rows={6} placeholder="Enter a short, non-sensitive situation…" />
                <label className="flex items-start gap-3 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--color-border)" }}><Checkbox checked={allowExternal} onCheckedChange={(checked) => setAllowExternal(checked === true)} /><span><strong style={{ color: NAVY }}>Allow this test to call Jev</strong><span className="mt-1 block text-xs text-muted-foreground">If disabled, LevelNext will demonstrate the deterministic fallback. Never use this control with private participant content.</span></span></label>
                <Button onClick={run} disabled={runDecision.isPending} className="gap-2" style={{ background: NAVY, color: "white" }}>{runDecision.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Run controlled decision</Button>
                {latest && <div className="rounded-xl p-4" style={{ background: "oklch(from var(--color-ln-yellow) l c h / .12)" }}><div className="flex flex-wrap items-center justify-between gap-2"><strong style={{ color: NAVY }}>Latest decision: {latest.outcome}</strong><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 size={13} /> {latest.latencyMs}ms</span></div><pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs" style={{ color: "var(--color-ln-charcoal)" }}>{JSON.stringify(latest.answer, null, 2)}</pre></div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle style={{ color: NAVY }}>Decision maturity</CardTitle><p className="text-sm text-muted-foreground">Jev starts in experimental mode. It must earn trust before production routing.</p></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {["D0 · Experimental — evaluate the decision", "D1 · Shadow — compare with the human or rule", "D2 · Assisted — recommend, then confirm", "D3 · Autonomous low risk — act within limits", "D4 · Proven autonomous — sustained evidence"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-lg border px-3 py-2" style={{ borderColor: index === 0 ? "oklch(from var(--color-ln-yellow) l c h / .7)" : "var(--color-border)", background: index === 0 ? "oklch(from var(--color-ln-yellow) l c h / .1)" : "transparent" }}>{index === 0 ? <TriangleAlert size={15} style={{ color: "#a16207" }} /> : <CheckCircle2 size={15} className="text-muted-foreground" />}<span>{item}</span></div>)}
              </CardContent>
            </Card>
          </div>

          <Card><CardHeader><CardTitle style={{ color: NAVY }}>Model registry</CardTitle><p className="text-sm text-muted-foreground">Providers are replaceable suppliers. Product logic owns the behaviour taxonomy, intervention rules, evidence boundaries, and policy decisions.</p></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(data?.registry ?? []).map((entry) => <div key={`${entry.provider}-${entry.model}`} className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)" }}><div className="flex items-start justify-between gap-2"><div><p className="font-semibold" style={{ color: NAVY }}>{entry.model}</p><p className="text-xs text-muted-foreground">{entry.provider} · Tier {entry.tier}</p></div><Badge variant="outline" className="text-[10px]">{entry.productionApproved ? "Approved" : "Evaluate"}</Badge></div><p className="mt-3 text-xs text-muted-foreground">{entry.capabilities.join(" · ")}</p><p className="mt-2 text-xs" style={{ color: "var(--color-ln-charcoal)" }}>{entry.privacyClass} privacy · {entry.latencyNote}</p></div>)}</div></CardContent></Card>

          <p className="text-xs text-muted-foreground">{isLoading ? "Loading decision history…" : `Showing ${data?.recentDecisions?.length ?? 0} recent decision attempts.`} Provider names and routing details stay inside this admin workspace; participants experience only the next useful action.</p>
        </div>
      </main>
    </PlatformLayout>
  );
}
