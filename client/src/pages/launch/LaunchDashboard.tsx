import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import LaunchDarkLayout from "@/components/LaunchDarkLayout";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { Loader2, AlertCircle } from "lucide-react";

function LoadingState({ label }: { label: string }) {
  return (
    <div className="ld-card p-8 flex flex-col items-center justify-center gap-3">
      <Loader2 size={24} className="animate-spin" style={{ color: "var(--ld-cyan)" }} />
      <p className="text-sm" style={{ color: "var(--ld-text-muted)" }}>{label}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="ld-card p-8 flex flex-col items-center justify-center gap-3">
      <AlertCircle size={24} style={{ color: "var(--ld-coral, #FF6B6B)" }} />
      <p className="text-sm" style={{ color: "var(--ld-text-muted)" }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="ld-btn-ghost text-xs">Try again</button>
      )}
    </div>
  );
}

const ALL_MISSIONS = [
  { id: 1, key: "career_compass", title: "Career Compass", description: "Discover your ideal career direction", icon: "🧭", xp: 100, path: "/launch/mission/1", category: "Discover", color: "#22D3EE" },
  { id: 2, key: "story_builder", title: "Story Builder", description: "Craft your personal brand narrative", icon: "✍️", xp: 100, path: "/launch/mission/2", category: "Brand", color: "#A78BFA" },
  { id: 3, key: "skill_sprint", title: "Skill Sprint", description: "Build 10 essential career skills", icon: "⚡", xp: 150, path: "/launch/mission/3", category: "Skills", color: "#4ADE80" },
  { id: 4, key: "resume_makeover", title: "Resume Makeover", description: "AI-powered resume analysis & rewrite", icon: "📄", xp: 75, path: "/launch/resume", category: "Apply", color: "#FB923C" },
  { id: 5, key: "interview_intelligence", title: "Interview Intelligence", description: "Practice with an AI interviewer", icon: "🎤", xp: 75, path: "/launch/interview", category: "Apply", color: "#22D3EE" },
  { id: 6, key: "negotiation_simulator", title: "Negotiation Simulator", description: "Master salary negotiation", icon: "⚖️", xp: 100, path: "/launch/negotiate", category: "Negotiate", color: "#F472B6" },
  { id: 7, key: "application_tracker", title: "Application Tracker", description: "Manage your job pipeline", icon: "📋", xp: 50, path: "/launch/applications", category: "Track", color: "#94A3B8" },
];

function getLevelInfo(xp: number) {
  const levels = [
    { level: 1, name: "Explorer", minXp: 0, maxXp: 200, color: "#94A3B8" },
    { level: 2, name: "Builder", minXp: 200, maxXp: 500, color: "#4ADE80" },
    { level: 3, name: "Professional", minXp: 500, maxXp: 900, color: "#22D3EE" },
    { level: 4, name: "Achiever", minXp: 900, maxXp: 1400, color: "#A78BFA" },
    { level: 5, name: "Champion", minXp: 1400, maxXp: 2000, color: "#FB923C" },
    { level: 6, name: "Legend", minXp: 2000, maxXp: 9999, color: "#F472B6" },
  ];
  const current = levels.findLast((l) => xp >= l.minXp) || levels[0];
  const progress = current.maxXp < 9999 ? Math.min(100, Math.round(((xp - current.minXp) / (current.maxXp - current.minXp)) * 100)) : 100;
  const xpToNext = current.maxXp < 9999 ? current.maxXp - xp : 0;
  return { ...current, progress, xpToNext };
}

export default function LaunchDashboard() {
  const [, navigate] = useLocation();
  const progressQuery = trpc.launchProgress.getProgress.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const compassQuery = trpc.launchCareerCompass.getSession.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const brandQuery = trpc.launchStoryBuilder.getBrandKit.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const interviewQuery = trpc.launchInterview.getHistory.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const negotiationQuery = trpc.launchNegotiation.getHistory.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const applicationsQuery = trpc.launchApplications.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const progressData = progressQuery.data;
  const compassData = compassQuery.data;
  const brandData = brandQuery.data;
  const interviewHistory = interviewQuery.data;
  const negotiationHistory = negotiationQuery.data;
  const applications = applicationsQuery.data;

  const isProgressLoading = progressQuery.isLoading;
  const progressError = progressQuery.error;

  const progress = progressData?.progress;
  const totalXp = progress?.totalXp || 0;
  const streak = progress?.currentStreak || 0;
  const levelInfo = getLevelInfo(totalXp);

  const completedMissions = new Set<string>();
  if ((compassData as { status?: string } | null)?.status === "completed") completedMissions.add("career_compass");
  if ((brandData as { status?: string } | null)?.status === "completed") completedMissions.add("story_builder");
  if ((interviewHistory?.length || 0) > 0) completedMissions.add("interview_intelligence");
  if ((negotiationHistory?.length || 0) > 0) completedMissions.add("negotiation_simulator");
  if ((applications?.length || 0) > 0) completedMissions.add("application_tracker");

  const totalCompleted = completedMissions.size;
  const overallProgress = Math.round((totalCompleted / ALL_MISSIONS.length) * 100);

  const stats = [
    { label: "Total XP", value: totalXp.toLocaleString(), icon: "⚡", color: "#22D3EE" },
    { label: "Day Streak", value: streak.toString(), icon: "🔥", color: "#FB923C" },
    { label: "Missions Done", value: `${totalCompleted}/${ALL_MISSIONS.length}`, icon: "✅", color: "#4ADE80" },
    { label: "Level", value: levelInfo.name, icon: "🏆", color: levelInfo.color },
  ];

  const recentInterviews = ((interviewHistory || []) as Array<{ id: number; interviewType: string; targetRole?: string | null; createdAt: Date; overallScore?: number | null; xpEarned: number }>).slice(0, 2);
  const recentNegotiations = ((negotiationHistory || []) as Array<{ id: number; scenarioTitle: string; createdAt: Date; outcomeScore?: number | null; xpEarned: number }>).slice(0, 2);

  return (
    <LaunchDarkLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 ld-slide-up">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--ld-font-heading)" }}>Your Launch Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--ld-text-muted)" }}>Track your progress across all 7 missions</p>
        </div>
        <button onClick={() => navigate("/launch/journey")} className="ld-btn-primary text-sm">
          Journey Map →
        </button>
      </div>

      {/* Loading state for progress */}
      {isProgressLoading && <LoadingState label="Loading your progress..." />}

      {/* Error state for progress */}
      {progressError && (
        <ErrorState
          message="Failed to load your progress. Please try again."
          onRetry={() => progressQuery.refetch()}
        />
      )}

      {/* Level Card */}
      {!isProgressLoading && !progressError && (
      <div className="ld-card ld-card-glow-cyan p-5 mb-6 ld-slide-up ld-stagger-1" style={{
        background: `linear-gradient(135deg, ${levelInfo.color}15, ${levelInfo.color}08)`,
        border: `1px solid ${levelInfo.color}44`,
      }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold mb-0.5" style={{ color: levelInfo.color, fontFamily: "var(--ld-font-heading)" }}>LEVEL {levelInfo.level}</div>
            <div className="text-xl font-bold" style={{ fontFamily: "var(--ld-font-heading)" }}>{levelInfo.name}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: levelInfo.color, fontFamily: "var(--ld-font-heading)" }}>{totalXp.toLocaleString()} XP</div>
            {levelInfo.xpToNext > 0 && <div className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{levelInfo.xpToNext} XP to next level</div>}
          </div>
        </div>
        <div className="ld-progress-track" style={{ height: 6 }}>
          <div className="ld-progress-fill" style={{ width: `${levelInfo.progress}%`, background: levelInfo.color }} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: "var(--ld-text-dim)" }}>
          <span>{levelInfo.minXp} XP</span>
          <span>{levelInfo.maxXp < 9999 ? `${levelInfo.maxXp} XP` : "Max Level"}</span>
        </div>
      </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`ld-card p-4 text-center ld-slide-up ld-stagger-${i + 1}`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-bold" style={{ color: stat.color, fontFamily: "var(--ld-font-heading)" }}>{stat.value}</div>
            <div className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Mission Progress */}
      <div className="ld-card p-5 mb-6 ld-slide-up ld-stagger-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base" style={{ fontFamily: "var(--ld-font-heading)" }}>Launch Journey Progress</h2>
          <span className="text-sm font-bold" style={{ color: "var(--ld-cyan)", fontFamily: "var(--ld-font-heading)" }}>{overallProgress}%</span>
        </div>
        <div className="ld-progress-track mb-4" style={{ height: 6 }}>
          <div className="ld-progress-fill" style={{ width: `${overallProgress}%` }} />
        </div>
        <div className="space-y-2">
          {ALL_MISSIONS.map((mission, i) => {
            const done = completedMissions.has(mission.key);
            return (
              <button
                key={mission.id}
                onClick={() => navigate(mission.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl ld-slide-up ld-stagger-${Math.min(i + 1, 6)}`}
                style={{
                  background: done ? `${mission.color}0D` : "var(--ld-surface)",
                  border: `1px solid ${done ? `${mission.color}44` : "var(--ld-border)"}`,
                  transition: "all 200ms var(--ld-ease-out)",
                }}
              >
                <span className="text-xl w-8 text-center">{mission.icon}</span>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{mission.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${mission.color}1A`, color: mission.color }}>{mission.category}</span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{mission.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{ color: done ? "var(--ld-green)" : "var(--ld-text-dim)" }}>+{mission.xp} XP</span>
                  {done ? <span style={{ color: "var(--ld-green)" }}>✓</span> : <span style={{ color: "var(--ld-text-dim)" }}>→</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Practice Sessions */}
      {(recentInterviews.length > 0 || recentNegotiations.length > 0) && (
        <div className="ld-card p-5 mb-6 ld-slide-up ld-stagger-3">
          <h2 className="font-semibold text-base mb-4" style={{ fontFamily: "var(--ld-font-heading)" }}>Recent Practice Sessions</h2>
          <div className="space-y-3">
            {recentInterviews.map((session) => (
              <div key={`i-${session.id}`} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎤</span>
                  <div>
                    <p className="text-sm font-medium">{session.interviewType.charAt(0).toUpperCase() + session.interviewType.slice(1)} Interview{session.targetRole ? ` — ${session.targetRole}` : ""}</p>
                    <p className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{new Date(session.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  {session.overallScore != null && <div className="text-sm font-bold" style={{ color: "var(--ld-cyan)" }}>{session.overallScore}/100</div>}
                  <div className="text-xs" style={{ color: "var(--ld-green)" }}>+{session.xpEarned} XP</div>
                </div>
              </div>
            ))}
            {recentNegotiations.map((session) => (
              <div key={`n-${session.id}`} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.2)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚖️</span>
                  <div>
                    <p className="text-sm font-medium">{session.scenarioTitle}</p>
                    <p className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{new Date(session.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  {session.outcomeScore != null && <div className="text-sm font-bold" style={{ color: "var(--ld-pink)" }}>{session.outcomeScore}/100</div>}
                  <div className="text-xs" style={{ color: "var(--ld-green)" }}>+{session.xpEarned} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Pipeline */}
      {(applications?.length || 0) > 0 && (
        <div className="ld-card p-5 mb-6 ld-slide-up ld-stagger-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base" style={{ fontFamily: "var(--ld-font-heading)" }}>Application Pipeline</h2>
            <button onClick={() => navigate("/launch/applications")} className="text-xs font-medium" style={{ color: "var(--ld-cyan)" }}>View All →</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { status: "wishlist", label: "Wishlist", icon: "⭐", color: "#94A3B8" },
              { status: "applied", label: "Applied", icon: "📤", color: "#22D3EE" },
              { status: "interview", label: "Interview", icon: "🎤", color: "#FB923C" },
              { status: "offer", label: "Offer", icon: "🎉", color: "#4ADE80" },
            ].map(({ status, label, icon, color }) => {
              const count = (applications || []).filter((a: { status: string }) => a.status === status).length;
              return (
                <div key={status} className="ld-card p-3 text-center" style={{ background: `${color}0D`, border: `1px solid ${color}33` }}>
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-xl font-bold" style={{ color, fontFamily: "var(--ld-font-heading)" }}>{count}</div>
                  <div className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* XP & Streak Charts */}
      {progressData?.recentXp && progressData.recentXp.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* XP History Chart */}
          <div className="ld-card p-5 ld-slide-up ld-stagger-5">
            <h2 className="font-semibold text-sm mb-3" style={{ fontFamily: "var(--ld-font-heading)" }}>XP Earned (Recent)</h2>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[...progressData.recentXp].reverse().map((e, i) => ({
                    label: `#${i + 1}`,
                    xp: e.xpEarned,
                    action: (e.action as string).replace(/_/g, " "),
                  }))}
                  margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="xpGradDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "rgba(248,250,252,0.35)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "rgba(248,250,252,0.35)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "rgba(248,250,252,0.6)" }}
                    itemStyle={{ color: "#22D3EE" }}
                    formatter={(val: number, _name: string, props: { payload?: { action?: string } }) => [`+${val} XP`, props?.payload?.action ?? ""]}
                  />
                  <Area type="monotone" dataKey="xp" stroke="#22D3EE" strokeWidth={2} fill="url(#xpGradDark)" dot={{ r: 3, fill: "#22D3EE" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* XP by Activity Type */}
          <div className="ld-card p-5 ld-slide-up ld-stagger-6">
            <h2 className="font-semibold text-sm mb-3" style={{ fontFamily: "var(--ld-font-heading)" }}>XP by Activity Type</h2>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(() => {
                    const grouped: Record<string, number> = {};
                    for (const e of progressData.recentXp) {
                      const key = (e.action as string).replace(/_/g, " ").slice(0, 14);
                      grouped[key] = (grouped[key] ?? 0) + (e.xpEarned as number);
                    }
                    return Object.entries(grouped).map(([name, xp]) => ({ name, xp }));
                  })()}
                  margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: "rgba(248,250,252,0.35)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "rgba(248,250,252,0.35)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0F172A", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "rgba(248,250,252,0.6)" }}
                    itemStyle={{ color: "#4ADE80" }}
                    formatter={(val: number) => [`${val} XP`, "Total"]}
                  />
                  <Bar dataKey="xp" radius={[4, 4, 0, 0]}>
                    {(() => {
                      const colors = ["#22D3EE", "#A78BFA", "#4ADE80", "#FB923C", "#F472B6", "#94A3B8"];
                      const grouped: Record<string, number> = {};
                      for (const e of progressData.recentXp) {
                        const key = (e.action as string).replace(/_/g, " ").slice(0, 14);
                        grouped[key] = (grouped[key] ?? 0) + (e.xpEarned as number);
                      }
                      return Object.keys(grouped).map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                      ));
                    })()}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Start Interview Prep", icon: "🎤", path: "/launch/interview", color: "#22D3EE" },
          { label: "Practice Negotiation", icon: "⚖️", path: "/launch/negotiate", color: "#F472B6" },
          { label: "Track Applications", icon: "📋", path: "/launch/applications", color: "#4ADE80" },
          { label: "Resume Makeover", icon: "📄", path: "/launch/resume", color: "#FB923C" },
          { label: "Skill Sprint", icon: "⚡", path: "/launch/mission/3", color: "#A78BFA" },
          { label: "View Journey Map", icon: "🗺️", path: "/launch/journey", color: "#94A3B8" },
        ].map((action, i) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className={`ld-card p-4 text-left ld-slide-up ld-stagger-${Math.min(i + 1, 6)}`}
            style={{ background: `${action.color}0D`, border: `1px solid ${action.color}33` }}
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <div className="text-sm font-semibold" style={{ color: action.color }}>{action.label}</div>
          </button>
        ))}
      </div>
    </LaunchDarkLayout>
  );
}
