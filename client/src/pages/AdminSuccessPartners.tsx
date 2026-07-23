import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, UserPlus, Trash2, Users, ChevronDown, ChevronUp, UserCheck, Mail, ArrowUpRight } from "lucide-react";

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Invite SP Dialog ─────────────────────────────────────────────────────────
function InviteSPDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const inviteSP = trpc.spAssignments.inviteSP.useMutation({
    onSuccess: (data) => {
      if (data.type === "promoted") {
        toast.success("Existing user promoted to Success Partner.");
      } else {
        toast.success("Invitation sent! The SP will receive a magic link by email.");
      }
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0A1A2F]">Invite Success Partner</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-500">
            If the email already exists on the platform, the user will be promoted immediately.
            Otherwise, a magic link invite will be sent.
          </p>
          <div>
            <Label>Full Name</Label>
            <Input
              className="mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
            />
          </div>
          <div>
            <Label>Email Address</Label>
            <Input
              className="mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="text-white"
            style={{ background: "#0A1A2F" }}
            disabled={!name.trim() || !email.trim() || inviteSP.isPending}
            onClick={() =>
              inviteSP.mutate({
                name: name.trim(),
                email: email.trim(),
                origin: window.location.origin,
              })
            }
          >
            <Mail className="w-4 h-4 mr-2" />
            {inviteSP.isPending ? "Sending…" : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign User Dialog ───────────────────────────────────────────────────────
function AssignUserDialog({
  spId,
  spName,
  onClose,
  onSuccess,
}: {
  spId: number;
  spName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: unassigned } = trpc.spAssignments.listUnassignedUsers.useQuery();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const assignUser = trpc.spAssignments.assignUser.useMutation({
    onSuccess: () => {
      toast.success("User assigned to Success Partner.");
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0A1A2F]">Assign User to {spName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!unassigned ? (
            <Skeleton className="h-10 w-full" />
          ) : unassigned.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">
              All platform users are already assigned to a Success Partner.
            </p>
          ) : (
            <div>
              <Label>Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a user…" />
                </SelectTrigger>
                <SelectContent>
                  {unassigned.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name ?? u.email} {u.email && u.name ? `(${u.email})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="text-white"
            style={{ background: "#0A1A2F" }}
            disabled={!selectedUserId || assignUser.isPending}
            onClick={() =>
              assignUser.mutate({ spUserId: spId, managedUserId: Number(selectedUserId) })
            }
          >
            {assignUser.isPending ? "Assigning…" : "Assign User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SP Row ───────────────────────────────────────────────────────────────────
function SPRow({
  sp,
  onRefresh,
}: {
  sp: { id: number; name: string | null; email: string | null; assignedCount: number; createdAt: Date | string; lastSignedIn: Date | string };
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const { data: assignments, refetch: refetchAssignments } = trpc.spAssignments.getSPAssignments.useQuery(
    { spUserId: sp.id },
    { enabled: expanded }
  );

  const unassignUser = trpc.spAssignments.unassignUser.useMutation({
    onSuccess: () => {
      toast.success("User removed from cohort.");
      refetchAssignments();
      onRefresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const demoteFromSP = trpc.spAssignments.demoteFromSP.useMutation({
    onSuccess: () => {
      toast.success("Success Partner demoted to user role.");
      onRefresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const displayName = sp.name ?? sp.email ?? "Unknown SP";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm"
            style={{ background: "#0A1A2F" }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-[#0A1A2F]">{displayName}</h3>
                <p className="text-xs text-slate-400">{sp.email ?? ""}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: "#D4AF37", color: "#0A1A2F" }}
                >
                  <Users className="w-3 h-3 mr-1" />
                  {sp.assignedCount} leader{sp.assignedCount !== 1 ? "s" : ""}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => setShowAssign(true)}
                >
                  <UserPlus className="w-3 h-3 mr-1" /> Assign
                </Button>
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="text-slate-400 hover:text-[#0A1A2F] transition-colors"
                  title={expanded ? "Collapse" : "View cohort"}
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-slate-400">Added {formatDate(sp.createdAt)}</span>
              {sp.lastSignedIn && (
                <span className="text-xs text-slate-400">
                  Last active {formatDate(sp.lastSignedIn)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded cohort list */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assigned Leaders</p>
            <button
              onClick={() =>
                demoteFromSP.mutate({ userId: sp.id })
              }
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
              title="Remove SP role"
            >
              Remove SP Role
            </button>
          </div>

          {!assignments ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No leaders assigned yet. Click "Assign" to add leaders to this SP's cohort.</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((a) => (
                <div
                  key={a.assignmentId}
                  className="flex items-center justify-between bg-white rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[#0A1A2F]">{a.user.name ?? a.user.email}</p>
                    <p className="text-xs text-slate-400">
                      {a.user.email} · Assigned {formatDate(a.assignedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      unassignUser.mutate({ spUserId: sp.id, managedUserId: a.user.id })
                    }
                    className="text-slate-300 hover:text-red-400 transition-colors ml-3"
                    title="Remove from cohort"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAssign && (
        <AssignUserDialog
          spId={sp.id}
          spName={displayName}
          onClose={() => setShowAssign(false)}
          onSuccess={() => {
            refetchAssignments();
            onRefresh();
          }}
        />
      )}
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSuccessPartners() {
  const [showInvite, setShowInvite] = useState(false);
  const { data: sps, isLoading, refetch } = trpc.spAssignments.listSPs.useQuery();

  const totalAssigned = sps?.reduce((sum, sp) => sum + sp.assignedCount, 0) ?? 0;

  return (
    <PlatformLayout>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#0A1A2F]">Success Partners</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Invite and manage Success Partners and their leader cohorts
            </p>
          </div>
          <Button
            className="text-white flex-shrink-0"
            style={{ background: "#0A1A2F" }}
            onClick={() => setShowInvite(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Invite SP
          </Button>
        </div>

        {/* Stats row */}
        {!isLoading && sps && sps.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-[#0A1A2F]">{sps.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Success Partners</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-[#0A1A2F]">{totalAssigned}</p>
              <p className="text-xs text-slate-500 mt-0.5">Leaders Assigned</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-[#0A1A2F]">
                {sps.length > 0 ? Math.round(totalAssigned / sps.length) : 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Avg per SP</p>
            </div>
          </div>
        )}

        {/* SP list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : !sps || sps.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No Success Partners yet</p>
            <p className="text-xs mt-1 text-slate-400">
              Click "Invite SP" to add your first Success Partner.
            </p>
            <Button
              className="mt-4 text-white"
              style={{ background: "#0A1A2F" }}
              onClick={() => setShowInvite(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Invite First SP
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sps.map((sp) => (
              <SPRow key={sp.id} sp={sp} onRefresh={refetch} />
            ))}
          </div>
        )}

        {/* Info note */}
        {sps && sps.length > 0 && (
          <div className="mt-6 p-4 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5">
            <div className="flex items-start gap-2">
              <ArrowUpRight className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                Success Partners can only see leaders assigned to them. Use the "Assign" button to add leaders to each SP's cohort.
                SPs land on the SP Workspace when they sign in.
              </p>
            </div>
          </div>
        )}
      </div>

      {showInvite && (
        <InviteSPDialog
          onClose={() => setShowInvite(false)}
          onSuccess={refetch}
        />
      )}
    </PlatformLayout>
  );
}
