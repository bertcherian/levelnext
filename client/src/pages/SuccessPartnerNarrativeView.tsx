import { ArrowLeft, Check, CheckCircle2, Clock3, Copy, Eye, Lock, MessageSquare, ShieldCheck, Sparkles, Target, TrendingUp, UserRound } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function SuccessPartnerNarrativeView({ params }: { params: { participantUserId: string } }) {
  const [, navigate] = useLocation();
  const participantUserId = Number.parseInt(params.participantUserId, 10);
  const [focus, setFocus] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<{
    questions: string[];
    coachingFrame: string;
    generatedBy: "ai" | "safe_fallback";
  } | null>(null);
  const [copiedQuestions, setCopiedQuestions] = useState(false);
  const { data, isLoading, error } = trpc.narrativeIntelligence.getSuccessPartnerSharedView.useQuery(
    { participantUserId },
    { enabled: Number.isFinite(participantUserId), retry: false },
  );
  const generateQuestions = trpc.narrativeIntelligence.generateSuccessPartnerInquiryQuestions.useMutation({
    onSuccess: (result) => setGeneratedQuestions(result),
  });

  async function handleCopyQuestions() {
    if (!generatedQuestions) return;
    const text = [
      "Success Partner inquiry questions",
      ...generatedQuestions.questions.map((question, index) => `${index + 1}. ${question}`),
      `\nCoaching frame: ${generatedQuestions.coachingFrame}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedQuestions(true);
    window.setTimeout(() => setCopiedQuestions(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    const message = error?.data?.code === "FORBIDDEN"
      ? "This participant has not enabled the Success Partner shared view, or you are not assigned to this participant."
      : "This shared view is unavailable.";

    return (
      <div className="min-h-screen bg-[#F8F5F0] px-6 py-12">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#0A1A2F]/10">
            <Lock className="h-7 w-7 text-[#0A1A2F]/60" />
          </div>
          <h1 className="text-xl font-semibold text-[#0A1A2F]">Shared view unavailable</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
          <Button onClick={() => navigate("/admin/success-partner")} className="mt-6 bg-[#0A1A2F] text-white hover:bg-[#142c4c]">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Success Partner Workspace
          </Button>
        </div>
      </div>
    );
  }

  const commitments = data.commitments ?? [];
  const counts = data.experimentCounts;

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#1C1C1C]">
      <header className="bg-[#0A1A2F] px-6 py-5 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/success-partner")} className="text-white/70 hover:bg-white/10 hover:text-white">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Success Partner Workspace
          </Button>
          <div className="h-5 w-px bg-white/20" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]">Success Partner Shared View</p>
            <h1 className="truncate text-lg font-semibold">{data.participant.name || data.participant.email || "Participant"}</h1>
          </div>
          <Badge className="ml-auto shrink-0 border border-emerald-300/30 bg-emerald-400/15 text-emerald-200">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Consent active
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-6 py-7">
        <Card className="border-[#D4AF37]/50 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[#0A1A2F] p-2.5 text-[#D4AF37]"><Eye className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold text-[#0A1A2F]">Participant-approved coaching context</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  This is a read-only summary. It shows only the categories the participant has explicitly enabled. Raw narratives, reflection text, evidence detail, and private reset logs are never included here.
                </p>
                <p className="mt-2 text-xs text-slate-400">Consent updated {formatDate(data.consent.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {data.nextChapter && (
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
                <CardTitle className="text-base text-[#0A1A2F]">Next Chapter direction</CardTitle>
              </div>
              <CardDescription>Visible because the participant enabled Next Chapter sharing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl bg-[#0A1A2F] p-4 text-white">
                <p className="text-xs uppercase tracking-wider text-[#D4AF37]">Emerging identity</p>
                <p className="mt-1 text-lg font-semibold">{data.nextChapter.toIdentity || "Not yet defined"}</p>
              </div>
              {data.nextChapter.emergingAssumption && (
                <p className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4 text-sm italic leading-relaxed text-slate-700">
                  “{data.nextChapter.emergingAssumption}”
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[#0A1A2F]" />
              <CardTitle className="text-base text-[#0A1A2F]">Active commitments</CardTitle>
              <Badge variant="outline" className="ml-auto border-[#D4AF37] text-[#0A1A2F]">{commitments.length}</Badge>
            </div>
            <CardDescription>
              {data.consent.shareBehaviours ? "Participant-approved commitments for coaching follow-through." : "Commitment sharing is currently disabled."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.consent.shareBehaviours ? (
              commitments.length > 0 ? (
                <div className="space-y-2">
                  {commitments.map((commitment, index) => (
                    <div key={`${commitment}-${index}`} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-sm leading-relaxed text-slate-700">{commitment}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No active commitments have been recorded.</p>
              )
            ) : (
              <PrivacyPlaceholder label="The participant has kept commitment details private." />
            )}
          </CardContent>
        </Card>

        {data.consent.shareBehaviours && commitments.length > 0 && (
          <Card className="border-[#D4AF37]/50 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#D4AF37]" />
                <CardTitle className="text-base text-[#0A1A2F]">Draft inquiry questions</CardTitle>
                <Badge variant="outline" className="ml-auto border-[#D4AF37] text-[#0A1A2F]">Commitment-based</Badge>
              </div>
              <CardDescription>
                Generate open, non-leading questions using only the commitments the participant has approved for sharing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                  placeholder="Optional focus, e.g. Friday check-in or delegation"
                  className="h-9 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-[#D4AF37] placeholder:text-slate-400 focus:ring-2"
                  maxLength={240}
                />
                <Button
                  onClick={() => generateQuestions.mutate({ participantUserId, focus: focus.trim() || undefined })}
                  disabled={generateQuestions.isPending}
                  className="bg-[#0A1A2F] text-white hover:bg-[#142c4c]"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-[#D4AF37]" />
                  {generateQuestions.isPending ? "Drafting…" : "Draft questions"}
                </Button>
              </div>
              {generateQuestions.error && (
                <p className="text-sm text-rose-600">{generateQuestions.error.message}</p>
              )}
              {generatedQuestions && (
                <div className="space-y-3 rounded-xl bg-[#F8F5F0] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#0A1A2F]">Suggested questions</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-600/30 text-emerald-700">
                        {generatedQuestions.generatedBy === "ai" ? "AI drafted" : "Safe fallback"}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={handleCopyQuestions} className="h-7 px-2 text-xs text-slate-600 hover:bg-white">
                        <Copy className="mr-1.5 h-3.5 w-3.5" /> {copiedQuestions ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                  <ol className="space-y-2">
                    {generatedQuestions.questions.map((question, index) => (
                      <li key={`${question}-${index}`} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0A1A2F] text-[11px] font-semibold text-white">{index + 1}</span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">
                    <span className="font-semibold text-[#0A1A2F]">Coaching frame:</span> {generatedQuestions.coachingFrame}
                  </div>
                </div>
              )}
              <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Generated from approved commitments only; private narratives and evidence are not used.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#0A1A2F]" />
              <CardTitle className="text-base text-[#0A1A2F]">Experiment momentum</CardTitle>
              <Badge variant="outline" className="ml-auto border-[#D4AF37] text-[#0A1A2F]">
                {counts ? `${counts.completed}/${counts.total}` : "Private"}
              </Badge>
            </div>
            <CardDescription>Counts only — no experiment titles, predictions, outcomes, or reflection text are shown.</CardDescription>
          </CardHeader>
          <CardContent>
            {counts ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Total" value={counts.total} />
                <Metric label="Completed" value={counts.completed} accent />
                <Metric label="In progress" value={counts.planned} />
                <Metric label="Proof points" value={counts.evidenceCount} accent />
              </div>
            ) : (
              <PrivacyPlaceholder label="The participant has kept experiment momentum private." />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> Current stage: Week {data.progress.currentWeek}</span>
          <span>Last activity: {formatDate(data.progress.lastActivityAt)}</span>
          <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Read-only</span>
        </div>

        {data.consent.shareSupportRequest && (
          <Card className="border-[#D4AF37]/30 bg-[#D4AF37]/5 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0A1A2F]">Participant support request</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{data.consent.shareSupportRequest}</p>
            </CardContent>
          </Card>
        )}

        <p className="flex items-center justify-center gap-2 pb-4 text-center text-[11px] text-slate-400">
          <UserRound className="h-3.5 w-3.5" /> Access is assignment-scoped and audited when opened.
        </p>
      </main>
    </div>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className={`text-2xl font-bold ${accent ? "text-emerald-700" : "text-[#0A1A2F]"}`}>{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function PrivacyPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
      <Lock className="h-4 w-4 shrink-0 text-slate-400" />
      {label}
    </div>
  );
}
