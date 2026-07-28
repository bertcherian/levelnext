import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Loader2, ChevronRight, Star, TrendingUp, AlertCircle,
  Lightbulb, MessageSquare, RotateCcw, Download, Sparkles,
  BookOpen, Mic, Users, Brain, CheckCircle2, Target,
} from "lucide-react";

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

const CATEGORY_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  practice: { icon: <Mic className="w-3.5 h-3.5" />, label: "Practice", color: "#D4AF37" },
  reflection: { icon: <Brain className="w-3.5 h-3.5" />, label: "Reflect", color: "#818cf8" },
  reading: { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Read", color: "#38bdf8" },
  conversation: { icon: <Users className="w-3.5 h-3.5" />, label: "Conversation", color: "#4ade80" },
};

type BehaviourScore = { label: string; score: number; max: number };
type CoachingInsight = { moment: string; tryInstead: string };
type ActionItem = { day: string; title: string; description: string; category: string };
type ActionPlan = {
  headline: string;
  summary: string;
  actions: ActionItem[];
  weeklyCommitment: string;
  successIndicator: string;
};

export default function SimulatorDebrief() {
  const [, params] = useRoute("/simulator/:sessionId/debrief");
  const [, navigate] = useLocation();
  const sessionId = parseInt(params?.sessionId ?? "0");
  const [showTranscript, setShowTranscript] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading } = trpc.simulator.getSession.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  const generatePlanMutation = trpc.simulator.generateActionPlan.useMutation({
    onSuccess: (data) => setActionPlan(data as ActionPlan),
  });

  const handleGeneratePlan = () => {
    generatePlanMutation.mutate({ sessionId });
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    const prevShow = showTranscript;
    setShowTranscript(true);
    setTimeout(() => {
      const printContent = reportRef.current;
      if (!printContent) { setIsExporting(false); return; }
      const printWindow = window.open("", "_blank");
      if (!printWindow) { setIsExporting(false); return; }
      const acc = PLATFORM_ACCENT[session?.platform as string] ?? "#D4AF37";
      const bg2 = PLATFORM_BG[session?.platform as string] ?? "#0A1A2F";

      const bScores = (session?.behaviourScores as BehaviourScore[] ?? []);
      const strs = (session?.strengths as string[] ?? []);
      const imps = (session?.improvements as string[] ?? []);
      const cInsights = (session?.coachingInsights as CoachingInsight[] ?? []);
      const msgs = (session?.messages as Array<{ role: string; content: string }> ?? []);

      const actionPlanHtml = actionPlan ? `
        <div class="section">
          <h2>Action Plan: ${actionPlan.headline}</h2>
          <p style="color:rgba(255,255,255,0.7);font-size:14px;margin-bottom:16px;">${actionPlan.summary}</p>
          ${actionPlan.actions.map((a, i) => `
            <div style="background:rgba(255,255,255,0.04);border:1px solid ${acc}20;border-radius:10px;padding:14px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:12px;color:${acc};font-weight:600;">${a.day}</span>
                <span style="font-size:11px;background:rgba(255,255,255,0.08);padding:2px 8px;border-radius:10px;color:rgba(255,255,255,0.5);">${a.category}</span>
              </div>
              <div style="font-size:14px;font-weight:600;color:white;margin-bottom:4px;">${i + 1}. ${a.title}</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.7);">${a.description}</div>
            </div>
          `).join("")}
          <div style="margin-top:16px;padding:12px 16px;background:${acc}10;border:1px solid ${acc}20;border-radius:10px;">
            <div style="font-size:12px;color:${acc};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Success Indicator</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);">${actionPlan.successIndicator}</div>
          </div>
          <div style="margin-top:10px;font-size:12px;color:rgba(255,255,255,0.4);">Commitment: ${actionPlan.weeklyCommitment}</div>
        </div>
      ` : "";

      printWindow.document.write(`<!DOCTYPE html><html><head>
        <title>Practice Debrief — ${session?.conversationType ?? "Session"}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: ${bg2}; color: white; padding: 40px; }
          .header { border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 20px; margin-bottom: 30px; }
          .badge { display: inline-block; background: ${acc}20; color: ${acc}; border: 1px solid ${acc}40; padding: 4px 12px; border-radius: 20px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          h1 { font-size: 22px; font-weight: 700; color: white; }
          .meta { color: rgba(255,255,255,0.5); font-size: 13px; margin-top: 4px; }
          .score-box { background: rgba(255,255,255,0.05); border: 1px solid ${acc}30; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
          .score-num { font-size: 56px; font-weight: 800; color: ${acc}; line-height: 1; }
          .score-label { color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 4px; }
          .takeaway { background: ${acc}10; border: 1px solid ${acc}20; border-radius: 10px; padding: 12px 16px; color: rgba(255,255,255,0.8); font-style: italic; font-size: 14px; margin-top: 12px; }
          h2 { font-size: 15px; font-weight: 600; color: white; margin-bottom: 14px; }
          .section { margin-bottom: 28px; }
          .bar-row { margin-bottom: 10px; }
          .bar-label { display: flex; justify-content: space-between; font-size: 13px; color: rgba(255,255,255,0.8); margin-bottom: 4px; }
          .bar-track { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; }
          .bar-fill { height: 8px; background: ${acc}; border-radius: 4px; }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
          .card { background: rgba(255,255,255,0.04); border-radius: 12px; padding: 16px; }
          .card-green { border: 1px solid rgba(74,222,128,0.3); }
          .card-red { border: 1px solid rgba(248,113,113,0.3); }
          .card-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
          .card-title-green { color: #4ade80; }
          .card-title-red { color: #f87171; }
          .bullet { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.75); margin-bottom: 6px; }
          .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
          .insight { background: rgba(255,255,255,0.03); border: 1px solid ${acc}20; border-radius: 10px; padding: 14px; margin-bottom: 10px; }
          .insight-label { font-size: 11px; color: rgba(255,255,255,0.4); margin-bottom: 4px; text-transform: uppercase; }
          .insight-said { font-size: 13px; color: rgba(255,255,255,0.75); font-style: italic; margin-bottom: 10px; }
          .insight-try-label { font-size: 11px; color: ${acc}; text-transform: uppercase; margin-bottom: 4px; }
          .insight-try { font-size: 13px; color: rgba(255,255,255,0.8); }
          .transcript-msg { margin-bottom: 10px; }
          .msg-you { text-align: right; }
          .msg-bubble { display: inline-block; max-width: 75%; border-radius: 12px; padding: 8px 14px; font-size: 13px; }
          .msg-bubble-you { background: ${acc}20; color: white; }
          .msg-bubble-ai { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); }
          .msg-name { font-size: 11px; margin-bottom: 3px; }
          .msg-name-you { color: ${acc}; text-align: right; }
          .msg-name-ai { color: rgba(255,255,255,0.3); }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); font-size: 12px; text-align: center; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head><body>
        <div class="header">
          <div class="badge">LevelNext Practice Debrief</div>
          <h1>${session?.conversationType ?? "Practice Session"}</h1>
          <p class="meta">Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div class="score-box">
          <div class="score-num">${session?.overallScore ?? 0}</div>
          <div class="score-label">Overall Performance Score / 100</div>
          ${session?.keyTakeaway ? `<div class="takeaway">"${session.keyTakeaway}"</div>` : ""}
        </div>
        ${bScores.length > 0 ? `<div class="section"><h2>Behaviour Scores</h2>${bScores.map(b => `<div class="bar-row"><div class="bar-label"><span>${b.label}</span><span>${b.score}/${b.max}</span></div><div class="bar-track"><div class="bar-fill" style="width:${Math.round((b.score / b.max) * 100)}%"></div></div></div>`).join("")}</div>` : ""}
        <div class="two-col">
          ${strs.length > 0 ? `<div class="card card-green"><div class="card-title card-title-green">What worked well</div>${strs.map(s => `<div class="bullet"><div class="dot" style="background:#4ade80"></div><span>${s}</span></div>`).join("")}</div>` : ""}
          ${imps.length > 0 ? `<div class="card card-red"><div class="card-title card-title-red">Areas to develop</div>${imps.map(s => `<div class="bullet"><div class="dot" style="background:#f87171"></div><span>${s}</span></div>`).join("")}</div>` : ""}
        </div>
        ${cInsights.length > 0 ? `<div class="section"><h2>Coaching Insights</h2>${cInsights.map(c => `<div class="insight"><div class="insight-label">What you said</div><div class="insight-said">"${c.moment}"</div><div class="insight-try-label">Try instead</div><div class="insight-try">${c.tryInstead}</div></div>`).join("")}</div>` : ""}
        ${actionPlanHtml}
        ${msgs.length > 0 ? `<div class="section"><h2>Full Transcript</h2>${msgs.map(msg => `<div class="transcript-msg ${msg.role === "user" ? "msg-you" : ""}"><div class="msg-name ${msg.role === "user" ? "msg-name-you" : "msg-name-ai"}">${msg.role === "user" ? "You" : session?.characterName ?? "Coach"}</div><div class="msg-bubble ${msg.role === "user" ? "msg-bubble-you" : "msg-bubble-ai"}">${msg.content}</div></div>`).join("")}</div>` : ""}
        <div class="footer">LevelNext Practice Simulator · levelnext.coach</div>
      </body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        setIsExporting(false);
        setShowTranscript(prevShow);
      }, 600);
    }, 200);
  };

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
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: accent }}>Session Complete</p>
            <h1 className="text-white font-bold text-lg">{session.conversationType as string}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="border-white/20 text-white/70 hover:text-white text-xs"
            >
              {isExporting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
              Export PDF
            </Button>
            <Button onClick={() => navigate(practiceUrl)} variant="outline" size="sm"
              className="border-white/20 text-white/70 hover:text-white text-xs">
              <RotateCcw className="w-3 h-3 mr-1" />Practice Again
            </Button>
          </div>
        </div>
      </div>

      {/* Report content */}
      <div ref={reportRef} className="max-w-3xl mx-auto px-6 py-8 space-y-8">

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

        {/* ── AI Action Plan ─────────────────────────────────────── */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: accent + "30" }}>
          {/* Header row */}
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: accent + "10" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: accent + "20" }}>
                <Sparkles className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">AI Action Plan</p>
                <p className="text-white/40 text-xs">Personalised next steps based on this session</p>
              </div>
            </div>
            {!actionPlan && (
              <Button
                onClick={handleGeneratePlan}
                disabled={generatePlanMutation.isPending}
                size="sm"
                className="font-semibold text-xs px-4"
                style={{ background: accent, color: bg }}
              >
                {generatePlanMutation.isPending ? (
                  <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Generating…</>
                ) : (
                  <><Sparkles className="w-3 h-3 mr-1.5" />Generate Action Plan</>
                )}
              </Button>
            )}
          </div>

          {/* Idle state */}
          {!actionPlan && !generatePlanMutation.isPending && !generatePlanMutation.isError && (
            <div className="px-6 py-8 text-center">
              <Target className="w-8 h-8 mx-auto mb-3 text-white/20" />
              <p className="text-white/40 text-sm">
                Click{" "}
                <span className="font-semibold" style={{ color: accent }}>Generate Action Plan</span>
                {" "}to get a personalised 7-day practice roadmap built from your coaching insights.
              </p>
            </div>
          )}

          {/* Loading */}
          {generatePlanMutation.isPending && (
            <div className="px-6 py-10 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" style={{ color: accent }} />
              <p className="text-white/50 text-sm">Analysing your session and building your plan…</p>
            </div>
          )}

          {/* Error */}
          {generatePlanMutation.isError && !actionPlan && (
            <div className="px-6 py-6 text-center">
              <p className="text-[#f87171] text-sm mb-3">Could not generate plan. Please try again.</p>
              <Button onClick={handleGeneratePlan} size="sm" variant="outline"
                className="border-white/20 text-white/70 hover:text-white text-xs">
                Retry
              </Button>
            </div>
          )}

          {/* Plan content */}
          {actionPlan && (
            <div className="px-6 py-6 space-y-5">
              {/* Headline + summary */}
              <div>
                <h3 className="text-white font-bold text-base mb-2">{actionPlan.headline}</h3>
                <p className="text-white/65 text-sm leading-relaxed">{actionPlan.summary}</p>
              </div>

              {/* Action items */}
              <div className="space-y-3">
                {actionPlan.actions.map((action, i) => {
                  const meta = CATEGORY_META[action.category] ?? CATEGORY_META.practice;
                  return (
                    <div key={i} className="rounded-xl p-4 border"
                      style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                      <div className="flex items-start gap-3">
                        {/* Step number */}
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                          style={{ background: accent + "20", color: accent }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-white font-semibold text-sm">{action.title}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                              style={{ background: meta.color + "15", color: meta.color }}>
                              {meta.icon}{meta.label}
                            </span>
                          </div>
                          <p className="text-xs font-medium mb-1.5" style={{ color: accent }}>{action.day}</p>
                          <p className="text-white/65 text-sm leading-relaxed">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Success indicator */}
              <div className="rounded-xl p-4 border" style={{ borderColor: "#4ade8030", background: "rgba(74,222,128,0.04)" }}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#4ade80] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#4ade80] text-xs font-semibold uppercase tracking-wider mb-1">
                      You'll know you've improved when…
                    </p>
                    <p className="text-white/75 text-sm">{actionPlan.successIndicator}</p>
                  </div>
                </div>
              </div>

              {/* Weekly commitment */}
              <p className="text-white/35 text-xs text-center">
                Minimum commitment: <span className="text-white/55">{actionPlan.weeklyCommitment}</span>
              </p>

              {/* Regenerate */}
              <div className="text-center">
                <button
                  onClick={handleGeneratePlan}
                  disabled={generatePlanMutation.isPending}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2"
                >
                  Regenerate plan
                </button>
              </div>
            </div>
          )}
        </div>
        {/* ── End Action Plan ─────────────────────────────────────── */}

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
                      style={{
                        background: msg.role === "user" ? accent + "20" : "rgba(255,255,255,0.05)",
                        color: msg.role === "user" ? "white" : "rgba(255,255,255,0.75)",
                      }}>
                      <p className="text-xs mb-1"
                        style={{ color: msg.role === "user" ? accent : "rgba(255,255,255,0.3)" }}>
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
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            variant="outline"
            className="flex-1 border-white/20 text-white/70 hover:text-white"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export to PDF
          </Button>
          <Button onClick={() => navigate("/")} variant="outline" className="flex-1 border-white/20 text-white/70 hover:text-white">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
