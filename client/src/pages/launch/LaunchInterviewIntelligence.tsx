import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import LaunchLayout from "@/components/LaunchLayout";
import { AIGeneratingScreen, SuccessScreen } from "@/components/launch/AIGeneratingScreen";
import { exportDebriefPdf } from "@/lib/debriefPdf";

type Phase = "setup" | "starting" | "interview" | "debrief";

interface Message { role: string; content: string; timestamp: string; questionIndex?: number; }
interface Feedback { strengths: string[]; improvements: string[]; nextSteps: string[]; }

const INTERVIEW_TYPES = [
  { id: "hr", label: "HR / Screening", icon: "👤", description: "Background, goals, and cultural fit", xp: 75, color: "#4F9CF9" },
  { id: "behavioural", label: "Behavioural (STAR)", icon: "⭐", description: "Situation-Task-Action-Result questions", xp: 75, color: "#9F7AEA" },
  { id: "technical", label: "Technical", icon: "💻", description: "Role-specific technical questions", xp: 100, color: "#3DDC97" },
  { id: "case", label: "Case Study", icon: "📊", description: "Business problem-solving", xp: 100, color: "#F6AD55" },
  { id: "presentation", label: "Presentation", icon: "🎤", description: "Communication and storytelling", xp: 75, color: "#FC8181" },
];

const DIFFICULTY_OPTIONS = [
  { id: "beginner", label: "Beginner", description: "Straightforward questions, supportive tone" },
  { id: "intermediate", label: "Intermediate", description: "Probing follow-ups, moderate challenge" },
  { id: "advanced", label: "Advanced", description: "Tough questions, high expectations" },
];

export default function LaunchInterviewIntelligence() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedType, setSelectedType] = useState("hr");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [overallScore, setOverallScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  const startMutation = trpc.launchInterview.startSession.useMutation();
  const sendMutation = trpc.launchInterview.sendMessage.useMutation();

  const selectedTypeConfig = INTERVIEW_TYPES.find((t) => t.id === selectedType);

  const handleStart = async () => {
    setPhase("starting");
    try {
      const result = await startMutation.mutateAsync({
        interviewType: selectedType as "hr" | "behavioural" | "technical" | "case" | "presentation",
        targetRole: targetRole || undefined,
        targetCompany: targetCompany || undefined,
        difficulty,
      });
      setSessionId(result.sessionId);
      setMessages(result.messages as Message[]);
      setTotalQuestions(result.totalQuestions);
      setPhase("interview");
    } catch {
      toast.error("Failed to start interview. Please try again.");
      setPhase("setup");
    }
  };

  const handleSendAnswer = async () => {
    if (!sessionId || !currentAnswer.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await sendMutation.mutateAsync({ sessionId, answer: currentAnswer });
      setMessages(result.messages as Message[]);
      if (result.isComplete) {
        setFeedback(result.feedback as Feedback);
        setOverallScore(result.overallScore ?? 0);
        setXpEarned(result.xpEarned ?? 0);
        setPhase("debrief");
      } else {
        const nextQ = (result as { questionNumber?: number }).questionNumber;
        setQuestionNumber(typeof nextQ === "number" ? nextQ : questionNumber + 1);
      }
      setCurrentAnswer("");
    } catch {
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const lastInterviewerMsg = [...messages].reverse().find((m) => m.role === "interviewer");
  const accentColor = selectedTypeConfig?.color || "#4F9CF9";

  return (
    <LaunchLayout>
      <div className="min-h-screen" style={{ background: "transparent", color: "var(--ld-text)" }}>
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* Setup Phase */}
          {phase === "setup" && (
            <div>
              <button onClick={() => navigate("/launch/journey")} className="text-sm mb-4 flex items-center gap-1" style={{ color: "var(--ld-text-muted)" }}>
                ← Back to Journey
              </button>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🎤</div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--ld-text)", fontFamily: "Space Grotesk, sans-serif" }}>
                  Interview Intelligence
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--ld-text-muted)" }}>Practice with an AI interviewer and get real-time coaching feedback</p>
              </div>

              {/* Interview Type */}
              <div className="mb-5">
                <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ld-text)" }}>Choose Interview Type</h2>
                <div className="grid grid-cols-1 gap-2">
                  {INTERVIEW_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                      style={{
                        background: selectedType === type.id ? `${type.color}18` : "var(--ld-card-bg)",
                        border: `1.5px solid ${selectedType === type.id ? type.color : "var(--ld-card-border)"}`,
                      }}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: "var(--ld-text)" }}>{type.label}</span>
                          <Badge className="text-xs" style={{ background: `${type.color}20`, color: type.color, border: "none" }}>+{type.xp} XP</Badge>
                        </div>
                        <p className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{type.description}</p>
                      </div>
                      {selectedType === type.id && <span style={{ color: type.color }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-5">
                <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ld-text)" }}>Difficulty Level</h2>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id as "beginner" | "intermediate" | "advanced")}
                      className="p-3 rounded-xl text-center transition-all"
                      style={{
                        background: difficulty === d.id ? `${accentColor}18` : "var(--ld-card-bg)",
                        border: `1.5px solid ${difficulty === d.id ? accentColor : "var(--ld-card-border)"}`,
                      }}
                    >
                      <div className="text-sm font-semibold" style={{ color: difficulty === d.id ? accentColor : "var(--ld-text)" }}>{d.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--ld-text-muted)" }}>{d.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional context */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--ld-text)" }}>Target Role (optional)</label>
                  <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Product Manager" className="w-full px-3 py-2 rounded-lg text-sm border" style={{ background: "var(--ld-surface-solid)", borderColor: "var(--ld-border)", color: "var(--ld-text)", outline: "none" }} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--ld-text)" }}>Target Company (optional)</label>
                  <input value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} placeholder="e.g. Google" className="w-full px-3 py-2 rounded-lg text-sm border" style={{ background: "var(--ld-surface-solid)", borderColor: "var(--ld-border)", color: "var(--ld-text)", outline: "none" }} />
                </div>
              </div>

              <Button onClick={handleStart} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: accentColor }}>
                Start Interview Practice →
              </Button>
            </div>
          )}

          {/* Starting Phase */}
          {phase === "starting" && (
            <AIGeneratingScreen
              title="Preparing Your Interview"
              subtitle={`${selectedTypeConfig?.label || "Interview"} for ${targetRole || "your target role"}`}
              accentColor={accentColor}
              steps={[
                { label: "Setting up your interview room...", duration: 1200 },
                { label: "Preparing role-specific questions...", duration: 1800 },
                { label: "Your interviewer is ready", duration: 800 },
              ]}
            />
          )}

          {/* Interview Phase */}
          {phase === "interview" && lastInterviewerMsg && (
            <div>
              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium" style={{ color: "var(--ld-text-muted)" }}>Question {questionNumber} of {totalQuestions}</span>
                <Badge style={{ background: `${accentColor}15`, color: accentColor, border: "none" }}>{selectedTypeConfig?.label}</Badge>
              </div>
              <div className="h-2 rounded-full mb-6" style={{ background: "rgba(148, 163, 184, 0.15)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${((questionNumber - 1) / totalQuestions) * 100}%`, background: accentColor }} />
              </div>

              {/* Interviewer message */}
              <div className="rounded-2xl p-5 mb-4" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}25` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: accentColor }}>AI</div>
                  <span className="text-sm font-semibold" style={{ color: accentColor }}>Interviewer</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ld-text)" }}>{lastInterviewerMsg.content}</p>
              </div>

              {/* Answer */}
              <div className="mb-4">
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here... Take your time and be specific."
                  rows={5}
                  className="rounded-xl text-sm"
                  style={{ background: "var(--ld-surface-solid)", borderColor: "var(--ld-border)", color: "var(--ld-text)", resize: "none" }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--ld-text-muted)" }}>Tip: Use specific examples and be concise.</p>
              </div>

              <Button
                onClick={handleSendAnswer}
                disabled={!currentAnswer.trim() || isSubmitting}
                className="w-full py-3 rounded-xl font-semibold text-white"
                style={{ background: currentAnswer.trim() && !isSubmitting ? accentColor : "#CBD5E0" }}
              >
                {isSubmitting ? "Submitting..." : questionNumber >= totalQuestions ? "Submit Final Answer →" : "Submit Answer →"}
              </Button>
            </div>
          )}

          {/* Debrief Phase */}
          {phase === "debrief" && feedback && (
            <div>
              <SuccessScreen
                title="Interview Complete!"
                subtitle={`You earned ${xpEarned} XP`}
                xpEarned={xpEarned}
                accentColor={accentColor}
                onContinue={() => {}}
                continueLabel="View Full Debrief"
              />

              {/* Score */}
              <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--ld-card-bg)", border: "1px solid var(--ld-card-border)" }}>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold mb-1" style={{ color: accentColor, fontFamily: "Space Grotesk, sans-serif" }}>{overallScore}</div>
                  <div className="text-sm" style={{ color: "var(--ld-text-muted)" }}>Overall Score / 100</div>
                </div>

                {/* Strengths */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "#276749" }}>✅ Strengths</h3>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--ld-text)" }}>
                        <span style={{ color: "#3DDC97" }}>•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "#C0392B" }}>🎯 Areas to Improve</h3>
                  <ul className="space-y-1">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--ld-text)" }}>
                        <span style={{ color: "#FC8181" }}>•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Next Steps */}
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "#2B6CB0" }}>🚀 Next Steps</h3>
                  <ul className="space-y-1">
                    {feedback.nextSteps.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--ld-text)" }}>
                        <span style={{ color: accentColor }}>→</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* PDF Export */}
              <button
                onClick={() => {
                  if (!feedback) return;
                  exportDebriefPdf({
                    type: "interview",
                    interviewType: selectedTypeConfig?.label ?? selectedType,
                    targetRole: targetRole || "General",
                    difficulty,
                    overallScore,
                    strengths: feedback.strengths,
                    improvements: feedback.improvements,
                    nextSteps: feedback.nextSteps,
                    xpEarned,
                    date: new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
                  });
                }}
                className="w-full py-3 rounded-2xl text-sm font-semibold mb-3 flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
                style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)", color: accentColor }}>
                📄 Download Debrief PDF
              </button>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => { setPhase("setup"); setMessages([]); setCurrentAnswer(""); setQuestionNumber(1); setFeedback(null); }} variant="outline" className="rounded-xl">
                  Practice Again
                </Button>
                <Button onClick={() => navigate("/launch/dashboard")} className="rounded-xl text-white" style={{ background: accentColor }}>
                  View Dashboard →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </LaunchLayout>
  );
}
