import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import QueryErrorState from "@/components/QueryErrorState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Scale,
  Sparkles,
  RefreshCw,
  Copy,
  CheckCheck,
  Plus,
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp,
  Shield,
  Target,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Trash2,
} from "lucide-react";

// ─── Copy Button ─────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded hover:bg-black/8 transition-colors flex-shrink-0"
      title="Copy"
    >
      {copied ? <CheckCheck size={14} className="text-emerald-600" /> : <Copy size={14} className="text-muted-foreground" />}
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: "var(--color-ln-navy)" }}>{icon}</span>
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Negotiation Form ─────────────────────────────────────────────────────────
function NegotiationForm({ onGenerated }: { onGenerated: () => void }) {
  const [form, setForm] = useState({
    role: "",
    company: "",
    offeredSalary: "",
    offeredBonus: "",
    offeredEquity: "",
    otherBenefits: "",
    currentSalary: "",
    targetSalary: "",
    marketContext: "",
    yourLeverage: "",
  });

  const generateMutation = trpc.negotiation.generateStrategy.useMutation({
    onSuccess: () => {
      onGenerated();
      toast.success("Negotiation strategy generated!");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold">Role *</Label>
          <Input className="mt-1" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="VP Engineering" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Company *</Label>
          <Input className="mt-1" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-semibold">Offered Salary (₹ LPA) *</Label>
          <Input className="mt-1" value={form.offeredSalary} onChange={(e) => setForm((f) => ({ ...f, offeredSalary: e.target.value }))} placeholder="80" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Offered Bonus</Label>
          <Input className="mt-1" value={form.offeredBonus} onChange={(e) => setForm((f) => ({ ...f, offeredBonus: e.target.value }))} placeholder="10% of base" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Equity / ESOPs</Label>
          <Input className="mt-1" value={form.offeredEquity} onChange={(e) => setForm((f) => ({ ...f, offeredEquity: e.target.value }))} placeholder="0.5% over 4 years" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold">Your Current Salary (₹ LPA)</Label>
          <Input className="mt-1" value={form.currentSalary} onChange={(e) => setForm((f) => ({ ...f, currentSalary: e.target.value }))} placeholder="65" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Your Target Salary (₹ LPA)</Label>
          <Input className="mt-1" value={form.targetSalary} onChange={(e) => setForm((f) => ({ ...f, targetSalary: e.target.value }))} placeholder="95" />
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold">Other Benefits Offered</Label>
        <Input className="mt-1" value={form.otherBenefits} onChange={(e) => setForm((f) => ({ ...f, otherBenefits: e.target.value }))} placeholder="Joining bonus, relocation, flexible hours, title…" />
      </div>

      <div>
        <Label className="text-xs font-semibold">Your Leverage Points</Label>
        <Textarea
          className="mt-1 text-sm resize-none"
          rows={2}
          value={form.yourLeverage}
          onChange={(e) => setForm((f) => ({ ...f, yourLeverage: e.target.value }))}
          placeholder="Competing offers, rare skills, specific achievements, urgency of their hire…"
        />
      </div>

      <div>
        <Label className="text-xs font-semibold">Market Context (optional)</Label>
        <Textarea
          className="mt-1 text-sm resize-none"
          rows={2}
          value={form.marketContext}
          onChange={(e) => setForm((f) => ({ ...f, marketContext: e.target.value }))}
          placeholder="Industry benchmarks, company funding stage, market conditions…"
        />
      </div>

      <Button
        className="w-full h-11 font-semibold gap-2"
        style={{ background: "var(--color-ln-navy)", color: "white" }}
        disabled={!form.role || !form.company || !form.offeredSalary || generateMutation.isPending}
        onClick={() => generateMutation.mutate(form)}
      >
        {generateMutation.isPending ? (
          <><RefreshCw size={16} className="animate-spin" /> Generating strategy…</>
        ) : (
          <><Sparkles size={16} /> Generate Negotiation Strategy</>
        )}
      </Button>
    </div>
  );
}

// ─── Strategy Results ─────────────────────────────────────────────────────────
type StrategyData = {
  offerAnalysis?: { compensationScore?: number; marketPosition?: string; negotiationRoom?: string; totalCompValue?: string; summary?: string };
  strategy?: { whatToAskFor?: string[]; whatToAccept?: string[]; walkAwayPoints?: string[]; sequencing?: string };
  counterOfferScripts?: Array<{ scenario: string; script: string }>;
  decisionFramework?: Array<{ dimension: string; score: number; note?: string }>;
};

type NegotiationSessionData = {
  strategyData: unknown;
  role: string;
  company: string;
  offeredSalary: string | null;
  createdAt: Date;
};

function StrategyResults({ session }: { session: NegotiationSessionData }) {
  const [expandedScript, setExpandedScript] = useState<number | null>(0);
  const parsed = (session.strategyData ?? {}) as StrategyData;

  return (
    <div className="space-y-5">
      {/* Offer Analysis */}
      {parsed.offerAnalysis && (
        <SectionCard title="Offer Analysis" icon={<DollarSign size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {[
              { label: "Compensation Score", value: (parsed.offerAnalysis as Record<string, unknown>).compensationScore, suffix: "/10" },
              { label: "Market Position", value: (parsed.offerAnalysis as Record<string, unknown>).marketPosition },
              { label: "Negotiation Room", value: (parsed.offerAnalysis as Record<string, unknown>).negotiationRoom },
            ].map((item) => (
              <div key={item.label} className="rounded-lg p-3 text-center" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.05)" }}>
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-lg font-bold" style={{ color: "var(--color-ln-navy)" }}>
                  {String(item.value ?? "–")}{item.suffix ?? ""}
                </p>
              </div>
            ))}
          </div>
          {(parsed.offerAnalysis as Record<string, string>).summary && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {(parsed.offerAnalysis as Record<string, string>).summary}
            </p>
          )}
        </SectionCard>
      )}

      {/* Negotiation Strategy */}
      {parsed.strategy && (
        <SectionCard title="Negotiation Strategy" icon={<Target size={16} />}>
          <div className="space-y-3">
            {(parsed.strategy as Record<string, string[]>).whatToAskFor && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">What to Ask For</p>
                <ul className="space-y-1.5">
                  {(parsed.strategy as Record<string, string[]>).whatToAskFor.map((item: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <TrendingUp size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(parsed.strategy as Record<string, string[]>).whatToAccept && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">What You Can Accept</p>
                <ul className="space-y-1.5">
                  {(parsed.strategy as Record<string, string[]>).whatToAccept.map((item: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(parsed.strategy as Record<string, string[]>).walkAwayPoints && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Walk-Away Points</p>
                <ul className="space-y-1.5">
                  {(parsed.strategy as Record<string, string[]>).walkAwayPoints.map((item: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <AlertTriangle size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Counter-offer Scripts */}
      {parsed.counterOfferScripts && (parsed.counterOfferScripts as Array<Record<string, string>>).length > 0 && (
        <SectionCard title="Counter-offer Scripts" icon={<Shield size={16} />}>
          <div className="space-y-2">
            {(parsed.counterOfferScripts as Array<Record<string, string>>).map((script, i) => (
              <div key={i} className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/4 transition-colors"
                  onClick={() => setExpandedScript(expandedScript === i ? null : i)}
                >
                  <span className="text-sm font-medium">{script.scenario}</span>
                  {expandedScript === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedScript === i && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-start gap-2 pt-3">
                      <p className="text-sm leading-relaxed italic flex-1">"{script.script}"</p>
                      <CopyButton text={script.script} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Decision Framework */}
      {parsed.decisionFramework && (
        <SectionCard title="Decision Framework" icon={<Lightbulb size={16} />}>
          <div className="space-y-3">
            {(parsed.decisionFramework ?? []).map((dim, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold">{dim.dimension}</p>
                    <p className="text-xs font-bold" style={{ color: "var(--color-ln-navy)" }}>{dim.score}/10</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(Number(dim.score) / 10) * 100}%`,
                        background: "var(--color-ln-navy)",
                      }}
                    />
                  </div>
                  {dim.note && <p className="text-xs text-muted-foreground mt-1">{dim.note}</p>}
                </div>
              </div>
            ))}
            {(parsed.decisionFramework as Array<Record<string, unknown>>).length > 0 && (
              <div
                className="mt-3 pt-3 border-t flex items-center justify-between"
                style={{ borderColor: "var(--color-border)" }}
              >
                <p className="text-sm font-semibold">Overall Decision Score</p>
                <p className="text-lg font-bold" style={{ color: "var(--color-ln-navy)" }}>
                  {Math.round(
                    (parsed.decisionFramework as Array<Record<string, unknown>>).reduce(
                      (sum, d) => sum + Number(d.score), 0
                    ) / (parsed.decisionFramework as Array<Record<string, unknown>>).length
                  )}/10
                </p>
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NegotiationIntelligence() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: latestSession, isLoading, isError: latestError, refetch: refetchLatest } = trpc.negotiation.getLatestSession.useQuery();
  const { data: sessionList, isError: listError, refetch: refetchList } = trpc.negotiation.listSessions.useQuery();

  const deleteMutation = trpc.negotiation.deleteSession.useMutation({
    onSuccess: () => {
      utils.negotiation.listSessions.invalidate();
      utils.negotiation.getLatestSession.invalidate();
      setSelectedId(null);
      toast.success("Session deleted");
    },
  });

  const displaySession = selectedId
    ? sessionList?.find((s) => s.id === selectedId) ?? latestSession
    : latestSession;

  function handleGenerated() {
    setShowForm(false);
    setSelectedId(null);
    utils.negotiation.getLatestSession.invalidate();
    utils.negotiation.listSessions.invalidate();
  }

  if (latestError || listError) {
    return <PlatformLayout><QueryErrorState onRetry={() => { void refetchLatest(); void refetchList(); }} /></PlatformLayout>;
  }

  return (
    <PlatformLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div
              className="rounded-xl p-3 flex-shrink-0"
              style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}
            >
              <Scale size={24} style={{ color: "var(--color-ln-navy)" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                Negotiation Intelligence
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI-powered offer analysis, negotiation strategy, counter-offer scripts, and decision framework.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(sessionList?.length ?? 0) > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="gap-2"
              >
                <RefreshCw size={14} />
                History ({sessionList?.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowForm(!showForm); setSelectedId(null); }}
              className="gap-2"
            >
              <Plus size={14} />
              New Analysis
            </Button>
          </div>
        </div>

        {/* History Drawer */}
        {showHistory && (sessionList?.length ?? 0) > 0 && (
          <div
            className="rounded-xl border mb-6 overflow-hidden"
            style={{ background: "var(--color-card)", borderColor: "var(--color-ln-border)" }}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--color-ln-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>Past Analyses</p>
              <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--color-ln-border)" }}>
              {sessionList?.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-black/4 transition-colors cursor-pointer"
                  style={{ background: selectedId === s.id ? "oklch(from var(--color-ln-navy) l c h / 0.06)" : undefined }}
                  onClick={() => { setSelectedId(s.id); setShowForm(false); setShowHistory(false); }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                      {s.role} @ {s.company}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ₹{s.offeredSalary} LPA
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedId === s.id && <Badge variant="outline" className="text-[10px]">Viewing</Badge>}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: s.id }); }}
                      className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Delete session"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        {(showForm || !latestSession) && !isLoading && (
          <div
            className="rounded-xl border p-5 mb-6"
            style={{ background: "var(--color-card)", borderColor: "var(--color-ln-navy)" }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>
              Analyse an Offer
            </p>
            <NegotiationForm onGenerated={handleGenerated} />
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : displaySession && !showForm ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                  {(displaySession as any).role} @ {(displaySession as any).company}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date((displaySession as any).createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ₹{(displaySession as any).offeredSalary} LPA offered
                </Badge>
                {selectedId && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedId(null)} className="text-xs gap-1">
                    View Latest
                  </Button>
                )}
              </div>
            </div>
            <StrategyResults session={displaySession as any} />
          </div>
        ) : !showForm ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="rounded-2xl p-5 mb-6"
              style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}
            >
              <Scale size={36} style={{ color: "var(--color-ln-navy)" }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>
              Negotiate with Confidence
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mb-8">
              Enter the offer details and AI will analyse it against market benchmarks, build your negotiation strategy, write counter-offer scripts, and score the decision across 5 dimensions.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="h-11 px-8 font-semibold"
              style={{ background: "var(--color-ln-navy)", color: "white" }}
            >
              <Sparkles size={16} className="mr-2" /> Analyse an Offer
            </Button>
          </div>
        ) : null}
      </div>
    </PlatformLayout>
  );
}
