import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ExternalLink, Mail, Phone, Building2, Calendar } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  contacted: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  booked: "bg-green-500/15 text-green-300 border-green-500/30",
  declined: "bg-red-500/15 text-red-300 border-red-500/30",
};

export default function AdminPilotApplications() {
  const { data, isLoading, refetch } = trpc.pilotApplication.list.useQuery();
  const updateStatus = trpc.pilotApplication.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Status updated"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Pilot Applications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {data ? `${data.length} application${data.length !== 1 ? "s" : ""}` : "Loading…"}
            </p>
          </div>
          <a
            href="https://tidycal.com/metaresults/pilot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            TidyCal Calendar <ExternalLink size={12} />
          </a>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        )}

        {data && data.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            No pilot applications yet. Share the landing page to start collecting leads.
          </div>
        )}

        {data && data.length > 0 && (
          <div className="space-y-4">
            {data.map((app) => (
              <div key={app.id}
                className="rounded-xl border p-5 flex flex-col md:flex-row md:items-start gap-4"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>

                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-base leading-tight">{app.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 size={13} /> {app.company}
                        {app.teamSize && <span className="ml-2 text-xs opacity-60">· {app.teamSize}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                    <a href={`mailto:${app.email}`} className="flex items-center gap-1 hover:text-foreground">
                      <Mail size={13} /> {app.email}
                    </a>
                    {app.phone && (
                      <a href={`tel:${app.phone}`} className="flex items-center gap-1 hover:text-foreground">
                        <Phone size={13} /> {app.phone}
                      </a>
                    )}
                    {app.companyUrl && (
                      <a href={app.companyUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-foreground">
                        <ExternalLink size={13} /> {app.companyUrl.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>

                  {app.message && (
                    <p className="text-sm mt-3 text-muted-foreground italic border-l-2 pl-3"
                      style={{ borderColor: "var(--color-border)" }}>
                      "{app.message}"
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(app.createdAt).toLocaleString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>

                {/* Right: status */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge className={`text-xs font-semibold border ${STATUS_COLORS[app.status] ?? ""}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </Badge>
                  <Select
                    value={app.status}
                    onValueChange={(v) =>
                      updateStatus.mutate({ id: app.id, status: v as "new" | "contacted" | "booked" | "declined" })
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
