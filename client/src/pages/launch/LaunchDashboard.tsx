import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import LaunchLayout from "@/components/LaunchLayout";

const ALL_MISSIONS = [
  { id: 1, key: "career_compass", title: "Career Compass", description: "Discover your ideal career direction", icon: "🧭", xp: 100, path: "/launch/mission/1", category: "Discover", color: "#4F9CF9" },
  { id: 2, key: "story_builder", title: "Story Builder", description: "Craft your personal brand narrative", icon: "✍️", xp: 100, path: "/launch/mission/2", category: "Brand", color: "#9F7AEA" },
  { id: 3, key: "skill_sprint", title: "Skill Sprint", description: "Build 10 essential career skills", icon: "⚡", xp: 150, path: "/launch/mission/3", category: "Skills", color: "#3DDC97" },
  { id: 4, key: "resume_makeover", title: "Resume Makeover", description: "AI-powered resume analysis & rewrite", icon: "📄", xp: 75, path: "/launch/resume", category: "Apply", color: "#F6AD55" },
  { id: 5, key: "interview_intelligence", title: "Interview Intelligence", description: "Practice with an AI interviewer", icon: "🎤", xp: 75, path: "/launch/interview", category: "Apply", color: "#4F9CF9" },
  { id: 6, key: "negotiation_simulator", title: "Negotiation Simulator", description: "Master salary negotiation", icon: "⚖️", xp: 100, path: "/launch/negotiate", category: "Negotiate", color: "#667EEA" },
  { id: 7, key: "application_tracker", title: "Application Tracker", description: "Manage your job pipeline", icon: "📋", xp: 50, path: "/launch/applications", category: "Track", color: "#A0AEC0" },
];

function getLevelInfo(xp: number) {
  const levels = [
    { level: 1, name: "Explorer", minXp: 0, maxXp: 200, color: "#A0AEC0" },
    { level: 2, name: "Seeker", minXp: 200, maxXp: 500, color: "#68D391" },
    { level: 3, name: "Builder", minXp: 500, maxXp: 900, color: "#4F9CF9" },
    { level: 4, name: "Achiever", minXp: 900, maxXp: 1400, color: "#9F7AEA" },
    { level: 5, name: "Champion", minXp: 1400, maxXp: 2000, color: "#F6AD55" },
    { level: 6, name: "Legend", minXp: 2000, maxXp: 9999, color: "#FC8181" },
  ];
  const current = levels.findLast((l) => xp >= l.minXp) || levels[0];
  const progress = current.maxXp < 9999 ? Math.min(100, Math.round(((xp - current.minXp) / (current.maxXp - current.minXp)) * 100)) : 100;
  const xpToNext = current.maxXp < 9999 ? current.maxXp - xp : 0;
  return { ...current, progress, xpToNext };
}

export default function LaunchDashboard() {
  const [, navigate] = useLocation();
  const { data: progressData } = trpc.launchProgress.getProgress.useQuery();
  const { data: compassData } = trpc.launchCareerCompass.getSession.useQuery();
  const { data: brandData } = trpc.launchStoryBuilder.getBrandKit.useQuery();
  const { data: interviewHistory } = trpc.launchInterview.getHistory.useQuery();
  const { data: negotiationHistory } = trpc.launchNegotiation.getHistory.useQuery();
  const { data: applications } = trpc.launchApplications.getAll.useQuery();

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
    { label: "Total XP", value: totalXp.toLocaleString(), icon: "⚡", color: "#4F9CF9" },
    { label: "Day Streak", value: streak.toString(), icon: "🔥", color: "#FC8181" },
    { label: "Missions Done", value: `${totalCompleted}/${ALL_MISSIONS.length}`, icon: "✅", color: "#3DDC97" },
    { label: "Level", value: levelInfo.name, icon: "🏆", color: levelInfo.color },
  ];

  const recentInterviews = ((interviewHistory || []) as Array<{ id: number; interviewType: string; targetRole?: string | null; createdAt: Date; overallScore?: number | null; xpEarned: number }>).slice(0, 2);
  const recentNegotiations = ((negotiationHistory || []) as Array<{ id: number; scenarioTitle: string; createdAt: Date; outcomeScore?: number | null; xpEarned: number }>).slice(0, 2);

  return (
    <LaunchLayout>
      <div className="min-h-screen" style={{ background: "var(--launch-white, #FAFBFC)" }}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--launch-slate, #2D3748)", fontFamily: "Space Grotesk, sans-serif" }}>Your Launch Dashboard</h1>
              <p className="text-sm mt-0.5" style={{ color: "#718096" }}>Track your progress across all 7 missions</p>
            </div>
            <Button onClick={() => navigate("/launch/journey")} className="rounded-xl text-sm font-semibold" style={{ background: "var(--launch-blue, #4F9CF9)", color: "white" }}>
              Journey Map →
            </Button>
          </div>

          {/* Level Card */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: `linear-gradient(135deg, ${levelInfo.color}22, ${levelInfo.color}11)`, border: `1px solid ${levelInfo.color}44` }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-semibold mb-0.5" style={{ color: levelInfo.color }}>LEVEL {levelInfo.level}</div>
                <div className="text-xl font-bold" style={{ color: "var(--launch-slate, #2D3748)", fontFamily: "Space Grotesk, sans-serif" }}>{levelInfo.name}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: levelInfo.color, fontFamily: "Space Grotesk, sans-serif" }}>{totalXp.toLocaleString()} XP</div>
                {levelInfo.xpToNext > 0 && <div className="text-xs" style={{ color: "#718096" }}>{levelInfo.xpToNext} XP to next level</div>}
              </div>
            </div>
            <div className="h-3 rounded-full" style={{ background: "rgba(0,0,0,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${levelInfo.progress}%`, background: levelInfo.color }} />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: "#A0AEC0" }}>
              <span>{levelInfo.minXp} XP</span>
              <span>{levelInfo.maxXp < 9999 ? `${levelInfo.maxXp} XP` : "Max Level"}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl p-4 text-center" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-xl font-bold" style={{ color: stat.color, fontFamily: "Space Grotesk, sans-serif" }}>{stat.value}</div>
                <div className="text-xs" style={{ color: "#A0AEC0" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Mission Progress */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-base" style={{ color: "var(--launch-slate, #2D3748)" }}>Launch Journey Progress</h2>
              <span className="text-sm font-bold" style={{ color: "var(--launch-blue, #4F9CF9)" }}>{overallProgress}%</span>
            </div>
            <div className="h-3 rounded-full mb-4" style={{ background: "#EDF2F7" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${overallProgress}%`, background: "linear-gradient(90deg, #4F9CF9, #3DDC97)" }} />
            </div>
            <div className="space-y-2">
              {ALL_MISSIONS.map((mission) => {
                const done = completedMissions.has(mission.key);
                return (
                  <button key={mission.id} onClick={() => navigate(mission.path)} className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-90"
                    style={{ background: done ? "rgba(61, 220, 151, 0.06)" : "rgba(0,0,0,0.02)", border: `1px solid ${done ? "rgba(61, 220, 151, 0.3)" : "#E2E8F0"}` }}>
                    <span className="text-xl w-8 text-center">{mission.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: "var(--launch-slate, #2D3748)" }}>{mission.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${mission.color}15`, color: mission.color }}>{mission.category}</span>
                      </div>
                      <p className="text-xs" style={{ color: "#718096" }}>{mission.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs" style={{ color: done ? "#3DDC97" : "#A0AEC0" }}>+{mission.xp} XP</span>
                      {done ? <span className="text-green-500">✓</span> : <span style={{ color: "#CBD5E0" }}>→</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Practice Sessions */}
          {(recentInterviews.length > 0 || recentNegotiations.length > 0) && (
            <div className="rounded-2xl p-5 mb-6" style={{ background: "white", border: "1px solid #E2E8F0" }}>
              <h2 className="font-semibold text-base mb-4" style={{ color: "var(--launch-slate, #2D3748)" }}>Recent Practice Sessions</h2>
              <div className="space-y-3">
                {recentInterviews.map((session) => (
                  <div key={`i-${session.id}`} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(79, 156, 249, 0.06)", border: "1px solid rgba(79, 156, 249, 0.2)" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🎤</span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--launch-slate, #2D3748)" }}>{session.interviewType.charAt(0).toUpperCase() + session.interviewType.slice(1)} Interview{session.targetRole ? ` — ${session.targetRole}` : ""}</p>
                        <p className="text-xs" style={{ color: "#718096" }}>{new Date(session.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {session.overallScore != null && <div className="text-sm font-bold" style={{ color: "#4F9CF9" }}>{session.overallScore}/100</div>}
                      <div className="text-xs" style={{ color: "#3DDC97" }}>+{session.xpEarned} XP</div>
                    </div>
                  </div>
                ))}
                {recentNegotiations.map((session) => (
                  <div key={`n-${session.id}`} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(102, 126, 234, 0.06)", border: "1px solid rgba(102, 126, 234, 0.2)" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⚖️</span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--launch-slate, #2D3748)" }}>{session.scenarioTitle}</p>
                        <p className="text-xs" style={{ color: "#718096" }}>{new Date(session.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {session.outcomeScore != null && <div className="text-sm font-bold" style={{ color: "#667EEA" }}>{session.outcomeScore}/100</div>}
                      <div className="text-xs" style={{ color: "#3DDC97" }}>+{session.xpEarned} XP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Pipeline */}
          {(applications?.length || 0) > 0 && (
            <div className="rounded-2xl p-5 mb-6" style={{ background: "white", border: "1px solid #E2E8F0" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-base" style={{ color: "var(--launch-slate, #2D3748)" }}>Application Pipeline</h2>
                <button onClick={() => navigate("/launch/applications")} className="text-xs font-medium" style={{ color: "#4F9CF9" }}>View All →</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { status: "wishlist", label: "Wishlist", icon: "⭐", color: "#A0AEC0" },
                  { status: "applied", label: "Applied", icon: "📤", color: "#4F9CF9" },
                  { status: "interview", label: "Interview", icon: "🎤", color: "#F6AD55" },
                  { status: "offer", label: "Offer", icon: "🎉", color: "#3DDC97" },
                ].map(({ status, label, icon, color }) => {
                  const count = (applications || []).filter((a: { status: string }) => a.status === status).length;
                  return (
                    <div key={status} className="rounded-xl p-3 text-center" style={{ background: `${color}11`, border: `1px solid ${color}33` }}>
                      <div className="text-xl mb-1">{icon}</div>
                      <div className="text-xl font-bold" style={{ color, fontFamily: "Space Grotesk, sans-serif" }}>{count}</div>
                      <div className="text-xs" style={{ color: "#718096" }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Start Interview Prep", icon: "🎤", path: "/launch/interview", color: "#4F9CF9" },
              { label: "Practice Negotiation", icon: "⚖️", path: "/launch/negotiate", color: "#667EEA" },
              { label: "Track Applications", icon: "📋", path: "/launch/applications", color: "#3DDC97" },
              { label: "Resume Makeover", icon: "📄", path: "/launch/resume", color: "#F6AD55" },
              { label: "Skill Sprint", icon: "⚡", path: "/launch/mission/3", color: "#FC8181" },
              { label: "View Journey Map", icon: "🗺️", path: "/launch/journey", color: "#9F7AEA" },
            ].map((action) => (
              <button key={action.path} onClick={() => navigate(action.path)} className="p-4 rounded-xl text-left transition-all hover:opacity-90" style={{ background: `${action.color}11`, border: `1px solid ${action.color}33` }}>
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="text-sm font-semibold" style={{ color: action.color }}>{action.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </LaunchLayout>
  );
}
