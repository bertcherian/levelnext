import { useState, useMemo } from "react";
import PlatformLayout from "@/components/PlatformLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Brain, Briefcase, Search, UserPlus, UserMinus,
  Users, CheckCircle2, Loader2, ChevronDown, ChevronUp,
  Download,
} from "lucide-react";

const PRODUCT_META: Record<string, { label: string; shortLabel: string; icon: React.ElementType; color: string; bg: string }> = {
  leadership_intelligence: {
    label: "Leadership Intelligence",
    shortLabel: "Leadership",
    icon: Brain,
    color: "var(--color-ln-yellow)",
    bg: "oklch(from var(--color-ln-yellow) l c h / 0.12)",
  },
  career_intelligence: {
    label: "Career Intelligence",
    shortLabel: "Career",
    icon: Briefcase,
    color: "#818cf8",
    bg: "oklch(from #818cf8 l c h / 0.12)",
  },
};

type SortKey = "name" | "email" | "createdAt" | "enrollments";

export default function AdminProductEnrollments() {
  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null); // "userId-productId"

  const { data, isLoading, refetch } = trpc.products.adminGetUsersWithEnrollments.useQuery();
  const enrollUser = trpc.products.adminEnrollUser.useMutation({
    onSuccess: (result, vars) => {
      refetch();
      const productLabel = PRODUCT_META[vars.productId]?.shortLabel ?? vars.productId;
      const action = (result as any).action === "reactivated" ? "re-enrolled in" : "enrolled in";
      toast.success(`User ${action} ${productLabel}`);
      setPendingAction(null);
    },
    onError: () => { toast.error("Enrollment failed"); setPendingAction(null); },
  });
  const unenrollUser = trpc.products.adminUnenrollUser.useMutation({
    onSuccess: (_result, vars) => {
      refetch();
      const productLabel = PRODUCT_META[vars.productId]?.shortLabel ?? vars.productId;
      toast.success(`User removed from ${productLabel}`);
      setPendingAction(null);
    },
    onError: () => { toast.error("Could not remove enrollment"); setPendingAction(null); },
  });

  const users = data?.users ?? [];
  const products = data?.products ?? [];

  // Stats
  const totalUsers = users.length;
  const liCount = users.filter((u: any) => u.enrolledProducts.includes("leadership_intelligence")).length;
  const ciCount = users.filter((u: any) => u.enrolledProducts.includes("career_intelligence")).length;
  const bothCount = users.filter((u: any) =>
    u.enrolledProducts.includes("leadership_intelligence") && u.enrolledProducts.includes("career_intelligence")
  ).length;

  // Filter + sort
  const filtered = useMemo(() => {
    let list = users.filter((u: any) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchesFilter =
        filterProduct === "all" ||
        (filterProduct === "none" ? u.enrolledProducts.length === 0 : u.enrolledProducts.includes(filterProduct));
      return matchesSearch && matchesFilter;
    });
    list = [...list].sort((a: any, b: any) => {
      let va: any, vb: any;
      if (sortKey === "name") { va = a.name ?? ""; vb = b.name ?? ""; }
      else if (sortKey === "email") { va = a.email ?? ""; vb = b.email ?? ""; }
      else if (sortKey === "createdAt") { va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); }
      else { va = a.enrolledProducts.length; vb = b.enrolledProducts.length; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, search, filterProduct, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleEnroll = (userId: number, productId: string) => {
    setPendingAction(`${userId}-${productId}`);
    enrollUser.mutate({ userId, productId });
  };
  const handleUnenroll = (userId: number, productId: string) => {
    setPendingAction(`${userId}-${productId}`);
    unenrollUser.mutate({ userId, productId });
  };

  const exportCsv = () => {
    const rows = [
      ["Name", "Email", "Joined", ...products.map((p: any) => PRODUCT_META[p.id]?.shortLabel ?? p.id)],
      ...filtered.map((u: any) => [
        u.name ?? "",
        u.email ?? "",
        new Date(u.createdAt).toLocaleDateString("en-IN"),
        ...products.map((p: any) => u.enrolledProducts.includes(p.id) ? "Yes" : "No"),
      ]),
    ];
    const csv = rows.map((r) => r.map((v: any) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "product-enrollments.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  return (
    <PlatformLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Product Enrollments</h1>
            <p className="text-sm mt-1" style={{ color: "oklch(50% 0.02 248.6)" }}>
              Manage which users have access to Leadership Intelligence and Career Intelligence.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} className="flex items-center gap-2">
            <Download size={14} /> Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Users", value: totalUsers, icon: Users, color: "var(--color-ln-navy)" },
            { label: "Leadership Intel.", value: liCount, icon: Brain, color: "var(--color-ln-yellow)" },
            { label: "Career Intel.", value: ciCount, icon: Briefcase, color: "#818cf8" },
            { label: "Both Products", value: bothCount, icon: CheckCircle2, color: "#10b981" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color }} />
                <p className="text-xs font-medium" style={{ color: "oklch(50% 0.02 248.6)" }}>{label}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(55% 0.02 248.6)" }} />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All Users" },
              { key: "leadership_intelligence", label: "Leadership" },
              { key: "career_intelligence", label: "Career" },
              { key: "none", label: "Not Enrolled" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterProduct(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                style={{
                  background: filterProduct === key ? "var(--color-ln-navy)" : "white",
                  color: filterProduct === key ? "white" : "var(--color-ln-navy)",
                  border: `1px solid ${filterProduct === key ? "var(--color-ln-navy)" : "var(--color-ln-border)"}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin" style={{ color: "var(--color-ln-navy)" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users size={32} style={{ color: "oklch(70% 0 0)" }} />
              <p className="text-sm font-medium" style={{ color: "oklch(50% 0.02 248.6)" }}>No users match your filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-ln-border)" }}>
                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none"
                      style={{ color: "oklch(45% 0.02 248.6)" }} onClick={() => handleSort("name")}>
                      <span className="flex items-center gap-1">Name <SortIcon k="name" /></span>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hidden sm:table-cell"
                      style={{ color: "oklch(45% 0.02 248.6)" }} onClick={() => handleSort("email")}>
                      <span className="flex items-center gap-1">Email <SortIcon k="email" /></span>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hidden md:table-cell"
                      style={{ color: "oklch(45% 0.02 248.6)" }} onClick={() => handleSort("createdAt")}>
                      <span className="flex items-center gap-1">Joined <SortIcon k="createdAt" /></span>
                    </th>
                    {products.map((p: any) => {
                      const meta = PRODUCT_META[p.id];
                      const Icon = meta?.icon ?? Brain;
                      return (
                        <th key={p.id} className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                          style={{ color: "oklch(45% 0.02 248.6)" }}>
                          <span className="flex items-center justify-center gap-1">
                            <Icon size={12} style={{ color: meta?.color }} />
                            {meta?.shortLabel ?? p.id}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u: any, idx: number) => (
                    <tr
                      key={u.id}
                      style={{ borderBottom: idx < filtered.length - 1 ? "1px solid var(--color-ln-border)" : "none" }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                            style={{ background: "var(--color-ln-navy)", color: "var(--color-ln-yellow)" }}>
                            {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>{u.name ?? "—"}</p>
                            <p className="text-xs sm:hidden" style={{ color: "oklch(55% 0.02 248.6)" }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell" style={{ color: "oklch(45% 0.02 248.6)" }}>
                        {u.email}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      {products.map((p: any) => {
                        const meta = PRODUCT_META[p.id];
                        const isEnrolled = u.enrolledProducts.includes(p.id);
                        const actionKey = `${u.id}-${p.id}`;
                        const isPending = pendingAction === actionKey;
                        return (
                          <td key={p.id} className="px-4 py-3.5 text-center">
                            {isEnrolled ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                                  style={{ background: meta?.bg, color: meta?.color }}>
                                  <CheckCircle2 size={10} /> Active
                                </span>
                                <button
                                  onClick={() => handleUnenroll(u.id, p.id)}
                                  disabled={isPending}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg transition-colors hover:bg-red-50"
                                  style={{ color: "#ef4444" }}
                                >
                                  {isPending ? <Loader2 size={10} className="animate-spin" /> : <UserMinus size={10} />}
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEnroll(u.id, p.id)}
                                disabled={isPending}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 hover:opacity-90"
                                style={{ background: meta?.bg ?? "oklch(95% 0 0)", color: meta?.color ?? "var(--color-ln-navy)", border: `1px solid ${meta?.color ?? "var(--color-ln-border)"}20` }}
                              >
                                {isPending ? <Loader2 size={10} className="animate-spin" /> : <UserPlus size={10} />}
                                Enroll
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-center" style={{ color: "oklch(60% 0.02 248.6)" }}>
          Showing {filtered.length} of {totalUsers} users · Changes take effect immediately
        </p>
      </div>
    </PlatformLayout>
  );
}
