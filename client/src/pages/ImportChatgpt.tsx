import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shield,
  Upload,
  Loader2,
  CheckCircle,
  MessageSquare,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Brain,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Theme = {
  id: string;
  title: string;
  description: string;
  frequency: "high" | "medium" | "low";
  evidenceCount: number;
  category: "challenge" | "strength" | "pattern" | "goal";
};

type ParseResult = {
  totalConversations: number;
  leadershipConversations: number;
  dateFrom: string;
  dateTo: string;
  overallSynthesis: string;
  themes: Theme[];
};

// ─── Step type ────────────────────────────────────────────────────────────────
type Step = "privacy" | "upload" | "processing" | "review" | "success";

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  challenge: {
    label: "Challenge",
    color: "bg-red-900/30 border-red-700/50 text-red-300",
    badge: "bg-red-900/50 text-red-300",
    icon: AlertCircle,
  },
  strength: {
    label: "Strength",
    color: "bg-emerald-900/30 border-emerald-700/50 text-emerald-300",
    badge: "bg-emerald-900/50 text-emerald-300",
    icon: TrendingUp,
  },
  pattern: {
    label: "Pattern",
    color: "bg-blue-900/30 border-blue-700/50 text-blue-300",
    badge: "bg-blue-900/50 text-blue-300",
    icon: Brain,
  },
  goal: {
    label: "Goal",
    color: "bg-amber-900/30 border-amber-700/50 text-amber-300",
    badge: "bg-amber-900/50 text-amber-300",
    icon: Target,
  },
};

const FREQUENCY_LABEL = {
  high: "Appears frequently",
  medium: "Appears occasionally",
  low: "Appears rarely",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ImportChatgpt() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("privacy");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [approvedThemes, setApprovedThemes] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseMutation = trpc.chatgptImport.parseChatgptZip.useMutation();
  const confirmMutation = trpc.chatgptImport.confirmChatgptImport.useMutation();

  // ─── File handling ──────────────────────────────────────────────────────────
  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".zip")) {
        toast.error("Please upload a .zip file from ChatGPT's data export.");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 100MB.");
        return;
      }

      setStep("processing");

      try {
        // Read file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip data URL prefix
            resolve(result.split(",")[1] ?? result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await parseMutation.mutateAsync({
          fileBase64: base64,
          fileName: file.name,
        });

        setParseResult(result);
        // Pre-approve all themes
        setApprovedThemes(new Set(result.themes.map((t) => t.id)));
        setStep("review");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Processing failed. Please try again.";
        toast.error(msg);
        setStep("upload");
      }
    },
    [parseMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleConfirm = async () => {
    if (!parseResult) return;
    const themes = parseResult.themes.filter((t) => approvedThemes.has(t.id));
    if (themes.length === 0) {
      toast.error("Please keep at least one theme before confirming.");
      return;
    }

    try {
      await confirmMutation.mutateAsync({
        totalConversations: parseResult.totalConversations,
        leadershipConversations: parseResult.leadershipConversations,
        dateFrom: parseResult.dateFrom,
        dateTo: parseResult.dateTo,
        overallSynthesis: parseResult.overallSynthesis,
        themes,
      });
      setStep("success");
    } catch {
      toast.error("Failed to save your themes. Please try again.");
    }
  };

  const toggleTheme = (id: string) => {
    setApprovedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/diagnostics")}
          className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Diagnostics
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <MessageSquare className="w-4 h-4" />
          Import AI Conversations
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* ── Step: Privacy Modal ─────────────────────────────────────────── */}
        {step === "privacy" && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#F2B705]/10 border border-[#F2B705]/30 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-[#F2B705]" />
              </div>
              <h1 className="text-2xl font-bold text-white">Import Your AI Conversations</h1>
              <p className="text-white/60 max-w-md mx-auto">
                Your ChatGPT conversations contain valuable leadership thinking. LevelNext can synthesise
                those patterns into coaching intelligence — without storing a single word of your raw conversations.
              </p>
            </div>

            {/* Privacy commitments */}
            <div className="bg-[#0F2040] border border-white/10 rounded-xl p-6 space-y-4">
              <p className="text-[#F2B705] font-semibold text-sm uppercase tracking-wider">
                Our Privacy Commitment
              </p>
              {[
                {
                  icon: Shield,
                  title: "Raw file is never stored",
                  desc: "Your ZIP file is processed in memory and discarded immediately. It is never written to disk or cloud storage.",
                },
                {
                  icon: Trash2,
                  title: "Conversations are not retained",
                  desc: "No verbatim conversation text is saved. Only a structured summary of leadership themes — which you review and approve — is stored.",
                },
                {
                  icon: CheckCircle,
                  title: "You control what is saved",
                  desc: "Before anything is stored, you review every extracted theme and can remove any that you are not comfortable with.",
                },
                {
                  icon: Brain,
                  title: "Used only for your coaching",
                  desc: "The synthesised themes are shared only with Guide, your personal AI coach. They are never shared with your organisation or anyone else.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{title}</p>
                    <p className="text-white/50 text-sm mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* How to export */}
            <div className="bg-[#0F2040] border border-white/10 rounded-xl p-6 space-y-3">
              <p className="text-white font-semibold text-sm">How to export your ChatGPT data</p>
              <ol className="space-y-2 text-sm text-white/60">
                <li className="flex gap-2"><span className="text-[#F2B705] font-bold">1.</span>Open ChatGPT → click your profile picture (top right)</li>
                <li className="flex gap-2"><span className="text-[#F2B705] font-bold">2.</span>Go to <strong className="text-white/80">Settings → Data Controls</strong></li>
                <li className="flex gap-2"><span className="text-[#F2B705] font-bold">3.</span>Click <strong className="text-white/80">Export Data</strong> → Confirm export</li>
                <li className="flex gap-2"><span className="text-[#F2B705] font-bold">4.</span>Wait for the email from OpenAI (usually within minutes)</li>
                <li className="flex gap-2"><span className="text-[#F2B705] font-bold">5.</span>Download the ZIP and upload it here</li>
              </ol>
            </div>

            <Button
              onClick={() => setStep("upload")}
              className="w-full bg-[#F2B705] hover:bg-[#F2B705]/90 text-[#0A1628] font-semibold py-3 text-base"
            >
              I Understand — Continue to Upload
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Step: Upload ────────────────────────────────────────────────── */}
        {step === "upload" && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#F2B705]/10 border border-[#F2B705]/30 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-[#F2B705]" />
              </div>
              <h1 className="text-2xl font-bold text-white">Upload Your ChatGPT Export</h1>
              <p className="text-white/60">
                Upload the .zip file you received from OpenAI. Maximum file size: 100MB.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                ${isDragging
                  ? "border-[#F2B705] bg-[#F2B705]/5"
                  : "border-white/20 hover:border-white/40 hover:bg-white/5"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <Upload className="w-10 h-10 text-white/30 mx-auto mb-4" />
              <p className="text-white font-medium">
                {isDragging ? "Drop your ZIP file here" : "Drag & drop your ZIP file here"}
              </p>
              <p className="text-white/40 text-sm mt-2">or click to browse</p>
              <p className="text-white/30 text-xs mt-4">
                Only .zip files from ChatGPT data export are accepted
              </p>
            </div>

            <button
              onClick={() => setStep("privacy")}
              className="w-full text-white/40 hover:text-white/60 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to privacy information
            </button>
          </div>
        )}

        {/* ── Step: Processing ────────────────────────────────────────────── */}
        {step === "processing" && (
          <div className="text-center space-y-8 py-12">
            <div className="w-20 h-20 rounded-full bg-[#F2B705]/10 border border-[#F2B705]/30 flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-[#F2B705] animate-spin" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white">Analysing Your Conversations</h2>
              <p className="text-white/60 max-w-sm mx-auto">
                Filtering leadership-relevant conversations, then synthesising themes.
                Your raw data is discarded as soon as this is complete.
              </p>
            </div>
            <div className="space-y-3 text-sm text-white/40 max-w-xs mx-auto">
              {[
                "Reading conversation export…",
                "Filtering leadership conversations…",
                "Synthesising leadership themes…",
                "Discarding raw data…",
              ].map((label, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F2B705]/60 animate-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Review ────────────────────────────────────────────────── */}
        {step === "review" && parseResult && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Your Leadership Intelligence</h1>
              <p className="text-white/60">
                Synthesised from {parseResult.leadershipConversations} leadership conversations
                ({parseResult.dateFrom} → {parseResult.dateTo}).
                Your raw data has been discarded.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total conversations", value: parseResult.totalConversations },
                { label: "Leadership relevant", value: parseResult.leadershipConversations },
                { label: "Themes identified", value: parseResult.themes.length },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#0F2040] border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#F2B705]">{value}</p>
                  <p className="text-white/50 text-xs mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Overall synthesis */}
            <div className="bg-[#0F2040] border border-[#F2B705]/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-[#F2B705]" />
                <p className="text-[#F2B705] font-semibold text-sm uppercase tracking-wider">Guide's Read on You</p>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{parseResult.overallSynthesis}</p>
            </div>

            {/* Theme cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold">
                  Themes to Save ({approvedThemes.size} of {parseResult.themes.length} selected)
                </p>
                <p className="text-white/40 text-xs">Click a theme to remove it</p>
              </div>

              {parseResult.themes.map((theme) => {
                const cfg = CATEGORY_CONFIG[theme.category];
                const Icon = cfg.icon;
                const isApproved = approvedThemes.has(theme.id);

                return (
                  <div
                    key={theme.id}
                    onClick={() => toggleTheme(theme.id)}
                    className={`
                      border rounded-xl p-4 cursor-pointer transition-all
                      ${isApproved ? cfg.color : "bg-white/5 border-white/10 opacity-40"}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isApproved ? cfg.badge : "bg-white/10"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{theme.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isApproved ? cfg.badge : "bg-white/10 text-white/40"}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-white/40">
                            {FREQUENCY_LABEL[theme.frequency]} · {theme.evidenceCount} conversation{theme.evidenceCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-sm mt-1 opacity-80">{theme.description}</p>
                      </div>
                      {!isApproved && (
                        <div className="flex-shrink-0">
                          <Trash2 className="w-4 h-4 text-white/30" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Privacy reminder */}
            <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4 flex gap-3">
              <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-300 text-sm">
                Your raw conversations have already been discarded. Only the themes you confirm below will be saved — and only Guide will use them.
              </p>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={confirmMutation.isPending || approvedThemes.size === 0}
              className="w-full bg-[#F2B705] hover:bg-[#F2B705]/90 text-[#0A1628] font-semibold py-3 text-base"
            >
              {confirmMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
              ) : (
                <>Save {approvedThemes.size} Theme{approvedThemes.size !== 1 ? "s" : ""} to Guide</>
              )}
            </Button>
          </div>
        )}

        {/* ── Step: Success ───────────────────────────────────────────────── */}
        {step === "success" && parseResult && (
          <div className="text-center space-y-8 py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">Intelligence Imported</h2>
              <p className="text-white/60 max-w-sm mx-auto">
                {approvedThemes.size} leadership theme{approvedThemes.size !== 1 ? "s" : ""} from your ChatGPT conversations
                are now part of your Guide coaching context.
              </p>
            </div>

            {/* What Guide knows now */}
            <div className="bg-[#0F2040] border border-[#F2B705]/20 rounded-xl p-5 text-left space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#F2B705]" />
                <p className="text-[#F2B705] font-semibold text-sm uppercase tracking-wider">What Guide Knows Now</p>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Guide can now reference your thinking patterns, recurring challenges, and leadership goals from your AI conversation history.
                The next time you open Guide, it will have richer context about how you think and what you are working through.
              </p>
              <p className="text-white/50 text-xs">
                Try asking: <em className="text-white/70">"Based on what you know about my leadership patterns, what should I be working on this week?"</em>
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/guide")}
                className="w-full bg-[#F2B705] hover:bg-[#F2B705]/90 text-[#0A1628] font-semibold py-3"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Talk to Guide Now
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/diagnostics")}
                className="w-full border-white/20 text-white hover:bg-white/5"
              >
                Back to Diagnostics
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
