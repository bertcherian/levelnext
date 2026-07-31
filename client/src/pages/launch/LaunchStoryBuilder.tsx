import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Sparkles, ChevronRight, Loader2, Copy, Check, Edit3, RefreshCw, Mic2, Download } from "lucide-react";
import { toast } from "sonner";
import { AIGeneratingScreen, SuccessScreen } from "@/components/launch/AIGeneratingScreen";

type Phase = "intro" | "step1" | "step1_generating" | "step1_success" | "step1_result" | "step2" | "step2_generating" | "step2_success" | "step2_result" | "step3" | "step3_generating" | "step3_success" | "step3_result" | "complete";

export default function LaunchStoryBuilder() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("intro");
  const [copied, setCopied] = useState<string | null>(null);

  // Step 1 state
  const [originStory, setOriginStory] = useState("");
  const [refinedStory, setRefinedStory] = useState("");

  // Step 2 state
  const [topSkills, setTopSkills] = useState<string[]>(["", "", ""]);
  const [targetAudience, setTargetAudience] = useState("");
  const [uniqueQuality, setUniqueQuality] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [valueProposition, setValueProposition] = useState("");
  const [linkedinHeadline, setLinkedinHeadline] = useState("");

  // Step 3 state
  const [pitch30, setPitch30] = useState("");
  const [pitch60, setPitch60] = useState("");
  const [linkedinAbout, setLinkedinAbout] = useState("");

  const { data: existingKit } = trpc.launchStoryBuilder.getBrandKit.useQuery();

  // Pre-fill from existing kit
  React.useEffect(() => {
    if (existingKit) {
      if (existingKit.originStory) setOriginStory(existingKit.originStory);
      if (existingKit.originStoryRefined) setRefinedStory(existingKit.originStoryRefined);
      if (existingKit.valuePropositionRefined) setValueProposition(existingKit.valuePropositionRefined);
      if (existingKit.linkedinHeadline) setLinkedinHeadline(existingKit.linkedinHeadline);
      if (existingKit.elevatorPitch30) setPitch30(existingKit.elevatorPitch30);
      if (existingKit.elevatorPitch60) setPitch60(existingKit.elevatorPitch60);
      if (existingKit.linkedinAbout) setLinkedinAbout(existingKit.linkedinAbout);

      // If all steps complete, go to complete view
      if (existingKit.originStoryComplete && existingKit.valuePropositionComplete && existingKit.elevatorPitchComplete) {
        setPhase("complete");
      }
    }
  }, [existingKit]);

  const saveOriginStory = trpc.launchStoryBuilder.saveOriginStory.useMutation({
    onSuccess: (data) => {
      setRefinedStory(data.refinedStory);
      setPhase("step1_success");
    },
    onError: () => { toast.error("Something went wrong. Please try again."); setPhase("step1"); },
  });

  const generateValueProp = trpc.launchStoryBuilder.generateValueProposition.useMutation({
    onSuccess: (data) => {
      setValueProposition(data.valueProposition);
      setLinkedinHeadline(data.linkedinHeadline);
      setPhase("step2_success");
    },
    onError: () => { toast.error("Something went wrong. Please try again."); setPhase("step2"); },
  });

  const generatePitch = trpc.launchStoryBuilder.generateElevatorPitch.useMutation({
    onSuccess: (data) => {
      setPitch30(data.pitch30);
      setPitch60(data.pitch60);
      setLinkedinAbout(data.linkedinAbout);
      setPhase("step3_success");
    },
    onError: () => { toast.error("Something went wrong. Please try again."); setPhase("step3"); },
  });

  const updateBrandKit = trpc.launchStoryBuilder.updateBrandKit.useMutation();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Intro ─────────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="launch-theme min-h-screen flex flex-col" style={{ background: "#0F172A" }}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)" }}>
            <Sparkles size={36} style={{ color: "#10B981" }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Story Builder
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Manrope, sans-serif" }}>
            Your professional story is your most powerful career asset. In 3 steps, you'll craft your Origin Story, Value Proposition, and Elevator Pitch — all AI-refined and ready to use.
          </p>

          <div className="w-full space-y-3 mb-8">
            {[
              { step: "01", title: "Origin Story", desc: "Where you came from and why you do what you do", color: "#10B981" },
              { step: "02", title: "Value Proposition", desc: "What makes you uniquely valuable to employers", color: "#3B82F6" },
              { step: "03", title: "Elevator Pitch", desc: "Your 30-second and 60-second professional introduction", color: "#F59E0B" },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-3 p-3 rounded-xl text-left"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}22`, border: `1px solid ${s.color}44` }}>
                  <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.step}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{s.title}</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setPhase("step1")}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 active:scale-[0.98]"
            style={{ background: "#10B981", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
            Start Story Builder →
          </button>
          <button onClick={() => navigate("/launch/journey")} className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            Back to Journey Map
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Origin Story ──────────────────────────────────────────────────────
  if (phase === "step1") {
    return (
      <div className="launch-theme min-h-screen flex flex-col" style={{ background: "#0F172A" }}>
        <div className="h-1 w-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-1 w-1/3" style={{ background: "#10B981" }} />
        </div>
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#10B981" }}>Step 1 of 3</p>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Your Origin Story</h2>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Manrope, sans-serif" }}>
              Tell us about the moment you knew what you wanted to do, or what led you to your field. Be honest and specific — the AI will refine it.
            </p>
          </div>

          <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Manrope, sans-serif" }}>
              <strong style={{ color: "#10B981" }}>Prompt:</strong> What sparked your interest in your field? Was there a moment, a person, a problem you saw? What did you do about it?
            </p>
          </div>

          <textarea
            value={originStory}
            onChange={(e) => setOriginStory(e.target.value)}
            placeholder="I first got interested in [field] when... I remember [specific moment]... That experience made me realise..."
            rows={8}
            className="w-full p-4 rounded-2xl text-sm resize-none outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${originStory.length > 50 ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)"}`,
              color: "white",
              fontFamily: "Manrope, sans-serif",
              lineHeight: "1.7",
            }}
          />
          <p className="text-[10px] mt-1 text-right" style={{ color: "rgba(255,255,255,0.2)" }}>
            {originStory.length} characters (aim for 100+)
          </p>

          <button
            onClick={() => saveOriginStory.mutate({ originStory, refineWithAI: true })}
            disabled={originStory.length < 50 || saveOriginStory.isPending}
            className="w-full mt-4 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "#10B981", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
            {saveOriginStory.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={14} /> Refine with AI</>}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1 Generating ─────────────────────────────────────────────────────────
  if (phase === "step1_generating") {
    return (
      <AIGeneratingScreen
        title="Refining Your Origin Story"
        subtitle="Transforming your raw story into a compelling professional narrative..."
        accentColor="#10B981"
        icon={<Sparkles size={32} style={{ color: "#10B981" }} />}
        steps={[
          { label: "Reading your raw story", duration: 1200 },
          { label: "Identifying key narrative moments", duration: 1500 },
          { label: "Crafting your professional arc", duration: 1800 },
          { label: "Polishing the language", duration: 1200 },
        ]}
      />
    );
  }

  // ── Step 1 Success ────────────────────────────────────────────────────────────
  if (phase === "step1_success") {
    return (
      <SuccessScreen
        title="Your Origin Story is Ready!"
        subtitle="Your raw story has been transformed into a compelling professional narrative. Review and make it yours."
        accentColor="#10B981"
        icon={<Sparkles size={40} style={{ color: "#10B981" }} />}
        onContinue={() => setPhase("step1_result")}
        continueLabel="Review My Origin Story"
      />
    );
  }

  // ── Step 1 Result ─────────────────────────────────────────────────────────────
  if (phase === "step1_result") {
    return (
      <div className="launch-theme min-h-screen flex flex-col" style={{ background: "#0F172A" }}>
        <div className="h-1 w-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-1 w-1/3" style={{ background: "#10B981" }} />
        </div>
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#10B981" }}>Step 1 Complete ✓</p>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Your Origin Story</h2>
          </div>

          <div className="p-4 rounded-2xl mb-4" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#10B981" }}>AI-Refined Version</p>
              <button onClick={() => handleCopy(refinedStory, "story")}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                {copied === "story" ? <Check size={10} /> : <Copy size={10} />}
                {copied === "story" ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-sm leading-relaxed text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{refinedStory}</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button onClick={() => setPhase("step1")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
              <Edit3 size={12} /> Edit
            </button>
            <button onClick={() => saveOriginStory.mutate({ originStory, refineWithAI: true })}
              disabled={saveOriginStory.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
              {saveOriginStory.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Regenerate
            </button>
          </div>

          <button onClick={() => setPhase("step2")}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 active:scale-[0.98]"
            style={{ background: "#3B82F6", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
            Next: Value Proposition →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Value Proposition ─────────────────────────────────────────────────
  if (phase === "step2") {
    return (
      <div className="launch-theme min-h-screen flex flex-col" style={{ background: "#0F172A" }}>
        <div className="h-1 w-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-1 w-2/3" style={{ background: "linear-gradient(90deg, #10B981, #3B82F6)" }} />
        </div>
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#3B82F6" }}>Step 2 of 3</p>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Your Value Proposition</h2>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Manrope, sans-serif" }}>
              What makes you uniquely valuable? Answer 4 quick questions.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>
                Your top 3 skills
              </label>
              <div className="grid grid-cols-3 gap-2">
                {topSkills.map((skill, i) => (
                  <input key={i} value={skill}
                    onChange={(e) => { const s = [...topSkills]; s[i] = e.target.value; setTopSkills(s); }}
                    placeholder={`Skill ${i + 1}`}
                    className="p-2.5 rounded-xl text-xs outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                ))}
              </div>
            </div>

            {[
              { label: "Who do you want to help / work with?", value: targetAudience, set: setTargetAudience, placeholder: "e.g. early-stage startups, healthcare companies, marketing teams..." },
              { label: "What makes you unique compared to other candidates?", value: uniqueQuality, set: setUniqueQuality, placeholder: "e.g. I combine technical skills with strong communication..." },
              { label: "What outcome do you help them achieve?", value: desiredOutcome, set: setDesiredOutcome, placeholder: "e.g. build better products faster, grow their online presence..." },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</label>
                <textarea value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} rows={2}
                  className="w-full p-3 rounded-xl text-xs resize-none outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontFamily: "Manrope, sans-serif" }} />
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setPhase("step2_generating");
              generateValueProp.mutate({ topSkills: topSkills.filter(Boolean), targetAudience, uniqueQuality, desiredOutcome });
            }}
            disabled={!topSkills.some(Boolean) || !targetAudience || !uniqueQuality || !desiredOutcome}
            className="w-full mt-6 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "#3B82F6", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
            <Sparkles size={14} /> Generate Value Proposition
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2 Generating ─────────────────────────────────────────────────────────
  if (phase === "step2_generating") {
    return (
      <AIGeneratingScreen
        title="Building Your Value Proposition"
        subtitle="Crafting what makes you uniquely valuable..."
        accentColor="#3B82F6"
        icon={<Sparkles size={32} style={{ color: "#3B82F6" }} />}
        steps={[
          { label: "Analysing your skills & strengths", duration: 1300 },
          { label: "Mapping your target audience", duration: 1200 },
          { label: "Identifying your unique angle", duration: 1500 },
          { label: "Writing your value proposition", duration: 1400 },
          { label: "Crafting your LinkedIn headline", duration: 1000 },
        ]}
      />
    );
  }

  // ── Step 2 Success ────────────────────────────────────────────────────────────
  if (phase === "step2_success") {
    return (
      <SuccessScreen
        title="Your Value Proposition is Done!"
        subtitle="We've distilled what makes you uniquely valuable into a sharp, professional statement — plus your LinkedIn headline."
        accentColor="#3B82F6"
        icon={<Sparkles size={40} style={{ color: "#3B82F6" }} />}
        onContinue={() => setPhase("step2_result")}
        continueLabel="See My Value Proposition"
      />
    );
  }

  // ── Step 2 Result ─────────────────────────────────────────────────────────────
  if (phase === "step2_result") {
    return (
      <div className="launch-theme min-h-screen flex flex-col" style={{ background: "#0F172A" }}>
        <div className="h-1 w-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-1 w-2/3" style={{ background: "linear-gradient(90deg, #10B981, #3B82F6)" }} />
        </div>
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#3B82F6" }}>Step 2 Complete ✓</p>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Your Value Proposition</h2>
          </div>

          <div className="space-y-3 mb-6">
            <div className="p-4 rounded-2xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#3B82F6" }}>Value Proposition</p>
                <button onClick={() => handleCopy(valueProposition, "vp")}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
                  style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}>
                  {copied === "vp" ? <Check size={10} /> : <Copy size={10} />}
                  {copied === "vp" ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{valueProposition}</p>
            </div>

            <div className="p-4 rounded-2xl" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#3B82F6" }}>LinkedIn Headline</p>
                <button onClick={() => handleCopy(linkedinHeadline, "headline")}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
                  style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}>
                  {copied === "headline" ? <Check size={10} /> : <Copy size={10} />}
                  {copied === "headline" ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{linkedinHeadline}</p>
            </div>
          </div>

          <button onClick={() => setPhase("step3")}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 active:scale-[0.98]"
            style={{ background: "#F59E0B", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
            Next: Elevator Pitch →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Elevator Pitch ────────────────────────────────────────────────────
  if (phase === "step3") {
    return (
      <div className="launch-theme min-h-screen flex flex-col" style={{ background: "#0F172A" }}>
        <div className="h-1 w-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #10B981, #3B82F6, #F59E0B)" }} />
        </div>
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#F59E0B" }}>Step 3 of 3 — Final Step!</p>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Your Elevator Pitch</h2>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Manrope, sans-serif" }}>
              We'll generate your 30-second pitch, 60-second pitch, and a full LinkedIn About section — all from your story and value proposition.
            </p>
          </div>

          <div className="p-4 rounded-2xl mb-6" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "#F59E0B" }}>What you've built so far:</p>
            <p className="text-xs text-white mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <strong>Story:</strong> {refinedStory.slice(0, 80)}...
            </p>
            <p className="text-xs text-white" style={{ fontFamily: "Manrope, sans-serif" }}>
              <strong>Value:</strong> {valueProposition.slice(0, 80)}...
            </p>
          </div>

          <button
            onClick={() => generatePitch.mutate({ context: "a professional networking event or job interview" })}
            disabled={generatePitch.isPending}
            className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "#F59E0B", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
            {generatePitch.isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Generating your pitches...</>
            ) : (
              <><Sparkles size={14} /> Generate My Elevator Pitches</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3 Result / Complete ──────────────────────────────────────────────────
  // ── Step 3 Generating ─────────────────────────────────────────────────────────
  if (phase === "step3_generating") {
    return (
      <AIGeneratingScreen
        title="Crafting Your Elevator Pitches"
        subtitle="Building your 30s pitch, 60s pitch, and LinkedIn About section..."
        accentColor="#F59E0B"
        icon={<Mic2 size={32} style={{ color: "#F59E0B" }} />}
        steps={[
          { label: "Weaving your story & value together", duration: 1500 },
          { label: "Crafting your 30-second pitch", duration: 1600 },
          { label: "Expanding to 60-second pitch", duration: 1400 },
          { label: "Writing your LinkedIn About section", duration: 2000 },
          { label: "Polishing tone & language", duration: 1200 },
        ]}
      />
    );
  }

  // ── Step 3 Success ────────────────────────────────────────────────────────────
  if (phase === "step3_success") {
    return (
      <SuccessScreen
        title="Your Brand Kit is Complete!"
        subtitle="Your Origin Story, Value Proposition, and Elevator Pitches are ready. Download your Brand Kit PDF or copy directly to LinkedIn."
        xpEarned={150}
        accentColor="#F59E0B"
        icon={<Sparkles size={40} style={{ color: "#F59E0B" }} />}
        onContinue={() => setPhase("step3_result")}
        continueLabel="View & Export My Brand Kit"
      />
    );
  }

  if (phase === "step3_result" || phase === "complete") {
    return (
      <div className="launch-theme min-h-screen" style={{ background: "#0F172A" }}>
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)" }}>
              <Sparkles size={28} style={{ color: "#10B981" }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Your Brand Kit is Ready
            </h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>+150 XP earned</p>
          </div>

          <div className="space-y-4">
            {[
              { label: "30-Second Pitch", content: pitch30, color: "#F59E0B", key: "p30" },
              { label: "60-Second Pitch", content: pitch60, color: "#F59E0B", key: "p60" },
              { label: "LinkedIn About Section", content: linkedinAbout, color: "#3B82F6", key: "about" },
              { label: "LinkedIn Headline", content: linkedinHeadline, color: "#3B82F6", key: "headline2" },
              { label: "Origin Story", content: refinedStory, color: "#10B981", key: "story2" },
              { label: "Value Proposition", content: valueProposition, color: "#10B981", key: "vp2" },
            ].filter(({ content }) => content).map(({ label, content, color, key }) => (
              <div key={key} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color }}>{label}</p>
                  <button onClick={() => handleCopy(content, key)}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
                    style={{ background: `${color}22`, color }}>
                    {copied === key ? <Check size={10} /> : <Copy size={10} />}
                    {copied === key ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-white leading-relaxed" style={{ fontFamily: "Manrope, sans-serif" }}>{content}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={async () => {
                try {
                  const { exportBrandKitPdf } = await import("@/lib/brandKitPdf");
                  await exportBrandKitPdf({
                    originStory: refinedStory,
                    valueProposition,
                    linkedinHeadline,
                    pitch30,
                    pitch60,
                    linkedinAbout,
                  });
                } catch (e) {
                  toast.error("PDF export failed. Please try again.");
                }
              }}
              className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
              style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", fontFamily: "Space Grotesk, sans-serif" }}>
              <Download size={16} /> Download Brand Kit PDF
            </button>
            <button onClick={() => navigate("/launch/journey")}
              className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 active:scale-[0.98]"
              style={{ background: "#10B981", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
              Back to Journey Map
            </button>
            <button onClick={() => navigate("/launch/home")}
              className="w-full py-3 text-xs"
              style={{ color: "rgba(255,255,255,0.3)" }}>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
