import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, User, BookOpen, Target, Activity, Brain, Calendar, ChevronRight, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";

// ─── Types ────────────────────────────────────────────────────────────────────
type Client = {
  assignmentId: number;
  clientId: number;
  clientName: string;
  clientEmail: string;
  assignedAt: string | Date;
  notes: string | null;
  latestReport: {
    moduleType: string;
    edgeScore: number | null;
    archetype: string | null;
    createdAt: string | Date;
  } | null;
  activeCommitment: { text: string; dueDate: string | Date | null } | null;
  activityLast14Days: { practiceSessions: number; guideSessions: number };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function activityDot(count: number) {
  if (count >= 5) return "bg-emerald-500";
  if (count >= 2) return "bg-amber-400";
  return "bg-slate-300";
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function moduleLabel(m: string) {
  const map: Record<string, string> = {
    ECI: "Executive Communication",
    LII: "Leadership Intelligence",
    TII: "Team Intelligence",
    GCC: "GCC Readiness",
    LDI: "Leadership Diagnostic",
    STI: "Strategic Thinking",
    NII: "Negotiation Intelligence",
    CPI: "Coaching Presence",
    CRS: "Career Readiness",
    CMK: "Communication Mastery",
    CST: "Change & Strategy",
    CAO: "Culture & Alignment",
    AIR: "AI Readiness",
    GENERAL: "General",
  };
  return map[m] ?? m;
}

// ─── Pre-Call Brief View ──────────────────────────────────────────────────────
function ClientBriefView({ client, onBack }: { client: Client; onBack: () => void }) {
  const { data: brief, isLoading } = trpc.coach.getClientBrief.useQuery(
    { clientUserId: client.clientId },
    { staleTime: 5 * 60 * 1000 }
  );
  const generatePrep = trpc.coach.generateCoachPrep.useMutation({
    onError: () => toast.error("Failed to generate prep. Please try again."),
  });

  const [prep, setPrep] = useState<string | null>(null);

  const handleGenerate = async () => {
    const result = await generatePrep.mutateAsync({ clientUserId: client.clientId });
    setPrep(result.prep);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const reports = brief?.allReports ?? [];
  const commitments = brief?.recentCommitments ?? [];
  const practice = brief?.activitySignals.practiceSessions ?? [];
  const guide = brief?.activitySignals.guideSessions ?? [];
  const memory = brief?.leadershipMemory;

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      {/* Header */}
      <div className="bg-[#0F1F3D] text-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="text-white/70 hover:text-white flex items-center gap-1 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Clients
          </button>
          <Separator orientation="vertical" className="h-4 bg-white/20" />
          <div>
            <h1 className="font-semibold text-lg">{client.clientName}</h1>
            <p className="text-white/60 text-xs">{client.clientEmail}</p>
          </div>
          <div className="ml-auto">
            <Button
              onClick={handleGenerate}
              disabled={generatePrep.isPending}
              className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F1F3D] font-semibold text-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generatePrep.isPending ? "Generating…" : "Generate Pre-Call Brief"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">

        {/* AI Pre-Call Brief */}
        {prep && (
          <Card className="border-[#C9A84C] border-2 bg-white p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#C9A84C]" />
              <h2 className="font-semibold text-[#0F1F3D] text-sm uppercase tracking-wide">AI Pre-Call Brief</h2>
            </div>
            <div className="prose prose-sm max-w-none text-slate-700 [&_strong]:text-[#0F1F3D] [&_h2]:text-[#0F1F3D]">
              <ReactMarkdown>{prep}</ReactMarkdown>
            </div>
          </Card>
        )}

        {/* Diagnostic Results */}
        <Card className="bg-white p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[#0F1F3D]" />
            <h2 className="font-semibold text-[#0F1F3D]">Diagnostic Results</h2>
          </div>
          {reports.length === 0 ? (
            <p className="text-slate-400 text-sm">No diagnostics completed yet.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-[#0F1F3D]">{moduleLabel(r.moduleType)}</p>
                    <p className="text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {r.edgeScore !== null && (
                        <span className="text-xs font-semibold bg-[#0F1F3D]/10 text-[#0F1F3D] px-2 py-0.5 rounded-full">
                          Edge {r.edgeScore}
                        </span>
                      )}
                      {r.archetype && (
                        <Badge variant="outline" className="text-xs border-[#C9A84C] text-[#C9A84C]">
                          {r.archetype}
                        </Badge>
                      )}
                    </div>
                    {r.zone && <p className="text-xs text-slate-400 mt-0.5">{r.zone}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Commitments */}
        <Card className="bg-white p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-[#0F1F3D]" />
            <h2 className="font-semibold text-[#0F1F3D]">Commitments</h2>
          </div>
          {commitments.length === 0 ? (
            <p className="text-slate-400 text-sm">No commitments recorded.</p>
          ) : (
            <div className="space-y-3">
              {commitments.map((c, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    c.status === "done_well" ? "bg-emerald-500" :
                    c.status === "pending" ? "bg-amber-400" :
                    c.status === "avoided" ? "bg-red-400" : "bg-slate-300"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{c.text}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {c.dueDate && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due {formatDate(c.dueDate)}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs capitalize">{c.status?.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Activity Signals */}
        <Card className="bg-white p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#0F1F3D]" />
            <h2 className="font-semibold text-[#0F1F3D]">Activity — Last 30 Days</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-[#0F1F3D]">{practice.length}</p>
              <p className="text-xs text-slate-500 mt-1">Practice Sessions</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-[#0F1F3D]">{guide.length}</p>
              <p className="text-xs text-slate-500 mt-1">Guide Conversations</p>
            </div>
          </div>
          {practice.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Practice Topics</p>
              <div className="flex flex-wrap gap-2">
                {practice.map((p, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {p.difficulty ?? "Standard"} difficulty
                    {p.overallScore !== null ? ` · ${p.overallScore}/100` : ""}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Leadership Memory */}
        {memory?.aiSummary && (
          <Card className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-[#0F1F3D]" />
              <h2 className="font-semibold text-[#0F1F3D]">Leadership Memory</h2>
              <span className="text-xs text-slate-400 ml-auto">Updated {formatDate(memory.updatedAt)}</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{memory.aiSummary}</p>
          </Card>
        )}

        {/* Assignment Notes */}
        {client.notes && (
          <Card className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#0F1F3D]" />
              <h2 className="font-semibold text-[#0F1F3D]">Coach Notes</h2>
            </div>
            <p className="text-sm text-slate-600">{client.notes}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Client Card ──────────────────────────────────────────────────────────────
function ClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const total = client.activityLast14Days.practiceSessions + client.activityLast14Days.guideSessions;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-[#C9A84C]/30 group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-[#0F1F3D] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-sm">
            {client.clientName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#0F1F3D] truncate">{client.clientName}</h3>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#C9A84C] transition-colors flex-shrink-0" />
          </div>
          <p className="text-xs text-slate-400 truncate">{client.clientEmail}</p>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {client.latestReport ? (
              <>
                <Badge variant="outline" className="text-xs border-[#0F1F3D]/20 text-[#0F1F3D]">
                  {moduleLabel(client.latestReport.moduleType)}
                </Badge>
                {client.latestReport.archetype && (
                  <Badge variant="outline" className="text-xs border-[#C9A84C] text-[#C9A84C]">
                    {client.latestReport.archetype}
                  </Badge>
                )}
                {client.latestReport.edgeScore !== null && (
                  <span className="text-xs text-slate-500">Edge {client.latestReport.edgeScore}</span>
                )}
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">No diagnostics yet</span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${activityDot(total)}`} />
              <span className="text-xs text-slate-500">
                {total} sessions in 14 days
              </span>
            </div>
            {client.activeCommitment && (
              <span className="text-xs text-slate-400 truncate max-w-[200px]">
                🎯 {client.activeCommitment.text}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Coach Gate (not a coach) ─────────────────────────────────────────────────
function NotACoachGate() {
  return (
    <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-[#0F1F3D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-[#0F1F3D]/40" />
        </div>
        <h2 className="text-xl font-semibold text-[#0F1F3D] mb-2">Coach Access Required</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          This portal is for executive coaches assigned to LevelNext clients. If you believe you should have access, please contact your platform administrator.
        </p>
      </div>
    </div>
  );
}

// ─── Main Coach Portal ────────────────────────────────────────────────────────
export default function CoachPortal() {
  const { user, loading: authLoading } = useAuth();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data: profile, isLoading: profileLoading } = trpc.coach.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: clients, isLoading: clientsLoading } = trpc.coach.getMyClients.useQuery(undefined, {
    enabled: !!profile,
  });

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] p-6">
        <div className="max-w-2xl mx-auto space-y-4 pt-10">
          <Skeleton className="h-10 w-48" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!profile) return <NotACoachGate />;

  if (selectedClient) {
    return <ClientBriefView client={selectedClient} onBack={() => setSelectedClient(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      {/* Header */}
      <div className="bg-[#0F1F3D] text-white px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C9A84C] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-[#0F1F3D]" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Coach Portal</h1>
              <p className="text-white/60 text-xs">Welcome back, {profile.name}</p>
            </div>
          </div>
          {profile.specialisation && (
            <p className="text-white/50 text-xs mt-2 ml-13">{profile.specialisation}</p>
          )}
        </div>
      </div>

      {/* Client List */}
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#0F1F3D]">
            My Clients
            {clients && <span className="text-slate-400 font-normal ml-2 text-sm">({clients.length})</span>}
          </h2>
        </div>

        {clientsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : !clients || clients.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No clients assigned yet.</p>
            <p className="text-xs mt-1">Your administrator will assign clients to you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((c) => (
              <ClientCard
                key={c.assignmentId}
                client={c as Client}
                onClick={() => setSelectedClient(c as Client)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
