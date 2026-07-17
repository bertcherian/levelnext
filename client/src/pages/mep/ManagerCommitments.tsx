import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, Plus, Target, Loader2, Sparkles, X } from "lucide-react";
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
  const [suggestions, setSuggestions] = useState<Array<{ category: string; title: string; why: string }>>([]);
  const [suggesting, setSuggesting] = useState(false);

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

  const suggestMutation = trpc.mep.suggestCommitments.useMutation({
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
      setSuggesting(false);
    },
    onError: () => {
      toast.error("Could not generate suggestions.");
      setSuggesting(false);
    },
  });

  const handleSuggest = () => {
    setSuggesting(true);
    suggestMutation.mutate();
  };

  const handleAddSuggestion = async (s: { category: string; title: string; why: string }) => {
    setSaving(true);
    await createMutation.mutateAsync({
      commitment: `[${s.category}] ${s.title} — ${s.why}`,
    });
    setSuggestions((prev) => prev.filter((x) => x.title !== s.title));
    setSaving(false);
  };

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
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="font-semibold text-xs flex-shrink-0"
              onClick={handleSuggest}
              disabled={suggesting}
            >
              {suggesting ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : <Sparkles size={12} className="mr-1.5" />}
              {suggesting ? "Generating…" : "Suggest for me"}
            </Button>
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

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "white", border: "1.5px solid oklch(from var(--color-ln-gold) l c h / 0.4)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: "var(--color-ln-gold)" }} />
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-ln-gold)" }}>AI Suggestions</p>
              </div>
              <button onClick={() => setSuggestions([])} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="rounded-xl p-4 space-y-2"
                style={{ background: "oklch(98% 0.01 80)", border: "1px solid oklch(92% 0.02 80)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded inline-block mb-1.5"
                      style={{ background: "oklch(from #34d399 l c h / 0.15)", color: "#059669" }}
                    >
                      {s.category}
                    </span>
                    <p className="text-xs font-semibold leading-snug" style={{ color: "var(--color-ln-navy)" }}>{s.title}</p>
                    <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "oklch(50% 0.02 248.6)" }}>{s.why}</p>
                  </div>
                  <Button
                    size="sm"
                    className="flex-shrink-0 text-[10px] font-bold h-7 px-2.5"
                    style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                    onClick={() => handleAddSuggestion(s)}
                    disabled={saving}
                  >
                    + Add
                  </Button>
                </div>
              </div>
            ))}
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
          <div className="space-y-4">

            {/* Structure guide */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.04)", border: "1.5px solid oklch(from var(--color-ln-navy) l c h / 0.12)" }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-ln-gold)" }}>
                How to write a strong commitment
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs" style={{ color: "oklch(35% 0.02 248.6)" }}>
                <div className="flex items-start gap-2">
                  <span className="font-bold flex-shrink-0" style={{ color: "var(--color-ln-navy)" }}>1. Behaviour</span>
                  <span>Name the specific action you will take — not a mindset, but a visible behaviour others can observe.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold flex-shrink-0" style={{ color: "var(--color-ln-navy)" }}>2. Context</span>
                  <span>Specify when and where — in which meetings, with which team, or on which cadence.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold flex-shrink-0" style={{ color: "var(--color-ln-navy)" }}>3. Why it matters</span>
                  <span>Connect it to your team's performance or your leadership growth — this keeps you accountable.</span>
                </div>
              </div>
            </div>

            {/* Example commitment card */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "white", border: "1.5px dashed #34d399" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(from #34d399 l c h / 0.12)", color: "#059669" }}
                >
                  Example
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(95% 0.01 248.6)", color: "oklch(40% 0.02 248.6)" }}
                >
                  Feedback
                </span>
              </div>
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-ln-navy)" }}>
                Give one specific, behaviour-based piece of feedback in every weekly 1-on-1
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(50% 0.02 248.6)" }}>
                My team often doesn't know what they're doing well or what to improve. By naming a specific behaviour — not just "good job" — I build their self-awareness and help them grow faster. I will do this in every 1-on-1, starting this week.
              </p>
              <div className="mt-3 pt-3 border-t flex items-center gap-4" style={{ borderColor: "oklch(92% 0.01 248.6)" }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                  <span className="text-[10px]" style={{ color: "oklch(50% 0.02 248.6)" }}>Specific behaviour ✓</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                  <span className="text-[10px]" style={{ color: "oklch(50% 0.02 248.6)" }}>Clear context ✓</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                  <span className="text-[10px]" style={{ color: "oklch(50% 0.02 248.6)" }}>Personal why ✓</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div
              className="rounded-2xl px-6 py-8 text-center"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <Target size={28} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
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

function getStreak(checkIns: any[]): number {
  if (!checkIns || checkIns.length === 0) return 0;
  // Count consecutive weeks with at least one check-in marked done
  const doneDates = checkIns
    .filter((ci) => ci.done)
    .map((ci) => new Date(ci.date).getTime())
    .sort((a, b) => b - a);
  if (doneDates.length === 0) return 0;
  let streak = 1;
  for (let i = 1; i < doneDates.length; i++) {
    const diff = (doneDates[i - 1] - doneDates[i]) / (1000 * 60 * 60 * 24);
    if (diff <= 14) streak++; // within 2 weeks = consecutive
    else break;
  }
  return streak;
}

function CommitmentCard({ commitment: c, onToggle }: { commitment: any; onToggle: () => void; onDelete: () => void }) {
  const done = c.status === "completed";
  const checkIns = (c.checkIns as any[]) ?? [];
  const streak = getStreak(checkIns);
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
        <div className="flex items-center gap-3 mt-1.5">
          {streak >= 1 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: streak >= 3 ? "oklch(from #34d399 l c h / 0.15)" : "oklch(95% 0.01 248.6)", color: streak >= 3 ? "#059669" : "oklch(45% 0.02 248.6)" }}
            >
              🔥 {streak}-week streak
            </span>
          )}
          {c.targetDate && (
            <p className="text-[10px]" style={{ color: "oklch(55% 0.02 248.6)" }}>
              Target: {new Date(c.targetDate).toLocaleDateString()}
            </p>
          )}
          {checkIns.length > 0 && (
            <p className="text-[10px]" style={{ color: "oklch(65% 0.01 248.6)" }}>
              {checkIns.length} check-in{checkIns.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
