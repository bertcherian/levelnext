import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, Plus, X, TrendingUp, Activity, Zap, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function PEProgress() {
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [newCommitment, setNewCommitment] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const commitments = trpc.pei.listCommitments.useQuery();
  const createCommitment = trpc.pei.createCommitment.useMutation({
    onSuccess: () => {
      commitments.refetch();
      setShowAddCommitment(false);
      setNewCommitment("");
      setNewDueDate("");
      toast.success("Commitment created");
    },
    onError: () => toast.error("Failed to create commitment"),
  });
  const updateCommitment = trpc.pei.updateCommitmentStatus.useMutation({
    onSuccess: () => commitments.refetch(),
  });
  const resultsHistory = trpc.pei.getResultsHistory.useQuery();
  const practiceSessions = trpc.pei.listPracticeSessions.useQuery();
  const coachSessions = trpc.pei.getCoachSessions.useQuery();

  const handleAddCommitment = () => {
    if (!newCommitment.trim()) return;
    createCommitment.mutate({
      text: newCommitment.trim(),
      dueDate: newDueDate || undefined,
    });
  };

  const handleStatusChange = (id: number, status: "completed" | "missed") => {
    updateCommitment.mutate({ commitmentId: id, status });
  };

  const activeCommitments = commitments.data?.filter((c) => c.status === "pending") ?? [];
  const completedCommitments = commitments.data?.filter((c) => c.status === "completed") ?? [];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>My Progress</h1>
        <p className="text-sm mt-1" style={{ color: "oklch(50% 0.02 248.6)" }}>
          Track your commitments, assessment history, and practice sessions.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border p-4" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} style={{ color: "#d4af37" }} />
            <p className="text-xs font-medium" style={{ color: "oklch(55% 0.02 248.6)" }}>PEI Assessments</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{resultsHistory.data?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} style={{ color: "#d4af37" }} />
            <p className="text-xs font-medium" style={{ color: "oklch(55% 0.02 248.6)" }}>Practice Sessions</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{practiceSessions.data?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={14} style={{ color: "#d4af37" }} />
            <p className="text-xs font-medium" style={{ color: "oklch(55% 0.02 248.6)" }}>Coach Sessions</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{coachSessions.data?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
            <p className="text-xs font-medium" style={{ color: "oklch(55% 0.02 248.6)" }}>Commitments Done</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{completedCommitments.length}</p>
        </div>
      </div>

      {/* Active Commitments */}
      <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>Active Commitments</h3>
          <Button size="sm" variant="outline" onClick={() => setShowAddCommitment(!showAddCommitment)} style={{ borderColor: "var(--color-ln-navy)", color: "var(--color-ln-navy)" }}>
            <Plus size={14} className="mr-1" /> Add
          </Button>
        </div>

        {showAddCommitment && (
          <div className="mb-4 p-4 rounded-xl" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.04)" }}>
            <input
              type="text"
              value={newCommitment}
              onChange={(e) => setNewCommitment(e.target.value)}
              placeholder="What are you committing to?"
              className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
              style={{ borderColor: "oklch(85% 0.02 248.6)", outline: "none" }}
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "oklch(85% 0.02 248.6)", outline: "none" }}
              />
              <Button size="sm" onClick={handleAddCommitment} disabled={!newCommitment.trim() || createCommitment.isPending} style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}>
                {createCommitment.isPending ? "Adding..." : "Add Commitment"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddCommitment(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {activeCommitments.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "oklch(55% 0.02 248.6)" }}>No active commitments. Add one to get started!</p>
        ) : (
          <div className="space-y-2">
            {activeCommitments.map((c) => (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "oklch(96% 0.02 248.6)" }}>
                <Circle size={18} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(65% 0.02 248.6)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--color-ln-navy)" }}>{c.text}</p>
                  {c.dueDate && (
                    <p className="text-xs mt-0.5" style={{ color: "oklch(55% 0.02 248.6)" }}>
                      <Clock size={10} className="inline mr-1" />
                      Due: {new Date(c.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleStatusChange(c.id, "completed")}
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-150"
                    style={{ background: "oklch(from #22c55e l c h / 0.12)" }}
                    title="Mark as completed"
                  >
                    <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                  </button>
                  <button
                    onClick={() => handleStatusChange(c.id, "missed")}
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-150"
                    style={{ background: "oklch(from #ef4444 l c h / 0.12)" }}
                    title="Mark as missed"
                  >
                    <X size={14} style={{ color: "#ef4444" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Commitments */}
      {completedCommitments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <h3 className="font-semibold mb-3" style={{ color: "var(--color-ln-navy)" }}>Completed Commitments</h3>
          <div className="space-y-2">
            {completedCommitments.map((c) => (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "oklch(from #22c55e l c h / 0.06)" }}>
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#22c55e" }} />
                <p className="text-sm line-through" style={{ color: "oklch(55% 0.02 248.6)" }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment History */}
      {resultsHistory.data && resultsHistory.data.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <h3 className="font-semibold mb-3" style={{ color: "var(--color-ln-navy)" }}>Assessment History</h3>
          <div className="space-y-2">
            {resultsHistory.data.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "oklch(96% 0.02 248.6)" }}>
                <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0" style={{ background: "var(--color-ln-navy)" }}>
                  <span className="text-sm font-bold" style={{ color: "#d4af37" }}>{Math.round(r.overallScore)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>{r.zone}</p>
                  <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
