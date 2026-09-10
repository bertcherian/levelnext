import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Zap,
  Target,
  FileCheck,
  TrendingUp,
  Shield,
  Layers,
  HelpCircle,
  Clock,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { CURATED_MOVE_LIBRARY, type BehaviouralCareerStage } from "@shared/modules/behaviouralIntelligence";

interface Props {
  sourceApp?: string;
  defaultMomentId?: number;
}

const PRESET_MOMENTS = [
  {
    title: "Challenging an Overly Optimistic Commercial Timeline",
    category: "Stakeholder Alignment",
    situation: "In the cross-functional roadmap review, the commercial lead presented aggressive customer delivery dates based on unvalidated assumptions. I felt strong resistance and wanted to push back, but remained silent to avoid creating public conflict.",
    desiredOutcome: "Surface the dependency risk respectfully and agree on an assumption test without appearing obstructionist.",
    role: "Engineering Lead / Manager",
    careerStage: "manager" as BehaviouralCareerStage,
  },
  {
    title: "Reluctance to Delegate High-Stakes Deliverable",
    category: "Delegation & Scale",
    situation: "A strategic customer report is due next week. I assigned it to a senior team member, but because I have high standards and worry about rework, I find myself checking every draft and wanting to take it over.",
    desiredOutcome: "Give the team member genuine ownership and growth while maintaining high delivery quality through guardrails.",
    role: "Director of Product / Engineering",
    careerStage: "leader" as BehaviouralCareerStage,
  },
  {
    title: "Addressing Chronic Performance Inconsistency",
    category: "Leadership Courage",
    situation: "A capable engineer has missed delivery commitments in three consecutive sprints. I dread having the direct confrontation and keep hoping the issue will resolve itself.",
    desiredOutcome: "Hold the standard with courage, separating verifiable facts from character assumptions while maintaining relationship trust.",
    role: "Team Manager",
    careerStage: "manager" as BehaviouralCareerStage,
  },
  {
    title: "Senior Stakeholder Defensiveness During Briefing",
    category: "Executive Communication",
    situation: "During an executive presentation to the VP, my recommendation was interrupted and questioned sharply. I became defensive and spent 10 minutes debating technical details rather than listening to the business concern.",
    desiredOutcome: "Stay composed under pressure, lead with the bottom-line trade-off, and address the executive's underlying priority.",
    role: "Senior Leader",
    careerStage: "leader" as BehaviouralCareerStage,
  },
];

export default function BehaviouralIntelligenceStudio(props?: {
  sourceApp?: string;
  defaultMomentId?: number;
}) {
  const sourceApp = props?.sourceApp ?? "behavioural_intelligence";
  const [activeTab, setActiveTab] = useState<"capture" | "active" | "ledger">("capture");
  const [selectedMomentId, setSelectedMomentId] = useState<number | null>(null);

  useEffect(() => {
    const queryMomentId = new URLSearchParams(window.location.search).get("momentId");
    const momentId = Number(queryMomentId ?? props?.defaultMomentId ?? 0);
    if (Number.isInteger(momentId) && momentId > 0) {
      setSelectedMomentId(momentId);
      setActiveTab("active");
    }
  }, [props?.defaultMomentId]);

  // Form State
  const [situation, setSituation] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [observedBehaviour, setObservedBehaviour] = useState("");
  const [role, setRole] = useState("Manager");
  const [careerStage, setCareerStage] = useState<BehaviouralCareerStage>("manager");
  const [stakeholders, setStakeholders] = useState("");
  const [powerDynamics, setPowerDynamics] = useState("");

  // Action / Evidence Form States
  const [actionDesc, setActionDesc] = useState("");
  const [actionPerson, setActionPerson] = useState("");
  const [evidenceActionTaken, setEvidenceActionTaken] = useState("");
  const [evidenceOutcome, setEvidenceOutcome] = useState("");
  const [evidenceLearning, setEvidenceLearning] = useState("");
  const [reflectionText, setReflectionText] = useState("");

  // Queries
  const { data: capacitySummary, refetch: refetchCapacity } = trpc.behaviouralIntelligence.getCapacitySummary.useQuery();
  const { data: momentsList, refetch: refetchMoments } = trpc.behaviouralIntelligence.listMoments.useQuery({ limit: 25 });
  const { data: activeMomentLineage, refetch: refetchActiveMoment, isLoading: isLoadingLineage } =
    trpc.behaviouralIntelligence.getMomentWithLineage.useQuery(
      { momentId: selectedMomentId! },
      { enabled: Boolean(selectedMomentId) }
    );

  // Mutations
  const createMomentMutation = trpc.behaviouralIntelligence.createMoment.useMutation();
  const analyseMomentMutation = trpc.behaviouralIntelligence.analyseMoment.useMutation();
  const selectMoveMutation = trpc.behaviouralIntelligence.selectMove.useMutation();
  const createPracticeLinkMutation = trpc.behaviouralIntelligence.createPracticeLink.useMutation();
  const recordPracticeResultMutation = trpc.behaviouralIntelligence.recordPracticeResult.useMutation();
  const createActionMutation = trpc.behaviouralIntelligence.createAction.useMutation();
  const updateActionStatusMutation = trpc.behaviouralIntelligence.updateActionStatus.useMutation();
  const recordEvidenceMutation = trpc.behaviouralIntelligence.recordEvidence.useMutation();
  const recordReflectionMutation = trpc.behaviouralIntelligence.recordReflection.useMutation();

  const handleApplyPreset = (preset: typeof PRESET_MOMENTS[0]) => {
    setSituation(preset.situation);
    setDesiredOutcome(preset.desiredOutcome);
    setRole(preset.role);
    setCareerStage(preset.careerStage);
    toast.success(`Loaded preset: "${preset.title}"`);
  };

  const handleCaptureAndAnalyse = async () => {
    if (!situation.trim() || situation.trim().length < 10) {
      toast.error("Please describe the workplace situation in at least 10 characters.");
      return;
    }

    try {
      const moment = await createMomentMutation.mutateAsync({
        sourceApp,
        situation,
        desiredOutcome: desiredOutcome || undefined,
        observedBehaviour: observedBehaviour || undefined,
        role: role || undefined,
        careerStage,
        stakeholders: stakeholders || undefined,
        powerDynamics: powerDynamics || undefined,
      });

      toast.success("Moment captured. Analysing behavioural breakthrough...");

      await analyseMomentMutation.mutateAsync({
        momentId: moment.id,
      });

      setSelectedMomentId(moment.id);
      setActiveTab("active");
      refetchMoments();
      refetchCapacity();
      toast.success("Breakthrough analysis complete!");
    } catch (err: any) {
      toast.error(err.message || "Failed to analyse moment.");
    }
  };

  const handleSelectMove = async (moveId: number) => {
    if (!selectedMomentId) return;
    try {
      await selectMoveMutation.mutateAsync({ moveId, momentId: selectedMomentId });
      toast.success("Move selected! Ready for practice rehearsal.");
      refetchActiveMoment();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handlePracticeRehearsal = async (moveId: number) => {
    if (!selectedMomentId) return;
    try {
      const practice = await createPracticeLinkMutation.mutateAsync({
        moveId,
        momentId: selectedMomentId,
        providerType: "standard_practice",
        scenarioContext: {
          context: "Simulated peer discussion",
        },
      });

      await recordPracticeResultMutation.mutateAsync({
        practiceLinkId: practice.id,
        practiceStatus: "completed",
        feedbackScores: { clarity: 90, courage: 85, grounding: 95 },
      });

      toast.success("Practice rehearsal completed! Evidence level advanced to 'Practised'.");
      refetchActiveMoment();
      refetchCapacity();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleVoiceRehearsal = async (move: {
    id: number;
    title: string;
    description: string;
    suggestedLanguage: string[] | null;
    successSignal: string;
    status: string;
  }) => {
    if (!selectedMomentId) return;
    try {
      if (move.status === "proposed") {
        await selectMoveMutation.mutateAsync({ moveId: move.id, momentId: selectedMomentId });
      }
      localStorage.setItem("levelnext_behavioural_rehearsal", JSON.stringify({
        moveId: move.id,
        momentId: selectedMomentId,
        moveTitle: move.title,
        moveDescription: move.description,
        suggestedLanguage: move.suggestedLanguage ?? [],
        successSignal: move.successSignal,
      }));
      window.location.href = "/manager/simulate";
    } catch (err: any) {
      toast.error(err.message || "Could not prepare the voice rehearsal.");
    }
  };

  const handleCommitAction = async (moveId: number) => {
    if (!selectedMomentId || !actionDesc.trim()) {
      toast.error("Please provide an action description.");
      return;
    }
    try {
      await createActionMutation.mutateAsync({
        moveId,
        momentId: selectedMomentId,
        actionDescription: actionDesc,
        personOrGroup: actionPerson || undefined,
      });
      toast.success("Real-world action committed!");
      setActionDesc("");
      setActionPerson("");
      refetchActiveMoment();
      refetchCapacity();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRecordEvidence = async () => {
    if (!selectedMomentId || !evidenceActionTaken.trim() || !evidenceOutcome.trim()) {
      toast.error("Please fill in what action was taken and what outcome occurred.");
      return;
    }
    try {
      const activeMove = activeMomentLineage?.moves[0];
      const activeAction = activeMomentLineage?.actions[0];

      await recordEvidenceMutation.mutateAsync({
        momentId: selectedMomentId,
        moveId: activeMove?.id,
        actionId: activeAction?.id,
        situation: activeMomentLineage?.moment.situation || "Workplace situation",
        actionTaken: evidenceActionTaken,
        outcome: evidenceOutcome,
        learning: evidenceLearning || "Key shift observed in interaction.",
        evidenceLevel: "applied",
      });

      toast.success("Observable evidence recorded! Evidence level advanced to 'Applied'.");
      setEvidenceActionTaken("");
      setEvidenceOutcome("");
      setEvidenceLearning("");
      refetchActiveMoment();
      refetchCapacity();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRecordReflection = async (evidenceId: number) => {
    if (!selectedMomentId || !reflectionText.trim()) {
      toast.error("Please enter your reflection.");
      return;
    }
    try {
      await recordReflectionMutation.mutateAsync({
        evidenceId,
        momentId: selectedMomentId,
        reflectionText,
        capacitySignal: "Demonstrated calibrated move under pressure",
      });

      toast.success("Reflection recorded! Evidence level advanced to 'Reflected'.");
      setReflectionText("");
      refetchActiveMoment();
      refetchCapacity();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const latestSnapshot = activeMomentLineage?.snapshots[0];
  const analysis = latestSnapshot?.analysis;
  const activeMove = activeMomentLineage?.moves[0];
  const activeEvidence = activeMomentLineage?.evidence[0];

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#1C1C1C] pb-20">
      {/* ── Brand Header (Navy Blue #0A1A2F & Rich Gold #D4AF37) ──────────────── */}
      <header className="bg-[#0A1A2F] text-white border-b-2 border-[#D4AF37] px-6 py-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="LevelNext" className="h-10 w-auto bg-white/10 p-1 rounded" />
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#D4AF37] text-[#0A1A2F] font-semibold text-xs tracking-wider uppercase">
                  Platform Core Intelligence
                </Badge>
                <span className="text-xs text-gray-300">v1.0 • UODL Grounded</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mt-1">
                Behavioural Intelligence Engine™
              </h1>
              <p className="text-sm text-gray-300 mt-0.5">
                "Knowing is not the primary problem. Doing differently when it matters is."
              </p>
            </div>
          </div>

          {/* Evidence Ladder Progress Summary */}
          <div className="bg-white/5 border border-white/15 rounded-lg p-3 min-w-[280px]">
            <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
              <span>Capacity Progression</span>
              <span className="font-semibold text-[#D4AF37]">
                {capacitySummary?.evidenceProgression.highestLevel.toUpperCase() ?? "PREPARED"}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-2 overflow-hidden flex">
              {[0, 1, 2, 3, 4, 5].map((lvl) => (
                <div
                  key={lvl}
                  className={`flex-1 h-full border-r border-black/30 ${
                    lvl <= (capacitySummary?.evidenceProgression.levelIndex ?? 0)
                      ? "bg-[#D4AF37]"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-gray-300 leading-tight">
              {capacitySummary?.evidenceProgression.summaryLabel ?? "Capture a moment to define your first move."}
            </p>
          </div>
        </div>
      </header>

      {/* ── Main Workspace ────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-6">
            <TabsList className="bg-white border border-gray-200 shadow-sm p-1">
              <TabsTrigger value="capture" className="data-[state=active]:bg-[#0A1A2F] data-[state=active]:text-white gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                1. Capture Moment
              </TabsTrigger>
              <TabsTrigger
                value="active"
                disabled={!selectedMomentId}
                className="data-[state=active]:bg-[#0A1A2F] data-[state=active]:text-white gap-2"
              >
                <Zap className="w-4 h-4 text-[#D4AF37]" />
                2. Move & Action Studio
              </TabsTrigger>
              <TabsTrigger value="ledger" className="data-[state=active]:bg-[#0A1A2F] data-[state=active]:text-white gap-2">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                3. Moments & Capacity Ledger ({momentsList?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            {selectedMomentId && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>Active Moment #{selectedMomentId}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedMomentId(null);
                    setActiveTab("capture");
                  }}
                  className="h-7 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> New Moment
                </Button>
              </div>
            )}
          </div>

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: CAPTURE MOMENT THAT MATTERS                                    */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="capture" className="space-y-6">
            {/* Quick Starters */}
            <Card className="border-border bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-serif text-[#0A1A2F] flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-[#D4AF37]" />
                    Fast-Start Contexts (from Manager Effectiveness & Leader Intelligence)
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">Click to populate</span>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0">
                {PRESET_MOMENTS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-[#D4AF37] hover:bg-[#F8F5F0]/60 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-[#0A1A2F]">{preset.title}</span>
                      <Badge variant="outline" className="text-[10px] border-[#D4AF37] text-[#0A1A2F]">
                        {preset.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{preset.situation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Moment Capture Form */}
            <Card className="border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-[#0A1A2F]">
                  Describe the Workplace Moment
                </CardTitle>
                <CardDescription>
                  Behavioural Intelligence operates on concrete, high-stakes workplace moments—not abstract personality theory.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Your Role & Scope</Label>
                    <Input
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Engineering Lead, Director of Operations"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="careerStage">Career Stage</Label>
                    <Select
                      value={careerStage}
                      onValueChange={(val: any) => setCareerStage(val)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="early_career">Early Career Professional</SelectItem>
                        <SelectItem value="professional">Mid-Level Professional</SelectItem>
                        <SelectItem value="manager">People Manager / Team Lead</SelectItem>
                        <SelectItem value="leader">Senior Leader / BU Head</SelectItem>
                        <SelectItem value="cxo">Executive / CXO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="situation" className="text-sm font-semibold text-[#0A1A2F]">
                    What Happened? (The Moment)*
                  </Label>
                  <Textarea
                    id="situation"
                    rows={4}
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="Describe what occurred, who was in the room, and what made this moment high-stakes or tense..."
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="desiredOutcome">Desired Outcome (Commitment to Protect)</Label>
                    <Input
                      id="desiredOutcome"
                      value={desiredOutcome}
                      onChange={(e) => setDesiredOutcome(e.target.value)}
                      placeholder="e.g. Surface the risk without creating hostility"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="observedBehaviour">What Did You Actually Do?</Label>
                    <Input
                      id="observedBehaviour"
                      value={observedBehaviour}
                      onChange={(e) => setObservedBehaviour(e.target.value)}
                      placeholder="e.g. Stayed silent, interrupted sharply, delayed the decision"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stakeholders">Key Stakeholders Involved</Label>
                    <Input
                      id="stakeholders"
                      value={stakeholders}
                      onChange={(e) => setStakeholders(e.target.value)}
                      placeholder="e.g. VP Commercial, Tech Lead, Direct Reports"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="powerDynamics">Power Dynamics / Asymmetry</Label>
                    <Input
                      id="powerDynamics"
                      value={powerDynamics}
                      onChange={(e) => setPowerDynamics(e.target.value)}
                      placeholder="e.g. Senior stakeholder in public meeting"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleCaptureAndAnalyse}
                    disabled={createMomentMutation.isPending || analyseMomentMutation.isPending}
                    className="bg-[#0A1A2F] hover:bg-[#0A1A2F]/90 text-white border-2 border-[#D4AF37] px-6 py-2.5 font-medium flex items-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    {createMomentMutation.isPending || analyseMomentMutation.isPending
                      ? "Generating Breakthrough..."
                      : "Analyse Behavioural Move"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: MOVE & ACTION STUDIO                                           */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="active" className="space-y-6">
            {isLoadingLineage ? (
              <div className="p-12 text-center text-gray-500">Loading behavioural lineage...</div>
            ) : !activeMomentLineage ? (
              <div className="p-12 text-center text-gray-500">No active moment selected.</div>
            ) : (
              <>
                {/* 1. Context Banner */}
                <Card className="bg-[#0A1A2F] text-white border-l-4 border-l-[#D4AF37]">
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#D4AF37] text-[#0A1A2F] text-xs font-semibold">
                          {activeMomentLineage.moment.careerStage.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-300">
                          Captured {new Date(activeMomentLineage.moment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant="outline" className="border-white/30 text-white text-xs">
                        Status: {activeMomentLineage.moment.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-100 font-serif leading-relaxed">
                      "{activeMomentLineage.moment.situation}"
                    </p>
                    {activeMomentLineage.moment.desiredOutcome && (
                      <p className="text-xs text-[#D4AF37] mt-2">
                        <span className="font-semibold">Desired Outcome:</span> {activeMomentLineage.moment.desiredOutcome}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Three-Lens Separation: Facts vs Interpretations vs Predictions */}
                {analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white border-gray-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          Verifiable Facts
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1.5 pt-0">
                        {analysis.facts.map((fact, idx) => (
                          <p key={idx} className="text-gray-700 leading-relaxed">• {fact}</p>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                          Interpretations (The Story)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1.5 pt-0">
                        {analysis.interpretations.map((interp, idx) => (
                          <p key={idx} className="text-gray-700 leading-relaxed">• {interp}</p>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          Predictions / Forecasts
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1.5 pt-0">
                        {analysis.predictions.map((pred, idx) => (
                          <p key={idx} className="text-gray-700 leading-relaxed">• {pred}</p>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* 3. The Recommended Move Card */}
                {activeMove && (
                  <Card className="border-2 border-[#D4AF37] bg-white shadow-md">
                    <CardHeader className="bg-[#0A1A2F]/5 border-b border-gray-200 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <Badge className="bg-[#0A1A2F] text-white text-[11px] mb-1">
                            Recommended Move • {activeMove.moveCode}
                          </Badge>
                          <CardTitle className="text-xl font-serif text-[#0A1A2F]">
                            {activeMove.title}
                          </CardTitle>
                        </div>
                        <Badge
                          className={`text-xs ${
                            activeMove.status === "practised" || activeMove.status === "applied"
                              ? "bg-green-600 text-white"
                              : "bg-[#D4AF37] text-[#0A1A2F]"
                          }`}
                        >
                          Status: {activeMove.status.toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-700 text-sm mt-1">
                        {activeMove.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-4">
                      {/* Verbatim Language */}
                      {activeMove.suggestedLanguage && activeMove.suggestedLanguage.length > 0 && (
                        <div>
                          <h4 className="text-xs uppercase tracking-wider font-semibold text-green-700 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> What To Say (Suggested Verbatim Phrasing):
                          </h4>
                          <div className="bg-green-50 border border-green-200 rounded p-3 space-y-1.5 text-xs text-green-950 font-mono">
                            {activeMove.suggestedLanguage.map((phrase, idx) => (
                              <p key={idx}>"{phrase}"</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Watch-outs */}
                      {activeMove.doNotDo && activeMove.doNotDo.length > 0 && (
                        <div>
                          <h4 className="text-xs uppercase tracking-wider font-semibold text-red-700 mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> What NOT To Do (Avoid These Habits):
                          </h4>
                          <div className="bg-red-50 border border-red-200 rounded p-3 space-y-1 text-xs text-red-900">
                            {activeMove.doNotDo.map((item, idx) => (
                              <p key={idx}>• {item}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Success Signal */}
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-950">
                        <span className="font-semibold text-amber-900">Observable Success Signal:</span>{" "}
                        {activeMove.successSignal}
                      </div>

                      {/* Move Action Triggers */}
                      <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-gray-100">
                        {activeMove.status === "proposed" && (
                          <Button
                            size="sm"
                            onClick={() => handleSelectMove(activeMove.id)}
                            className="bg-[#0A1A2F] text-white hover:bg-[#0A1A2F]/90"
                          >
                            Accept & Select Move
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePracticeRehearsal(activeMove.id)}
                          className="border-[#D4AF37] text-[#0A1A2F] hover:bg-[#D4AF37]/10"
                        >
                          <Zap className="w-3.5 h-3.5 mr-1 text-[#D4AF37]" />
                          Rehearse / Micro-Practice Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVoiceRehearsal(activeMove)}
                          className="border-[#0A1A2F] text-[#0A1A2F] hover:bg-[#0A1A2F]/10"
                        >
                          <Volume2 className="w-3.5 h-3.5 mr-1 text-[#D4AF37]" />
                          Rehearse with Voice Simulator
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 4. Real-World Action Commitment */}
                <Card className="bg-white border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-serif text-[#0A1A2F] flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#D4AF37]" />
                      Real-World Action Commitment
                    </CardTitle>
                    <CardDescription>
                      Translate the rehearsed move into an explicit workplace commitment with owner and timing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activeMomentLineage.actions.length > 0 ? (
                      <div className="space-y-2">
                        {activeMomentLineage.actions.map((act) => (
                          <div
                            key={act.id}
                            className="p-3 border border-gray-200 rounded-lg flex items-center justify-between gap-4"
                          >
                            <div>
                              <p className="text-xs font-semibold text-[#0A1A2F]">{act.actionDescription}</p>
                              <p className="text-[11px] text-gray-500">
                                Target: {act.personOrGroup ?? "Team/Stakeholder"} • Due:{" "}
                                {act.dueAt ? new Date(act.dueAt).toLocaleDateString() : "This week"}
                              </p>
                              {act.completionNotes && (
                                <p className="text-[11px] text-green-700 mt-1 italic">
                                  Outcome: {act.completionNotes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {act.status !== "completed" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    await updateActionStatusMutation.mutateAsync({
                                      actionId: act.id,
                                      status: "completed",
                                      completionNotes: "Executed in scheduled meeting.",
                                    });
                                    toast.success("Action marked completed!");
                                    refetchActiveMoment();
                                    refetchCapacity();
                                  }}
                                  className="h-7 text-xs border-green-600 text-green-700"
                                >
                                  Mark Done
                                </Button>
                              ) : (
                                <Badge className="bg-green-600 text-white text-[10px]">COMPLETED</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <Input
                            placeholder="What concrete action will you take in your next meeting/conversation?"
                            value={actionDesc}
                            onChange={(e) => setActionDesc(e.target.value)}
                            className="text-xs"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="With whom?"
                            value={actionPerson}
                            onChange={(e) => setActionPerson(e.target.value)}
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => activeMove && handleCommitAction(activeMove.id)}
                            className="bg-[#0A1A2F] text-white whitespace-nowrap"
                          >
                            Commit
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 5. Observable Evidence & Reflection */}
                <Card className="bg-white border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-serif text-[#0A1A2F] flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#D4AF37]" />
                      Evidence of Change & Learning
                    </CardTitle>
                    <CardDescription>
                      Record what actually occurred when you applied the move in the real world.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeMomentLineage.evidence.length > 0 ? (
                      <div className="space-y-3">
                        {activeMomentLineage.evidence.map((ev) => (
                          <div key={ev.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-[#0A1A2F]">Evidence Record #{ev.id}</span>
                              <Badge className="bg-[#D4AF37] text-[#0A1A2F] text-[10px]">
                                {ev.evidenceLevel.toUpperCase()}
                              </Badge>
                            </div>
                            <p><span className="text-gray-500">Action:</span> {ev.actionTaken}</p>
                            <p><span className="text-gray-500">Outcome:</span> {ev.outcome}</p>
                            <p><span className="text-gray-500">Learning:</span> {ev.learning}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Input
                          placeholder="What move or action did you attempt in real life?"
                          value={evidenceActionTaken}
                          onChange={(e) => setEvidenceActionTaken(e.target.value)}
                          className="text-xs"
                        />
                        <Input
                          placeholder="What was the observable outcome? How did the other party respond?"
                          value={evidenceOutcome}
                          onChange={(e) => setEvidenceOutcome(e.target.value)}
                          className="text-xs"
                        />
                        <Input
                          placeholder="What did reality teach you about your assumptions?"
                          value={evidenceLearning}
                          onChange={(e) => setEvidenceLearning(e.target.value)}
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={handleRecordEvidence}
                          className="bg-[#0A1A2F] text-white"
                        >
                          Record Evidence
                        </Button>
                      </div>
                    )}

                    {/* Reflection */}
                    {activeEvidence && (
                      <div className="pt-3 border-t border-gray-200">
                        <Label className="text-xs font-semibold text-[#0A1A2F]">
                          Participant Reflection on Capacity Shift
                        </Label>
                        {activeMomentLineage.reflections.length > 0 ? (
                          <div className="mt-2 p-3 bg-[#F8F5F0] border border-[#D4AF37]/40 rounded text-xs text-gray-800">
                            <p className="italic">"{activeMomentLineage.reflections[0].reflectionText}"</p>
                            {activeMomentLineage.reflections[0].capacitySignal && (
                              <p className="text-[11px] text-[#D4AF37] mt-1 font-semibold">
                                Shift: {activeMomentLineage.reflections[0].capacitySignal}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              rows={2}
                              placeholder="How did this experience shift how you see this type of situation going forward?"
                              value={reflectionText}
                              onChange={(e) => setReflectionText(e.target.value)}
                              className="text-xs"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleRecordReflection(activeEvidence.id)}
                              className="bg-[#0A1A2F] text-white"
                            >
                              Save Reflection
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: MOMENTS & CAPACITY LEDGER                                      */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="ledger" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-gray-500 uppercase tracking-wider">Total Moments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-serif text-[#0A1A2F]">
                    {capacitySummary?.totalMoments ?? 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-gray-500 uppercase tracking-wider">Practice Rehearsals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-serif text-[#0A1A2F]">
                    {capacitySummary?.totalPractices ?? 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-gray-500 uppercase tracking-wider">Action Commitments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-serif text-[#0A1A2F]">
                    {capacitySummary?.totalActions ?? 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-gray-500 uppercase tracking-wider">Real-World Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-serif text-green-700">
                    {capacitySummary?.totalEvidence ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* List of Moments */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-[#0A1A2F]">
                  Moments That Matter History
                </CardTitle>
                <CardDescription>
                  Your private developmental ledger tracking real-world behavioural attempts and learning.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {momentsList && momentsList.length > 0 ? (
                  momentsList.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMomentId(m.id);
                        setActiveTab("active");
                      }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-[#D4AF37] hover:bg-[#F8F5F0]/40 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#0A1A2F]">Moment #{m.id}</span>
                          <Badge variant="outline" className="text-[10px] border-gray-300">
                            {m.careerStage.toUpperCase()}
                          </Badge>
                          <Badge
                            className={`text-[10px] ${
                              m.status === "completed"
                                ? "bg-green-600 text-white"
                                : m.status === "analysed"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            {m.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-700 line-clamp-2 max-w-2xl">{m.situation}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-400">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                        <Button size="sm" variant="ghost" className="h-8 text-xs text-[#0A1A2F] gap-1">
                          Open <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 py-6 text-center">
                    No moments recorded yet. Capture your first moment to start.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
