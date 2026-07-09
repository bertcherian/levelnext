import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  User,
  Building2,
  Star,
  BarChart3,
  Info,
} from "lucide-react";

// ─── Pillar / Dimension labels for review screen ──────────────────────────────
const PILLAR_LABELS: Record<string, string> = {
  strategic_communication: "Strategic Communication",
  executive_presence: "Executive Presence",
  influence_stakeholder: "Influence & Stakeholder Alignment",
  narrative_visibility: "Executive Narrative & Visibility",
  conversational_leadership: "Conversational Leadership",
};

const DIMENSION_LABELS: Record<string, string> = {
  strategic_clarity: "Strategic Clarity & Brevity",
  executive_framing: "Executive Framing & Prioritisation",
  gravitas_composure: "Gravitas & Composure",
  confidence_authority: "Confidence & Authority",
  stakeholder_influence: "Stakeholder Influence & Persuasion",
  political_intelligence: "Political Intelligence & Navigation",
  storytelling_vision: "Storytelling & Vision Communication",
  executive_visibility: "Executive Visibility & Thought Leadership",
  accountability_conversations: "Accountability & Delegation Conversations",
  trust_alignment: "Trust Creation & Alignment Conversations",
};

type ExtractedData = {
  participantName: string;
  participantRole: string;
  organisation: string;
  reportDate: string;
  edgeScore: number;
  archetype: string;
  archetypeLabel: string;
  zone: string;
  pillarScores: Record<string, number>;
  dimensionScores: Record<string, number>;
  confidence: number;
  sourceFileKey: string;
  sourceFileUrl: string;
};

type Step = "upload" | "processing" | "review" | "success";

export default function ImportEci() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [editedData, setEditedData] = useState<Partial<ExtractedData>>({});
  const [participantEmail, setParticipantEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.eciImport.uploadEciPdf.useMutation({
    onSuccess: (data) => {
      setExtracted(data);
      setEditedData({
        participantName: data.participantName,
        participantRole: data.participantRole,
        organisation: data.organisation,
        reportDate: data.reportDate,
      });
      setStep("review");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to extract data from PDF");
      setStep("upload");
    },
  });

  const confirmMutation = trpc.eciImport.confirmEciImport.useMutation({
    onSuccess: () => {
      setStep("success");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save your ECI report");
    },
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;
    setStep("processing");

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({ fileBase64: base64, fileName: selectedFile.name });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleConfirm = () => {
    if (!extracted) return;
    if (!participantEmail) {
      toast.error("Please enter your email address");
      return;
    }
    confirmMutation.mutate({
      participantName: editedData.participantName || extracted.participantName,
      participantEmail,
      participantRole: editedData.participantRole || extracted.participantRole,
      organisation: editedData.organisation || extracted.organisation,
      reportDate: editedData.reportDate || extracted.reportDate,
      edgeScore: extracted.edgeScore,
      archetype: extracted.archetype,
      archetypeLabel: extracted.archetypeLabel,
      zone: extracted.zone,
      pillarScores: extracted.pillarScores,
      dimensionScores: extracted.dimensionScores,
      confidence: extracted.confidence,
      sourceFileKey: extracted.sourceFileKey,
      sourceFileUrl: extracted.sourceFileUrl,
    });
  };

  const confidenceColor = (c: number) => {
    if (c >= 0.8) return "text-emerald-400";
    if (c >= 0.5) return "text-yellow-400";
    return "text-red-400";
  };

  const confidenceLabel = (c: number) => {
    if (c >= 0.8) return "High confidence";
    if (c >= 0.5) return "Moderate confidence";
    return "Low confidence — please review carefully";
  };

  return (
    <div className="min-h-screen bg-[#0A1A2F] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/diagnostics")}
          className="text-white/50 hover:text-white transition-colors flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Diagnostics
        </button>
        <div className="h-4 w-px bg-white/20" />
        <div>
          <h1 className="text-lg font-semibold text-white">Import ECI Report</h1>
          <p className="text-xs text-white/50">Bring your existing diagnostic into LevelNext</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="px-6 py-4 flex items-center gap-3">
        {(["upload", "review", "success"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? "bg-[#F2B705] text-[#0A1A2F]"
                  : step === "processing" && s === "upload"
                  ? "bg-[#F2B705] text-[#0A1A2F]"
                  : step === "review" && i < 1
                  ? "bg-emerald-500 text-white"
                  : step === "success"
                  ? "bg-emerald-500 text-white"
                  : "bg-white/10 text-white/40"
              }`}
            >
              {(step === "review" && i < 1) || step === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-sm ${
                step === s ? "text-white font-medium" : "text-white/40"
              }`}
            >
              {s === "upload" ? "Upload PDF" : s === "review" ? "Review & Confirm" : "Done"}
            </span>
            {i < 2 && <div className="w-8 h-px bg-white/20" />}
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* ── Step: Upload ── */}
        {(step === "upload") && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Upload Your ECI Report</h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Upload the PDF report you received from your standalone Executive Communication
                Intelligence diagnostic. We'll extract your scores automatically so you don't
                need to retake the assessment.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all ${
                dragOver
                  ? "border-[#F2B705] bg-[#F2B705]/5"
                  : selectedFile
                  ? "border-emerald-500 bg-emerald-500/5"
                  : "border-white/20 hover:border-white/40 hover:bg-white/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              {selectedFile ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-white/50 text-sm mt-1">
                      {(selectedFile.size / 1024).toFixed(0)} KB — click to change
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-white/50" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">Drop your ECI PDF here</p>
                    <p className="text-white/50 text-sm mt-1">or click to browse — PDF only, max 20MB</p>
                  </div>
                </>
              )}
            </div>

            {/* Info note */}
            <div className="flex gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
              <Info className="w-4 h-4 text-[#F2B705] mt-0.5 shrink-0" />
              <p className="text-white/60 text-sm leading-relaxed">
                Your PDF is processed securely on our servers. The original file is stored
                privately and linked to your account for audit purposes. Only text-based PDFs
                are supported — scanned image PDFs cannot be processed.
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="w-full bg-[#F2B705] hover:bg-[#F2B705]/90 text-[#0A1A2F] font-semibold h-12"
            >
              Extract My Scores
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Step: Processing ── */}
        {step === "processing" && (
          <div className="flex flex-col items-center gap-6 py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-[#F2B705]/10 border border-[#F2B705]/30 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-[#F2B705] animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Reading Your Report</h2>
              <p className="text-white/60 text-sm max-w-sm">
                Extracting your scores, archetype, and pillar breakdown from the PDF.
                This usually takes 10–20 seconds.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-white/40 mt-4">
              <p>✓ Uploading PDF</p>
              <p className="text-[#F2B705]">⟳ Extracting scores…</p>
              <p>○ Preparing review</p>
            </div>
          </div>
        )}

        {/* ── Step: Review ── */}
        {step === "review" && extracted && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Review Extracted Data</h2>
              <p className="text-white/60 text-sm leading-relaxed">
                We've extracted the following from your ECI report. Please review and correct
                any errors before confirming.
              </p>
            </div>

            {/* Confidence badge */}
            <div className="flex items-center gap-2">
              <div
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  extracted.confidence >= 0.8
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : extracted.confidence >= 0.5
                    ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                    : "border-red-500/40 bg-red-500/10 text-red-400"
                }`}
              >
                {confidenceLabel(extracted.confidence)} ({Math.round(extracted.confidence * 100)}%)
              </div>
              {extracted.confidence < 0.8 && (
                <span className="text-white/40 text-xs">
                  Some fields may need manual correction
                </span>
              )}
            </div>

            {/* Identity fields */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
              <div className="flex items-center gap-2 text-[#F2B705] text-sm font-semibold mb-3">
                <User className="w-4 h-4" />
                Participant Details
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Full Name</label>
                  <input
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F2B705]"
                    value={editedData.participantName ?? extracted.participantName}
                    onChange={(e) => setEditedData((d) => ({ ...d, participantName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Email Address *</label>
                  <input
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F2B705]"
                    type="email"
                    placeholder="your@email.com"
                    value={participantEmail}
                    onChange={(e) => setParticipantEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Role / Title</label>
                  <input
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F2B705]"
                    value={editedData.participantRole ?? extracted.participantRole}
                    onChange={(e) => setEditedData((d) => ({ ...d, participantRole: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Organisation</label>
                  <input
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F2B705]"
                    value={editedData.organisation ?? extracted.organisation}
                    onChange={(e) => setEditedData((d) => ({ ...d, organisation: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Score summary */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <div className="flex items-center gap-2 text-[#F2B705] text-sm font-semibold mb-4">
                <Star className="w-4 h-4" />
                ECI Score Summary
              </div>
              <div className="flex items-center gap-6 mb-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#F2B705]">{extracted.edgeScore}</div>
                  <div className="text-white/50 text-xs mt-1">Overall ECI Score</div>
                </div>
                <div>
                  <div className="text-white font-semibold">{extracted.archetypeLabel || extracted.archetype}</div>
                  <div className="text-white/50 text-xs mt-0.5">Communication Archetype</div>
                  {extracted.zone && (
                    <div className="text-[#F2B705] text-xs mt-1 font-medium uppercase tracking-wide">
                      {extracted.zone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pillar scores */}
            {Object.keys(extracted.pillarScores).length > 0 && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-2 text-[#F2B705] text-sm font-semibold mb-4">
                  <BarChart3 className="w-4 h-4" />
                  Pillar Scores
                </div>
                <div className="space-y-3">
                  {Object.entries(extracted.pillarScores).map(([id, score]) => (
                    <div key={id} className="flex items-center gap-3">
                      <div className="text-white/70 text-sm w-52 shrink-0">
                        {PILLAR_LABELS[id] ?? id}
                      </div>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F2B705] rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <div className="text-white font-semibold text-sm w-12 text-right">
                        {score}/100
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dimension scores */}
            {Object.keys(extracted.dimensionScores).length > 0 && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-2 text-[#F2B705] text-sm font-semibold mb-4">
                  <Building2 className="w-4 h-4" />
                  Dimension Scores
                </div>
                <div className="space-y-2">
                  {Object.entries(extracted.dimensionScores).map(([id, score]) => (
                    <div key={id} className="flex items-center gap-3">
                      <div className="text-white/60 text-xs w-52 shrink-0">
                        {DIMENSION_LABELS[id] ?? id}
                      </div>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/40 rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <div className="text-white/70 text-xs w-8 text-right">{score}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing data warning */}
            {extracted.confidence < 0.6 && (
              <div className="flex gap-3 bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-yellow-200 text-sm leading-relaxed">
                  Some scores could not be extracted reliably. This may happen with older report
                  formats. Please verify the scores above match your original report before confirming.
                  You can still proceed — any missing scores will be shown as 0 in your profile.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => { setStep("upload"); setSelectedFile(null); }}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Upload Different File
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={confirmMutation.isPending || !participantEmail}
                className="flex-1 bg-[#F2B705] hover:bg-[#F2B705]/90 text-[#0A1A2F] font-semibold"
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    Confirm & Import
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Success ── */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-6 py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">You're In.</h2>
              <p className="text-white/60 text-sm max-w-sm leading-relaxed">
                Your ECI report has been imported into LevelNext. Your scores, archetype, and
                pillar breakdown are now part of your Leadership Intelligence profile.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
              <Button
                onClick={() => navigate("/insights")}
                className="w-full bg-[#F2B705] hover:bg-[#F2B705]/90 text-[#0A1A2F] font-semibold h-11"
              >
                View My Insights
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/guide")}
                className="w-full border-white/20 text-white hover:bg-white/10 h-11"
              >
                Talk to Guide About My Results
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
