import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, Plus, Target, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BEHAVIOUR_CATEGORIES = [
  "Communication",
  "Delegation",
  "Feedback",
  "Team Development",
  "Decision Making",
  "Accountability",
  "Wellbeing",
  "Strategic Thinking",
];

export default function ManagerCommitments() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(BEHAVIOUR_CATEGORIES[0]);
  const [saving, setSaving] = useState(false);

  const { data: commitments, refetch } = trpc.mep.listCommitments.useQuery();

  const createMutation = trpc.mep.createCommitment.useMutation({
    onSuccess: () => {
      refetch();
      setTitle("");
      setDescription("");
      setShowForm(false);
      setSaving(false);
      toast.success("Commitment added.");
    },
    onError: () => {
      toast.error("Could not save commitment.");
      setSaving(false);
    },
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

  const active = commitments?.filter((c: any) => c.status !== "completed") ?? [];
  const completed = commitments?.filter((c: any) => c.status === "completed") ?? [];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Behaviour Commitments</h1>
            <p className="text-sm mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>
              Track the management behaviours you are committed to practising.
            </p>
          </div>
          <Button
            size="sm"
            className="font-semibold text-xs flex-shrink-0"
            style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={14} className="mr-1.5" />
            Add Commitment
          </Button>
        </div>

        {/* Progress bar */}
        {commitments && commitments.length > 0 && (
          <div
            className="rounded-2xl px-5 py-4"
            style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                Progress
              </p>
              <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>
                {completed.length} of {commitments.length} completed
              </p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(92% 0.01 248.6)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${commitments.length > 0 ? Math.round((completed.length / commitments.length) * 100) : 0}%`,
                  background: "#34d399",
                }}
              />
            </div>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>New Commitment</h2>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BEHAVIOUR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                    style={category === cat
                      ? { background: "#34d399", color: "var(--color-ln-navy)" }
                      : { background: "oklch(95% 0.01 248.6)", color: "oklch(40% 0.02 248.6)", border: "1px solid oklch(88% 0.01 248.6)" }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>
                Commitment
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Give specific feedback in every 1-on-1"
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>
                Why this matters (optional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe why this behaviour matters to you and your team…"
                className="text-sm resize-none min-h-[72px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 font-semibold text-xs"
                style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <><Loader2 size={12} className="mr-1.5 animate-spin" /> Saving…</> : "Save Commitment"}
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {commitments?.length === 0 && !showForm && (
          <div
            className="rounded-2xl px-6 py-10 text-center"
            style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
          >
            <Target size={32} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
            <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>
              No commitments yet
            </h2>
            <p className="text-xs mb-4" style={{ color: "oklch(55% 0.02 248.6)" }}>
              Add the management behaviours you want to practise consistently. Track your progress over time.
            </p>
            <Button
              size="sm"
              style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
              onClick={() => setShowForm(true)}
            >
              Add Your First Commitment
            </Button>
          </div>
        )}

        {/* Active commitments */}
        {active.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(50% 0.02 248.6)" }}>
              Active ({active.length})
            </h2>
            {active.map((c: any) => (
              <CommitmentCard
                key={c.id}
                commitment={c}
                onToggle={() => toggleMutation.mutate({ commitmentId: c.id, status: c.status === "completed" ? "active" : "completed" })}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}

        {/* Completed commitments */}
        {completed.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(50% 0.02 248.6)" }}>
              Completed ({completed.length})
            </h2>
            {completed.map((c: any) => (
              <CommitmentCard
                key={c.id}
                commitment={c}
                onToggle={() => toggleMutation.mutate({ commitmentId: c.id, status: c.status === "completed" ? "active" : "completed" })}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommitmentCard({ commitment: c, onToggle }: { commitment: any; onToggle: () => void; onDelete: () => void }) {
  const done = c.status === "completed";
  return (
    <div
      className={cn("rounded-2xl p-4 border flex items-start gap-3 transition-all", done && "opacity-60")}
      style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}
    >
      <button onClick={onToggle} className="mt-0.5 flex-shrink-0">
        {done
          ? <CheckCircle2 size={18} style={{ color: "#34d399" }} />
          : <Circle size={18} style={{ color: "oklch(70% 0.01 248.6)" }} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", done && "line-through")} style={{ color: "var(--color-ln-navy)" }}>
          {c.commitment}
        </p>
        {c.targetDate && (
          <p className="text-xs mt-0.5" style={{ color: "oklch(55% 0.02 248.6)" }}>
            Target: {new Date(c.targetDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
