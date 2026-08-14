import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Loader2, ChevronRight, Star, AlertTriangle, TrendingUp, NotebookPen, Save } from "lucide-react";
import { toast } from "sonner";

type View = "list" | "add" | "member";

export default function TeamIntelligence() {
  const [view, setView] = useState<View>("list");
  const [activeMember, setActiveMember] = useState<any>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [memberNotes, setMemberNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [insight, setInsight] = useState<any>(null);

  const { data: members, refetch } = trpc.mep.listTeamMembers.useQuery();

  const addMember = trpc.mep.addTeamMember.useMutation({
    onSuccess: () => {
      refetch();
      setName("");
      setRole("");
      setNotes("");
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
    await addMember.mutateAsync({ name: name.trim(), role: role.trim(), notes: notes.trim() });
  };

  const handleGenerateInsight = async (member: any) => {
    setGeneratingInsight(true);
    setInsight(null);
    await generateInsight.mutateAsync({ memberId: member.id });
  };

  const updateMemberContext = trpc.mep.updateTeamMemberContext.useMutation({
    onSuccess: (data) => {
      setActiveMember((member: any) => ({ ...member, notes: data.notes }));
      refetch();
      toast.success("Team-member context saved.");
    },
    onError: () => toast.error("Could not save team-member context."),
  });

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
            <div className="space-y-4">

              {/* What you get */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.04)", border: "1.5px solid oklch(from var(--color-ln-navy) l c h / 0.12)" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-ln-gold)" }}>
                  What to add for each team member
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs" style={{ color: "oklch(35% 0.02 248.6)" }}>
                  <div className="flex items-start gap-2">
                    <span className="font-bold flex-shrink-0" style={{ color: "var(--color-ln-navy)" }}>Name</span>
                    <span>The person's full name as you know them — this is how the AI will refer to them in insights.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold flex-shrink-0" style={{ color: "var(--color-ln-navy)" }}>Role</span>
                    <span>Their job title or function (e.g. "Senior Engineer", "Product Manager") — helps the AI tailor its coaching lens.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold flex-shrink-0" style={{ color: "var(--color-ln-navy)" }}>Manager context</span>
                    <span>Add relevant facts: current goals, work patterns you have observed, strengths to build on, recent changes, concerns, or what you want to explore in a 1:1.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold flex-shrink-0" style={{ color: "var(--color-ln-navy)" }}>AI coaching lens</span>
                    <span>The guidance uses your context as a starting point. It is not a people assessment; validate it in conversation with the team member.</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div
                className="rounded-2xl px-6 py-8 text-center"
                style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
              >
                <Users size={28} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
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
            </div>
          )}

          <div className="space-y-3">
            {members?.map((m: any) => (
              <button
                key={m.id}
                onClick={() => { setActiveMember(m); setMemberNotes(m.notes ?? ""); setInsight(m.lastInsight ?? null); setView("member"); }}
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
                    {m.notes && <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--color-ln-gold)" }}>Manager context added</p>}
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
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "oklch(45% 0.02 248.6)" }}>Manager context (recommended)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Relevant facts: current goals, observed work patterns, strengths to build on, recent changes, concerns, or what you want to explore in a 1:1." className="w-full min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
              <p className="text-[11px] mt-1.5" style={{ color: "oklch(52% 0.02 248.6)" }}>Use facts you can stand behind. This context gives the AI something concrete to work from; it is not a performance evaluation.</p>
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

          <section className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
            <div className="flex items-center gap-2"><NotebookPen size={15} style={{ color: "var(--color-ln-gold)" }} /><div><h2 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Manager context</h2><p className="text-[11px]" style={{ color: "oklch(52% 0.02 248.6)" }}>Facts and observations to ground the coaching lens.</p></div></div>
            <textarea value={memberNotes} onChange={(event) => setMemberNotes(event.target.value)} placeholder="Add or update observations, current goals, recent changes, strengths to build on, or questions for your next 1:1." className="w-full min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
            <div className="flex items-center justify-between gap-3"><span className="text-[11px]" style={{ color: "oklch(52% 0.02 248.6)" }}>The AI will treat this as context to validate, not proof about the person.</span><Button size="sm" className="text-xs" style={{ background: "var(--color-ln-navy)", color: "white" }} disabled={updateMemberContext.isPending} onClick={() => updateMemberContext.mutate({ memberId: activeMember.id, notes: memberNotes.trim() })}>{updateMemberContext.isPending ? <Loader2 size={12} className="mr-1.5 animate-spin" /> : <Save size={12} className="mr-1.5" />}Save context</Button></div>
          </section>

          {!ins && (
            <div
              className="rounded-2xl px-6 py-8 text-center"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <p className="text-sm mb-4" style={{ color: "oklch(50% 0.02 248.6)" }}>
                Generate a coaching lens for {activeMember.name} using your managerial context. The result will distinguish observed context from questions to validate.
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
              <div className="rounded-xl px-4 py-3" style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.13)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.32)" }}><p className="text-[11px] leading-relaxed" style={{ color: "var(--color-ln-navy)" }}><b>Context boundary:</b> {ins.evidenceBoundary || "Use this as a coaching hypothesis and validate it directly with the team member."}</p></div>
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
