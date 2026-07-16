import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Loader2, ChevronRight, Star, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type View = "list" | "add" | "member";

export default function TeamIntelligence() {
  const [view, setView] = useState<View>("list");
  const [activeMember, setActiveMember] = useState<any>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [insight, setInsight] = useState<any>(null);

  const { data: members, refetch } = trpc.mep.listTeamMembers.useQuery();

  const addMember = trpc.mep.addTeamMember.useMutation({
    onSuccess: () => {
      refetch();
      setName("");
      setRole("");
      setView("list");
      setSaving(false);
      toast.success("Team member added.");
    },
    onError: () => {
      toast.error("Could not add team member.");
      setSaving(false);
    },
  });

  const generateInsight = trpc.mep.generateTeamMemberInsight.useMutation({
    onSuccess: (data) => {
      setInsight(data.insight);
      setGeneratingInsight(false);
    },
    onError: () => {
      toast.error("Could not generate insight.");
      setGeneratingInsight(false);
    },
  });

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Please enter a name."); return; }
    setSaving(true);
    await addMember.mutateAsync({ name: name.trim(), role: role.trim() });
  };

  const handleGenerateInsight = async (member: any) => {
    setGeneratingInsight(true);
    setInsight(null);
    await generateInsight.mutateAsync({ memberId: member.id });
  };

  // ── List view ─────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Team Intelligence</h1>
              <p className="text-sm mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>
                AI-powered insights for each person on your team.
              </p>
            </div>
            <Button
              size="sm"
              className="font-semibold text-xs flex-shrink-0"
              style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
              onClick={() => setView("add")}
            >
              <Plus size={14} className="mr-1.5" />
              Add Member
            </Button>
          </div>

          {members?.length === 0 && (
            <div
              className="rounded-2xl px-6 py-10 text-center"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <Users size={32} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
              <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>
                No team members yet
              </h2>
              <p className="text-xs mb-4" style={{ color: "oklch(55% 0.02 248.6)" }}>
                Add your team members to get AI-powered coaching insights for each person — strengths, risks, and recommended actions.
              </p>
              <Button
                size="sm"
                style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                onClick={() => setView("add")}
              >
                Add Your First Team Member
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {members?.map((m: any) => (
              <button
                key={m.id}
                onClick={() => { setActiveMember(m); setInsight(null); setView("member"); }}
                className="w-full text-left rounded-2xl p-4 border transition-all hover:shadow-sm"
                style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ background: "oklch(from #60a5fa l c h / 0.12)", color: "#60a5fa" }}
                  >
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{m.name}</p>
                    {m.role && (
                      <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>{m.role}</p>
                    )}
                  </div>
                  <ChevronRight size={14} style={{ color: "oklch(60% 0.02 248.6)" }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Add member form ───────────────────────────────────────────────────────
  if (view === "add") {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div>
            <button className="text-xs mb-4 flex items-center gap-1" style={{ color: "oklch(55% 0.02 248.6)" }} onClick={() => setView("list")}>
              ← Back
            </button>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Add Team Member</h1>
          </div>
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>Role / Title (optional)</label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Engineer" className="text-sm" />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 font-semibold text-xs"
                style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <><Loader2 size={12} className="mr-1.5 animate-spin" /> Saving…</> : "Add Team Member"}
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setView("list")}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Member detail view ────────────────────────────────────────────────────
  if (view === "member" && activeMember) {
    const ins = insight as any;
    return (
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
          <div>
            <button className="text-xs mb-4 flex items-center gap-1" style={{ color: "oklch(55% 0.02 248.6)" }} onClick={() => setView("list")}>
              ← Back to Team
            </button>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: "oklch(from #60a5fa l c h / 0.12)", color: "#60a5fa" }}
              >
                {activeMember.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{activeMember.name}</h1>
                {activeMember.role && <p className="text-sm" style={{ color: "oklch(50% 0.02 248.6)" }}>{activeMember.role}</p>}
              </div>
            </div>
          </div>

          {!ins && (
            <div
              className="rounded-2xl px-6 py-8 text-center"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <p className="text-sm mb-4" style={{ color: "oklch(50% 0.02 248.6)" }}>
                Generate AI-powered coaching insights for {activeMember.name} based on your diagnostic results and management context.
              </p>
              <Button
                onClick={() => handleGenerateInsight(activeMember)}
                disabled={generatingInsight}
                style={{ background: "#60a5fa", color: "white" }}
              >
                {generatingInsight
                  ? <><Loader2 size={14} className="mr-2 animate-spin" /> Generating…</>
                  : "Generate Team Member Insight"}
              </Button>
            </div>
          )}

          {ins && (
            <>
              {ins.summary && (
                <div className="rounded-2xl px-5 py-4" style={{ background: "var(--color-ln-navy)" }}>
                  <p className="text-sm font-medium text-white leading-relaxed">{ins.summary}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ins.strengths && ins.strengths.length > 0 && (
                  <InsightSection title="Strengths to Leverage" icon={Star} color="#34d399">
                    {ins.strengths.map((s: string, i: number) => (
                      <p key={i} className="text-xs flex items-start gap-2" style={{ color: "oklch(30% 0.02 248.6)" }}>
                        <span style={{ color: "#34d399" }}>✓</span> {s}
                      </p>
                    ))}
                  </InsightSection>
                )}
                {ins.watchOuts && ins.watchOuts.length > 0 && (
                  <InsightSection title="Watch-Outs" icon={AlertTriangle} color="#f87171">
                    {ins.watchOuts.map((w: string, i: number) => (
                      <p key={i} className="text-xs flex items-start gap-2" style={{ color: "oklch(30% 0.02 248.6)" }}>
                        <span style={{ color: "#f87171" }}>!</span> {w}
                      </p>
                    ))}
                  </InsightSection>
                )}
              </div>
              {ins.recommendedActions && ins.recommendedActions.length > 0 && (
                <InsightSection title="Recommended Actions" icon={TrendingUp} color="#a78bfa">
                  <div className="space-y-2">
                    {ins.recommendedActions.map((a: any, i: number) => (
                      <div key={i} className="flex gap-2">
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                          style={{ background: "#a78bfa", color: "white" }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-xs leading-relaxed" style={{ color: "oklch(30% 0.02 248.6)" }}>{a}</p>
                      </div>
                    ))}
                  </div>
                </InsightSection>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => handleGenerateInsight(activeMember)}
                disabled={generatingInsight}
              >
                {generatingInsight ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : null}
                Refresh Insight
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function InsightSection({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} style={{ color }} />
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>{title}</h2>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
