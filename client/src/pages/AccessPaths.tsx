import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LLMProcessingSkeleton } from "@/components/SkeletonLoader";
import {
  Route, Zap, ChevronDown, ChevronUp, Copy, Building2,
  Target, Users, Mail, Linkedin, AlertCircle, CheckCircle2,
  Clock, TrendingUp, Star, ArrowRight, RefreshCw, MapPin
} from "lucide-react";

type PathVariant = {
  description: string;
  steps: string[];
  keyContact?: string;
  estimatedTimeWeeks: number;
  confidenceScore: number;
};

type MutualConnection = {
  contactName: string;
  connectionType: string;
  strengthOfLink: string;
  suggestedAsk: string;
};

type DecisionMaker = {
  name: string;
  title: string;
  linkedinUrl?: string;
  whyTheyMatter: string;
};

type AccessPathRecord = {
  id: number;
  opportunityId: number;
  companyName: string;
  targetRole?: string | null;
  overallAccessScore?: number | null;
  primaryBarrier?: string | null;
  keyInsight?: string | null;
  status: string;
  bestPath?: PathVariant | null;
  alternativePath?: PathVariant | null;
  fastestPath?: PathVariant | null;
  safestPath?: PathVariant | null;
  highestProbabilityPath?: PathVariant | null;
  decisionMakers?: DecisionMaker[] | null;
  mutualConnections?: MutualConnection[] | null;
  warmIntroRequest?: string | null;
  directOutreachEmail?: string | null;
  linkedinMessage?: string | null;
};

type Opportunity = {
  id: number;
  companyName: string;
  potentialRole?: string | null;
  industry?: string | null;
  geography?: string | null;
  companyType?: string | null;
  compositeScore?: number | null;
  status?: string | null;
  hiddenOpportunitySignal?: string | null;
};

const PATH_VARIANTS = [
  { key: "bestPath", label: "Best Path", icon: Star, color: "text-[#C9A84C]", bg: "bg-amber-50 border-amber-200" },
  { key: "highestProbabilityPath", label: "Highest Probability", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  { key: "fastestPath", label: "Fastest Path", icon: Zap, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  { key: "safestPath", label: "Safest Path", icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  { key: "alternativePath", label: "Alternative Path", icon: Route, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
];

function PathCard({ variant, path }: { variant: typeof PATH_VARIANTS[0]; path: PathVariant }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = variant.icon;
  return (
    <div className={`rounded-xl border p-4 ${variant.bg}`}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${variant.color}`} />
          <span className={`text-sm font-semibold ${variant.color}`}>{variant.label}</span>
          <div className="flex items-center gap-1 ml-2">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{path.estimatedTimeWeeks}w</span>
            <span className="text-xs text-gray-400 ml-1">·</span>
            <span className="text-xs text-gray-500">{path.confidenceScore}/10 confidence</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>
      <p className="text-sm text-gray-700 mt-2">{path.description}</p>
      {expanded && (
        <div className="mt-3 space-y-2">
          {path.keyContact && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-600">Key contact: <strong>{path.keyContact}</strong></span>
            </div>
          )}
          <ol className="space-y-1.5 mt-2">
            {path.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${variant.color} bg-white border`}>{i + 1}</span>
                <span className="text-xs text-gray-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function OutreachBlock({ label, icon: Icon, content }: { label: string; icon: React.ElementType; content: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={copy}>
          {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{content}</p>
    </div>
  );
}

export default function AccessPaths() {
  const [selectedOppId, setSelectedOppId] = useState<number | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"paths" | "people" | "outreach">("paths");

  const { data: opps = [], isLoading: oppsLoading } = trpc.careerAccess.getOpportunityUniverse.useQuery({});
  const { data: allPaths = [], refetch: refetchPaths } = trpc.careerAccess.getAccessPaths.useQuery();

  const generateMutation = trpc.careerAccess.generateAccessPath.useMutation({
    onSuccess: () => {
      toast.success("Access path generated");
      setGeneratingId(null);
      refetchPaths();
    },
    onError: (e) => { toast.error(e.message); setGeneratingId(null); },
  });

  const updateStatusMutation = trpc.careerAccess.updateAccessPathStatus.useMutation({
    onSuccess: () => { refetchPaths(); toast.success("Status updated"); },
    onError: (e) => toast.error(e.message),
  });

  const logActivationMutation = trpc.careerAccess.logAccessPathActivation.useMutation({
    onSuccess: (data) => {
      refetchPaths();
      setActivationModal(null);
      setActivationForm({ whatYouDid: "", outcome: "sent_message", notes: "", followUpDate: "" });
      if (data.pipelineAutoAdvanced) {
        toast.success("Activation logged! Pipeline stage auto-advanced to Active.");
      } else {
        toast.success("Activation logged! Path marked as Activated.");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const [activationModal, setActivationModal] = useState<{ pathId: number; companyName: string } | null>(null);
  const [activationForm, setActivationForm] = useState({ whatYouDid: "", outcome: "sent_message" as "sent_message" | "had_call" | "got_intro" | "applied" | "other", notes: "", followUpDate: "" });

  function handleStatusClick(opt: { value: string; label: string; color: string }, pathId: number, companyName: string) {
    if (opt.value === "activated") {
      setActivationModal({ pathId, companyName });
    } else {
      updateStatusMutation.mutate({ id: pathId, status: opt.value });
    }
  }

  const STATUS_OPTIONS = [
    { value: "not_started", label: "Not Started", color: "bg-gray-100 text-gray-600 border-gray-200" },
    { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "activated", label: "Activated", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  ] as const;

  const activeOpps = (opps as Opportunity[]).filter(o => o.status !== "removed");
  const selectedOpp = activeOpps.find(o => o.id === selectedOppId) ?? null;
  const selectedPath = (allPaths as AccessPathRecord[]).find(p => p.opportunityId === selectedOppId) ?? null;

  function handleGenerate(oppId: number) {
    setGeneratingId(oppId);
    generateMutation.mutate({ opportunityId: oppId });
  }

  function getPathCount(oppId: number) {
    return (allPaths as AccessPathRecord[]).find(p => p.opportunityId === oppId) ? "✓" : null;
  }

  const TABS = [
    { key: "paths", label: "Access Paths", icon: Route },
    { key: "people", label: "Decision Makers", icon: Users },
    { key: "outreach", label: "Outreach Drafts", icon: Mail },
  ] as const;

  return (
    <PlatformLayout title="Access Path Intelligence">
      <div className="min-h-screen bg-[#F5F0E8]">
        <div className="flex h-[calc(100vh-64px)]">
          {/* Left: Opportunity List */}
          <div className="w-72 shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#0A1628]">Target Organisations</h2>
              <p className="text-xs text-gray-400 mt-0.5">Select a company to generate access paths</p>
            </div>
            {oppsLoading ? (
              <div className="p-4 space-y-3">
                <div className="h-4 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 rounded bg-gray-100 animate-pulse w-3/4" />
                <div className="h-4 rounded bg-gray-100 animate-pulse w-1/2" />
              </div>
            ) : activeOpps.length === 0 ? (
              <div className="p-6 text-center">
                <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No target organisations yet. Generate your Opportunity Universe first.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activeOpps.map(opp => {
                  const hasPath = getPathCount(opp.id);
                  const isSelected = selectedOppId === opp.id;
                  return (
                    <div
                      key={opp.id}
                      className={`p-3 cursor-pointer hover:bg-amber-50 transition-colors ${isSelected ? "bg-amber-50 border-l-2 border-[#C9A84C]" : ""}`}
                      onClick={() => { setSelectedOppId(opp.id); setActiveTab("paths"); }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0A1628] truncate">{opp.companyName}</p>
                          {opp.potentialRole && <p className="text-xs text-gray-500 truncate">{opp.potentialRole}</p>}
                          {opp.geography && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-gray-400" />
                              <span className="text-xs text-gray-400">{opp.geography}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {opp.compositeScore != null && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              opp.compositeScore >= 70 ? "bg-emerald-100 text-emerald-700" :
                              opp.compositeScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                            }`}>{opp.compositeScore}</span>
                          )}
                          {hasPath && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Access Path Detail */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedOpp ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Route className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-lg font-semibold text-[#0A1628] mb-2">Select a Target Organisation</h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  Choose a company from the left to generate AI-powered access paths, identify decision makers, and get outreach message drafts.
                </p>
              </div>
            ) : (
              <>
                {/* Company Header */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#0A1628]">{selectedOpp.companyName}</h2>
                      {selectedOpp.potentialRole && <p className="text-sm text-gray-500 mt-0.5">Target: {selectedOpp.potentialRole}</p>}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {selectedOpp.industry && <Badge variant="outline" className="text-xs">{selectedOpp.industry}</Badge>}
                        {selectedOpp.geography && <Badge variant="outline" className="text-xs">{selectedOpp.geography}</Badge>}
                        {selectedOpp.companyType && <Badge variant="outline" className="text-xs">{selectedOpp.companyType}</Badge>}
                      </div>
                      {selectedOpp.hiddenOpportunitySignal && (
                        <div className="flex items-start gap-2 mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2">
                          <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700">{selectedOpp.hiddenOpportunitySignal}</p>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {selectedPath ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          disabled={generatingId === selectedOpp.id}
                          onClick={() => handleGenerate(selectedOpp.id)}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${generatingId === selectedOpp.id ? "animate-spin" : ""}`} />
                          Regenerate
                        </Button>
                      ) : (
                        <Button
                          className="bg-[#C9A84C] hover:bg-[#b8963e] text-white gap-2"
                          disabled={generatingId === selectedOpp.id}
                          onClick={() => handleGenerate(selectedOpp.id)}
                        >
                          {generatingId === selectedOpp.id ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                          ) : (
                            <><Route className="w-4 h-4" /> Generate Access Path</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {selectedPath && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400 font-medium">Status:</span>
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusClick(opt, selectedPath.id, selectedOpp.companyName)}
                          className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                            selectedPath.status === opt.value
                              ? opt.color + " ring-2 ring-offset-1 ring-current"
                              : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedPath && (
                    <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${
                          (selectedPath.overallAccessScore ?? 0) >= 7 ? "text-emerald-600" :
                          (selectedPath.overallAccessScore ?? 0) >= 5 ? "text-amber-600" : "text-rose-600"
                        }`}>{selectedPath.overallAccessScore ?? "–"}/10</p>
                        <p className="text-xs text-gray-400">Access Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#0A1628]">{selectedPath.decisionMakers?.length ?? 0}</p>
                        <p className="text-xs text-gray-400">Decision Makers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#0A1628]">{selectedPath.mutualConnections?.length ?? 0}</p>
                        <p className="text-xs text-gray-400">Mutual Connections</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Generating skeleton */}
                {generatingId === selectedOpp?.id && !selectedPath && (
                  <LLMProcessingSkeleton
                    title="Generating access paths…"
                    subtitle="Our AI is identifying decision makers, mutual connections, and outreach strategies."
                    steps={["Researching company", "Identifying decision makers", "Mapping connections", "Drafting outreach"]}
                    className="min-h-[300px]"
                  />
                )}

                {selectedPath && (
                  <>
                    {/* Key Insight + Barrier */}
                    {(selectedPath.keyInsight || selectedPath.primaryBarrier) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        {selectedPath.keyInsight && (
                          <div className="bg-[#0A1628] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="w-4 h-4 text-[#C9A84C]" />
                              <span className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wide">Key Insight</span>
                            </div>
                            <p className="text-sm text-white">{selectedPath.keyInsight}</p>
                          </div>
                        )}
                        {selectedPath.primaryBarrier && (
                          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Primary Barrier</span>
                            </div>
                            <p className="text-sm text-rose-800">{selectedPath.primaryBarrier}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-4 w-fit">
                      {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              activeTab === tab.key
                                ? "bg-[#0A1628] text-white"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab: Access Paths */}
                    {activeTab === "paths" && (
                      <div className="space-y-3">
                        {PATH_VARIANTS.map(v => {
                          const path = (selectedPath as unknown as Record<string, PathVariant | null>)[v.key];
                          if (!path) return null;
                          return <PathCard key={v.key} variant={v} path={path} />;
                        })}
                        {/* Mutual Connections */}
                        {(selectedPath.mutualConnections ?? []).length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="w-4 h-4 text-[#C9A84C]" />
                              <span className="text-sm font-semibold text-[#0A1628]">Mutual Connections to Leverage</span>
                            </div>
                            <div className="space-y-3">
                              {(selectedPath.mutualConnections ?? []).map((mc, i) => (
                                <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                  <div className="w-7 h-7 rounded-full bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-[#C9A84C]">{mc.contactName.charAt(0)}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium text-[#0A1628]">{mc.contactName}</span>
                                      <Badge variant="outline" className="text-xs py-0">{mc.connectionType}</Badge>
                                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                        mc.strengthOfLink === "Strong" ? "bg-emerald-100 text-emerald-700" :
                                        mc.strengthOfLink === "Medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                                      }`}>{mc.strengthOfLink}</span>
                                    </div>
                                    <div className="flex items-start gap-1 mt-1">
                                      <ArrowRight className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                                      <p className="text-xs text-gray-600">{mc.suggestedAsk}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab: Decision Makers */}
                    {activeTab === "people" && (
                      <div className="space-y-3">
                        {(selectedPath.decisionMakers ?? []).length === 0 ? (
                          <div className="text-center py-8 text-gray-400 text-sm">No decision makers identified.</div>
                        ) : (
                          (selectedPath.decisionMakers ?? []).map((dm, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-[#0A1628]">{dm.name}</p>
                                  <p className="text-sm text-gray-500">{dm.title}</p>
                                  <p className="text-xs text-gray-600 mt-2">{dm.whyTheyMatter}</p>
                                </div>
                                {dm.linkedinUrl && (
                                  <a href={dm.linkedinUrl.startsWith("http") ? dm.linkedinUrl : `https://${dm.linkedinUrl}`} target="_blank" rel="noreferrer">
                                    <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
                                      <Linkedin className="w-3.5 h-3.5" /> View
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Tab: Outreach Drafts */}
                    {activeTab === "outreach" && (
                      <div className="space-y-4">
                        {selectedPath.warmIntroRequest && (
                          <OutreachBlock label="Warm Introduction Request" icon={Users} content={selectedPath.warmIntroRequest} />
                        )}
                        {selectedPath.linkedinMessage && (
                          <OutreachBlock label="LinkedIn Connection Note" icon={Linkedin} content={selectedPath.linkedinMessage} />
                        )}
                        {selectedPath.directOutreachEmail && (
                          <OutreachBlock label="Direct Outreach Email (Last Resort)" icon={Mail} content={selectedPath.directOutreachEmail} />
                        )}
                        {!selectedPath.warmIntroRequest && !selectedPath.linkedinMessage && !selectedPath.directOutreachEmail && (
                          <div className="text-center py-8 text-gray-400 text-sm">No outreach drafts available.</div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {!selectedPath && generatingId !== selectedOpp.id && (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                    <Route className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-[#0A1628] mb-2">No access path yet</h3>
                    <p className="text-sm text-gray-400 mb-4">Generate an AI-powered access strategy for {selectedOpp.companyName}.</p>
                    <Button
                      className="bg-[#C9A84C] hover:bg-[#b8963e] text-white gap-2"
                      onClick={() => handleGenerate(selectedOpp.id)}
                    >
                      <Route className="w-4 h-4" /> Generate Access Path
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {/* Activation Log Modal */}
      {activationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#0A1628]">Log Your Activation</h3>
                <p className="text-xs text-gray-500">{activationModal.companyName}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">You're marking this path as <strong>Activated</strong>. What did you do to activate it?</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">What did you do?</label>
                <textarea
                  value={activationForm.whatYouDid}
                  onChange={(e) => setActivationForm(f => ({ ...f, whatYouDid: e.target.value }))}
                  placeholder="e.g. Sent a LinkedIn message to the VP of Engineering, introduced myself through Rahul..."
                  className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2">Type of action</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: "sent_message", label: "Sent Message" },
                    { value: "had_call", label: "Had a Call" },
                    { value: "got_intro", label: "Got an Intro" },
                    { value: "applied", label: "Applied" },
                    { value: "other", label: "Other" },
                  ] as const).map(o => (
                    <button
                      key={o.value}
                      onClick={() => setActivationForm(f => ({ ...f, outcome: o.value }))}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                        activationForm.outcome === o.value
                          ? "bg-emerald-100 text-emerald-700 border-emerald-300 ring-2 ring-emerald-300 ring-offset-1"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >{o.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Notes (optional)</label>
                <textarea
                  value={activationForm.notes}
                  onChange={(e) => setActivationForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any context, next steps, or follow-up reminders..."
                  className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Follow-up date (optional)</label>
                <input
                  type="date"
                  value={activationForm.followUpDate}
                  onChange={(e) => setActivationForm(f => ({ ...f, followUpDate: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <p className="text-[10px] text-gray-400 mt-1">Set a reminder — your Chief of Staff will nudge you on this date.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setActivationModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >Cancel</button>
              <button
                onClick={() => logActivationMutation.mutate({ accessPathId: activationModal.pathId, whatYouDid: activationForm.whatYouDid, outcome: activationForm.outcome, notes: activationForm.notes, followUpDate: activationForm.followUpDate || undefined })}
                disabled={!activationForm.whatYouDid.trim() || logActivationMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >{logActivationMutation.isPending ? "Saving..." : "Log Activation"}</button>
            </div>
          </div>
        </div>
      )}
    </PlatformLayout>
  );
}
