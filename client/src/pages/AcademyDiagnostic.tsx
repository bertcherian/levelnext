import { useState } from "react";
import { useLocation } from "wouter";
import AcademyLayout from "../components/AcademyLayout";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { ACADEMY_ROLE_TRACKS, type AcademyRoleTrack } from "@shared/modules/academy";

export default function AcademyDiagnostic() {
  const [, setLocation] = useLocation();
  const { data: questions, isLoading } = trpc.academy.getDiagnosticItems.useQuery();
  const submitMutation = trpc.academy.submitDiagnostic.useMutation();

  const [roleTrack, setRoleTrack] = useState<AcademyRoleTrack>("other");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { response: string; confidence: "low" | "medium" | "high" }>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">("medium");

  if (isLoading || !questions || questions.length === 0) {
    return (
      <AcademyLayout stageBadge="Diagnostic">
        <div className="py-24 text-center">
          <div className="h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#F8F5F0]/70">Loading baseline diagnostic scenarios...</p>
        </div>
      </AcademyLayout>
    );
  }

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleNext = async () => {
    if (!selectedOption) {
      toast.error("Please choose an answer option before continuing.");
      return;
    }

    const updated = {
      ...answers,
      [currentQ.id]: {
        response: selectedOption,
        confidence,
      },
    };
    setAnswers(updated);

    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
      const nextQ = questions[currentIndex + 1];
      setSelectedOption(updated[nextQ.id]?.response ?? null);
      setConfidence(updated[nextQ.id]?.confidence ?? "medium");
    } else {
      // Submit all
      const payload = Object.entries(updated).map(([itemKey, val]) => ({
        itemKey,
        response: val.response,
        confidence: val.confidence,
      }));

      try {
        const res = await submitMutation.mutateAsync({
          roleTrack,
          responses: payload,
        });
        toast.success(`Diagnostic completed! Fluency score: ${res.overallScore}/100`);
        setLocation("/academy/passport");
      } catch (err: any) {
        toast.error(err.message || "Failed to submit diagnostic.");
      }
    }
  };

  return (
    <AcademyLayout stageBadge="Baseline Diagnostic">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#D4AF37]">
            <span className="font-semibold uppercase tracking-wider">
              Scenario {currentIndex + 1} of {questions.length} • Dimension: {currentQ.dimension.toUpperCase()}
            </span>
            <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4AF37] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Role Track Selector on First Question */}
        {currentIndex === 0 && (
          <div className="bg-[#1C1C1C] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white">Your Role Focus</p>
              <p className="text-[11px] text-[#F8F5F0]/60">Shapes your personalized scenarios and mentor depth.</p>
            </div>
            <select
              value={roleTrack}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleTrack(e.target.value as AcademyRoleTrack)}
              className="bg-[#0A1A2F] border border-[#D4AF37]/40 text-xs rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
            >
              {ACADEMY_ROLE_TRACKS.map((t: AcademyRoleTrack) => (
                <option key={t} value={t}>
                  {t.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Scenario Card */}
        <div className="bg-[#1C1C1C] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/30">
              <Sparkles size={12} /> Workplace Scenario
            </span>
            <p className="text-sm italic text-[#F8F5F0]/80 border-l-2 border-[#D4AF37] pl-3 py-1 bg-white/[0.02] rounded-r">
              "{currentQ.scenario}"
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white pt-2">{currentQ.question}</h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOption === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedOption(opt.key)}
                  className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition flex items-start gap-3 ${
                    isSelected
                      ? "border-[#D4AF37] bg-[#D4AF37]/15 text-white shadow-md"
                      : "border-white/10 bg-white/[0.02] text-[#F8F5F0]/80 hover:bg-white/5 hover:border-white/20"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      isSelected ? "bg-[#D4AF37] text-[#0A1A2F]" : "border border-white/20 text-white/50"
                    }`}
                  >
                    {opt.key}
                  </span>
                  <span className="leading-relaxed">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Confidence Calibration */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <p className="text-xs font-semibold text-[#D4AF37]">Confidence in this answer:</p>
            <div className="grid grid-cols-3 gap-3">
              {(["low", "medium", "high"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConfidence(level)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium capitalize transition border ${
                    confidence === level
                      ? "bg-[#D4AF37] text-[#0A1A2F] border-[#D4AF37] font-bold"
                      : "bg-white/5 text-[#F8F5F0]/70 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {level} Confidence
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end pt-4">
            <button
              type="button"
              onClick={handleNext}
              disabled={submitMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#D4AF37] text-[#0A1A2F] text-xs font-bold hover:bg-[#c49f2e] transition shadow-md disabled:opacity-50"
            >
              <span>{isLast ? "Complete & View Passport" : "Next Scenario"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </AcademyLayout>
  );
}
