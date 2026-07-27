import { useState, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, ArrowLeft, Download, Sparkles, ChevronDown, ChevronUp,
  Target, TrendingUp, AlertTriangle, BookOpen, Calendar, Brain,
  CheckCircle2, Circle, Lightbulb, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
// Types inlined from server/routers/cpiReport.ts
type CpiDimensionAnalysis = {
  dimensionId: string;
  label: string;
  score: number;
  band: string;
  insight: string;
  implication: string;
  quickWin: string;
};
type CpiBlindSpot = { title: string; description: string; careerRisk: string; intervention: string; };
type CpiActionItem = { week: string; focus: string; action: string; successMetric: string; };
type CpiLearningRec = { category: string; title: string; description: string; timeInvestment: string; };
type CpiAnalysis = {
  executiveSummary: string;
  scoreInterpretation: string;
  dimensionAnalysis: CpiDimensionAnalysis[];
  archetypeNarrative: string;
  archetypeGrowthPath: string;
  blindSpots: CpiBlindSpot[];
  actionPlan: CpiActionItem[];
  learningRecommendations: CpiLearningRec[];
  coachFocusAreas: string[];
  coachOpeningPrompt: string;
  coachChallengeQuestion: string;
};

// ─── Sample PDF CDN links ────────────────────────────────────────────────────
const SAMPLE_PDF_URLS: Record<string, string> = {
  CPI: "/manus-storage/cpi_sample_report_b3dd24bb.pdf",
  CRS: "/manus-storage/crs_sample_report_62c7166a.pdf",
  CMK: "/manus-storage/cmk_sample_report_49fea189.pdf",
  CST: "/manus-storage/cst_sample_report_0d2f06f6.pdf",
  CAO: "/manus-storage/cao_sample_report_0cde1f59.pdf",
  AIR: "/manus-storage/air_sample_report_111953bf.pdf",
};

// ─── Brand colours ────────────────────────────────────────────────────────────
const NAVY   = "#0A1A2F";
const GOLD   = "#D4AF37";
const IVORY  = "#F8F5F0";
const INDIGO = "#4F46E5";
const TEAL   = "#0D9488";

// ─── Zone colour map ─────────────────────────────────────────────────────────
const ZONE_COLORS: Record<string, string> = {
  immediate_repositioning: "#EF4444",
  career_drift:            "#F59E0B",
  solid_underleveraged:    "#3B82F6",
  strong_market_position:  "#22C55E",
  exceptional_positioning: "#D4AF37",
};

// ─── Band colour helper ───────────────────────────────────────────────────────
function bandColor(band: string): string {
  if (band === "strength")   return "#22C55E";
  if (band === "developing") return "#F59E0B";
  return "#EF4444";
}
function bandLabel(band: string): string {
  if (band === "strength")   return "Strength";
  if (band === "developing") return "Developing";
  return "Gap";
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon, children, accent = NAVY }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: accent + "18", color: accent }}>
          {icon}
        </div>
        <h2 className="text-lg font-bold" style={{ color: NAVY }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Dimension bar ────────────────────────────────────────────────────────────
function DimensionBar({ dim, expanded, onToggle }: {
  dim: CpiDimensionAnalysis; expanded: boolean; onToggle: () => void;
}) {
  const color = bandColor(dim.band);
  return (
    <div className="border rounded-xl mb-3 overflow-hidden" style={{ borderColor: "#E5E7EB", background: "white" }}>
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm" style={{ color: NAVY }}>{dim.label}</span>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: color + "18", color }}>
                {bandLabel(dim.band)}
              </span>
              <span className="font-bold text-sm" style={{ color: NAVY }}>{dim.score}</span>
              {expanded ? <ChevronUp size={14} style={{ color: "#555555" }} /> : <ChevronDown size={14} style={{ color: "#555555" }} />}
            </div>
          </div>
          <div className="h-2 rounded-full" style={{ background: "#F3F4F6" }}>
            <div className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${dim.score}%`, background: color }} />
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: "#F3F4F6" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: INDIGO }}>Insight</p>
              <p className="text-sm" style={{ color: "#374151" }}>{dim.insight}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: TEAL }}>Career Implication</p>
              <p className="text-sm" style={{ color: "#374151" }}>{dim.implication}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GOLD }}>Quick Win (14 days)</p>
              <p className="text-sm font-medium" style={{ color: "#374151" }}>{dim.quickWin}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CpiReport() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [expandedDims, setExpandedDims] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<CpiAnalysis | null>(null);

  // Fetch report by slug
  const { data: report, isLoading: reportLoading } = trpc.assessment.getReport.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  // Fetch cached analysis
  const { data: cachedAnalysis, isLoading: analysisLoading } = trpc.cpiReport.getAnalysis.useQuery(
    { reportId: report?.id ?? 0 },
    { enabled: !!report?.id }
  );

  // Generate analysis mutation
  const generateMutation = trpc.cpiReport.generateAnalysis.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
      setGenerating(false);
      toast.success("Your Career Positioning analysis is ready.");
    },
    onError: () => {
      setGenerating(false);
      toast.error("Analysis generation failed. Please try again.");
    },
  });

  const handleGenerate = () => {
    if (!report?.id) return;
    setGenerating(true);
    generateMutation.mutate({ reportId: report.id });
  };

  const toggleDim = (id: string) => {
    setExpandedDims((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (reportLoading || analysisLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: IVORY }}>
        <Loader2 className="animate-spin" size={28} style={{ color: INDIGO }} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: IVORY }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: NAVY }}>Report not found</h1>
        <p className="text-sm mb-6" style={{ color: "#333333" }}>This report may have been removed or the link is incorrect.</p>
        <Link href="/career"><Button style={{ background: NAVY, color: "white" }}>Go to Career Transition Intelligence</Button></Link>
      </div>
    );
  }

  const zoneColor = ZONE_COLORS[report.zone ?? ""] ?? INDIGO;
  const zoneLabel = (report.zone ?? "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const archetypeLabel = (report.archetype ?? "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const currentAnalysis: CpiAnalysis | null | undefined = analysis ?? cachedAnalysis;

  return (
    <div className="min-h-screen" style={{ background: IVORY }}>
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 border-b" style={{ background: NAVY, borderColor: NAVY }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/career")}
            className="flex items-center gap-2 text-sm font-medium opacity-80 hover:opacity-100 transition-opacity"
            style={{ color: "white" }}>
            <ArrowLeft size={16} /> Back to Career Transition Intelligence
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Career Positioning Intelligence
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ── Hero card ── */}
        <div className="rounded-2xl p-8 mb-8 text-white" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1e3a5f 100%)` }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
                Career Positioning Intelligence Report
              </p>
              <h1 className="text-2xl font-bold mb-1">{report.participantName}</h1>
              {report.participantRole && (
                <p className="text-sm opacity-75">{report.participantRole}{report.organisation ? ` · ${report.organisation}` : ""}</p>
              )}
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="text-5xl font-black" style={{ color: GOLD }}>{Math.round(report.edgeScore ?? 0)}</div>
              <div className="text-xs opacity-60 uppercase tracking-wide">Career Positioning Score</div>
              <div className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: zoneColor + "30", color: zoneColor, border: `1px solid ${zoneColor}50` }}>
                {zoneLabel}
              </div>
            </div>
          </div>
        </div>

        {/* ── Generate CTA (if no analysis yet) ── */}
        {!currentAnalysis && (
          <div className="rounded-2xl border-2 border-dashed p-8 mb-8 text-center"
            style={{ borderColor: INDIGO + "40", background: INDIGO + "05" }}>
            <Sparkles size={32} className="mx-auto mb-3" style={{ color: INDIGO }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: NAVY }}>Generate Your Full Analysis</h3>
            <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: "#333333" }}>
              Your Career Transition Coach will analyse your full dimension profile and generate personalised insights,
              blind spots, a 90-day action plan, and learning recommendations.
            </p>
            <Button onClick={handleGenerate} disabled={generating}
              style={{ background: INDIGO, color: "white" }}>
              {generating ? <><Loader2 size={16} className="animate-spin mr-2" />Generating your analysis…</> : <><Sparkles size={16} className="mr-2" />Generate My Analysis</>}
            </Button>
          </div>
        )}

        {/* ── Section 1: Executive Summary ── */}
        {currentAnalysis && (
          <Section title="Executive Summary" icon={<Target size={18} />} accent={NAVY}>
            <div className="rounded-xl p-6" style={{ background: "white", border: "1px solid #E5E7EB" }}>
              {currentAnalysis.executiveSummary.split("\n\n").map((para: string, i: number) => (
                <p key={i} className={`text-sm leading-relaxed ${i > 0 ? "mt-4" : ""}`} style={{ color: "#374151" }}>{para}</p>
              ))}
            </div>
          </Section>
        )}

        {/* ── Section 2: Score Interpretation ── */}
        {currentAnalysis && (
          <Section title="What Your Score Means" icon={<TrendingUp size={18} />} accent={INDIGO}>
            <div className="rounded-xl p-6" style={{ background: "white", border: "1px solid #E5E7EB" }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="text-4xl font-black" style={{ color: zoneColor }}>{Math.round(report.edgeScore ?? 0)}</div>
                <div>
                  <div className="font-bold text-sm" style={{ color: NAVY }}>{zoneLabel}</div>
                  <div className="text-xs" style={{ color: "#333333" }}>Career Positioning Score</div>
                </div>
                <div className="flex-1 h-3 rounded-full ml-4" style={{ background: "#F3F4F6" }}>
                  <div className="h-3 rounded-full" style={{ width: `${report.edgeScore ?? 0}%`, background: zoneColor }} />
                </div>
              </div>
              {currentAnalysis.scoreInterpretation.split("\n\n").map((para: string, i: number) => (
                <p key={i} className={`text-sm leading-relaxed ${i > 0 ? "mt-4" : ""}`} style={{ color: "#374151" }}>{para}</p>
              ))}
            </div>
          </Section>
        )}

        {/* ── Section 3: Dimension Analysis ── */}
        {currentAnalysis && currentAnalysis.dimensionAnalysis?.length > 0 && (
          <Section title="Dimension-by-Dimension Analysis" icon={<Brain size={18} />} accent={TEAL}>
            <p className="text-sm mb-4" style={{ color: "#333333" }}>
              Click any dimension to see the full insight, career implication, and a 14-day quick win.
            </p>
            {currentAnalysis.dimensionAnalysis.map((dim: CpiDimensionAnalysis) => (
              <DimensionBar
                key={dim.dimensionId}
                dim={dim}
                expanded={expandedDims.has(dim.dimensionId)}
                onToggle={() => toggleDim(dim.dimensionId)}
              />
            ))}
          </Section>
        )}

        {/* ── Section 4: Archetype ── */}
        {currentAnalysis && (
          <Section title="Your Career Positioning Archetype" icon={<Sparkles size={18} />} accent={GOLD}>
            <div className="rounded-xl p-6" style={{ background: `linear-gradient(135deg, ${NAVY}08 0%, ${GOLD}08 100%)`, border: `1px solid ${GOLD}30` }}>
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: GOLD + "20", border: `2px solid ${GOLD}` }}>
                  🎯
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>Your Archetype</p>
                  <h3 className="text-xl font-bold" style={{ color: NAVY }}>{archetypeLabel}</h3>
                </div>
              </div>
              {currentAnalysis.archetypeNarrative.split("\n\n").map((para: string, i: number) => (
                <p key={i} className={`text-sm leading-relaxed ${i > 0 ? "mt-4" : ""}`} style={{ color: "#374151" }}>{para}</p>
              ))}
              {currentAnalysis.archetypeGrowthPath && (
                <div className="mt-5 pt-5 border-t" style={{ borderColor: GOLD + "30" }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: GOLD }}>Your Growth Path</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{currentAnalysis.archetypeGrowthPath}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Section 5: Hidden Blind Spots ── */}
        {currentAnalysis && currentAnalysis.blindSpots?.length > 0 && (
          <Section title="Hidden Blind Spots" icon={<AlertTriangle size={18} />} accent="#EF4444">
            <p className="text-sm mb-4" style={{ color: "#333333" }}>
              These are patterns in your profile that are likely limiting your career opportunities without you being fully aware of them.
            </p>
            {currentAnalysis.blindSpots.map((bs: CpiBlindSpot, i: number) => (
              <div key={i} className="rounded-xl p-5 mb-4" style={{ background: "white", border: "1px solid #FEE2E2" }}>
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
                  <h4 className="font-bold text-sm" style={{ color: NAVY }}>{bs.title}</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#333333" }}>What it is</p>
                    <p className="text-sm" style={{ color: "#374151" }}>{bs.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#EF4444" }}>Career Risk</p>
                    <p className="text-sm" style={{ color: "#374151" }}>{bs.careerRisk}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: TEAL }}>Intervention</p>
                    <p className="text-sm font-medium" style={{ color: "#374151" }}>{bs.intervention}</p>
                  </div>
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* ── Section 6: 90-Day Action Plan ── */}
        {currentAnalysis && currentAnalysis.actionPlan?.length > 0 && (
          <Section title="90-Day Career Positioning Action Plan" icon={<Calendar size={18} />} accent={INDIGO}>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
              {currentAnalysis.actionPlan.map((item: CpiActionItem, i: number) => (
                <div key={i} className={`p-5 ${i > 0 ? "border-t" : ""}`}
                  style={{ background: i % 2 === 0 ? "white" : "#FAFAFA", borderColor: "#F3F4F6" }}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-20 text-center">
                      <div className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ background: INDIGO + "15", color: INDIGO }}>
                        {item.week}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: INDIGO }}>{item.focus}</p>
                      <p className="text-sm font-medium mb-2" style={{ color: NAVY }}>{item.action}</p>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: TEAL }} />
                        <p className="text-xs" style={{ color: "#333333" }}><span className="font-semibold">Success metric:</span> {item.successMetric}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Section 7: Learning Recommendations ── */}
        {currentAnalysis && currentAnalysis.learningRecommendations?.length > 0 && (
          <Section title="Personalised Learning Recommendations" icon={<BookOpen size={18} />} accent={TEAL}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentAnalysis.learningRecommendations.map((rec: CpiLearningRec, i: number) => {
                const catIcon = rec.category === "book" ? "📖" : rec.category === "podcast" ? "🎧" : rec.category === "exercise" ? "✍️" : "🔄";
                const catColor = rec.category === "book" ? INDIGO : rec.category === "podcast" ? TEAL : rec.category === "exercise" ? GOLD : "#8B5CF6";
                return (
                  <div key={i} className="rounded-xl p-5" style={{ background: "white", border: "1px solid #E5E7EB" }}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-xl">{catIcon}</span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-0.5"
                          style={{ color: catColor }}>
                          {rec.category}
                        </p>
                        <h4 className="font-bold text-sm leading-tight" style={{ color: NAVY }}>{rec.title}</h4>
                      </div>
                    </div>
                    <p className="text-sm mb-3" style={{ color: "#374151" }}>{rec.description}</p>
                    <div className="flex items-center gap-1.5">
                      <Circle size={8} style={{ color: catColor }} fill={catColor} />
                      <span className="text-xs" style={{ color: "#333333" }}>{rec.timeInvestment}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Section 8: AI Coach Configuration ── */}
        {currentAnalysis && (
          <Section title="Your Career Transition Coach is Configured" icon={<MessageSquare size={18} />} accent={INDIGO}>
            <div className="rounded-xl p-6" style={{ background: `linear-gradient(135deg, ${INDIGO}08 0%, ${TEAL}08 100%)`, border: `1px solid ${INDIGO}20` }}>
              {/* Focus areas */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: INDIGO }}>
                  Your Career Transition Coach will prioritise
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentAnalysis.coachFocusAreas?.map((area: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: INDIGO + "15", color: INDIGO }}>
                      {area}
                    </span>
                  ))}
                </div>
              </div>
              {/* Opening prompt */}
              <div className="rounded-xl p-4 mb-4" style={{ background: "white", border: `1px solid ${INDIGO}20` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: TEAL }}>
                  Career Transition Coach Opening Message
                </p>
                <p className="text-sm leading-relaxed italic" style={{ color: "#374151" }}>
                  "{currentAnalysis.coachOpeningPrompt}"
                </p>
              </div>
              {/* Challenge question */}
              <div className="rounded-xl p-4" style={{ background: GOLD + "10", border: `1px solid ${GOLD}30` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: GOLD }}>
                  <Lightbulb size={12} className="inline mr-1" />
                  Your Challenge Question
                </p>
                <p className="text-sm font-semibold leading-relaxed" style={{ color: NAVY }}>
                  {currentAnalysis.coachChallengeQuestion}
                </p>
              </div>
              {/* CTA to Guide */}
              <div className="mt-5 text-center">
                <Link href="/guide">
                  <Button style={{ background: INDIGO, color: "white" }}>
                    <MessageSquare size={16} className="mr-2" />
                    Start Conversation with Career Transition Coach
                  </Button>
                </Link>
              </div>
            </div>
          </Section>
        )}

        {/* ── Regenerate button ── */}
        {currentAnalysis && (
          <div className="text-center mt-4 mb-8">
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}
              style={{ borderColor: INDIGO + "40", color: INDIGO }}>
              {generating ? <><Loader2 size={14} className="animate-spin mr-2" />Regenerating…</> : <><Sparkles size={14} className="mr-2" />Regenerate Analysis</>}
            </Button>
          </div>
        )}

        {/* ── Sample Report Download ── */}
        <div className="rounded-2xl p-5 flex items-center gap-4 mb-4" style={{ background: "#F8F5F0", border: "1px solid #E5E7EB" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: GOLD + "18", border: `1px solid ${GOLD}44` }}>
            <BookOpen size={18} style={{ color: GOLD }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: NAVY }}>View Sample Report</p>
            <p className="text-xs mt-0.5" style={{ color: "#333333" }}>See how a completed Career Positioning Intelligence report looks with full coaching narrative.</p>
          </div>
          {SAMPLE_PDF_URLS["CPI"] && (
            <a href={SAMPLE_PDF_URLS["CPI"]} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="font-semibold flex-shrink-0" style={{ borderColor: "#E5E7EB", color: NAVY }}>
                <Download size={13} className="mr-1.5" /> Sample PDF
              </Button>
            </a>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="text-center py-6 border-t" style={{ borderColor: "#E5E7EB" }}>
          <p className="text-xs" style={{ color: "#555555" }}>
            Career Positioning Intelligence · LevelNext by Meta Results Pvt. Ltd., Bangalore, India
          </p>
          <p className="text-xs mt-1" style={{ color: "#555555" }}>
            © Meta Results Pvt. Ltd. · <a href="mailto:reports@metaresults.com" style={{ color: INDIGO }}>reports@metaresults.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
