import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Upload, FileText, ArrowLeft, CheckCircle, AlertCircle,
  ChevronRight, Loader2, Wand2, BarChart2, Star, Download, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { AIGeneratingScreen } from "@/components/launch/AIGeneratingScreen";
import LaunchPageWrapper from "@/components/LaunchPageWrapper";

function scoreColor(score: number | null | undefined): string {
  if (score == null) return "rgba(255,255,255,0.3)";
  if (score >= 75) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

function ScoreRing({ score, label, size = 80 }: { score: number | null | undefined; label: string; size?: number }) {
  const pct = score != null ? Math.round(score) : 0;
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ stroke: color, transition: "stroke-dashoffset 0.7s ease" }}
        />
        <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill="white" fontSize={size > 70 ? "16" : "12"} fontWeight="bold" fontFamily="Space Grotesk, sans-serif">
          {score != null ? score : "—"}
        </text>
      </svg>
      <span className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Manrope, sans-serif" }}>{label}</span>
    </div>
  );
}

type Phase = "upload" | "analysing" | "results" | "rewriting" | "rewrite_result";

export default function LaunchResumeMakeover() {
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeResumeId, setActiveResumeId] = useState<number | null>(null);
  const [rewriteHtml, setRewriteHtml] = useState<string | null>(null);

  const { data: resumes, refetch, isLoading: resumesLoading } = trpc.resumeMakeover.getMyResumes.useQuery();
  // getMyResumes returns limited fields; use getResumeById for full detail
  const activeResumeId2 = activeResumeId ?? resumes?.find((r) => r.isActive)?.id ?? resumes?.[0]?.id;
  const { data: activeResume } = trpc.resumeMakeover.getResumeById.useQuery(
    { id: activeResumeId2! },
    { enabled: !!activeResumeId2 && (phase === "results" || phase === "rewrite_result") }
  );

  const uploadMutation = trpc.resumeMakeover.uploadResume.useMutation();
  const analyseMutation = trpc.resumeMakeover.analyseResume.useMutation();
  const rewriteMutation = trpc.resumeMakeover.rewriteResume.useMutation();
  const resumeListItem = resumes?.find((r) => r.id === activeResumeId2);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(Array.from(new Uint8Array(buffer), (b) => String.fromCharCode(b)).join(""));
      const result = await uploadMutation.mutateAsync({
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        base64Data: base64,
      });
      setActiveResumeId(result.id);
      await refetch();
      // Auto-analyse
      setPhase("analysing");
      await analyseMutation.mutateAsync({ resumeId: result.id });
      await refetch();
      setPhase("results");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please ensure the file is a valid PDF or DOCX under 10MB.";
      setUploadError(msg);
      setPhase("upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRewrite = async () => {
    if (!activeResume) return;
    setPhase("rewriting");
    try {
      const result = await rewriteMutation.mutateAsync({ resumeId: activeResume.id });
      setRewriteHtml((result as any).rewrittenHtml ?? null);
      await refetch();
      setPhase("rewrite_result");
    } catch {
      toast.error("Rewrite failed. Please try again.");
      setPhase("results");
    }
  };

  // ── Analysing ─────────────────────────────────────────────────────────────────
  if (phase === "analysing") {
    return (
      <AIGeneratingScreen
        title="Analysing Your Resume"
        subtitle="Navi is reviewing your resume for ATS compatibility, impact, and career readiness..."
        accentColor="#3B82F6"
        icon={<BarChart2 size={32} style={{ color: "#3B82F6" }} />}
        steps={[
          { label: "Extracting resume content", duration: 1000 },
          { label: "Running ATS compatibility check", duration: 1800 },
          { label: "Scoring impact and clarity", duration: 1500 },
          { label: "Identifying improvement areas", duration: 1600 },
          { label: "Preparing your analysis", duration: 1200 },
        ]}
      />
    );
  }

  // ── Rewriting ─────────────────────────────────────────────────────────────────
  if (phase === "rewriting") {
    return (
      <AIGeneratingScreen
        title="Rewriting Your Resume"
        subtitle="Navi is crafting a stronger, ATS-optimised version of your resume..."
        accentColor="#8B5CF6"
        icon={<Wand2 size={32} style={{ color: "#8B5CF6" }} />}
        steps={[
          { label: "Analysing your experience and skills", duration: 1400 },
          { label: "Strengthening impact statements", duration: 1800 },
          { label: "Optimising for ATS keywords", duration: 1600 },
          { label: "Improving clarity and structure", duration: 1500 },
          { label: "Finalising your rewritten resume", duration: 1200 },
        ]}
      />
    );
  }

  // ── Upload View ───────────────────────────────────────────────────────────────
  if (phase === "upload") {
    return (
      <LaunchPageWrapper>
        <div className="max-w-lg mx-auto px-4 py-6">
          <button onClick={() => navigate("/launch/journey")} className="flex items-center gap-2 mb-6 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <ArrowLeft size={14} /> Back to Journey Map
          </button>

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(59,130,246,0.15)", border: "2px solid rgba(59,130,246,0.4)" }}>
              <FileText size={24} style={{ color: "#3B82F6" }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Resume Makeover
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Manrope, sans-serif" }}>
              Upload your resume and Navi will analyse it for ATS compatibility, impact, and career readiness — then rewrite it to stand out.
            </p>
          </div>

          {/* What you'll get */}
          <div className="space-y-2 mb-8">
            {[
              { icon: "📊", label: "ATS Compatibility Score", desc: "See how your resume performs against applicant tracking systems" },
              { icon: "⚡", label: "Impact & Clarity Score", desc: "Measure how compelling your achievements and language are" },
              { icon: "✨", label: "AI-Powered Rewrite", desc: "Get a fully rewritten version optimised for modern hiring" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-white">{item.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Previous resumes */}
          {!resumesLoading && resumes && resumes.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Previous Uploads</p>
              <div className="space-y-2">
                {resumes.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setActiveResumeId(r.id); setPhase("results"); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <FileText size={16} style={{ color: "#3B82F6", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{r.originalFileName ?? "Resume"}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {r.atsScore != null ? `ATS: ${r.atsScore}` : "Not analysed"}
                        {r.careerQualityScore != null ? ` · Quality: ${r.careerQualityScore}` : ""}
                      </p>
                    </div>
                    <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload area */}
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
          {uploadError && (
            <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <AlertCircle size={14} style={{ color: "#EF4444" }} />
              <p className="text-xs" style={{ color: "#EF4444" }}>{uploadError}</p>
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "#3B82F6", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "Uploading..." : "Upload Resume (PDF or DOCX)"}
          </button>
          <p className="text-center text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>Max 10MB · PDF or DOCX</p>
        </div>
      </LaunchPageWrapper>
    );
  }

  // ── Results View ──────────────────────────────────────────────────────────────
  if (phase === "results" && activeResume) {
    const qualityBreakdown = activeResume.qualityBreakdown as { topStrengths?: string[]; topImprovements?: string[] } | null;
    const strengths = qualityBreakdown?.topStrengths ?? [];
    const weaknesses: string[] = [];
    const improvements = qualityBreakdown?.topImprovements ?? [];

    return (
      <LaunchPageWrapper>
        <div className="max-w-lg mx-auto px-4 py-6">
          <button onClick={() => setPhase("upload")} className="flex items-center gap-2 mb-6 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <ArrowLeft size={14} /> Upload Different Resume
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,130,246,0.15)" }}>
              <FileText size={18} style={{ color: "#3B82F6" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{activeResume.originalFileName ?? "Resume"}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Analysis complete</p>
            </div>
          </div>

          {/* Score rings */}
          <div className="p-4 rounded-2xl mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Your Scores</p>
            <div className="flex justify-around">
              <ScoreRing score={activeResume.atsScore} label="ATS Score" />
              <ScoreRing score={activeResume.careerQualityScore} label="Quality Score" />
              <ScoreRing score={activeResume.rewrittenAtsScore ?? activeResume.atsScore} label={activeResume.rewrittenAt ? "Rewritten ATS" : "ATS Score"} />
            </div>
          </div>

          {/* Analysis sections */}
          {strengths.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#10B981" }}>✅ What's Working</p>
              <div className="space-y-1.5">
                {strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <CheckCircle size={12} style={{ color: "#10B981", flexShrink: 0, marginTop: 2 }} />
                    <p className="text-xs text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weaknesses.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#EF4444" }}>⚠️ Areas to Improve</p>
              <div className="space-y-1.5">
                {weaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <AlertCircle size={12} style={{ color: "#EF4444", flexShrink: 0, marginTop: 2 }} />
                    <p className="text-xs text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{w}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {improvements.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#F59E0B" }}>💡 Quick Wins</p>
              <div className="space-y-1.5">
                {improvements.map((imp, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <Star size={12} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                    <p className="text-xs text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{imp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewrite CTA */}
          <div className="space-y-3">
            {activeResume.rewrittenHtml ? (
              <button
                onClick={() => { setRewriteHtml(activeResume.rewrittenHtml ?? null); setPhase("rewrite_result"); }}
                className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
                style={{ background: "#8B5CF6", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
                <Wand2 size={16} /> View AI-Rewritten Resume
              </button>
            ) : activeResume.rewrittenAt ? null : (
              <button
                onClick={handleRewrite}
                className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
                style={{ background: "#8B5CF6", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
                <Wand2 size={16} /> AI Rewrite My Resume
              </button>
            )}
            <button onClick={() => navigate("/launch/journey")} className="w-full py-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Back to Journey Map
            </button>
          </div>
        </div>
      </LaunchPageWrapper>
    );
  }

  // ── Rewrite Result View ───────────────────────────────────────────────────────
  if (phase === "rewrite_result") {
    const html = rewriteHtml ?? activeResume?.rewrittenHtml;
    return (
      <LaunchPageWrapper>
        <div className="max-w-lg mx-auto px-4 py-6">
          <button onClick={() => setPhase("results")} className="flex items-center gap-2 mb-4 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <ArrowLeft size={14} /> Back to Analysis
          </button>

          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(139,92,246,0.15)", border: "2px solid rgba(139,92,246,0.4)" }}>
              <Wand2 size={20} style={{ color: "#8B5CF6" }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Your Rewritten Resume</h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>AI-optimised for ATS and impact</p>
          </div>

          {/* HTML preview */}
          {html ? (
            <div
              className="rounded-2xl p-4 mb-5 overflow-auto max-h-96 text-sm"
              style={{ background: "#fff", color: "#1e293b" }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div className="p-4 rounded-2xl mb-5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Rewritten content not available</p>
            </div>
          )}

          <div className="space-y-3">
            {activeResume?.rewrittenFileUrl && (
              <a
                href={activeResume.rewrittenFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: "#10B981", color: "#fff", fontFamily: "Space Grotesk, sans-serif", textDecoration: "none" }}>
                <Download size={16} /> Download Rewritten Resume (DOCX)
              </a>
            )}
            <button onClick={() => navigate("/launch/journey")} className="w-full py-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Back to Journey Map
            </button>
          </div>
        </div>
      </LaunchPageWrapper>
    );
  }

  // Fallback: show upload
  return null;
}
