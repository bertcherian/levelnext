import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Link2,
  Trash2,
  Download,
  Users,
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
  const revokeInvite = trpc.platformInvites.revokeInvite.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Invite revoked");
    },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    const url = `${window.location.origin}/join?token=${token}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Invite link copied!"));
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
              All magic link invites sent to pilot participants
            </p>
          </div>
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
              <p className="text-sm text-muted-foreground">
                {invites.length === 0
                  ? "No invites sent yet. Use the Send Invite button in Pilot Applications."
                  : "No invites match your search."}
              </p>
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
                            {inv.effectiveStatus !== "pending" && (
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
    </PlatformLayout>
  );
}
