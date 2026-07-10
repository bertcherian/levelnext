import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Building2, Globe, Upload, Users, Palette, Rocket, CheckCircle,
  ArrowRight, ArrowLeft, Loader2, Plus, X, Trash2, ChevronDown,
  ChevronUp, FileText, Sparkles, Shield, Target, Zap, BookOpen,
  AlertCircle, Check,
} from "lucide-react";
import type { OrgValue, OrgCompetency, OrgStrategicPriority, OrgBranding } from "../../../drizzle/schema";

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Welcome", icon: Rocket },
  { id: 2, label: "Company Profile", icon: Building2 },
  { id: 3, label: "Mission & Values", icon: BookOpen },
  { id: 4, label: "Leadership Framework", icon: Target },
  { id: 5, label: "Documents", icon: FileText },
  { id: 6, label: "Branding", icon: Palette },
  { id: 7, label: "Team Setup", icon: Users },
  { id: 8, label: "Launch", icon: Rocket },
];

const INDUSTRIES = [
  "Technology", "Financial Services", "Healthcare", "Manufacturing",
  "Retail & Consumer", "Professional Services", "Energy", "Telecommunications",
  "Media & Entertainment", "Education", "Government", "Non-profit", "Other",
];

const COMPANY_SIZES = [
  "1–50", "51–200", "201–500", "501–1,000", "1,001–5,000",
  "5,001–10,000", "10,001–50,000", "50,000+",
];

const DOC_CATEGORIES = [
  "Mission, Vision & Values", "Leadership Competency Framework", "Strategy Presentation",
  "Performance Management Framework", "Leadership Behaviours", "Culture Framework",
  "Employee Handbook", "Organisational Structure", "Ways of Working",
  "Annual Report", "Learning Curriculum", "Other",
];

const LEVELNEXT_CAPABILITIES = [
  "Strategic Thinking", "Decision-Making", "Execution Discipline", "Ownership",
  "Leadership Influence", "Executive Communication", "Stakeholder Management",
  "People Leadership", "Coaching & Development", "Delegation", "Innovation",
  "Collaboration", "Psychological Safety", "Customer Orientation",
  "Self-Leadership", "Adaptability", "Business Acumen",
];

type SetupRoute = "upload" | "build" | "standard";

interface WizardState {
  orgId: number | null;
  setupRoute: SetupRoute | null;
  // Step 2
  legalName: string;
  displayName: string;
  website: string;
  logoUrl: string;
  industry: string;
  subIndustry: string;
  companySize: string;
  hq: string;
  primaryLanguage: string;
  description: string;
  isGcc: boolean;
  // Step 3
  missionStatement: string;
  visionStatement: string;
  purposeStatement: string;
  values: OrgValue[];
  strategicPriorities: OrgStrategicPriority[];
  // Step 4
  competencies: OrgCompetency[];
  // Step 6
  branding: OrgBranding;
  // Step 7
  invitations: { email: string; role: "owner" | "admin" | "member" }[];
}

const DEFAULT_STATE: WizardState = {
  orgId: null,
  setupRoute: null,
  legalName: "",
  displayName: "",
  website: "",
  logoUrl: "",
  industry: "",
  subIndustry: "",
  companySize: "",
  hq: "",
  primaryLanguage: "English",
  description: "",
  isGcc: false,
  missionStatement: "",
  visionStatement: "",
  purposeStatement: "",
  values: [],
  strategicPriorities: [],
  competencies: [],
  branding: { primaryColor: "#12345A", preferredLanguage: "English", terminology: [] },
  invitations: [],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((step) => (
        <div
          key={step.id}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: step.id === current ? 24 : 8,
            background: step.id < current ? "var(--color-ln-gold)" : step.id === current ? "var(--color-ln-navy)" : "var(--color-ln-border)",
          }}
        />
      ))}
    </div>
  );
}

function SectionLabel({ required, label }: { required?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-lg font-bold" style={{ color: "var(--color-ln-navy)" }}>{label}</h2>
      {required && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
          style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)", color: "var(--color-ln-navy)" }}>
          Required
        </span>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-ln-navy)" }}>{label}</label>
      {hint && <p className="text-xs mb-2" style={{ color: "var(--color-ln-muted)" }}>{hint}</p>}
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
      style={{
        border: "1.5px solid var(--color-ln-border)",
        background: "white",
        color: "var(--color-ln-text)",
      }}
      onFocus={(e) => (e.target.style.borderColor = "var(--color-ln-navy)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--color-ln-border)")}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
      style={{
        border: "1.5px solid var(--color-ln-border)",
        background: "white",
        color: "var(--color-ln-text)",
      }}
      onFocus={(e) => (e.target.style.borderColor = "var(--color-ln-navy)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--color-ln-border)")}
    />
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all appearance-none"
      style={{
        border: "1.5px solid var(--color-ln-border)",
        background: "white",
        color: value ? "var(--color-ln-text)" : "var(--color-ln-muted)",
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function AIBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.15)", color: "oklch(from var(--color-ln-gold) 40% c h)" }}>
      <Sparkles size={9} /> {label}
    </span>
  );
}

// ─── Value Editor ─────────────────────────────────────────────────────────────
function ValueCard({ value, onUpdate, onRemove }: {
  value: OrgValue;
  onUpdate: (v: OrgValue) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border mb-3" style={{ borderColor: "var(--color-ln-border)", background: "white" }}>
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={value.name}
              onChange={(e) => onUpdate({ ...value, name: e.target.value })}
              className="text-sm font-bold bg-transparent outline-none"
              style={{ color: "var(--color-ln-navy)" }}
              placeholder="Value name"
            />
            {value.sourceType !== "manual" && <AIBadge label="AI extracted — review" />}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${value.approvalStatus === "approved" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
              {value.approvalStatus === "approved" ? "Approved" : "Pending review"}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>{value.shortDefinition || "No definition yet"}</p>
        </div>
        <div className="flex items-center gap-1">
          {value.approvalStatus !== "approved" && (
            <button
              onClick={() => onUpdate({ ...value, approvalStatus: "approved" })}
              className="p-1.5 rounded-lg transition-colors hover:bg-green-50"
              title="Approve"
            >
              <Check size={14} style={{ color: "#16a34a" }} />
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg transition-colors hover:bg-gray-100">
            {expanded ? <ChevronUp size={14} style={{ color: "var(--color-ln-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--color-ln-muted)" }} />}
          </button>
          <button onClick={onRemove} className="p-1.5 rounded-lg transition-colors hover:bg-red-50">
            <Trash2 size={13} style={{ color: "#dc2626" }} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--color-ln-border)" }}>
          <div className="pt-3">
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-ln-navy)" }}>Short definition</label>
            <Input value={value.shortDefinition} onChange={(v) => onUpdate({ ...value, shortDefinition: v })} placeholder="One sentence definition" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-ln-navy)" }}>Full description</label>
            <Textarea value={value.fullDescription} onChange={(v) => onUpdate({ ...value, fullDescription: v })} placeholder="What this value means in practice..." rows={2} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-ln-navy)" }}>Positive behaviours (one per line)</label>
            <Textarea
              value={value.positiveBehaviours.join("\n")}
              onChange={(v) => onUpdate({ ...value, positiveBehaviours: v.split("\n").filter(Boolean) })}
              placeholder="Takes responsibility without waiting for instruction&#10;Escalates issues with possible solutions"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-ln-navy)" }}>Negative behaviours (one per line)</label>
            <Textarea
              value={value.negativeBehaviours.join("\n")}
              onChange={(v) => onUpdate({ ...value, negativeBehaviours: v.split("\n").filter(Boolean) })}
              placeholder="Blames other teams&#10;Avoids difficult decisions"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Competency Editor ────────────────────────────────────────────────────────
function CompetencyCard({ comp, onUpdate, onRemove }: {
  comp: OrgCompetency;
  onUpdate: (c: OrgCompetency) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const CATEGORY_LABELS: Record<string, string> = {
    leading_self: "Leading Self",
    leading_others: "Leading Others",
    leading_teams: "Leading Teams",
    leading_business: "Leading the Business",
    leading_transformation: "Leading Transformation",
    custom: "Custom",
  };

  return (
    <div className="rounded-xl border mb-3" style={{ borderColor: "var(--color-ln-border)", background: "white" }}>
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={comp.name}
              onChange={(e) => onUpdate({ ...comp, name: e.target.value })}
              className="text-sm font-bold bg-transparent outline-none"
              style={{ color: "var(--color-ln-navy)" }}
              placeholder="Competency name"
            />
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)", color: "var(--color-ln-navy)" }}>
              {CATEGORY_LABELS[comp.category] ?? comp.category}
            </span>
            {comp.sourceType !== "manual" && <AIBadge label="AI extracted — review" />}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>{comp.shortDefinition || "No definition yet"}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg transition-colors hover:bg-gray-100">
            {expanded ? <ChevronUp size={14} style={{ color: "var(--color-ln-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--color-ln-muted)" }} />}
          </button>
          <button onClick={onRemove} className="p-1.5 rounded-lg transition-colors hover:bg-red-50">
            <Trash2 size={13} style={{ color: "#dc2626" }} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--color-ln-border)" }}>
          <div className="pt-3">
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-ln-navy)" }}>Category</label>
            <Select
              value={comp.category}
              onChange={(v) => onUpdate({ ...comp, category: v as OrgCompetency["category"] })}
              options={["leading_self", "leading_others", "leading_teams", "leading_business", "leading_transformation", "custom"]}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-ln-navy)" }}>Short definition</label>
            <Input value={comp.shortDefinition} onChange={(v) => onUpdate({ ...comp, shortDefinition: v })} placeholder="One sentence definition" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-ln-navy)" }}>Full definition</label>
            <Textarea value={comp.fullDefinition} onChange={(v) => onUpdate({ ...comp, fullDefinition: v })} rows={2} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--color-ln-navy)" }}>Map to LevelNext capability</label>
            <Select
              value={comp.levelnextMapping ?? ""}
              onChange={(v) => onUpdate({ ...comp, levelnextMapping: v, mappingType: "direct" })}
              options={LEVELNEXT_CAPABILITIES}
              placeholder="Select closest LevelNext capability"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
export default function EnterpriseOnboardingWizard() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetched, setUrlFetched] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"owner" | "admin" | "member">("member");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const createOrgMutation = trpc.enterpriseOnboarding.createOrganisation.useMutation();
  const saveStepMutation = trpc.enterpriseOnboarding.saveWizardStep.useMutation();
  const fetchUrlMutation = trpc.enterpriseOnboarding.fetchFromUrl.useMutation();
  const uploadDocMutation = trpc.enterpriseOnboarding.uploadDocument.useMutation();
  const inviteMutation = trpc.enterpriseOnboarding.inviteMembers.useMutation();
  const activateMutation = trpc.enterpriseOnboarding.activateContext.useMutation();

  const update = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  // Auto-save on step change
  const saveCurrentStep = useCallback(async (nextStep: number) => {
    if (!state.orgId) return;
    try {
      await saveStepMutation.mutateAsync({
        organisationId: state.orgId,
        wizardStep: nextStep,
        data: {
          legalName: state.legalName,
          displayName: state.displayName,
          website: state.website,
          logoUrl: state.logoUrl,
          industry: state.industry,
          subIndustry: state.subIndustry,
          companySize: state.companySize,
          hq: state.hq,
          primaryLanguage: state.primaryLanguage,
          description: state.description,
          isGcc: state.isGcc,
          missionStatement: state.missionStatement,
          visionStatement: state.visionStatement,
          purposeStatement: state.purposeStatement,
          values: state.values,
          competencies: state.competencies,
          strategicPriorities: state.strategicPriorities,
          branding: state.branding,
        },
      });
    } catch {
      // Non-blocking — user can still continue
    }
  }, [state, saveStepMutation]);

  const goNext = async () => {
    if (step === 1) {
      // Create org on step 1 → 2 transition
      if (!state.setupRoute || !state.legalName) {
        toast.error("Please enter your company name and choose a setup route.");
        return;
      }
      setIsCreatingOrg(true);
      try {
        const org = await createOrgMutation.mutateAsync({
          legalName: state.legalName,
          setupRoute: state.setupRoute,
        });
        update({ orgId: org.id });
      } catch (e: any) {
        toast.error(e.message || "Failed to create organisation");
        setIsCreatingOrg(false);
        return;
      }
      setIsCreatingOrg(false);
    } else {
      await saveCurrentStep(step + 1);
    }
    setStep((s) => Math.min(s + 1, 8));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleFetchUrl = async () => {
    if (!state.website || !state.orgId) return;
    setIsFetchingUrl(true);
    try {
      const result = await fetchUrlMutation.mutateAsync({
        url: state.website.startsWith("http") ? state.website : `https://${state.website}`,
        organisationId: state.orgId,
      });
      if (result.success && result.extracted) {
        const e = result.extracted;
        update({
          missionStatement: e.missionStatement ?? state.missionStatement,
          visionStatement: e.visionStatement ?? state.visionStatement,
          purposeStatement: e.purposeStatement ?? state.purposeStatement,
          description: e.description ?? state.description,
          industry: e.industry ?? state.industry,
          values: [...state.values, ...(e.values ?? [])],
          competencies: [...state.competencies, ...(e.competencies ?? [])],
          strategicPriorities: [...state.strategicPriorities, ...(e.strategicPriorities ?? [])],
        });
        setUrlFetched(true);
        toast.success(`Extracted ${(e.values?.length ?? 0) + (e.competencies?.length ?? 0)} items from your website`);
      } else {
        toast.error(result.error ?? "Could not extract content from this URL");
      }
    } catch {
      toast.error("Failed to fetch URL");
    }
    setIsFetchingUrl(false);
  };

  const handleDocUpload = async (file: File) => {
    if (!state.orgId) return;
    setIsUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      try {
        const result = await uploadDocMutation.mutateAsync({
          organisationId: state.orgId!,
          fileBase64: base64,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          category: "Leadership Competency Framework",
          title: file.name.replace(/\.[^.]+$/, ""),
          confidentiality: "internal",
          useInAICoaching: true,
          useInDiagnostics: true,
          useInReports: true,
          useInSimulations: false,
        });
        setUploadedDocs((prev) => [...prev, result.document]);
        if (result.extracted) {
          const e = result.extracted;
          update({
            values: [...state.values, ...(e.values ?? [])],
            competencies: [...state.competencies, ...(e.competencies ?? [])],
            strategicPriorities: [...state.strategicPriorities, ...(e.strategicPriorities ?? [])],
          });
          toast.success(`Extracted ${(e.values?.length ?? 0) + (e.competencies?.length ?? 0)} items from ${file.name}`);
        }
      } catch {
        toast.error("Failed to upload document");
      }
      setIsUploadingDoc(false);
    };
    reader.readAsDataURL(file);
  };

  const addValue = () => {
    const newVal: OrgValue = {
      id: Math.random().toString(36).slice(2, 8),
      name: "",
      shortDefinition: "",
      fullDescription: "",
      positiveBehaviours: [],
      negativeBehaviours: [],
      approvalStatus: "pending",
      sourceType: "manual",
    };
    update({ values: [...state.values, newVal] });
  };

  const addCompetency = () => {
    const newComp: OrgCompetency = {
      id: Math.random().toString(36).slice(2, 8),
      name: "",
      category: "leading_business",
      shortDefinition: "",
      fullDefinition: "",
      positiveBehaviours: [],
      riskBehaviours: [],
      approvalStatus: "pending",
      sourceType: "manual",
    };
    update({ competencies: [...state.competencies, newComp] });
  };

  const addInvite = () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (state.invitations.find((i) => i.email === newEmail)) {
      toast.error("This email is already in the list");
      return;
    }
    update({ invitations: [...state.invitations, { email: newEmail, role: newRole }] });
    setNewEmail("");
  };

  const handleLaunch = async () => {
    if (!state.orgId) return;
    try {
      // Send invitations
      if (state.invitations.length > 0) {
        await inviteMutation.mutateAsync({
          organisationId: state.orgId,
          invitations: state.invitations,
        });
      }
      // Activate context
      await activateMutation.mutateAsync({ organisationId: state.orgId });
      toast.success("Organisation activated! Invitations sent.");
      navigate("/organisation");
    } catch (e: any) {
      toast.error(e.message || "Failed to activate");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const currentStepInfo = STEPS[step - 1];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-ln-ivory)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ background: "var(--color-ln-navy)", borderColor: "oklch(from var(--color-ln-navy) l c h / 0.3)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-ln-gold)" }}>
            <Zap size={16} style={{ color: "var(--color-ln-navy)" }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-ln-gold)" }}>LevelNext</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Enterprise Onboarding</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StepIndicator current={step} total={8} />
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            Step {step} of 8
          </span>
        </div>
        <button
          onClick={() => navigate("/organisation")}
          className="text-xs font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Save & exit
        </button>
      </div>

      {/* Step nav pills (desktop) */}
      <div className="hidden sm:flex items-center gap-0 px-6 py-3 border-b overflow-x-auto" style={{ background: "white", borderColor: "var(--color-ln-border)" }}>
        {STEPS.map((s) => {
          const Icon = s.icon;
          const done = s.id < step;
          const active = s.id === step;
          return (
            <div key={s.id} className="flex items-center">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-default"
                style={{
                  background: active ? "oklch(from var(--color-ln-navy) l c h / 0.08)" : "transparent",
                  color: active ? "var(--color-ln-navy)" : done ? "var(--color-ln-muted)" : "var(--color-ln-muted)",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {done ? <Check size={12} style={{ color: "var(--color-ln-gold)" }} /> : <Icon size={12} />}
                {s.label}
              </div>
              {s.id < 8 && <div className="w-4 h-px mx-1" style={{ background: "var(--color-ln-border)" }} />}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

          {/* ── Step 1: Welcome & Route ─────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-ln-gold)" }}>Enterprise Setup</p>
                <h1 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "var(--color-ln-navy)" }}>
                  Configure LevelNext Around Your Organisation
                </h1>
                <p className="text-base leading-relaxed" style={{ color: "var(--color-ln-muted)" }}>
                  Bring your organisation's strategy, values, leadership framework, and expected behaviours into LevelNext. The platform will use this context to personalise diagnostics, coaching, simulations, and development pathways.
                </p>
              </div>

              <Field label="Company name" hint="This will be your organisation's display name on LevelNext.">
                <Input value={state.legalName} onChange={(v) => update({ legalName: v, displayName: v })} placeholder="e.g. Acme Corporation" />
              </Field>

              <p className="text-sm font-semibold mb-3 mt-6" style={{ color: "var(--color-ln-navy)" }}>How would you like to set up your leadership framework?</p>
              <div className="space-y-3 mb-6">
                {[
                  {
                    route: "upload" as SetupRoute,
                    icon: Upload,
                    title: "Upload Existing Frameworks",
                    desc: "You have leadership competency frameworks, values documents, strategy decks, or performance frameworks. Upload them and LevelNext AI will extract and structure the content.",
                    badge: "Most popular",
                  },
                  {
                    route: "build" as SetupRoute,
                    icon: Sparkles,
                    title: "Build with LevelNext",
                    desc: "You don't have a complete framework yet. LevelNext will guide you through structured questions to generate a Company Leadership Blueprint.",
                    badge: null,
                  },
                  {
                    route: "standard" as SetupRoute,
                    icon: Zap,
                    title: "Start with LevelNext Standard",
                    desc: "Launch immediately using the LevelNext universal leadership taxonomy. Customise with your own language and priorities later.",
                    badge: "Fastest start",
                  },
                ].map(({ route, icon: Icon, title, desc, badge }) => (
                  <button
                    key={route}
                    onClick={() => update({ setupRoute: route })}
                    className="w-full text-left p-4 rounded-2xl border-2 transition-all"
                    style={{
                      borderColor: state.setupRoute === route ? "var(--color-ln-navy)" : "var(--color-ln-border)",
                      background: state.setupRoute === route ? "oklch(from var(--color-ln-navy) l c h / 0.04)" : "white",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: state.setupRoute === route ? "var(--color-ln-navy)" : "oklch(from var(--color-ln-navy) l c h / 0.08)" }}>
                        <Icon size={16} style={{ color: state.setupRoute === route ? "white" : "var(--color-ln-navy)" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>{title}</p>
                          {badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "var(--color-ln-gold)", color: "var(--color-ln-navy)" }}>{badge}</span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--color-ln-muted)" }}>{desc}</p>
                      </div>
                      {state.setupRoute === route && (
                        <CheckCircle size={18} style={{ color: "var(--color-ln-navy)", flexShrink: 0 }} />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl mb-6 flex items-start gap-3" style={{ background: "oklch(from var(--color-ln-navy) 97% 0.01 248.6)", border: "1px solid oklch(from var(--color-ln-navy) l c h / 0.12)" }}>
                <Shield size={14} style={{ color: "var(--color-ln-navy)", marginTop: 2, flexShrink: 0 }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-ln-navy)" }}>
                  <strong>You can combine routes.</strong> For example: upload your company values, use LevelNext leadership competencies, and add your own strategic priorities. Nothing goes live until you review and approve it.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: Company Profile ─────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <SectionLabel required label="Company Profile" />
              <p className="text-sm mb-6" style={{ color: "var(--color-ln-muted)" }}>
                Tell us about your organisation. Paste your website URL and LevelNext will automatically extract your mission, values, and leadership principles.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Field label="Legal company name">
                  <Input value={state.legalName} onChange={(v) => update({ legalName: v })} placeholder="Acme Corporation Ltd." />
                </Field>
                <Field label="Display name">
                  <Input value={state.displayName} onChange={(v) => update({ displayName: v })} placeholder="Acme" />
                </Field>
              </div>

              <Field label="Company website" hint="Paste your website URL — LevelNext will fetch your mission, vision, values, and leadership principles automatically.">
                <div className="flex gap-2">
                  <Input value={state.website} onChange={(v) => update({ website: v })} placeholder="https://yourcompany.com" />
                  <Button
                    onClick={handleFetchUrl}
                    disabled={!state.website || isFetchingUrl || !state.orgId}
                    className="flex-shrink-0 font-semibold text-sm px-4"
                    style={{ background: urlFetched ? "#16a34a" : "var(--color-ln-navy)", color: "white" }}
                  >
                    {isFetchingUrl ? <Loader2 size={14} className="animate-spin" /> : urlFetched ? <><Check size={14} className="mr-1" /> Fetched</> : <><Globe size={14} className="mr-1" /> Fetch</>}
                  </Button>
                </div>
                {urlFetched && (
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#16a34a" }}>
                    <Sparkles size={11} /> Content extracted — review in Steps 3 & 4
                  </p>
                )}
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Industry">
                  <Select value={state.industry} onChange={(v) => update({ industry: v })} options={INDUSTRIES} placeholder="Select industry" />
                </Field>
                <Field label="Company size">
                  <Select value={state.companySize} onChange={(v) => update({ companySize: v })} options={COMPANY_SIZES} placeholder="Select size" />
                </Field>
                <Field label="Headquarters">
                  <Input value={state.hq} onChange={(v) => update({ hq: v })} placeholder="e.g. Bangalore, India" />
                </Field>
                <Field label="Primary language">
                  <Select value={state.primaryLanguage} onChange={(v) => update({ primaryLanguage: v })}
                    options={["English", "British English", "American English", "Hindi", "Spanish", "French", "German", "Mandarin", "Japanese", "Arabic"]} />
                </Field>
              </div>

              <Field label="Company description" hint="A brief description of what your company does and its primary business model.">
                <Textarea value={state.description} onChange={(v) => update({ description: v })} placeholder="Describe your company..." rows={3} />
              </Field>

              <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: "white", border: "1.5px solid var(--color-ln-border)" }}>
                <input
                  type="checkbox"
                  id="gcc"
                  checked={state.isGcc}
                  onChange={(e) => update({ isGcc: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="gcc" className="text-sm font-medium cursor-pointer" style={{ color: "var(--color-ln-navy)" }}>
                  This is a Global Capability Centre (GCC)
                </label>
              </div>
            </div>
          )}

          {/* ── Step 3: Mission, Vision & Values ───────────────────────────── */}
          {step === 3 && (
            <div>
              <SectionLabel required label="Mission, Vision & Values" />
              {urlFetched && (
                <div className="p-3.5 rounded-xl mb-5 flex items-start gap-2" style={{ background: "oklch(from var(--color-ln-gold) 97% 0.02 85)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.3)" }}>
                  <Sparkles size={14} style={{ color: "oklch(from var(--color-ln-gold) 40% c h)", marginTop: 2 }} />
                  <p className="text-xs" style={{ color: "oklch(from var(--color-ln-gold) 35% c h)" }}>
                    Content was pre-filled from your website. Review and edit each field — nothing is approved until you confirm it.
                  </p>
                </div>
              )}

              <Field label="Mission statement" hint="What your organisation exists to do.">
                <Textarea value={state.missionStatement} onChange={(v) => update({ missionStatement: v })} placeholder="e.g. To accelerate the world's transition to sustainable energy." rows={2} />
              </Field>
              <Field label="Vision statement" hint="The future state your organisation is working toward.">
                <Textarea value={state.visionStatement} onChange={(v) => update({ visionStatement: v })} placeholder="e.g. A world powered entirely by renewable energy." rows={2} />
              </Field>
              <Field label="Purpose / Why statement" hint="Optional — the deeper reason your organisation exists beyond profit.">
                <Textarea value={state.purposeStatement} onChange={(v) => update({ purposeStatement: v })} placeholder="e.g. We believe every person deserves clean, affordable energy." rows={2} />
              </Field>

              <div className="flex items-center justify-between mb-3 mt-6">
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>Company Values</p>
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{state.values.length} value{state.values.length !== 1 ? "s" : ""} · {state.values.filter(v => v.approvalStatus === "approved").length} approved</p>
                </div>
                <Button size="sm" variant="outline" onClick={addValue} className="text-xs font-semibold" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}>
                  <Plus size={12} className="mr-1" /> Add Value
                </Button>
              </div>

              {state.values.length === 0 ? (
                <div className="rounded-xl p-6 text-center mb-4" style={{ background: "var(--color-ln-ivory-dark)", border: "1px dashed var(--color-ln-border)" }}>
                  <BookOpen size={24} className="mx-auto mb-2" style={{ color: "var(--color-ln-muted)" }} />
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--color-ln-navy)" }}>No values yet</p>
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Add values manually, or they will be extracted from your website or uploaded documents.</p>
                </div>
              ) : (
                <div>
                  {state.values.map((v, i) => (
                    <ValueCard
                      key={v.id}
                      value={v}
                      onUpdate={(updated) => update({ values: state.values.map((x, j) => j === i ? updated : x) })}
                      onRemove={() => update({ values: state.values.filter((_, j) => j !== i) })}
                    />
                  ))}
                </div>
              )}

              {/* Strategic Priorities */}
              <div className="flex items-center justify-between mb-3 mt-6">
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>Strategic Priorities</p>
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Current organisational priorities that leadership development should support</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  const newP: OrgStrategicPriority = {
                    id: Math.random().toString(36).slice(2, 8),
                    title: "",
                    description: "",
                    rank: "high",
                    requiredCapabilities: [],
                    approvalStatus: "pending",
                    sourceType: "manual",
                  };
                  update({ strategicPriorities: [...state.strategicPriorities, newP] });
                }} className="text-xs font-semibold" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}>
                  <Plus size={12} className="mr-1" /> Add Priority
                </Button>
              </div>

              {state.strategicPriorities.map((p, i) => (
                <div key={p.id} className="rounded-xl border p-3.5 mb-3" style={{ borderColor: "var(--color-ln-border)", background: "white" }}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Input value={p.title} onChange={(v) => update({ strategicPriorities: state.strategicPriorities.map((x, j) => j === i ? { ...x, title: v } : x) })} placeholder="Priority title" />
                      <Textarea value={p.description} onChange={(v) => update({ strategicPriorities: state.strategicPriorities.map((x, j) => j === i ? { ...x, description: v } : x) })} placeholder="Brief description..." rows={2} />
                      <Select value={p.rank} onChange={(v) => update({ strategicPriorities: state.strategicPriorities.map((x, j) => j === i ? { ...x, rank: v as OrgStrategicPriority["rank"] } : x) })} options={["critical", "high", "medium", "emerging"]} />
                    </div>
                    <button onClick={() => update({ strategicPriorities: state.strategicPriorities.filter((_, j) => j !== i) })} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={13} style={{ color: "#dc2626" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 4: Leadership Framework ───────────────────────────────── */}
          {step === 4 && (
            <div>
              <SectionLabel label="Leadership Framework" />
              <p className="text-sm mb-5" style={{ color: "var(--color-ln-muted)" }}>
                Define the leadership competencies your organisation expects. These will be mapped to the LevelNext universal taxonomy to enable benchmarking while preserving your language.
              </p>

              {state.setupRoute === "standard" && (
                <div className="p-4 rounded-xl mb-5" style={{ background: "oklch(from var(--color-ln-gold) 97% 0.02 85)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.3)" }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>Using LevelNext Standard Framework</p>
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>You're starting with the LevelNext universal taxonomy. You can add your own competencies below or customise later.</p>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>Competencies</p>
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{state.competencies.length} competenc{state.competencies.length !== 1 ? "ies" : "y"}</p>
                </div>
                <Button size="sm" variant="outline" onClick={addCompetency} className="text-xs font-semibold" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}>
                  <Plus size={12} className="mr-1" /> Add Competency
                </Button>
              </div>

              {state.competencies.length === 0 ? (
                <div className="rounded-xl p-6 text-center" style={{ background: "var(--color-ln-ivory-dark)", border: "1px dashed var(--color-ln-border)" }}>
                  <Target size={24} className="mx-auto mb-2" style={{ color: "var(--color-ln-muted)" }} />
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--color-ln-navy)" }}>No competencies yet</p>
                  <p className="text-xs mb-3" style={{ color: "var(--color-ln-muted)" }}>Add competencies manually, upload documents in Step 5, or use the LevelNext standard framework.</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {LEVELNEXT_CAPABILITIES.slice(0, 6).map((cap) => (
                      <button
                        key={cap}
                        onClick={() => {
                          const newComp: OrgCompetency = {
                            id: Math.random().toString(36).slice(2, 8),
                            name: cap,
                            category: "leading_business",
                            shortDefinition: "",
                            fullDefinition: "",
                            positiveBehaviours: [],
                            riskBehaviours: [],
                            approvalStatus: "approved",
                            sourceType: "manual",
                            levelnextMapping: cap,
                            mappingType: "direct",
                          };
                          update({ competencies: [...state.competencies, newComp] });
                        }}
                        className="text-xs px-2.5 py-1 rounded-full border transition-all hover:border-navy"
                        style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)", background: "white" }}
                      >
                        + {cap}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                state.competencies.map((c, i) => (
                  <CompetencyCard
                    key={c.id}
                    comp={c}
                    onUpdate={(updated) => update({ competencies: state.competencies.map((x, j) => j === i ? updated : x) })}
                    onRemove={() => update({ competencies: state.competencies.filter((_, j) => j !== i) })}
                  />
                ))
              )}
            </div>
          )}

          {/* ── Step 5: Document Upload ─────────────────────────────────────── */}
          {step === 5 && (
            <div>
              <SectionLabel label="Document Upload" />
              <p className="text-sm mb-5" style={{ color: "var(--color-ln-muted)" }}>
                Upload your leadership frameworks, strategy decks, values documents, or any other relevant materials. LevelNext AI will extract structured content for your review.
              </p>

              {/* Drop zone */}
              <div
                className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all mb-5"
                style={{
                  borderColor: "var(--color-ln-border)",
                  background: "var(--color-ln-ivory-dark)",
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleDocUpload(f); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx,.xlsx,.csv,.txt"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f); }}
                />
                {isUploadingDoc ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-ln-navy)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>Uploading and extracting…</p>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="mx-auto mb-3" style={{ color: "var(--color-ln-muted)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>Drop documents here or click to browse</p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-ln-muted)" }}>PDF, DOCX, PPTX, XLSX, CSV, TXT · Up to 20MB each</p>
                  </>
                )}
              </div>

              {/* Suggested categories */}
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-ln-muted)" }}>Suggested document types</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {DOC_CATEGORIES.slice(0, 8).map((cat) => (
                  <span key={cat} className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: "white", border: "1px solid var(--color-ln-border)", color: "var(--color-ln-navy)" }}>{cat}</span>
                ))}
              </div>

              {/* Uploaded docs */}
              {uploadedDocs.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-ln-navy)" }}>Uploaded documents ({uploadedDocs.length})</p>
                  {uploadedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3.5 rounded-xl border mb-2" style={{ borderColor: "var(--color-ln-border)", background: "white" }}>
                      <FileText size={16} style={{ color: "var(--color-ln-navy)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--color-ln-navy)" }}>{doc.title}</p>
                        <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{doc.category}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.15)", color: "oklch(from var(--color-ln-gold) 40% c h)" }}>
                        Extracted
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Extraction summary */}
              {(state.values.length > 0 || state.competencies.length > 0) && (
                <div className="p-4 rounded-xl mt-4" style={{ background: "oklch(from var(--color-ln-navy) 97% 0.01 248.6)", border: "1px solid oklch(from var(--color-ln-navy) l c h / 0.12)" }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-ln-navy)" }}>Extraction summary</p>
                  <div className="flex gap-4 flex-wrap">
                    <div className="text-center">
                      <p className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{state.values.length}</p>
                      <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Values</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{state.competencies.length}</p>
                      <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Competencies</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{state.strategicPriorities.length}</p>
                      <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Priorities</p>
                    </div>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "var(--color-ln-muted)" }}>Review and approve items in Steps 3 & 4. Nothing is activated until you confirm.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 6: Branding & Terminology ─────────────────────────────── */}
          {step === 6 && (
            <div>
              <SectionLabel label="Branding & Terminology" />
              <p className="text-sm mb-5" style={{ color: "var(--color-ln-muted)" }}>
                Customise how LevelNext looks and speaks for your organisation. Your brand colour will be used across dashboards and reports. Terminology settings ensure the AI uses your language naturally.
              </p>

              <Field label="Primary brand colour" hint="This colour will be used in your organisation's LevelNext experience.">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={state.branding.primaryColor}
                    onChange={(e) => update({ branding: { ...state.branding, primaryColor: e.target.value } })}
                    className="w-12 h-10 rounded-lg cursor-pointer border"
                    style={{ borderColor: "var(--color-ln-border)" }}
                  />
                  <Input value={state.branding.primaryColor} onChange={(v) => update({ branding: { ...state.branding, primaryColor: v } })} placeholder="#12345A" />
                </div>
                <div className="mt-2 h-8 rounded-lg" style={{ background: state.branding.primaryColor }} />
              </Field>

              <Field label="Preferred language style">
                <Select
                  value={state.branding.preferredLanguage}
                  onChange={(v) => update({ branding: { ...state.branding, preferredLanguage: v } })}
                  options={["English", "British English", "American English", "Formal", "Conversational"]}
                />
              </Field>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>Terminology Manager</p>
                    <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Define preferred terms the AI should use (e.g. "associate" instead of "employee")</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    const newTerm = { id: Math.random().toString(36).slice(2, 8), preferredTerm: "", definition: "", alternativeTerms: [], prohibitedTerms: [] };
                    update({ branding: { ...state.branding, terminology: [...state.branding.terminology, newTerm] } });
                  }} className="text-xs font-semibold" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}>
                    <Plus size={12} className="mr-1" /> Add Term
                  </Button>
                </div>

                {state.branding.terminology.length === 0 ? (
                  <div className="rounded-xl p-5 text-center" style={{ background: "var(--color-ln-ivory-dark)", border: "1px dashed var(--color-ln-border)" }}>
                    <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>No custom terms yet. Examples: "associate" → "employee", "people leader" → "manager"</p>
                  </div>
                ) : (
                  state.branding.terminology.map((term, i) => (
                    <div key={term.id} className="flex items-center gap-2 p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-ln-border)", background: "white" }}>
                      <Input value={term.preferredTerm} onChange={(v) => {
                        const updated = [...state.branding.terminology];
                        updated[i] = { ...updated[i], preferredTerm: v };
                        update({ branding: { ...state.branding, terminology: updated } });
                      }} placeholder="Preferred term (e.g. associate)" />
                      <span className="text-xs font-medium" style={{ color: "var(--color-ln-muted)" }}>instead of</span>
                      <Input value={term.prohibitedTerms[0] ?? ""} onChange={(v) => {
                        const updated = [...state.branding.terminology];
                        updated[i] = { ...updated[i], prohibitedTerms: [v] };
                        update({ branding: { ...state.branding, terminology: updated } });
                      }} placeholder="Replaced term (e.g. employee)" />
                      <button onClick={() => update({ branding: { ...state.branding, terminology: state.branding.terminology.filter((_, j) => j !== i) } })} className="p-1.5 rounded hover:bg-red-50">
                        <X size={13} style={{ color: "#dc2626" }} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Step 7: Team Setup ──────────────────────────────────────────── */}
          {step === 7 && (
            <div>
              <SectionLabel label="Team Setup" />
              <p className="text-sm mb-5" style={{ color: "var(--color-ln-muted)" }}>
                Invite your HR, L&D, and leadership team members to LevelNext. You can add more people after launch.
              </p>

              <div className="p-4 rounded-xl mb-5 flex items-start gap-3" style={{ background: "oklch(from var(--color-ln-navy) 97% 0.01 248.6)", border: "1px solid oklch(from var(--color-ln-navy) l c h / 0.12)" }}>
                <Shield size={14} style={{ color: "var(--color-ln-navy)", marginTop: 2 }} />
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>Role permissions</p>
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>
                    <strong>Admin</strong> — can configure the platform, view aggregate data, and manage cohorts. <strong>Member</strong> — participant access only (diagnostics, coaching, growth profile).
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <Input value={newEmail} onChange={setNewEmail} placeholder="colleague@company.com" type="email" />
                </div>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: "1.5px solid var(--color-ln-border)", background: "white", color: "var(--color-ln-text)" }}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
                <Button onClick={addInvite} className="font-semibold flex-shrink-0" style={{ background: "var(--color-ln-navy)", color: "white" }}>
                  <Plus size={14} />
                </Button>
              </div>

              {state.invitations.length > 0 ? (
                <div className="space-y-2">
                  {state.invitations.map((inv, i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border" style={{ borderColor: "var(--color-ln-border)", background: "white" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)", color: "var(--color-ln-navy)" }}>
                        {inv.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--color-ln-navy)" }}>{inv.email}</p>
                        <p className="text-xs capitalize" style={{ color: "var(--color-ln-muted)" }}>{inv.role}</p>
                      </div>
                      <button onClick={() => update({ invitations: state.invitations.filter((_, j) => j !== i) })} className="p-1.5 rounded hover:bg-red-50">
                        <X size={13} style={{ color: "#dc2626" }} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl p-6 text-center" style={{ background: "var(--color-ln-ivory-dark)", border: "1px dashed var(--color-ln-border)" }}>
                  <Users size={24} className="mx-auto mb-2" style={{ color: "var(--color-ln-muted)" }} />
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--color-ln-navy)" }}>No invitations yet</p>
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>You can skip this and invite people after launch.</p>
                </div>
              )}

              {/* Application settings */}
              <div className="mt-6">
                <p className="text-sm font-bold mb-3" style={{ color: "var(--color-ln-navy)" }}>Platform application settings</p>
                {[
                  { key: "useInDiagnostics", label: "Use company context in diagnostics" },
                  { key: "useInAICoaching", label: "Use company context in AI coaching" },
                  { key: "useInSimulations", label: "Use company context in practice simulations" },
                  { key: "useInReports", label: "Show company framework in participant reports" },
                  { key: "managerCanSeeGoals", label: "Managers can see agreed development goals" },
                  { key: "hrCanSeeAggregates", label: "HR/L&D can see aggregate capability data" },
                ].map(({ key, label }) => {
                  const settings = state.branding as any; // reuse branding state for now
                  const appSettings = { useInDiagnostics: true, useInAICoaching: true, useInSimulations: true, useInReports: true, managerCanSeeGoals: true, hrCanSeeAggregates: true, ...state.branding };
                  return (
                    <div key={key} className="flex items-center justify-between py-3 border-b" style={{ borderColor: "var(--color-ln-border)" }}>
                      <p className="text-sm" style={{ color: "var(--color-ln-text)" }}>{label}</p>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 8: Launch ──────────────────────────────────────────────── */}
          {step === 8 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.15)", border: "2px solid var(--color-ln-gold)" }}>
                  <Rocket size={28} style={{ color: "var(--color-ln-gold)" }} />
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>Ready to Launch</h1>
                <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>Review your setup summary and activate your Company Context Layer.</p>
              </div>

              {/* Readiness checklist */}
              <div className="rounded-2xl p-5 mb-5" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                <p className="text-sm font-bold mb-4" style={{ color: "var(--color-ln-navy)" }}>Setup summary</p>
                {[
                  { label: "Company name", done: !!state.legalName, value: state.legalName },
                  { label: "Mission statement", done: !!state.missionStatement, value: state.missionStatement ? "Set" : "Not set" },
                  { label: "Values", done: state.values.length > 0, value: `${state.values.length} value${state.values.length !== 1 ? "s" : ""}` },
                  { label: "Competencies", done: state.competencies.length > 0, value: `${state.competencies.length} competenc${state.competencies.length !== 1 ? "ies" : "y"}` },
                  { label: "Strategic priorities", done: state.strategicPriorities.length > 0, value: `${state.strategicPriorities.length} priorit${state.strategicPriorities.length !== 1 ? "ies" : "y"}` },
                  { label: "Documents uploaded", done: uploadedDocs.length > 0, value: `${uploadedDocs.length} document${uploadedDocs.length !== 1 ? "s" : ""}` },
                  { label: "Team invitations", done: state.invitations.length > 0, value: `${state.invitations.length} invitation${state.invitations.length !== 1 ? "s" : ""}` },
                ].map(({ label, done, value }) => (
                  <div key={label} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "var(--color-ln-border)" }}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-100" : "bg-gray-100"}`}>
                      {done ? <Check size={11} style={{ color: "#16a34a" }} /> : <AlertCircle size={11} style={{ color: "var(--color-ln-muted)" }} />}
                    </div>
                    <p className="flex-1 text-sm" style={{ color: "var(--color-ln-text)" }}>{label}</p>
                    <p className="text-xs font-medium" style={{ color: done ? "#16a34a" : "var(--color-ln-muted)" }}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl mb-6" style={{ background: "oklch(from var(--color-ln-navy) 97% 0.01 248.6)", border: "1px solid oklch(from var(--color-ln-navy) l c h / 0.12)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>What happens when you activate?</p>
                <ul className="text-xs space-y-1" style={{ color: "var(--color-ln-muted)" }}>
                  <li>• Your Company Context Layer goes live across LevelNext</li>
                  <li>• Guide, diagnostics, and simulations will use your company language and values</li>
                  <li>• Invitations are sent to your team members</li>
                  <li>• You can edit and refine the context at any time from the Organisation dashboard</li>
                </ul>
              </div>

              <Button
                className="w-full h-12 text-base font-bold"
                style={{ background: "var(--color-ln-gold)", color: "var(--color-ln-navy)" }}
                onClick={handleLaunch}
                disabled={activateMutation.isPending || inviteMutation.isPending}
              >
                {activateMutation.isPending || inviteMutation.isPending ? (
                  <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Activating…</span>
                ) : (
                  <span className="flex items-center gap-2"><Rocket size={16} /> Activate & Send Invitations</span>
                )}
              </Button>

              <p className="text-xs text-center mt-3" style={{ color: "var(--color-ln-muted)" }}>
                You can also save as draft and activate later from the Organisation dashboard.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: "var(--color-ln-border)" }}>
            <Button
              variant="outline"
              onClick={goBack}
              disabled={step === 1}
              className="font-semibold"
              style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}
            >
              <ArrowLeft size={15} className="mr-1.5" /> Back
            </Button>

            {step < 8 && (
              <Button
                onClick={goNext}
                disabled={isCreatingOrg || saveStepMutation.isPending}
                className="font-semibold"
                style={{ background: "var(--color-ln-navy)", color: "white" }}
              >
                {isCreatingOrg || saveStepMutation.isPending ? (
                  <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving…</span>
                ) : (
                  <span className="flex items-center gap-2">
                    {step === 5 || step === 6 ? "Skip & Continue" : "Continue"}
                    <ArrowRight size={15} />
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
