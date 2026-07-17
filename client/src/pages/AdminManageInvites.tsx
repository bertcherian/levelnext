import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  Link2,
  Trash2,
  Download,
  Users,
  UserPlus,
  RefreshCw,
  Upload,
  AlertCircle,
} from "lucide-react";

type InviteStatus = "pending" | "accepted" | "expired";

const STATUS_CONFIG: Record<InviteStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
    icon: <Clock size={12} />,
  },
  accepted: {
    label: "Accepted",
    color: "bg-green-500/15 text-green-700 border-green-500/30",
    icon: <CheckCircle2 size={12} />,
  },
  expired: {
    label: "Expired",
    color: "bg-red-500/15 text-red-700 border-red-500/30",
    icon: <XCircle size={12} />,
  },
};

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div
      className="rounded-xl border p-5 flex items-center gap-4"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div className={`rounded-lg p-2.5 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function AdminManageInvites() {
  const { data, isLoading, refetch } = trpc.platformInvites.listInvites.useQuery();

  const createInvite = trpc.platformInvites.generateInvite.useMutation({
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteProductId("leadership_intelligence");
      toast.success("Invite sent! The magic link email is on its way.");
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const resendInvite = trpc.platformInvites.resendInvite.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Invite resent! A fresh magic link email is on its way.");
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const revokeInvite = trpc.platformInvites.revokeInvite.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Invite revoked");
    },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inviteProductId, setInviteProductId] = useState<string>("leadership_intelligence");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  // Bulk invite state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<{ email: string; name: string; valid: boolean; error?: string }[]>([]);
  const [bulkResult, setBulkResult] = useState<{ sent: number; failed: number } | null>(null);

  const bulkInvite = trpc.platformInvites.bulkInvite.useMutation({
    onSuccess: (res) => {
      refetch();
      setBulkResult({ sent: res.sent, failed: res.failed });
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  function handleCSVFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      // Skip header row if it contains 'email' or 'name'
      const start = lines[0]?.toLowerCase().includes("email") ? 1 : 0;
      const rows = lines.slice(start).map((line) => {
        const parts = line.split(",").map((p) => p.replace(/^"|"$/g, "").trim());
        const email = parts[0] ?? "";
        const name = parts[1] ?? "";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const valid = emailRegex.test(email);
        return { email, name, valid, error: valid ? undefined : "Invalid email" };
      }).filter((r) => r.email);
      setBulkRows(rows);
      setBulkResult(null);
    };
    reader.readAsText(file);
  }

  function handleBulkSend() {
    const valid = bulkRows.filter((r) => r.valid);
    if (!valid.length) return;
    bulkInvite.mutate({
      invitees: valid.map((r) => ({ email: r.email, name: r.name || undefined })),
      origin: window.location.origin,
    });
  }

  const invites = data ?? [];

  // Auto-detect expired invites (expiresAt in the past but still "pending")
  const now = new Date();
  const enriched = invites.map((inv) => ({
    ...inv,
    effectiveStatus:
      inv.status === "pending" && new Date(inv.expiresAt) < now
        ? ("expired" as InviteStatus)
        : (inv.status as InviteStatus),
  }));

  const filtered = enriched.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      inv.email.toLowerCase().includes(q) ||
      (inv.name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || inv.effectiveStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = enriched.length;
  const pending = enriched.filter((i) => i.effectiveStatus === "pending").length;
  const accepted = enriched.filter((i) => i.effectiveStatus === "accepted").length;
  const expired = enriched.filter((i) => i.effectiveStatus === "expired").length;

  function handleRevoke(id: number) {
    if (!confirm("Revoke this invite? The link will stop working immediately.")) return;
    revokeInvite.mutate({ id });
  }

  function handleCopyLink(token: string) {
    const url = `${window.location.origin}/login?invite=${token}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Invite link copied!"));
  }

  function handleSendInvite() {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    createInvite.mutate({
      email: inviteEmail.trim(),
      name: inviteName.trim() || undefined,
      productId: inviteProductId,
      origin: window.location.origin,
    });
  }

  function handleExportCSV() {
    const rows = [
      ["Name", "Email", "Status", "Sent", "Accepted", "Expires"],
      ...filtered.map((inv) => [
        inv.name ?? "",
        inv.email,
        inv.effectiveStatus,
        new Date(inv.createdAt).toLocaleDateString(),
        inv.acceptedAt ? new Date(inv.acceptedAt).toLocaleDateString() : "",
        new Date(inv.expiresAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "levelnext_invites.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PlatformLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
              Manage Invites
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Send magic link invites to clients — they sign in directly with their email, no account needed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
            >
              <Download size={14} />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => { setBulkRows([]); setBulkResult(null); setBulkDialogOpen(true); }}
            >
              <Upload size={14} />
              Bulk Invite
            </Button>
            <Button
              size="sm"
              className="gap-2 font-semibold"
              style={{ background: "var(--color-ln-navy)", color: "white" }}
              onClick={() => setDialogOpen(true)}
            >
              <UserPlus size={15} />
              Send Invite
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Sent"
            value={total}
            icon={<Users size={18} />}
            color="bg-blue-500/15 text-blue-600"
          />
          <StatCard
            label="Pending"
            value={pending}
            icon={<Clock size={18} />}
            color="bg-yellow-500/15 text-yellow-600"
          />
          <StatCard
            label="Accepted"
            value={accepted}
            icon={<CheckCircle2 size={18} />}
            color="bg-green-500/15 text-green-600"
          />
          <StatCard
            label="Expired"
            value={expired}
            icon={<XCircle size={18} />}
            color="bg-red-500/15 text-red-600"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "pending", "accepted", "expired"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  statusFilter === s
                    ? "border-ln-navy text-ln-navy bg-ln-navy/8"
                    : "border-border text-muted-foreground hover:border-ln-navy/40"
                }`}
                style={statusFilter === s ? { borderColor: "var(--color-ln-navy)", color: "var(--color-ln-navy)", background: "oklch(from var(--color-ln-navy) l c h / 0.06)" } : {}}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Mail size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground mb-4">
                {invites.length === 0
                  ? "No invites sent yet. Click \"Send Invite\" to invite your first client."
                  : "No invites match your search."}
              </p>
              {invites.length === 0 && (
                <Button
                  size="sm"
                  className="gap-2 font-semibold"
                  style={{ background: "var(--color-ln-navy)", color: "white" }}
                  onClick={() => setDialogOpen(true)}
                >
                  <UserPlus size={15} />
                  Send First Invite
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <th className="px-5 py-3 text-left">Invitee</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left hidden sm:table-cell">Sent</th>
                    <th className="px-5 py-3 text-left hidden md:table-cell">Accepted</th>
                    <th className="px-5 py-3 text-left hidden md:table-cell">Expires</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                  {filtered.map((inv) => {
                    const cfg = STATUS_CONFIG[inv.effectiveStatus];
                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-black/[0.02] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium leading-tight">{inv.name || <span className="text-muted-foreground italic">No name</span>}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{inv.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            variant="outline"
                            className={`gap-1 text-xs font-medium ${cfg.color}`}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">
                          {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">
                          {inv.acceptedAt
                            ? new Date(inv.acceptedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : <span className="opacity-40">—</span>}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">
                          {new Date(inv.expiresAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Copy link — only for pending invites */}
                            {inv.effectiveStatus === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-ln-navy"
                                title="Copy invite link"
                                onClick={() => handleCopyLink(inv.token)}
                              >
                                <Link2 size={15} />
                              </Button>
                            )}
                            {/* Revoke — only for pending invites */}
                            {inv.effectiveStatus === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                                title="Revoke invite"
                                disabled={revokeInvite.isPending}
                                onClick={() => handleRevoke(inv.id)}
                              >
                                <Trash2 size={15} />
                              </Button>
                            )}
                            {/* Resend + Copy Link — only for expired invites */}
                            {inv.effectiveStatus === "expired" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-ln-navy"
                                  title="Resend invite with fresh 7-day link"
                                  disabled={resendInvite.isPending}
                                  onClick={() => resendInvite.mutate({ id: inv.id, origin: window.location.origin })}
                                >
                                  <RefreshCw size={13} />
                                  Resend
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-ln-navy"
                                  title="Copy invite link"
                                  onClick={() => handleCopyLink(inv.token)}
                                >
                                  <Link2 size={15} />
                                </Button>
                              </>
                            )}
                            {inv.effectiveStatus === "accepted" && (
                              <span className="text-xs text-muted-foreground opacity-40 pr-1">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            Showing {filtered.length} of {total} invite{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Bulk Invite Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={(o) => { if (!bulkInvite.isPending) setBulkDialogOpen(o); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Invite via CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with two columns: <strong>email</strong> (required) and <strong>name</strong> (optional). A magic link email will be sent to each valid address.
            </DialogDescription>
          </DialogHeader>

          {!bulkResult ? (
            <div className="space-y-4 py-2">
              {/* File picker */}
              <label
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-muted/40 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCSVFile(f); }}
              >
                <Upload size={24} className="text-muted-foreground" />
                <span className="text-sm font-medium">Click to upload or drag &amp; drop a CSV file</span>
                <span className="text-xs text-muted-foreground">Format: email, name (one row per person)</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSVFile(f); }}
                />
              </label>

              {/* Preview table */}
              {bulkRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {bulkRows.filter((r) => r.valid).length} valid · {bulkRows.filter((r) => !r.valid).length} invalid
                    </p>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setBulkRows([])}>
                      Clear
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border text-sm">
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Email</th>
                          <th className="px-3 py-2 text-left font-medium">Name</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map((row, i) => (
                          <tr key={i} className={row.valid ? "" : "bg-red-50"}>
                            <td className="px-3 py-1.5">{row.email}</td>
                            <td className="px-3 py-1.5 text-muted-foreground">{row.name || "—"}</td>
                            <td className="px-3 py-1.5">
                              {row.valid ? (
                                <span className="text-green-600 text-xs font-medium">✓ Valid</span>
                              ) : (
                                <span className="text-red-600 text-xs flex items-center gap-1">
                                  <AlertCircle size={11} /> {row.error}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 size={40} className="mx-auto text-green-500" />
              <p className="text-lg font-semibold">{bulkResult.sent} invite{bulkResult.sent !== 1 ? "s" : ""} sent!</p>
              {bulkResult.failed > 0 && (
                <p className="text-sm text-red-600">{bulkResult.failed} failed — check the email addresses and try again.</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)} disabled={bulkInvite.isPending}>
              {bulkResult ? "Close" : "Cancel"}
            </Button>
            {!bulkResult && (
              <Button
                onClick={handleBulkSend}
                disabled={bulkInvite.isPending || bulkRows.filter((r) => r.valid).length === 0}
                className="gap-2 font-semibold"
                style={{ background: "var(--color-ln-navy)", color: "white" }}
              >
                {bulkInvite.isPending ? (
                  <>Sending…</>
                ) : (
                  <>
                    <Mail size={15} />
                    Send {bulkRows.filter((r) => r.valid).length > 0 ? `${bulkRows.filter((r) => r.valid).length} Invites` : "Invites"}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Invite Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Invite</DialogTitle>
            <DialogDescription>
              Enter the client's details. They'll receive a magic link email — one click and they're in LevelNext, no account needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name">Full Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="invite-name"
                placeholder="e.g. Priya Sharma"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email Address <span className="text-red-500">*</span></Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="e.g. priya@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-product">Platform Access</Label>
              <Select value={inviteProductId} onValueChange={setInviteProductId}>
                <SelectTrigger id="invite-product">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leadership_intelligence">Leadership Intelligence</SelectItem>
                  <SelectItem value="career_intelligence">Career Intelligence</SelectItem>
                  <SelectItem value="manager_effectiveness">Manager Effectiveness</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">The user will be auto-enrolled in this platform on first sign-in.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={createInvite.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleSendInvite}
              disabled={createInvite.isPending || !inviteEmail.trim()}
              className="gap-2 font-semibold"
              style={{ background: "var(--color-ln-navy)", color: "white" }}
            >
              {createInvite.isPending ? (
                <>Sending…</>
              ) : (
                <>
                  <Mail size={15} />
                  Send Magic Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PlatformLayout>
  );
}
