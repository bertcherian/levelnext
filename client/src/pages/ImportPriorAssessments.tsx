import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PlatformLayout from "@/components/PlatformLayout";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Shield,
  Brain,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { PriorAssessmentData, PriorAssessmentTheme } from "../../../drizzle/schema";

// ─── Assessment types ─────────────────────────────────────────────────────────
const ASSESSMENT_TYPES = [
  { value: "MBTI", label: "MBTI", description: "Myers-Briggs Type Indicator" },
  { value: "DISC", label: "DISC", description: "DISC Personality Assessment" },
  { value: "HOGAN", label: "Hogan", description: "Hogan Personality Inventory" },
  { value: "GALLUP", label: "Gallup", description: "CliftonStrengths / StrengthsFinder" },
  { value: "360", label: "360°", description: "360-Degree Feedback Report" },
  { value: "ENNEAGRAM", label: "Enneagram", description: "Enneagram Assessment" },
  { value: "BIG5", label: "Big Five", description: "Big Five Personality Assessment" },
  { value: "BELBIN", label: "Belbin", description: "Belbin Team Roles" },
  { value: "EQ", label: "EQ", description: "Emotional Intelligence Assessment" },
  { value: "OTHER", label: "Other", description: "Any other assessment or report" },
] as const;

type AssessmentTypeValue = (typeof ASSESSMENT_TYPES)[number]["value"];
type Step = "select" | "upload" | "processing" | "review" | "success";

const CATEGORY_COLORS: Record<string, string> = {
  strength: "text-emerald-700 bg-emerald-50 border-emerald-200",
  challenge: "text-red-700 bg-red-50 border-red-200",
  pattern: "text-blue-700 bg-blue-50 border-blue-200",
  blind_spot: "text-amber-700 bg-amber-50 border-amber-200",
  growth_area: "text-purple-700 bg-purple-50 border-purple-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  strength: "Strength",
  challenge: "Challenge",
  pattern: "Pattern",
  blind_spot: "Blind Spot",
  growth_area: "Growth Area",
};

export default function ImportPriorAssessments() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("select");
  const [selectedType, setSelectedType] = useState<AssessmentTypeValue | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extracted, setExtracted] = useState<PriorAssessmentData | null>(null);
  const [approvedThemeIds, setApprovedThemeIds] = useState<Set<string>>(new Set());
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.priorAssessmentImport.uploadAssessmentPdf.useMutation({
    onSuccess: (data) => {
      setExtracted(data);
      // Pre-approve all high/medium relevance themes
      const preApproved = new Set(
        (data.themes ?? [])
          .filter((t) => t.relevance !== "low")
          .map((t) => t.id)
      );
      setApprovedThemeIds(preApproved);
      setStep("review");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to extract data from PDF");
      setStep("upload");
    },
  });

  const confirmMutation = trpc.priorAssessmentImport.confirmAssessmentImport.useMutation({
    onSuccess: () => setStep("success"),
    onError: (err) => toast.error(err.message || "Failed to save your assessment"),
  });

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File is too large. Please upload a PDF under 20MB.");
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !selectedType) return;
    setStep("processing");
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadMutation.mutate({
        fileBase64: base64,
        fileName: selectedFile.name,
        assessmentType: selectedType,
      });
    };
    reader.readAsDataURL(selectedFile);
  }, [selectedFile, selectedType, uploadMutation]);

  const toggleTheme = (id: string) => {
    setApprovedThemeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (!extracted || !selectedType) return;
    confirmMutation.mutate({
      assessmentType: selectedType,
      assessmentLabel: extracted.assessmentLabel,
      data: extracted,
      approvedThemes: Array.from(approvedThemeIds),
    });
  };

  // ── Step: Select assessment type ──────────────────────────────────────────
  if (step === "select") {
    return (
      <PlatformLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <button
            onClick={() => navigate("/diagnostics")}
            className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
            style={{ color: "var(--color-ln-muted)" }}
          >
            <ArrowLeft size={15} /> Back to Diagnostics
          </button>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Brain size={20} style={{ color: "var(--color-ln-gold)" }} />
              <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                Upload Prior Assessment
              </h1>
            </div>
            <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
              Upload a previous assessment report (MBTI, DISC, Hogan, Gallup, 360°, etc.) and Guide will extract the leadership-relevant insights to enrich your coaching context.
            </p>
          </div>

          {/* Privacy note */}
          <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ background: "oklch(from var(--color-ln-navy) 97% 0.01 248.6)", border: "1px solid oklch(from var(--color-ln-navy) l c h / 0.12)" }}>
            <Shield size={15} style={{ color: "var(--color-ln-navy)", marginTop: 2 }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-ln-navy)" }}>
              <strong>Your PDF is never stored.</strong> It is processed in memory, key insights are extracted, then immediately discarded. Only the synthesised themes you approve are saved to your profile.
            </p>
          </div>

          <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-ln-navy)" }}>What type of assessment are you uploading?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {ASSESSMENT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className="text-left p-3.5 rounded-xl border transition-all"
                style={{
                  borderColor: selectedType === type.value ? "var(--color-ln-navy)" : "var(--color-ln-border)",
                  background: selectedType === type.value ? "oklch(from var(--color-ln-navy) l c h / 0.06)" : "white",
                }}
              >
                <p className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>{type.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>{type.description}</p>
              </button>
            ))}
          </div>

          <Button
            className="w-full h-11 font-semibold"
            style={{ background: "var(--color-ln-navy)", color: "white" }}
            disabled={!selectedType}
            onClick={() => setStep("upload")}
          >
            Continue <ArrowRight size={15} className="ml-1.5" />
          </Button>
        </div>
      </PlatformLayout>
    );
  }

  // ── Step: Upload PDF ──────────────────────────────────────────────────────
  if (step === "upload") {
    const selectedTypeInfo = ASSESSMENT_TYPES.find((t) => t.value === selectedType);
    return (
      <PlatformLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <button
            onClick={() => setStep("select")}
            className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
            style={{ color: "var(--color-ln-muted)" }}
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Upload size={20} style={{ color: "var(--color-ln-gold)" }} />
              <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                Upload {selectedTypeInfo?.label} Report
              </h1>
            </div>
            <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
              Upload your {selectedTypeInfo?.description} PDF. Text-based PDFs work best.
            </p>
          </div>

          {/* Drop zone */}
          <div
            className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all mb-4"
            style={{
              borderColor: dragOver ? "var(--color-ln-navy)" : "var(--color-ln-border)",
              background: dragOver ? "oklch(from var(--color-ln-navy) l c h / 0.04)" : "var(--color-ln-ivory-dark)",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText size={24} style={{ color: "var(--color-ln-navy)" }} />
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{selectedFile.name}</p>
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{(selectedFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  className="ml-2 p-1 rounded hover:bg-gray-200 transition-colors"
                >
                  <X size={14} style={{ color: "var(--color-ln-muted)" }} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={28} className="mx-auto mb-3" style={{ color: "var(--color-ln-muted)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>Drop your PDF here or click to browse</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-ln-muted)" }}>PDF up to 20MB · Text-based reports only</p>
              </>
            )}
          </div>

          <Button
            className="w-full h-11 font-semibold"
            style={{ background: "var(--color-ln-navy)", color: "white" }}
            disabled={!selectedFile}
            onClick={handleUpload}
          >
            Extract Insights <Sparkles size={14} className="ml-1.5" />
          </Button>
        </div>
      </PlatformLayout>
    );
  }

  // ── Step: Processing ──────────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <PlatformLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-ln-navy)" }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>Extracting Leadership Insights</h2>
          <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
            Guide is reading your assessment and identifying the patterns most relevant to your leadership development. This takes about 15–30 seconds.
          </p>
          <p className="text-xs mt-4" style={{ color: "var(--color-ln-muted)" }}>Your PDF will be discarded immediately after processing.</p>
        </div>
      </PlatformLayout>
    );
  }

  // ── Step: Review ──────────────────────────────────────────────────────────
  if (step === "review" && extracted) {
    const themes = extracted.themes ?? [];
    return (
      <PlatformLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <button
            onClick={() => setStep("upload")}
            className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
            style={{ color: "var(--color-ln-muted)" }}
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={20} style={{ color: "var(--color-ln-gold)" }} />
              <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                Review Extracted Insights
              </h1>
            </div>
            <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
              Guide found the following insights in your {extracted.assessmentLabel}. Deselect any you don't want saved to your profile.
            </p>
          </div>

          {/* Summary card */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "oklch(from var(--color-ln-navy) 97% 0.01 248.6)", border: "1px solid oklch(from var(--color-ln-navy) l c h / 0.12)" }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-ln-muted)" }}>{extracted.assessmentLabel}</p>
                <p className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>{extracted.keyResult}</p>
                {extracted.participantName && extracted.participantName !== "Not specified" && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>{extracted.participantName} · {extracted.reportDate}</p>
                )}
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-ln-navy)" }}>{extracted.overallSummary}</p>
            {extracted.coachingContext && (
              <p className="text-xs mt-2 italic" style={{ color: "var(--color-ln-muted)" }}>{extracted.coachingContext}</p>
            )}
          </div>

          {/* Themes */}
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-ln-navy)" }}>
            Themes to save ({approvedThemeIds.size} of {themes.length} selected)
          </p>
          <div className="space-y-2 mb-6">
            {themes.map((theme: PriorAssessmentTheme) => {
              const approved = approvedThemeIds.has(theme.id);
              const expanded = expandedTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  className="rounded-xl border transition-all"
                  style={{
                    borderColor: approved ? "var(--color-ln-navy)" : "var(--color-ln-border)",
                    background: approved ? "oklch(from var(--color-ln-navy) l c h / 0.04)" : "white",
                  }}
                >
                  <div className="flex items-center gap-3 p-3.5">
                    <button
                      onClick={() => toggleTheme(theme.id)}
                      className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: approved ? "var(--color-ln-navy)" : "var(--color-ln-border)",
                        background: approved ? "var(--color-ln-navy)" : "white",
                      }}
                    >
                      {approved && <CheckCircle size={12} color="white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{theme.title}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[theme.category] ?? "text-gray-600 bg-gray-50 border-gray-200"}`}>
                          {CATEGORY_LABELS[theme.category] ?? theme.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedTheme(expanded ? null : theme.id)}
                      className="flex-shrink-0 p-1 rounded transition-colors hover:bg-gray-100"
                    >
                      {expanded ? <ChevronUp size={14} style={{ color: "var(--color-ln-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--color-ln-muted)" }} />}
                    </button>
                  </div>
                  {expanded && (
                    <div className="px-4 pb-3.5 pt-0">
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-ln-muted)" }}>{theme.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {approvedThemeIds.size === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: "oklch(from #f97316 98% 0.02 50)", border: "1px solid oklch(from #f97316 l c h / 0.3)" }}>
              <AlertCircle size={14} style={{ color: "#f97316" }} />
              <p className="text-xs" style={{ color: "#c2410c" }}>Select at least one theme to save.</p>
            </div>
          )}

          <Button
            className="w-full h-11 font-semibold"
            style={{ background: "var(--color-ln-navy)", color: "white" }}
            disabled={approvedThemeIds.size === 0 || confirmMutation.isPending}
            onClick={handleConfirm}
          >
            {confirmMutation.isPending ? (
              <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Saving…</span>
            ) : (
              <span className="flex items-center gap-2"><CheckCircle size={15} /> Save {approvedThemeIds.size} Insight{approvedThemeIds.size !== 1 ? "s" : ""} to My Profile</span>
            )}
          </Button>
        </div>
      </PlatformLayout>
    );
  }

  // ── Step: Success ─────────────────────────────────────────────────────────
  return (
    <PlatformLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.15)", border: "2px solid var(--color-ln-gold)" }}>
          <CheckCircle size={28} style={{ color: "var(--color-ln-gold)" }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>
          Assessment Insights Saved
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--color-ln-muted)" }}>
          {approvedThemeIds.size} insight{approvedThemeIds.size !== 1 ? "s" : ""} from your {extracted?.assessmentLabel ?? "assessment"} have been added to your leadership profile. Guide will now use this context in your coaching conversations.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="font-semibold"
            style={{ background: "var(--color-ln-navy)", color: "white" }}
            onClick={() => navigate("/guide")}
          >
            <Sparkles size={15} className="mr-1.5" /> Open Guide
          </Button>
          <Button
            variant="outline"
            className="font-semibold"
            style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}
            onClick={() => { setStep("select"); setSelectedType(null); setSelectedFile(null); setExtracted(null); setApprovedThemeIds(new Set()); }}
          >
            Upload Another Assessment
          </Button>
        </div>
      </div>
    </PlatformLayout>
  );
}
