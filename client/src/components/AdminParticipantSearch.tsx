import { ChevronLeft, ChevronRight, Search, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getTenantScopedAdminHref, useAdminTenantSelection } from "@/lib/adminTenantSelection";

export default function AdminParticipantSearch() {
  const [query, setQuery] = useState("");
  const { tenantId, setTenantId } = useAdminTenantSelection();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => setPage(1), [query, tenantId]);
  const { data, isFetching } = trpc.adminOperations.searchParticipants.useQuery({ query, tenantId, page, pageSize });
  const participants = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));
  const showingStart = data?.total ? (page - 1) * pageSize + 1 : 0;
  const showingEnd = Math.min(page * pageSize, data?.total ?? 0);
  return (
    <section className="rounded-xl border p-6" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-base font-semibold" style={{ color: "var(--color-ln-navy)" }}>Cross-platform participant search</h2><p className="mt-0.5 text-xs text-muted-foreground">Search names or emails; results include organisation and active product enrolments.</p></div>
        <div className="relative w-full sm:w-72"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search participant or email" className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none" style={{ borderColor: "var(--color-border)" }} aria-label="Search participants" /></div>
      </div>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr className="border-b" style={{ borderColor: "var(--color-border)" }}><th className="pb-2 font-medium">Participant</th><th className="pb-2 font-medium">Organisation</th><th className="pb-2 font-medium">Active products</th><th className="pb-2 font-medium">Last sign-in</th><th className="pb-2 font-medium">Actions</th></tr></thead><tbody>{participants.map((participant) => <tr key={`${participant.id}-${participant.tenantId ?? "none"}`} className="border-b" style={{ borderColor: "var(--color-border)" }}><td className="py-3"><p className="font-medium">{participant.name || "Unnamed participant"}</p><p className="text-xs text-muted-foreground">{participant.email || "No email"}</p></td><td className="py-3 text-xs">{participant.organisation || "No organisation"}</td><td className="py-3"><div className="flex flex-wrap gap-1">{participant.enrolments.length ? participant.enrolments.map((enrolment) => <span key={enrolment.id} className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "oklch(from var(--color-ln-navy) l c h / .08)", color: "var(--color-ln-navy)" }}>{enrolment.name}</span>) : <span className="text-xs text-muted-foreground">None</span>}</div></td><td className="py-3 text-xs text-muted-foreground">{participant.lastSignedIn ? new Date(participant.lastSignedIn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td><td className="py-3"><div className="flex gap-2 whitespace-nowrap text-xs font-semibold"><button type="button" disabled={!participant.tenantId} onClick={() => participant.tenantId && setTenantId(participant.tenantId)} className="text-blue-700 disabled:text-muted-foreground">View org</button><Link href={getTenantScopedAdminHref(`/admin/enrollments?participantId=${participant.id}`, participant.tenantId ?? tenantId)} className="text-blue-700">Enrolments</Link>{participant.tenantId && <Link href={getTenantScopedAdminHref("/admin/org-context", participant.tenantId)} className="text-blue-700">Org context</Link>}</div></td></tr>)}</tbody></table>{!isFetching && participants.length === 0 && <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground"><UsersRound size={22} /><p className="text-sm">No participants match this search.</p></div>}</div>
      {(data?.total ?? 0) > 0 && <div className="mt-4 flex flex-col gap-2 border-t pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--color-border)" }}><span>Showing {showingStart}–{showingEnd} of {data?.total} participants</span><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || isFetching} className="inline-flex items-center gap-1 rounded border px-2 py-1 font-semibold disabled:opacity-40" style={{ borderColor: "var(--color-border)" }}><ChevronLeft size={13} />Previous</button><span>Page {page} of {totalPages}</span><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isFetching} className="inline-flex items-center gap-1 rounded border px-2 py-1 font-semibold disabled:opacity-40" style={{ borderColor: "var(--color-border)" }}>Next<ChevronRight size={13} /></button></div></div>}
    </section>
  );
}
