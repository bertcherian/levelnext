import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import QueryErrorState from "@/components/QueryErrorState";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Sparkles,
  Linkedin,
  Mail,
  Copy,
  CheckCheck,
  RefreshCw,
  Plus,
  Trash2,
  MessageSquare,
  Target,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  Radio,
} from "lucide-react";

// ─── Copy Button ─────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-black/8 transition-colors flex-shrink-0"
      title="Copy to clipboard"
    >
      {copied ? <CheckCheck size={14} className="text-emerald-600" /> : <Copy size={14} className="text-muted-foreground" />}
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: "var(--color-ln-navy)" }}>{icon}</span>
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Text Asset ───────────────────────────────────────────────────────────────
function TextAsset({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <CopyButton text={value} />
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

// ─── Brand Strategy Tab ───────────────────────────────────────────────────────
function BrandStrategyTab() {
  const utils = trpc.useUtils();
  const { data: strategy, isLoading, isError, refetch } = trpc.outreachEngine.getBrandStrategy.useQuery();
  const generateMutation = trpc.outreachEngine.generateBrandStrategy.useMutation({
    onSuccess: () => {
      utils.outreachEngine.getBrandStrategy.invalidate();
      toast.success("Brand strategy generated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const [expandedPillar, setExpandedPillar] = useState<number | null>(0);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <QueryErrorState
        compact
        title="Brand strategy couldn't be loaded"
        message="Your saved strategy is unchanged. Try again to reload this section."
        onRetry={() => { void refetch(); }}
      />
    );
  }

  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}
        >
          <Sparkles size={36} style={{ color: "var(--color-ln-navy)" }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>
          Build Your Personal Brand Strategy
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mb-8">
          AI generates your LinkedIn headline, brand statement, thought leadership pillars, 4-week content calendar, and visibility plan — all grounded in your career profile and CI diagnostic scores.
        </p>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="h-11 px-8 font-semibold"
          style={{ background: "var(--color-ln-navy)", color: "white" }}
        >
          {generateMutation.isPending ? (
            <><RefreshCw size={16} className="mr-2 animate-spin" /> Generating…</>
          ) : (
            <><Sparkles size={16} className="mr-2" /> Generate Brand Strategy</>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Regenerate */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="gap-2"
        >
          {generateMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Regenerate
        </Button>
      </div>

      {/* LinkedIn Presence */}
      <SectionCard title="LinkedIn Presence" icon={<Linkedin size={16} />}>
        <TextAsset label="Headline (220 chars)" value={strategy.linkedinHeadline} />
        <TextAsset label="Summary" value={strategy.linkedinSummary} />
        <TextAsset label="About Section" value={strategy.linkedinAboutSection} />
      </SectionCard>

      {/* Brand Positioning */}
      <SectionCard title="Brand Positioning" icon={<Target size={16} />}>
        <TextAsset label="Brand Statement" value={strategy.brandStatement} />
        <TextAsset label="Unique Value Proposition" value={strategy.uniqueValueProposition} />
        <TextAsset label="Target Audience" value={strategy.targetAudience} />
      </SectionCard>

      {/* Narrative Assets */}
      <SectionCard title="Narrative Assets" icon={<MessageSquare size={16} />}>
        <TextAsset label="Career Narrative" value={strategy.careerNarrative} />
        <TextAsset label="Elevator Pitch (60 sec)" value={strategy.elevatorPitch} />
        <TextAsset label="Executive Bio (200 words)" value={strategy.executiveBio} />
      </SectionCard>

      {/* Thought Leadership Pillars */}
      {strategy.thoughtLeadershipPillars && strategy.thoughtLeadershipPillars.length > 0 && (
        <SectionCard title="Thought Leadership Pillars" icon={<Zap size={16} />}>
          <div className="space-y-2">
            {strategy.thoughtLeadershipPillars.map((pillar, i) => (
              <div key={i} className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/4 transition-colors"
                  onClick={() => setExpandedPillar(expandedPillar === i ? null : i)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--color-ln-navy)", color: "white" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold">{pillar.pillar}</span>
                  </div>
                  {expandedPillar === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedPillar === i && (
                  <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <p className="text-sm text-muted-foreground pt-3">{pillar.description}</p>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Content Ideas</p>
                      <ul className="space-y-1">
                        {pillar.contentIdeas.map((idea, j) => (
                          <li key={j} className="text-sm flex items-start gap-2">
                            <span className="text-muted-foreground mt-0.5">•</span>
                            <span>{idea}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pillar.hashtags.map((tag, j) => (
                        <Badge key={j} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Content Calendar */}
      {strategy.contentCalendar && strategy.contentCalendar.length > 0 && (
        <SectionCard title="4-Week Content Calendar" icon={<Calendar size={16} />}>
          <div className="space-y-2">
            {strategy.contentCalendar.map((entry, i) => (
              <div key={i} className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/4 transition-colors"
                  onClick={() => setExpandedWeek(expandedWeek === i ? null : i)}
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 flex-shrink-0"
                      style={{ borderColor: "var(--color-ln-navy)", color: "var(--color-ln-navy)" }}
                    >
                      Week {entry.week}
                    </Badge>
                    <span className="text-sm font-medium">{entry.topic}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
                      {entry.format}
                    </Badge>
                  </div>
                  {expandedWeek === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedWeek === i && (
                  <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <div className="pt-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Hook</p>
                      <div className="flex items-start gap-2">
                        <p className="text-sm italic flex-1">"{entry.hook}"</p>
                        <CopyButton text={entry.hook} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Call to Action</p>
                      <p className="text-sm">{entry.callToAction}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Visibility Plan */}
      {strategy.visibilityPlan && (
        <SectionCard title="Visibility Plan" icon={<Eye size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "0–30 Days", items: strategy.visibilityPlan.shortTerm },
              { label: "30–90 Days", items: strategy.visibilityPlan.mediumTerm },
              { label: "90+ Days", items: strategy.visibilityPlan.longTerm },
            ].map((col) => (
              <div key={col.label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{col.label}</p>
                <ul className="space-y-1.5">
                  {col.items?.map((item, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {(strategy.visibilityPlan.speakingOpportunities?.length > 0 || strategy.visibilityPlan.networkingEvents?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Speaking Opportunities</p>
                <ul className="space-y-1">
                  {strategy.visibilityPlan.speakingOpportunities?.map((s, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Networking Events</p>
                <ul className="space-y-1">
                  {strategy.visibilityPlan.networkingEvents?.map((e, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <span className="text-purple-500 mt-0.5 flex-shrink-0">→</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  sent: { label: "Sent", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  responded: { label: "Responded", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  archived: { label: "Archived", color: "text-muted-foreground", bg: "bg-muted border-border" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Outreach Drafts Tab ──────────────────────────────────────────────────────
function OutreachDraftsTab({ prefillCompany = "" }: { prefillCompany?: string }) {
  const utils = trpc.useUtils();
  const { data: drafts, isLoading, isError: draftsError, refetch: refetchDrafts } = trpc.outreachEngine.listOutreachDrafts.useQuery();
  const { data: contacts, isLoading: contactsLoading, isError: contactsError, refetch: refetchContacts } = trpc.outreachEngine.listContactsForOutreach.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<number | null>(null);
  const [form, setForm] = useState({
    contactName: "",
    contactTitle: "",
    contactCompany: prefillCompany,
    outreachGoal: "",
    contactId: undefined as number | undefined,
    howWeKnowEachOther: "",
    sharedHistory: "",
  });

  // Sync prefillCompany into form when arriving from Radar signal
  useEffect(() => {
    if (prefillCompany) {
      setForm((f) => ({ ...f, contactCompany: prefillCompany }));
      setShowForm(true);
    }
  }, [prefillCompany]);

  const generateMutation = trpc.outreachEngine.generateOutreachDraft.useMutation({
    onSuccess: (data) => {
      utils.outreachEngine.listOutreachDrafts.invalidate();
      setShowForm(false);
      setSelectedDraft(data.id);
      setForm({ contactName: "", contactTitle: "", contactCompany: "", outreachGoal: "", contactId: undefined, howWeKnowEachOther: "", sharedHistory: "" });
      toast.success("Outreach draft generated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.outreachEngine.updateOutreachDraft.useMutation({
    onSuccess: () => {
      utils.outreachEngine.listOutreachDrafts.invalidate();
      toast.success("Updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.outreachEngine.deleteOutreachDraft.useMutation({
    onMutate: async ({ id }) => {
      await utils.outreachEngine.listOutreachDrafts.cancel();
      const previousDrafts = utils.outreachEngine.listOutreachDrafts.getData();
      utils.outreachEngine.listOutreachDrafts.setData(undefined, (current) => current?.filter((draft) => draft.id !== id));
      setSelectedDraft((current) => current === id ? null : current);
      return { previousDrafts, deletedId: id };
    },
    onError: (e, _input, context) => {
      if (context?.previousDrafts) {
        utils.outreachEngine.listOutreachDrafts.setData(undefined, context.previousDrafts);
      }
      if (context?.deletedId) setSelectedDraft(context.deletedId);
      toast.error(e.message);
    },
    onSuccess: () => toast.success("Deleted"),
    onSettled: () => {
      void utils.outreachEngine.listOutreachDrafts.invalidate();
    },
  });

  const prepMutation = trpc.outreachEngine.generateConversationPrep.useMutation({
    onSuccess: () => {
      utils.outreachEngine.listOutreachDrafts.invalidate();
      toast.success("Conversation prep generated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const activeDraft = drafts?.find((d) => d.id === selectedDraft);

  const handleContactSelect = (contactId: number) => {
    const contact = contacts?.find((c) => c.id === contactId);
    if (contact) {
      setForm((f) => ({
        ...f,
        contactId: contact.id,
        contactName: contact.name,
        contactTitle: contact.currentTitle ?? "",
        contactCompany: contact.currentCompany ?? "",
        howWeKnowEachOther: contact.howWeKnowEachOther ?? "",
        sharedHistory: contact.sharedHistory ?? "",
      }));
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  }
  if (draftsError || contactsError) {
    return (
      <QueryErrorState
        compact
        title={contactsError && !draftsError ? "Relationship contacts couldn't be loaded" : "Outreach drafts couldn't be loaded"}
        message="This section did not respond. Your saved drafts and contacts are unchanged; try again."
        onRetry={() => {
          void refetchDrafts();
          void refetchContacts();
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: draft list */}
      <div className="lg:col-span-2 space-y-3">
        <Button
          onClick={() => { setShowForm(true); setSelectedDraft(null); }}
          className="w-full gap-2 font-semibold"
          style={{ background: "var(--color-ln-navy)", color: "white" }}
        >
          <Plus size={16} /> New Outreach Draft
        </Button>

        {/* New draft form */}
        {showForm && (
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ background: "var(--color-card)", borderColor: "var(--color-ln-navy)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>New Outreach Draft</p>

            {/* Quick-fill from contacts */}
            {contactsLoading ? (
              <Skeleton className="h-10 rounded-lg" />
            ) : contacts && contacts.length > 0 && (
              <div>
                <Label className="text-xs">Quick-fill from Relationship Graph</Label>
                <select
                  className="mt-1 w-full text-sm rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
                  onChange={(e) => e.target.value && handleContactSelect(Number(e.target.value))}
                  defaultValue=""
                >
                  <option value="">Select a contact…</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.currentTitle ?? "Unknown"}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Contact Name *</Label>
                <Input className="mt-1 h-8 text-sm" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} placeholder="Jane Smith" />
              </div>
              <div>
                <Label className="text-xs">Title</Label>
                <Input className="mt-1 h-8 text-sm" value={form.contactTitle} onChange={(e) => setForm((f) => ({ ...f, contactTitle: e.target.value }))} placeholder="VP Engineering" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Company</Label>
              <Input className="mt-1 h-8 text-sm" value={form.contactCompany} onChange={(e) => setForm((f) => ({ ...f, contactCompany: e.target.value }))} placeholder="Acme Corp" />
            </div>

            <div>
              <Label className="text-xs">Outreach Goal *</Label>
              <Input className="mt-1 h-8 text-sm" value={form.outreachGoal} onChange={(e) => setForm((f) => ({ ...f, outreachGoal: e.target.value }))} placeholder="Explore VP role, request intro, advice on…" />
            </div>

            <div>
              <Label className="text-xs">How we know each other</Label>
              <Input className="mt-1 h-8 text-sm" value={form.howWeKnowEachOther} onChange={(e) => setForm((f) => ({ ...f, howWeKnowEachOther: e.target.value }))} placeholder="Met at TechConf 2024, ex-colleague…" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="flex-1 gap-1.5 font-semibold"
                style={{ background: "var(--color-ln-navy)", color: "white" }}
                disabled={!form.contactName || !form.outreachGoal || generateMutation.isPending}
                onClick={() => generateMutation.mutate(form)}
              >
                {generateMutation.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                Generate
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Draft list */}
        {drafts && drafts.length > 0 ? (
          <div className="space-y-2">
            {drafts.map((d) => (
              <button
                key={d.id}
                className="w-full text-left rounded-xl border p-3 transition-all"
                style={{
                  background: selectedDraft === d.id ? "oklch(from var(--color-ln-navy) l c h / 0.06)" : "var(--color-card)",
                  borderColor: selectedDraft === d.id ? "var(--color-ln-navy)" : "var(--color-border)",
                }}
                onClick={() => setSelectedDraft(d.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{d.contactName}</p>
                    <p className="text-xs text-muted-foreground truncate">{d.contactTitle ?? ""}{d.contactCompany ? ` · ${d.contactCompany}` : ""}</p>
                    {d.outreachGoal && <p className="text-xs text-muted-foreground truncate mt-0.5">{d.outreachGoal}</p>}
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              </button>
            ))}
          </div>
        ) : !showForm ? (
          <div className="text-center py-10">
            <Users size={28} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">No outreach drafts yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first draft above.</p>
          </div>
        ) : null}
      </div>

      {/* Right: draft detail */}
      <div className="lg:col-span-3">
        {activeDraft ? (
          <div className="space-y-4">
            {/* Header */}
            <div
              className="rounded-xl border p-4 flex items-start justify-between gap-4"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              <div>
                <p className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>{activeDraft.contactName}</p>
                <p className="text-sm text-muted-foreground">{activeDraft.contactTitle ?? ""}{activeDraft.contactCompany ? ` · ${activeDraft.contactCompany}` : ""}</p>
                {activeDraft.outreachGoal && (
                  <p className="text-xs mt-1 text-muted-foreground">Goal: {activeDraft.outreachGoal}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  className="text-xs rounded border px-2 py-1"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
                  value={activeDraft.status}
                  onChange={(e) => updateMutation.mutate({ id: activeDraft.id, status: e.target.value as "draft" | "sent" | "responded" | "archived" })}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="responded">Responded</option>
                  <option value="archived">Archived</option>
                </select>
                <button
                  className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                  disabled={deleteMutation.isPending}
                  aria-label={`Delete outreach draft for ${activeDraft.contactName}`}
                  onClick={() => { if (confirm("Delete this draft?")) deleteMutation.mutate({ id: activeDraft.id }); }}
                >
                  <Trash2 size={14} className={deleteMutation.isPending ? "animate-pulse" : undefined} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <SectionCard title="Outreach Messages" icon={<Send size={16} />}>
              {activeDraft.linkedinMessage && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Linkedin size={13} className="text-blue-600" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">LinkedIn Message</p>
                    </div>
                    <CopyButton text={activeDraft.linkedinMessage} />
                  </div>
                  <Textarea
                    className="text-sm resize-none"
                    rows={3}
                    defaultValue={activeDraft.linkedinMessage}
                    onBlur={(e) => updateMutation.mutate({ id: activeDraft.id, linkedinMessage: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">{activeDraft.linkedinMessage.length}/300 chars</p>
                </div>
              )}
              {activeDraft.emailBody && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
                    </div>
                    <CopyButton text={`Subject: ${activeDraft.emailSubject ?? ""}\n\n${activeDraft.emailBody}`} />
                  </div>
                  {activeDraft.emailSubject && (
                    <Input
                      className="mb-2 text-sm h-8"
                      defaultValue={activeDraft.emailSubject}
                      onBlur={(e) => updateMutation.mutate({ id: activeDraft.id, emailSubject: e.target.value })}
                    />
                  )}
                  <Textarea
                    className="text-sm resize-none"
                    rows={5}
                    defaultValue={activeDraft.emailBody}
                    onBlur={(e) => updateMutation.mutate({ id: activeDraft.id, emailBody: e.target.value })}
                  />
                </div>
              )}
              {activeDraft.warmIntroRequest && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Warm Intro Request</p>
                    <CopyButton text={activeDraft.warmIntroRequest} />
                  </div>
                  <Textarea
                    className="text-sm resize-none"
                    rows={3}
                    defaultValue={activeDraft.warmIntroRequest}
                    onBlur={(e) => updateMutation.mutate({ id: activeDraft.id, warmIntroRequest: e.target.value })}
                  />
                </div>
              )}
              {activeDraft.followUpMessage && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Follow-up (if no reply)</p>
                    <CopyButton text={activeDraft.followUpMessage} />
                  </div>
                  <Textarea
                    className="text-sm resize-none"
                    rows={3}
                    defaultValue={activeDraft.followUpMessage}
                    onBlur={(e) => updateMutation.mutate({ id: activeDraft.id, followUpMessage: e.target.value })}
                  />
                </div>
              )}
            </SectionCard>

            {/* Conversation Prep */}
            {activeDraft.meetingAgenda && (activeDraft.meetingAgenda as string[]).length > 0 ? (
              <SectionCard title="Conversation Prep" icon={<MessageSquare size={16} />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Meeting Agenda</p>
                    <ul className="space-y-1.5">
                      {(activeDraft.meetingAgenda as string[]).map((item, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <span className="font-bold text-muted-foreground flex-shrink-0">{i + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Talking Points</p>
                    <ul className="space-y-1.5">
                      {(activeDraft.talkingPoints as string[]).map((tp, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                          <span>{tp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Questions to Ask</p>
                    <ul className="space-y-1.5">
                      {(activeDraft.questionsToAsk as string[]).map((q, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <span className="text-blue-500 flex-shrink-0">?</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Things to Avoid</p>
                    <ul className="space-y-1.5">
                      {(activeDraft.thingsToAvoid as string[]).map((t, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <span className="text-red-400 flex-shrink-0">✗</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {activeDraft.desiredOutcome && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Desired Outcome</p>
                    <p className="text-sm">{activeDraft.desiredOutcome}</p>
                  </div>
                )}
                {activeDraft.followUpPlan && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-up Plan (within 24h)</p>
                    <p className="text-sm">{activeDraft.followUpPlan}</p>
                  </div>
                )}
              </SectionCard>
            ) : (
              <div
                className="rounded-xl border p-5 text-center"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <MessageSquare size={24} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium mb-1">No conversation prep yet</p>
                <p className="text-xs text-muted-foreground mb-4">Generate a meeting agenda, talking points, and questions for this contact.</p>
                <Button
                  size="sm"
                  className="gap-2"
                  style={{ background: "var(--color-ln-navy)", color: "white" }}
                  onClick={() => prepMutation.mutate({ draftId: activeDraft.id })}
                  disabled={prepMutation.isPending}
                >
                  {prepMutation.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Generate Conversation Prep
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <MessageSquare size={32} className="mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">Select a draft to view messages and conversation prep.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OutreachEngine() {
  const [activeTab, setActiveTab] = useState("brand");
  const [prefillCompany, setPrefillCompany] = useState("");
  const [prefillContext, setPrefillContext] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const company = params.get("company") ?? "";
    const context = params.get("context") ?? "";
    if (tab === "outreach" || tab === "brand") {
      setActiveTab(tab);
    }
    if (company) setPrefillCompany(company);
    if (context) setPrefillContext(context);
  }, []);

  return (
    <PlatformLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div
            className="rounded-xl p-3 flex-shrink-0"
            style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.08)" }}
          >
            <Sparkles size={24} style={{ color: "var(--color-ln-navy)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
              Executive Brand &amp; Outreach Engine
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              AI-powered personal brand strategy, LinkedIn content, outreach drafts, and conversation prep — all grounded in your Career Intelligence data.
            </p>
          </div>
        </div>

        {/* Radar signal context banner */}
        {prefillCompany && activeTab === "outreach" && (
          <div
            className="rounded-xl p-4 mb-6 flex items-start gap-3"
            style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.08)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.3)" }}
          >
            <Radio size={16} style={{ color: "var(--color-ln-gold)", flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Radar Signal: {prefillCompany}</p>
              {prefillContext && <p className="text-xs text-muted-foreground mt-0.5">{prefillContext}</p>}
              <p className="text-xs mt-1" style={{ color: "var(--color-ln-muted)" }}>Company pre-filled from Opportunity Radar. Fill in the contact details below to generate your outreach.</p>
            </div>
            <button onClick={() => { setPrefillCompany(""); setPrefillContext(""); }} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="brand" className="gap-2">
              <Target size={14} /> Brand Strategy
            </TabsTrigger>
            <TabsTrigger value="outreach" className="gap-2">
              <Send size={14} /> Outreach Drafts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brand">
            <BrandStrategyTab />
          </TabsContent>

          <TabsContent value="outreach">
            <OutreachDraftsTab prefillCompany={prefillCompany} />
          </TabsContent>
        </Tabs>
      </div>
    </PlatformLayout>
  );
}
