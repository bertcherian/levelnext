import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Shield,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import PlatformLayout from "@/components/PlatformLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
type Theme = {
  id: string;
  title: string;
  description: string;
  frequency: "high" | "medium" | "low";
  evidenceCount: number;
  category: "challenge" | "strength" | "pattern" | "goal";
};

type SynthesisResult = {
  source: "chatgpt" | "claude" | "text_paste";
  totalConversations?: number;
  leadershipConversations?: number;
  dateFrom?: string;
  dateTo?: string;
  characterCount?: number;
  overallSynthesis: string;
  themes: Theme[];
};

type InputMode = "select" | "chatgpt" | "claude" | "paste";
type Step = "privacy" | "input" | "processing" | "review" | "success";

// ─── Category styling ─────────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  challenge: { label: "Challenge", bg: "oklch(from #dc2626 l c h / 0.08)", text: "#dc2626", border: "oklch(from #dc2626 l c h / 0.25)" },
  strength:  { label: "Strength",  bg: "oklch(from #16a34a l c h / 0.08)", text: "#16a34a", border: "oklch(from #16a34a l c h / 0.25)" },
  pattern:   { label: "Pattern",   bg: "oklch(from #2563eb l c h / 0.08)", text: "#2563eb", border: "oklch(from #2563eb l c h / 0.25)" },
  goal:      { label: "Goal",      bg: "oklch(from #d97706 l c h / 0.08)", text: "#d97706", border: "oklch(from #d97706 l c h / 0.25)" },
};
const FREQ_LABEL: Record<string, string> = { high: "High frequency", medium: "Medium frequency", low: "Low frequency" };

// ─── Source labels ─────────────────────────────────────────────────────────────
const SOURCE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  text_paste: "Pasted text",
};

// ─── Privacy commitments ──────────────────────────────────────────────────────
const PRIVACY_POINTS = [
  { icon: "🔒", title: "Raw data never stored", body: "Your ZIP file or pasted text is processed in memory and discarded immediately after synthesis. Nothing is written to disk." },
  { icon: "🚫", title: "Conversations not retained", body: "We extract themes and patterns only. Not a single sentence of your original conversations is saved." },
  { icon: "✅", title: "You control what is saved", body: "Before anything is stored, you review every theme and remove any you are not comfortable with." },
  { icon: "🎯", title: "Used only for your coaching", body: "The synthesised themes are shared only with Guide to enrich your coaching conversations. They are never used for analytics or shared with anyone." },
];

// ─── Export instructions ──────────────────────────────────────────────────────
const EXPORT_INSTRUCTIONS: Record<"chatgpt" | "claude", { steps: string[]; note: string }> = {
  chatgpt: {
    steps: [
      "Log into ChatGPT at chat.openai.com",
      "Click your profile icon → Settings",
      "Go to Data Controls",
      "Click Export Data → Confirm export",
      "OpenAI will email you a download link (usually within minutes)",
      "Download the ZIP and upload it here",
    ],
    note: "The ZIP will contain a conversations.json file with your full history.",
  },
  claude: {
    steps: [
      "Log into Claude at claude.ai",
      "Click your profile icon → Settings",
      "Go to Privacy or Data Controls",
      "Click Export Data → Request export",
      "Anthropic will email you a download link",
      "Download the ZIP and upload it here",
    ],
    note: "The ZIP contains your conversation history in JSON and/or HTML format.",
  },
};

export default function ImportChatgpt() {
  const [, navigate] = useLocation();

  // Step state
  const [step, setStep] = useState<Step>("privacy");
  const [inputMode, setInputMode] = useState<InputMode>("select");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // Upload state
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste state
  const [pasteText, setPasteText] = useState("");
  const [pasteLabel, setPasteLabel] = useState("Emails and documents");

  // Processing state
  const [processingStep, setProcessingStep] = useState(0);
  const PROCESSING_STEPS = [
    "Reading your data…",
    "Filtering leadership conversations…",
    "Synthesising patterns with AI…",
    "Building your intelligence profile…",
  ];

  // Results state
  const [result, setResult] = useState<SynthesisResult | null>(null);
  const [removedThemes, setRemovedThemes] = useState<Set<string>>(new Set());
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  // tRPC mutations
  const parseZip = trpc.chatgptImport.parseAiZip.useMutation();
  const parsePaste = trpc.chatgptImport.parseTextPaste.useMutation();
  const confirmImport = trpc.chatgptImport.confirmImport.useMutation();

  // ─── File handling ──────────────────────────────────────────────────────────
  function handleFileSelect(file: File) {
    if (!file.name.endsWith(".zip")) {
      toast.error("Please upload a .zip file from your AI export.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File is too large. Please upload a ZIP under 100MB.");
      return;
    }
    setSelectedFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  // ─── Process ZIP ────────────────────────────────────────────────────────────
  async function processZip() {
    if (!selectedFile) return;
    setStep("processing");
    setProcessingStep(0);

    const interval = setInterval(() => {
      setProcessingStep((p) => Math.min(p + 1, PROCESSING_STEPS.length - 1));
    }, 1800);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const hintSource: "chatgpt" | "claude" | "auto" =
        inputMode === "chatgpt" ? "chatgpt" : inputMode === "claude" ? "claude" : "auto";

      const data = await parseZip.mutateAsync({
        fileBase64: base64,
        fileName: selectedFile.name,
        hintSource,
      });

      clearInterval(interval);
      setResult(data);
      setRemovedThemes(new Set());
      setStep("review");
    } catch (err: unknown) {
      clearInterval(interval);
      const msg = err instanceof Error ? err.message : "Processing failed. Please try again.";
      toast.error(msg);
      setStep("input");
    }
  }

  // ─── Process paste ──────────────────────────────────────────────────────────
  async function processPaste() {
    if (pasteText.trim().length < 100) {
      toast.error("Please paste at least 100 characters of text.");
      return;
    }
    setStep("processing");
    setProcessingStep(0);

    const interval = setInterval(() => {
      setProcessingStep((p) => Math.min(p + 1, PROCESSING_STEPS.length - 1));
    }, 1500);

    try {
      const data = await parsePaste.mutateAsync({
        text: pasteText,
        sourceLabel: pasteLabel,
      });

      clearInterval(interval);
      setResult(data);
      setRemovedThemes(new Set());
      setStep("review");
    } catch (err: unknown) {
      clearInterval(interval);
      const msg = err instanceof Error ? err.message : "Processing failed. Please try again.";
      toast.error(msg);
      setStep("input");
    }
  }

  // ─── Confirm import ─────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!result) return;
    const approvedThemes = result.themes.filter((t) => !removedThemes.has(t.id));
    if (approvedThemes.length === 0) {
      toast.error("Please keep at least one theme before confirming.");
      return;
    }

    try {
      await confirmImport.mutateAsync({
        source: result.source,
        totalConversations: result.totalConversations,
        leadershipConversations: result.leadershipConversations,
        dateFrom: result.dateFrom,
        dateTo: result.dateTo,
        overallSynthesis: result.overallSynthesis,
        themes: approvedThemes,
      });
      setStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save your intelligence profile. Please try again.";
      toast.error(msg);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <PlatformLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back link */}
        {step !== "success" && (
          <Link href="/diagnostics">
            <button className="flex items-center gap-1.5 text-sm mb-6 transition-colors" style={{ color: "var(--color-ln-muted)" }}>
              <ArrowLeft size={14} />
              Back to Diagnostics
            </button>
          </Link>
        )}

        {/* ── STEP: PRIVACY ─────────────────────────────────────────────────── */}
        {step === "privacy" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-ln-navy)" }}>
                <Brain size={20} style={{ color: "var(--color-ln-yellow)" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Import Your AI Intelligence</h1>
                <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>ChatGPT, Claude, emails, or documents</p>
              </div>
            </div>

            <p className="text-sm mb-6" style={{ color: "var(--color-ln-muted)" }}>
              You have been using AI to think through leadership challenges. That thinking contains valuable patterns.
              LevelNext can synthesise it into coaching intelligence for Guide — without storing a word of your raw conversations.
            </p>

            <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--color-ln-ivory-dark)", border: "1px solid var(--color-ln-border)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Shield size={15} style={{ color: "var(--color-ln-navy)" }} />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>Our Privacy Commitment</p>
              </div>
              <div className="space-y-4">
                {PRIVACY_POINTS.map((pt) => (
                  <div key={pt.title} className="flex gap-3">
                    <span className="text-base flex-shrink-0 mt-0.5">{pt.icon}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{pt.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>{pt.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded"
                style={{ accentColor: "var(--color-ln-navy)" }}
              />
              <span className="text-sm" style={{ color: "var(--color-ln-navy)" }}>
                I understand that my raw data will be processed and immediately discarded, and that only the synthesised themes I approve will be saved.
              </span>
            </label>

            <Button
              className="w-full font-semibold"
              disabled={!privacyAgreed}
              onClick={() => setStep("input")}
              style={{ background: privacyAgreed ? "var(--color-ln-navy)" : undefined, color: privacyAgreed ? "white" : undefined }}
            >
              I Understand — Choose Import Method
              <ArrowRight size={15} className="ml-2" />
            </Button>
          </div>
        )}

        {/* ── STEP: INPUT ───────────────────────────────────────────────────── */}
        {step === "input" && (
          <div>
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>Choose Your Import Method</h1>
            <p className="text-sm mb-6" style={{ color: "var(--color-ln-muted)" }}>Select how you want to share your AI thinking with Guide.</p>

            {/* Mode selector */}
            {inputMode === "select" && (
              <div className="space-y-3">
                {[
                  { mode: "chatgpt" as InputMode, icon: <MessageSquare size={18} />, label: "ChatGPT Export", sub: "Upload your ChatGPT data export ZIP" },
                  { mode: "claude" as InputMode, icon: <Sparkles size={18} />, label: "Claude Export", sub: "Upload your Claude data export ZIP" },
                  { mode: "paste" as InputMode, icon: <FileText size={18} />, label: "Paste Text", sub: "Paste emails, documents, or conversation excerpts" },
                ].map(({ mode, icon, label, sub }) => (
                  <button
                    key={mode}
                    onClick={() => setInputMode(mode)}
                    className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all"
                    style={{ background: "var(--color-ln-ivory-dark)", border: "1px solid var(--color-ln-border)" }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-ln-navy)", color: "var(--color-ln-yellow)" }}>
                      {icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>{label}</p>
                      <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{sub}</p>
                    </div>
                    <ArrowRight size={15} className="ml-auto flex-shrink-0" style={{ color: "var(--color-ln-muted)" }} />
                  </button>
                ))}
              </div>
            )}

            {/* ChatGPT / Claude ZIP upload */}
            {(inputMode === "chatgpt" || inputMode === "claude") && (
              <div>
                <button onClick={() => { setInputMode("select"); setSelectedFile(null); }} className="flex items-center gap-1.5 text-xs mb-4" style={{ color: "var(--color-ln-muted)" }}>
                  <ArrowLeft size={12} /> Back to methods
                </button>

                <div className="rounded-xl p-4 mb-5" style={{ background: "var(--color-ln-ivory-dark)", border: "1px solid var(--color-ln-border)" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-ln-navy)" }}>
                    How to export from {inputMode === "chatgpt" ? "ChatGPT" : "Claude"}
                  </p>
                  <ol className="space-y-1.5">
                    {EXPORT_INSTRUCTIONS[inputMode].steps.map((s, i) => (
                      <li key={i} className="flex gap-2 text-xs" style={{ color: "var(--color-ln-muted)" }}>
                        <span className="font-bold flex-shrink-0" style={{ color: "var(--color-ln-navy)" }}>{i + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs mt-3 italic" style={{ color: "var(--color-ln-muted)" }}>{EXPORT_INSTRUCTIONS[inputMode].note}</p>
                </div>

                {/* Drop zone */}
                <div
                  className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: dragOver ? "var(--color-ln-navy)" : "var(--color-ln-border)",
                    background: dragOver ? "oklch(from var(--color-ln-navy) l c h / 0.04)" : "var(--color-ln-ivory-dark)",
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle size={32} style={{ color: "#16a34a" }} />
                      <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>{selectedFile.name}</p>
                      <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB — ready to process</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={28} style={{ color: "var(--color-ln-muted)" }} />
                      <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Drop your ZIP here or click to browse</p>
                      <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Accepts .zip files up to 100MB</p>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full mt-4 font-semibold"
                  disabled={!selectedFile}
                  onClick={processZip}
                  style={{ background: selectedFile ? "var(--color-ln-navy)" : undefined, color: selectedFile ? "white" : undefined }}
                >
                  <Sparkles size={15} className="mr-2" />
                  Synthesise My Leadership Patterns
                </Button>
              </div>
            )}

            {/* Text paste */}
            {inputMode === "paste" && (
              <div>
                <button onClick={() => { setInputMode("select"); setPasteText(""); }} className="flex items-center gap-1.5 text-xs mb-4" style={{ color: "var(--color-ln-muted)" }}>
                  <ArrowLeft size={12} /> Back to methods
                </button>

                <div className="rounded-xl p-4 mb-4" style={{ background: "var(--color-ln-ivory-dark)", border: "1px solid var(--color-ln-border)" }}>
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>
                    Paste any leadership-related text — emails you have written, documents, meeting notes, copied AI conversations, or reflection notes. Guide will extract the patterns.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "var(--color-ln-navy)" }}>What are you pasting?</label>
                  <select
                    value={pasteLabel}
                    onChange={(e) => setPasteLabel(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ border: "1px solid var(--color-ln-border)", background: "white", color: "var(--color-ln-navy)" }}
                  >
                    <option>Emails and documents</option>
                    <option>Claude conversation</option>
                    <option>ChatGPT conversation</option>
                    <option>Meeting notes</option>
                    <option>Reflection notes</option>
                    <option>Other AI conversation</option>
                  </select>
                </div>

                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste your text here… (minimum 100 characters)"
                  rows={10}
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                  style={{ border: "1px solid var(--color-ln-border)", background: "white", color: "var(--color-ln-navy)", outline: "none" }}
                />
                <p className="text-xs mt-1 text-right" style={{ color: "var(--color-ln-muted)" }}>
                  {pasteText.length.toLocaleString()} characters {pasteText.length > 0 && pasteText.length < 100 && <span style={{ color: "#dc2626" }}>(need at least 100)</span>}
                </p>

                <Button
                  className="w-full mt-3 font-semibold"
                  disabled={pasteText.trim().length < 100}
                  onClick={processPaste}
                  style={{ background: pasteText.trim().length >= 100 ? "var(--color-ln-navy)" : undefined, color: pasteText.trim().length >= 100 ? "white" : undefined }}
                >
                  <Sparkles size={15} className="mr-2" />
                  Synthesise My Leadership Patterns
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: PROCESSING ──────────────────────────────────────────────── */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "var(--color-ln-navy)" }}>
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-ln-yellow)" }} />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>Analysing Your Leadership Thinking</h2>
            <p className="text-sm mb-8" style={{ color: "var(--color-ln-muted)" }}>This takes about 15–30 seconds. Raw data is discarded as we go.</p>
            <div className="w-full max-w-sm space-y-3">
              {PROCESSING_STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{
                    background: i < processingStep ? "#16a34a" : i === processingStep ? "var(--color-ln-navy)" : "var(--color-ln-border)",
                  }}>
                    {i < processingStep
                      ? <CheckCircle size={14} style={{ color: "white" }} />
                      : i === processingStep
                        ? <Loader2 size={12} className="animate-spin" style={{ color: "white" }} />
                        : <span className="text-xs font-bold" style={{ color: "var(--color-ln-muted)" }}>{i + 1}</span>
                    }
                  </div>
                  <p className="text-sm" style={{ color: i <= processingStep ? "var(--color-ln-navy)" : "var(--color-ln-muted)", fontWeight: i === processingStep ? 600 : 400 }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: REVIEW ──────────────────────────────────────────────────── */}
        {step === "review" && result && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-ln-navy)" }}>
                <CheckCircle size={20} style={{ color: "var(--color-ln-yellow)" }} />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: "var(--color-ln-navy)" }}>Review Your Intelligence Profile</h1>
                <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Source: {SOURCE_LABELS[result.source]}</p>
              </div>
            </div>

            {/* Stats */}
            {result.source !== "text_paste" && (
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Total", value: result.totalConversations ?? 0 },
                  { label: "Leadership", value: result.leadershipConversations ?? 0 },
                  { label: "Themes found", value: result.themes.length },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--color-ln-ivory-dark)", border: "1px solid var(--color-ln-border)" }}>
                    <p className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{value}</p>
                    <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Overall synthesis */}
            <div className="rounded-xl p-4 mb-5" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.05)", border: "1px solid oklch(from var(--color-ln-navy) l c h / 0.15)" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-ln-navy)" }}>Guide's Read on Your Leadership Patterns</p>
              <p className="text-sm" style={{ color: "var(--color-ln-navy)" }}>{result.overallSynthesis}</p>
            </div>

            {/* Theme cards */}
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-ln-navy)" }}>
              Themes ({result.themes.filter((t) => !removedThemes.has(t.id)).length} of {result.themes.length} selected)
            </p>
            <div className="space-y-3 mb-5">
              {result.themes.map((theme) => {
                const removed = removedThemes.has(theme.id);
                const style = CATEGORY_STYLES[theme.category] ?? CATEGORY_STYLES.pattern;
                const expanded = expandedTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    className="rounded-xl p-4 transition-all"
                    style={{
                      background: removed ? "var(--color-ln-border)" : style.bg,
                      border: `1px solid ${removed ? "var(--color-ln-border)" : style.border}`,
                      opacity: removed ? 0.5 : 1,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                            {style.label}
                          </span>
                          <span className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{FREQ_LABEL[theme.frequency]} · {theme.evidenceCount} instance{theme.evidenceCount !== 1 ? "s" : ""}</span>
                        </div>
                        <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>{theme.title}</p>
                        {expanded && (
                          <p className="text-xs mt-1.5" style={{ color: "var(--color-ln-muted)" }}>{theme.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setExpandedTheme(expanded ? null : theme.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}
                        >
                          {expanded ? <ChevronUp size={13} style={{ color: "var(--color-ln-navy)" }} /> : <ChevronDown size={13} style={{ color: "var(--color-ln-navy)" }} />}
                        </button>
                        <button
                          onClick={() => {
                            setRemovedThemes((prev) => {
                              const next = new Set(prev);
                              if (next.has(theme.id)) next.delete(theme.id); else next.add(theme.id);
                              return next;
                            });
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: removed ? "oklch(from #16a34a l c h / 0.1)" : "oklch(from #dc2626 l c h / 0.1)" }}
                          title={removed ? "Restore theme" : "Remove theme"}
                        >
                          {removed
                            ? <CheckCircle size={13} style={{ color: "#16a34a" }} />
                            : <Trash2 size={13} style={{ color: "#dc2626" }} />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Privacy reminder */}
            <div className="flex items-start gap-2 rounded-lg p-3 mb-5" style={{ background: "oklch(from #16a34a l c h / 0.06)", border: "1px solid oklch(from #16a34a l c h / 0.2)" }}>
              <Shield size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#16a34a" }} />
              <p className="text-xs" style={{ color: "#16a34a" }}>
                Your raw data has already been discarded. Only the themes you approve above will be saved to your Guide coaching context.
              </p>
            </div>

            <Button
              className="w-full font-semibold"
              disabled={confirmImport.isPending || result.themes.filter((t) => !removedThemes.has(t.id)).length === 0}
              onClick={handleConfirm}
              style={{ background: "var(--color-ln-navy)", color: "white" }}
            >
              {confirmImport.isPending ? (
                <><Loader2 size={15} className="mr-2 animate-spin" /> Saving…</>
              ) : (
                <>Save {result.themes.filter((t) => !removedThemes.has(t.id)).length} Theme{result.themes.filter((t) => !removedThemes.has(t.id)).length !== 1 ? "s" : ""} to Guide Context</>
              )}
            </Button>
          </div>
        )}

        {/* ── STEP: SUCCESS ─────────────────────────────────────────────────── */}
        {step === "success" && result && (
          <div className="flex flex-col items-center text-center py-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: "oklch(from #16a34a l c h / 0.1)", border: "2px solid #16a34a" }}>
              <CheckCircle size={32} style={{ color: "#16a34a" }} />
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>Intelligence Profile Saved</h1>
            <p className="text-sm mb-1" style={{ color: "var(--color-ln-muted)" }}>
              {result.themes.filter((t) => !removedThemes.has(t.id)).length} leadership themes are now part of your Guide coaching context.
            </p>
            <p className="text-xs mb-8" style={{ color: "var(--color-ln-muted)" }}>Source: {SOURCE_LABELS[result.source]} · Raw data discarded ✓</p>

            <div className="w-full rounded-2xl p-5 mb-6 text-left" style={{ background: "var(--color-ln-ivory-dark)", border: "1px solid var(--color-ln-border)" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-ln-navy)" }}>Suggested opening with Guide</p>
              <p className="text-sm italic" style={{ color: "var(--color-ln-navy)" }}>
                "Guide, I've just imported my AI conversation history. Based on the patterns you can see, what's the one leadership challenge I should focus on this week?"
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Link href="/guide">
                <Button className="w-full font-semibold" style={{ background: "var(--color-ln-navy)", color: "white" }}>
                  <MessageSquare size={15} className="mr-2" />
                  Open Guide
                </Button>
              </Link>
              <Link href="/diagnostics">
                <Button variant="outline" className="w-full font-medium" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}>
                  Back to Diagnostics
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
