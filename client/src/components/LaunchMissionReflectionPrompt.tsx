import React, { useEffect, useRef, useState } from "react";
import { Lightbulb, X } from "lucide-react";

type LaunchMissionReflectionPromptProps = {
  missionTitle: string;
  isSaving: boolean;
  errorMessage?: string;
  onSave: (reflectionText: string) => void;
  onSkip: () => void;
};

export default function LaunchMissionReflectionPrompt({
  missionTitle,
  isSaving,
  errorMessage,
  onSave,
  onSkip,
}: LaunchMissionReflectionPromptProps) {
  const [reflectionText, setReflectionText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const canSave = reflectionText.trim().length > 0 && !isSaving;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/75 p-3 sm:items-center" role="presentation">
      <section
        aria-labelledby="reflection-prompt-title"
        aria-modal="true"
        className="ld-card w-full max-w-lg p-5 sm:p-6"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !isSaving) onSkip();
        }}
        role="dialog"
        style={{ borderColor: "rgba(167,139,250,0.45)", boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: "rgba(167,139,250,0.16)", color: "var(--ld-purple)", border: "1px solid rgba(167,139,250,0.35)" }}>
              <Lightbulb size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="ld-eyebrow">Optional reflection</p>
              <h2 id="reflection-prompt-title" className="mt-1 text-lg font-bold" style={{ fontFamily: "var(--ld-font-heading)" }}>Make the win stick</h2>
            </div>
          </div>
          <button type="button" aria-label="Skip reflection" className="ld-btn-icon" disabled={isSaving} onClick={onSkip}><X size={17} /></button>
        </div>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--ld-text-muted)" }}>
          You completed <strong style={{ color: "var(--ld-text)" }}>{missionTitle}</strong>. What did you learn, notice, or want to carry into your next move?
        </p>
        <label className="sr-only" htmlFor="mission-reflection">Your private reflection</label>
        <textarea
          ref={textareaRef}
          id="mission-reflection"
          maxLength={500}
          onChange={(event) => setReflectionText(event.target.value)}
          placeholder="For example: I learned that a more specific opener made my outreach feel easier."
          rows={5}
          value={reflectionText}
          className="mt-4 w-full resize-none rounded-2xl p-3 text-sm outline-none"
          style={{ background: "var(--ld-surface)", border: "1px solid var(--ld-border)", color: "var(--ld-text)" }}
        />
        <div className="mt-1 flex justify-between text-[11px]" style={{ color: "var(--ld-text-dim)" }}><span>Only you can see this.</span><span>{reflectionText.length}/500</span></div>
        {errorMessage && <p role="alert" className="mt-3 text-xs" style={{ color: "var(--ld-danger)" }}>{errorMessage}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="ld-btn-ghost text-sm" disabled={isSaving} onClick={onSkip}>Skip for now</button>
          <button type="button" className="ld-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-50" disabled={!canSave} onClick={() => onSave(reflectionText.trim())}>{isSaving ? "Saving…" : "Save reflection"}</button>
        </div>
      </section>
    </div>
  );
}
