import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Upload, FileText, BarChart2, Wand2, Clock, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";

function scoreColor(score: number | null | undefined, max = 100): string {
  if (score == null) return "text-gray-400";
  const pct = (score / max) * 100;
  if (pct >= 75) return "text-emerald-400";
  if (pct >= 50) return "text-amber-400";
  return "text-red-400";
}

function scoreRing(score: number | null | undefined, max = 100): string {
  if (score == null) return "stroke-gray-600";
  const pct = (score / max) * 100;
  if (pct >= 75) return "stroke-emerald-400";
  if (pct >= 50) return "stroke-amber-400";
  return "stroke-red-400";
}

function ScoreGauge({ score, max = 100, label }: { score: number | null | undefined; max?: number; label: string }) {
  const pct = score != null ? Math.round((score / max) * 100) : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none" strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 48 48)"
          className={`transition-all duration-700 ${scoreRing(score, max)}`}
        />
        <text x="48" y="53" textAnchor="middle" className="fill-white" fontSize="18" fontWeight="bold">
          {score != null ? score : "—"}
        </text>
      </svg>
      <span className="text-xs text-slate-400 text-center">{label}</span>
    </div>
  );
}

export default function ResumeMakeover() {
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [justUploadedId, setJustUploadedId] = useState<number | null>(null);

  const { data: resumes, refetch } = trpc.resumeMakeover.getMyResumes.useQuery();
  const activeResume = resumes?.find((r) => r.isActive);

  const uploadMutation = trpc.resumeMakeover.uploadResume.useMutation();
  const analyseMutation = trpc.resumeMakeover.analyseResume.useMutation();
  const setActiveMutation = trpc.resumeMakeover.setActiveResume.useMutation();

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
      setJustUploadedId(result.id);
      await refetch();
      // Auto-run analysis
      setAnalysing(true);
      await analyseMutation.mutateAsync({ resumeId: result.id });
      await refetch();
    } catch (err: any) {
      setUploadError(err?.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setAnalysing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetActive = async (id: number) => {
    await setActiveMutation.mutateAsync({ id });
    await refetch();
  };

  const isLoading = uploading || analysing;

  return (
    <div className="min-h-screen bg-[#0A1A2F] text-white p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Resume Makeover</h1>
            <p className="text-slate-400 text-sm">Upload your resume, get your ATS score, and let AI reshape it for maximum impact.</p>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <Card className="bg-[#0F2440] border-[#1e3a5f] mb-6">
        <CardContent className="pt-6">
          <div
            className="border-2 border-dashed border-[#1e3a5f] hover:border-[#D4AF37]/50 rounded-xl p-10 text-center cursor-pointer transition-colors"
            onClick={() => !isLoading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner className="w-8 h-8 text-[#D4AF37]" />
                <p className="text-slate-300 text-sm">
                  {uploading ? "Uploading and extracting text…" : "Running ATS and quality analysis…"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-[#D4AF37]/60" />
                <div>
                  <p className="text-white font-medium">Drop your resume here or click to browse</p>
                  <p className="text-slate-400 text-sm mt-1">PDF or DOCX · Max 10 MB</p>
                </div>
                <Button variant="outline" size="sm" className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10">
                  Choose File
                </Button>
              </div>
            )}
          </div>
          {uploadError && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {uploadError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active resume scores */}
      {activeResume && (
        <Card className="bg-[#0F2440] border-[#1e3a5f] mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Active Resume — v{activeResume.version}
                <span className="text-slate-400 text-xs font-normal">{activeResume.originalFileName}</span>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#1e3a5f] text-slate-300 hover:bg-[#1e3a5f]"
                  onClick={() => navigate(`/career/resume/report/${activeResume.id}`)}
                >
                  <BarChart2 className="w-3.5 h-3.5 mr-1" />
                  Full Report
                </Button>
                <Button
                  size="sm"
                  className="bg-[#D4AF37] hover:bg-[#b8962e] text-[#0A1A2F] font-semibold"
                  onClick={() => navigate(`/career/resume/rewrite/${activeResume.id}`)}
                >
                  <Wand2 className="w-3.5 h-3.5 mr-1" />
                  {activeResume.rewrittenAt ? "View Rewrite" : "AI Rewrite"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8 justify-center py-2">
              <ScoreGauge score={activeResume.atsScore} label="ATS Score" />
              <ScoreGauge score={activeResume.careerQualityScore} max={100} label="Career Quality" />
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeResume.atsScore != null ? "bg-emerald-400" : "bg-gray-600"}`} />
                  <span className="text-slate-300">ATS Analysis {activeResume.atsScore != null ? "complete" : "pending"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeResume.careerQualityScore != null ? "bg-emerald-400" : "bg-gray-600"}`} />
                  <span className="text-slate-300">Quality Analysis {activeResume.careerQualityScore != null ? "complete" : "pending"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeResume.rewrittenAt ? "bg-[#D4AF37]" : "bg-gray-600"}`} />
                  <span className="text-slate-300">AI Rewrite {activeResume.rewrittenAt ? "available" : "not yet run"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version history */}
      {resumes && resumes.length > 0 && (
        <Card className="bg-[#0F2440] border-[#1e3a5f]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Version History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#1e3a5f]">
              {resumes.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${r.isActive ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-[#1e3a5f] text-slate-400"}`}>
                      v{r.version}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{r.originalFileName ?? "Resume"}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                        {r.rewrittenAt ? " · Rewritten" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.atsScore != null && (
                      <span className={`text-sm font-semibold ${scoreColor(r.atsScore)}`}>
                        ATS {r.atsScore}
                      </span>
                    )}
                    {r.careerQualityScore != null && (
                      <span className={`text-sm font-semibold ${scoreColor(r.careerQualityScore)}`}>
                        Q {r.careerQualityScore}
                      </span>
                    )}
                    {!r.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#1e3a5f] text-slate-300 hover:bg-[#1e3a5f] text-xs"
                        onClick={() => handleSetActive(r.id)}
                        disabled={setActiveMutation.isPending}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-white"
                      onClick={() => navigate(`/career/resume/report/${r.id}`)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {(!resumes || resumes.length === 0) && !isLoading && (
        <div className="text-center py-16 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-slate-300">No resume uploaded yet</p>
          <p className="text-sm mt-1">Upload your resume above to get your ATS score and career quality analysis.</p>
        </div>
      )}
    </div>
  );
}
