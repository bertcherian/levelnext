import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, Star, TrendingUp, AlertCircle, Lightbulb, MessageSquare, RotateCcw } from "lucide-react";

const PLATFORM_ACCENT: Record<string, string> = {
  leadership: "#D4AF37",
  manager: "#4ade80",
  career: "#D4AF37",
  young: "#818cf8",
};

const PLATFORM_BG: Record<string, string> = {
  leadership: "#0A1A2F",
  manager: "#1a3a2a",
  career: "#0A1A2F",
  young: "#1a1a3a",
};

const PLATFORM_PRACTICE_URL: Record<string, string> = {
  leadership: "/practice",
  manager: "/manager/practice",
  career: "/career/simulate",
  young: "/young/simulate",
};

type BehaviourScore = { label: string; score: number; max: number };
type CoachingInsight = { moment: string; tryInstead: string };

export default function SimulatorDebrief() {
  const [, params] = useRoute("/simulator/:sessionId/debrief");
  const [, navigate] = useLocation();
  const sessionId = parseInt(params?.sessionId ?? "0");
  const [showTranscript, setShowTranscript] = useState(false);

  const { data: session, isLoading } = trpc.simulator.getSession.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1A2F]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mx-auto mb-3" />
          <p className="text-white/60 text-sm">Generating your debrief...</p>
        </div>
      </div>
    );
  }

  const platform = session.platform as string;
  const accent = PLATFORM_ACCENT[platform] ?? "#D4AF37";
  const bg = PLATFORM_BG[platform] ?? "#0A1A2F";
  const practiceUrl = PLATFORM_PRACTICE_URL[platform] ?? "/practice";

  const behaviourScores = (session.behaviourScores as BehaviourScore[]) ?? [];
  const strengths = (session.strengths as string[]) ?? [];
  const improvements = (session.improvements as string[]) ?? [];
  const coachingInsights = (session.coachingInsights as CoachingInsight[]) ?? [];
  const messages = (session.messages as Array<{ role: string; content: string; timestamp: number }>) ?? [];
  const overallScore = session.overallScore ?? 0;
  const scoreColor = overallScore >= 80 ? "#4ade80" : overallScore >= 60 ? accent : "#f87171";

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: accent }}>Session Complete</p>
            <h1 className="text-white font-bold text-lg">{session.conversationType as string}</h1>
          </div>
          <Button onClick={() => navigate(practiceUrl)} variant="outline" size="sm"
            className="border-white/20 text-white/70 hover:text-white text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />Practice Again
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Overall Score */}
        <div className="rounded-2xl p-6 text-center border" style={{ borderColor: accent + "30", background: "rgba(255,255,255,0.04)" }}>
          <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Overall Performance</p>
          <div className="text-6xl font-bold mb-2" style={{ color: scoreColor }}>{overallScore}</div>
          <div className="text-white/40 text-sm mb-4">out of 100</div>
          {session.keyTakeaway && (
            <div className="rounded-xl px-4 py-3 text-sm text-white/80 italic border"
              style={{ borderColor: accent + "20", background: accent + "08" }}>
              "{session.keyTakeaway as string}"
            </div>
          )}
        </div>

        {/* Behaviour Scores */}
        {behaviourScores.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Star className="w-4 h-4" style={{ color: accent }} />Behaviour Scores
            </h2>
            <div className="space-y-3">
              {behaviourScores.map((b, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/80 text-sm">{b.label}</span>
                    <span className="text-white font-semibold text-sm">{b.score}<span className="text-white/30">/{b.max}</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full" style={{ width: `${(b.score / b.max) * 100}%`, background: accent }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strengths.length > 0 && (
            <div className="rounded-xl p-5 border" style={{ borderColor: "#4ade8030", background: "rgba(74,222,128,0.04)" }}>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "#4ade80" }}>
                <TrendingUp className="w-4 h-4" />What worked well
              </h3>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="text-white/75 text-sm flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#4ade80" }} />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {improvements.length > 0 && (
            <div className="rounded-xl p-5 border" style={{ borderColor: "#f8717130", background: "rgba(248,113,113,0.04)" }}>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-[#f87171]">
                <AlertCircle className="w-4 h-4" />Areas to develop
              </h3>
              <ul className="space-y-2">
                {improvements.map((s, i) => (
                  <li key={i} className="text-white/75 text-sm flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#f87171]" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Coaching Insights */}
        {coachingInsights.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" style={{ color: accent }} />Coaching Insights
            </h2>
            <div className="space-y-3">
              {coachingInsights.map((insight, i) => (
                <div key={i} className="rounded-xl p-4 border" style={{ borderColor: accent + "20", background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-white/50 text-xs mb-1">What you said</p>
                  <p className="text-white/80 text-sm mb-3 italic">"{insight.moment}"</p>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: accent }}>Try instead</p>
                  <p className="text-white/80 text-sm">{insight.tryInstead}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transcript */}
        <div>
          <button onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
            <MessageSquare className="w-4 h-4" />
            {showTranscript ? "Hide" : "View"} full transcript
          </button>
          {showTranscript && (
            <div className="mt-4 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                <p className="text-white/60 text-xs uppercase tracking-wider">Conversation Transcript</p>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm"
                      style={{ background: msg.role === "user" ? accent + "20" : "rgba(255,255,255,0.05)", color: msg.role === "user" ? "white" : "rgba(255,255,255,0.75)" }}>
                      <p className="text-xs mb-1" style={{ color: msg.role === "user" ? accent : "rgba(255,255,255,0.3)" }}>
                        {msg.role === "user" ? "You" : session.characterName as string}
                      </p>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button onClick={() => navigate(practiceUrl)} className="flex-1 font-semibold" style={{ background: accent, color: bg }}>
            Practice Again <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Button onClick={() => navigate("/")} variant="outline" className="flex-1 border-white/20 text-white/70 hover:text-white">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
