import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Sun, Target, Calendar, Zap, MessageSquare, TrendingUp, CheckCircle2, ArrowRight, Sparkles, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function PEHome() {
  const { user } = useAuth();
  const [briefGenerating, setBriefGenerating] = useState(false);
  const utils = trpc.useUtils();

  const summary = trpc.pei.getDashboardSummary.useQuery();
  const briefSnapshot = trpc.pei.getTodayBriefSnapshot.useQuery();
  const upcomingEvents = trpc.pei.getUpcomingEvents.useQuery({ days: 7 });
  const generateBrief = trpc.pei.generateDailyBrief.useMutation({
    onSuccess: (data, variables) => {
      utils.pei.getTodayBriefSnapshot.setData(undefined, data);
      summary.refetch();
      setBriefGenerating(false);
      toast.success(variables?.refresh ? "Your daily brief has been refreshed." : "Your daily brief is ready.");
    },
    onError: () => {
      setBriefGenerating(false);
      toast.error("Could not refresh your daily brief. Please try again.");
    },
  });

  useEffect(() => {
    if (!briefSnapshot.data && !briefSnapshot.isLoading && !briefGenerating) {
      setBriefGenerating(true);
      generateBrief.mutate({ refresh: false });
    }
  }, [briefSnapshot.data, briefSnapshot.isLoading]);

  if (summary.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-sm" style={{ color: "oklch(55% 0.02 248.6)" }}>Loading your dashboard...</div>
      </div>
    );
  }

  const brief = briefSnapshot.data;
  const hasAssessment = !!summary.data?.latestResult;
  const userName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Greeting & Day Theme */}
      <div className="rounded-2xl p-6" style={{ background: "var(--color-ln-navy)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#d4af37" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-lg md:text-xl font-semibold text-white leading-snug">
              {brief?.greeting ?? `Good morning, ${userName}.`}
            </h1>
            {brief?.dayTheme && (
              <p className="text-sm mt-2" style={{ color: "oklch(75% 0.02 248.6)" }}>
                Today's theme: <span style={{ color: "#d4af37" }}>{brief.dayTheme}</span>
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBriefGenerating(true);
              generateBrief.mutate({ refresh: true });
            }}
            disabled={briefGenerating}
            style={{ borderColor: "#d4af37", color: "#d4af37", background: "transparent" }}
          >
            <Sparkles size={14} className="mr-1" />
            {briefGenerating ? "Generating..." : "Refresh Brief"}
          </Button>
        </div>
      </div>

      {/* Priority Focus */}
      {brief?.priorityFocus && (
        <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style={{ background: "oklch(from #d4af37 l c h / 0.12)" }}>
              <Target size={18} style={{ color: "#d4af37" }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(55% 0.02 248.6)" }}>Priority Focus</p>
              <p className="text-sm mt-1" style={{ color: "var(--color-ln-navy)" }}>{brief.priorityFocus}</p>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started / Empty State */}
      {!hasAssessment && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 text-center" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ background: "oklch(from #d4af37 l c h / 0.12)" }}>
            <Zap size={28} style={{ color: "#d4af37" }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>Start with your PEI Assessment</h2>
          <p className="text-sm mb-4" style={{ color: "oklch(50% 0.02 248.6)" }}>
            Complete the 30-question Professional Effectiveness Index to unlock personalized coaching, practice scenarios, and your daily brief.
          </p>
          <Link href="/pe/assessment">
            <Button style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}>
              Take the Assessment <ArrowRight size={16} className="ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/pe/coach">
          <div className="bg-white rounded-2xl shadow-sm border p-5 cursor-pointer hover:shadow-md transition-shadow duration-200" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl mb-3" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}>
              <MessageSquare size={18} style={{ color: "var(--color-ln-navy)" }} />
            </div>
            <h3 className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>AI Coach</h3>
            <p className="text-xs mt-1" style={{ color: "oklch(55% 0.02 248.6)" }}>Get coaching on any professional challenge</p>
          </div>
        </Link>
        <Link href="/pe/practice">
          <div className="bg-white rounded-2xl shadow-sm border p-5 cursor-pointer hover:shadow-md transition-shadow duration-200" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl mb-3" style={{ background: "oklch(from #d4af37 l c h / 0.12)" }}>
              <Zap size={18} style={{ color: "#d4af37" }} />
            </div>
            <h3 className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Practice Partner</h3>
            <p className="text-xs mt-1" style={{ color: "oklch(55% 0.02 248.6)" }}>Role-play high-stakes conversations</p>
          </div>
        </Link>
        <Link href="/pe/assessment">
          <div className="bg-white rounded-2xl shadow-sm border p-5 cursor-pointer hover:shadow-md transition-shadow duration-200" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl mb-3" style={{ background: "oklch(from #22c55e l c h / 0.12)" }}>
              <TrendingUp size={18} style={{ color: "#22c55e" }} />
            </div>
            <h3 className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>PEI Assessment</h3>
            <p className="text-xs mt-1" style={{ color: "oklch(55% 0.02 248.6)" }}>
              {hasAssessment ? `Score: ${Math.round(summary.data?.latestResult?.overallScore ?? 0)}/100` : "Take the 30-question assessment"}
            </p>
          </div>
        </Link>
      </div>

      {/* Calendar Events */}
      {upcomingEvents.data && upcomingEvents.data.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Upcoming Calendar</h3>
            <Link href="/pe/settings">
              <span className="text-xs font-medium" style={{ color: "#d4af37" }}>Manage calendars →</span>
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingEvents.data.slice(0, 5).map((e: any) => {
              const eventDate = new Date(e.startTime);
              const isToday = eventDate.toDateString() === new Date().toDateString();
              const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
              const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              return (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: isToday ? "oklch(from #d4af37 l c h / 0.06)" : "oklch(96% 0.02 248.6)" }}>
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg flex-shrink-0" style={{ background: isToday ? "var(--color-ln-navy)" : "oklch(90% 0.02 248.6)" }}>
                    <span className="text-xs font-bold" style={{ color: isToday ? "#d4af37" : "var(--color-ln-navy)" }}>{dayLabel}</span>
                    <span className="text-xs" style={{ color: isToday ? "oklch(75% 0.02 248.6)" : "oklch(55% 0.02 248.6)" }}>{eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-ln-navy)" }}>{e.title ?? "Untitled event"}</p>
                    {e.location && <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>📍 {e.location}</p>}
                  </div>
                  {e.eventType && (
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)", color: "var(--color-ln-navy)" }}>{e.eventType}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Brief Calendar Items (from AI-generated brief) */}
      {brief?.calendarItems && Array.isArray(brief.calendarItems) && brief.calendarItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} style={{ color: "#d4af37" }} />
            <h3 className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Today's Schedule</h3>
          </div>
          <div className="space-y-2">
            {brief.calendarItems.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "oklch(96% 0.02 248.6)" }}>
                <Clock size={14} className="flex-shrink-0" style={{ color: "oklch(55% 0.02 248.6)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--color-ln-navy)" }}>{item.time}</span>
                <span className="text-sm" style={{ color: "var(--color-ln-navy)" }}>{item.title}</span>
                {item.type && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)", color: "var(--color-ln-navy)" }}>{item.type}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commitment Reminder from Brief */}
      {brief?.commitmentReminder && (
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "oklch(from #f97316 l c h / 0.06)", border: "1px solid oklch(from #f97316 l c h / 0.2)" }}>
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#f97316" }} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#f97316" }}>Commitment Reminder</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-ln-navy)" }}>{brief.commitmentReminder}</p>
          </div>
        </div>
      )}

      {/* Development Suggestion */}
      {brief?.developmentSuggestion && (
        <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style={{ background: "oklch(from #6366f1 l c h / 0.12)" }}>
              <Sun size={18} style={{ color: "#6366f1" }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(55% 0.02 248.6)" }}>Today's Development Suggestion</p>
              <p className="text-sm font-semibold mt-1" style={{ color: "var(--color-ln-navy)" }}>{brief.developmentSuggestion.topic}</p>
              <p className="text-xs mt-1" style={{ color: "oklch(50% 0.02 248.6)" }}>{brief.developmentSuggestion.why}</p>
              <p className="text-sm mt-2" style={{ color: "var(--color-ln-navy)" }}>{brief.developmentSuggestion.action}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reflection Question */}
      {brief?.reflectionQuestion && (
        <div className="rounded-2xl p-5" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.04)" }}>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style={{ background: "var(--color-ln-navy)" }}>
              <Sparkles size={18} style={{ color: "#d4af37" }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(55% 0.02 248.6)" }}>Reflection Question</p>
              <p className="text-sm mt-1 italic" style={{ color: "var(--color-ln-navy)" }}>"{brief.reflectionQuestion}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Active Commitments */}
      {summary.data && summary.data.activeCommitmentsCount > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Active Commitments</h3>
            <Link href="/pe/progress">
              <span className="text-xs font-medium" style={{ color: "#d4af37" }}>View all →</span>
            </Link>
          </div>
          <div className="space-y-2">
            {summary.data.activeCommitments.map((c: any) => (
              <div key={c.id} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(70% 0.02 248.6)" }} />
                <p className="text-sm" style={{ color: "var(--color-ln-navy)" }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coaching Nudge */}
      {brief?.coachingNudge && (
        <div className="text-center py-2">
          <p className="text-sm" style={{ color: "oklch(55% 0.02 248.6)" }}>
            <span style={{ color: "#d4af37" }}>✦</span> {brief.coachingNudge}
          </p>
        </div>
      )}
    </div>
  );
}
