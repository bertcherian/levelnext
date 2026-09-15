/**
 * Leadership Work Genome Scan™ — Interactive Conversational Experience
 *
 * Implements:
 *   - AI-guided conversational interview without complex time studies
 *   - Structured activity extraction across the 8 standard leadership work categories
 *   - Altitude benchmark selection (Manager, Senior Leader, Executive)
 *   - Immediate deterministic capacity allocation & recoverable hours calculation
 *   - Direct generation of Opportunity Scan & 3 High-Leverage Behaviors
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  Plus,
  Trash2,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  LEADERSHIP_WORK_CATEGORIES,
  LEADERSHIP_WORK_CATEGORY_LABELS,
  WORK_AT_LEVEL_STATUS,
  WORK_REALLOCATION_TAXONOMY,
  WORK_REALLOCATION_LABELS,
  type LeadershipWorkCategory,
  type WorkAtLevelStatus,
  type WorkReallocationTaxonomy,
  type WorkActivityInput,
} from "@shared/modules/effectivenessIntelligence";

export default function WorkGenomeScan() {
  const [, setLocation] = useLocation();
  const [altitude, setAltitude] = useState<"manager" | "senior_leader" | "executive">("manager");
  const [totalWorkHours, setTotalWorkHours] = useState<number>(45);
  const [contextNotes, setContextNotes] = useState<string>("");

  // Default suggested activity templates based on real leadership patterns
  const [activities, setActivities] = useState<WorkActivityInput[]>([
    {
      title: "Sprint Review & Operational Blocker Syncs",
      category: "operational_execution",
      weeklyHours: 10,
      frequency: "daily",
      workAtLevel: "below_level",
      reallocation: "eliminate",
      judgmentRequirement: "low",
      delegationPotential: "full",
      aiAugmentationPotential: "drafting",
      notes: "Validating operational details that the team lead can own.",
    },
    {
      title: "Routine Approvals, Expense Reports & Status Rollups",
      category: "administrative_reporting",
      weeklyHours: 4,
      frequency: "weekly",
      workAtLevel: "below_level",
      reallocation: "automate",
      judgmentRequirement: "low",
      delegationPotential: "full",
      aiAugmentationPotential: "full",
      notes: "Manual checking could be replaced by auto-thresholds.",
    },
    {
      title: "Cross-Functional Alignment Syncs",
      category: "meetings_coordination",
      weeklyHours: 8,
      frequency: "weekly",
      workAtLevel: "at_level",
      reallocation: "simplify",
      judgmentRequirement: "medium",
      delegationPotential: "partial",
      aiAugmentationPotential: "drafting",
      notes: "Status updates could be async before the call.",
    },
    {
      title: "Direct Report Coaching & 1-on-1s",
      category: "people_development",
      weeklyHours: 5,
      frequency: "weekly",
      workAtLevel: "at_level",
      reallocation: "elevate",
      judgmentRequirement: "high",
      delegationPotential: "none",
      aiAugmentationPotential: "none",
      notes: "High leverage capability multiplier; needs protected time.",
    },
    {
      title: "Strategic Architecture & Roadmap Thinking",
      category: "strategic_thinking",
      weeklyHours: 3,
      frequency: "weekly",
      workAtLevel: "above_level_strategic",
      reallocation: "elevate",
      judgmentRequirement: "high",
      delegationPotential: "none",
      aiAugmentationPotential: "analysis",
      notes: "Frequently preempted by unexpected operational escalations.",
    },
    {
      title: "Urgent Customer / Incident Escalations",
      category: "firefighting_reactive",
      weeklyHours: 6,
      frequency: "weekly",
      workAtLevel: "at_level",
      reallocation: "simplify",
      judgmentRequirement: "medium",
      delegationPotential: "partial",
      aiAugmentationPotential: "none",
      notes: "Repeated escalations point to unclear decision rights.",
    },
  ]);

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<LeadershipWorkCategory>("operational_execution");
  const [newHours, setNewHours] = useState<number>(3);
  const [newWorkAtLevel, setNewWorkAtLevel] = useState<WorkAtLevelStatus>("below_level");
  const [newReallocation, setNewReallocation] = useState<WorkReallocationTaxonomy>("simplify");

  const submitMutation = trpc.effectiveness.submitWorkScan.useMutation({
    onSuccess: (data) => {
      toast.success("Leadership Work Genome analyzed!", {
        description: `Capacity Gap: ${data.gapScore}/100. Recoverable hours: ~${data.recoverableHours}h/week.`,
      });
      setLocation("/manager");
    },
    onError: (err) => {
      toast.error("Failed to analyze Work Genome", {
        description: err.message,
      });
    },
  });

  const handleAddActivity = () => {
    if (!newTitle.trim()) {
      toast.error("Please provide an activity name");
      return;
    }
    setActivities([
      ...activities,
      {
        title: newTitle.trim(),
        category: newCategory,
        weeklyHours: newHours,
        frequency: "weekly",
        workAtLevel: newWorkAtLevel,
        reallocation: newReallocation,
        judgmentRequirement: "medium",
        delegationPotential: newWorkAtLevel === "below_level" ? "full" : "partial",
        aiAugmentationPotential: "drafting",
      },
    ]);
    setNewTitle("");
    setNewHours(2);
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const totalAssignedHours = activities.reduce((acc, a) => acc + a.weeklyHours, 0);

  const handleSubmit = () => {
    if (activities.length < 3) {
      toast.error("Please capture at least 3 representative leadership activities");
      return;
    }
    submitMutation.mutate({
      altitude,
      totalWorkHours,
      activities,
      contextNotes: contextNotes.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: "var(--color-ln-ivory, #F8F5F0)" }}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="rounded-2xl p-8" style={{ background: "var(--color-ln-navy, #0A1A2F)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: "oklch(from #D4AF37 l c h / 0.18)", color: "#F6E05E" }}>
                <Sparkles size={14} /> LevelNext Effectiveness Intelligence™
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Leadership Work Genome Scan</h1>
              <p className="text-sm max-w-2xl leading-relaxed" style={{ color: "oklch(78% 0.02 248.6)" }}>
                Understand where your leadership capacity is actually going. We identify work below your altitude, avoidable coordination tax, and the highest-leverage shifts to recover focus for strategy and people development.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#D4AF37" }}>Privacy Standard</span>
              <span className="text-xs text-slate-300 mt-1">Private to you & coach</span>
            </div>
          </div>
        </div>

        {/* Step 1: Altitude & Workweek baseline */}
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: "var(--color-ln-navy)" }}>
              <Briefcase size={18} style={{ color: "#D4AF37" }} /> 1. Operating Altitude & Total Capacity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">Your Current Leadership Altitude</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "manager", title: "Manager / Team Lead", desc: "Leading teams, delegation, execution, coaching" },
                  { id: "senior_leader", title: "Senior Leader / Director", desc: "Leading managers, cross-functional strategy" },
                  { id: "executive", title: "Executive / VP / CXO", desc: "Enterprise decisions, vision, culture, governance" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAltitude(item.id as any)}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      altitude === item.id
                        ? "border-[#D4AF37] bg-amber-50/40 shadow-sm ring-1 ring-[#D4AF37]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Weekly Leadership Hours Baseline</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={20}
                    max={80}
                    value={totalWorkHours}
                    onChange={(e) => setTotalWorkHours(Number(e.target.value))}
                    className="max-w-[140px]"
                  />
                  <span className="text-xs text-slate-500">hours/week typically worked</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Logged Activities Total</label>
                <p className="text-sm font-semibold text-slate-700 mt-2">
                  <span className="text-lg font-bold text-[#0A1A2F]">{totalAssignedHours}</span> / {totalWorkHours} hours mapped
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Work Genome Activity Inventory */}
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: "var(--color-ln-navy)" }}>
                <Clock size={18} style={{ color: "#D4AF37" }} /> 2. Leadership Activity Inventory ({activities.length} logged)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {activities.map((act, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-slate-900">{act.title}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {LEADERSHIP_WORK_CATEGORY_LABELS[act.category]}
                      </Badge>
                      {act.workAtLevel === "below_level" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Below Level
                        </span>
                      )}
                      {act.workAtLevel === "above_level_strategic" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Strategic Elevation
                        </span>
                      )}
                    </div>
                    {act.notes && <p className="text-xs text-slate-500 mt-1">{act.notes}</p>}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center flex-shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">{act.weeklyHours}h</span>
                      <span className="text-xs text-slate-400 block">/week</span>
                    </div>
                    <Badge className="text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-100">
                      {WORK_REALLOCATION_LABELS[act.reallocation].label}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Remove activity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Custom Activity Form */}
            <div className="mt-4 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">Add Meaningful Leadership Activity</span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <Input
                    placeholder="Activity name (e.g. Incident postmortems, Architecture review)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-2 text-slate-700"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                  >
                    {LEADERSHIP_WORK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {LEADERSHIP_WORK_CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0.5}
                      max={20}
                      step={0.5}
                      value={newHours}
                      onChange={(e) => setNewHours(Number(e.target.value))}
                      className="text-xs bg-white"
                    />
                    <span className="text-[11px] text-slate-500">h/wk</span>
                  </div>
                </div>
                <div className="sm:col-span-3 flex items-center gap-2">
                  <select
                    className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-2 text-slate-700"
                    value={newWorkAtLevel}
                    onChange={(e) => setNewWorkAtLevel(e.target.value as any)}
                  >
                    <option value="below_level">Below Level</option>
                    <option value="at_level">At Level</option>
                    <option value="above_level_strategic">Strategic / Above</option>
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddActivity}
                    className="flex-shrink-0 text-xs font-semibold"
                    style={{ background: "#0A1A2F" }}
                  >
                    <Plus size={14} className="mr-1" /> Add
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Optional Context Notes & Submission */}
        <Card className="border border-slate-200/80 shadow-sm rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: "var(--color-ln-navy)" }}>
              <TrendingUp size={18} style={{ color: "#D4AF37" }} /> 3. Current Pressures & Organizational Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full min-h-[80px] p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] placeholder:text-slate-400"
              placeholder="What current transformations, team capabilities, or stakeholder expectations are shaping your leadership capacity right now?"
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Deterministic scoring + structured synthesis. No private conversations shared.</span>
              </div>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="w-full sm:w-auto font-bold text-sm px-8"
                style={{ background: "var(--color-ln-navy, #0A1A2F)", color: "white" }}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" /> Analyzing Work Genome…
                  </>
                ) : (
                  <>
                    Generate Effectiveness Opportunity Scan <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
