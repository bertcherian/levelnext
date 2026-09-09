/**
 * LevelNext Narrative Intelligence™ — Participant Cockpit & 4-Week Experience
 *
 * Core philosophy: "Don't just tell yourself a better story. Build the evidence to become it."
 *
 * Palette:
 * - Navy Blue: #0A1A2F
 * - Rich Gold: #D4AF37
 * - Warm Ivory: #F8F5F0
 * - Charcoal: #1C1C1C
 */

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Compass,
  Sparkles,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  FileText,
  Target,
  Zap,
  Volume2,
  Users,
  RotateCcw,
  Plus,
  Share2,
  Lock,
  ChevronRight,
  Eye,
  Edit3,
  Award,
} from "lucide-react";
import {
  NARRATIVE_CATEGORIES,
  NARRATIVE_CATEGORY_LABELS,
  NARRATIVE_STATUS_METADATA,
  CURATED_ROLE_TRANSITIONS,
  NARRATIVE_PATTERN_LIBRARY,
  EVIDENCE_SOURCE_LABELS,
  type NarrativeCategory,
  type NarrativeStatus,
  type ParticipantResonance,
  type EvidenceSource,
  type NarrativePattern,
} from "@shared/modules/narrativeIntelligence";

export default function NarrativeIntelligence() {
  const utils = trpc.useUtils();
  const { user, loading: authLoading, error: authError } = useAuth();

  // Queries
  const { data: dashboard, isLoading: isDashboardLoading } = trpc.narrativeIntelligence.getDashboard.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const { data: curatedTransitions = [] } = trpc.narrativeIntelligence.getCuratedRoleTransitions.useQuery();
  const { data: patternLibrary = [] } = trpc.narrativeIntelligence.getPatternLibrary.useQuery();
  const { data: evidenceLedger = [] } = trpc.narrativeIntelligence.getEvidenceLedger.useQuery(undefined, { enabled: Boolean(user) });
  const { data: sharingGrants = [] } = trpc.narrativeIntelligence.getSharingGrants.useQuery(undefined, { enabled: Boolean(user) });
  const { data: privacyActivity = [] } = trpc.narrativeIntelligence.getPrivacyActivity.useQuery(undefined, { enabled: Boolean(user) });

  // Mutations
  const generateHypothesesMutation = trpc.narrativeIntelligence.generateHypotheses.useMutation({
    onSuccess: () => {
      toast.success("New narrative hypotheses generated from your developmental profile.");
      utils.narrativeIntelligence.getDashboard.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate hypotheses.");
    },
  });

  const respondToHypothesisMutation = trpc.narrativeIntelligence.respondToHypothesis.useMutation({
    onSuccess: () => {
      toast.success("Resonance recorded.");
      utils.narrativeIntelligence.getDashboard.invalidate();
    },
  });

  const updateStatusMutation = trpc.narrativeIntelligence.updateNarrativeStatus.useMutation({
    onSuccess: () => {
      toast.success("Narrative status updated.");
      utils.narrativeIntelligence.getDashboard.invalidate();
    },
  });

  const saveQuestionMutation = trpc.narrativeIntelligence.saveQuestionAnalysis.useMutation({
    onSuccess: () => {
      toast.success("Question analysis saved.");
      utils.narrativeIntelligence.getDashboard.invalidate();
    },
  });

  const chooseNextChapterMutation = trpc.narrativeIntelligence.chooseNextChapter.useMutation({
    onSuccess: () => {
      toast.success("Next Chapter operating assumptions saved.");
      utils.narrativeIntelligence.getDashboard.invalidate();
    },
  });

  const createExperimentMutation = trpc.narrativeIntelligence.createExperiment.useMutation({
    onSuccess: () => {
      toast.success("Behavioral experiment scheduled.");
      setIsCreateExperimentOpen(false);
      utils.narrativeIntelligence.getDashboard.invalidate();
    },
  });

  const recordOutcomeMutation = trpc.narrativeIntelligence.recordExperimentOutcome.useMutation({
    onSuccess: () => {
      toast.success("Outcome logged! Evidence recorded into your Ledger.");
      setIsRecordOutcomeOpen(false);
      utils.narrativeIntelligence.getDashboard.invalidate();
      utils.narrativeIntelligence.getEvidenceLedger.invalidate();
    },
  });

  const logEvidenceMutation = trpc.narrativeIntelligence.logEvidence.useMutation({
    onSuccess: () => {
      toast.success("Real-world evidence logged into your Ledger.");
      setIsLogEvidenceOpen(false);
      utils.narrativeIntelligence.getDashboard.invalidate();
      utils.narrativeIntelligence.getEvidenceLedger.invalidate();
    },
  });

  const resetMutation = trpc.narrativeIntelligence.runNarrativeReset.useMutation({
    onSuccess: () => {
      toast.success("90-Second Reset complete. Clarity achieved.");
      setIsResetOpen(false);
      utils.narrativeIntelligence.getDashboard.invalidate();
      utils.narrativeIntelligence.getEvidenceLedger.invalidate();
    },
  });

  const saveSharingMutation = trpc.narrativeIntelligence.saveSharingGrant.useMutation({
    onSuccess: () => {
      toast.success("Sharing preferences updated.");
      setIsSharingOpen(false);
      utils.narrativeIntelligence.getSharingGrants.invalidate();
      utils.narrativeIntelligence.getPrivacyActivity.invalidate();
    },
  });

  // UI State
  const [activeTab, setActiveTab] = useState<string>("week1");
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isSharingOpen, setIsSharingOpen] = useState(false);
  const [isCreateExperimentOpen, setIsCreateExperimentOpen] = useState(false);
  const [isRecordOutcomeOpen, setIsRecordOutcomeOpen] = useState(false);
  const [isLogEvidenceOpen, setIsLogEvidenceOpen] = useState(false);
  const [selectedNarrativeId, setSelectedNarrativeId] = useState<number | null>(null);
  const [selectedExperimentId, setSelectedExperimentId] = useState<number | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<NarrativePattern | null>(null);
  const [isPatternDialogOpen, setIsPatternDialogOpen] = useState(false);
  const [isPatternReflectionOpen, setIsPatternReflectionOpen] = useState(false);
  const [patternReflectionNote, setPatternReflectionNote] = useState("");

  // Week 2 Question Form State
  const [factText, setFactText] = useState("");
  const [storyText, setStoryText] = useState("");
  const [predictionText, setPredictionText] = useState("");
  const [evidenceAgainstText, setEvidenceAgainstText] = useState("");
  const [exceptionHuntText, setExceptionHuntText] = useState("");
  const [narrativeTaxCost, setNarrativeTaxCost] = useState("");

  // Week 3 Next Chapter Form State
  const [selectedTransitionId, setSelectedTransitionId] = useState("mep_expert_to_enabler");
  const [customToIdentity, setCustomToIdentity] = useState("");
  const [customEmergingAssumption, setCustomEmergingAssumption] = useState("");
  const [commitmentsList, setCommitmentsList] = useState<string[]>([]);
  const [newCommitmentInput, setNewCommitmentInput] = useState("");

  // Week 4 Experiment Form State
  const [expTitle, setExpTitle] = useState("");
  const [expContext, setExpContext] = useState("");
  const [expOldAssumption, setExpOldAssumption] = useState("");
  const [expAlternative, setExpAlternative] = useState("");
  const [expBehaviour, setExpBehaviour] = useState("");
  const [expPredictedOutcome, setExpPredictedOutcome] = useState("");
  const [expProbability, setExpProbability] = useState<number>(75);
  const [expType, setExpType] = useState<"real_world" | "simulator" | "practice">("real_world");

  // Outcome Logging Form State
  const [outcomeActual, setOutcomeActual] = useState("");
  const [outcomeLearning, setOutcomeLearning] = useState("");
  const [outcomeImpact, setOutcomeImpact] = useState<"strongly_challenged" | "partly_challenged" | "confirmed_old" | "inconclusive">("strongly_challenged");
  const [convictionOld, setConvictionOld] = useState<number>(45);
  const [convictionEmerging, setConvictionEmerging] = useState<number>(70);

  // 90s Reset Form State
  const [resetTrigger, setResetTrigger] = useState("");
  const [resetStory, setResetStory] = useState("");
  const [resetFacts, setResetFacts] = useState("");
  const [resetAlt, setResetAlt] = useState("");
  const [resetAssumption, setResetAssumption] = useState("");
  const [resetAction, setResetAction] = useState("");
  const [resetSaveToEvidence, setResetSaveToEvidence] = useState(true);

  // Direct Evidence Logging Form State
  const [evidenceSituation, setEvidenceSituation] = useState("");
  const [evidenceTrigger, setEvidenceTrigger] = useState("");
  const [evidenceAction, setEvidenceAction] = useState("");
  const [evidenceOutcome, setEvidenceOutcome] = useState("");
  const [evidenceLearning, setEvidenceLearning] = useState("");
  const [evidenceSource, setEvidenceSource] = useState<EvidenceSource>("real_world_outcome");

  // Sharing Form State
  const [shareNextChapter, setShareNextChapter] = useState(true);
  const [shareBehaviours, setShareBehaviours] = useState(true);
  const [shareExperimentCount, setShareExperimentCount] = useState(true);
  const [shareEvidenceSummary, setShareEvidenceSummary] = useState(true);
  const [shareSupportRequest, setShareSupportRequest] = useState("");

  const profile = dashboard?.profile;
  const currentTransition = dashboard?.currentRoleTransition;
  const activeNarratives = dashboard?.activeNarratives ?? [];
  const stats = dashboard?.stats;
  const nextExperiment = dashboard?.nextExperiment;

  // Initialize Week 3 transition form if profile exists
  React.useEffect(() => {
    if (profile?.currentRoleTransition) {
      setSelectedTransitionId(profile.currentRoleTransition);
      setCustomToIdentity(profile.toIdentity || "");
      setCustomEmergingAssumption(profile.emergingAssumption || "");
      if (Array.isArray(profile.commitments)) {
        setCommitmentsList(profile.commitments);
      }
    } else if (currentTransition) {
      setSelectedTransitionId(currentTransition.id);
      setCustomToIdentity(currentTransition.toIdentity);
      setCustomEmergingAssumption(currentTransition.generativeAssumption);
      setCommitmentsList(currentTransition.concreteBehaviours);
    }
  }, [profile, currentTransition]);

  // Set active narrative for Week 2 Question
  const selectedNarrative = activeNarratives.find((n) => n.id === selectedNarrativeId) || activeNarratives[0];

  React.useEffect(() => {
    if (selectedNarrative) {
      setSelectedNarrativeId(selectedNarrative.id);
      setFactText(selectedNarrative.factDescription || "");
      setStoryText(selectedNarrative.storyInterpretation || selectedNarrative.statement || "");
      setPredictionText(selectedNarrative.predictionMade || "");
      setExceptionHuntText(selectedNarrative.exceptionHunt || "");
      setNarrativeTaxCost(selectedNarrative.currentCost || "");
      if (Array.isArray(selectedNarrative.evidenceAgainst)) {
        setEvidenceAgainstText(selectedNarrative.evidenceAgainst.join("\n"));
      }
    }
  }, [selectedNarrative?.id]);

  const explorePattern = (pattern: NarrativePattern) => {
    setSelectedPattern(pattern);
    setPatternReflectionNote(`Exploring ${pattern.archetypeTitle}: ${pattern.safeExplorationPrompt}`);
    setIsPatternDialogOpen(false);
    setIsPatternReflectionOpen(true);
  };

  if (authLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen bg-[#0A1A2F] text-[#F8F5F0] flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 font-medium">Loading Narrative Intelligence Cockpit...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A1A2F] text-[#F8F5F0] flex items-center justify-center px-6">
        <Card className="max-w-md bg-slate-900/90 border-slate-800 text-white shadow-2xl">
          <CardHeader>
            <div className="inline-flex items-center gap-2 text-[#D4AF37] text-xs uppercase tracking-wider font-semibold mb-2">
              <Lock className="w-3.5 h-3.5" />
              Participant-owned workspace
            </div>
            <CardTitle className="text-2xl text-white">Sign in to enter your Narrative Intelligence cockpit</CardTitle>
            <CardDescription className="text-slate-400">
              Your reflections, experiments, and evidence ledger are private by default and available only inside your authenticated LevelNext workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && <p className="text-xs text-amber-300">Your session is not active yet. Sign in to continue.</p>}
            <Button
              onClick={() => { window.location.href = getLoginUrl(); }}
              className="w-full bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold"
            >
              Sign in to LevelNext <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 justify-center">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Private by default · You control sharing
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1A2F] text-[#F8F5F0]">
      {/* ── Top Header Bar ── */}
      <header className="border-b border-slate-800 bg-[#0A1A2F]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <img src="/logo.png" alt="LevelNext" className="h-8 w-auto object-contain" />
            <div className="h-5 w-px bg-slate-700" />
            <div>
              <span className="font-semibold tracking-tight text-white flex items-center gap-1.5 text-base">
                Narrative Intelligence<span className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider">™</span>
              </span>
              <span className="text-xs text-slate-400 block sm:inline sm:ml-2">
                Shared Development Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetOpen(true)}
              className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center gap-1.5 text-xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              90-Sec Reset
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSharingOpen(true)}
              className="text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 text-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              Sharing & Privacy
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero & Operating Profile Header ── */}
      <div className="bg-gradient-to-b from-[#0A1A2F] via-[#0D213B] to-[#0A1A2F] border-b border-slate-800 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <Lock className="w-3 h-3 text-[#D4AF37]" />
                <span>Participant-Owned</span>
                <span className="text-slate-500">•</span>
                <span className="text-[#D4AF37]">Private by Default</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Operating Profile & Next Chapter
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl italic font-serif">
                &ldquo;Don&apos;t just tell yourself a better story. Build the evidence to become it.&rdquo;
              </p>
            </div>

            {/* Role Transition Highlight Pill */}
            {currentTransition && (
              <div className="bg-slate-900/90 border border-[#D4AF37]/30 rounded-xl p-4 md:max-w-md shadow-lg">
                <div className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold flex items-center gap-1.5 mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  Active Transition
                </div>
                <div className="text-base font-semibold text-white flex items-center gap-2">
                  <span className="text-slate-300">{currentTransition.fromIdentity}</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                  <span className="text-[#D4AF37]">{currentTransition.toIdentity}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {currentTransition.generativeAssumption}
                </p>
              </div>
            )}
          </div>

          {/* ── Key Metrics & Conviction Radar Strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
            <Card className="bg-slate-900/60 border-slate-800 text-white">
              <CardContent className="p-4">
                <div className="text-xs text-slate-400">Operating Assumptions</div>
                <div className="text-2xl font-bold text-white mt-1">{stats?.activeNarrativeCount ?? 0}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Active under inquiry</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 text-white">
              <CardContent className="p-4">
                <div className="text-xs text-slate-400">Behavioral Experiments</div>
                <div className="text-2xl font-bold text-[#D4AF37] mt-1">
                  {stats?.completedExperimentsCount ?? 0} <span className="text-xs text-slate-500 font-normal">/ {stats?.experimentCount ?? 0}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Tested against reality</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 text-white">
              <CardContent className="p-4">
                <div className="text-xs text-slate-400">Evidence Ledger</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{stats?.evidenceCount ?? 0}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Objective proof points</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 text-white">
              <CardContent className="p-4">
                <div className="text-xs text-slate-400">Conviction Shift</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-xs text-rose-400 flex items-center font-semibold">
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                    {stats?.oldConviction}%
                  </div>
                  <span className="text-slate-600">vs</span>
                  <div className="text-xs text-emerald-400 flex items-center font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    {stats?.emergingConviction}%
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Limiting vs Emerging</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── 4-Week Experience Main Work Area ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Experience Stepper Navigation */}
          <div className="bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
            <TabsList className="grid grid-cols-5 w-full bg-transparent gap-1 min-w-[620px]">
              <TabsTrigger
                value="week1"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A1A2F] text-xs font-semibold py-2.5 rounded-lg transition-all"
              >
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider opacity-80">Week 1</div>
                  <div>1. Notice</div>
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="week2"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A1A2F] text-xs font-semibold py-2.5 rounded-lg transition-all"
              >
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider opacity-80">Week 2</div>
                  <div>2. Question</div>
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="week3"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A1A2F] text-xs font-semibold py-2.5 rounded-lg transition-all"
              >
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider opacity-80">Week 3</div>
                  <div>3. Choose</div>
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="week4"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A1A2F] text-xs font-semibold py-2.5 rounded-lg transition-all"
              >
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider opacity-80">Week 4</div>
                  <div>4. Test</div>
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="week5"
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#0A1A2F] text-xs font-semibold py-2.5 rounded-lg transition-all"
              >
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider opacity-80">Ongoing</div>
                  <div>5. Prove (Ledger)</div>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              WEEK 1: NOTICE
             ══════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="week1" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                  Notice: Operating Assumption Discovery
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                  These statements represent tentative hypotheses derived from your diagnostic results and leadership stage.
                  They are not labels or clinical facts—you choose which ones resonate, which to edit, and which to reject.
                </p>
              </div>

              <Button
                onClick={() => generateHypothesesMutation.mutate({ sourceModule: "mep" })}
                disabled={generateHypothesesMutation.isPending}
                className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold text-xs whitespace-nowrap shadow-md"
              >
                {generateHypothesesMutation.isPending ? "Analyzing Profile..." : "Refresh Hypotheses"}
              </Button>
            </div>

            {/* Hypotheses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeNarratives.map((narrative) => {
                const catMeta = NARRATIVE_CATEGORY_LABELS[narrative.category as NarrativeCategory] || {
                  title: narrative.category,
                  prompt: "",
                };
                const statusMeta = NARRATIVE_STATUS_METADATA[narrative.status as NarrativeStatus];

                return (
                  <Card key={narrative.id} className="bg-slate-900/80 border-slate-800 text-white flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px] uppercase font-mono">
                          {catMeta.title}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] font-semibold ${statusMeta?.badgeVariant}`}>
                          {statusMeta?.label || narrative.status}
                        </Badge>
                      </div>

                      <CardTitle className="text-base font-semibold text-white leading-snug">
                        &ldquo;{narrative.statement}&rdquo;
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3.5 pt-0 text-xs">
                      {/* Historical strength vs Narrative Tax */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium block">
                            Historical Strength
                          </span>
                          <span className="text-slate-300 text-[11px] leading-tight block mt-0.5">
                            {narrative.historicalStrength || "Enabled early technical mastery."}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-amber-400 font-medium block">
                            Narrative Tax (Cost)
                          </span>
                          <span className="text-slate-300 text-[11px] leading-tight block mt-0.5">
                            {narrative.currentCost || "High personal overload."}
                          </span>
                        </div>
                      </div>

                      {/* Emerging generative assumption */}
                      {narrative.emergingAssumption && (
                        <div className="text-[11px] bg-[#0A1A2F] p-2.5 rounded-lg border border-indigo-950">
                          <span className="text-[#D4AF37] font-semibold block text-[10px] uppercase tracking-wider">
                            Emerging Generative Assumption
                          </span>
                          <span className="text-slate-200 mt-0.5 block italic">
                            &ldquo;{narrative.emergingAssumption}&rdquo;
                          </span>
                        </div>
                      )}

                      {/* Participant Reflection Note if present */}
                      {narrative.participantReflection && (
                        <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800 italic">
                          Reflection: {narrative.participantReflection}
                        </div>
                      )}

                      {/* Resonance Choices */}
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                          How does this land for you right now?
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            variant={narrative.participantResonance === "strongly_resonates" ? "default" : "outline"}
                            onClick={() =>
                              respondToHypothesisMutation.mutate({
                                narrativeId: narrative.id,
                                resonance: "strongly_resonates",
                              })
                            }
                            className={`text-[11px] h-7 px-2.5 ${
                              narrative.participantResonance === "strongly_resonates"
                                ? "bg-[#D4AF37] text-[#0A1A2F] font-bold"
                                : "border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            Strongly Resonates
                          </Button>

                          <Button
                            size="sm"
                            variant={narrative.participantResonance === "partly_resonates" ? "default" : "outline"}
                            onClick={() =>
                              respondToHypothesisMutation.mutate({
                                narrativeId: narrative.id,
                                resonance: "partly_resonates",
                              })
                            }
                            className={`text-[11px] h-7 px-2.5 ${
                              narrative.participantResonance === "partly_resonates"
                                ? "bg-sky-500 text-white font-semibold"
                                : "border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            Partly Resonates
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedNarrativeId(narrative.id);
                              setActiveTab("week2");
                            }}
                            className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-[11px] h-7 px-2.5 ml-auto"
                          >
                            Question in Week 2 →
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pattern Library Non-Diagnostic Reference Shelf */}
            <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#D4AF37]" />
                    Developmental Pattern Library (Non-Diagnostic Reference)
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Recognising common career transition dynamics without putting people in boxes.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {patternLibrary.map((pattern) => (
                  <div key={pattern.id} className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
                    <div className="text-base font-semibold text-white">{pattern.archetypeTitle}</div>
                    <div className="text-sm text-[#D4AF37] italic font-serif">{pattern.characteristicVoice}</div>
                    <div className="text-base text-slate-200 leading-relaxed line-clamp-4 mt-1">{pattern.safeExplorationPrompt}</div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPattern(pattern);
                          setIsPatternDialogOpen(true);
                        }}
                        className="h-8 px-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Read full pattern
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => explorePattern(pattern)}
                        className="h-8 px-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
                      >
                        Explore <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════════
              WEEK 2: QUESTION
             ══════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="week2" className="space-y-6">
            <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-1">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#D4AF37]" />
                  Question: The Fact / Story / Prediction Analysis
                </h2>
              <p className="text-base leading-relaxed text-slate-300 max-w-2xl">
                Take an active operating assumption and unpack it. High-performing leaders often treat interpretations and catastrophic predictions as indisputable facts.
              </p>
            </div>

            {/* Narrative Selector */}
            {activeNarratives.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Select Narrative:</span>
                {activeNarratives.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNarrativeId(n.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedNarrativeId === n.id
                        ? "bg-[#D4AF37] text-[#0A1A2F] font-semibold"
                        : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {n.statement.length > 36 ? n.statement.substring(0, 36) + "..." : n.statement}
                  </button>
                ))}
              </div>
            )}

            {/* 3-Column Dissection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: Facts */}
              <Card className="bg-slate-900/80 border-slate-800 text-white">
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="border-sky-500/40 text-sky-400 w-fit text-[10px] uppercase font-mono">
                    1. Objective Facts
                  </Badge>
                  <CardTitle className="text-sm font-semibold text-white">What actually happened?</CardTitle>
                  <CardDescription className="text-base leading-relaxed text-slate-300">
                    Observable timestamps, verbatim words, or indisputable data points.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={factText}
                    onChange={(e) => setFactText(e.target.value)}
                    placeholder="e.g. A direct report submitted a deliverable with 2 calculation errors."
                    className="bg-slate-950 border-slate-800 text-base leading-relaxed text-white min-h-[140px]"
                  />
                </CardContent>
              </Card>

              {/* Column 2: Story */}
              <Card className="bg-slate-900/80 border-slate-800 text-white">
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="border-amber-500/40 text-amber-400 w-fit text-[10px] uppercase font-mono">
                    2. The Internal Story
                  </Badge>
                  <CardTitle className="text-sm font-semibold text-white">What meaning did you make?</CardTitle>
                  <CardDescription className="text-base leading-relaxed text-slate-300">
                    Your automatic interpretation or belief about what this says about you or them.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="e.g. If I don't review every line myself, standards will drop and credibility will be lost."
                    className="bg-slate-950 border-slate-800 text-base leading-relaxed text-white min-h-[140px]"
                  />
                </CardContent>
              </Card>

              {/* Column 3: Prediction */}
              <Card className="bg-slate-900/80 border-slate-800 text-white">
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="border-rose-500/40 text-rose-400 w-fit text-[10px] uppercase font-mono">
                    3. The Prediction
                  </Badge>
                  <CardTitle className="text-sm font-semibold text-white">What catastrophe are you avoiding?</CardTitle>
                  <CardDescription className="text-base leading-relaxed text-slate-300">
                    The unspoken future risk driving your protective impulse.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={predictionText}
                    onChange={(e) => setPredictionText(e.target.value)}
                    placeholder="e.g. Senior leadership will conclude I run a careless, sloppy operation."
                    className="bg-slate-950 border-slate-800 text-base leading-relaxed text-white min-h-[140px]"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Exception Hunt & Narrative Tax */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900/80 border-slate-800 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    The Exception Hunt
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed text-slate-300">
                    When did this assumption NOT hold true in your actual career?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={exceptionHuntText}
                    onChange={(e) => setExceptionHuntText(e.target.value)}
                    placeholder="e.g. In Sprint 4, Sarah handled the client presentation autonomously and received client praise without my intervention."
                    className="bg-slate-950 border-slate-800 text-base leading-relaxed text-white min-h-[90px]"
                  />
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-slate-800 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-amber-400" />
                    Narrative Tax (Current Cost)
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed text-slate-300">
                    What is this assumption currently costing you in energy, delegation, or speed?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={narrativeTaxCost}
                    onChange={(e) => setNarrativeTaxCost(e.target.value)}
                    placeholder="e.g. 60-hour work weeks, team members waiting for approvals, and zero time for strategic planning."
                    className="bg-slate-950 border-slate-800 text-base leading-relaxed text-white min-h-[90px]"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                onClick={() => {
                  if (!selectedNarrativeId) return;
                  saveQuestionMutation.mutate({
                    narrativeId: selectedNarrativeId,
                    factDescription: factText || "Noted factual context",
                    storyInterpretation: storyText || "Interpreted assumption",
                    predictionMade: predictionText || "Predicted risk",
                    exceptionHunt: exceptionHuntText,
                    narrativeTaxCurrent: narrativeTaxCost,
                  });
                }}
                disabled={saveQuestionMutation.isPending || !selectedNarrativeId}
                className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold text-xs px-5"
              >
                {saveQuestionMutation.isPending ? "Saving Analysis..." : "Save Question Analysis"}
              </Button>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════════
              WEEK 3: CHOOSE
             ══════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="week3" className="space-y-6">
            <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-1">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#D4AF37]" />
                Choose: Next Chapter Role Transition
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Define your emerging operating identity. Transitioning from solving problems yourself to building capability in others requires deliberate identity work.
              </p>
            </div>

            {/* Curated Transitions Shelf */}
            <div className="space-y-3">
              <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Select Your Primary Role Transition Focus:
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {curatedTransitions.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTransitionId(t.id);
                      setCustomToIdentity(t.toIdentity);
                      setCustomEmergingAssumption(t.generativeAssumption);
                      setCommitmentsList(t.concreteBehaviours);
                    }}
                    className={`p-4 rounded-xl cursor-pointer border transition-all text-left ${
                      selectedTransitionId === t.id
                        ? "bg-[#0D213B] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10"
                        : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold text-[#D4AF37] mb-1">{t.title}</div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <span>{t.fromIdentity}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[#D4AF37]">{t.toIdentity}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {t.generativeAssumption}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emerging Identity Builder */}
            <Card className="bg-slate-900/80 border-slate-800 text-white">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Your Emerging Next Chapter Statement</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Craft the identity and generative assumption that will guide your next level of leadership.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Target Identity Anchor</Label>
                    <Input
                      value={customToIdentity}
                      onChange={(e) => setCustomToIdentity(e.target.value)}
                      placeholder="e.g. The Capability Multiplier"
                      className="bg-slate-950 border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Generative Operating Assumption</Label>
                    <Input
                      value={customEmergingAssumption}
                      onChange={(e) => setCustomEmergingAssumption(e.target.value)}
                      placeholder="e.g. My value comes from creating capability and problem-solving capacity in my team."
                      className="bg-slate-950 border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Behavioral Commitments List */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs text-slate-300 font-medium">Concrete Behavioral Commitments</Label>
                  <div className="space-y-1.5">
                    {commitmentsList.map((comm, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-slate-200 flex-1">{comm}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCommitmentsList(commitmentsList.filter((_, i) => i !== idx))}
                          className="h-6 w-6 p-0 text-slate-500 hover:text-rose-400"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add Commitment Input */}
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newCommitmentInput}
                      onChange={(e) => setNewCommitmentInput(e.target.value)}
                      placeholder="Add a new behavioral commitment e.g. Coach through 3 questions before offering answers."
                      className="bg-slate-950 border-slate-800 text-xs text-white flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newCommitmentInput.trim()) {
                          setCommitmentsList([...commitmentsList, newCommitmentInput.trim()]);
                          setNewCommitmentInput("");
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newCommitmentInput.trim()) {
                          setCommitmentsList([...commitmentsList, newCommitmentInput.trim()]);
                          setNewCommitmentInput("");
                        }
                      }}
                      className="bg-slate-800 text-white hover:bg-slate-700 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-800 flex justify-end">
                <Button
                  onClick={() => {
                    const trans = curatedTransitions.find((t) => t.id === selectedTransitionId) || curatedTransitions[0];
                    chooseNextChapterMutation.mutate({
                      transitionId: selectedTransitionId,
                      fromIdentity: trans?.fromIdentity || "Problem Solver",
                      toIdentity: customToIdentity || trans?.toIdentity || "Coach & Multiplier",
                      emergingAssumption: customEmergingAssumption || trans?.generativeAssumption || "Value through capability",
                      commitments: commitmentsList.length > 0 ? commitmentsList : ["Ask before telling in architecture syncs."],
                    });
                  }}
                  disabled={chooseNextChapterMutation.isPending}
                  className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold text-xs px-5"
                >
                  {chooseNextChapterMutation.isPending ? "Saving..." : "Save Next Chapter"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════════
              WEEK 4: TEST
             ══════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="week4" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#D4AF37]" />
                  Test: Behavioral Experiment Engine
                </h2>
                <p className="text-base leading-relaxed text-slate-300 max-w-2xl">
                  Run safe, bounded experiments. Test your predicted catastrophe against actual reality in real-world meetings, AI simulations, or practice coach sessions.
                </p>
              </div>

              <Button
                onClick={() => setIsCreateExperimentOpen(true)}
                className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Design Experiment
              </Button>
            </div>

            {/* Active & Scheduled Experiments */}
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Experiments:</div>
              {dashboard?.experiments && dashboard.experiments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboard.experiments.map((exp) => (
                    <Card key={exp.id} className="bg-slate-900/80 border-slate-800 text-white flex flex-col justify-between">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-mono ${
                              exp.status === "completed"
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                            }`}
                          >
                            {exp.status}
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            Pre-action Risk: <strong className="text-white">{exp.predictedProbability}%</strong>
                          </span>
                        </div>
                        <CardTitle className="text-sm font-semibold text-white">{exp.title}</CardTitle>
                        <CardDescription className="text-base leading-relaxed text-slate-300 line-clamp-2">{exp.contextSituation}</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-2 text-base pt-0">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                          <div className="text-[10px] text-amber-400 uppercase font-medium">Behaviour to Test:</div>
                          <div className="text-base leading-relaxed text-slate-200">{exp.behaviourToTest}</div>
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                          <div className="text-[10px] text-rose-400 uppercase font-medium">Predicted Catastrophe:</div>
                          <div className="text-base leading-relaxed text-slate-300 italic">&ldquo;{exp.predictedOutcome}&rdquo;</div>
                        </div>

                        {exp.status === "completed" ? (
                          <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/50 space-y-1 mt-2">
                            <div className="text-[10px] text-emerald-400 uppercase font-medium">What Reality Taught:</div>
                            <div className="text-base leading-relaxed text-slate-200">{exp.whatRealityTaught}</div>
                          </div>
                        ) : (
                          <div className="pt-2 flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedExperimentId(exp.id);
                                setIsRecordOutcomeOpen(true);
                              }}
                              className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] text-xs font-semibold h-7"
                            >
                              Log Actual Outcome →
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center space-y-3">
                  <Zap className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-slate-300 text-base leading-relaxed max-w-sm mx-auto">
                    No experiments designed yet. Pick an operating assumption and test your prediction in an upcoming meeting or 1-on-1.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsCreateExperimentOpen(true)}
                    className="bg-[#D4AF37] text-[#0A1A2F] text-xs font-semibold"
                  >
                    Create First Experiment
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════════
              WEEKS 5+: PROVE (LEDGER & FLYWHEEL)
             ══════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="week5" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#D4AF37]" />
                  Prove: The Evidence Ledger
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                  Confidence follows proof. As you log behavioral evidence from real meetings, simulators, and resets, your identity anchors shift permanently.
                </p>
              </div>

              <Button
                onClick={() => setIsLogEvidenceOpen(true)}
                className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Log Real-World Evidence
              </Button>
            </div>

            {/* Evidence Stream */}
            <div className="space-y-3">
              {evidenceLedger.length > 0 ? (
                evidenceLedger.map((item) => {
                  const sourceMeta = EVIDENCE_SOURCE_LABELS[item.sourceType as EvidenceSource] || {
                    label: item.sourceType,
                    description: "",
                  };

                  return (
                    <div key={item.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-indigo-500/40 text-indigo-300 text-[10px] uppercase font-mono">
                            {sourceMeta.label}
                          </Badge>
                          {item.trigger && <span className="text-slate-400 text-xs">• {item.trigger}</span>}
                        </div>
                        <span className="text-slate-500 text-[11px] font-mono">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-medium block">Action Taken</span>
                          <span className="text-slate-200 mt-0.5 block">{item.actionTaken}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-400 uppercase font-medium block">Observed Outcome</span>
                          <span className="text-slate-200 mt-0.5 block">{item.outcome}</span>
                        </div>
                      </div>

                      {item.learning && (
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300">
                          <span className="text-[#D4AF37] text-[10px] uppercase font-semibold block">What This Proved</span>
                          {item.learning}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center space-y-3">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-xs max-w-sm mx-auto">
                    Your evidence ledger is empty. Complete a 90-Second Reset, run an experiment, or log a real-world leadership moment to build your proof stream.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsLogEvidenceOpen(true)}
                    className="bg-[#D4AF37] text-[#0A1A2F] text-xs font-semibold"
                  >
                    Log First Proof Point
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          FULL PATTERN READING DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isPatternDialogOpen} onOpenChange={setIsPatternDialogOpen}>
        <DialogContent className="bg-[#0A1A2F] text-white border-slate-800 max-w-xl">
          {selectedPattern && (
            <>
              <DialogHeader>
                <div className="inline-flex items-center gap-2 text-[#D4AF37] text-xs uppercase tracking-wider font-semibold mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  Non-diagnostic developmental reference
                </div>
                <DialogTitle className="text-2xl font-bold text-white">{selectedPattern.archetypeTitle}</DialogTitle>
                <DialogDescription className="text-base leading-relaxed text-[#D4AF37] italic font-serif">
                  {selectedPattern.characteristicVoice}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2 sm:grid-cols-2 text-base">
                <div className="rounded-lg border border-rose-900/50 bg-rose-950/20 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-rose-300">Underlying fear</div>
                  <p className="mt-2 leading-relaxed text-slate-200">{selectedPattern.underlyingFear}</p>
                </div>
                <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Strengths to retain</div>
                  <p className="mt-2 leading-relaxed text-slate-200">{selectedPattern.strengthsToRetain}</p>
                </div>
                <div className="rounded-lg border border-indigo-900/50 bg-indigo-950/20 p-4 sm:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Growth edge</div>
                  <p className="mt-2 leading-relaxed text-slate-200">{selectedPattern.growthEdge}</p>
                </div>
                <div className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4 sm:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">Safe exploration prompt</div>
                  <p className="mt-2 leading-relaxed text-slate-100">{selectedPattern.safeExplorationPrompt}</p>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsPatternDialogOpen(false)} className="text-slate-400 hover:text-white text-sm">
                  Close
                </Button>
                <Button size="sm" onClick={() => explorePattern(selectedPattern)} className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold text-sm">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Explore this pattern
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          PATTERN EXPLORATION NOTE DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isPatternReflectionOpen} onOpenChange={setIsPatternReflectionOpen}>
        <DialogContent className="bg-[#0A1A2F] text-white border-slate-800 max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Explore {selectedPattern?.archetypeTitle}</DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-slate-300">
              Start a tentative Week 1 reflection. This is a private note attached to your selected hypothesis—not a diagnostic label.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Selected hypothesis</div>
              <p className="mt-2 text-base leading-relaxed text-slate-200">{selectedNarrative ? `“${selectedNarrative.statement}”` : "Select or generate a hypothesis in Week 1 first."}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold text-[#D4AF37]">Your exploratory reflection note</Label>
              <Textarea
                value={patternReflectionNote}
                onChange={(e) => setPatternReflectionNote(e.target.value)}
                className="min-h-[150px] bg-slate-950 border-slate-800 text-base leading-relaxed text-white"
                placeholder="What, if anything, does this pattern help you notice about your current operating assumptions?"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsPatternReflectionOpen(false)} className="text-slate-400 hover:text-white text-sm">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!selectedNarrativeId || patternReflectionNote.trim().length < 5 || respondToHypothesisMutation.isPending}
              onClick={() => {
                if (!selectedNarrativeId) return;
                respondToHypothesisMutation.mutate(
                  { narrativeId: selectedNarrativeId, resonance: "explore", reflectionNote: patternReflectionNote },
                  { onSuccess: () => setIsPatternReflectionOpen(false) },
                );
              }}
              className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold text-sm"
            >
              {respondToHypothesisMutation.isPending ? "Saving note…" : "Save private reflection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          90-SECOND NARRATIVE RESET DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="bg-[#0A1A2F] text-white border-slate-800 max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-[11px] font-semibold w-fit mb-1">
              <RotateCcw className="w-3.5 h-3.5" />
              90-Second Narrative Reset
            </div>
            <DialogTitle className="text-lg font-bold text-white">Notice → Separate → Test → Choose → Act</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              When triggered by a high-stakes moment, take 90 seconds to create narrative distance before you react.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-slate-300 font-semibold">1. NOTICE: What just happened and what story is running in your head?</Label>
              <Input
                value={resetStory}
                onChange={(e) => setResetStory(e.target.value)}
                placeholder="e.g. My boss questioned the delivery timeline. Story: She thinks I'm falling behind."
                className="bg-slate-950 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-slate-300 font-semibold">2. SEPARATE: What are the plain, indisputable facts?</Label>
              <Input
                value={resetFacts}
                onChange={(e) => setResetFacts(e.target.value)}
                placeholder="e.g. She asked for an updated milestone date for the executive committee."
                className="bg-slate-950 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-slate-300 font-semibold">3. QUESTION: What else could be true? (Equally plausible alternative)</Label>
              <Input
                value={resetAlt}
                onChange={(e) => setResetAlt(e.target.value)}
                placeholder="e.g. She needs the date to protect resources for our team."
                className="bg-slate-950 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[#D4AF37] font-semibold">4. CHOOSE: What operating assumption serves you best right now?</Label>
              <Input
                value={resetAssumption}
                onChange={(e) => setResetAssumption(e.target.value)}
                placeholder="e.g. Clear dates create partnership, not judgment."
                className="bg-slate-950 border-[#D4AF37]/50 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-emerald-400 font-semibold">5. ACT: What single 10-minute action will you take right now?</Label>
              <Input
                value={resetAction}
                onChange={(e) => setResetAction(e.target.value)}
                placeholder="e.g. Send 2 bullet points with realistic delivery milestones and 1 dependency."
                className="bg-slate-950 border-emerald-500/50 text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch id="reset-evidence-toggle" checked={resetSaveToEvidence} onCheckedChange={setResetSaveToEvidence} />
              <Label htmlFor="reset-evidence-toggle" className="text-xs text-slate-300 cursor-pointer">
                Save this reflection into my Evidence Ledger
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsResetOpen(false)} className="text-slate-400 hover:text-white text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                resetMutation.mutate({
                  triggerSituation: resetFacts || "Situational trigger",
                  noticeStory: resetStory || "Initial narrative reaction",
                  separateFacts: resetFacts || "Factual context",
                  alternativeView: resetAlt || "Plausible alternative interpretation",
                  chosenAssumption: resetAssumption || "Generative operating choice",
                  immediateAction: resetAction || "Calm 10-minute response",
                  saveToEvidence: resetSaveToEvidence,
                });
              }}
              disabled={resetMutation.isPending || !resetAction}
              className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold text-xs"
            >
              {resetMutation.isPending ? "Completing..." : "Complete Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          CREATE BEHAVIORAL EXPERIMENT DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isCreateExperimentOpen} onOpenChange={setIsCreateExperimentOpen}>
        <DialogContent className="bg-[#0A1A2F] text-white border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Design Behavioral Experiment</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              State the limiting assumption, design the test, and lock in your prediction before acting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-slate-300">Experiment Title</Label>
              <Input
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                placeholder="e.g. 10-Minute Coaching Pause in Sprint Review"
                className="bg-slate-950 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-slate-300">Context / Situation</Label>
              <Input
                value={expContext}
                onChange={(e) => setExpContext(e.target.value)}
                placeholder="e.g. Tomorrow's technical blockers meeting with the senior team"
                className="bg-slate-950 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-slate-300">Old Limiting Assumption Being Challenged</Label>
              <Input
                value={expOldAssumption}
                onChange={(e) => setExpOldAssumption(e.target.value)}
                placeholder="e.g. If I don't give the answer immediately, the team will make a poor technical choice."
                className="bg-slate-950 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-slate-300">Alternative Hypothesis</Label>
              <Input
                value={expAlternative}
                onChange={(e) => setExpAlternative(e.target.value)}
                placeholder="e.g. The engineers will formulate a sound approach if given clear outcome boundaries."
                className="bg-slate-950 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[#D4AF37] font-semibold">Concrete Behaviour to Test</Label>
              <Input
                value={expBehaviour}
                onChange={(e) => setExpBehaviour(e.target.value)}
                placeholder="e.g. Ask 3 clarifying questions before offering any solution of my own."
                className="bg-slate-950 border-[#D4AF37]/50 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-rose-400 font-semibold">Predicted Negative Outcome</Label>
              <Input
                value={expPredictedOutcome}
                onChange={(e) => setExpPredictedOutcome(e.target.value)}
                placeholder="e.g. Dead silence, wasted time, or a totally flawed proposal."
                className="bg-slate-950 border-rose-500/50 text-xs text-white"
              />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs">
                <Label className="text-slate-300">Predicted Risk / Probability: {expProbability}%</Label>
                <span className="text-slate-400 text-[11px]">How likely do you fear the failure is?</span>
              </div>
              <Slider value={[expProbability]} onValueChange={(v) => setExpProbability(v[0])} max={100} step={5} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsCreateExperimentOpen(false)} className="text-slate-400 hover:text-white text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const targetNarrativeId = selectedNarrativeId || activeNarratives[0]?.id || 1;
                createExperimentMutation.mutate({
                  narrativeId: targetNarrativeId,
                  title: expTitle || "Behavioral Experiment",
                  contextSituation: expContext || "Workplace situation",
                  oldAssumption: expOldAssumption || "Old limiting assumption",
                  alternativeHypothesis: expAlternative || "Alternative operating hypothesis",
                  behaviourToTest: expBehaviour || "Specific behaviour to test",
                  predictedOutcome: expPredictedOutcome || "Predicted outcome",
                  predictedProbability: expProbability,
                  experimentType: expType,
                });
              }}
              disabled={createExperimentMutation.isPending || !expBehaviour}
              className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold text-xs"
            >
              {createExperimentMutation.isPending ? "Scheduling..." : "Lock In Experiment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          LOG OUTCOME DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isRecordOutcomeOpen} onOpenChange={setIsRecordOutcomeOpen}>
        <DialogContent className="bg-[#0A1A2F] text-white border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Log Actual Experiment Outcome</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Compare your pre-action prediction with what actually happened.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-slate-300 font-semibold">What actually happened in reality?</Label>
              <Textarea
                value={outcomeActual}
                onChange={(e) => setOutcomeActual(e.target.value)}
                placeholder="e.g. The senior engineer proposed a caching solution I hadn't thought of. Discussion was energetic and productive."
                className="bg-slate-950 border-slate-800 text-xs text-white min-h-[70px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-emerald-400 font-semibold">What did reality teach you about your old assumption?</Label>
              <Textarea
                value={outcomeLearning}
                onChange={(e) => setOutcomeLearning(e.target.value)}
                placeholder="e.g. When I create a pause instead of giving the answer, the team steps up with genuine ownership."
                className="bg-slate-950 border-emerald-500/50 text-xs text-white min-h-[70px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300">Narrative Impact</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={outcomeImpact === "strongly_challenged" ? "default" : "outline"}
                  onClick={() => setOutcomeImpact("strongly_challenged")}
                  className={`text-xs ${
                    outcomeImpact === "strongly_challenged" ? "bg-emerald-500 text-white font-bold" : "border-slate-700 text-slate-300"
                  }`}
                >
                  Strongly Challenged Old Belief
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={outcomeImpact === "partly_challenged" ? "default" : "outline"}
                  onClick={() => setOutcomeImpact("partly_challenged")}
                  className={`text-xs ${
                    outcomeImpact === "partly_challenged" ? "bg-sky-500 text-white font-semibold" : "border-slate-700 text-slate-300"
                  }`}
                >
                  Partly Challenged
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsRecordOutcomeOpen(false)} className="text-slate-400 hover:text-white text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!selectedExperimentId) return;
                recordOutcomeMutation.mutate({
                  experimentId: selectedExperimentId,
                  actualOutcome: outcomeActual || "Observed reality",
                  whatRealityTaught: outcomeLearning || "Learning reflection",
                  narrativeImpact: outcomeImpact,
                  convictionShiftOld: convictionOld,
                  convictionShiftEmerging: convictionEmerging,
                });
              }}
              disabled={recordOutcomeMutation.isPending || !outcomeActual}
              className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold text-xs"
            >
              {recordOutcomeMutation.isPending ? "Recording..." : "Save Outcome to Ledger"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          LOG REAL-WORLD EVIDENCE DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isLogEvidenceOpen} onOpenChange={setIsLogEvidenceOpen}>
        <DialogContent className="bg-[#0A1A2F] text-white border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Log Real-World Evidence</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Record a real leadership moment where you operated from your emerging assumption.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-slate-300">Situation / Context</Label>
              <Input
                value={evidenceSituation}
                onChange={(e) => setEvidenceSituation(e.target.value)}
                placeholder="e.g. Budget reallocation debate in the leadership team meeting"
                className="bg-slate-950 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-slate-300">Action Taken</Label>
              <Input
                value={evidenceAction}
                onChange={(e) => setEvidenceAction(e.target.value)}
                placeholder="e.g. Openly supported the product team's request instead of defending my department's silo."
                className="bg-slate-950 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-slate-300">Observed Outcome</Label>
              <Input
                value={evidenceOutcome}
                onChange={(e) => setEvidenceOutcome(e.target.value)}
                placeholder="e.g. VP appreciated the enterprise mindset and granted our key hiring exception."
                className="bg-slate-950 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[#D4AF37]">Identity Implication (What this proved about you)</Label>
              <Input
                value={evidenceLearning}
                onChange={(e) => setEvidenceLearning(e.target.value)}
                placeholder="e.g. I can be an enterprise leader who influences the broader business, not just a functional manager."
                className="bg-slate-950 border-[#D4AF37]/50 text-xs text-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsLogEvidenceOpen(false)} className="text-slate-400 hover:text-white text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                logEvidenceMutation.mutate({
                  sourceType: evidenceSource,
                  situation: evidenceSituation || "Real-world context",
                  actionTaken: evidenceAction || "Constructive action",
                  outcome: evidenceOutcome || "Observed outcome",
                  learning: evidenceLearning || "Key learning",
                });
              }}
              disabled={logEvidenceMutation.isPending || !evidenceAction}
              className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold text-xs"
            >
              {logEvidenceMutation.isPending ? "Logging..." : "Add to Evidence Ledger"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          SHARING & PRIVACY SETTINGS DIALOG
         ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isSharingOpen} onOpenChange={setIsSharingOpen}>
        <DialogContent className="bg-[#0A1A2F] text-white border-slate-800 max-w-lg">
          <DialogHeader>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold w-fit mb-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Privacy Governance Firewall
            </div>
            <DialogTitle className="text-lg font-bold text-white">Participant-Controlled Sharing</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Raw reflections, question worksheets, and discarded narratives are permanently private. You choose what commitments or summaries your Success Partner or Coach can see.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <div className="font-semibold text-white">Share Next Chapter Identity & Commitments</div>
                <div className="text-[11px] text-slate-400">Allows your coach to hold you accountable to your target operating assumptions.</div>
              </div>
              <Switch checked={shareNextChapter} onCheckedChange={setShareNextChapter} />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <div className="font-semibold text-white">Share Experiment Counts (No Raw Content)</div>
                <div className="text-[11px] text-slate-400">Surfaces momentum and pace of behavioral testing without disclosing private details.</div>
              </div>
              <Switch checked={shareExperimentCount} onCheckedChange={setShareExperimentCount} />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <div className="font-semibold text-white">Share Curated Evidence Summary</div>
                <div className="text-[11px] text-slate-400">Shares logged proof points in aggregated executive coaching debriefs.</div>
              </div>
              <Switch checked={shareEvidenceSummary} onCheckedChange={setShareEvidenceSummary} />
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-slate-300">Support Request for Success Partner / Coach</Label>
              <Input
                value={shareSupportRequest}
                onChange={(e) => setShareSupportRequest(e.target.value)}
                placeholder="e.g. In our Friday 15-minute sync, ask me if I took the 10-minute coaching pause."
                className="bg-slate-950 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-4">
              <div>
                <div className="font-semibold text-white">Recent privacy activity</div>
                <div className="text-[11px] text-slate-400">You can see when your approved shared view was accessed or when commitment-based questions were drafted.</div>
              </div>
              {privacyActivity.length > 0 ? (
                <div className="space-y-2">
                  {privacyActivity.slice(0, 6).map((activity) => (
                    <div key={`${activity.eventType}-${activity.occurredAt}`} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                      <div className="text-[11px] leading-relaxed text-slate-300">{activity.label}</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {new Date(activity.occurredAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-800 px-3 py-3 text-[11px] text-slate-500">No shared-view activity recorded yet.</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsSharingOpen(false)} className="text-slate-400 hover:text-white text-xs">
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                saveSharingMutation.mutate({
                  recipientRole: "success_partner",
                  shareNextChapter,
                  shareBehaviours,
                  shareExperimentCount,
                  shareEvidenceSummary,
                  shareSupportRequest,
                });
              }}
              disabled={saveSharingMutation.isPending}
              className="bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0A1A2F] font-semibold text-xs"
            >
              {saveSharingMutation.isPending ? "Saving..." : "Save Privacy Preferences"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
