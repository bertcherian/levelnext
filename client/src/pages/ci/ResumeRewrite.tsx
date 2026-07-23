import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Wand2, Download, FileText, Sparkles, AlertCircle } from "lucide-react";

export default function ResumeRewrite() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const resumeId = parseInt(params.id ?? "0");

  const [targetJd, setTargetJd] = useState("");
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  const { data: resume, isLoading, refetch } = trpc.resumeMakeover.getResumeById.useQuery({ id: resumeId });
  const rewriteMutation = trpc.resumeMakeover.rewriteResume.useMutation();

  const handleRewrite = async () => {
    setRewriteError(null);
    try {
      await rewriteMutation.mutateAsync({
        resumeId,
        targetJobDescription: targetJd.trim() || undefined,
      });
      await refetch();
    } catch (err: any) {
      setRewriteError(err?.message ?? "Rewrite failed. Please try again.");
    }
  };

  const handleDownload = () => {
    if (!resume?.rewrittenFileUrl) return;
    const a = document.createElement("a");
    a.href = resume.rewrittenFileUrl;
    a.download = `rewritten-resume-v${resume.version}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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

  const hasRewrite = !!resume.rewrittenHtml;

  return (
    <div className="min-h-screen bg-[#0A1A2F] text-white p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={() => navigate(`/career/resume/report/${resume.id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Report
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">AI Resume Rewrite</h1>
            <p className="text-slate-400 text-xs">v{resume.version} · {resume.originalFileName}</p>
          </div>
        </div>
        {hasRewrite && (
          <Button
            className="bg-[#D4AF37] hover:bg-[#b8962e] text-[#0A1A2F] font-semibold"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download DOCX
          </Button>
        )}
      </div>

      {/* JD input */}
      <Card className="bg-[#0F2440] border-[#1e3a5f] mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            Target Job Description
            <span className="text-xs text-slate-400 font-normal">(optional — makes the rewrite job-specific)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={targetJd}
            onChange={(e) => setTargetJd(e.target.value)}
            placeholder="Paste the job description here to optimise keyword density and tailor the rewrite to this specific role…"
            rows={5}
            className="bg-[#0A1A2F] border-[#1e3a5f] text-slate-200 placeholder:text-slate-500 resize-none focus:border-[#D4AF37]/50"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-400">
              {hasRewrite
                ? "A rewrite already exists. Running again will overwrite it."
                : "The AI will fix all ATS issues and improve all quality dimensions."}
            </p>
            <Button
              className="bg-[#D4AF37] hover:bg-[#b8962e] text-[#0A1A2F] font-semibold"
              onClick={handleRewrite}
              disabled={rewriteMutation.isPending}
            >
              {rewriteMutation.isPending ? (
                <>
                  <Spinner className="w-4 h-4 mr-1.5" />
                  Rewriting…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-1.5" />
                  {hasRewrite ? "Re-run Rewrite" : "Generate Rewrite"}
                </>
              )}
            </Button>
          </div>
          {rewriteError && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {rewriteError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rewrite preview */}
      {hasRewrite ? (
        <Card className="bg-[#0F2440] border-[#1e3a5f]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                Rewritten Resume Preview
              </CardTitle>
              <Button
                size="sm"
                className="bg-[#D4AF37] hover:bg-[#b8962e] text-[#0A1A2F] font-semibold"
                onClick={handleDownload}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download DOCX
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-invert max-w-none bg-white text-gray-900 rounded-lg p-8 text-sm leading-relaxed"
              style={{ fontFamily: "Georgia, serif" }}
              dangerouslySetInnerHTML={{ __html: resume.rewrittenHtml ?? "" }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-slate-300">No rewrite yet</p>
          <p className="text-sm mt-1">
            Optionally paste a target job description above, then click "Generate Rewrite" to let the AI reshape your resume.
          </p>
        </div>
      )}
    </div>
  );
}
