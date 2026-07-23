import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload, FileText, Trash2, Target, BookOpen, BarChart2, FolderOpen,
  ExternalLink, Loader2, Sparkles, ChevronDown, ChevronUp, CheckCircle2,
} from "lucide-react";

type DocType = "work_goals" | "idp" | "prior_assessment" | "other";

interface Objective {
  objective: string;
  category: string;
  priority: "high" | "medium" | "low";
}

const TAB_CONFIG: { key: DocType; label: string; icon: React.ReactNode; description: string; canExtract: boolean }[] = [
  {
    key: "work_goals",
    label: "Work Goals",
    icon: <Target size={14} />,
    description: "Upload your current work goals, OKRs, or performance targets. AI can extract key objectives automatically.",
    canExtract: true,
  },
  {
    key: "idp",
    label: "Development Plan",
    icon: <BookOpen size={14} />,
    description: "Upload your Individual Development Plan (IDP) or learning plan. AI can extract development priorities.",
    canExtract: true,
  },
  {
    key: "prior_assessment",
    label: "Other Assessments",
    icon: <BarChart2 size={14} />,
    description: "Upload prior assessments — MBTI, DISC, Hogan, 360 feedback, or any other.",
    canExtract: false,
  },
  {
    key: "other",
    label: "Other Documents",
    icon: <FolderOpen size={14} />,
    description: "Upload any other relevant documents for your coaching journey.",
    canExtract: false,
  },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: "oklch(40% 0.2 25)",
  medium: "oklch(50% 0.18 60)",
  low: "oklch(45% 0.1 248.6)",
};
const PRIORITY_BG: Record<string, string> = {
  high: "oklch(97% 0.04 25)",
  medium: "oklch(98% 0.03 60)",
  low: "oklch(96% 0.01 248.6)",
};
const CATEGORY_LABELS: Record<string, string> = {
  performance: "Performance",
  development: "Development",
  leadership: "Leadership",
  business: "Business",
  personal: "Personal",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/png",
  "image/jpeg",
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ObjectivesPanel({ objectives, extractedAt }: { objectives: Objective[]; extractedAt?: string | null }) {
  const [expanded, setExpanded] = useState(true);
  const byPriority = {
    high: objectives.filter((o) => o.priority === "high"),
    medium: objectives.filter((o) => o.priority === "medium"),
    low: objectives.filter((o) => o.priority === "low"),
  };

  return (
    <div className="mt-3 rounded-xl border" style={{ borderColor: "oklch(88% 0.04 248.6)", background: "oklch(98% 0.01 248.6)" }}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: "var(--color-ln-yellow)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--color-ln-navy)" }}>
            AI-Extracted Objectives ({objectives.length})
          </span>
          {extractedAt && (
            <span className="text-[10px]" style={{ color: "oklch(55% 0.02 248.6)" }}>
              · {new Date(extractedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {(["high", "medium", "low"] as const).map((priority) =>
            byPriority[priority].length > 0 ? (
              <div key={priority}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: PRIORITY_COLORS[priority] }}>
                  {priority === "high" ? "High Priority" : priority === "medium" ? "Medium Priority" : "Lower Priority"}
                </p>
                <div className="space-y-1.5">
                  {byPriority[priority].map((obj, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-lg px-3 py-2"
                      style={{ background: PRIORITY_BG[priority] }}
                    >
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: PRIORITY_COLORS[priority] }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug" style={{ color: "oklch(25% 0.02 248.6)" }}>
                          {obj.objective}
                        </p>
                        <span className="text-[10px] mt-0.5 inline-block" style={{ color: "oklch(55% 0.02 248.6)" }}>
                          {CATEGORY_LABELS[obj.category] ?? obj.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

export default function MEPLeaderDocuments() {
  const [activeTab, setActiveTab] = useState<DocType>("work_goals");
  const [uploading, setUploading] = useState(false);
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [extractingId, setExtractingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docs, refetch } = trpc.mepDocuments.listDocuments.useQuery({});
  const uploadMutation = trpc.mepDocuments.uploadDocument.useMutation({
    onSuccess: () => { refetch(); toast.success("Document uploaded successfully."); },
    onError: (e) => toast.error(`Upload failed: ${e.message}`),
  });
  const deleteMutation = trpc.mepDocuments.deleteDocument.useMutation({
    onSuccess: () => { refetch(); toast.success("Document deleted."); },
    onError: () => toast.error("Could not delete document."),
  });
  const updateNotesMutation = trpc.mepDocuments.updateNotes.useMutation({
    onSuccess: () => { refetch(); setEditingNotes(null); toast.success("Notes saved."); },
    onError: () => toast.error("Could not save notes."),
  });
  const extractMutation = trpc.mepDocuments.extractObjectives.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(`Extracted ${data.count} objective${data.count !== 1 ? "s" : ""} from your document.`);
    },
    onError: (e) => toast.error(`Extraction failed: ${e.message}`),
    onSettled: () => setExtractingId(null),
  });

  const handleFileUpload = async (file: File, docType: DocType) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("File type not supported. Please upload PDF, Word, Excel, TXT, or image files.");
      return;
    }
    setUploading(true);
    try {
      const base64Data = await fileToBase64(file);
      await uploadMutation.mutateAsync({
        docType,
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        base64Data,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent, docType: DocType) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file, docType);
  };

  const handleExtract = (docId: number) => {
    setExtractingId(docId);
    extractMutation.mutate({ id: docId });
  };

  const docsForTab = (tab: DocType) => docs?.filter((d: any) => d.docType === tab) ?? [];
  const currentTabConfig = TAB_CONFIG.find((t) => t.key === activeTab)!;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>
            My Documents
          </h1>
          <p className="text-sm" style={{ color: "oklch(45% 0.02 248.6)" }}>
            Upload your work goals, development plans, and prior assessments. AI can extract key objectives from Work Goals and IDPs to enrich your coaching context.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocType)}>
          <TabsList className="w-full grid grid-cols-4 h-auto p-1 rounded-xl" style={{ background: "oklch(92% 0.01 248.6)" }}>
            {TAB_CONFIG.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex items-center gap-1.5 text-xs font-medium py-2 rounded-lg data-[state=active]:shadow-sm"
                style={{ color: activeTab === tab.key ? "var(--color-ln-navy)" : "oklch(50% 0.02 248.6)" }}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.canExtract && (
                  <Sparkles size={10} className="hidden sm:inline" style={{ color: "var(--color-ln-yellow)" }} />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {TAB_CONFIG.map((tab) => {
            const tabDocs = docsForTab(tab.key);
            return (
              <TabsContent key={tab.key} value={tab.key} className="mt-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm" style={{ color: "oklch(45% 0.02 248.6)" }}>{tab.description}</p>
                  {tab.canExtract && (
                    <Badge
                      className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.15)", color: "oklch(40% 0.15 80)", border: "none" }}
                    >
                      <Sparkles size={9} className="mr-1" />
                      AI Extraction
                    </Badge>
                  )}
                </div>

                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                  style={{ background: dragging ? undefined : "white" }}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => handleDrop(e, tab.key)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-ln-navy)" }} />
                      <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>Uploading…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} style={{ color: "oklch(60% 0.02 248.6)" }} />
                      <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                        Drop a file here or click to browse
                      </p>
                      <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>
                        PDF, Word, Excel, TXT, PNG, JPG — max 10 MB
                      </p>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, tab.key);
                    e.target.value = "";
                  }}
                />

                {/* Document list */}
                {tabDocs.length === 0 ? (
                  <div className="text-center py-8" style={{ color: "oklch(55% 0.02 248.6)" }}>
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No documents uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tabDocs.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="rounded-xl p-4 border"
                        style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <FileText size={18} className="mt-0.5 shrink-0" style={{ color: "var(--color-ln-navy)" }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: "var(--color-ln-navy)" }}>
                                {doc.fileName}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: "oklch(55% 0.02 248.6)" }}>
                                {doc.fileSizeBytes ? formatBytes(doc.fileSizeBytes) : ""} ·{" "}
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                              {doc.notes && editingNotes !== doc.id && (
                                <p className="text-xs mt-1 italic" style={{ color: "oklch(50% 0.02 248.6)" }}>
                                  {doc.notes}
                                </p>
                              )}
                              {editingNotes === doc.id && (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    value={notesText}
                                    onChange={(e) => setNotesText(e.target.value)}
                                    placeholder="Add notes about this document…"
                                    className="text-xs min-h-[60px] resize-none"
                                    rows={3}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="text-xs h-7"
                                      style={{ background: "var(--color-ln-navy)", color: "white" }}
                                      onClick={() => updateNotesMutation.mutate({ id: doc.id, notes: notesText })}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7"
                                      onClick={() => setEditingNotes(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {/* AI Extract button — only for work_goals and idp */}
                            {tab.canExtract && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 gap-1 text-xs font-medium"
                                title="Extract objectives with AI"
                                disabled={extractingId === doc.id}
                                onClick={() => handleExtract(doc.id)}
                                style={{ color: "oklch(50% 0.15 80)" }}
                              >
                                {extractingId === doc.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Sparkles size={12} />
                                )}
                                <span className="hidden sm:inline">
                                  {extractingId === doc.id ? "Extracting…" : doc.extractedObjectives?.length ? "Re-extract" : "Extract"}
                                </span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title="Open document"
                              onClick={() => window.open(doc.fileUrl, "_blank")}
                            >
                              <ExternalLink size={13} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title={editingNotes === doc.id ? "Cancel editing" : "Edit notes"}
                              onClick={() => {
                                if (editingNotes === doc.id) {
                                  setEditingNotes(null);
                                } else {
                                  setEditingNotes(doc.id);
                                  setNotesText(doc.notes ?? "");
                                }
                              }}
                            >
                              <FileText size={13} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                              title="Delete document"
                              onClick={() => {
                                if (confirm(`Delete "${doc.fileName}"?`)) {
                                  deleteMutation.mutate({ id: doc.id });
                                }
                              }}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>

                        {/* Extracted objectives panel */}
                        {doc.extractedObjectives && doc.extractedObjectives.length > 0 && (
                          <ObjectivesPanel
                            objectives={doc.extractedObjectives}
                            extractedAt={doc.extractedAt}
                          />
                        )}

                        {/* Extraction prompt for eligible docs without extraction yet */}
                        {tab.canExtract && (!doc.extractedObjectives || doc.extractedObjectives.length === 0) && extractingId !== doc.id && (
                          <div
                            className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer"
                            style={{ background: "oklch(98% 0.02 80)", border: "1px dashed oklch(85% 0.08 80)" }}
                            onClick={() => handleExtract(doc.id)}
                          >
                            <Sparkles size={13} style={{ color: "var(--color-ln-yellow)" }} />
                            <p className="text-xs" style={{ color: "oklch(45% 0.1 80)" }}>
                              Click to extract key objectives with AI — takes about 10 seconds
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
