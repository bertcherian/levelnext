import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, CircleAlert, Loader2, PauseCircle, PlayCircle, ShieldCheck, UserRoundPlus, UsersRound } from "lucide-react";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function EngineeringAdminProvisioning() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const overview = trpc.engineeringAdmin.provisioningOverview.useQuery(undefined, { enabled: user?.role === "admin" });
  const [tenantId, setTenantId] = useState<string>("");
  const [partnerUserId, setPartnerUserId] = useState<string>("");
  const [participantUserId, setParticipantUserId] = useState<string>("");
  const members = trpc.engineeringAdmin.listTenantMembers.useQuery({ tenantId: Number(tenantId) }, { enabled: Boolean(tenantId) && user?.role === "admin" });
  const assign = trpc.engineeringAdmin.assignPartner.useMutation({ onSuccess: () => utils.engineeringAdmin.provisioningOverview.invalidate() });
  const updateStatus = trpc.engineeringAdmin.updateAssignmentStatus.useMutation({ onSuccess: () => utils.engineeringAdmin.provisioningOverview.invalidate() });

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [isAuthenticated, loading, navigate]);
  useEffect(() => { setPartnerUserId(""); setParticipantUserId(""); }, [tenantId]);

  const selectedTenant = overview.data?.organisations.find((organisation) => String(organisation.id) === tenantId);
  const partnerOptions = useMemo(() => (members.data ?? []).filter((member) => ["success_partner", "admin"].includes(member.platformRole)), [members.data]);
  const participantOptions = useMemo(() => (members.data ?? []).filter((member) => member.id !== Number(partnerUserId)), [members.data, partnerUserId]);

  if (loading || (user?.role === "admin" && overview.isLoading)) return <PlatformLayout title="Engineering Provisioning"><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><Skeleton className="h-12 w-80" /><Skeleton className="mt-8 h-96 rounded-3xl" /></div></PlatformLayout>;
  if (user?.role !== "admin") return <PlatformLayout title="Engineering Provisioning"><div className="mx-auto max-w-3xl px-4 py-16 text-center"><ShieldCheck className="mx-auto text-[#D4A900]" size={36} /><h1 className="mt-4 text-2xl font-bold text-[#10243E]">Platform administration required</h1><p className="mt-2 text-sm text-slate-600">Engineering provisioning changes are restricted to platform administrators.</p></div></PlatformLayout>;

  return <PlatformLayout title="Engineering Provisioning"><main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B58A00]">Engineering Intelligence</p><h1 className="mt-2 text-3xl font-bold text-[#10243E]">Admin Provisioning</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Assign a participant to a Success Partner within one organisation. This controls coaching access only; it does not expose private reflections or diagnostic responses.</p></div><div className="rounded-xl border border-[#D7E6D9] bg-[#F5FAF5] px-4 py-3 text-xs leading-5 text-slate-700"><ShieldCheck className="mr-2 inline text-emerald-700" size={15} /> Partner visibility remains limited to participant-shared Mission context.</div></div>
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#10243E] text-white"><UserRoundPlus size={18} /></div><div><h2 className="font-bold text-[#10243E]">Create assignment</h2><p className="text-xs text-slate-500">All three selections must belong to the same tenant.</p></div></div>
        <div className="mt-6 space-y-4"><div><Label>Organisation</Label><Select value={tenantId} onValueChange={setTenantId}><SelectTrigger className="mt-1"><SelectValue placeholder="Choose an organisation" /></SelectTrigger><SelectContent>{overview.data?.organisations.map((organisation) => <SelectItem key={organisation.id} value={String(organisation.id)}>{organisation.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Success Partner</Label><Select value={partnerUserId} onValueChange={setPartnerUserId} disabled={!tenantId || members.isLoading}><SelectTrigger className="mt-1"><SelectValue placeholder={tenantId ? "Choose a Success Partner" : "Choose an organisation first"} /></SelectTrigger><SelectContent>{partnerOptions.map((member) => <SelectItem key={member.id} value={String(member.id)}>{member.name ?? member.email ?? `User ${member.id}`} · {member.platformRole}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Participant</Label><Select value={participantUserId} onValueChange={setParticipantUserId} disabled={!tenantId || members.isLoading}><SelectTrigger className="mt-1"><SelectValue placeholder={tenantId ? "Choose a participant" : "Choose an organisation first"} /></SelectTrigger><SelectContent>{participantOptions.map((member) => <SelectItem key={member.id} value={String(member.id)}>{member.name ?? member.email ?? `User ${member.id}`}</SelectItem>)}</SelectContent></Select></div>
        {assign.error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><CircleAlert className="mr-2 inline" size={15} />{assign.error.message}</p>}
        <Button disabled={!tenantId || !partnerUserId || !participantUserId || assign.isPending} onClick={() => assign.mutate({ tenantId: Number(tenantId), partnerUserId: Number(partnerUserId), participantUserId: Number(participantUserId) })} className="w-full bg-[#10243E] text-white hover:bg-[#18395F]">{assign.isPending ? <Loader2 className="mr-2 animate-spin" size={16} /> : <CheckCircle2 className="mr-2" size={16} />} Create active assignment</Button></div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-[#10243E]">Assignment history</h2><p className="mt-1 text-xs text-slate-500">Latest 100 Engineering coaching assignments.</p></div><UsersRound className="text-[#D4A900]" size={22} /></div>
        <div className="space-y-3">{overview.data?.assignments.length ? overview.data.assignments.map((assignment) => <article key={assignment.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-[#10243E]">{assignment.participant?.name ?? `Participant ${assignment.participantUserId}`}</p><p className="mt-1 text-xs text-slate-500">Partner: {assignment.partner?.name ?? `User ${assignment.partnerUserId}`} · Tenant {assignment.tenantId}</p><p className="mt-1 text-[11px] text-slate-400">Assigned {new Date(assignment.assignedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${assignment.status === "active" ? "bg-emerald-50 text-emerald-700" : assignment.status === "paused" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{assignment.status}</span>{assignment.status !== "ended" && <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ assignmentId: assignment.id, status: assignment.status === "active" ? "paused" : "active" })}>{assignment.status === "active" ? <PauseCircle size={14} className="mr-1" /> : <PlayCircle size={14} className="mr-1" />}{assignment.status === "active" ? "Pause" : "Resume"}</Button>}</div></div></article>) : <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No Engineering assignments have been created yet.</div>}</div>
      </section>
    </div>
    {selectedTenant && <p className="mt-5 text-xs text-slate-500">Selected organisation: {selectedTenant.name}. Assignment changes are recorded in the platform audit log.</p>}
  </main></PlatformLayout>;
}
