import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, ChevronRight, Clock3, Eye, Lightbulb, LockKeyhole, Plus, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const stageOptions = [
  ["orient", "Orient"],
  ["deliver", "Deliver"],
  ["connect", "Connect"],
  ["navigate", "Navigate"],
  ["grow", "Grow"],
  ["contribute", "Contribute"],
  ["accelerate", "Accelerate"],
] as const;

export default function EarlyCareerHome() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const home = trpc.earlyCareer.getHome.useQuery(undefined, { enabled: isAuthenticated });
  const [evidenceText, setEvidenceText] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileForm, setProfileForm] = useState({ roleTitle: "", functionName: "", teamName: "", joiningDate: "", journeyStage: "orient" as (typeof stageOptions)[number][0] });

  const saveProfile = trpc.earlyCareer.saveProfile.useMutation({
    onSuccess: () => {
      utils.earlyCareer.getHome.invalidate();
      setShowOnboarding(false);
      toast.success("Your workplace context is ready.");
    },
    onError: (error) => toast.error(error.message || "We could not save your context."),
  });
  const createCommitment = trpc.earlyCareer.createCommitment.useMutation({
    onSuccess: () => {
      utils.earlyCareer.getHome.invalidate();
      toast.success("Your next move is now part of your growth record.");
    },
    onError: (error) => toast.error(error.message || "We could not start this action."),
  });
  const addEvidence = trpc.earlyCareer.addEvidence.useMutation({
    onSuccess: () => {
      utils.earlyCareer.getHome.invalidate();
      setEvidenceText("");
      setShowEvidence(false);
      toast.success("Evidence recorded. Your growth is becoming visible.");
    },
    onError: (error) => toast.error(error.message || "We could not record that evidence."),
  });
  const completeCommitment = trpc.earlyCareer.completeCommitment.useMutation({
    onSuccess: () => {
      utils.earlyCareer.getHome.invalidate();
      toast.success("Commitment completed. Capture what happened while it is fresh.");
    },
    onError: (error) => toast.error(error.message || "We could not update that commitment."),
  });

  const data = home.data;
  const profile = data?.profile;
  const current = data?.journey.currentStage;
  const nextMove = data?.nextMove;
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const dayNumber = useMemo(() => {
    if (!profile?.joiningDate) return null;
    const diff = Date.now() - new Date(profile.joiningDate).getTime();
    return Math.max(1, Math.floor(diff / 86_400_000) + 1);
  }, [profile?.joiningDate]);

  if (authLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-sm md:px-8" style={{ color: "#56616D" }}>Preparing your Early Career Intelligence experience…</div>;
  }
  if (!isAuthenticated) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center md:px-8"><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A47618" }}>LevelNext Early Career Intelligence</p><h1 className="mt-3 text-3xl font-semibold tracking-tight" style={{ color: "#0A1A2F" }}>Your First 1,000 Days starts with your real work.</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6" style={{ color: "#56616D" }}>Sign in to access your personalised journey, workplace actions, evidence record, and private development space.</p><Link href="/login" className="mt-7 inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: "#0A1A2F", color: "#F8F5F0" }}>Sign in to continue <ArrowRight size={16} className="ml-1" /></Link></div>;
  }
  if (home.isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-sm md:px-8" style={{ color: "#56616D" }}>Preparing your First 1,000 Days experience…</div>;
  }
  if (home.isError) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center md:px-8"><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A47618" }}>Early Career Intelligence</p><h1 className="mt-3 text-2xl font-semibold" style={{ color: "#0A1A2F" }}>We could not load your development space.</h1><p className="mt-3 text-sm leading-6" style={{ color: "#56616D" }}>Your information has not been changed. Please try again, or return after your connection is restored.</p><Button className="mt-6" onClick={() => home.refetch()} style={{ background: "#0A1A2F", color: "#F8F5F0" }}>Try again</Button></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl" style={{ background: "#0A1A2F" }}>
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "#D4AF37" }}>Your First 1,000 Days</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">Good to see you, {firstName}.</h1>
                  <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: "#C9D0D8" }}>
                    {current ? `${current.transition}. ${current.description}` : "Set your workplace context to activate your personalised journey."}
                  </p>
                </div>
                <div className="min-w-[132px] rounded-2xl border px-4 py-3" style={{ borderColor: "rgba(212,175,55,.35)", background: "rgba(255,255,255,.05)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#D4AF37" }}>Today</p>
                  <p className="mt-1 text-lg font-semibold text-white">{dayNumber ? `Day ${dayNumber}` : "Start here"}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "#C9D0D8" }}>{current?.name ?? "Orient"}</p>
                </div>
              </div>
              <div className="mt-8 flex items-center gap-1 overflow-x-auto pb-1" aria-label="Journey stages">
                {data?.journey.stages.map((stage, index) => {
                  const active = stage.id === data.journey.currentStageId;
                  const currentIndex = data.journey.stages.findIndex((item) => item.id === data.journey.currentStageId);
                  const complete = index < currentIndex;
                  return (
                    <div key={stage.id} className="flex items-center gap-1.5">
                      <div className="flex min-w-[86px] flex-col gap-1">
                        <div className="h-1.5 rounded-full" style={{ background: active ? "#D4AF37" : complete ? "#8291A1" : "rgba(255,255,255,.16)" }} />
                        <span className="text-[10px] font-medium" style={{ color: active ? "#F8F5F0" : "#AEB8C3" }}>{stage.name}</span>
                      </div>
                      {index < data.journey.stages.length - 1 && <ChevronRight size={12} style={{ color: "#8291A1" }} aria-hidden="true" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {!profile?.onboardingComplete && (
            <section className="rounded-3xl border p-6 md:p-7" style={{ borderColor: "#E3D8C7", background: "#FFFDF8" }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A47618" }}>Start with context</p>
                  <h2 className="mt-2 text-xl font-semibold" style={{ color: "#0A1A2F" }}>Make this journey relevant to your real work.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "#56616D" }}>Share only the basic work context you want the product to use. You can update it at any time.</p>
                </div>
                <Button onClick={() => setShowOnboarding(true)} style={{ background: "#0A1A2F", color: "#F8F5F0" }}>Add workplace context <ArrowRight size={16} className="ml-1" /></Button>
              </div>
            </section>
          )}

          {nextMove && (
            <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-7" style={{ borderColor: "#E1D9CE" }}>
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex max-w-xl gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: "#EDE3CC", color: "#0A1A2F" }}><Target size={21} aria-hidden="true" /></div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A47618" }}>Your next move</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "#0A1A2F" }}>{nextMove.title}</h2>
                    <p className="mt-2 text-sm leading-6" style={{ color: "#56616D" }}>{nextMove.description}</p>
                  </div>
                </div>
                <div className="flex min-w-[116px] items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: "#F4F0E8", color: "#0A1A2F" }}><Clock3 size={15} aria-hidden="true" /> {nextMove.timeMinutes} minutes</div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-5" style={{ borderColor: "#EEE8DF" }}>
                <Button
                  disabled={createCommitment.isPending}
                  onClick={() => createCommitment.mutate({ title: nextMove.title, description: nextMove.description, journeyStage: nextMove.stage, capabilityId: nextMove.capabilityId, sharingScope: "private" })}
                  style={{ background: "#0A1A2F", color: "#F8F5F0" }}
                >
                  {createCommitment.isPending ? "Starting…" : "Start this action"} <ArrowRight size={16} className="ml-1" />
                </Button>
                <button className="text-sm font-semibold" style={{ color: "#0A1A2F" }} onClick={() => setShowEvidence((open) => !open)}>{showEvidence ? "Cancel evidence" : "Record evidence instead"}</button>
              </div>
              {showEvidence && (
                <div className="mt-5 rounded-2xl p-4" style={{ background: "#F8F5F0" }}>
                  <label className="text-sm font-semibold" style={{ color: "#0A1A2F" }}>{nextMove.evidencePrompt}</label>
                  <textarea value={evidenceText} onChange={(event) => setEvidenceText(event.target.value)} className="mt-3 min-h-24 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2" style={{ borderColor: "#D9D2C5" }} placeholder="Capture what happened in your own words…" />
                  <div className="mt-3 flex items-center justify-between gap-3"><span className="flex items-center gap-1.5 text-xs" style={{ color: "#6B6258" }}><LockKeyhole size={13} /> Private to you by default</span><Button size="sm" disabled={evidenceText.trim().length < 3 || addEvidence.isPending} onClick={() => addEvidence.mutate({ capabilityId: nextMove.capabilityId, evidenceType: "self_report", privacyScope: "private", summary: evidenceText })} style={{ background: "#0A1A2F", color: "#F8F5F0" }}>Save evidence</Button></div>
                </div>
              )}
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <Link href="/early-career/growth" className="rounded-3xl border bg-white p-5 transition-transform hover:-translate-y-0.5" style={{ borderColor: "#E1D9CE" }}>
              <div className="flex items-start justify-between gap-4"><div><div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "#E8EDF0", color: "#0A1A2F" }}><Lightbulb size={19} /></div><h3 className="mt-4 font-semibold" style={{ color: "#0A1A2F" }}>My Growth</h3><p className="mt-1 text-sm leading-5" style={{ color: "#56616D" }}>See the eight capabilities that shape your workplace effectiveness.</p></div><ArrowRight size={18} style={{ color: "#A47618" }} /></div>
            </Link>
            <button onClick={() => setShowEvidence(true)} className="rounded-3xl border bg-white p-5 text-left transition-transform hover:-translate-y-0.5" style={{ borderColor: "#E1D9CE" }}>
              <div className="flex items-start justify-between gap-4"><div><div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "#E7F0E8", color: "#1F6B43" }}><Eye size={19} /></div><h3 className="mt-4 font-semibold" style={{ color: "#0A1A2F" }}>Evidence you’re growing</h3><p className="mt-1 text-sm leading-5" style={{ color: "#56616D" }}>Capture the actions, conversations, and outcomes that are making a difference.</p></div><Plus size={18} style={{ color: "#1F6B43" }} /></div>
            </button>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border bg-white p-5" style={{ borderColor: "#E1D9CE" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A47618" }}>My workplace</p>
            <h2 className="mt-2 text-lg font-semibold" style={{ color: "#0A1A2F" }}>{profile?.roleTitle || "Build your workplace map"}</h2>
            <p className="mt-2 text-sm leading-5" style={{ color: "#56616D" }}>{profile?.teamName ? `${profile.teamName}${profile.functionName ? ` · ${profile.functionName}` : ""}` : "Your role, manager, team, stakeholders, and dependencies will make future recommendations more useful."}</p>
            <button className="mt-4 text-sm font-semibold" style={{ color: "#0A1A2F" }} onClick={() => setShowOnboarding(true)}>{profile ? "Update context" : "Add context"} <ArrowRight size={14} className="ml-1 inline" /></button>
          </section>
          <section className="rounded-3xl p-5" style={{ background: "#EDE3CC" }}>
            <div className="flex items-center gap-2"><Sparkles size={17} style={{ color: "#A47618" }} /><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A47618" }}>Private development space</p></div>
            <p className="mt-3 text-sm leading-6" style={{ color: "#0A1A2F" }}>{data?.privacyMessage}</p>
          </section>
          <section className="rounded-3xl border bg-white p-5" style={{ borderColor: "#E1D9CE" }}>
            <div className="flex items-center justify-between"><h2 className="font-semibold" style={{ color: "#0A1A2F" }}>Growth record</h2><span className="text-xs font-semibold" style={{ color: "#A47618" }}>{data?.evidence.length ?? 0} pieces of evidence</span></div>
            <div className="mt-4 space-y-3">
              {data?.commitments.length ? data.commitments.slice(0, 3).map((commitment) => (
                <div key={commitment.id} className="border-t pt-3" style={{ borderColor: "#EEE8DF" }}>
                  <div className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: commitment.status === "completed" ? "#1F6B43" : "#A47618" }} /><div className="min-w-0 flex-1"><p className="text-sm font-medium leading-5" style={{ color: "#0A1A2F" }}>{commitment.title}</p><p className="mt-1 text-xs capitalize" style={{ color: "#6B6258" }}>{commitment.status.replace("_", " ")}</p>{commitment.status !== "completed" && <button className="mt-2 text-xs font-semibold" style={{ color: "#0A1A2F" }} onClick={() => completeCommitment.mutate({ id: commitment.id, outcome: "Completed through a real workplace action." })}>Mark complete</button>}</div></div>
                </div>
              )) : <p className="text-sm leading-5" style={{ color: "#56616D" }}>Start your next move to create a visible record of professional growth.</p>}
            </div>
          </section>
        </aside>
      </div>

      {showOnboarding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0A1A2F]/55 p-4" role="dialog" aria-modal="true" aria-label="Add workplace context">
          <form className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl md:p-7" onSubmit={(event) => { event.preventDefault(); saveProfile.mutate({ ...profileForm, joiningDate: profileForm.joiningDate ? new Date(profileForm.joiningDate).toISOString() : null, privacyAcknowledged: true }); }}>
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A47618" }}>Your workplace context</p><h2 className="mt-2 text-2xl font-semibold" style={{ color: "#0A1A2F" }}>Set the starting point for your journey.</h2></div><button type="button" onClick={() => setShowOnboarding(false)} className="text-sm font-semibold" style={{ color: "#56616D" }}>Close</button></div>
            <p className="mt-3 text-sm leading-6" style={{ color: "#56616D" }}>These basics guide your experience. You stay in control of your private development data.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium" style={{ color: "#0A1A2F" }}>Role title<Input value={profileForm.roleTitle} onChange={(event) => setProfileForm({ ...profileForm, roleTitle: event.target.value })} className="mt-2" placeholder="e.g. Business Analyst" /></label>
              <label className="text-sm font-medium" style={{ color: "#0A1A2F" }}>Team<Input value={profileForm.teamName} onChange={(event) => setProfileForm({ ...profileForm, teamName: event.target.value })} className="mt-2" placeholder="e.g. Product Operations" /></label>
              <label className="text-sm font-medium" style={{ color: "#0A1A2F" }}>Function<Input value={profileForm.functionName} onChange={(event) => setProfileForm({ ...profileForm, functionName: event.target.value })} className="mt-2" placeholder="e.g. Operations" /></label>
              <label className="text-sm font-medium" style={{ color: "#0A1A2F" }}>Joining date<Input type="date" value={profileForm.joiningDate} onChange={(event) => setProfileForm({ ...profileForm, joiningDate: event.target.value })} className="mt-2" /></label>
              <label className="text-sm font-medium md:col-span-2" style={{ color: "#0A1A2F" }}>Where are you right now?<select value={profileForm.journeyStage} onChange={(event) => setProfileForm({ ...profileForm, journeyStage: event.target.value as (typeof stageOptions)[number][0] })} className="mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm" style={{ borderColor: "#D9D2C5" }}>{stageOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4 border-t pt-5" style={{ borderColor: "#EEE8DF" }}><span className="flex max-w-sm items-start gap-2 text-xs leading-5" style={{ color: "#6B6258" }}><LockKeyhole size={14} className="mt-0.5 shrink-0" />Your profile helps personalise your experience. Private coaching remains private to you.</span><Button type="submit" disabled={saveProfile.isPending} style={{ background: "#0A1A2F", color: "#F8F5F0" }}>{saveProfile.isPending ? "Saving…" : "Begin my journey"}</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
