import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload, CheckCircle2, XCircle, AlertCircle, Download, Loader2, Users, FileSpreadsheet,
} from "lucide-react";

type ValidRow = {
  rowIndex: number;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
};

type ErrorRow = {
  rowIndex: number;
  raw: Record<string, string>;
  errors: string[];
};

type ParseResult = {
  headers: string[];
  totalRows: number;
  validCount: number;
  errorCount: number;
  validRows: ValidRow[];
  errorRows: ErrorRow[];
};

const SAMPLE_CSV = `name,email,phone,designation,department
Jane Smith,jane.smith@company.com,+91 98765 43210,Senior Manager,Engineering
Rahul Verma,rahul.verma@company.com,+91 87654 32109,Director,Product
Priya Nair,priya.nair@company.com,,VP Engineering,Technology`;

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "levelnext_participants_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminParticipantImport() {
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [sendEmails, setSendEmails] = useState(true);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseMutation = trpc.participantImport.parseCsv.useMutation({
    onSuccess: (data) => {
      setParseResult(data as ParseResult);
      setStep("preview");
    },
    onError: (e) => toast.error(`Parse failed: ${e.message}`),
  });

  const bulkInviteMutation = trpc.participantImport.bulkInvite.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      setStep("done");
    },
    onError: (e) => toast.error(`Import failed: ${e.message}`),
  });

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Please upload a CSV file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Maximum 2 MB.");
      return;
    }
    const text = await file.text();
    parseMutation.mutate({ csvText: text });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;
    bulkInviteMutation.mutate({
      participants: parseResult.validRows.map((r) => ({
        name: r.name,
        email: r.email,
        phone: r.phone,
        designation: r.designation,
        department: r.department,
      })),
      sendEmails,
    });
  };

  const reset = () => {
    setStep("upload");
    setParseResult(null);
    setImportResult(null);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>
            Bulk Participant Import
          </h1>
          <p className="text-sm" style={{ color: "oklch(45% 0.02 248.6)" }}>
            Upload a CSV file to invite multiple participants at once. Each participant will receive a magic link invitation.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs">
          {["upload", "preview", "done"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step === s ? "var(--color-ln-navy)" : step === "done" || (step === "preview" && i === 0) ? "oklch(60% 0.1 145)" : "oklch(88% 0.01 248.6)",
                  color: step === s || step === "done" || (step === "preview" && i === 0) ? "white" : "oklch(50% 0.02 248.6)",
                }}
              >
                {(step === "done" || (step === "preview" && i === 0)) && i < (step === "done" ? 2 : 1) ? "✓" : i + 1}
              </div>
              <span style={{ color: step === s ? "var(--color-ln-navy)" : "oklch(55% 0.02 248.6)", fontWeight: step === s ? 600 : 400 }}>
                {s === "upload" ? "Upload CSV" : s === "preview" ? "Review & Confirm" : "Done"}
              </span>
              {i < 2 && <span style={{ color: "oklch(70% 0.01 248.6)" }}>→</span>}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* CSV format guide */}
            <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={15} style={{ color: "var(--color-ln-navy)" }} />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>CSV Format</h2>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={downloadSample}>
                  <Download size={11} /> Download Template
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: "oklch(95% 0.005 248.6)" }}>
                      {["name *", "email *", "phone", "designation", "department"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 border font-semibold" style={{ borderColor: "oklch(88% 0.01 248.6)", color: "var(--color-ln-navy)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {["Jane Smith", "jane@company.com", "+91 98765 43210", "Senior Manager", "Engineering"].map((v, i) => (
                        <td key={i} className="px-3 py-2 border" style={{ borderColor: "oklch(88% 0.01 248.6)", color: "oklch(45% 0.02 248.6)" }}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs mt-2" style={{ color: "oklch(55% 0.02 248.6)" }}>
                * Required. Phone, designation, and department are optional.
              </p>
            </div>

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              style={{ background: dragging ? undefined : "white" }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {parseMutation.isPending ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-ln-navy)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>Parsing CSV…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload size={28} style={{ color: "oklch(60% 0.02 248.6)" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                      Drop your CSV here or click to browse
                    </p>
                    <p className="text-xs mt-1" style={{ color: "oklch(55% 0.02 248.6)" }}>
                      CSV files only — max 2 MB — up to 500 participants
                    </p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && parseResult && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Rows", value: parseResult.totalRows, icon: <Users size={16} />, color: "oklch(45% 0.02 248.6)" },
                { label: "Valid", value: parseResult.validCount, icon: <CheckCircle2 size={16} />, color: "oklch(50% 0.15 145)" },
                { label: "Errors", value: parseResult.errorCount, icon: <XCircle size={16} />, color: parseResult.errorCount > 0 ? "oklch(50% 0.2 25)" : "oklch(55% 0.02 248.6)" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-4 border text-center" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
                  <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(55% 0.02 248.6)" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Error rows */}
            {parseResult.errorRows.length > 0 && (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(85% 0.05 25)" }}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "oklch(97% 0.02 25)" }}>
                  <AlertCircle size={14} style={{ color: "oklch(50% 0.2 25)" }} />
                  <span className="text-xs font-semibold" style={{ color: "oklch(40% 0.2 25)" }}>
                    {parseResult.errorCount} row{parseResult.errorCount !== 1 ? "s" : ""} will be skipped
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {parseResult.errorRows.slice(0, 10).map((row) => (
                    <div key={row.rowIndex} className="px-4 py-2.5 text-xs" style={{ background: "oklch(99% 0.01 25)" }}>
                      <span className="font-medium" style={{ color: "oklch(40% 0.2 25)" }}>Row {row.rowIndex}:</span>{" "}
                      <span style={{ color: "oklch(45% 0.02 248.6)" }}>{row.errors.join("; ")}</span>
                    </div>
                  ))}
                  {parseResult.errorRows.length > 10 && (
                    <div className="px-4 py-2 text-xs" style={{ color: "oklch(55% 0.02 248.6)", background: "oklch(99% 0.01 25)" }}>
                      …and {parseResult.errorRows.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Valid rows preview */}
            {parseResult.validRows.length > 0 && (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(90% 0.01 248.6)" }}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "oklch(97% 0.01 145)" }}>
                  <CheckCircle2 size={14} style={{ color: "oklch(50% 0.15 145)" }} />
                  <span className="text-xs font-semibold" style={{ color: "oklch(35% 0.15 145)" }}>
                    {parseResult.validCount} participant{parseResult.validCount !== 1 ? "s" : ""} ready to invite
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "oklch(95% 0.005 248.6)" }}>
                        {["Name", "Email", "Phone", "Designation", "Department"].map((h) => (
                          <th key={h} className="text-left px-3 py-2 font-semibold border-b" style={{ borderColor: "oklch(90% 0.01 248.6)", color: "var(--color-ln-navy)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.validRows.slice(0, 20).map((row) => (
                        <tr key={row.rowIndex} className="border-b" style={{ borderColor: "oklch(93% 0.005 248.6)" }}>
                          <td className="px-3 py-2" style={{ color: "var(--color-ln-navy)" }}>{row.name}</td>
                          <td className="px-3 py-2" style={{ color: "oklch(45% 0.02 248.6)" }}>{row.email}</td>
                          <td className="px-3 py-2" style={{ color: "oklch(50% 0.02 248.6)" }}>{row.phone || "—"}</td>
                          <td className="px-3 py-2" style={{ color: "oklch(50% 0.02 248.6)" }}>{row.designation || "—"}</td>
                          <td className="px-3 py-2" style={{ color: "oklch(50% 0.02 248.6)" }}>{row.department || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parseResult.validRows.length > 20 && (
                    <p className="px-4 py-2 text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>
                      …and {parseResult.validRows.length - 20} more rows
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Options */}
            <div className="rounded-xl p-4 border flex items-center gap-3" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
              <input
                type="checkbox"
                id="sendEmails"
                checked={sendEmails}
                onChange={(e) => setSendEmails(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="sendEmails" className="text-sm cursor-pointer" style={{ color: "var(--color-ln-navy)" }}>
                Send invitation emails with magic links to all valid participants
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={reset} className="text-sm">
                Start Over
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={bulkInviteMutation.isPending || parseResult.validCount === 0}
                style={{ background: "var(--color-ln-navy)", color: "white" }}
              >
                {bulkInviteMutation.isPending
                  ? <><Loader2 size={14} className="animate-spin mr-1.5" />Importing…</>
                  : <>Import {parseResult.validCount} Participant{parseResult.validCount !== 1 ? "s" : ""}</>}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && importResult && (
          <div className="space-y-4">
            <div className="rounded-2xl p-8 border text-center" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
              <CheckCircle2 size={40} className="mx-auto mb-3" style={{ color: "oklch(50% 0.15 145)" }} />
              <h2 className="text-lg font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>Import Complete</h2>
              <p className="text-sm" style={{ color: "oklch(45% 0.02 248.6)" }}>
                {importResult.summary.invited} participant{importResult.summary.invited !== 1 ? "s" : ""} invited successfully.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Invited", value: importResult.summary.invited, color: "oklch(50% 0.15 145)" },
                { label: "Already Exist", value: importResult.summary.alreadyExists, color: "oklch(55% 0.1 248.6)" },
                { label: "Errors", value: importResult.summary.errors, color: importResult.summary.errors > 0 ? "oklch(50% 0.2 25)" : "oklch(55% 0.02 248.6)" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-4 border text-center" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(55% 0.02 248.6)" }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={reset} style={{ background: "var(--color-ln-navy)", color: "white" }}>
                Import Another File
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
