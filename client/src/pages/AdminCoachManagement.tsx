import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, UserPlus, Trash2, Users, ChevronDown, ChevronUp } from "lucide-react";

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Add Coach Dialog ─────────────────────────────────────────────────────────
function AddCoachDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: allUsers } = trpc.adminCoach.listUsers.useQuery();
  const createCoach = trpc.adminCoach.createCoach.useMutation({
    onSuccess: () => { toast.success("Coach added successfully."); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const [userId, setUserId] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [specialisation, setSpecialisation] = useState("");

  const handleUserSelect = (val: string) => {
    setUserId(val);
    const u = allUsers?.find(u => String(u.id) === val);
    if (u) { setName(u.name ?? ""); setEmail(u.email ?? ""); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Coach</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Select Platform User</Label>
            <Select value={userId} onValueChange={handleUserSelect}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a user…" />
              </SelectTrigger>
              <SelectContent>
                {allUsers?.map(u => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name ?? u.email} {u.email && u.name ? `(${u.email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Display Name</Label>
            <Input className="mt-1" value={name} onChange={e => setName(e.target.value)} placeholder="Coach's full name" />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-1" value={email} onChange={e => setEmail(e.target.value)} placeholder="coach@example.com" />
          </div>
          <div>
            <Label>Specialisation <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Input className="mt-1" value={specialisation} onChange={e => setSpecialisation(e.target.value)} placeholder="e.g. Executive Presence, Difficult Conversations" />
          </div>
          <div>
            <Label>Bio <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Textarea className="mt-1 resize-none" rows={2} value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief background…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-[#0F1F3D] text-white hover:bg-[#1a2f55]"
            disabled={!userId || !name || !email || createCoach.isPending}
            onClick={() => createCoach.mutate({ userId: Number(userId), name, email, bio: bio || undefined, specialisation: specialisation || undefined })}
          >
            {createCoach.isPending ? "Adding…" : "Add Coach"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign Client Dialog ─────────────────────────────────────────────────────
function AssignClientDialog({ coachId, coachName, onClose, onSuccess }: { coachId: number; coachName: string; onClose: () => void; onSuccess: () => void }) {
  const { data: allUsers } = trpc.adminCoach.listUsers.useQuery();
  const assignClient = trpc.adminCoach.assignClient.useMutation({
    onSuccess: () => { toast.success("Client assigned successfully."); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const [clientUserId, setClientUserId] = useState<string>("");
  const [notes, setNotes] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Client to {coachName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Select Client</Label>
            <Select value={clientUserId} onValueChange={setClientUserId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a user…" />
              </SelectTrigger>
              <SelectContent>
                {allUsers?.map(u => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name ?? u.email} {u.email && u.name ? `(${u.email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Textarea className="mt-1 resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Context for this coaching relationship…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-[#0F1F3D] text-white hover:bg-[#1a2f55]"
            disabled={!clientUserId || assignClient.isPending}
            onClick={() => assignClient.mutate({ coachId, clientUserId: Number(clientUserId), notes: notes || undefined })}
          >
            {assignClient.isPending ? "Assigning…" : "Assign Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Coach Row ────────────────────────────────────────────────────────────────
function CoachRow({ coach, onRefresh }: { coach: { id: number; name: string; email: string; specialisation: string | null; clientCount: number; createdAt: Date | string }; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const { data: assignments, refetch: refetchAssignments } = trpc.adminCoach.listAssignments.useQuery(
    { coachId: coach.id },
    { enabled: expanded }
  );

  const removeAssignment = trpc.adminCoach.removeAssignment.useMutation({
    onSuccess: () => { toast.success("Assignment removed."); refetchAssignments(); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#0F1F3D] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {coach.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-[#0F1F3D]">{coach.name}</h3>
                <p className="text-xs text-slate-400">{coach.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />{coach.clientCount} client{coach.clientCount !== 1 ? "s" : ""}
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
                  onClick={() => setExpanded(e => !e)}
                  className="text-slate-400 hover:text-[#0F1F3D] transition-colors"
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {coach.specialisation && (
              <p className="text-xs text-slate-500 mt-1">{coach.specialisation}</p>
            )}
          </div>
        </div>
      </div>

      {/* Expanded client list */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
          {!assignments ? (
            <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : assignments.filter(a => a.isActive).length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No clients assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {assignments.filter(a => a.isActive).map(a => (
                <div key={a.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-[#0F1F3D]">{a.clientName}</p>
                    <p className="text-xs text-slate-400">{a.clientEmail} · Assigned {formatDate(a.assignedAt)}</p>
                    {a.notes && <p className="text-xs text-slate-500 italic mt-0.5">{a.notes}</p>}
                  </div>
                  <button
                    onClick={() => removeAssignment.mutate({ assignmentId: a.id })}
                    className="text-slate-300 hover:text-red-400 transition-colors ml-3"
                    title="Remove assignment"
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
        <AssignClientDialog
          coachId={coach.id}
          coachName={coach.name}
          onClose={() => setShowAssign(false)}
          onSuccess={() => { refetchAssignments(); onRefresh(); }}
        />
      )}
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCoachManagement() {
  const [showAddCoach, setShowAddCoach] = useState(false);
  const { data: coaches, isLoading, refetch } = trpc.adminCoach.listCoaches.useQuery();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0F1F3D]">Coach Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage coaches and their client assignments</p>
        </div>
        <Button
          className="bg-[#0F1F3D] text-white hover:bg-[#1a2f55]"
          onClick={() => setShowAddCoach(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Coach
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : !coaches || coaches.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No coaches added yet.</p>
          <p className="text-xs mt-1">Click "Add Coach" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coaches.map(c => (
            <CoachRow key={c.id} coach={c} onRefresh={refetch} />
          ))}
        </div>
      )}

      {showAddCoach && (
        <AddCoachDialog onClose={() => setShowAddCoach(false)} onSuccess={refetch} />
      )}
    </div>
  );
}
