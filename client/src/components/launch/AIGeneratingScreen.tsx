import React, { useEffect, useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface Step {
  label: string;
  duration: number; // ms to show this step
}

interface AIGeneratingScreenProps {
  title: string;
  subtitle?: string;
  steps: Step[];
  accentColor?: string;
  icon?: React.ReactNode;
}

/**
 * A multi-step animated loading screen for AI generation moments.
 * Shows each step sequentially with a progress bar and step indicators.
 */
export function AIGeneratingScreen({
  title,
  subtitle,
  steps,
  accentColor = "#3B82F6",
  icon,
}: AIGeneratingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  useEffect(() => {
    if (currentStep >= steps.length) return;

    const step = steps[currentStep];
    const interval = 50; // update every 50ms
    const increment = (interval / step.duration) * 100;

    const timer = setInterval(() => {
      setStepProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          // Move to next step after a brief pause
          setTimeout(() => {
            setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
            setStepProgress(0);
          }, 200);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentStep, steps]);

  const overallProgress =
    ((currentStep + stepProgress / 100) / steps.length) * 100;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#0F172A" }}
    >
      <div className="w-full max-w-sm text-center">
        {/* Animated icon */}
        <div className="relative mx-auto mb-8 w-24 h-24">
          {/* Outer pulse ring */}
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: accentColor }}
          />
          {/* Inner ring */}
          <div
            className="absolute inset-2 rounded-full animate-pulse opacity-30"
            style={{ background: accentColor }}
          />
          {/* Icon container */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              background: `${accentColor}22`,
              border: `2px solid ${accentColor}55`,
            }}
          >
            {icon ?? <Sparkles size={32} style={{ color: accentColor }} />}
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-xl font-bold text-white mb-2"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-sm mb-8"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontFamily: "Manrope, sans-serif",
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Overall progress bar */}
        <div
          className="h-1.5 rounded-full mb-6 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${overallProgress}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
            }}
          />
        </div>

        {/* Step list */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isDone = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                style={{
                  background: isCurrent
                    ? `${accentColor}15`
                    : isDone
                    ? "rgba(255,255,255,0.03)"
                    : "transparent",
                  border: isCurrent
                    ? `1px solid ${accentColor}33`
                    : "1px solid transparent",
                }}
              >
                {/* Step indicator */}
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {isDone ? (
                    <CheckCircle2 size={18} style={{ color: accentColor }} />
                  ) : isCurrent ? (
                    <div
                      className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: accentColor, borderTopColor: "transparent" }}
                    />
                  ) : (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    />
                  )}
                </div>

                {/* Step label */}
                <p
                  className="text-sm text-left flex-1"
                  style={{
                    color: isDone
                      ? "rgba(255,255,255,0.4)"
                      : isCurrent
                      ? "white"
                      : "rgba(255,255,255,0.25)",
                    fontFamily: "Manrope, sans-serif",
                    fontWeight: isCurrent ? 600 : 400,
                  }}
                >
                  {step.label}
                </p>

                {/* Current step mini progress */}
                {isCurrent && (
                  <span
                    className="text-[10px] font-semibold flex-shrink-0"
                    style={{ color: accentColor }}
                  >
                    {Math.round(stepProgress)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * A success celebration screen shown after AI generation completes.
 */
interface SuccessScreenProps {
  title: string;
  subtitle: string;
  xpEarned?: number;
  accentColor?: string;
  icon?: React.ReactNode;
  onContinue: () => void;
  continueLabel?: string;
}

export function SuccessScreen({
  title,
  subtitle,
  xpEarned,
  accentColor = "#10B981",
  icon,
  onContinue,
  continueLabel = "View Results",
}: SuccessScreenProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#0F172A" }}
    >
      <div
        className="w-full max-w-sm text-center transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
        }}
      >
        {/* Success icon with burst */}
        <div className="relative mx-auto mb-8 w-28 h-28">
          {/* Burst rings */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                inset: `${-i * 12}px`,
                background: `${accentColor}${i === 0 ? "22" : i === 1 ? "12" : "08"}`,
                animation: `ping ${1 + i * 0.3}s cubic-bezier(0,0,0.2,1) infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              background: `${accentColor}22`,
              border: `2px solid ${accentColor}66`,
            }}
          >
            {icon ?? <CheckCircle2 size={40} style={{ color: accentColor }} />}
          </div>
        </div>

        {/* XP badge */}
        {xpEarned && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4"
            style={{
              background: `${accentColor}22`,
              border: `1px solid ${accentColor}44`,
            }}
          >
            <span className="text-sm">⭐</span>
            <span
              className="text-sm font-bold"
              style={{ color: accentColor, fontFamily: "Space Grotesk, sans-serif" }}
            >
              +{xpEarned} XP Earned!
            </span>
          </div>
        )}

        <h2
          className="text-2xl font-bold text-white mb-3"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          {title}
        </h2>
        <p
          className="text-sm leading-relaxed mb-8"
          style={{
            color: "rgba(255,255,255,0.6)",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          {subtitle}
        </p>

        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl text-sm font-bold transition-all duration-150 active:scale-[0.98]"
          style={{
            background: accentColor,
            color: "#fff",
            fontFamily: "Space Grotesk, sans-serif",
          }}
        >
          {continueLabel} →
        </button>
      </div>
    </div>
  );
}
