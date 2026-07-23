import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type Mission = {
  id: number;
  managerId: number;
  objective: string;
  whySelected: string;
  expectedImpact: string;
  effort: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high" | "critical";
  recommendedConversation: string | null;
  likelihoodOfSuccess: number | null;
  riskIfIgnored: string | null;
  channel: "call" | "whatsapp" | "email" | "voice_note" | "in_person";
  priorityScore: number;
  missionType: "quick_win" | "recovery" | "celebration" | "stretch" | "re_engagement" | "escalation";
  status: "pending" | "completed" | "skipped" | "snoozed";
};

type ManagerHealth = {
  manager: { id: number; name: string | null; email: string | null; lastSignedIn: Date | null };
  lhs: { total: number; zone: string; color: string; description: string; breakdown: Record<string, number> };
  latestReport: { edgeScore: number; archetype: string | null; zone: string | null; moduleType: string } | null;
  activeCommitment: { text: string; dueDate: Date | null } | null;
  activityLast30Days: { practiceSessions: number; guideConversations: number };
  daysSinceActive: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CHANNEL_ICONS: Record<string, string> = {
  call: "📞", whatsapp: "💬", email: "✉️", voice_note: "🎙️", in_person: "🤝",
};

const MISSION_TYPE_COLORS: Record<string, string> = {
  quick_win: "bg-green-100 text-green-800",
  recovery: "bg-orange-100 text-orange-800",
  celebration: "bg-yellow-100 text-yellow-800",
  stretch: "bg-blue-100 text-blue-800",
  re_engagement: "bg-purple-100 text-purple-800",
  escalation: "bg-red-100 text-red-800",
};

const URGENCY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function LHSRing({ score, color, size = 56 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize={size > 50 ? 13 : 10} fontWeight="700" fill={color}>
        {score}
      </text>
    </svg>
  );
}

function MissionCard({ mission, managerName, onComplete }: {
  mission: Mission;
  managerName: string;
  onComplete: (id: number, status: "completed" | "skipped" | "snoozed") => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="text-2xl mt-0.5">{CHANNEL_ICONS[mission.channel]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-slate-900 text-sm">{managerName}</span>
            <Badge className={`text-xs px-2 py-0 ${MISSION_TYPE_COLORS[mission.missionType]}`}>
              {mission.missionType.replace("_", " ")}
            </Badge>
            <Badge className={`text-xs px-2 py-0 ${URGENCY_COLORS[mission.urgency]}`}>
              {mission.urgency}
            </Badge>
          </div>
          <p className="text-slate-800 text-sm font-medium leading-snug">{mission.objective}</p>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">{mission.whySelected}</p>

          {expanded && (
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              {mission.recommendedConversation && (
                <div className="bg-indigo-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-indigo-700 mb-1">💬 Opening line</p>
                  <p className="text-sm text-indigo-900 italic">"{mission.recommendedConversation}"</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="font-semibold text-green-700 mb-0.5">Expected impact</p>
                  <p className="text-green-800">{mission.expectedImpact}</p>
                </div>
                {mission.riskIfIgnored && (
                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="font-semibold text-red-700 mb-0.5">Risk if skipped</p>
                    <p className="text-red-800">{mission.riskIfIgnored}</p>
                  </div>
                )}
              </div>
              {mission.likelihoodOfSuccess != null && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Success likelihood:</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-green-500"
                      style={{ width: `${mission.likelihoodOfSuccess}%` }}
                    />
                  </div>
                  <span className="font-semibold text-slate-700">{mission.likelihoodOfSuccess}%</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {expanded ? "Less ↑" : "Details ↓"}
            </button>
            <div className="flex-1" />
            <button
              onClick={() => onComplete(mission.id, "snoozed")}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
            >
              Snooze
            </button>
            <button
              onClick={() => onComplete(mission.id, "skipped")}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
            >
              Skip
            </button>
            <button
              onClick={() => onComplete(mission.id, "completed")}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium"
            >
              ✓ Done
            </button>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-lg font-bold text-slate-700">{mission.priorityScore}</div>
          <div className="text-xs text-slate-400">priority</div>
        </div>
      </div>
    </div>
  );
}

function ManagerHealthCard({ mh, onClick }: { mh: ManagerHealth; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <LHSRing score={mh.lhs.total} color={mh.lhs.color} size={48} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{mh.manager.name ?? "Unknown"}</p>
          <p className="text-xs text-slate-500">{mh.lhs.zone}</p>
          {mh.latestReport && (
            <p className="text-xs text-slate-400 truncate">{mh.latestReport.archetype ?? mh.latestReport.moduleType}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {mh.daysSinceActive > 7 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              {mh.daysSinceActive}d inactive
            </span>
          )}
          {mh.activeCommitment && (
            <p className="text-xs text-slate-400 mt-1 max-w-[100px] truncate">{mh.activeCommitment.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Workspace ───────────────────────────────────────────────────────────
export default function LSOSWorkspace() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"missions" | "cohort" | "brief">("missions");

  const { data, isLoading, refetch } = trpc.lsos.getWorkspaceData.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const generateMissions = trpc.lsos.generateMissions.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.count} missions generated for today`);
      refetch();
    },
    onError: () => toast.error("Failed to generate missions"),
  });

  const generateBrief = trpc.lsos.generateDailyBrief.useMutation({
    onSuccess: () => {
      toast.success("Daily brief generated");
      refetch();
    },
    onError: () => toast.error("Failed to generate brief"),
  });

  const completeMission = trpc.lsos.completeMission.useMutation({
    onSuccess: (_, vars) => {
      const label = vars.status === "completed" ? "Mission completed ✓" : vars.status === "snoozed" ? "Snoozed" : "Skipped";
      toast.success(label);
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-8 h-8 text-indigo-600" />
      </div>
    );
  }

  const { managerHealth = [], pendingMissions = [], todayBrief, cohortSummary } = data ?? {};

  // Build manager name lookup
  const managerMap = Object.fromEntries(managerHealth.map((m) => [m.manager.id, m.manager.name ?? "Unknown"]));

  const sortedHealth = [...managerHealth].sort((a, b) => a.lhs.total - b.lhs.total);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Success Partner Workspace</h1>
            <p className="text-xs text-slate-500">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/success-partner")}
              className="text-xs"
            >
              Call Queue
            </Button>
            <Button
              size="sm"
              onClick={() => generateMissions.mutate()}
              disabled={generateMissions.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            >
              {generateMissions.isPending ? <Spinner className="w-3 h-3" /> : "⚡ Generate Missions"}
            </Button>
          </div>
        </div>

        {/* Cohort Summary Bar */}
        {cohortSummary && (
          <div className="max-w-6xl mx-auto px-4 pb-3 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-700">{cohortSummary.totalManagers}</span>
              </div>
              <span className="text-xs text-slate-500">Total managers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-xs font-bold text-green-700">{cohortSummary.avgLHS}</span>
              </div>
              <span className="text-xs text-slate-500">Avg LHS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-xs font-bold text-orange-700">{cohortSummary.atRisk}</span>
              </div>
              <span className="text-xs text-slate-500">At risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-xs font-bold text-yellow-700">{cohortSummary.exceptional}</span>
              </div>
              <span className="text-xs text-slate-500">Exceptional</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 border-t border-slate-100">
          {(["missions", "cohort", "brief"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "missions" ? `⚡ Missions (${pendingMissions.length})` : tab === "cohort" ? "👥 Cohort Health" : "📋 Daily Brief"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Missions Tab */}
        {activeTab === "missions" && (
          <div>
            {pendingMissions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No missions yet today</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                  Generate your missions and the AI will identify the 5 most important actions for your cohort today.
                </p>
                <Button
                  onClick={() => generateMissions.mutate()}
                  disabled={generateMissions.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {generateMissions.isPending ? (
                    <span className="flex items-center gap-2"><Spinner className="w-4 h-4" /> Analysing cohort…</span>
                  ) : "⚡ Generate Today's Missions"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-800">Today's Priority Missions</h2>
                  <button
                    onClick={() => generateMissions.mutate()}
                    disabled={generateMissions.isPending}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Refresh
                  </button>
                </div>
                {pendingMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission as Mission}
                    managerName={managerMap[mission.managerId] ?? "Unknown"}
                    onComplete={(id, status) => completeMission.mutate({ missionId: id, status })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cohort Health Tab */}
        {activeTab === "cohort" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">Leadership Health Scores</h2>
              <span className="text-xs text-slate-400">Sorted by LHS (lowest first)</span>
            </div>

            {/* LHS Legend */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {[
                { zone: "Critical", color: "#ef4444", range: "0–34" },
                { zone: "At Risk", color: "#f97316", range: "35–49" },
                { zone: "Developing", color: "#f59e0b", range: "50–64" },
                { zone: "Strong", color: "#84cc16", range: "65–79" },
                { zone: "Exceptional", color: "#22c55e", range: "80–100" },
              ].map((z) => (
                <div key={z.zone} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                  <span>{z.zone} ({z.range})</span>
                </div>
              ))}
            </div>

            {sortedHealth.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>No managers in the cohort yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedHealth.map((mh) => (
                  <ManagerHealthCard
                    key={mh.manager.id}
                    mh={mh as ManagerHealth}
                    onClick={() => navigate(`/admin/success-partner/brief/${mh.manager.id}`)}
                  />
                ))}
              </div>
            )}

            {/* LHS Breakdown explanation */}
            <div className="mt-8 bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">How LHS is calculated</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-slate-600">
                {[
                  { label: "Diagnostic Foundation", desc: "Latest MEI/Edge score", max: 20 },
                  { label: "Practice Momentum", desc: "Practice sessions (last 30d)", max: 20 },
                  { label: "Guide Engagement", desc: "Guide conversations (last 30d)", max: 20 },
                  { label: "Commitment Reliability", desc: "% commitments kept", max: 20 },
                  { label: "Call Engagement", desc: "% calls completed", max: 20 },
                ].map((d) => (
                  <div key={d.label} className="bg-slate-50 rounded-lg p-2">
                    <p className="font-semibold text-slate-700 mb-0.5">{d.label}</p>
                    <p className="text-slate-500">{d.desc}</p>
                    <p className="text-indigo-600 font-bold mt-1">max {d.max} pts</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Daily Brief Tab */}
        {activeTab === "brief" && (
          <div>
            {!todayBrief ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No brief generated yet</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                  Generate your daily brief for an AI-written cohort narrative, celebrations, and risks.
                </p>
                <Button
                  onClick={() => generateBrief.mutate()}
                  disabled={generateBrief.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {generateBrief.isPending ? (
                    <span className="flex items-center gap-2"><Spinner className="w-4 h-4" /> Generating…</span>
                  ) : "📋 Generate Daily Brief"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-800">Daily Brief — {todayBrief.briefDate}</h2>
                  <button
                    onClick={() => generateBrief.mutate()}
                    disabled={generateBrief.isPending}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Regenerate
                  </button>
                </div>

                {/* Narrative */}
                <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                  <p className="text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wide">Cohort Narrative</p>
                  <p className="text-slate-800 leading-relaxed">{todayBrief.narrative}</p>
                </div>

                {/* Celebrations */}
                {todayBrief.celebrationsJson && todayBrief.celebrationsJson.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      🎉 Celebrate Today
                    </h3>
                    <div className="space-y-2">
                      {todayBrief.celebrationsJson.map((c, i) => (
                        <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-3">
                          <span className="text-xl">🏆</span>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{c.managerName}</p>
                            <p className="text-slate-600 text-sm">{c.reason}</p>
                          </div>
                          <button
                            onClick={() => navigate(`/admin/success-partner/brief/${c.managerId}`)}
                            className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 flex-shrink-0"
                          >
                            View →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks */}
                {todayBrief.risksJson && todayBrief.risksJson.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      ⚠️ Needs Attention
                    </h3>
                    <div className="space-y-2">
                      {todayBrief.risksJson.map((r, i) => (
                        <div key={i} className={`border rounded-xl p-3 flex items-start gap-3 ${
                          r.severity === "high" ? "bg-red-50 border-red-200" :
                          r.severity === "medium" ? "bg-orange-50 border-orange-200" :
                          "bg-amber-50 border-amber-200"
                        }`}>
                          <span className="text-xl">{r.severity === "high" ? "🚨" : r.severity === "medium" ? "⚠️" : "📌"}</span>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{r.managerName}</p>
                            <p className="text-slate-600 text-sm">{r.risk}</p>
                          </div>
                          <button
                            onClick={() => navigate(`/admin/success-partner/brief/${r.managerId}`)}
                            className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 flex-shrink-0"
                          >
                            View →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
