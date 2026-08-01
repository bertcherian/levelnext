import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Zap, ArrowRight, Loader2, ChevronRight, Target, Clock, BarChart2, User, Volume2, Gauge } from "lucide-react";
import { toast } from "sonner";

// SVG avatar components — distinct illustrated faces per voice
const AvatarShubh = ({ size = 48, selected = false, accent = "#D4AF37" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill={selected ? accent + "30" : "rgba(255,255,255,0.08)"} />
    {/* Face */}
    <circle cx="24" cy="20" r="10" fill="#F4C89A" />
    {/* Hair — short, dark */}
    <path d="M14 18 Q14 10 24 10 Q34 10 34 18 Q32 12 24 12 Q16 12 14 18Z" fill="#2D1B00" />
    {/* Eyes */}
    <circle cx="20" cy="19" r="1.5" fill="#2D1B00" />
    <circle cx="28" cy="19" r="1.5" fill="#2D1B00" />
    {/* Smile */}
    <path d="M20 23 Q24 26 28 23" stroke="#A0522D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    {/* Collar */}
    <path d="M16 34 Q20 30 24 31 Q28 30 32 34 Q28 38 24 38 Q20 38 16 34Z" fill="#1E3A5F" />
  </svg>
);
const AvatarSumit = ({ size = 48, selected = false, accent = "#D4AF37" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill={selected ? accent + "30" : "rgba(255,255,255,0.08)"} />
    {/* Face */}
    <circle cx="24" cy="20" r="10" fill="#C68642" />
    {/* Hair — neat side part */}
    <path d="M14 17 Q15 9 24 9 Q33 9 34 17 Q30 11 24 11 Q17 11 14 17Z" fill="#1A0A00" />
    {/* Glasses */}
    <rect x="17" y="17" width="5" height="3.5" rx="1" stroke="#555" strokeWidth="1" fill="none" />
    <rect x="26" y="17" width="5" height="3.5" rx="1" stroke="#555" strokeWidth="1" fill="none" />
    <line x1="22" y1="18.5" x2="26" y2="18.5" stroke="#555" strokeWidth="1" />
    {/* Eyes */}
    <circle cx="19.5" cy="19" r="1" fill="#1A0A00" />
    <circle cx="28.5" cy="19" r="1" fill="#1A0A00" />
    {/* Smile — slight */}
    <path d="M21 23 Q24 25 27 23" stroke="#8B4513" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    {/* Suit */}
    <path d="M15 34 Q19 29 24 30 Q29 29 33 34 Q29 39 24 39 Q19 39 15 34Z" fill="#2C2C54" />
    <line x1="24" y1="30" x2="24" y2="39" stroke="white" strokeWidth="0.8" opacity="0.4" />
  </svg>
);
const AvatarSimran = ({ size = 48, selected = false, accent = "#D4AF37" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill={selected ? accent + "30" : "rgba(255,255,255,0.08)"} />
    {/* Face */}
    <circle cx="24" cy="20" r="10" fill="#F4C89A" />
    {/* Hair — long, dark */}
    <path d="M14 18 Q13 8 24 8 Q35 8 34 18 Q33 10 24 10 Q15 10 14 18Z" fill="#1A0A00" />
    <path d="M13 18 Q11 28 13 34" stroke="#1A0A00" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M35 18 Q37 28 35 34" stroke="#1A0A00" strokeWidth="4" strokeLinecap="round" fill="none" />
    {/* Eyes — slightly larger */}
    <ellipse cx="20" cy="19" rx="1.8" ry="1.5" fill="#2D1B00" />
    <ellipse cx="28" cy="19" rx="1.8" ry="1.5" fill="#2D1B00" />
    {/* Smile — warm */}
    <path d="M19 23 Q24 27 29 23" stroke="#A0522D" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    {/* Dupatta / scarf hint */}
    <path d="M15 33 Q20 29 24 30 Q28 29 33 33" stroke="#C0392B" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);
const AvatarIshita = ({ size = 48, selected = false, accent = "#D4AF37" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill={selected ? accent + "30" : "rgba(255,255,255,0.08)"} />
    {/* Face */}
    <circle cx="24" cy="20" r="10" fill="#E8A87C" />
    {/* Hair — bun */}
    <path d="M14 17 Q14 9 24 9 Q34 9 34 17 Q32 11 24 11 Q16 11 14 17Z" fill="#1A0A00" />
    <circle cx="24" cy="10" r="4" fill="#1A0A00" />
    {/* Eyes */}
    <circle cx="20" cy="19" r="1.5" fill="#2D1B00" />
    <circle cx="28" cy="19" r="1.5" fill="#2D1B00" />
    {/* Smile */}
    <path d="M20 23 Q24 26 28 23" stroke="#A0522D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    {/* Professional blazer */}
    <path d="M15 34 Q19 29 24 30 Q29 29 33 34 Q29 39 24 39 Q19 39 15 34Z" fill="#8B0000" />
    <line x1="24" y1="30" x2="24" y2="39" stroke="white" strokeWidth="0.8" opacity="0.4" />
  </svg>
);
const AvatarNova = ({ size = 48, selected = false, accent = "#D4AF37" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill={selected ? accent + "30" : "rgba(255,255,255,0.08)"} />
    {/* Glowing star motif */}
    <circle cx="24" cy="20" r="10" fill="#FDEBD0" />
    <path d="M14 17 Q14 9 24 9 Q34 9 34 17 Q32 11 24 11 Q16 11 14 17Z" fill="#C0A060" />
    <circle cx="20" cy="19" r="1.5" fill="#4A3000" />
    <circle cx="28" cy="19" r="1.5" fill="#4A3000" />
    <path d="M20 23 Q24 27 28 23" stroke="#C0A060" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    {/* Star accent */}
    <path d="M24 6 L24.8 8.5 L27.5 8.5 L25.3 10 L26.1 12.5 L24 11 L21.9 12.5 L22.7 10 L20.5 8.5 L23.2 8.5Z" fill={accent} opacity="0.9" />
    <path d="M15 34 Q19 29 24 30 Q29 29 33 34 Q29 39 24 39 Q19 39 15 34Z" fill="#6B4C9A" />
  </svg>
);
const AvatarShimmer = ({ size = 48, selected = false, accent = "#D4AF37" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill={selected ? accent + "30" : "rgba(255,255,255,0.08)"} />
    <circle cx="24" cy="20" r="10" fill="#FAE5D3" />
    {/* Wavy hair */}
    <path d="M14 17 Q13 9 24 9 Q35 9 34 17 Q32 11 24 11 Q16 11 14 17Z" fill="#8B4513" />
    <path d="M13 18 Q11 25 14 32" stroke="#8B4513" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M35 18 Q37 25 34 32" stroke="#8B4513" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <circle cx="20" cy="19" r="1.5" fill="#2D1B00" />
    <circle cx="28" cy="19" r="1.5" fill="#2D1B00" />
    <path d="M20 23 Q24 27 28 23" stroke="#A0522D" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    {/* Sparkle dots */}
    <circle cx="12" cy="14" r="1.2" fill={accent} opacity="0.8" />
    <circle cx="36" cy="12" r="0.9" fill={accent} opacity="0.6" />
    <path d="M15 34 Q19 29 24 30 Q29 29 33 34 Q29 39 24 39 Q19 39 15 34Z" fill="#1A6B4A" />
  </svg>
);
const AvatarAlloy = ({ size = 48, selected = false, accent = "#D4AF37" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill={selected ? accent + "30" : "rgba(255,255,255,0.08)"} />
    <circle cx="24" cy="20" r="10" fill="#D5D8DC" />
    {/* Short silver hair */}
    <path d="M14 17 Q14 9 24 9 Q34 9 34 17 Q32 11 24 11 Q16 11 14 17Z" fill="#808B96" />
    <circle cx="20" cy="19" r="1.5" fill="#2C3E50" />
    <circle cx="28" cy="19" r="1.5" fill="#2C3E50" />
    <path d="M21 23 Q24 25 27 23" stroke="#7F8C8D" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    {/* Lightning bolt accent */}
    <path d="M38 10 L35 16 L38 16 L35 22" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M15 34 Q19 29 24 30 Q29 29 33 34 Q29 39 24 39 Q19 39 15 34Z" fill="#2C3E50" />
  </svg>
);
const AvatarFable = ({ size = 48, selected = false, accent = "#D4AF37" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill={selected ? accent + "30" : "rgba(255,255,255,0.08)"} />
    <circle cx="24" cy="20" r="10" fill="#FDEBD0" />
    {/* Curly hair */}
    <path d="M14 17 Q13 9 24 9 Q35 9 34 17" fill="#5D4037" />
    <circle cx="15" cy="15" r="3" fill="#5D4037" />
    <circle cx="33" cy="15" r="3" fill="#5D4037" />
    <circle cx="19" cy="11" r="3" fill="#5D4037" />
    <circle cx="29" cy="11" r="3" fill="#5D4037" />
    <circle cx="24" cy="10" r="3" fill="#5D4037" />
    <circle cx="20" cy="19" r="1.5" fill="#2D1B00" />
    <circle cx="28" cy="19" r="1.5" fill="#2D1B00" />
    <path d="M19 23 Q24 27 29 23" stroke="#A0522D" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    {/* Book icon */}
    <rect x="10" y="34" width="7" height="5" rx="0.5" fill={accent} opacity="0.85" />
    <line x1="13.5" y1="34" x2="13.5" y2="39" stroke="#0A1A2F" strokeWidth="0.8" />
    <path d="M15 34 Q19 29 24 30 Q29 29 33 34 Q29 39 24 39 Q19 39 15 34Z" fill="#4A235A" />
  </svg>
);

const VOICE_AVATAR_MAP: Record<string, React.FC<{ size?: number; selected?: boolean; accent?: string }>> = {
  shubh: AvatarShubh, sumit: AvatarSumit, simran: AvatarSimran, ishita: AvatarIshita,
  nova: AvatarNova, shimmer: AvatarShimmer, alloy: AvatarAlloy, fable: AvatarFable,
};

const VOICES_INDIAN = [
  { id: "shubh",   label: "Shubh",   desc: "Confident, clear",    sample: "That's an interesting perspective. Can you walk me through your reasoning?" },
  { id: "sumit",   label: "Sumit",   desc: "Measured, direct",    sample: "Right. So what exactly are you hoping to achieve from this conversation?" },
  { id: "simran",  label: "Simran",  desc: "Warm, expressive",    sample: "I appreciate you bringing this up. I want to make sure I understand correctly." },
  { id: "ishita",  label: "Ishita",  desc: "Clear, professional", sample: "Okay, I see where you're coming from. Here's my take on the situation." },
] as const;
const VOICES_INTERNATIONAL = [
  { id: "nova",    label: "Nova",    desc: "Warm, conversational", sample: "I appreciate you bringing this up. I want to make sure I understand correctly." },
  { id: "shimmer", label: "Shimmer", desc: "Clear, expressive",    sample: "Okay, I see where you're coming from. Here's my take on the situation." },
  { id: "alloy",   label: "Alloy",   desc: "Neutral, balanced",    sample: "Right. So what exactly are you hoping to achieve from this conversation?" },
  { id: "fable",   label: "Fable",   desc: "Warm, storytelling",   sample: "Let me be honest with you — this isn't something I expected to hear today." },
] as const;
const VOICES = [...VOICES_INDIAN, ...VOICES_INTERNATIONAL] as const;
type VoiceId = typeof VOICES[number]["id"];

type Platform = "leadership" | "manager" | "career" | "young";

const PLATFORM_META: Record<Platform, { label: string; color: string; accent: string; chips: string[] }> = {
  leadership: {
    label: "Leadership Intelligence",
    color: "#0A1A2F",
    accent: "#D4AF37",
    chips: [
      "Influencing a sceptical board member",
      "Delivering difficult feedback to a peer",
      "Navigating a politically charged decision",
      "Presenting a strategy under pressure",
      "Managing a high-performing but difficult team member",
    ],
  },
  manager: {
    label: "Manager Effectiveness",
    color: "#0A1A2F",
    accent: "#D4AF37",
    chips: [
      "Accountability conversation with an underperformer",
      "Managing up on a priority conflict",
      "Cross-team conflict with another manager",
      "Giving feedback to a defensive team member",
      "Asking for resources from my VP",
    ],
  },
  career: {
    label: "Career Transition Intelligence",
    color: "#0A1A2F",
    accent: "#D4AF37",
    chips: [
      "Salary negotiation with a new employer",
      "Explaining a career gap confidently",
      "Pitching myself for a role in a new industry",
      "Asking for a promotion",
      "Stakeholder influence as a new hire",
    ],
  },
  young: {
    label: "Young Talent Platform",
    color: "#1a1a3a",
    accent: "#818cf8",
    chips: [
      "My first performance review conversation",
      "Asking my manager for feedback",
      "Presenting an idea to senior leadership",
      "Handling a conflict with a peer",
      "Asking for a stretch assignment",
    ],
  },
};

interface ScenarioCard {
  conversationType: string;
  stakeholder: string;
  objective: string;
  expectedChallenge: string;
  difficulty: number;
  estimatedMinutes: number;
  characterName: string;
  characterStyle: string;
  followUpQuestion: string | null;
}

export default function SimulatorStart() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  

  // Detect platform from URL
  const path = window.location.pathname;
  const platform: Platform = path.includes("/manager") ? "manager"
    : path.includes("/career") ? "career"
    : path.includes("/young") ? "young"
    : "leadership";

  const meta = PLATFORM_META[platform];
  const [prompt, setPrompt] = useState("");
  const [scenario, setScenario] = useState<ScenarioCard | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>("shubh");
  const [previewingVoice, setPreviewingVoice] = useState<VoiceId | null>(null);
  const previewAudioRef = { current: null as HTMLAudioElement | null };
  const ttsMutation = trpc.simulator.tts.useMutation({
    onSuccess: (data) => {
      if (previewAudioRef.current) { previewAudioRef.current.pause(); }
      const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);
      audio.playbackRate = selectedSpeed;
      previewAudioRef.current = audio;
      audio.play();
      audio.onended = () => setPreviewingVoice(null);
    },
    onError: () => setPreviewingVoice(null),
  });
  const handlePreview = (voice: VoiceId) => {
    if (previewAudioRef.current) { previewAudioRef.current.pause(); }
    const v = VOICES.find(x => x.id === voice)!;
    setPreviewingVoice(voice);
    ttsMutation.mutate({ text: v.sample, voice });
  };
  const [adjustedDifficulty, setAdjustedDifficulty] = useState<number | null>(null);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);

  const inferMutation = trpc.simulator.inferScenario.useMutation({
    onSuccess: (data) => setScenario(data),
  });

  const [startingLabel, setStartingLabel] = useState("Starting...");

  const startMutation = trpc.simulator.startSession.useMutation({
    onSuccess: (data) => navigate(`/simulator/${data.sessionId}`),
    onError: (err) => {
      console.error("[SimulatorStart] startSession error:", err.message);
      toast.error("Could not start session — please try again.", { duration: 4000 });
    },
  });

  // Cycle loading messages while session is being created
  useEffect(() => {
    if (!startMutation.isPending) { setStartingLabel("Starting..."); return; }
    const labels = ["Setting the scene…", "Briefing your character…", "Opening the conversation…"];
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % labels.length; setStartingLabel(labels[i]); }, 1400);
    return () => clearInterval(id);
  }, [startMutation.isPending]);

  const handleInfer = (text: string) => {
    if (!text.trim()) return;
    setScenario(null);
    inferMutation.mutate({ prompt: text, platform });
  };

  const handleStart = () => {
    if (!scenario) return;
    // Persist speed so SimulatorSession can read it
    localStorage.setItem("sim_playback_speed", String(selectedSpeed));
    const finalPrompt = scenario.followUpQuestion && followUpAnswer
      ? `${prompt}. ${followUpAnswer}`
      : prompt;
    const effectiveDifficulty = adjustedDifficulty ?? scenario.difficulty;
    startMutation.mutate({
      platform,
      userPrompt: finalPrompt,
      conversationType: scenario.conversationType,
      stakeholder: scenario.stakeholder,
      objective: scenario.objective,
      expectedChallenge: scenario.expectedChallenge,
      difficulty: effectiveDifficulty,
      estimatedMinutes: scenario.estimatedMinutes,
      characterName: scenario.characterName,
      characterStyle: scenario.characterStyle,
      voice: selectedVoice,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: meta.color }}>
        <div className="text-center text-white p-8">
          <Mic className="w-12 h-12 mx-auto mb-4" style={{ color: meta.accent }} />
          <h2 className="text-2xl font-bold mb-2">Practice Simulator</h2>
          <p className="text-white/70 mb-6">Sign in to start your practice session</p>
          <Button onClick={() => window.location.href = "/login?returnTo=%2Fhome"} style={{ background: meta.accent, color: meta.color }}>
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: meta.color }}>
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1 as any)} className="text-white/60 hover:text-white text-sm">
            ← Back
          </button>
          <span className="text-white/30">|</span>
          <span className="text-white/80 text-sm">{meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4" style={{ color: meta.accent }} />
          <span className="text-white font-semibold text-sm">Practice Simulator</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 border"
            style={{ borderColor: meta.accent + "40", color: meta.accent, background: meta.accent + "10" }}>
            <Zap className="w-3 h-3" />
            AI-Powered Practice
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            What conversation do you want to practise?
          </h1>
          <p className="text-white/60 text-base">
            Describe the situation in your own words — the AI will build a realistic scenario and character for you.
          </p>
        </div>

        {/* Prompt Input */}
        <div className="mb-5">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. I need to have a difficult conversation with my manager about being passed over for a promotion..."
            className="w-full min-h-[100px] bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-white/40 resize-none text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleInfer(prompt);
            }}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-white/30 text-xs">Cmd+Enter to generate</span>
            <Button
              onClick={() => handleInfer(prompt)}
              disabled={!prompt.trim() || inferMutation.isPending}
              className="font-semibold"
              style={{ background: meta.accent, color: meta.color }}
            >
              {inferMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Building scenario...</>
              ) : (
                <>Build My Scenario <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </div>

        {/* Quick-start chips */}
        {!scenario && !inferMutation.isPending && (
          <div className="mb-8">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Or pick a common scenario</p>
            <div className="flex flex-wrap gap-2">
              {meta.chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => { setPrompt(chip); handleInfer(chip); }}
                  className="px-3 py-2 rounded-lg text-sm border text-white/70 hover:text-white transition-colors"
                  style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)" }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {inferMutation.isPending && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: meta.accent }} />
            <p className="text-white/60">Designing your scenario...</p>
          </div>
        )}

        {/* Scenario Summary Card */}
        {scenario && !inferMutation.isPending && (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: meta.accent + "40", background: "rgba(255,255,255,0.04)" }}>
            {/* Card header */}
            <div className="px-6 py-4 border-b" style={{ borderColor: meta.accent + "20", background: meta.accent + "10" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: meta.accent }}>Your Scenario</p>
                  <h2 className="text-white font-bold text-xl">{scenario.conversationType}</h2>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Difficulty</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const d = adjustedDifficulty ?? scenario.difficulty;
                      const active = i < d;
                      return (
                        <button
                          key={i}
                          onClick={() => setAdjustedDifficulty(i + 1)}
                          title={`Set difficulty ${i + 1}`}
                          className="w-4 h-4 rounded-full transition-all duration-150 hover:scale-125"
                          style={{
                            background: active ? meta.accent : "rgba(255,255,255,0.15)",
                            boxShadow: active ? `0 0 5px ${meta.accent}70` : "none",
                          }}
                        />
                      );
                    })}
                  </div>
                  <p className="text-white/40 text-xs mt-1.5">
                    {(["Warm-up","Moderate","Challenging","Tough","Intense"])[(adjustedDifficulty ?? scenario.difficulty) - 1]} · {adjustedDifficulty ?? scenario.difficulty}/5
                  </p>
                  {adjustedDifficulty !== null && adjustedDifficulty !== scenario.difficulty && (
                    <button
                      onClick={() => setAdjustedDifficulty(null)}
                      className="text-white/30 hover:text-white/60 text-[10px] mt-0.5 transition-colors block text-right"
                    >
                      ↺ Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: meta.accent }} />
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">You're speaking with</p>
                    <p className="text-white text-sm font-medium">{scenario.stakeholder}</p>
                    <p className="text-white/50 text-xs mt-0.5">Played by {scenario.characterName} · {scenario.characterStyle}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: meta.accent }} />
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Estimated time</p>
                    <p className="text-white text-sm font-medium">{scenario.estimatedMinutes} minutes</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Target className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: meta.accent }} />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Your objective</p>
                  <p className="text-white text-sm">{scenario.objective}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BarChart2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: meta.accent }} />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Expect this challenge</p>
                  <p className="text-white/80 text-sm">{scenario.expectedChallenge}</p>
                </div>
              </div>

              {/* Follow-up question if needed */}
              {scenario.followUpQuestion && (
                <div className="rounded-xl p-4 border" style={{ borderColor: meta.accent + "30", background: meta.accent + "08" }}>
                  <p className="text-xs uppercase tracking-wider mb-2" style={{ color: meta.accent }}>One quick question</p>
                  <p className="text-white text-sm mb-3">{scenario.followUpQuestion}</p>
                  <input
                    type="text"
                    value={followUpAnswer}
                    onChange={(e) => setFollowUpAnswer(e.target.value)}
                    placeholder="Your answer..."
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
                  />
                </div>
              )}
            </div>

            {/* Voice picker */}
            <div className="px-6 py-4 border-t" style={{ borderColor: meta.accent + "20" }}>
              <p className="text-xs uppercase tracking-wider mb-3" style={{ color: meta.accent + "99" }}>Choose AI Voice</p>
              {/* Indian English group */}
              <p className="text-[10px] font-semibold mb-2 opacity-60 tracking-wide">🇮🇳 Indian English</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {VOICES_INDIAN.map((v) => {
                  const AvatarComp = VOICE_AVATAR_MAP[v.id];
                  const isSelected = selectedVoice === v.id;
                  return (
                    <div key={v.id} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => setSelectedVoice(v.id)}
                        className={`w-full flex flex-col items-center rounded-xl pt-3 pb-2 px-1 transition-all border ${
                          isSelected ? "text-white" : "border-white/10 text-white/50 hover:text-white/80 hover:border-white/30"
                        }`}
                        style={isSelected ? { borderColor: meta.accent, background: meta.accent + "18" } : {}}
                      >
                        <div className="mb-1.5">
                          <AvatarComp size={56} selected={isSelected} accent={meta.accent} />
                        </div>
                        <p className="text-xs font-semibold leading-tight">{v.label}</p>
                        <p className="text-[9px] opacity-50 leading-tight text-center mt-0.5">{v.desc}</p>
                      </button>
                      <button
                        onClick={() => handlePreview(v.id)}
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-white/10 hover:border-white/30 text-white/40 hover:text-white/70 transition-colors"
                        title={`Preview ${v.label}`}
                      >
                        {previewingVoice === v.id
                          ? <Loader2 className="w-2.5 h-2.5 animate-spin" style={{ color: meta.accent }} />
                          : <Volume2 className="w-2.5 h-2.5" />}
                        <span>Preview</span>
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* International group */}
              <p className="text-[10px] font-semibold mb-2 opacity-60 tracking-wide">🌐 International</p>
              <div className="grid grid-cols-4 gap-2">
                {VOICES_INTERNATIONAL.map((v) => {
                  const AvatarComp = VOICE_AVATAR_MAP[v.id];
                  const isSelected = selectedVoice === v.id;
                  return (
                    <div key={v.id} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => setSelectedVoice(v.id)}
                        className={`w-full flex flex-col items-center rounded-xl pt-3 pb-2 px-1 transition-all border ${
                          isSelected ? "text-white" : "border-white/10 text-white/50 hover:text-white/80 hover:border-white/30"
                        }`}
                        style={isSelected ? { borderColor: meta.accent, background: meta.accent + "18" } : {}}
                      >
                        <div className="mb-1.5">
                          <AvatarComp size={56} selected={isSelected} accent={meta.accent} />
                        </div>
                        <p className="text-xs font-semibold leading-tight">{v.label}</p>
                        <p className="text-[9px] opacity-50 leading-tight text-center mt-0.5">{v.desc}</p>
                      </button>
                      <button
                        onClick={() => handlePreview(v.id)}
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-white/10 hover:border-white/30 text-white/40 hover:text-white/70 transition-colors"
                        title={`Preview ${v.label}`}
                      >
                        {previewingVoice === v.id
                          ? <Loader2 className="w-2.5 h-2.5 animate-spin" style={{ color: meta.accent }} />
                          : <Volume2 className="w-2.5 h-2.5" />}
                        <span>Preview</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Playback speed slider */}
              <div className="mt-4 pt-3 border-t" style={{ borderColor: meta.accent + "15" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider opacity-60 flex items-center gap-1">
                    <Gauge className="w-3 h-3" /> Playback Speed
                  </span>
                  <span className="text-xs font-bold" style={{ color: meta.accent }}>{selectedSpeed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.75}
                  max={1.5}
                  step={0.25}
                  value={selectedSpeed}
                  onChange={(e) => setSelectedSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: meta.accent }}
                />
                <div className="flex justify-between text-[9px] opacity-40 mt-1">
                  <span>0.75×</span><span>1.0×</span><span>1.25×</span><span>1.5×</span>
                </div>
              </div>
            </div>
            {/* Card footer */}
            <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: meta.accent + "20" }}>
              <button
                onClick={() => { setScenario(null); setPrompt(""); }}
                className="text-white/40 hover:text-white/70 text-sm transition-colors"
              >
                ← Try a different scenario
              </button>
              <Button
                onClick={handleStart}
                disabled={startMutation.isPending || (!!scenario.followUpQuestion && !followUpAnswer.trim())}
                size="lg"
                className="font-bold px-8 min-w-[210px] justify-center"
                style={{ background: meta.accent, color: meta.color }}
              >
                {startMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{startingLabel}</>
                ) : (
                  <>Start Practice <ChevronRight className="w-5 h-5 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Errors shown as toasts — startMutation errors are toast only */}
        {inferMutation.isError && (
          <div className="text-center py-4 text-red-400 text-sm">
            Could not generate scenario. Please try again or rephrase your description.
          </div>
        )}
      </div>
    </div>
  );
}
