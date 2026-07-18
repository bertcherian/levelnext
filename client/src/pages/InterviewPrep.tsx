import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  BookOpen,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCheck,
  Plus,
  Trash2,
  Star,
  MessageSquare,
  Target,
  Building2,
  Users,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";

// ─── Copy Button ─────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded hover:bg-black/8 transition-colors flex-shrink-0"
      title="Copy"
    >
      {copied ? <CheckCheck size={14} className="text-emerald-600" /> : <Copy size={14} className="text-muted-foreground" />}
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: "var(--color-ln-navy)" }}>{icon}</span>
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Interview Prep Form ──────────────────────────────────────────────────────
function InterviewPrepForm({
  onGenerated,
  prefillCompany = "",
  radarContext = "",
}: {
  onGenerated: () => void;
  prefillCompany?: string;
  radarContext?: string;
}) {
  const [form, setForm] = useState({
    targetRole: "",
    targetCompany: prefillCompany,
    interviewType: "behavioral",
    jobDescription: "",
    yourBackground: "",
  });

  // Sync prefillCompany when arriving from Radar signal
  useEffect(() => {
    if (prefillCompany) {
      setForm((f) => ({ ...f, targetCompany: prefillCompany }));
    }
  }, [prefillCompany]);

  const generateMutation = trpc.interviewPrep.generatePrep.useMutation({
    onSuccess: () => {
      onGenerated();
      toast.success("Interview prep generated!");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {/* Radar context banner */}
      {radarContext && (
        <div
          className="rounded-lg px-4 py-3 flex items-start gap-3"
          style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.1)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.3)" }}
        >
          <span className="text-xs mt-0.5" style={{ color: "var(--color-ln-navy)" }}>📡</span>
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--color-ln-navy)" }}>From Radar Signal</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-ln-text)" }}>{radarContext}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold">Target Role *</Label>
          <Input
            className="mt-1"
            value={form.targetRole}
            onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
            placeholder="VP Engineering, CFO, GM…"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">Target Company *</Label>
          <Input
            className="mt-1"
            value={form.targetCompany}
            onChange={(e) => setForm((f) => ({ ...f, targetCompany: e.target.value }))}
            placeholder="Acme Corp, Google…"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold">Interview Type</Label>
        <select
          className="mt-1 w-full text-sm rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
          value={form.interviewType}
          onChange={(e) => setForm((f) => ({ ...f, interviewType: e.target.value }))}
        >
          <option value="behavioral">Behavioural / Competency</option>
          <option value="case">Case / Problem-solving</option>
          <option value="executive">Executive / Board-level</option>
          <option value="technical">Technical / Functional</option>
          <option value="culture">Culture Fit / Values</option>
        </select>
      </div>

      <div>
        <Label className="text-xs font-semibold">Job Description (optional)</Label>
        <Textarea
          className="mt-1 text-sm resize-none"
          rows={4}
          value={form.jobDescription}
          onChange={(e) => setForm((f) => ({ ...f, jobDescription: e.target.value }))}
          placeholder="Paste the JD or key requirements here…"
        />
      </div>

      <div>
        <Label className="text-xs font-semibold">Your Relevant Background (optional)</Label>
        <Textarea
          className="mt-1 text-sm resize-none"
          rows={3}
          value={form.yourBackground}
          onChange={(e) => setForm((f) => ({ ...f, yourBackground: e.target.value }))}
          placeholder="Key achievements, experience, skills relevant to this role…"
        />
      </div>

      <Button
        className="w-full h-11 font-semibold gap-2"
        style={{ background: "var(--color-ln-navy)", color: "white" }}
        disabled={!form.targetRole || !form.targetCompany || generateMutation.isPending}
        onClick={() => generateMutation.mutate(form)}
      >
        {generateMutation.isPending ? (
          <><RefreshCw size={16} className="animate-spin" /> Generating prep…</>
        ) : (
          <><Sparkles size={16} /> Generate Interview Prep</>
        )}
      </Button>
    </div>
  );
}

// ─── Prep Results ─────────────────────────────────────────────────────────────
type PrepData = {
  roleResearch?: { companyContext?: string[]; likelyPriorities?: string[]; interviewerMindset?: string };
  likelyQuestions?: string[];
  suggestedAnswers?: string[];
  storyBank?: Array<{ title: string; competency: string; situation: string; task: string; action: string; result: string }>;
  keyMessages?: string[];
  questionsToAsk?: string[];
  thingsToAvoid?: string[];
};

function PrepResults({ prep }: { prep: { prepData: unknown; targetRole: string; targetCompany: string; interviewType: string; createdAt: Date } }) {
  const [expandedQ, setExpandedQ] = useState<number | null>(0);
  const [expandedStory, setExpandedStory] = useState<number | null>(null);

  const parsed = (prep.prepData ?? {}) as PrepData;

  return (
    <div className="space-y-5">
      {/* Role Research */}
      {parsed.roleResearch && (
        <SectionCard title="Role Research" icon={<Building2 size={16} />}>
          <div className="space-y-3">
            {(parsed.roleResearch as Record<string, string[]>).companyContext && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Company Context</p>
                <ul className="space-y-1.5">
                  {(parsed.roleResearch as Record<string, string[]>).companyContext.map((item: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(parsed.roleResearch as Record<string, string[]>).likelyPriorities && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Likely Priorities for This Role</p>
                <ul className="space-y-1.5">
                  {(parsed.roleResearch as Record<string, string[]>).likelyPriorities.map((item: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Target size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Likely Questions */}
      {parsed.likelyQuestions && (parsed.likelyQuestions as string[]).length > 0 && (
        <SectionCard title="Likely Interview Questions" icon={<MessageSquare size={16} />}>
          <div className="space-y-2">
            {(parsed.likelyQuestions as string[]).map((q: string, i: number) => (
              <div key={i} className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/4 transition-colors"
                  onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                >
                  <span className="text-sm font-medium pr-4">{q}</span>
                  {expandedQ === i ? <ChevronUp size={14} className="flex-shrink-0" /> : <ChevronDown size={14} className="flex-shrink-0" />}
                </button>
                {expandedQ === i && parsed.suggestedAnswers && (parsed.suggestedAnswers as string[])[i] && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-start justify-between gap-2 pt-3">
                      <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                        {(parsed.suggestedAnswers as string[])[i]}
                      </p>
                      <CopyButton text={(parsed.suggestedAnswers as string[])[i]} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Story Bank */}
      {parsed.storyBank && (parsed.storyBank as Array<Record<string, string>>).length > 0 && (
        <SectionCard title="STAR Story Bank" icon={<Star size={16} />}>
          <div className="space-y-2">
            {(parsed.storyBank as Array<Record<string, string>>).map((story, i) => (
              <div key={i} className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/4 transition-colors"
                  onClick={() => setExpandedStory(expandedStory === i ? null : i)}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {story.competency}
                    </Badge>
                    <span className="text-sm font-medium">{story.title}</span>
                  </div>
                  {expandedStory === i ? <ChevronUp size={14} className="flex-shrink-0" /> : <ChevronDown size={14} className="flex-shrink-0" />}
                </button>
                {expandedStory === i && (
                  <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                    {["situation", "task", "action", "result"].map((key) => story[key] && (
                      <div key={key}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </p>
                        <div className="flex items-start gap-2">
                          <p className="text-sm leading-relaxed flex-1">{story[key]}</p>
                          <CopyButton text={story[key]} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Key Messages */}
      {parsed.keyMessages && (parsed.keyMessages as string[]).length > 0 && (
        <SectionCard title="Key Messages to Land" icon={<Lightbulb size={16} />}>
          <ul className="space-y-2">
            {(parsed.keyMessages as string[]).map((msg: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{msg}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Questions to Ask */}
      {parsed.questionsToAsk && (parsed.questionsToAsk as string[]).length > 0 && (
        <SectionCard title="Questions to Ask the Interviewer" icon={<Users size={16} />}>
          <ul className="space-y-2">
            {(parsed.questionsToAsk as string[]).map((q: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-sm flex-1">{q}</span>
                  <CopyButton text={q} />
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InterviewPrep() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Read URL params from Radar deep-link
  const searchParams = new URLSearchParams(window.location.search);
  const prefillCompany = searchParams.get("company") ?? "";
  const radarContext = searchParams.get("context") ?? "";

  // Auto-open form when arriving from Radar
  useEffect(() => {
    if (prefillCompany) {
      setShowForm(true);
    }
  }, [prefillCompany]);

  const { data: latestPrep, isLoading } = trpc.interviewPrep.getLatestPrep.useQuery();
  const { data: prepList } = trpc.interviewPrep.listPreps.useQuery();

  const deleteMutation = trpc.interviewPrep.deletePrep.useMutation({
    onSuccess: () => {
      utils.interviewPrep.listPreps.invalidate();
      utils.interviewPrep.getLatestPrep.invalidate();
      setSelectedId(null);
      toast.success("Session deleted");
    },
  });

  // Determine which prep to display: selected from history, or latest
  const displayPrep = selectedId
    ? prepList?.find((p) => p.id === selectedId) ?? latestPrep
    : latestPrep;

  function handleGenerated() {
    setShowForm(false);
    setSelectedId(null);
    utils.interviewPrep.getLatestPrep.invalidate();
    utils.interviewPrep.listPreps.invalidate();
  }

  return (
    <PlatformLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div
              className="rounded-xl p-3 flex-shrink-0"
              style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}
            >
              <BookOpen size={24} style={{ color: "var(--color-ln-navy)" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                Interview Preparation
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI-generated role research, likely questions with suggested answers, STAR story bank, and key messages.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(prepList?.length ?? 0) > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="gap-2"
              >
                <RefreshCw size={14} />
                History ({prepList?.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowForm(!showForm); setSelectedId(null); }}
              className="gap-2"
            >
              <Plus size={14} />
              New Prep
            </Button>
          </div>
        </div>

        {/* History Drawer */}
        {showHistory && (prepList?.length ?? 0) > 0 && (
          <div
            className="rounded-xl border mb-6 overflow-hidden"
            style={{ background: "var(--color-card)", borderColor: "var(--color-ln-border)" }}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--color-ln-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>Past Sessions</p>
              <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--color-ln-border)" }}>
              {prepList?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-black/4 transition-colors cursor-pointer"
                  style={{ background: selectedId === p.id ? "oklch(from var(--color-ln-navy) l c h / 0.06)" : undefined }}
                  onClick={() => { setSelectedId(p.id); setShowForm(false); setShowHistory(false); }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                      {(p as any).targetRole} @ {(p as any).targetCompany}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date((p as any).createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {(p as any).interviewType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedId === p.id && <Badge variant="outline" className="text-[10px]">Viewing</Badge>}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: p.id }); }}
                      className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Delete session"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        {(showForm || !latestPrep) && !isLoading && (
          <div
            className="rounded-xl border p-5 mb-6"
            style={{ background: "var(--color-card)", borderColor: "var(--color-ln-navy)" }}
          >
            <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>
              New Interview Prep Session
            </p>
            <InterviewPrepForm onGenerated={handleGenerated} prefillCompany={prefillCompany} radarContext={radarContext} />
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : displayPrep && !showForm ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                  {(displayPrep as any).targetRole} @ {(displayPrep as any).targetCompany}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date((displayPrep as any).createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">{(displayPrep as any).interviewType}</Badge>
                {selectedId && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedId(null)} className="text-xs gap-1">
                    View Latest
                  </Button>
                )}
              </div>
            </div>
            <PrepResults prep={displayPrep as any} />
          </div>
        ) : !showForm ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="rounded-2xl p-5 mb-6"
              style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}
            >
              <BookOpen size={36} style={{ color: "var(--color-ln-navy)" }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>
              Prepare for Your Next Interview
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mb-8">
              Enter the role and company, and AI will generate role research, likely questions with suggested answers, a STAR story bank, and key messages to land.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="h-11 px-8 font-semibold"
              style={{ background: "var(--color-ln-navy)", color: "white" }}
            >
              <Sparkles size={16} className="mr-2" /> Start Interview Prep
            </Button>
          </div>
        ) : null}
      </div>
    </PlatformLayout>
  );
}
