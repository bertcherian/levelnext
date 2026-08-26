import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CTDM_DISCLAIMER, CTDM_DIMENSIONS } from "@shared/modules/criticalThinkingDiagnostic";
import { ArrowRight, BrainCircuit, Building2, CheckCircle2, ClipboardCheck, LockKeyhole, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function CriticalThinkingHome() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: campaigns, isLoading } = trpc.criticalThinking.myCampaigns.useQuery(undefined, { enabled: isAuthenticated });
  const { data: tenantData } = trpc.tenant.myTenant.useQuery(undefined, { enabled: isAuthenticated });
  const canAdminister = tenantData?.role === "owner" || tenantData?.role === "admin";

  return (
    <main className="min-h-screen bg-[var(--color-ln-ivory)] text-[var(--color-ln-text)]">
      <header className="border-b border-[#12345A]/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="LevelNext home">
            <img src="/logo.png" alt="LevelNext" className="h-9 w-auto object-contain" />
            <span className="hidden border-l border-slate-300 pl-3 text-sm font-medium text-slate-600 sm:block">Critical Thinking Diagnostic</span>
          </Link>
          {loading ? null : user ? (
            <div className="flex items-center gap-2">
              {canAdminister && <Button variant="outline" onClick={() => setLocation("/critical-thinking/admin")}>Admin control panel</Button>}
              <Button onClick={() => setLocation("/home")}>My LevelNext</Button>
            </div>
          ) : (
            <Button onClick={() => setLocation("/login?returnTo=" + encodeURIComponent("/critical-thinking"))}>Sign in to begin</Button>
          )}
        </div>
      </header>

      <section className="overflow-hidden bg-[#0A1A2F] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.35fr_.65fr] lg:py-24">
          <div>
            <Badge className="mb-5 border border-[#F2B705]/30 bg-[#F2B705]/15 px-3 py-1 text-[#F2B705] hover:bg-[#F2B705]/15">LevelNext Developmental Diagnostic</Badge>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">When the answer isn’t obvious, how well do you think?</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">A practical reflection on how you frame, test, evidence, challenge, decide, and learn when workplace choices involve uncertainty, competing priorities, and real consequences.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="bg-[#F2B705] text-[#0A1A2F] hover:bg-[#ffd44b]" size="lg" onClick={() => document.getElementById("your-campaigns")?.scrollIntoView({ behavior: "smooth" })}>
                View my diagnostic <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {canAdminister && <Button variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white" size="lg" onClick={() => setLocation("/critical-thinking/pilot")}>Launch a pilot</Button>}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-[#F2B705]/15 blur-3xl" />
            <Card className="relative border-white/10 bg-white/8 text-white shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between"><BrainCircuit className="h-7 w-7 text-[#F2B705]" /><span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Decision pathway</span></div>
                <CardTitle className="pt-4 text-2xl text-white">FRAME → QUESTION → EVIDENCE</CardTitle>
                <CardDescription className="text-slate-300">OPTIONS → CHALLENGE → DECIDE → LEARN</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {CTDM_DIMENSIONS.map((dimension, index) => <div key={dimension.id} className="rounded-lg border border-white/10 bg-black/15 px-3 py-3 text-sm"><span className="mr-2 text-[#F2B705]">0{index + 1}</span>{dimension.label}</div>)}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8" id="your-campaigns">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-widest text-[#12345A]">Your access</p><h2 className="mt-1 text-3xl font-bold">Your diagnostic campaigns</h2></div><p className="max-w-lg text-sm text-slate-600">Typical completion time is 20–25 minutes. You can save and return to an in-progress diagnostic.</p></div>
        {!user && <Card className="border-[#12345A]/10"><CardContent className="flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center"><LockKeyhole className="h-8 w-8 text-[#12345A]" /><div className="flex-1"><h3 className="font-semibold">Sign in to see your invited campaigns</h3><p className="mt-1 text-sm text-slate-600">Your organisation must enrol you in a tenant-specific campaign before you can begin.</p></div><Button onClick={() => setLocation("/login?returnTo=" + encodeURIComponent("/critical-thinking"))}>Sign in</Button></CardContent></Card>}
        {user && isLoading && <Card><CardContent className="p-8 text-sm text-slate-600">Loading your campaign access…</CardContent></Card>}
        {user && !isLoading && !campaigns?.length && <Card className="border-dashed"><CardContent className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center"><Building2 className="h-8 w-8 text-[#12345A]" /><div className="flex-1"><h3 className="font-semibold">No active diagnostic invitation yet</h3><p className="mt-1 text-sm text-slate-600">Ask your LevelNext tenant administrator to add your email address to a Critical Thinking campaign.</p></div>{canAdminister && <Button variant="outline" onClick={() => setLocation("/critical-thinking/pilot")}>Launch pilot cohort</Button>}</CardContent></Card>}
        <div className="grid gap-5 lg:grid-cols-2">
          {campaigns?.map(({ campaign, participant, assessment, report }) => {
            const completed = participant.status === "completed" || assessment?.status === "completed";
            return <Card key={campaign.id} className="border-[#12345A]/10 shadow-sm transition-shadow hover:shadow-md"><CardHeader><div className="flex items-start justify-between gap-4"><div><Badge variant="outline" className="mb-3 border-[#F2B705] text-[#12345A]">{campaign.reportingGroup}</Badge><CardTitle>{campaign.name}</CardTitle><CardDescription className="mt-2">{campaign.intendedUse ?? "Leadership and team development"}</CardDescription></div>{completed ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <ClipboardCheck className="h-6 w-6 text-[#12345A]" />}</div></CardHeader><CardContent className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5"><span className="text-sm text-slate-600">{completed ? "Completed" : assessment ? "In progress" : "Ready to begin"}</span>{completed ? <Button variant="outline" disabled={!report} onClick={() => report && setLocation(`/critical-thinking/report/${report.id}`)}>View my report</Button> : <Button onClick={() => setLocation(`/critical-thinking/assessment/${campaign.id}`)}>{assessment ? "Resume diagnostic" : "Begin diagnostic"}<ArrowRight className="ml-2 h-4 w-4" /></Button>}</CardContent></Card>;
          })}
        </div>
      </section>

      <section className="border-y border-[#12345A]/10 bg-white"><div className="mx-auto grid max-w-7xl gap-6 px-5 py-9 sm:px-8 md:grid-cols-3"><div className="flex gap-3"><Sparkles className="mt-0.5 h-5 w-5 text-[#F2B705]" /><p className="text-sm leading-6"><strong>Applied, not theoretical.</strong> Behavioural practice, situational judgment, confidence calibration, and work environment remain distinct.</p></div><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-[#F2B705]" /><p className="text-sm leading-6"><strong>Developmental by design.</strong> Your results identify useful practices and next experiments, not a fixed ability label.</p></div><div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 text-[#F2B705]" /><p className="text-sm leading-6"><strong>Responsible reporting.</strong> Team insight requires at least five completed participants and should never rank individuals.</p></div></div></section>
      <footer className="mx-auto max-w-7xl px-5 py-8 text-xs leading-5 text-slate-500 sm:px-8">{CTDM_DISCLAIMER}</footer>
    </main>
  );
}
