import AcademyLayout from "../components/AcademyLayout";
import { trpc } from "../lib/trpc";
import { Link } from "wouter";
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Calendar,
  Compass,
} from "lucide-react";
import { slugToLabel, ACADEMY_DIMENSION_WEIGHTS, type AcademyDimension } from "@shared/modules/academy";

export default function AcademyPassport() {
  const { data: passport, isLoading } = trpc.academy.getPassportSummary.useQuery();

  if (isLoading || !passport) {
    return (
      <AcademyLayout stageBadge="Product Passport">
        <div className="py-24 text-center">
          <div className="h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#F8F5F0]/70">Loading verified Product Passport...</p>
        </div>
      </AcademyLayout>
    );
  }

  const { profile, compositeScore, fluencyLevel, dimensionScores, gaps, recentAttempts, evidenceLedger } = passport;

  const architectureExplored = evidenceLedger.some((event) => event.eventType === "step_explored" && event.objectKey === "engine-behavioural-intelligence" && event.evidenceRef?.stepTitle === "Underlying Engines Architecture Flow");
  const enginesUnderstood = evidenceLedger.some((event) => event.eventType === "section_understood" && event.objectKey === "engine-behavioural-intelligence::underlyingEngines" && event.evidenceRef?.understood === true);
  const hasPlatformArchitectureBadge = architectureExplored && enginesUnderstood;
  const checkpointTimeline = [
    {
      key: "baseline",
      label: "Baseline Diagnostic",
      description: "Your starting fluency and learning gaps were recorded.",
      event: evidenceLedger.find((item) => item.eventType === "diagnostic_completed" && item.objectKey === "baseline_diagnostic"),
    },
    {
      key: "architecture",
      label: "Platform Architecture",
      description: "You explored how Diagnostics, Intelligence Core, Practice, and Evidence connect.",
      event: evidenceLedger.find((item) => item.eventType === "step_explored" && item.objectKey === "engine-behavioural-intelligence" && item.evidenceRef?.stepTitle === "Underlying Engines Architecture Flow"),
    },
    {
      key: "practice",
      label: "Simulator Practice",
      description: "A completed simulator conversation added observable application evidence.",
      event: evidenceLedger.find((item) => item.eventType === "simulator_practice_completed" && item.objectKey === "voice_simulator_practice"),
    },
  ];

  const dimensions: { key: AcademyDimension; label: string; desc: string }[] = [
    { key: "understand", label: "Understand", desc: "Why LevelNext exists, failure modes of traditional workshops, and change logic." },
    { key: "navigate", label: "Navigate", desc: "Ability to locate diagnostics, behavioural studio, voice simulator, and sponsor heatmaps." },
    { key: "apply", label: "Apply", desc: "Mapping real enterprise problems (MEP, LDI) to the right product and behavioural move." },
    { key: "explain", label: "Explain", desc: "Clear, differentiated explanation to CHROs, managers, and sponsors without feature-dumping." },
  ];

  return (
    <AcademyLayout stageBadge="Passport">
      <div className="space-y-8">
        {/* Passport Header Card */}
        <div className="bg-gradient-to-br from-[#1C1C1C] via-[#0E243F] to-[#0A1A2F] border-2 border-[#D4AF37] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded border border-[#D4AF37]/30">
                Verified Product Passport
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
                Product Fluency Credentials
              </h1>
              <p className="text-xs text-[#F8F5F0]/70">
                Role Track: <strong className="text-white capitalize">{profile.roleTrack.replace("_", " ")}</strong> • Level:{" "}
                <strong className="text-[#D4AF37] capitalize">{slugToLabel(fluencyLevel)}</strong>
              </p>
            </div>

            <div className="text-right sm:text-right bg-white/5 border border-white/10 p-4 rounded-xl shrink-0">
              <p className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">Composite Score</p>
              <p className="text-3xl font-black text-white">{compositeScore}<span className="text-sm text-white/50">/100</span></p>
            </div>
          </div>

          {/* 4 Dimension Score Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dimensions.map((dim) => {
              const scoresMap = dimensionScores as Record<string, number>;
              const score = scoresMap[dim.key] ?? 0;
              const weight = Math.round(ACADEMY_DIMENSION_WEIGHTS[dim.key] * 100);
              return (
                <div key={dim.key} className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{dim.label}</span>
                    <span className="text-[10px] text-[#D4AF37] font-semibold">{weight}% Weight</span>
                  </div>
                  <div className="text-2xl font-black text-[#D4AF37]">{score}%</div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37]" style={{ width: `${score}%` }} />
                  </div>
                  <p className="text-[11px] text-[#F8F5F0]/60 leading-tight pt-1">{dim.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`rounded-2xl border p-5 ${hasPlatformArchitectureBadge ? "border-[#D4AF37]/60 bg-[#D4AF37]/[0.08]" : "border-white/10 bg-[#1C1C1C]"}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${hasPlatformArchitectureBadge ? "bg-[#D4AF37] text-[#0A1A2F]" : "bg-white/10 text-[#D4AF37]"}`}><Award size={20} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Passport Badge</p>
                <h2 className="mt-1 text-base font-bold text-white">Platform Architecture</h2>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#F8F5F0]/65">Understand how diagnostics, Intelligence Core, practice, and evidence connect behind the LevelNext experience.</p>
              </div>
            </div>
            {hasPlatformArchitectureBadge ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300"><CheckCircle2 size={12} /> Earned</span>
            ) : (
              <Link href="/academy/map" className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:underline">Explore in Product Map <ArrowRight size={12} /></Link>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-6 space-y-5">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#D4AF37]"><Calendar size={16} /> Passport Checkpoint Timeline</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#F8F5F0]/60">A chronological record of the moments when product fluency moved from knowing to applying.</p>
          </div>
          <div className="relative space-y-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-white/10">
            {checkpointTimeline.map((checkpoint) => (
              <div key={checkpoint.key} className="relative flex items-start gap-3">
                <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${checkpoint.event ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-300" : "border-white/15 bg-[#1C1C1C] text-white/35"}`}>
                  {checkpoint.event ? <CheckCircle2 size={15} /> : <Compass size={14} />}
                </div>
                <div className="min-w-0 flex-1 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-xs font-bold ${checkpoint.event ? "text-white" : "text-white/50"}`}>{checkpoint.label}</p>
                    <span className={`text-[10px] font-semibold ${checkpoint.event ? "text-emerald-300" : "text-white/35"}`}>{checkpoint.event ? new Date(checkpoint.event.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not completed"}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#F8F5F0]/60">{checkpoint.description}</p>
                  {checkpoint.key === "practice" && checkpoint.event?.evidenceRef?.overallScore !== undefined && <p className="mt-2 text-[10px] font-semibold text-[#D4AF37]">Recorded simulator score: {String(checkpoint.event.evidenceRef.overallScore)}/100</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Readiness Gates & Gaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Active Learning Focus & Gaps */}
          <div className="bg-[#1C1C1C] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={16} /> Targeted Focus Areas
            </h3>
            {gaps.length === 0 ? (
              <p className="text-xs text-emerald-400 flex items-center gap-2 py-4">
                <CheckCircle2 size={16} /> All baseline competency gates cleared!
              </p>
            ) : (
              <div className="space-y-3">
                {gaps.map((gap, idx) => (
                  <div key={idx} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <p className="text-xs font-semibold text-white">{slugToLabel(gap)}</p>
                    <p className="text-[11px] text-[#F8F5F0]/60">
                      Strengthen this capability by rehearsing scenarios in the Voice Simulator or discussing with Product Mentor.
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2">
              <Link
                href="/academy/diagnostic"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:underline"
              >
                <span>Re-take Assessment to Update Gaps</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Evidence Ledger */}
          <div className="bg-[#1C1C1C] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} /> Observable Evidence Ledger
            </h3>
            {evidenceLedger.length === 0 ? (
              <p className="text-xs text-[#F8F5F0]/60 py-4">
                No progress events recorded yet. Complete the baseline diagnostic or explore nodes on the Product Map.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {evidenceLedger.map((event) => (
                  <div key={event.id} className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-white capitalize">{event.eventType.replace("_", " ")}</p>
                      <p className="text-[10px] text-[#D4AF37]">{event.objectKey ?? "general"}</p>
                    </div>
                    <span className="text-[10px] text-white/40">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AcademyLayout>
  );
}
