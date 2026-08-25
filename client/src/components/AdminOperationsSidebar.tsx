import { Building2, Layers3, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getTenantScopedAdminHref, useAdminTenantSelection } from "@/lib/adminTenantSelection";

export default function AdminOperationsSidebar({ compact = false }: { compact?: boolean }) {
  const { tenantId, setTenantId } = useAdminTenantSelection();
  const { data: organisations = [] } = trpc.adminOperations.listOrganisations.useQuery();
  const { data: metrics } = trpc.adminOperations.getQuickMetrics.useQuery({ tenantId });
  if (compact) return null;

  return (
    <section className="mx-2 mb-3 rounded-lg border p-3" style={{ borderColor: "oklch(from var(--color-ln-yellow) l c h / .28)", background: "oklch(from var(--color-ln-yellow) l c h / .08)" }} aria-label="Administrator organisation controls">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-ln-yellow)" }}>Active organisation</p>
      <select value={tenantId ?? ""} onChange={(event) => setTenantId(event.target.value ? Number(event.target.value) : null)} className="w-full rounded-md px-2 py-1.5 text-xs font-medium outline-none" style={{ color: "white", background: "oklch(21% .05 248.6)", border: "1px solid oklch(38% .05 248.6)" }} aria-label="Switch active organisation">
        <option value="">All organisations</option>
        {organisations.map((organisation) => <option key={organisation.id} value={organisation.id}>{organisation.name} ({organisation.memberCount})</option>)}
      </select>
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        <Metric icon={<Building2 size={12} />} value={metrics?.organisationCount ?? "—"} label="Orgs" />
        <Metric icon={<UsersRound size={12} />} value={metrics?.participantCount ?? "—"} label="People" />
        <Metric icon={<Layers3 size={12} />} value={metrics?.activeEnrollmentCount ?? "—"} label="Active" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1 text-[10px] font-semibold">
        <Link href={getTenantScopedAdminHref("/admin", tenantId)} className="rounded px-1.5 py-1 text-center text-white/70 hover:bg-white/10">Dashboard</Link>
        <Link href={getTenantScopedAdminHref("/admin/org-context", tenantId)} className="rounded px-1.5 py-1 text-center text-white/70 hover:bg-white/10">Org context</Link>
        <Link href={getTenantScopedAdminHref("/admin/invites", tenantId)} className="rounded px-1.5 py-1 text-center text-white/70 hover:bg-white/10">Invites</Link>
        <Link href={getTenantScopedAdminHref("/admin/enrollments", tenantId)} className="rounded px-1.5 py-1 text-center text-white/70 hover:bg-white/10">Enrolments</Link>
      </div>
    </section>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return <div className="rounded-md px-1 py-1.5" style={{ background: "oklch(from white 15% 0 0 / .07)" }}><div className="flex items-center justify-center gap-1" style={{ color: "var(--color-ln-yellow)" }}>{icon}<span className="text-xs font-bold text-white">{value}</span></div><p className="mt-0.5 text-[9px] text-white/55">{label}</p></div>;
}
