import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import PlatformLayout from "@/components/PlatformLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldAlert,
  Target,
  FileText,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Building2,
  Calendar,
  Lock,
} from "lucide-react";
import type {
  WarRoomCampaignStatus,
  WarRoomConstraintState,
  WarRoomDecisionOutcome,
  WarRoomEvidenceRelation,
  WarRoomEvidenceSourceType,
  WarRoomIndicator,
  WarRoomProductKey,
} from "@shared/modules/warRoom";

export default function WarRoom() {
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [productKey, setProductKey] = useState<WarRoomProductKey>("manager_effectiveness");

  const [activeTab, setActiveTab] = useState<"command" | "evidence" | "campaign" | "review">("command");
  const [evidenceSourceType, setEvidenceSourceType] = useState<WarRoomEvidenceSourceType>("manual_note");
  const [evidenceSourceLabel, setEvidenceSourceLabel] = useState("");
  const [evidenceSourceRef, setEvidenceSourceRef] = useState("");
  const [evidenceContext, setEvidenceContext] = useState("");
  const [evidenceObservation, setEvidenceObservation] = useState("");
  const [evidenceRelation, setEvidenceRelation] = useState<WarRoomEvidenceRelation>("supports");
  const [evidenceInterpretation, setEvidenceInterpretation] = useState("");
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  // New Campaign Form State
  const [campaignName, setCampaignName] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [campaignVictory, setCampaignVictory] = useState("");
  const [campaignHypothesis, setCampaignHypothesis] = useState("");
  const [campaignDeadline, setCampaignDeadline] = useState("");
  const [campaignReviewDate, setCampaignReviewDate] = useState("");
  const [indicatorLabel, setIndicatorLabel] = useState("");
  const [indicatorDef, setIndicatorDef] = useState("");
  const [indicatorImplication, setIndicatorImplication] = useState("");
  const [campaignParked, setCampaignParked] = useState("");
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);

  // Decision & Order Form State
  const [decisionQuestion, setDecisionQuestion] = useState("");
  const [decisionOptions, setDecisionOptions] = useState("Option A: Prioritise enterprise pilot\nOption B: Focus on SME partner channel");
  const [decisionRecommendation, setDecisionRecommendation] = useState("Option A: Prioritise enterprise pilot");
  const [orderStatement, setOrderStatement] = useState("");
  const [orderEvidence, setOrderEvidence] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Review Form State
  const [reviewBelief, setReviewBelief] = useState("");
  const [reviewActions, setReviewActions] = useState("");
  const [reviewActual, setReviewActual] = useState("");
  const [reviewHypothesisStatus, setReviewHypothesisStatus] = useState<"strengthened" | "weakened" | "unanswered" | "invalidated">("strengthened");
  const [reviewConstraintState, setReviewConstraintState] = useState<WarRoomConstraintState>("selected");
  const [reviewDecisionOutcome, setReviewDecisionOutcome] = useState<"continue" | "modify" | "pause" | "kill" | "none">("continue");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { data: products = [] } = trpc.warRoom.listProducts.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: owners = [] } = trpc.warRoom.listEligibleOwners.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: commandCenter, isLoading, refetch } = trpc.warRoom.commandCenter.useQuery(
    productKey,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const createCampaignMutation = trpc.warRoom.createCampaign.useMutation({
    onSuccess: () => {
      utils.warRoom.commandCenter.invalidate();
      setActiveTab("command");
    },
  });

  const createEvidenceMutation = trpc.warRoom.createEvidence.useMutation();
  const assessEvidenceMutation = trpc.warRoom.assessEvidence.useMutation({
    onSuccess: () => {
      utils.warRoom.commandCenter.invalidate();
      setActiveTab("command");
      setEvidenceObservation("");
      setEvidenceInterpretation("");
      setEvidenceSourceLabel("");
      setEvidenceSourceRef("");
      setEvidenceContext("");
    },
  });

  const recordDecisionMutation = trpc.warRoom.recordDecision.useMutation({
    onSuccess: () => utils.warRoom.commandCenter.invalidate(),
  });

  const approveOrderMutation = trpc.warRoom.approveOrder.useMutation({
    onSuccess: () => {
      utils.warRoom.commandCenter.invalidate();
      setOrderStatement("");
      setOrderEvidence("");
    },
  });

  const closeReviewMutation = trpc.warRoom.closeReview.useMutation({
    onSuccess: () => {
      utils.warRoom.commandCenter.invalidate();
      setActiveTab("command");
      setReviewBelief("");
      setReviewActions("");
      setReviewActual("");
    },
  });

  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-[#0A1A2F]" />
            <span>Loading War Room security boundary...</span>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <PlatformLayout>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#0A1A2F]">War Room Access Restricted</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            The LevelNext War Room OS is an executive strategic decision loop strictly restricted to LevelNext Platform Admins. Your current role does not have authorization to view or act in this workspace.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/admin">
              <Button className="bg-[#0A1A2F] text-white hover:bg-[#12345A]">Return to Admin Dashboard</Button>
            </Link>
            <Link href="/leader">
              <Button variant="outline">Go to Platform Home</Button>
            </Link>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  const campaign = commandCenter?.campaign as any;
  const materialEvidence = (commandCenter?.materialEvidence ?? []) as any[];
  const constraint = commandCenter?.constraint as any;
  const latestDecision = commandCenter?.latestDecision as any;
  const orders = (commandCenter?.orders ?? []) as any[];
  const latestReview = commandCenter?.latestReview as any;
  const weeklyOrderCount = commandCenter?.weeklyOrderCount ?? 0;
  const decisionRequired = commandCenter?.decisionRequired ?? false;

  const handleCaptureAndAssess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign?.id) return;
    setIsSubmittingEvidence(true);
    try {
      const created = await createEvidenceMutation.mutateAsync({
        productKey,
        campaignId: campaign.id,
        sourceType: evidenceSourceType,
        sourceLabel: evidenceSourceLabel || "Strategic Observation",
        sourceRef: evidenceSourceRef || undefined,
        observedAt: new Date(),
        context: evidenceContext || undefined,
        observation: evidenceObservation,
      });

      await assessEvidenceMutation.mutateAsync({
        productKey,
        campaignId: campaign.id,
        evidenceItemId: created.evidenceId,
        relation: evidenceRelation,
        interpretation: evidenceInterpretation || "Human evidence assessment recorded for War Room.",
        materiality: "material",
      });
    } catch (err: any) {
      alert(err.message || "Failed to capture evidence");
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const defaultOwnerId = owners[0]?.id ?? user?.id;
    if (!defaultOwnerId) return;

    setIsSubmittingCampaign(true);
    try {
      const indicators: WarRoomIndicator[] = [];
      if (indicatorLabel && indicatorDef && indicatorImplication) {
        indicators.push({
          key: "lead_indicator_1",
          label: indicatorLabel,
          definition: indicatorDef,
          decisionImplication: indicatorImplication,
        });
      }

      await createCampaignMutation.mutateAsync({
        productKey,
        name: campaignName,
        objective: campaignObjective,
        victoryCondition: campaignVictory,
        hypothesis: campaignHypothesis || undefined,
        ownerUserId: defaultOwnerId,
        deadline: campaignDeadline ? new Date(campaignDeadline) : new Date(Date.now() + 60 * 86400000),
        reviewDate: campaignReviewDate ? new Date(campaignReviewDate) : new Date(Date.now() + 7 * 86400000),
        indicators,
        parkedWork: campaignParked || undefined,
      });
    } catch (err: any) {
      alert(err.message || "Failed to activate campaign");
    } finally {
      setIsSubmittingCampaign(false);
    }
  };

  const handleApproveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign?.id) return;
    setIsSubmittingOrder(true);
    try {
      await approveOrderMutation.mutateAsync({
        productKey,
        campaignId: campaign.id,
        decisionId: latestDecision?.id ?? undefined,
        statement: orderStatement,
        ownerUserId: user.id,
        expectedEvidence: orderEvidence,
        deadline: new Date(Date.now() + 7 * 86400000),
      });
    } catch (err: any) {
      alert(err.message || "Failed to approve order");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleCloseReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign?.id) return;
    setIsSubmittingReview(true);
    try {
      await closeReviewMutation.mutateAsync({
        productKey,
        campaignId: campaign.id,
        expectedBelief: reviewBelief,
        actionsTaken: reviewActions,
        actualEvidence: reviewActual,
        hypothesisStatus: reviewHypothesisStatus,
        constraintState: reviewConstraintState,
        decisionOutcome: reviewDecisionOutcome,
      });
    } catch (err: any) {
      alert(err.message || "Failed to close review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <PlatformLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Header with Admin Badge and Organisation Selector */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A1A2F] text-[#D4AF37] shadow-sm ring-1 ring-[#D4AF37]/30">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-[#0A1A2F]">LevelNext War Room OS</h1>
                  <Badge className="bg-[#D4AF37]/20 text-[#0A1A2F] border-[#D4AF37]/40 font-semibold text-xs">
                    Admin Exclusive
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  Strategic orientation & weekly decision loop for senior leadership.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 shadow-sm">
              <Target className="h-4 w-4 text-slate-500" />
              <select
                className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
                value={productKey}
                onChange={(e) => setProductKey(e.target.value as WarRoomProductKey)}
              >
                {products.map((product) => (
                  <option key={product.key} value={product.key}>
                    {product.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-slate-700 border-slate-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sync
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab("command")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "command"
                ? "border-[#0A1A2F] text-[#0A1A2F]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            5-Block Command Center
          </button>
          <button
            onClick={() => setActiveTab("evidence")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "evidence"
                ? "border-[#0A1A2F] text-[#0A1A2F]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Capture Evidence
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "review"
                ? "border-[#0A1A2F] text-[#0A1A2F]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Weekly Review
          </button>
          <button
            onClick={() => setActiveTab("campaign")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "campaign"
                ? "border-[#0A1A2F] text-[#0A1A2F]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {campaign ? "Edit Campaign" : "New Campaign"}
          </button>
        </div>

        {/* ── TAB 1: 5-BLOCK COMMAND CENTER ── */}
        {activeTab === "command" && (
          <div className="space-y-6">
            {!campaign ? (
              <Card className="border-dashed border-2 bg-slate-50/50 p-8 text-center">
                <Target className="mx-auto h-10 w-10 text-slate-400" />
                <h3 className="mt-3 text-lg font-bold text-[#0A1A2F]">No Active Campaign for {commandCenter?.product.label ?? "this product"}</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  The War Room OS requires exactly one active strategic campaign per LevelNext product to orient decisions, constraints, and weekly orders.
                </p>
                <Button onClick={() => setActiveTab("campaign")} className="mt-4 bg-[#0A1A2F] text-white">
                  Create First Strategic Campaign
                </Button>
              </Card>
            ) : (
              <>
                {/* Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-900 text-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-[#D4AF37] text-black font-bold uppercase tracking-wider text-[11px]">
                      Active Campaign
                    </Badge>
                    <span className="font-semibold text-lg">{campaign.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
                      Review Date: {new Date(campaign.reviewDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" />
                      Deadline: {new Date(campaign.deadline).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-white">
                      Weekly Orders: {weeklyOrderCount}/3 approved
                    </span>
                  </div>
                </div>

                {/* THE 5 COMMAND BLOCKS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* BLOCK 1: STRATEGIC ANCHOR & VICTORY CONDITION */}
                  <Card className="lg:col-span-1 border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Block 1: Anchor</span>
                        <Target className="h-4 w-4 text-slate-400" />
                      </div>
                      <CardTitle className="text-base text-[#0A1A2F] font-bold">Strategic Objective</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4 flex-1">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Objective</p>
                        <p className="text-sm font-medium text-slate-800 mt-1">{campaign.objective}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Victory Condition</p>
                        <p className="text-sm text-emerald-700 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/60 font-medium mt-1">
                          {campaign.victoryCondition}
                        </p>
                      </div>
                      {campaign.hypothesis && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase">Core Hypothesis</p>
                          <p className="text-xs text-slate-600 italic mt-0.5">{campaign.hypothesis}</p>
                        </div>
                      )}
                      {campaign.parkedWork && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-xs font-semibold text-rose-600 uppercase">Explicitly Parked / Stop</p>
                          <p className="text-xs text-slate-600 mt-0.5">{campaign.parkedWork}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* BLOCK 2: MATERIAL EVIDENCE & SIGNALS */}
                  <Card className="lg:col-span-1 border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Block 2: Signals</span>
                        <FileText className="h-4 w-4 text-slate-400" />
                      </div>
                      <CardTitle className="text-base text-[#0A1A2F] font-bold">Material Evidence (Max 3)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3 flex-1">
                      {materialEvidence.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          <p>No material evidence currently active.</p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setActiveTab("evidence")}
                            className="text-[#0A1A2F] text-xs mt-1 p-0 h-auto"
                          >
                            + Capture observation
                          </Button>
                        </div>
                      ) : (
                        materialEvidence.map((row, idx) => (
                          <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">{row.evidenceItem.sourceLabel}</span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${
                                  row.relation === "supports"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : row.relation === "contradicts"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {row.relation}
                              </Badge>
                            </div>
                            <p className="text-slate-600 text-xs line-clamp-2">"{row.evidenceItem.observation}"</p>
                            <p className="text-slate-800 font-medium text-[11px] pt-1 border-t border-slate-200/50">
                              Implication: {row.interpretation}
                            </p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* BLOCK 3: CURRENT OPERATIONAL CONSTRAINT */}
                  <Card className="lg:col-span-1 border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Block 3: Focus</span>
                        <AlertTriangle className="h-4 w-4 text-slate-400" />
                      </div>
                      <CardTitle className="text-base text-[#0A1A2F] font-bold">Current Constraint</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3 flex-1">
                      {!constraint ? (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          <p>No primary constraint selected yet.</p>
                          <p className="text-[11px] mt-1 text-slate-500">Unclear or tied constraint states are first-class.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 uppercase text-[10px]">
                              {constraint.state}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              Review: {new Date(constraint.reviewDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{constraint.statement || "Constraint currently unclear"}</p>
                          {constraint.whyItMatters && (
                            <p className="text-xs text-slate-600 bg-amber-50/60 p-2 rounded border border-amber-100">
                              Why it matters: {constraint.whyItMatters}
                            </p>
                          )}
                          {constraint.disproofCondition && (
                            <p className="text-xs text-slate-500 italic">Disproof test: {constraint.disproofCondition}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* BOTTOM 2 BLOCKS: DECISION REQUIRED & ORDERS ISSUED */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* BLOCK 4: DECISION REQUIRED (OR NO DECISION) */}
                  <Card className="border-slate-200/90 shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Block 4: Decision</span>
                        <Compass className="h-4 w-4 text-slate-400" />
                      </div>
                      <CardTitle className="text-base text-[#0A1A2F] font-bold">
                        {decisionRequired ? "Active Decision Point" : "No Decision Required"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {!latestDecision ? (
                        <div className="text-xs text-slate-500 space-y-3">
                          <p className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            No material decision is currently pending for this review window.
                          </p>
                          <div className="pt-2">
                            <p className="font-semibold text-slate-700 mb-2">Record an executive decision:</p>
                            <div className="space-y-2">
                              <Input
                                placeholder="Decision question (e.g. Expand enterprise pilot to APAC?)"
                                value={decisionQuestion}
                                onChange={(e) => setDecisionQuestion(e.target.value)}
                                className="text-xs"
                              />
                              <Button
                                size="sm"
                                disabled={!decisionQuestion}
                                onClick={async () => {
                                  if (!decisionQuestion || !campaign?.id) return;
                                  await recordDecisionMutation.mutateAsync({
                                    productKey,
                                    campaignId: campaign.id,
                                    question: decisionQuestion,
                                    options: ["Approve expansion", "Defer until Q1", "Hold current scope"],
                                    ownerUserId: user.id,
                                  });
                                  setDecisionQuestion("");
                                }}
                                className="bg-[#0A1A2F] text-white text-xs"
                              >
                                Record Decision
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-800">{latestDecision.question}</span>
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 uppercase text-[10px]">
                              {latestDecision.outcome}
                            </Badge>
                          </div>
                          {latestDecision.chosenOption && (
                            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                              <span className="font-bold text-emerald-900">Chosen Path: </span>
                              <span className="text-emerald-800">{latestDecision.chosenOption}</span>
                            </div>
                          )}
                          <p className="text-slate-500 text-[11px]">
                            Approved by Admin ID {latestDecision.approvedByUserId} at{" "}
                            {latestDecision.approvedAt ? new Date(latestDecision.approvedAt).toLocaleString() : "—"}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* BLOCK 5: WEEKLY ORDERS & EXPECTED EVIDENCE */}
                  <Card className="border-slate-200/90 shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Block 5: Action</span>
                        <CheckCircle2 className="h-4 w-4 text-slate-400" />
                      </div>
                      <CardTitle className="text-base text-[#0A1A2F] font-bold">
                        Approved Orders (Max 3 / Week)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {orders.length === 0 ? (
                        <p className="text-xs text-slate-500 py-3">No orders currently approved. Zero orders is a normal state.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {orders.map((o) => (
                            <div key={o.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                              <div className="flex items-center justify-between font-semibold text-slate-800">
                                <span>{o.statement}</span>
                                <Badge variant="outline" className="text-[10px] uppercase">
                                  {o.status}
                                </Badge>
                              </div>
                              <p className="text-slate-600 text-[11px]">
                                Expected Evidence: <span className="font-medium text-slate-800">{o.expectedEvidence}</span>
                              </p>
                              {o.deadline && (
                                <p className="text-[10px] text-slate-400">Due: {new Date(o.deadline).toLocaleDateString()}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Add Order if < 3 */}
                      {weeklyOrderCount < 3 && (
                        <form onSubmit={handleApproveOrder} className="pt-2 border-t border-slate-100 space-y-2">
                          <p className="text-xs font-semibold text-slate-700">Approve Next Bounded Order:</p>
                          <Input
                            placeholder="Specific command / action"
                            value={orderStatement}
                            onChange={(e) => setOrderStatement(e.target.value)}
                            className="text-xs"
                            required
                          />
                          <Input
                            placeholder="Expected evidence outcome (what proves it succeeded?)"
                            value={orderEvidence}
                            onChange={(e) => setOrderEvidence(e.target.value)}
                            className="text-xs"
                            required
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmittingOrder || !orderStatement || !orderEvidence}
                            className="bg-[#0A1A2F] text-white text-xs"
                          >
                            {isSubmittingOrder ? "Approving..." : "Approve Order"}
                          </Button>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB 2: CAPTURE EVIDENCE ── */}
        {activeTab === "evidence" && (
          <Card className="max-w-2xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-[#0A1A2F] font-bold">Capture Strategic Observation</CardTitle>
              <CardDescription className="text-xs">
                Log an observation into the immutable evidence ledger and immediately record human assessment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCaptureAndAssess} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Source Type</label>
                  <select
                    className="w-full border rounded-md p-2 text-xs bg-white"
                    value={evidenceSourceType}
                    onChange={(e) => setEvidenceSourceType(e.target.value as any)}
                  >
                    <option value="manual_note">Manual Executive Note</option>
                    <option value="customer_note">Customer / Client Note</option>
                    <option value="delivery_note">Program Delivery Note</option>
                    <option value="platform_note">Platform Telemetry Note</option>
                    <option value="imported_excerpt">Approved Meeting Excerpt</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Source Label</label>
                  <Input
                    placeholder="e.g. Q3 Broadridge Sponsor Debrief"
                    value={evidenceSourceLabel}
                    onChange={(e) => setEvidenceSourceLabel(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">External Reference (Optional)</label>
                  <Input
                    placeholder="Document or meeting ID (no external sync in V1)"
                    value={evidenceSourceRef}
                    onChange={(e) => setEvidenceSourceRef(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Observation (Factual & Specific)</label>
                  <Textarea
                    placeholder="What was observed or stated? Avoid conflating interpretation with fact."
                    rows={4}
                    value={evidenceObservation}
                    onChange={(e) => setEvidenceObservation(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="font-bold text-slate-800 mb-2">Human Assessment</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Relation to Campaign</label>
                      <select
                        className="w-full border rounded-md p-2 text-xs bg-white"
                        value={evidenceRelation}
                        onChange={(e) => setEvidenceRelation(e.target.value as any)}
                      >
                        <option value="supports">Supports Hypothesis</option>
                        <option value="contradicts">Contradicts Hypothesis</option>
                        <option value="does_not_answer">Does Not Answer</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Strategic Interpretation</label>
                    <Input
                      placeholder="Why does this matter to the current decision loop?"
                      value={evidenceInterpretation}
                      onChange={(e) => setEvidenceInterpretation(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingEvidence || !evidenceObservation}
                  className="w-full bg-[#0A1A2F] text-white mt-2"
                >
                  {isSubmittingEvidence ? "Recording Evidence..." : "Record in War Room"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── TAB 3: WEEKLY REVIEW ── */}
        {activeTab === "review" && (
          <Card className="max-w-2xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-[#0A1A2F] font-bold">Close Weekly Review Cycle</CardTitle>
              <CardDescription className="text-xs">
                Compare original expectations against actual evidence to synthesize organizational learning.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCloseReview} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Original Expected Belief</label>
                  <Textarea
                    placeholder="What did we believe when we opened this cycle?"
                    rows={2}
                    value={reviewBelief}
                    onChange={(e) => setReviewBelief(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Actions Taken</label>
                  <Textarea
                    placeholder="What orders were executed or investigated?"
                    rows={2}
                    value={reviewActions}
                    onChange={(e) => setReviewActions(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Actual Evidence Realized</label>
                  <Textarea
                    placeholder="What factual evidence arrived?"
                    rows={3}
                    value={reviewActual}
                    onChange={(e) => setReviewActual(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Hypothesis State</label>
                    <select
                      className="w-full border rounded-md p-2 text-xs bg-white"
                      value={reviewHypothesisStatus}
                      onChange={(e) => setReviewHypothesisStatus(e.target.value as any)}
                    >
                      <option value="strengthened">Strengthened</option>
                      <option value="weakened">Weakened</option>
                      <option value="unanswered">Unanswered</option>
                      <option value="invalidated">Invalidated</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Cycle Decision</label>
                    <select
                      className="w-full border rounded-md p-2 text-xs bg-white"
                      value={reviewDecisionOutcome}
                      onChange={(e) => setReviewDecisionOutcome(e.target.value as any)}
                    >
                      <option value="continue">Continue</option>
                      <option value="modify">Modify</option>
                      <option value="pause">Pause</option>
                      <option value="kill">Kill</option>
                      <option value="none">No Decision</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingReview || !reviewBelief || !reviewActual}
                  className="w-full bg-[#0A1A2F] text-white mt-2"
                >
                  {isSubmittingReview ? "Closing Review..." : "Close Review & Update Command Center"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── TAB 4: CAMPAIGN CONFIGURATION ── */}
        {activeTab === "campaign" && (
          <Card className="max-w-2xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-[#0A1A2F] font-bold">
                {campaign ? "Edit Campaign Anchors" : "Establish Strategic Campaign"}
              </CardTitle>
              <CardDescription className="text-xs">
                One active campaign per LevelNext product to anchor executive attention.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Campaign Name</label>
                  <Input
                    placeholder="e.g. GCC Strategic Influence Expansion"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Objective</label>
                  <Textarea
                    placeholder="What are we trying to make true?"
                    rows={2}
                    value={campaignObjective}
                    onChange={(e) => setCampaignObjective(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Observable Victory Condition</label>
                  <Textarea
                    placeholder="How will we know we won? Observable and falsifiable."
                    rows={2}
                    value={campaignVictory}
                    onChange={(e) => setCampaignVictory(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Core Hypothesis (Optional)</label>
                  <Input
                    placeholder="What must be true for this to work?"
                    value={campaignHypothesis}
                    onChange={(e) => setCampaignHypothesis(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Campaign Deadline</label>
                    <Input
                      type="date"
                      value={campaignDeadline}
                      onChange={(e) => setCampaignDeadline(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Next Review Date</label>
                    <Input
                      type="date"
                      value={campaignReviewDate}
                      onChange={(e) => setCampaignReviewDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="font-bold text-slate-800 mb-2">Lead Indicator (Max 1 in initial setup)</p>
                  <div className="space-y-2">
                    <Input
                      placeholder="Indicator Label (e.g. Sponsor Re-engagement Rate)"
                      value={indicatorLabel}
                      onChange={(e) => setIndicatorLabel(e.target.value)}
                    />
                    <Input
                      placeholder="Definition / Formula"
                      value={indicatorDef}
                      onChange={(e) => setIndicatorDef(e.target.value)}
                    />
                    <Input
                      placeholder="Decision Implication (what decision changes if this moves?)"
                      value={indicatorImplication}
                      onChange={(e) => setIndicatorImplication(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Explicitly Parked Work (Stop / Later)</label>
                  <Input
                    placeholder="Work deliberately not receiving attention"
                    value={campaignParked}
                    onChange={(e) => setCampaignParked(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingCampaign || !campaignName || !campaignObjective || !campaignVictory}
                  className="w-full bg-[#0A1A2F] text-white mt-2"
                >
                  {isSubmittingCampaign ? "Activating Campaign..." : "Activate War Room Campaign"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </PlatformLayout>
  );
}
