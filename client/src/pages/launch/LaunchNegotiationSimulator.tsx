import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import LaunchLayout from "@/components/LaunchLayout";
import { AIGeneratingScreen, SuccessScreen } from "@/components/launch/AIGeneratingScreen";

type Phase = "setup" | "starting" | "negotiation" | "debrief";
interface Message { role: string; content: string; timestamp: string; }
interface Feedback { strengths: string[]; improvements: string[]; tactics: string[]; }

const DIFFICULTY_COLORS: Record<string, string> = { beginner: "#3DDC97", intermediate: "#F6AD55", advanced: "#FC8181" };

export default function LaunchNegotiationSimulator() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedScenarioId, setSelectedScenarioId] = useState("first_job");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [exchangeCount, setExchangeCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [outcomeScore, setOutcomeScore] = useState(0);
  const [finalOutcome, setFinalOutcome] = useState("");
  const [xpEarned, setXpEarned] = useState(0);

  const { data: scenarios } = trpc.launchNegotiation.getScenarios.useQuery();
  const startMutation = trpc.launchNegotiation.startSession.useMutation();
  const sendMutation = trpc.launchNegotiation.sendMessage.useMutation();

  const selectedScenario = (scenarios || []).find((s) => s.id === selectedScenarioId);
  const accentColor = "#667EEA";

  const handleStart = async () => {
    setPhase("starting");
    try {
      const result = await startMutation.mutateAsync({ scenarioId: selectedScenarioId });
      setSessionId(result.sessionId);
      setMessages(result.messages as Message[]);
      setPhase("negotiation");
    } catch {
      toast.error("Failed to start negotiation. Please try again.");
      setPhase("setup");
    }
  };

  const handleSendMessage = async () => {
    if (!sessionId || !currentMessage.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await sendMutation.mutateAsync({ sessionId, message: currentMessage });
      setMessages(result.messages as Message[]);
      if (result.isComplete) {
        setFeedback(result.feedback as Feedback);
        setOutcomeScore(result.outcomeScore ?? 0);
        setFinalOutcome(result.finalOutcome ?? "");
        setXpEarned(result.xpEarned ?? 0);
        setPhase("debrief");
      } else {
        setExchangeCount((result as { exchangeCount?: number }).exchangeCount ?? exchangeCount + 1);
      }
      setCurrentMessage("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const lastEmployerMsg = [...messages].reverse().find((m) => m.role === "employer");

  return (
    <LaunchLayout>
      <div className="min-h-screen" style={{ background: "var(--launch-white, #FAFBFC)" }}>
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* Setup Phase */}
          {phase === "setup" && (
            <div>
              <button onClick={() => navigate("/launch/journey")} className="text-sm mb-4 flex items-center gap-1" style={{ color: "#718096" }}>
                ← Back to Journey
              </button>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">⚖️</div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--launch-slate, #2D3748)", fontFamily: "Space Grotesk, sans-serif" }}>
                  Negotiation Simulator
                </h1>
                <p className="text-sm mt-1" style={{ color: "#718096" }}>Practice salary negotiation with an AI employer and get expert coaching</p>
              </div>

              <div className="mb-6">
                <h2 className="text-sm font-semibold mb-3" style={{ color: "#4A5568" }}>Choose Your Scenario</h2>
                <div className="space-y-2">
                  {(scenarios || []).map((scenario) => {
                    const diffColor = DIFFICULTY_COLORS[scenario.difficulty] || "#A0AEC0";
                    return (
                      <button
                        key={scenario.id}
                        onClick={() => setSelectedScenarioId(scenario.id)}
                        className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all"
                        style={{
                          background: selectedScenarioId === scenario.id ? `${accentColor}10` : "white",
                          border: `1.5px solid ${selectedScenarioId === scenario.id ? accentColor : "#E2E8F0"}`,
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold" style={{ color: "var(--launch-slate, #2D3748)" }}>{scenario.title}</span>
                            <Badge className="text-xs capitalize" style={{ background: `${diffColor}20`, color: diffColor, border: "none" }}>{scenario.difficulty}</Badge>
                          </div>
                          <p className="text-xs mb-1" style={{ color: "#718096" }}>{scenario.description}</p>
                          <div className="flex items-center gap-3 text-xs" style={{ color: "#A0AEC0" }}>
                            <span>Starting: <strong style={{ color: "#4A5568" }}>{scenario.initialOffer}</strong></span>
                            <span>Target: <strong style={{ color: "#3DDC97" }}>{scenario.targetOffer}</strong></span>
                          </div>
                        </div>
                        {selectedScenarioId === scenario.id && <span style={{ color: accentColor }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={handleStart} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: accentColor }}>
                Start Negotiation →
              </Button>
            </div>
          )}

          {/* Starting Phase */}
          {phase === "starting" && (
            <AIGeneratingScreen
              title="Preparing Your Negotiation"
              subtitle={selectedScenario?.title || "Negotiation Simulator"}
              accentColor={accentColor}
              steps={[
                { label: "Setting up your negotiation room...", duration: 1200 },
                { label: "Preparing the employer...", duration: 1800 },
                { label: "Your negotiation coach is ready", duration: 800 },
              ]}
            />
          )}

          {/* Negotiation Phase */}
          {phase === "negotiation" && lastEmployerMsg && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium" style={{ color: "#718096" }}>Exchange {exchangeCount + 1} of ~5</span>
                <Badge style={{ background: `${accentColor}15`, color: accentColor, border: "none" }}>⚖️ {selectedScenario?.title}</Badge>
              </div>

              {/* Context bar */}
              <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{ background: "#F7FAFC", border: "1px solid #E2E8F0" }}>
                <span className="text-xs" style={{ color: "#718096" }}>Offer on table: <strong style={{ color: "#4A5568" }}>{selectedScenario?.initialOffer}</strong></span>
                <span className="text-xs" style={{ color: "#718096" }}>Your target: <strong style={{ color: "#3DDC97" }}>{selectedScenario?.targetOffer}</strong></span>
              </div>

              {/* Conversation */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-xs rounded-2xl px-4 py-3 text-sm"
                      style={{
                        background: msg.role === "candidate" ? accentColor : "white",
                        color: msg.role === "candidate" ? "white" : "var(--launch-slate, #2D3748)",
                        border: msg.role === "employer" ? "1px solid #E2E8F0" : "none",
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="mb-4">
                <Textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Type your negotiation response..."
                  rows={3}
                  className="rounded-xl text-sm"
                  style={{ borderColor: "#E2E8F0", resize: "none" }}
                />
                <p className="text-xs mt-1" style={{ color: "#A0AEC0" }}>Tip: Be confident, justify your ask with value, and stay professional.</p>
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isSubmitting}
                className="w-full py-3 rounded-xl font-semibold text-white"
                style={{ background: currentMessage.trim() && !isSubmitting ? accentColor : "#CBD5E0" }}
              >
                {isSubmitting ? "Sending..." : "Send Response →"}
              </Button>
            </div>
          )}

          {/* Debrief Phase */}
          {phase === "debrief" && feedback && (
            <div>
              <SuccessScreen
                title="Negotiation Complete!"
                subtitle={`You earned ${xpEarned} XP`}
                xpEarned={xpEarned}
                accentColor={accentColor}
                onContinue={() => {}}
                continueLabel="View Coaching Debrief"
              />

              <div className="rounded-2xl p-5 mb-4" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold mb-1" style={{ color: accentColor, fontFamily: "Space Grotesk, sans-serif" }}>{outcomeScore}</div>
                  <div className="text-sm" style={{ color: "#718096" }}>Negotiation Score / 100</div>
                  {finalOutcome && <p className="text-sm mt-2 font-medium" style={{ color: "var(--launch-slate, #2D3748)" }}>{finalOutcome}</p>}
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "#276749" }}>✅ What You Did Well</h3>
                  <ul className="space-y-1">{feedback.strengths.map((s, i) => <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--launch-slate, #2D3748)" }}><span style={{ color: "#3DDC97" }}>•</span>{s}</li>)}</ul>
                </div>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "#C0392B" }}>🎯 Areas to Improve</h3>
                  <ul className="space-y-1">{feedback.improvements.map((s, i) => <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--launch-slate, #2D3748)" }}><span style={{ color: "#FC8181" }}>•</span>{s}</li>)}</ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "#2B6CB0" }}>💡 Negotiation Tactics to Use Next Time</h3>
                  <ul className="space-y-1">{feedback.tactics.map((s, i) => <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--launch-slate, #2D3748)" }}><span style={{ color: accentColor }}>→</span>{s}</li>)}</ul>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => { setPhase("setup"); setMessages([]); setCurrentMessage(""); setExchangeCount(0); setFeedback(null); }} variant="outline" className="rounded-xl">Practice Again</Button>
                <Button onClick={() => navigate("/launch/dashboard")} className="rounded-xl text-white" style={{ background: accentColor }}>View Dashboard →</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </LaunchLayout>
  );
}
