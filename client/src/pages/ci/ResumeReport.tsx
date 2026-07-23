import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, CheckCircle, XCircle, Wand2, BarChart2, Lightbulb, TrendingUp } from "lucide-react";
import DiagnosticRadarChart from "@/components/DiagnosticRadarChart";

function AtsCheckRow({ label, check }: { label: string; check: { score: number; max: number; passed: boolean; note: string } }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#1e3a5f] last:border-0">
      <div className="mt-0.5 flex-shrink-0">
        {check.passed
          ? <CheckCircle className="w-4 h-4 text-emerald-400" />
          : <XCircle className="w-4 h-4 text-red-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-white capitalize">{label.replace(/_/g, " ")}</span>
          <span className={`text-xs font-semibold ${check.passed ? "text-emerald-400" : "text-red-400"}`}>
            {check.score}/{check.max}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{check.note}</p>
      </div>
    </div>
  );
}

function QualityDimensionCard({ dim }: { dim: { id: string; label: string; score: number; max: number; callouts: Array<{ quote: string; suggestion: string }> } }) {
  const pct = Math.round((dim.score / dim.max) * 100);
  const barColor = pct >= 75 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <Card className="bg-[#0A1A2F] border-[#1e3a5f]">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">{dim.label}</span>
          <span className={`text-sm font-bold ${pct >= 75 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {dim.score}/{dim.max}
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#1e3a5f] rounded-full mb-3">
          <div className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        {dim.callouts?.length > 0 && (
          <div className="space-y-2">
            {dim.callouts.map((c, i) => (
              <div key={i} className="bg-[#0F2440] rounded-lg p-3">
                <p className="text-xs text-slate-400 italic mb-1.5">"{c.quote}"</p>
                <div className="flex items-start gap-1.5">
                  <TrendingUp className="w-3 h-3 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#D4AF37]">{c.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResumeReport() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const resumeId = parseInt(params.id ?? "0");

  const { data: resume, isLoading } = trpc.resumeMakeover.getResumeById.useQuery({ id: resumeId });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A1A2F] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-[#D4AF37]" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-[#0A1A2F] flex items-center justify-center text-slate-400">
        Resume not found.
      </div>
    );
  }

  const atsBreakdown = resume.atsBreakdown as Record<string, { score: number; max: number; passed: boolean; note: string }> | null;
  const qb = resume.qualityBreakdown as {
    headline?: string;
    topStrengths?: string[];
    topImprovements?: string[];
    dimensions?: Array<{ id: string; label: string; score: number; max: number; callouts: Array<{ quote: string; suggestion: string }> }>;
  } | null;

  // Radar chart data from quality dimensions
  const radarDimensions = qb?.dimensions?.map((d) => ({
    dimension: d.label,
    score: Math.round((d.score / d.max) * 100),
  })) ?? [];

  const atsPassed = atsBreakdown ? Object.values(atsBreakdown).filter((c) => c.passed).length : 0;
  const atsTotal = atsBreakdown ? Object.keys(atsBreakdown).length : 0;

  return (
    <div className="min-h-screen bg-[#0A1A2F] text-white p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => navigate("/career/resume")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Resume Insights Report</h1>
            <p className="text-slate-400 text-xs">v{resume.version} · {resume.originalFileName}</p>
          </div>
        </div>
        <Button
          className="bg-[#D4AF37] hover:bg-[#b8962e] text-[#0A1A2F] font-semibold"
          onClick={() => navigate(`/career/resume/rewrite/${resume.id}`)}
        >
          <Wand2 className="w-4 h-4 mr-1.5" />
          {resume.rewrittenAt ? "View Rewrite" : "AI Rewrite"}
        </Button>
      </div>

      {/* Score summary row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#0F2440] border-[#1e3a5f] text-center">
          <CardContent className="pt-4 pb-4">
            <p className="text-3xl font-bold text-[#D4AF37]">{resume.atsScore ?? "—"}</p>
            <p className="text-xs text-slate-400 mt-1">ATS Score / 100</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0F2440] border-[#1e3a5f] text-center">
          <CardContent className="pt-4 pb-4">
            <p className="text-3xl font-bold text-[#D4AF37]">{resume.careerQualityScore ?? "—"}</p>
            <p className="text-xs text-slate-400 mt-1">Career Quality / 100</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0F2440] border-[#1e3a5f] text-center">
          <CardContent className="pt-4 pb-4">
            <p className="text-3xl font-bold text-emerald-400">{atsPassed}/{atsTotal}</p>
            <p className="text-xs text-slate-400 mt-1">ATS Checks Passed</p>
          </CardContent>
        </Card>
      </div>

      {/* Headline */}
      {qb?.headline && (
        <Card className="bg-[#0F2440] border-[#D4AF37]/30 mb-6">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-200 italic">{qb.headline}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* ATS Breakdown */}
        <Card className="bg-[#0F2440] border-[#1e3a5f]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#D4AF37]" />
              ATS Compatibility Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atsBreakdown ? (
              Object.entries(atsBreakdown).map(([key, check]) => (
                <AtsCheckRow key={key} label={key} check={check} />
              ))
            ) : (
              <p className="text-slate-400 text-sm">No ATS analysis available yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Strengths & Improvements */}
        <div className="space-y-4">
          {qb?.topStrengths && qb.topStrengths.length > 0 && (
            <Card className="bg-[#0F2440] border-[#1e3a5f]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Resume Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {qb.topStrengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {qb?.topImprovements && qb.topImprovements.length > 0 && (
            <Card className="bg-[#0F2440] border-[#1e3a5f]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  Key Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {qb.topImprovements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-amber-400 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Radar chart */}
      {radarDimensions.length > 0 && (
        <Card className="bg-[#0F2440] border-[#1e3a5f] mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Career Quality Radar</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div style={{ width: 320, height: 280 }}>
              <DiagnosticRadarChart dimensions={radarDimensions} height={280} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality dimension cards */}
      {qb?.dimensions && qb.dimensions.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#D4AF37]" />
            Career Quality — Dimension Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qb.dimensions.map((dim) => (
              <QualityDimensionCard key={dim.id} dim={dim} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
