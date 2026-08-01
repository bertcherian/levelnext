/**
 * My Progress — unified tabbed page combining:
 *   Tab 1: "Commitments"  (formerly ManagerCommitments)
 *   Tab 2: "My Documents" (formerly MEPLeaderDocuments)
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2, Circle, Plus, Target, Loader2, Sparkles, X,
  Upload, FileText, Trash2, BarChart2, FolderOpen, ExternalLink,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Commitments constants ─────────────────────────────────────────────────────

const BEHAVIOUR_CATEGORIES = [
  "Communication", "Delegation", "Feedback", "Team Development",
  "Decision Making", "Accountability", "Wellbeing", "Strategic Thinking",
];

// ── Documents constants ───────────────────────────────────────────────────────

type DocType = "work_goals" | "idp" | "prior_assessment" | "other";

interface Objective {
  objective: string;
  category: string;
  priority: "high" | "medium" | "low";
}

const TAB_CONFIG: { key: DocType; label: string; icon: React.ReactNode; description: string; canExtract: boolean }[] = [
  { key: "work_goals", label: "Work Goals", icon: <Target size={14} />, description: "Upload your current work goals, OKRs, or performance targets.", canExtract: true },
  { key: "idp", label: "Dev Plan", icon: <BarChart2 size={14} />, description: "Upload your Individual Development Plan or learning goals.", canExtract: false },
  { key: "prior_assessment", label: "Assessments", icon: <CheckCircle2 size={14} />, description: "Upload prior 360° feedback, performance reviews, or assessments.", canExtract: false },
  { key: "other", label: "Other", icon: <FolderOpen size={14} />, description: "Any other relevant documents for your manager effectiveness journey.", canExtract: false },
];

// ── Commitments tab ───────────────────────────────────────────────────────────

function CommitmentsTab() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(BEHAVIOUR_CATEGORIES[0]);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ category: string; title: string; why: string }>>([]);
  const [suggesting, setSuggesting] = useState(false);

  const { data: commitments, refetch } = trpc.mep.listCommitments.useQuery();

  const createMutation = trpc.mep.createCommitment.useMutation({
    onSuccess: () => { refetch(); setTitle(""); setDescription(""); setShowForm(false); setSaving(false); toast.success("Commitment added."); },
    onError: () => { toast.error("Could not save commitment."); setSaving(false); },
  });

  const suggestMutation = trpc.mep.suggestCommitments.useMutation({
    onSuccess: (data) => { setSuggestions(data.suggestions); setSuggesting(false); },
    onError: () => { toast.error("Could not generate suggestions."); setSuggesting(false); },
  });

  const toggleMutation = trpc.mep.updateCommitmentStatus.useMutation({
    onSuccess: () => refetch(),
    onError: () => toast.error("Could not update commitment."),
  });

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Please enter a commitment title."); return; }
    setSaving(true);
    await createMutation.mutateAsync({ commitment: `[${category}] ${title.trim()}${description.trim() ? ` — ${description.trim()}` : ""}` });
  };

  const handleAddSuggestion = async (s: { category: string; title: string; why: string }) => {
    setSaving(true);
    await createMutation.mutateAsync({ commitment: `[${s.category}] ${s.title} — ${s.why}` });
    setSuggestions((prev) => prev.filter((x) => x.title !== s.title));
    setSaving(false);
  };

  const active = commitments?.filter((c: any) => c.status !== "completed") ?? [];
  const completed = commitments?.filter((c: any) => c.status === "completed") ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>Behaviour Commitments</h2>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>Track the management behaviours you are committed to practising.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="font-semibold text-xs flex-shrink-0" onClick={() => { setSuggesting(true); suggestMutation.mutate(); }} disabled={suggesting}>
            {suggesting ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : <Sparkles size={12} className="mr-1.5" />}
            {suggesting ? "Generating…" : "Suggest for me"}
          </Button>
          <Button size="sm" className="font-semibold text-xs flex-shrink-0" style={{ background: "#34d399", color: "var(--color-ln-navy)" }} onClick={() => setShowForm(!showForm)}>
            <Plus size={13} className="mr-1.5" /> Add
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {commitments && commitments.length > 0 && (
        <div className="rounded-2xl px-5 py-4" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: "var(--color-ln-navy)" }}>Progress</p>
            <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>{completed.length} of {commitments.length} completed</p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(92% 0.01 248.6)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${commitments.length > 0 ? Math.round((completed.length / commitments.length) * 100) : 0}%`, background: "#34d399" }} />
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1.5px solid oklch(from var(--color-ln-gold) l c h / 0.4)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={13} style={{ color: "var(--color-ln-gold)" }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-ln-gold)" }}>AI Suggestions</p>
            </div>
            <button onClick={() => setSuggestions([])} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
          </div>
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: "oklch(98% 0.01 80)", border: "1px solid oklch(92% 0.02 80)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded inline-block mb-1.5" style={{ background: "oklch(from #34d399 l c h / 0.15)", color: "#059669" }}>{s.category}</span>
                  <p className="text-xs font-semibold leading-snug" style={{ color: "var(--color-ln-navy)" }}>{s.title}</p>
                  <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "oklch(50% 0.02 248.6)" }}>{s.why}</p>
                </div>
                <Button size="sm" className="flex-shrink-0 text-[10px] font-bold h-7 px-2.5" style={{ background: "#34d399", color: "var(--color-ln-navy)" }} onClick={() => handleAddSuggestion(s)} disabled={saving}>+ Add</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>New Commitment</h3>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>Category</label>
            <div className="flex flex-wrap gap-1.5">
              {BEHAVIOUR_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                  style={category === cat ? { background: "#34d399", color: "var(--color-ln-navy)" } : { background: "oklch(95% 0.01 248.6)", color: "oklch(40% 0.02 248.6)", border: "1px solid oklch(88% 0.01 248.6)" }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>Commitment</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Give specific feedback in every 1-on-1" className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>Why this matters (optional)</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe why this behaviour matters…" className="text-sm resize-none min-h-[60px]" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 font-semibold text-xs" style={{ background: "#34d399", color: "var(--color-ln-navy)" }} onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 size={12} className="mr-1.5 animate-spin" />Saving…</> : "Save Commitment"}
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {commitments?.length === 0 && !showForm && (
        <div className="rounded-2xl px-6 py-10 text-center" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
          <Target size={28} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
          <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>No commitments yet</h3>
          <p className="text-xs mb-4" style={{ color: "oklch(55% 0.02 248.6)" }}>Add a behaviour you want to practise consistently as a manager.</p>
          <Button size="sm" style={{ background: "#34d399", color: "var(--color-ln-navy)" }} onClick={() => setShowForm(true)}>Add Your First Commitment</Button>
        </div>
      )}

      {/* Active commitments */}
      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(45% 0.02 248.6)" }}>Active ({active.length})</p>
          {active.map((c: any) => (
            <div key={c.id} className="rounded-xl p-4 flex items-start gap-3" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
              <button onClick={() => toggleMutation.mutate({ commitmentId: c.id, status: "completed" })} className="mt-0.5 flex-shrink-0">
                <Circle size={16} style={{ color: "oklch(70% 0.01 248.6)" }} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-ln-navy)" }}>{c.commitment}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed commitments */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(45% 0.02 248.6)" }}>Completed ({completed.length})</p>
          {completed.map((c: any) => (
            <div key={c.id} className="rounded-xl p-4 flex items-start gap-3 opacity-60" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#34d399" }} />
              <p className="text-sm line-through" style={{ color: "oklch(50% 0.02 248.6)" }}>{c.commitment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Documents tab ─────────────────────────────────────────────────────────────

function DocumentsTab() {
  const [activeDocTab, setActiveDocTab] = useState<DocType>("work_goals");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);
  const [extractingId, setExtractingId] = useState<number | null>(null);
  const [extractedObjectives, setExtractedObjectives] = useState<Record<number, Objective[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: documents, refetch } = trpc.mepDocuments.listDocuments.useQuery({});

  const uploadMutation = trpc.mepDocuments.uploadDocument.useMutation({
    onSuccess: () => { refetch(); setUploading(false); toast.success("Document uploaded."); },
    onError: () => { toast.error("Upload failed."); setUploading(false); },
  });

  const deleteMutation = trpc.mepDocuments.deleteDocument.useMutation({
    onSuccess: () => { refetch(); toast.success("Document deleted."); },
    onError: () => toast.error("Could not delete document."),
  });

  const updateNotesMutation = trpc.mepDocuments.updateNotes.useMutation({
    onSuccess: () => { refetch(); toast.success("Notes saved."); },
    onError: () => toast.error("Could not save notes."),
  });

  const extractObjectivesMutation = trpc.mepDocuments.extractObjectives.useMutation({
    onSuccess: (data, variables) => {
      setExtractedObjectives((prev) => ({ ...prev, [variables.id]: data.objectives }));
      setExtractingId(null);
      toast.success("Objectives extracted.");
    },
    onError: () => { toast.error("Could not extract objectives."); setExtractingId(null); },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Data = (ev.target?.result as string).split(",")[1] ?? "";
      await uploadMutation.mutateAsync({
        fileName: file.name,
        base64Data,
        mimeType: file.type || "application/octet-stream",
        fileSizeBytes: file.size,
        docType: activeDocTab,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const filteredDocs = documents?.filter((d: any) => d.docType === activeDocTab) ?? [];
  const activeConfig = TAB_CONFIG.find((t) => t.key === activeDocTab)!;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h2 className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>My Documents</h2>
        <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>Upload your goals, development plans, and assessments to give the AI coach context about you.</p>
      </div>

      {/* Document type tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "oklch(93% 0.01 248.6)" }}>
        {TAB_CONFIG.map((t) => (
          <button key={t.key} onClick={() => setActiveDocTab(t.key)}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all", activeDocTab === t.key ? "bg-white shadow-sm" : "")}
            style={{ color: activeDocTab === t.key ? "var(--color-ln-navy)" : "oklch(50% 0.02 248.6)" }}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Upload area */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
        <p className="text-xs" style={{ color: "oklch(45% 0.02 248.6)" }}>{activeConfig.description}</p>
        <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
        <Button size="sm" className="font-semibold text-xs" style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
          onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <><Loader2 size={12} className="mr-1.5 animate-spin" />Uploading…</> : <><Upload size={12} className="mr-1.5" />Upload Document</>}
        </Button>
        <p className="text-[10px]" style={{ color: "oklch(60% 0.02 248.6)" }}>Supported: .txt, .md, .pdf, .doc, .docx</p>
      </div>

      {/* Document list */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-2xl px-6 py-8 text-center" style={{ background: "oklch(97% 0.005 248.6)", border: "1px dashed oklch(85% 0.01 248.6)" }}>
          <FileText size={24} className="mx-auto mb-2" style={{ color: "oklch(70% 0.01 248.6)" }} />
          <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>No {activeConfig.label.toLowerCase()} uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc: any) => (
            <div key={doc.id} className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
              <div className="flex items-center gap-3 px-4 py-3">
                <FileText size={15} style={{ color: "#60a5fa" }} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--color-ln-navy)" }}>{doc.fileName}</p>
                  <p className="text-[10px]" style={{ color: "oklch(55% 0.02 248.6)" }}>{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {activeConfig.canExtract && (
                    <Button size="sm" variant="outline" className="text-[10px] h-7 px-2"
                      onClick={() => { setExtractingId(doc.id); extractObjectivesMutation.mutate({ id: doc.id }); }}
                      disabled={extractingId === doc.id}>
                      {extractingId === doc.id ? <Loader2 size={11} className="animate-spin" /> : <><Sparkles size={11} className="mr-1" />Extract</>}
                    </Button>
                  )}
                  <button onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)} className="p-1.5 rounded-lg hover:bg-gray-50">
                    {expandedDoc === doc.id ? <ChevronUp size={14} style={{ color: "oklch(55% 0.02 248.6)" }} /> : <ChevronDown size={14} style={{ color: "oklch(55% 0.02 248.6)" }} />}
                  </button>
                  <button onClick={() => deleteMutation.mutate({ id: doc.id })} className="p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 size={13} style={{ color: "#f87171" }} />
                  </button>
                </div>
              </div>

              {expandedDoc === doc.id && (
                <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "oklch(92% 0.01 248.6)" }}>
                  {/* Extracted objectives */}
                  {extractedObjectives[doc.id]?.length > 0 && (
                    <div className="pt-3 space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#34d399" }}>Extracted Objectives</p>
                      {extractedObjectives[doc.id].map((obj, i) => (
                        <div key={i} className="rounded-lg px-3 py-2" style={{ background: "oklch(97% 0.005 248.6)", border: "1px solid oklch(90% 0.01 248.6)" }}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">{obj.category}</Badge>
                            <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full", obj.priority === "high" ? "bg-red-100 text-red-700" : obj.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>
                              {obj.priority}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: "var(--color-ln-navy)" }}>{obj.objective}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Notes */}
                  <div className="pt-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>Notes</label>
                    <Textarea
                      value={notes[doc.id] ?? doc.notes ?? ""}
                      onChange={(e) => setNotes((p) => ({ ...p, [doc.id]: e.target.value }))}
                      placeholder="Add notes about this document…"
                      className="text-xs resize-none min-h-[60px]"
                    />
                    <Button size="sm" className="mt-2 text-xs font-semibold" style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                      onClick={() => updateNotesMutation.mutate({ id: doc.id, notes: notes[doc.id] ?? doc.notes ?? "" })}>
                      Save Notes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ManagerProgress component ───────────────────────────────────────────

export default function ManagerProgress() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      {/* Tab bar */}
      <div className="flex-shrink-0 border-b px-4" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
        <div className="flex items-center gap-1 max-w-5xl mx-auto">
          {[
            { key: "commitments", label: "Commitments", icon: Target },
            { key: "documents", label: "My Documents", icon: FolderOpen },
          ].map(({ key, label, icon: Icon }) => {
            const [activeTab, setActiveTab] = [key, () => {}]; // handled by Tabs below
            return null; // rendered via Tabs component
          })}
        </div>
      </div>

      <Tabs defaultValue="commitments" className="flex-1 flex flex-col">
        <div className="flex-shrink-0 border-b px-4" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
          <TabsList className="h-auto bg-transparent gap-0 p-0 max-w-5xl mx-auto flex">
            <TabsTrigger value="commitments"
              className="flex items-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-none border-b-2 data-[state=active]:border-[#34d399] data-[state=inactive]:border-transparent data-[state=active]:text-[var(--color-ln-navy)] data-[state=inactive]:text-[oklch(55%_0.02_248.6)] bg-transparent shadow-none">
              <Target size={15} /> Commitments
            </TabsTrigger>
            <TabsTrigger value="documents"
              className="flex items-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-none border-b-2 data-[state=active]:border-[#34d399] data-[state=inactive]:border-transparent data-[state=active]:text-[var(--color-ln-navy)] data-[state=inactive]:text-[oklch(55%_0.02_248.6)] bg-transparent shadow-none">
              <FolderOpen size={15} /> My Documents
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="commitments" className="mt-0"><CommitmentsTab /></TabsContent>
          <TabsContent value="documents" className="mt-0"><DocumentsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
