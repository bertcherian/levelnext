import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ExternalLink, Mail, Phone, Building2, Calendar,
  Search, Download, Users, CheckCircle2, Clock, XCircle,
  RefreshCw, Briefcase
} from "lucide-react";

type Status = "new" | "contacted" | "booked" | "declined";

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: React.ReactNode }> = {
  new: {
    label: "New",
    color: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    icon: <Clock size={12} />,
  },
  contacted: {
    label: "Contacted",
    color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    icon: <RefreshCw size={12} />,
  },
  booked: {
    label: "Booked",
    color: "bg-green-500/15 text-green-300 border-green-500/30",
    icon: <CheckCircle2 size={12} />,
  },
  declined: {
    label: "Declined",
    color: "bg-red-500/15 text-red-300 border-red-500/30",
    icon: <XCircle size={12} />,
  },
};

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl border p-5 flex items-center gap-4"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
      <div className={`rounded-lg p-2.5 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function AdminPilotApplications() {
  const { data, isLoading, refetch } = trpc.pilotApplication.list.useQuery();
  const updateStatus = trpc.pilotApplication.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Status updated"); },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Stats
  const stats = useMemo(() => {
    if (!data) return { total: 0, new: 0, contacted: 0, booked: 0, declined: 0 };
    return {
      total: data.length,
      new: data.filter(a => a.status === "new").length,
      contacted: data.filter(a => a.status === "contacted").length,
      booked: data.filter(a => a.status === "booked").length,
      declined: data.filter(a => a.status === "declined").length,
    };
  }, [data]);

  // Filtered list
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(app => {
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch = !q || [app.name, app.email, app.company, app.phone ?? ""].some(f => f.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [data, search, statusFilter]);

  // CSV export
  const handleExport = () => {
    if (!filtered.length) return;
    const headers = ["Name", "Email", "Phone", "Company", "Website", "Team Size", "Message", "Status", "Applied At"];
    const rows = filtered.map(a => [
      a.name, a.email, a.phone ?? "", a.company, a.companyUrl ?? "",
      a.teamSize ?? "", (a.message ?? "").replace(/"/g, "'"),
      a.status, new Date(a.createdAt).toLocaleString("en-IN"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pilot-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} application${filtered.length !== 1 ? "s" : ""}`);
  };

  return (
    <PlatformLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase size={20} style={{ color: "var(--color-ln-yellow)" }} />
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Pilot Applications</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {data ? `${data.length} total application${data.length !== 1 ? "s" : ""}` : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://tidycal.com/metaresults/pilot"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink size={13} /> TidyCal Calendar
              </Button>
            </a>
            <Button size="sm" className="gap-1.5 text-xs" onClick={handleExport}
              style={{ background: "var(--color-ln-navy)", color: "white" }}>
              <Download size={13} /> Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        {!isLoading && data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard label="Total" value={stats.total} icon={<Users size={16} />} color="bg-blue-500/10 text-blue-400" />
            <StatCard label="New" value={stats.new} icon={<Clock size={16} />} color="bg-blue-500/10 text-blue-400" />
            <StatCard label="Booked" value={stats.booked} icon={<CheckCircle2 size={16} />} color="bg-green-500/10 text-green-400" />
            <StatCard label="Contacted" value={stats.contacted} icon={<RefreshCw size={16} />} color="bg-yellow-500/10 text-yellow-400" />
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            {data?.length === 0
              ? "No pilot applications yet. Share the landing page to start collecting leads."
              : "No applications match your search or filter."}
          </div>
        )}

        {/* Application cards */}
        {!isLoading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map(app => {
              const sc = STATUS_CONFIG[app.status as Status] ?? STATUS_CONFIG.new;
              return (
                <div key={app.id}
                  className="rounded-xl border p-5 flex flex-col md:flex-row md:items-start gap-4 transition-all hover:shadow-sm"
                  style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>

                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base leading-tight">{app.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Building2 size={13} className="flex-shrink-0" />
                          <span className="truncate">{app.company}</span>
                          {app.teamSize && (
                            <span className="text-xs opacity-60 flex-shrink-0">· {app.teamSize}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground mt-2">
                      <a href={`mailto:${app.email}`}
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                        <Mail size={13} className="flex-shrink-0" /> {app.email}
                      </a>
                      {app.phone && (
                        <a href={`tel:${app.phone}`}
                          className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                          <Phone size={13} className="flex-shrink-0" /> {app.phone}
                        </a>
                      )}
                      {app.companyUrl && (
                        <a href={app.companyUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                          <ExternalLink size={13} className="flex-shrink-0" />
                          {app.companyUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      )}
                    </div>

                    {app.message && (
                      <p className="text-sm mt-3 text-muted-foreground italic border-l-2 pl-3 line-clamp-2"
                        style={{ borderColor: "var(--color-ln-yellow)" }}>
                        "{app.message}"
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(app.createdAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>

                  {/* Right: status badge + dropdown */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0">
                    <Badge className={`text-xs font-semibold border flex items-center gap-1 ${sc.color}`}>
                      {sc.icon} {sc.label}
                    </Badge>
                    <Select
                      value={app.status}
                      onValueChange={v =>
                        updateStatus.mutate({ id: app.id, status: v as Status })
                      }
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                    <a href={`mailto:${app.email}?subject=Re: Your LevelNext Pilot Application`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1 w-36">
                        <Mail size={12} /> Email
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
