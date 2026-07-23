import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Upload, FileText, Trash2, Target, BookOpen, BarChart2, FolderOpen, ExternalLink, Loader2,
} from "lucide-react";

type DocType = "work_goals" | "idp" | "prior_assessment" | "other";

const TAB_CONFIG: { key: DocType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    key: "work_goals",
    label: "Work Goals",
    icon: <Target size={14} />,
    description: "Upload your current work goals, OKRs, or performance targets.",
  },
  {
    key: "idp",
    label: "Development Plan",
    icon: <BookOpen size={14} />,
    description: "Upload your Individual Development Plan (IDP) or learning plan.",
  },
  {
    key: "prior_assessment",
    label: "Other Assessments",
    icon: <BarChart2 size={14} />,
    description: "Upload prior assessments — MBTI, DISC, Hogan, 360 feedback, or any other.",
  },
  {
    key: "other",
    label: "Other Documents",
    icon: <FolderOpen size={14} />,
    description: "Upload any other relevant documents for your coaching journey.",
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
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

export default function MEPLeaderDocuments() {
  const [activeTab, setActiveTab] = useState<DocType>("work_goals");
  const [uploading, setUploading] = useState(false);
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");
  const [dragging, setDragging] = useState(false);
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

  const docsForTab = (tab: DocType) => docs?.filter((d: any) => d.docType === tab) ?? [];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>
            My Documents
          </h1>
          <p className="text-sm" style={{ color: "oklch(45% 0.02 248.6)" }}>
            Upload your work goals, development plans, and prior assessments to give your coach and AI Guide richer context.
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
              </TabsTrigger>
            ))}
          </TabsList>

          {TAB_CONFIG.map((tab) => {
            const tabDocs = docsForTab(tab.key);
            return (
              <TabsContent key={tab.key} value={tab.key} className="mt-4 space-y-4">
                <p className="text-sm" style={{ color: "oklch(45% 0.02 248.6)" }}>{tab.description}</p>

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
                  <div className="space-y-3">
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
