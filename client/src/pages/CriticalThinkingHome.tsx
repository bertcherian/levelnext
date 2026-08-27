import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CriticalThinkingEnterpriseEnquiryDialog } from "@/components/CriticalThinkingEnterpriseEnquiryDialog";
import { trpc } from "@/lib/trpc";
import { CTDM_DIMENSIONS, CTDM_DISCLAIMER } from "@shared/modules/criticalThinkingDiagnostic";
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileDown,
  FileText,
  Eye,
  Gauge,
  LockKeyhole,
  Network,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const lensCards = [
  {
    icon: Eye,
    eyebrow: "01 · Behavioural practice",
    title: "What you say you tend to do",
    body: "Observable habits across framing, questioning, evidence, options, challenge, decisions, and learning.",
    tone: "bg-[#E8F0F4]",
  },
  {
    icon: ScanSearch,
    eyebrow: "02 · Applied judgment",
    title: "What you choose in context",
    body: "Workplace scenarios introduce real trade-offs—urgency, uncertainty, hierarchy, and operational consequence.",
    tone: "bg-[#F4ECD6]",
  },
  {
    icon: Network,
    eyebrow: "03 · Decision environment",
    title: "What the context makes easier",
    body: "A separate lens on the team conditions that enable—or constrain—well-reasoned challenge and review.",
    tone: "bg-[#E6F1EA]",
  },
];

const dimensionNarratives = [
  "Clarify the decision, owner, outcome, boundaries, and stakeholders.",
  "Separate facts from assumptions and identify what matters most.",
  "Weigh relevance, reliability, recency, and alternative explanations.",
  "Generate materially different, staged, reversible, and hybrid choices.",
  "Invite credible dissent, premortems, counterevidence, and safeguards.",
  "Make criteria, trade-offs, confidence, accountability, and review triggers explicit.",
  "Record predictions, review the outcome, and update future practice.",
];

const practiceInteractionDetails = [
  "Why it matters: it prevents an unowned conversation from being mistaken for a decision.",
  "Why it matters: it keeps evidence from being confused with the first plausible story.",
  "Why it matters: it makes the basis for confidence visible before commitment.",
  "Why it matters: it stops urgency from disguising a narrow choice set as the only option.",
  "Why it matters: it makes credible dissent useful before risk becomes expensive.",
  "Why it matters: it turns trade-offs and review triggers into shared accountability.",
  "Why it matters: it turns the result of one decision into better judgment for the next.",
];

const reportPreview = [
  { number: "01", title: "A seven-practice profile", body: "A clear view of framing, questioning, evidence, options, challenge, decision quality, and learning." },
  { number: "02", title: "Applied judgment and calibration", body: "Scenario choices and confidence are kept visible as distinct developmental signals." },
  { number: "03", title: "Priorities into practice", body: "Specific routines, reflection prompts, and a 30-day plan turn the report into useful action." },
];

const SAMPLE_REPORT_URL = "/manus-storage/LevelNext-Critical-Thinking-Diagnostic-Sample-Report_5b7ecf90.pdf";

function SectionMarker({ label }: { label: string }) {
  return <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#C89616]"><span className="h-px w-9 bg-[#C89616]" />{label}</p>;
}

export default function CriticalThinkingHome() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [enterpriseEnquiryOpen, setEnterpriseEnquiryOpen] = React.useState(() => import.meta.env.DEV && new URLSearchParams(window.location.search).get("preview") === "enterprise");
  const [activePractice, setActivePractice] = React.useState<string | null>(() => import.meta.env.DEV && new URLSearchParams(window.location.search).get("preview") === "practice" ? CTDM_DIMENSIONS[0]?.id ?? null : null);
  const [heroImageMissing, setHeroImageMissing] = React.useState(false);
  const { data: campaigns, isLoading } = trpc.criticalThinking.myCampaigns.useQuery(undefined, { enabled: isAuthenticated });
  const { data: tenantData } = trpc.tenant.myTenant.useQuery(undefined, { enabled: isAuthenticated });
  const canAdminister = tenantData?.role === "owner" || tenantData?.role === "admin";

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--color-ln-ivory)] text-[var(--color-ln-text)]">
      <header className="sticky top-0 z-30 border-b border-[#12345A]/10 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="LevelNext home">
            <span className="flex h-12 w-[116px] shrink-0 items-center justify-center rounded-lg bg-[#0A1A2F] px-3 shadow-sm"><img src="/logo.png" alt="LevelNext" className="h-9 w-auto max-w-full object-contain" /></span>
            <span className="hidden border-l border-slate-300 pl-3 text-sm font-medium text-slate-600 sm:block">Critical Thinking Diagnostic</span>
          </Link>
          {loading ? null : user ? (
            <div className="flex items-center gap-2">
              {canAdminister && <Button variant="outline" className="hidden sm:inline-flex" onClick={() => setLocation("/critical-thinking/admin")}>Admin control panel</Button>}
              <Button onClick={() => setLocation("/home")}>My LevelNext</Button>
            </div>
          ) : (
            <Button onClick={() => setLocation("/login?returnTo=" + encodeURIComponent("/critical-thinking"))}>Sign in to begin</Button>
          )}
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#0A1A2F] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="pointer-events-none absolute -left-28 top-24 h-80 w-80 rounded-full bg-[#F2B705]/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[#1D6E99]/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.03fr_.97fr] lg:py-20">
          <div className="max-w-3xl">
            <Badge className="mb-6 border border-[#F2B705]/30 bg-[#F2B705]/15 px-3 py-1 text-[#F2B705] hover:bg-[#F2B705]/15">LevelNext Developmental Diagnostic</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.65rem] lg:leading-[1.03]">When the answer isn’t obvious,<span className="mt-2 block text-[#F2B705]">how well do you think?</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">A practical reflection on how you frame, test, evidence, challenge, decide, and learn when workplace choices involve uncertainty, competing priorities, and real consequences.</p>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-300">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#F2B705]" />7 decision practices</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#F2B705]" />8 applied scenarios</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#F2B705]" />20–25 minutes</span>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button className="bg-[#F2B705] text-[#0A1A2F] hover:bg-[#ffd44b]" size="lg" onClick={() => document.getElementById("your-campaigns")?.scrollIntoView({ behavior: "smooth" })}>
                View my diagnostic <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {canAdminister && <Button variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white" size="lg" onClick={() => setLocation("/critical-thinking/pilot")}>Launch a pilot</Button>}
              <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" size="lg" onClick={() => setEnterpriseEnquiryOpen(true)}>Enterprise enquiry</Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#102C48]/80 p-3 shadow-2xl shadow-black/40">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,183,5,.16),transparent_55%)]" />
              {heroImageMissing ? <div role="img" aria-label="Decision intelligence compass fallback visual" className="relative flex h-[360px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_50%,rgba(242,183,5,.32),transparent_13%),radial-gradient(circle_at_50%_50%,rgba(29,110,153,.5),transparent_45%),linear-gradient(135deg,#102C48,#0A1A2F)] sm:h-[405px]"><div className="absolute h-52 w-52 rounded-full border border-[#F2B705]/60" /><div className="absolute h-36 w-36 rounded-full border border-white/20" /><Compass className="relative h-20 w-20 text-[#F2B705]" /><div className="absolute left-[18%] top-[24%] h-3 w-3 rounded-full bg-[#F2B705] shadow-[0_0_24px_7px_rgba(242,183,5,.35)]" /><div className="absolute bottom-[24%] right-[19%] h-3 w-3 rounded-full bg-[#F2B705] shadow-[0_0_24px_7px_rgba(242,183,5,.35)]" /><p className="absolute bottom-12 text-xs font-bold uppercase tracking-[.2em] text-slate-300">Decision practice constellation</p></div> : <img src="/manus-storage/critical-thinking-decision-intelligence-constellation_fb830e03.png" alt="Abstract constellation representing connected decision practices" onError={() => setHeroImageMissing(true)} className="relative h-[360px] w-full rounded-2xl object-cover object-center sm:h-[405px]" />}
              <div className="absolute inset-x-7 top-7 flex items-center justify-between rounded-full border border-white/15 bg-[#0A1A2F]/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 backdrop-blur">
                <span className="flex items-center gap-2"><Compass className="h-4 w-4 text-[#F2B705]" />Decision intelligence</span><span className="text-[#F2B705]">7 practices</span>
              </div>
              <div className="absolute inset-x-7 bottom-7 grid grid-cols-3 divide-x divide-white/15 overflow-hidden rounded-xl border border-white/15 bg-[#0A1A2F]/85 text-center backdrop-blur">
                <div className="px-2 py-3"><p className="text-xl font-bold text-[#F2B705]">28</p><p className="text-[10px] uppercase tracking-wider text-slate-300">Behaviour items</p></div>
                <div className="px-2 py-3"><p className="text-xl font-bold text-[#F2B705]">8</p><p className="text-[10px] uppercase tracking-wider text-slate-300">Scenarios</p></div>
                <div className="px-2 py-3"><p className="text-xl font-bold text-[#F2B705]">10</p><p className="text-[10px] uppercase tracking-wider text-slate-300">Context items</p></div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-5 hidden max-w-[220px] rounded-2xl border border-[#F2B705]/30 bg-[#F2B705] p-4 text-[#0A1A2F] shadow-xl lg:block"><p className="text-xs font-bold uppercase tracking-[0.15em]">Designed for development</p><p className="mt-2 text-sm font-semibold leading-5">No single label. A useful, nuanced development conversation.</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="max-w-3xl">
          <SectionMarker label="A more complete view" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0A1A2F] sm:text-4xl">More than a self-report. Better than a single score.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">The diagnostic keeps three complementary evidence lenses distinct, so a development conversation can consider individual habits, applied judgment, and decision environment together—without confusing one for another.</p>
        </div>
        <div className="relative mt-10 grid gap-5 lg:grid-cols-3">
          <div className="absolute left-[16.6%] right-[16.6%] top-10 hidden h-px bg-gradient-to-r from-[#0A1A2F]/10 via-[#F2B705] to-[#0A1A2F]/10 lg:block" />
          {lensCards.map((lens, index) => {
            const Icon = lens.icon;
            return <Card key={lens.title} className="relative overflow-hidden border-[#12345A]/10 bg-white shadow-sm"><CardHeader className="pb-3"><div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${lens.tone} text-[#0A1A2F]`}><Icon className="h-6 w-6" /></div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C89616]">{lens.eyebrow}</p><CardTitle className="text-xl text-[#0A1A2F]">{lens.title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-600">{lens.body}</p><div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#12345A]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0A1A2F] text-white">{index + 1}</span>Kept distinct by design</div></CardContent></Card>;
          })}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#102C48] py-16 text-white sm:py-20">
        <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(rgba(242,183,5,.8)_1px,transparent_1px)] [background-size:30px_30px]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
          <div>
            <SectionMarker label="The decision practice map" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Seven practices. One stronger way to work through uncertainty.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300">The report shows where the current practice is already useful, where an additional routine could improve a consequential decision, and how to turn insight into action.</p>
            <div className="mt-7 rounded-2xl border border-white/15 bg-white/5 p-5"><p className="flex items-center gap-2 text-sm font-semibold text-white"><Gauge className="h-5 w-5 text-[#F2B705]" />A profile, not a verdict</p><p className="mt-2 text-sm leading-6 text-slate-300">Strengths, priorities, applied choices, confidence calibration, and decision context are reported separately—then connected through practical recommendations.</p></div>
          </div>
          <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-1/2 hidden h-px bg-[#F2B705]/40 lg:block" />
            {CTDM_DIMENSIONS.map((dimension, index) => {
              const isActive = activePractice === dimension.id;
              const isGold = index === 3;
              return <button type="button" key={dimension.id} aria-pressed={isActive} onMouseEnter={() => setActivePractice(dimension.id)} onMouseLeave={() => setActivePractice(null)} onFocus={() => setActivePractice(dimension.id)} onBlur={() => setActivePractice(null)} onClick={() => setActivePractice(isActive ? null : dimension.id)} className={`relative min-h-40 rounded-2xl border p-4 text-left backdrop-blur transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B705] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102C48] ${isGold ? "border-[#F2B705]/50 bg-[#F2B705] text-[#0A1A2F]" : "border-white/15 bg-[#0A1A2F]/65 text-white hover:-translate-y-1 hover:border-[#F2B705]/70 hover:bg-[#12345A]"} ${isActive ? "-translate-y-1 shadow-xl shadow-black/30" : ""}`}><div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${isGold ? "bg-[#0A1A2F] text-[#F2B705]" : "bg-[#F2B705] text-[#0A1A2F]"}`}>{String(index + 1).padStart(2, "0")}</div><h3 className="mt-4 text-base font-bold">{dimension.label}</h3><p className={`mt-2 text-xs leading-5 transition-opacity ${isGold ? "text-[#0A1A2F]/75" : "text-slate-300"} ${isActive ? "opacity-100" : "opacity-80"}`}>{dimensionNarratives[index]}</p><span className={`block overflow-hidden text-xs leading-5 transition-[max-height,margin,opacity] duration-200 ${isGold ? "text-[#0A1A2F]/75" : "text-slate-200"} ${isActive ? "mt-3 max-h-16 opacity-100" : "max-h-0 opacity-0"}`}>{practiceInteractionDetails[index]}</span><span className={`mt-3 block text-[10px] font-bold uppercase tracking-[0.14em] ${isGold ? "text-[#0A1A2F]/65" : "text-[#F2B705]"}`}>{isActive ? "Practice detail shown" : "Hover, focus, or tap"}</span></button>;
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-[#12345A]/10 bg-[#F8F5EE] py-16 sm:py-20">
        <div className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full border border-[#F2B705]/20" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
          <div>
            <SectionMarker label="What your report includes" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0A1A2F] sm:text-4xl">A sharper development conversation—ready to use.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">The report does not reduce decision making to a verdict. It combines distinct evidence, names useful strengths and development priorities, and turns the next conversation into practical action.</p>
            <a href={SAMPLE_REPORT_URL} download="LevelNext-Critical-Thinking-Diagnostic-Sample-Report.pdf" className="mt-8 inline-flex"><Button className="bg-[#0A1A2F] text-white hover:bg-[#12345A]" size="lg"><FileDown className="mr-2 h-4 w-4" />Download the sample report</Button></a>
            <p className="mt-3 text-xs text-slate-500">Illustrative sample only. It does not represent a real participant or organisation.</p>
          </div>
          <div className="relative rounded-3xl border border-[#12345A]/10 bg-white p-5 shadow-xl shadow-[#0A1A2F]/5 sm:p-7">
            <div className="flex items-center justify-between border-b border-[#12345A]/10 pb-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A1A2F] text-[#F2B705]"><FileText className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#C89616]">Developmental report</p><p className="font-semibold text-[#0A1A2F]">Decision intelligence profile</p></div></div><span className="rounded-full border border-[#F2B705]/35 bg-[#F2B705]/10 px-3 py-1 text-xs font-bold text-[#0A1A2F]">Illustrative</span></div>
            <div className="mt-5 space-y-3">{reportPreview.map((item) => <div key={item.number} className="flex gap-4 rounded-2xl border border-slate-100 bg-[#FFFEFA] p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2B705] text-xs font-bold text-[#0A1A2F]">{item.number}</span><div><h3 className="font-bold text-[#0A1A2F]">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p></div></div>)}</div>
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#E8F0F4] p-4 text-sm text-[#12345A]"><UsersRound className="h-5 w-5 shrink-0 text-[#C89616]" /><span>Individual detail stays private; team insight is only generated when anonymity safeguards are met.</span></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20" id="your-campaigns">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><SectionMarker label="Your access" /><h2 className="mt-3 text-3xl font-bold text-[#0A1A2F]">Your diagnostic campaigns</h2></div><p className="max-w-lg text-sm leading-6 text-slate-600">Typical completion time is 20–25 minutes. You can save and return to an in-progress diagnostic.</p></div>
        {!user && <Card className="border-[#12345A]/10 shadow-sm"><CardContent className="flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F0F4]"><LockKeyhole className="h-6 w-6 text-[#12345A]" /></div><div className="flex-1"><h3 className="font-semibold text-[#0A1A2F]">Sign in to see your invited campaigns</h3><p className="mt-1 text-sm leading-6 text-slate-600">Your organisation must enrol you in a tenant-specific campaign before you can begin.</p></div><Button onClick={() => setLocation("/login?returnTo=" + encodeURIComponent("/critical-thinking"))}>Sign in</Button></CardContent></Card>}
        {user && isLoading && <Card><CardContent className="p-8 text-sm text-slate-600">Loading your campaign access…</CardContent></Card>}
        {user && !isLoading && !campaigns?.length && <Card className="border-dashed border-[#12345A]/20"><CardContent className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4ECD6]"><Building2 className="h-6 w-6 text-[#12345A]" /></div><div className="flex-1"><h3 className="font-semibold text-[#0A1A2F]">No active diagnostic invitation yet</h3><p className="mt-1 text-sm leading-6 text-slate-600">Ask your LevelNext tenant administrator to add your email address to a Critical Thinking campaign.</p></div>{canAdminister && <Button variant="outline" onClick={() => setLocation("/critical-thinking/pilot")}>Launch pilot cohort</Button>}</CardContent></Card>}
        <div className="grid gap-5 lg:grid-cols-2">
          {campaigns?.map(({ campaign, participant, assessment, report }) => {
            const completed = participant.status === "completed" || assessment?.status === "completed";
            return <Card key={campaign.id} className="border-[#12345A]/10 shadow-sm transition-shadow hover:shadow-md"><CardHeader><div className="flex items-start justify-between gap-4"><div><Badge variant="outline" className="mb-3 border-[#F2B705] text-[#12345A]">{campaign.reportingGroup}</Badge><CardTitle className="text-[#0A1A2F]">{campaign.name}</CardTitle><CardDescription className="mt-2">{campaign.intendedUse ?? "Leadership and team development"}</CardDescription></div>{completed ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <ClipboardCheck className="h-6 w-6 text-[#12345A]" />}</div></CardHeader><CardContent className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5"><span className="text-sm text-slate-600">{completed ? "Completed" : assessment ? "In progress" : "Ready to begin"}</span>{completed ? <Button variant="outline" disabled={!report} onClick={() => report && setLocation(`/critical-thinking/report/${report.id}`)}>View my report</Button> : <Button onClick={() => setLocation(`/critical-thinking/assessment/${campaign.id}`)}>{assessment ? "Resume diagnostic" : "Begin diagnostic"}<ArrowRight className="ml-2 h-4 w-4" /></Button>}</CardContent></Card>;
          })}
        </div>
      </section>

      <section className="border-y border-[#12345A]/10 bg-white"><div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-8 md:grid-cols-3"><div className="flex gap-3"><Sparkles className="mt-0.5 h-5 w-5 text-[#F2B705]" /><p className="text-sm leading-6"><strong>Applied, not theoretical.</strong> Behavioural practice, situational judgment, confidence calibration, and work environment remain distinct.</p></div><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-[#F2B705]" /><p className="text-sm leading-6"><strong>Developmental by design.</strong> Results identify useful practices and next experiments, not a fixed ability label.</p></div><div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 text-[#F2B705]" /><p className="text-sm leading-6"><strong>Responsible reporting.</strong> Team insight requires at least five completed participants and should never rank individuals.</p></div></div></section>
      <footer className="mx-auto max-w-7xl px-5 py-8 text-xs leading-5 text-slate-500 sm:px-8">{CTDM_DISCLAIMER}</footer>
      <CriticalThinkingEnterpriseEnquiryDialog open={enterpriseEnquiryOpen} onOpenChange={setEnterpriseEnquiryOpen} />
    </main>
  );
}
