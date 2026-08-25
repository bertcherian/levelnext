import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { launchPilotCohort, parsePilotEmails } from "@/lib/criticalThinkingPilot";
import { ArrowRight, CheckCircle2, ClipboardList, Loader2, Rocket, UsersRound } from "lucide-react";
import React, { type FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";

export default function CriticalThinkingPilot() {
  const [, setLocation] = useLocation();
  const { data, isLoading, error } = trpc.criticalThinking.adminCampaigns.useQuery();
  const create = trpc.criticalThinking.createCampaign.useMutation();
  const addParticipant = trpc.criticalThinking.addParticipant.useMutation();
  const [campaignName, setCampaignName] = useState("Critical Thinking Pilot");
  const [cohortName, setCohortName] = useState("Pilot cohort");
  const [emailsText, setEmailsText] = useState("");
  const [role, setRole] = useState("Manager / senior individual contributor");
  const [completed, setCompleted] = useState<{ campaignId: number; enrolled: number } | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const parsedEmails = useMemo(() => parsePilotEmails(emailsText), [emailsText]);
  const { emails, invalidEmails } = parsedEmails;
  const launchPilot = async (event: FormEvent) => {
    event.preventDefault(); setLaunchError(null);
    try {
      const launched = await launchPilotCohort({ rawEmails: emailsText, participantRole: role, createCampaign: () => create.mutateAsync({ name: campaignName, reportingGroup: cohortName, intendedUse: "Pilot developmental learning", targetAudience: "Pilot participants", targetRoles: role, administrationFormat: "online", readingLevel: "professional workplace English", reportingMode: "both", minTeamSize: 5, namedReportAccess: false, consentStatement: "This developmental diagnostic is not used for selection, promotion, performance rating, or disciplinary action.", retentionDays: 365, status: "active" }), addParticipant: addParticipant.mutateAsync });
      setCompleted(launched);
    } catch (exception) { setLaunchError(exception instanceof Error ? exception.message : "The pilot could not be launched. Please try again."); }
  };
  const isLaunching = create.isPending || addParticipant.isPending;
  if (isLoading) return <DashboardLayout><div className="grid min-h-96 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#12345A]" /></div></DashboardLayout>;
  if (error || !data?.membership) return <DashboardLayout><Card className="max-w-xl"><CardHeader><CardTitle>Tenant administrator access is required</CardTitle><CardDescription>{error?.message ?? "Join an organisation as an owner or administrator to start a pilot."}</CardDescription></CardHeader></Card></DashboardLayout>;
  if (completed) return <DashboardLayout><div className="mx-auto max-w-3xl py-8"><Card className="border-emerald-200"><CardHeader><CheckCircle2 className="mb-3 h-10 w-10 text-emerald-600" /><Badge className="w-fit bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Pilot ready</Badge><CardTitle className="text-3xl">Your pilot cohort is ready to begin.</CardTitle><CardDescription>{completed.enrolled} participant{completed.enrolled === 1 ? " has" : "s have"} been enrolled. Share the campaign link from the control panel; individual reports remain private and team insight stays withheld until five people complete.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button onClick={() => setLocation("/critical-thinking/admin")}>Open campaign control panel <ArrowRight className="ml-2 h-4 w-4" /></Button><Button variant="outline" onClick={() => setLocation(`/critical-thinking/assessment/${completed.campaignId}`)}>View participant experience</Button></CardContent></Card></div></DashboardLayout>;
  return <DashboardLayout><div className="mx-auto max-w-5xl space-y-7"><div><Badge className="mb-3 bg-[#F2B705] text-[#12345A] hover:bg-[#F2B705]">Guided tenant setup</Badge><h1 className="text-3xl font-bold">Launch your first pilot cohort</h1><p className="mt-2 max-w-3xl text-slate-600">Create an active, privacy-protective pilot campaign and enrol a small cohort in one short flow. The standard Critical Thinking instrument remains unchanged.</p></div><div className="grid gap-5 md:grid-cols-3"><Step icon={<ClipboardList className="h-5 w-5" />} number="01" title="Name the pilot" text="Use a recognisable cohort label." /><Step icon={<UsersRound className="h-5 w-5" />} number="02" title="Add emails" text="Paste one email per line or comma-separated." /><Step icon={<Rocket className="h-5 w-5" />} number="03" title="Launch" text="Share the campaign link from the control panel." /></div><Card><CardHeader><CardTitle>Pilot campaign details</CardTitle><CardDescription>Defaults activate individual reports, protect privacy, and require five completed participants before a team report can be exported.</CardDescription></CardHeader><CardContent><form onSubmit={launchPilot} className="grid gap-5 md:grid-cols-2"><div><Label htmlFor="pilot-name">Campaign name</Label><Input id="pilot-name" value={campaignName} onChange={(event) => setCampaignName(event.target.value)} className="mt-2" required /></div><div><Label htmlFor="pilot-cohort">Cohort label</Label><Input id="pilot-cohort" value={cohortName} onChange={(event) => setCohortName(event.target.value)} className="mt-2" required /></div><div className="md:col-span-2"><Label htmlFor="pilot-role">Typical role or seniority</Label><Input id="pilot-role" value={role} onChange={(event) => setRole(event.target.value)} className="mt-2" /></div><div className="md:col-span-2"><Label htmlFor="pilot-emails">Pilot participant emails</Label><Textarea id="pilot-emails" value={emailsText} onChange={(event) => setEmailsText(event.target.value)} placeholder={"alex@company.com\npriya@company.com\nmarco@company.com"} className="mt-2 min-h-40" required /><div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500"><span>{emails.length} unique address{emails.length === 1 ? "" : "es"} ready to enrol</span><span>Email delivery is not automatic; you will copy the secure campaign link after launch.</span></div></div>{launchError && <p className="md:col-span-2 text-sm text-red-700">{launchError}</p>}<div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#0A1A2F] p-5 text-white"><div><p className="font-semibold">What happens next</p><p className="mt-1 max-w-xl text-sm text-slate-200">The campaign goes live immediately. Each participant sees only their own report. Team insight remains anonymised and unavailable until the five-person completion threshold is met.</p></div><Button type="submit" className="bg-[#F2B705] text-[#0A1A2F] hover:bg-[#ffd44b]" disabled={isLaunching}>{isLaunching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Launch pilot <ArrowRight className="ml-2 h-4 w-4" /></Button></div></form></CardContent></Card></div></DashboardLayout>;
}
function Step({ icon, number, title, text }: { icon: React.ReactNode; number: string; title: string; text: string }) { return <Card><CardContent className="p-5"><div className="flex items-center justify-between text-[#12345A]">{icon}<span className="text-xs font-bold tracking-widest">{number}</span></div><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-600">{text}</p></CardContent></Card>; }
