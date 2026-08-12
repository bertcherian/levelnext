/**
 * AchievementUnlockedModal — Celebration modal for gamification achievements.
 * Uses CSS-only burst rings and confetti so preferences can disable all motion.
 */
import React, { useEffect, useState, type CSSProperties } from "react";
import { Share2, X, Sparkles } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  color?: string;
}

interface Props {
  achievement: Achievement | null;
  onClose: () => void;
  onShare?: (platform: "twitter" | "linkedin" | "copy") => void;
}

const CONFETTI_COLORS = ["#22D3EE", "#F472B6", "#4ADE80", "#FB923C", "#A78BFA", "#FCD34D", "#67E8F9"];
const CONFETTI_X = [-110, -76, -45, -18, 22, 48, 82, 116];
const CONFETTI_ROTATION = [-48, 32, -72, 64, -36, 52, -58, 42];

export default function AchievementUnlockedModal({ achievement, onClose, onShare }: Props) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setVisible(Boolean(achievement));
  }, [achievement]);

  if (!achievement) return null;

  const color = achievement.color || "#22D3EE";

  const handleShare = (platform: "twitter" | "linkedin" | "copy") => {
    if (onShare) {
      onShare(platform);
      return;
    }
    const text = `Just unlocked "${achievement.title}" on Launch Intelligence! 🎉 +${achievement.xp} XP`;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const fullText = `${text} ${url}`.trim();

    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
    } else if (platform === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
    } else if (platform === "copy") {
      const showCopied = () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      };
      const fallbackCopy = () => {
        const input = document.createElement("textarea");
        input.value = fullText;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copiedSuccessfully = document.execCommand("copy");
        document.body.removeChild(input);
        if (copiedSuccessfully) showCopied();
      };

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(fullText).then(showCopied).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    }
  };

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(10, 10, 15, 0.8)", backdropFilter: "blur(8px)", opacity: visible ? 1 : 0,
        transition: "opacity 200ms var(--ld-ease-out)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-title"
        style={{
          position: "relative", width: "90%", maxWidth: 400, padding: 32, borderRadius: 24,
          background: "linear-gradient(135deg, var(--ld-surface), var(--ld-surface-2))", border: `1px solid ${color}44`,
          boxShadow: `0 0 40px ${color}33, 0 20px 60px rgba(0,0,0,0.5)`, textAlign: "center",
          transform: visible ? "scale(1)" : "scale(0.95)", opacity: visible ? 1 : 0,
          transition: "all 300ms var(--ld-ease-out)",
        }}
      >
        <div className="ld-confetti-layer" aria-hidden="true">
          {[...CONFETTI_COLORS, color].map((confettiColor, index) => (
            <span
              key={`${confettiColor}-${index}`}
              className="ld-confetti"
              style={{
                background: confettiColor,
                ["--confetti-x" as string]: `${CONFETTI_X[index]}px`,
                ["--confetti-r" as string]: `${CONFETTI_ROTATION[index]}deg`,
                animationDelay: `${index * 45}ms`,
              } as CSSProperties}
            />
          ))}
        </div>

        <button
          onClick={onClose}
          aria-label="Close achievement celebration"
          style={{ position: "absolute", top: 12, right: 12, background: "transparent", border: "none", cursor: "pointer", color: "var(--ld-text-muted)", padding: 4 }}
        >
          <X size={18} />
        </button>

        <Sparkles className="ld-achievement-sparkle" size={20} style={{ color, margin: "0 auto 8px" }} />

        <div
          className="ld-achievement-icon"
          style={{
            width: 80, height: 80, margin: "0 auto 16px", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, background: `${color}1F`, border: `2px solid ${color}44`, boxShadow: `0 0 20px ${color}4D`,
          }}
        >
          <span className="ld-burst-ring ld-achievement-ring-one" style={{ borderColor: `${color}80` }} aria-hidden="true" />
          <span className="ld-burst-ring ld-achievement-ring-two" style={{ borderColor: `${color}4D` }} aria-hidden="true" />
          {achievement.icon}
        </div>

        <div style={{ color: "var(--ld-text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Achievement Unlocked</div>
        <h2 id="achievement-title" style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--ld-font-heading)", marginBottom: 8, color: "var(--ld-text)" }}>{achievement.title}</h2>
        <p style={{ fontSize: 14, color: "var(--ld-text-muted)", marginBottom: 16 }}>{achievement.description}</p>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 20, background: `${color}1F`, border: `1px solid ${color}33`, marginBottom: 20 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "var(--ld-font-heading)" }}>+{achievement.xp} XP</span>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
          <button onClick={() => handleShare("twitter")} className="ld-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 14px" }}><Share2 size={14} /> Tweet</button>
          <button onClick={() => handleShare("linkedin")} className="ld-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 14px" }}><Share2 size={14} /> LinkedIn</button>
          <button onClick={() => handleShare("copy")} className="ld-btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}>{copied ? "Copied!" : "Copy"}</button>
        </div>

        <button onClick={onClose} className="ld-btn-primary" style={{ width: "100%", padding: "10px 0", fontSize: 14 }}>Continue</button>
      </div>
    </div>
  );
}
