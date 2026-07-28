import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Star, ChevronLeft, MessageSquare, TrendingUp, AlertCircle,
  CheckCircle, Lightbulb, RotateCcw, ArrowRight
} from "lucide-react";

const NAVY = "#0A1A2F";
const GOLD = "#D4AF37";

function ScoreBar({ label, score, max = 10 }: { label: string; score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 14, color: "#333", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{score}/{max}</span>
      </div>
      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

export default function SimulatorDebrief() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = parseInt(params.sessionId || "0");
  const [, navigate] = useLocation();
  const [showTranscript, setShowTranscript] = useState(false);

  const { data: session, isLoading } = trpc.simulator.getSession.useQuery({ sessionId });

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#F8F5F0", gap: 16 }}>
        <Spinner />
        <p style={{ color: "#666", fontSize: 15 }}>Loading your debrief...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F8F5F0", gap: 16 }}>
        <AlertCircle size={40} color="#ef4444" />
        <p style={{ color: "#333", fontSize: 16 }}>Debrief not found.</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const debrief = session.debrief as any;
  const transcript = (session.transcript as any[]) || [];

  if (!debrief) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#F8F5F0", gap: 16 }}>
        <Spinner />
        <p style={{ color: "#666", fontSize: 15 }}>Generating your personalised debrief...</p>
        <p style={{ color: "#999", fontSize: 13 }}>This takes 15–20 seconds</p>
      </div>
    );
  }

  const overallScore = debrief.overallScore ?? 0;
  const scoreColor = overallScore >= 75 ? "#22c55e" : overallScore >= 50 ? "#f59e0b" : "#ef4444";

  const platformBackPath: Record<string, string> = {
    leadership: "/leadership",
    manager: "/manager",
    career: "/career",
    young: "/young",
  };
  const backPath = platformBackPath[session.platform] || "/";
  const simulatePath = `/${session.platform}/simulate`;

  return (
    <div style={{ background: "#F8F5F0", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: NAVY, color: "#fff", padding: "1.5rem 2rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <button
            onClick={() => navigate(backPath)}
            style={{ color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 14 }}
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  border: `4px solid ${scoreColor}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor }}>{overallScore}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>/100</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Session Debrief
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>{session.missionTitle}</h1>
              <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: 14 }}>
                {session.characterName} · {session.characterRole} · {transcript.length} exchanges
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "1.5rem 2rem" }}>
        {/* Overall verdict */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "1.25rem 1.5rem", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Star size={18} color={GOLD} fill={GOLD} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 }}>Overall Assessment</h2>
          </div>
          <p style={{ fontSize: 15, color: "#222", lineHeight: 1.6, margin: 0 }}>{debrief.overallAssessment}</p>
        </div>

        {/* Behaviour scores */}
        {debrief.behaviourScores && debrief.behaviourScores.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "1.25rem 1.5rem", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <TrendingUp size={18} color={NAVY} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 }}>Behaviour Scores</h2>
            </div>
            {debrief.behaviourScores.map((b: any, i: number) => (
              <ScoreBar key={i} label={b.behaviour} score={b.score} />
            ))}
          </div>
        )}

        {/* Two-column: strengths + development */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Strengths */}
          <div style={{ background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0", padding: "1.25rem 1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <CheckCircle size={16} color="#22c55e" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#166534", margin: 0 }}>What Worked Well</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {(debrief.strengths || []).map((s: string, i: number) => (
                <li key={i} style={{ fontSize: 14, color: "#166534", marginBottom: 6, lineHeight: 1.5 }}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Development areas */}
          <div style={{ background: "#fff7ed", borderRadius: 12, border: "1px solid #fed7aa", padding: "1.25rem 1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <AlertCircle size={16} color="#f59e0b" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#92400e", margin: 0 }}>Development Areas</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {(debrief.developmentAreas || []).map((d: string, i: number) => (
                <li key={i} style={{ fontSize: 14, color: "#92400e", marginBottom: 6, lineHeight: 1.5 }}>{d}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Coaching insights */}
        {debrief.coachingInsights && debrief.coachingInsights.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "1.25rem 1.5rem", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Lightbulb size={18} color={GOLD} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 }}>Coaching Insights</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {debrief.coachingInsights.map((insight: any, i: number) => (
                <div key={i} style={{ background: "#fafafa", borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${GOLD}` }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: NAVY, marginBottom: 4 }}>{insight.moment}</div>
                  <div style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>{insight.insight}</div>
                  {insight.alternative && (
                    <div style={{ fontSize: 13, color: "#666", marginTop: 6, fontStyle: "italic" }}>
                      💡 Try instead: "{insight.alternative}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next practice recommendation */}
        {debrief.nextPracticeRecommendation && (
          <div style={{ background: NAVY, borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: 16, color: "#fff" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Recommended Next Practice
            </div>
            <p style={{ fontSize: 15, color: "#fff", margin: 0, lineHeight: 1.6 }}>{debrief.nextPracticeRecommendation}</p>
          </div>
        )}

        {/* Transcript toggle */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 24 }}>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            style={{
              width: "100%", padding: "1rem 1.5rem", background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: 15, fontWeight: 600, color: NAVY,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={16} />
              View Full Transcript ({transcript.length} exchanges)
            </div>
            <span style={{ fontSize: 12, color: "#888" }}>{showTranscript ? "Hide ▲" : "Show ▼"}</span>
          </button>
          {showTranscript && (
            <div style={{ borderTop: "1px solid #e5e7eb", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: 12 }}>
              {transcript.map((turn: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: turn.role === "user" ? GOLD : NAVY,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: turn.role === "user" ? NAVY : GOLD }}>
                      {turn.role === "user" ? "You" : session.characterName?.split(" ").map((n: string) => n[0]).join("") || "C"}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>
                      {turn.role === "user" ? "You" : session.characterName}
                    </div>
                    <div style={{ fontSize: 14, color: "#333", lineHeight: 1.55 }}>{turn.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", paddingBottom: "2rem" }}>
          <Button
            onClick={() => navigate(simulatePath)}
            style={{ background: NAVY, color: "#fff", display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}
          >
            <RotateCcw size={15} /> Practice Again
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(backPath)}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            Back to Dashboard <ArrowRight size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
