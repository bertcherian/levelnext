/**
 * ResumeRewrite.tsx
 * Career Intelligence — Resume Rewrite page.
 * Features:
 *   1. Side-by-side comparison: original plain text (left) vs rewritten HTML (right)
 *   2. Skill Gap Analysis panel (requires JD)
 *   3. Cover Letter generator tab (requires JD)
 *   4. DOCX download
 */
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Sparkles, Download, Copy, Check, AlertCircle,
  FileText, Zap, Target, ChevronDown, ChevronUp, Loader2, Wand2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Keyword badge colours by category ───────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  technical:  "bg-blue-100 text-blue-800 border-blue-200",
  leadership: "bg-purple-100 text-purple-800 border-purple-200",
  domain:     "bg-amber-100 text-amber-800 border-amber-200",
  softSkills: "bg-green-100 text-green-800 border-green-200",
  other:      "bg-slate-100 text-slate-700 border-slate-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  technical:  "Technical Skills",
  leadership: "Leadership & Management",
  domain:     "Domain / Industry",
  softSkills: "Soft Skills",
  other:      "Other",
};

// ─── Skill Gap Panel ──────────────────────────────────────────────────────────
function SkillGapPanel({ resumeId, jd }: { resumeId: number; jd: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const analyseMutation = trpc.resumeMakeover.analyseSkillGap.useMutation();

  const handleAnalyse = () => {
    if (jd.trim().length < 50) {
      toast.error("Please paste a job description (min 50 characters) before running the gap analysis.");
      return;
    }
    analyseMutation.mutate({ resumeId, targetJobDescription: jd });
  };

  const data = analyseMutation.data;
  const toggleCategory = (cat: string) =>
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[#F2B705]" />
          <span className="font-semibold text-[#12345A]">Skill Gap Analysis</span>
          {jd.trim().length < 50 && (
            <span className="text-xs text-slate-400">(requires job description)</span>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleAnalyse}
          disabled={analyseMutation.isPending || jd.trim().length < 50}
          className="bg-[#12345A] hover:bg-[#1a4a7a] text-white text-xs h-8"
        >
          {analyseMutation.isPending ? (
            <><Loader2 className="h-3 w-3 animate-spin mr-1" />Analysing…</>
          ) : (
            <><Zap className="h-3 w-3 mr-1" />Run Analysis</>
          )}
        </Button>
      </div>

      {data ? (
        <div className="p-5 space-y-4">
          {/* Match score bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-700">Keyword Match</span>
              <span className="text-sm font-bold text-[#12345A]">
                {data.matchedTerms ?? 0} / {data.totalJdTerms ?? 0} terms ({data.overallMatch ?? 0}%)
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${data.overallMatch ?? 0}%`,
                  background: (data.overallMatch ?? 0) >= 70 ? "#22c55e"
                    : (data.overallMatch ?? 0) >= 45 ? "#F2B705" : "#ef4444",
                }}
              />
            </div>
            {data.summary && <p className="text-xs text-slate-500 mt-1.5">{data.summary}</p>}
          </div>

          {/* Top priority missing keywords */}
          {(data.topPriority as string[])?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
                Top Priority — Add These to Your Resume
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(data.topPriority as string[]).map((kw) => (
                  <span key={kw} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Missing keywords by category */}
          {data.missing && Object.keys(data.missing as object).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Missing Keywords by Category
              </p>
              <div className="space-y-2">
                {Object.entries(data.missing as Record<string, string[]>).map(([cat, keywords]) => {
                  if (!keywords?.length) return null;
                  const isOpen = expanded[cat] ?? true;
                  return (
                    <div key={cat} className="border border-slate-100 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCategory(cat)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-xs font-medium text-slate-700">
                          {CATEGORY_LABELS[cat] ?? cat} ({keywords.length})
                        </span>
                        {isOpen ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                      </button>
                      {isOpen && (
                        <div className="px-3 py-2.5 flex flex-wrap gap-1.5">
                          {keywords.map((kw) => (
                            <span key={kw} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other}`}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Present keywords */}
          {data.present && Object.values(data.present as Record<string, string[]>).some((v) => v?.length > 0) && (
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                Already in Your Resume ✓
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(data.present as Record<string, string[]>).flat().slice(0, 30).map((kw) => (
                  <span key={kw} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          {jd.trim().length >= 50
            ? "Click \"Run Analysis\" to compare your resume against the job description."
            : "Paste a job description above to enable skill gap analysis."}
        </div>
      )}
    </div>
  );
}

// ─── Cover Letter Panel ───────────────────────────────────────────────────────
function CoverLetterPanel({ resumeId, jd }: { resumeId: number; jd: string }) {
  const [companyName, setCompanyName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [copied, setCopied] = useState(false);
  const generateMutation = trpc.resumeMakeover.generateCoverLetter.useMutation();

  const handleGenerate = () => {
    if (jd.trim().length < 50) {
      toast.error("Please paste a job description before generating a cover letter.");
      return;
    }
    generateMutation.mutate({
      resumeId,
      targetJobDescription: jd,
      companyName: companyName || undefined,
      roleName: roleName || undefined,
    });
  };

  const handleCopy = async () => {
    if (!generateMutation.data?.html) return;
    const text = generateMutation.data.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Cover letter copied to clipboard.");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Company Name (optional)</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Broadridge"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#12345A]/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Role Name (optional)</label>
          <input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="e.g. VP of Engineering"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#12345A]/20"
          />
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generateMutation.isPending || jd.trim().length < 50}
        className="bg-[#12345A] hover:bg-[#1a4a7a] text-white w-full"
      >
        {generateMutation.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating Cover Letter…</>
        ) : (
          <><Sparkles className="h-4 w-4 mr-2" />Generate Cover Letter</>
        )}
      </Button>

      {jd.trim().length < 50 && (
        <p className="text-xs text-amber-600 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3" />
          Paste a job description above to enable cover letter generation.
        </p>
      )}

      {generateMutation.data?.html && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-sm font-semibold text-[#12345A]">Cover Letter Preview</span>
            <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs gap-1">
              {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy Text</>}
            </Button>
          </div>
          <div
            className="px-8 py-6 prose prose-sm max-w-none text-slate-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: generateMutation.data.html }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResumeRewrite() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const resumeId = parseInt(params.id ?? "0", 10);

  const [jd, setJd] = useState("");
  const [activeTab, setActiveTab] = useState<"rewrite" | "cover_letter">("rewrite");
  const [showComparison, setShowComparison] = useState(false);

  const { data: resume, isLoading, refetch } = trpc.resumeMakeover.getResumeById.useQuery(
    { id: resumeId },
    { enabled: resumeId > 0 }
  );

  const rewriteMutation = trpc.resumeMakeover.rewriteResume.useMutation({
    onSuccess: () => {
      refetch();
      setShowComparison(true);
      toast.success("Resume rewritten successfully.");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleRewrite = () => {
    rewriteMutation.mutate({
      resumeId,
      targetJobDescription: jd.trim() || undefined,
    });
  };

  const handleDownload = () => {
    const url = rewriteMutation.data?.docxUrl ?? resume?.rewrittenFileUrl;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `rewritten-resume-v${resume?.version ?? 1}.docx`;
    a.click();
    toast.success("Downloading DOCX…");
  };

  const rewrittenHtml = rewriteMutation.data?.html ?? resume?.rewrittenHtml ?? null;
  const hasRewrite = !!rewrittenHtml;
  const hasDownload = !!(rewriteMutation.data?.docxUrl ?? resume?.rewrittenFileUrl);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#12345A]" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Resume not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/career/resume")}>
          Back to Resume Makeover
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/career/resume")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#12345A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <Separator orientation="vertical" className="h-4" />
        <div>
          <h1 className="text-xl font-bold text-[#12345A]">Resume Rewrite</h1>
          <p className="text-sm text-slate-500">
            {resume.originalFileName} · Version {resume.version}
            {resume.atsScore != null && (
              <span className="ml-2 text-xs">
                ATS: <span className="font-semibold text-[#12345A]">{resume.atsScore}</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* JD Input */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-[#F2B705]" />
          <span className="font-semibold text-[#12345A] text-sm">Job Description</span>
          <Badge variant="outline" className="text-xs font-normal">
            Optional — enables job-specific rewrite, skill gap analysis, and cover letter
          </Badge>
        </div>
        <Textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the job description here to get a targeted rewrite, skill gap analysis, and cover letter…"
          className="min-h-[120px] text-sm resize-none focus-visible:ring-[#12345A]/30"
        />
      </div>

      {/* Tabs: Rewrite | Cover Letter */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "rewrite" | "cover_letter")}>
        <TabsList className="bg-slate-100 p-1 rounded-lg h-auto">
          <TabsTrigger
            value="rewrite"
            className="text-sm data-[state=active]:bg-white data-[state=active]:text-[#12345A] data-[state=active]:shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            AI Rewrite
          </TabsTrigger>
          <TabsTrigger
            value="cover_letter"
            className="text-sm data-[state=active]:bg-white data-[state=active]:text-[#12345A] data-[state=active]:shadow-sm"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Cover Letter
          </TabsTrigger>
        </TabsList>

        {/* ── Rewrite Tab ── */}
        <TabsContent value="rewrite" className="mt-4 space-y-4">
          {/* Action bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleRewrite}
              disabled={rewriteMutation.isPending}
              className="bg-[#F2B705] hover:bg-[#d9a504] text-[#12345A] font-semibold"
            >
              {rewriteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Rewriting…</>
              ) : (
                <><Wand2 className="h-4 w-4 mr-2" />{hasRewrite ? "Re-generate Rewrite" : "Generate Rewrite"}</>
              )}
            </Button>

            {hasDownload && (
              <Button
                variant="outline"
                onClick={handleDownload}
                className="border-[#12345A] text-[#12345A] hover:bg-[#12345A]/5"
              >
                <Download className="h-4 w-4 mr-2" />
                Download DOCX
              </Button>
            )}

            {hasRewrite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComparison((p) => !p)}
                className="text-slate-500 hover:text-[#12345A] text-sm"
              >
                {showComparison ? "Hide Comparison" : "Show Side-by-Side Comparison"}
              </Button>
            )}

            {jd.trim().length >= 50 && (
              <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                Job-specific rewrite enabled
              </span>
            )}
          </div>

          {/* Side-by-side comparison */}
          {hasRewrite && showComparison && (
            <div className="grid grid-cols-2 gap-4">
              {/* Original */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Original Resume</span>
                  <Badge variant="outline" className="text-xs font-normal">Plain text</Badge>
                </div>
                <div className="p-5 overflow-y-auto max-h-[600px]">
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                    {resume.extractedText ?? "No extracted text available."}
                  </pre>
                </div>
              </div>

              {/* Rewritten */}
              <div className="rounded-xl border border-[#F2B705]/40 bg-white overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-[#F2B705]/30 bg-[#F2B705]/5 flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#12345A] uppercase tracking-wide">Rewritten Resume</span>
                  <Badge className="text-xs font-normal bg-[#F2B705]/20 text-[#12345A] border-[#F2B705]/40">AI-optimised</Badge>
                </div>
                <div
                  className="p-5 overflow-y-auto max-h-[600px] prose prose-sm max-w-none text-slate-800"
                  dangerouslySetInnerHTML={{ __html: rewrittenHtml! }}
                />
              </div>
            </div>
          )}

          {/* Full-width rewrite preview (when comparison is hidden) */}
          {hasRewrite && !showComparison && (
            <div className="rounded-xl border border-[#F2B705]/40 bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F2B705]/30 bg-[#F2B705]/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#12345A]">Rewritten Resume Preview</span>
                  <Badge className="text-xs font-normal bg-[#F2B705]/20 text-[#12345A] border-[#F2B705]/40">AI-optimised</Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowComparison(true)}
                  className="text-xs text-slate-500 hover:text-[#12345A]"
                >
                  Compare with original
                </Button>
              </div>
              <div
                className="px-10 py-8 prose prose-sm max-w-none text-slate-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: rewrittenHtml! }}
              />
            </div>
          )}

          {/* Empty state */}
          {!hasRewrite && !rewriteMutation.isPending && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
              <Wand2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No rewrite generated yet</p>
              <p className="text-sm text-slate-400 mt-1">
                {jd.trim().length >= 50
                  ? "Click \"Generate Rewrite\" for a job-specific, ATS-optimised version."
                  : "Click \"Generate Rewrite\" for a generic ATS-optimised version, or paste a JD for a targeted rewrite."}
              </p>
            </div>
          )}

          {/* Skill Gap Analysis */}
          <SkillGapPanel resumeId={resumeId} jd={jd} />
        </TabsContent>

        {/* ── Cover Letter Tab ── */}
        <TabsContent value="cover_letter" className="mt-4">
          <CoverLetterPanel resumeId={resumeId} jd={jd} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
