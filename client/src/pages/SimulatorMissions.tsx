import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Mic, Play, Clock, Star, ChevronRight, Brain, Target, Users, Briefcase, Zap, ArrowLeft
} from "lucide-react";

const PLATFORM_CONFIG = {
  leadership: {
    label: "Leadership Intelligence",
    color: "#0A1A2F",
    accent: "#D4AF37",
    icon: Brain,
    description: "Practice high-stakes leadership conversations with senior characters",
    backPath: "/leadership",
  },
  manager: {
    label: "Manager Effectiveness",
    color: "#1a3a5c",
    accent: "#4A90D9",
    icon: Users,
    description: "Build your management skills through realistic team conversations",
    backPath: "/manager",
  },
  career: {
    label: "Career Transition Intelligence",
    color: "#0A1A2F",
    accent: "#D4AF37",
    icon: Briefcase,
    description: "Practice interviews, negotiations, and career conversations",
    backPath: "/career",
  },
  young: {
    label: "Young Talent Platform",
    color: "#1a2f1a",
    accent: "#4CAF50",
    icon: Zap,
    description: "Build workplace confidence and professional communication skills",
    backPath: "/young",
  },
} as const;

const DIFFICULTY_COLORS: Record<string, string> = {
  Foundation: "#4CAF50",
  Developing: "#2196F3",
  Advanced: "#FF9800",
  Expert: "#F44336",
};

type Platform = keyof typeof PLATFORM_CONFIG;

interface Props {
  platform?: Platform;
}

export default function SimulatorMissions({ platform = "leadership" }: Props) {
  const [, navigate] = useLocation();
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;

  const { data: missions, isLoading } = trpc.simulator.getMissions.useQuery({ platform });

  const startSession = trpc.simulator.startSession.useMutation({
    onSuccess: (data) => {
      navigate(`/simulator/${data.sessionId}`);
    },
  });

  const [selectedCapability, setSelectedCapability] = useState<string>("All");

  const capabilities = missions
    ? ["All", ...Array.from(new Set(missions.map((m) => m.capability)))]
    : ["All"];

  const filtered = missions
    ? selectedCapability === "All"
      ? missions
      : missions.filter((m) => m.capability === selectedCapability)
    : [];

  return (
    <div style={{ background: "#F8F5F0", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: config.color, color: "#fff", padding: "2rem 2rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <button
            onClick={() => navigate(config.backPath)}
            style={{ color: "rgba(255,255,255,0.7)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 14 }}
          >
            <ArrowLeft size={16} /> Back to {config.label}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <div style={{ background: config.accent, borderRadius: 12, padding: "10px 12px", display: "flex" }}>
              <Icon size={24} color={config.color} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                Practice Simulator
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{config.label}</h1>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.75)", margin: 0, fontSize: 15 }}>{config.description}</p>

          {/* Voice badge */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <span style={{ background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Mic size={12} /> Voice + Text Mode
            </span>
            <span style={{ background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={12} /> AI Behaviour Scoring
            </span>
            <span style={{ background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Star size={12} /> Personalised Debrief
            </span>
          </div>
        </div>
      </div>

      {/* Capability filter */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0.75rem 2rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {capabilities.map((cap) => (
            <button
              key={cap}
              onClick={() => setSelectedCapability(cap)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: `1.5px solid ${selectedCapability === cap ? config.accent : "#e5e7eb"}`,
                background: selectedCapability === cap ? config.accent : "transparent",
                color: selectedCapability === cap ? config.color : "#333",
                fontSize: 13,
                fontWeight: selectedCapability === cap ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {cap}
            </button>
          ))}
        </div>
      </div>

      {/* Mission cards */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 2rem" }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <Spinner />
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filtered?.map((mission) => (
              <div
                key={mission.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  padding: "1.25rem 1.5rem",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  alignItems: "start",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Badge
                      style={{
                        background: DIFFICULTY_COLORS[mission.difficulty] + "20",
                        color: DIFFICULTY_COLORS[mission.difficulty],
                        border: `1px solid ${DIFFICULTY_COLORS[mission.difficulty]}40`,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {mission.difficulty}
                    </Badge>
                    <span style={{ fontSize: 12, color: "#666", background: "#f3f4f6", padding: "2px 8px", borderRadius: 10 }}>
                      {mission.capability}
                    </span>
                    <span style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} /> ~{mission.estimatedMinutes} min
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", margin: "0 0 6px" }}>
                    {mission.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "#444", margin: "0 0 10px", lineHeight: 1.5 }}>
                    {mission.description}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: config.color, display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <span style={{ color: config.accent, fontSize: 11, fontWeight: 700 }}>
                        {mission.character.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, color: "#555" }}>
                      <strong style={{ color: "#222" }}>{mission.character.name}</strong>
                      {" · "}{mission.character.role}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 120 }}>
                  <Button
                    onClick={() => startSession.mutate({ missionId: mission.id, voiceEnabled: false })}
                    disabled={startSession.isPending}
                    style={{
                      background: config.accent,
                      color: config.color,
                      fontWeight: 700,
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Play size={14} /> Start
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => startSession.mutate({ missionId: mission.id, voiceEnabled: true })}
                    disabled={startSession.isPending}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                      fontSize: 13,
                    }}
                  >
                    <Mic size={13} /> Voice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
