import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Zap, ArrowRight, Loader2, ChevronRight, Target, Clock, BarChart2, User, Volume2, Gauge, RefreshCw, Sparkles, MessageSquareText } from "lucide-react";
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

type AvatarProps = { size?: number; selected?: boolean; accent?: string };

type AvatarAppearance = {
  skin: string;
  hair: string;
  outfit: string;
  backdrop: string;
  style: "short" | "side-part" | "long" | "bun" | "waves" | "curls" | "silver";
  accessory?: "glasses" | "earrings" | "none";
};

function AvatarPortrait({ appearance, size = 64, selected = false, accent = "#D4AF37" }: AvatarProps & { appearance: AvatarAppearance }) {
  const hairPaths = {
    short: <path d="M25 43c1-18 14-27 24-27s23 9 23 27c-7-8-14-11-23-11s-17 3-24 11Z" fill={appearance.hair} />,
    "side-part": <path d="M24 43c0-17 13-28 25-28 9 0 19 6 22 18-8-6-16-8-23-8-10 0-17 6-24 18Z" fill={appearance.hair} />,
    long: <><path d="M23 47c0-19 12-31 26-31s26 12 26 31v24H65V45c-5-8-10-12-16-12s-11 4-16 12v26H23V47Z" fill={appearance.hair} /><path d="M29 42c6-12 12-17 20-17 9 0 15 5 20 17-7-6-13-8-20-8-7 0-13 2-20 8Z" fill={appearance.hair} /></>,
    bun: <><circle cx="50" cy="17" r="10" fill={appearance.hair} /><path d="M26 44c0-17 11-28 23-28 13 0 24 11 24 28-7-7-15-11-24-11-8 0-16 4-23 11Z" fill={appearance.hair} /></>,
    waves: <><path d="M23 45c1-19 13-30 26-30 14 0 26 11 27 30-7-7-13-11-18-11v34H40V34c-5 0-10 4-17 11Z" fill={appearance.hair} /><path d="M25 38c7-15 15-19 24-19 10 0 17 4 24 19-8-5-16-7-24-7-8 0-16 2-24 7Z" fill={appearance.hair} /></>,
    curls: <><path d="M22 46c2-17 12-29 27-29s25 12 27 29c-8-8-17-12-27-12-9 0-18 4-27 12Z" fill={appearance.hair} /><circle cx="29" cy="24" r="7" fill={appearance.hair} /><circle cx="39" cy="17" r="8" fill={appearance.hair} /><circle cx="52" cy="16" r="8" fill={appearance.hair} /><circle cx="65" cy="23" r="7" fill={appearance.hair} /></>,
    silver: <path d="M24 44c1-17 13-28 25-28 13 0 24 11 25 28-7-7-15-11-25-11-9 0-17 4-25 11Z" fill={appearance.hair} />,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="48" cy="48" r="46" fill={appearance.backdrop} />
      <circle cx="48" cy="48" r="44" stroke={selected ? accent : "rgba(255,255,255,0.10)"} strokeWidth={selected ? 3 : 1} />
      <circle cx="76" cy="21" r="10" fill={accent} opacity={selected ? 0.25 : 0.12} />
      <path d="M17 94c2-20 16-31 31-31 16 0 30 11 32 31H17Z" fill={appearance.outfit} />
      <path d="M42 56h14v16H42z" fill={appearance.skin} />
      <ellipse cx="49" cy="45" rx="20" ry="24" fill={appearance.skin} />
      {hairPaths[appearance.style]}
      <ellipse cx="41.5" cy="46" rx="2.2" ry="2.7" fill="#172235" />
      <ellipse cx="56.5" cy="46" rx="2.2" ry="2.7" fill="#172235" />
      <path d="M43 56c4 3.5 8 3.5 12 0" stroke="#9C5A49" strokeWidth="1.8" strokeLinecap="round" />
      {appearance.accessory === "glasses" && <><rect x="35" y="40" width="12" height="9" rx="3" stroke="#CEB164" strokeWidth="1.7" /><rect x="51" y="40" width="12" height="9" rx="3" stroke="#CEB164" strokeWidth="1.7" /><path d="M47 44.5h4" stroke="#CEB164" strokeWidth="1.7" /></>}
      {appearance.accessory === "earrings" && <><circle cx="29.5" cy="52" r="2" fill={accent} /><circle cx="68.5" cy="52" r="2" fill={accent} /></>}
      <path d="M39 65c6 4 13 4 20 0" stroke="white" strokeOpacity="0.34" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const AVATAR_APPEARANCES: Record<string, AvatarAppearance> = {
  shubh: { skin: "#B9784E", hair: "#1E1613", outfit: "#244D72", backdrop: "#1D3046", style: "short" },
  sumit: { skin: "#8C593E", hair: "#17110E", outfit: "#3B355A", backdrop: "#242B42", style: "side-part", accessory: "glasses" },
  simran: { skin: "#D49774", hair: "#261512", outfit: "#8B3B4A", backdrop: "#382844", style: "long", accessory: "earrings" },
  ishita: { skin: "#A76648", hair: "#201411", outfit: "#6B445B", backdrop: "#2C324B", style: "bun", accessory: "earrings" },
  nova: { skin: "#D9A27E", hair: "#B56A3F", outfit: "#6C4D95", backdrop: "#32294A", style: "waves", accessory: "earrings" },
  shimmer: { skin: "#8D5B43", hair: "#351F2B", outfit: "#2E6B67", backdrop: "#193A46", style: "long", accessory: "earrings" },
  alloy: { skin: "#B98062", hair: "#8993A4", outfit: "#46566E", backdrop: "#253447", style: "silver", accessory: "glasses" },
  fable: { skin: "#ECC4A7", hair: "#6B473D", outfit: "#74518B", backdrop: "#332A40", style: "curls" },
};

const VOICE_AVATAR_MAP: Record<string, React.FC<AvatarProps>> = Object.fromEntries(
  Object.entries(AVATAR_APPEARANCES).map(([voiceId, appearance]) => [
    voiceId,
    (props: AvatarProps) => <AvatarPortrait {...props} appearance={appearance} />,
  ])
);

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
const PREVIEW_TIMEOUT_MS = 15_000;

type Platform = "leadership" | "manager" | "career" | "young";

const PLATFORM_META: Record<Platform, { label: string; color: string; accent: string; backTarget: string; chips: string[] }> = {
  leadership: {
    label: "Leadership Intelligence",
    color: "#0A1A2F",
    accent: "#D4AF37",
    backTarget: "/practice",
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
    backTarget: "/manager/practice",
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
    backTarget: "/career/interview-prep",
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
    backTarget: "/early-career/practice",
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

type BehaviouralRehearsalHandoff = {
  moveId: number;
  momentId: number;
  moveTitle: string;
  moveDescription: string;
  suggestedLanguage: string[];
  successSignal: string;
};

function isTransientGenerationError(error: unknown): boolean {
  const message = typeof (error as { message?: unknown })?.message === "string"
    ? (error as { message: string }).message
    : "";
  const code = (error as { data?: { code?: string; httpStatus?: number } })?.data?.code;
  const httpStatus = (error as { data?: { httpStatus?: number } })?.data?.httpStatus;

  return code === "TOO_MANY_REQUESTS" || code === "TIMEOUT" ||
    httpStatus === 429 || (typeof httpStatus === "number" && httpStatus >= 500) ||
    /temporar|timeout|network|connection|rate limit|too many requests|unavailable/i.test(message);
}

export default function SimulatorStart() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  

  // Detect platform from URL
  const path = window.location.pathname;
  const simulatorParams = new URLSearchParams(window.location.search);
  const samplePreset = simulatorParams.get("sample") === "voice-simulator";
  const effectivenessBehavior = simulatorParams.get("ei_behavior");
  const effectivenessMove = simulatorParams.get("ei_move");
  const effectivenessGoal = simulatorParams.get("ei_goal");
  const platform: Platform = path.includes("/manager") ? "manager"
    : path.includes("/career") ? "career"
    : path.includes("/young") ? "young"
    : "leadership";

  const meta = PLATFORM_META[platform];
  const [behaviouralHandoff] = useState<BehaviouralRehearsalHandoff | null>(() => {
    try {
      const raw = localStorage.getItem("levelnext_behavioural_rehearsal");
      return raw ? JSON.parse(raw) as BehaviouralRehearsalHandoff : null;
    } catch {
      return null;
    }
  });
  const [prompt, setPrompt] = useState(() => behaviouralHandoff
    ? `Rehearse the Behavioural Move "${behaviouralHandoff.moveTitle}" in a realistic ${platform} conversation. The move is: ${behaviouralHandoff.moveDescription}. Use these phrases naturally: ${behaviouralHandoff.suggestedLanguage.join(" | ")}. Success looks like: ${behaviouralHandoff.successSignal}`
    : effectivenessBehavior
      ? `Rehearse the leadership behavior "${effectivenessBehavior}" in a realistic ${platform} conversation. Use this suggested move: ${effectivenessMove ?? "name the observable facts, ask one clarifying question, and agree the next action"}. Success looks like: ${effectivenessGoal ?? "the stakeholder understands the outcome and the next action is explicit"}. Make the stakeholder challenge me once so I can practise staying clear and composed.`
    : samplePreset
      ? "Explain a difficult workplace situation to a manager, then practise using one clear behavioural move: name the observable facts, ask one clarifying question, and agree the next action. The stakeholder should challenge me once so I can rehearse staying clear and composed."
      : "");
  const [scenario, setScenario] = useState<ScenarioCard | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>("shubh");
  const [previewingVoice, setPreviewingVoice] = useState<VoiceId | null>(null);
  const [previewError, setPreviewError] = useState<{ voice: VoiceId; message: string } | null>(null);
  const [lastScenarioPrompt, setLastScenarioPrompt] = useState("");
  const [scenarioError, setScenarioError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const activePreviewVoiceRef = useRef<VoiceId | null>(null);

  const clearPreviewState = (voice?: VoiceId) => {
    if (voice && activePreviewVoiceRef.current !== voice) return;
    if (previewTimeoutRef.current !== null) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    activePreviewVoiceRef.current = null;
    setPreviewingVoice(null);
  };

  const showPreviewError = (voice: VoiceId, message: string) => {
    clearPreviewState(voice);
    setPreviewError({ voice, message });
  };

  const ttsMutation = trpc.simulator.tts.useMutation({
    onSuccess: (data, variables) => {
      const voice = variables.voice;
      if (!voice || activePreviewVoiceRef.current !== voice) return;
      if (previewAudioRef.current) { previewAudioRef.current.pause(); }
      try {
        const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);
        audio.playbackRate = selectedSpeed;
        previewAudioRef.current = audio;
        audio.onended = () => clearPreviewState(voice);
        audio.onerror = () => showPreviewError(voice, "This preview could not be played. Please try again.");
        const playPromise = audio.play();
        if (playPromise) {
          void playPromise.catch(() => showPreviewError(voice, "Your browser could not start this preview. Please try again."));
        }
      } catch {
        showPreviewError(voice, "This preview could not be prepared. Please try again.");
      }
    },
    onError: (error, variables) => {
      const voice = variables.voice;
      if (!voice || activePreviewVoiceRef.current !== voice) return;
      const transient = isTransientGenerationError(error);
      showPreviewError(
        voice,
        transient
          ? "Voice preview is taking longer than usual. Please try again."
          : "This voice preview is unavailable right now. Please try again.",
      );
    },
  });
  const handlePreview = (voice: VoiceId) => {
    if (activePreviewVoiceRef.current === voice) {
      previewAudioRef.current?.pause();
      clearPreviewState(voice);
      return;
    }
    if (previewAudioRef.current) { previewAudioRef.current.pause(); }
    clearPreviewState();
    setPreviewError(null);
    const v = VOICES.find(x => x.id === voice)!;
    activePreviewVoiceRef.current = voice;
    setPreviewingVoice(voice);
    previewTimeoutRef.current = window.setTimeout(() => {
      if (activePreviewVoiceRef.current === voice) {
        showPreviewError(voice, "Voice preview is taking too long. Please try again.");
      }
    }, PREVIEW_TIMEOUT_MS);
    ttsMutation.mutate({ text: v.sample, voice });
  };
  const [adjustedDifficulty, setAdjustedDifficulty] = useState<number | null>(null);

  useEffect(() => () => {
    previewAudioRef.current?.pause();
    if (previewTimeoutRef.current !== null) window.clearTimeout(previewTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!samplePreset || behaviouralHandoff) return;
    localStorage.setItem("levelnext_sample_rehearsal", JSON.stringify({
      preset: "voice-simulator",
      steps: ["observable_facts", "clarifying_question", "agreed_next_action"],
      sessionId: null,
      startedAt: new Date().toISOString(),
    }));
  }, [samplePreset, behaviouralHandoff]);

  const inferMutation = trpc.simulator.inferScenario.useMutation({
    onSuccess: (data) => {
      setScenario(data);
      setScenarioError(null);
    },
    onError: (error) => {
      const retryable = isTransientGenerationError(error);
      setScenarioError({
        retryable,
        message: retryable
          ? "The scenario service is taking longer than usual. Your description is still here — please try again."
          : "We could not turn that description into a practice scenario. Add a little more context and try again.",
      });
    },
  });

  const [startingLabel, setStartingLabel] = useState("Starting...");

  const startMutation = trpc.simulator.startSession.useMutation({
    onError: (err) => {
      console.error("[SimulatorStart] startSession error:", err.message);
      toast.error("Could not start session — please try again.", { duration: 4000 });
    },
  });
  const createBehaviouralPracticeLinkMutation = trpc.behaviouralIntelligence.createPracticeLink.useMutation();

  // Cycle loading messages while session is being created
  useEffect(() => {
    if (!startMutation.isPending) { setStartingLabel("Starting..."); return; }
    const labels = ["Setting the scene…", "Briefing your character…", "Opening the conversation…"];
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % labels.length; setStartingLabel(labels[i]); }, 1400);
    return () => clearInterval(id);
  }, [startMutation.isPending]);

  const handleInfer = (text: string) => {
    const trimmedPrompt = text.trim();
    if (!trimmedPrompt) return;
    setLastScenarioPrompt(trimmedPrompt);
    setScenario(null);
    setFollowUpAnswer("");
    setScenarioError(null);
    inferMutation.reset();
    inferMutation.mutate({ prompt: trimmedPrompt, platform });
  };

  const retryScenarioGeneration = () => {
    if (lastScenarioPrompt) handleInfer(lastScenarioPrompt);
  };

  const handleStart = async () => {
    if (!scenario) return;
    // Persist speed so SimulatorSession can read it
    localStorage.setItem("sim_playback_speed", String(selectedSpeed));
    const finalPrompt = scenario.followUpQuestion && followUpAnswer
      ? `${prompt}. ${followUpAnswer}`
      : prompt;
    const effectiveDifficulty = adjustedDifficulty ?? scenario.difficulty;
    try {
      const data = await startMutation.mutateAsync({
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

      if (samplePreset && !behaviouralHandoff) {
        localStorage.setItem("levelnext_sample_rehearsal", JSON.stringify({
          preset: "voice-simulator",
          steps: ["observable_facts", "clarifying_question", "agreed_next_action"],
          sessionId: data.sessionId,
          startedAt: new Date().toISOString(),
        }));
      }

      if (behaviouralHandoff) {
        try {
          const link = await createBehaviouralPracticeLinkMutation.mutateAsync({
            moveId: behaviouralHandoff.moveId,
            momentId: behaviouralHandoff.momentId,
            providerType: "voice_simulator",
            providerSessionId: data.sessionId,
            scenarioContext: {
              moveTitle: behaviouralHandoff.moveTitle,
              suggestedLanguage: behaviouralHandoff.suggestedLanguage,
              successSignal: behaviouralHandoff.successSignal,
            },
          });
          localStorage.setItem("levelnext_behavioural_practice_link", JSON.stringify({
            linkId: link.id,
            sessionId: data.sessionId,
          }));
          localStorage.setItem("levelnext_active_behavioural_move", JSON.stringify({
            ...behaviouralHandoff,
            linkId: link.id,
            sessionId: data.sessionId,
          }));
          localStorage.removeItem("levelnext_behavioural_rehearsal");
        } catch (error) {
          console.warn("[BehaviouralIntelligence] Voice practice link failed:", error);
        }
      }

      navigate(`/simulator/${data.sessionId}`);
    } catch {
      // startMutation.onError owns the user-facing error toast.
    }
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
          <button onClick={() => navigate(meta.backTarget)} className="text-white/60 hover:text-white text-sm">
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

        {behaviouralHandoff && (
          <div className="mb-6 rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-5 text-left">
            <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              Behavioural Move rehearsal
            </div>
            <h2 className="mt-2 text-white font-semibold">{behaviouralHandoff.moveTitle}</h2>
            <p className="mt-1 text-white/65 text-sm leading-relaxed">{behaviouralHandoff.moveDescription}</p>
            <div className="mt-3 space-y-1.5">
              {behaviouralHandoff.suggestedLanguage.map((phrase) => (
                <p key={phrase} className="text-[#F8F5F0] text-xs italic">“{phrase}”</p>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#D4AF37]">Success signal: {behaviouralHandoff.successSignal}</p>
          </div>
        )}

        {samplePreset && !behaviouralHandoff && (
          <div className="mb-6 rounded-2xl border border-emerald-300/35 bg-emerald-300/10 p-5 text-left">
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              Platform Architecture Sample
            </div>
            <h2 className="mt-2 text-white font-semibold">Try a Behavioural Move in a realistic conversation</h2>
            <p className="mt-1 text-white/65 text-sm leading-relaxed">The scenario brief is prefilled from the Voice Simulator engine. Edit it freely, then build the scenario to experience how an insight becomes a rehearsable action.</p>
          </div>
        )}

        {/* Custom scenario composer */}
        <div className="mb-5">
          <label htmlFor="custom-scenario" className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
            <MessageSquareText className="w-4 h-4" style={{ color: meta.accent }} />
            Create a custom scenario
          </label>
          <p id="custom-scenario-help" className="text-white/45 text-xs mb-3">
            Include the person involved, the context, and the outcome you want to practise. We will create the character and challenge.
          </p>
          <Textarea
            id="custom-scenario"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (scenarioError) setScenarioError(null);
            }}
            placeholder="e.g. I need to have a difficult conversation with my manager about being passed over for a promotion..."
            className="w-full min-h-[100px] bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-white/40 resize-none text-base"
            aria-describedby="custom-scenario-help"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleInfer(prompt);
            }}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-white/30 text-xs">Cmd/Ctrl + Enter to generate</span>
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

        {/* Common scenario shortcuts */}
        {!scenario && !inferMutation.isPending && (
          <div className="mb-8">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Need a starting point?</p>
            <p className="text-white/50 text-sm mb-3">Choose a common scenario, then tailor it in your own words if needed.</p>
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

        {scenarioError && !inferMutation.isPending && (
          <div role="alert" aria-live="polite" className="mb-8 rounded-2xl border px-5 py-4" style={{ borderColor: "rgba(244, 140, 140, 0.46)", background: "rgba(172, 51, 51, 0.16)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-white font-semibold text-sm">We couldn’t generate your scenario</p>
                <p className="text-white/65 text-sm mt-1">{scenarioError.message}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {scenarioError.retryable && (
                  <Button onClick={retryScenarioGeneration} disabled={!lastScenarioPrompt} className="font-semibold" style={{ background: meta.accent, color: meta.color }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                )}
                <button onClick={() => { setScenarioError(null); inferMutation.reset(); }} className="text-sm text-white/65 hover:text-white transition-colors">
                  Edit scenario
                </button>
              </div>
            </div>
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
            <div className="px-6 py-5 border-t" style={{ borderColor: meta.accent + "20" }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4" style={{ color: meta.accent }} />
                <p className="text-xs uppercase tracking-wider" style={{ color: meta.accent + "CC" }}>Choose your AI voice</p>
              </div>
              <div className="rounded-2xl border p-3 mb-5" style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.025)" }}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span role="img" aria-label="India" className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl bg-white/10 border border-white/10">🇮🇳</span>
                    <div>
                      <p className="text-white text-sm font-semibold">Indian English</p>
                      <p className="text-white/45 text-[11px]">Natural Indian English voices</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-white/40">4 voices</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                          <div className="mb-2 rounded-full shadow-lg shadow-black/20">
                            <AvatarComp size={66} selected={isSelected} accent={meta.accent} />
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
              </div>
              {previewError && (
                <div role="alert" aria-live="polite" className="mb-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "rgba(244, 140, 140, 0.46)", background: "rgba(172, 51, 51, 0.16)" }}>
                  <p className="text-sm text-white/80">{previewError.message}</p>
                  <Button size="sm" onClick={() => handlePreview(previewError.voice)} style={{ background: meta.accent, color: meta.color }}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Retry preview
                  </Button>
                </div>
              )}
              <div className="rounded-2xl border p-3" style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.025)" }}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span role="img" aria-label="United States" className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl bg-white/10 border border-white/10">🇺🇸</span>
                    <div>
                      <p className="text-white text-sm font-semibold">International English</p>
                      <p className="text-white/45 text-[11px]">International voices using US English</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-white/40">4 voices</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                          <div className="mb-2 rounded-full shadow-lg shadow-black/20">
                            <AvatarComp size={66} selected={isSelected} accent={meta.accent} />
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
