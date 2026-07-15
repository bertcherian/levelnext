/**
 * InfinityLoader
 * A full-screen loading overlay featuring the LevelNext infinity-arrow mark.
 *
 * Animation:
 *  1. The infinity path "draws on" via stroke-dashoffset (1.8 s, ease-in-out).
 *  2. A soft gold glow pulses around the mark (2 s, alternating).
 *  3. The whole overlay fades in on mount and fades out when `visible` goes false.
 *
 * Usage:
 *   <InfinityLoader visible={isLoading} label="Loading your report…" />
 */

import { useEffect, useState } from "react";

const NAVY  = "#0A1A2F";
const GOLD  = "#D4AF37";
const IVORY = "#F8F5F0";

interface Props {
  visible: boolean;
  label?: string;
}

export default function InfinityLoader({ visible, label = "Loading your report…" }: Props) {
  // Keep the DOM mounted for the fade-out transition
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else {
      // Unmount after the fade-out transition completes (400 ms)
      const t = setTimeout(() => setMounted(false), 420);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <>
      {/* ── Keyframe styles injected once ── */}
      <style>{`
        @keyframes ln-draw {
          from { stroke-dashoffset: 900; opacity: 0.2; }
          to   { stroke-dashoffset: 0;   opacity: 1; }
        }
        @keyframes ln-draw-arrow {
          0%   { stroke-dashoffset: 200; opacity: 0; }
          40%  { opacity: 0; }
          100% { stroke-dashoffset: 0;   opacity: 1; }
        }
        @keyframes ln-glow {
          0%, 100% { filter: drop-shadow(0 0 6px ${GOLD}66); }
          50%       { filter: drop-shadow(0 0 18px ${GOLD}cc) drop-shadow(0 0 32px ${GOLD}55); }
        }
        @keyframes ln-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ln-fade-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes ln-label-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        .ln-overlay {
          animation: ln-fade-in 220ms ease-out forwards;
        }
        .ln-overlay.ln-hiding {
          animation: ln-fade-out 400ms ease-in forwards;
        }
        .ln-infinity-path {
          stroke-dasharray: 900;
          stroke-dashoffset: 900;
          animation: ln-draw 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards;
        }
        .ln-arrow-path {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: ln-draw-arrow 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards;
        }
        .ln-glow-group {
          animation: ln-glow 2s ease-in-out 1.2s infinite;
        }
        .ln-label {
          animation: ln-label-pulse 1.8s ease-in-out 0.6s infinite;
        }
      `}</style>

      <div
        className={`ln-overlay${!visible ? " ln-hiding" : ""}`}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: NAVY,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
        }}
      >
        {/* ── Infinity SVG ── */}
        <div className="ln-glow-group" style={{ width: 180, height: 90 }}>
          <svg
            viewBox="0 0 200 100"
            width="180"
            height="90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/*
              Infinity path: two looping curves meeting at centre.
              Left loop (gold), right loop (white/silver), crossing gradient.
              Arrow head pointing upper-right from the crossing point.
            */}

            {/* Left loop — gold */}
            <path
              className="ln-infinity-path"
              d="M100 50 C100 50 85 20 60 20 C35 20 15 35 15 50 C15 65 35 80 60 80 C85 80 100 50 100 50"
              stroke={GOLD}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Right loop — white */}
            <path
              className="ln-infinity-path"
              d="M100 50 C100 50 115 80 140 80 C165 80 185 65 185 50 C185 35 165 20 140 20 C115 20 100 50 100 50"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ animationDelay: "0.25s" }}
            />

            {/* Arrow shaft — gold, from crossing toward upper-right */}
            <path
              className="ln-arrow-path"
              d="M95 55 L130 22"
              stroke={GOLD}
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />

            {/* Arrow head */}
            <path
              className="ln-arrow-path"
              d="M130 22 L115 20 M130 22 L132 37"
              stroke={GOLD}
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ animationDelay: "0.35s" }}
            />
          </svg>
        </div>

        {/* ── Label ── */}
        <p
          className="ln-label text-sm font-medium tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "0.15em" }}
        >
          {label}
        </p>
      </div>
    </>
  );
}
