import { type ReactNode, useState } from "react";
import AcademyLayout from "../components/AcademyLayout";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  Info,
  Map,
  Search,
  ShieldCheck,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

type MapFilter = "all" | "product" | "engine" | "golden_journey";
type ContentRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ContentRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function humanizeKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

function searchableText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(searchableText).join(" ");
  if (isRecord(value)) return Object.entries(value).map(([key, child]) => `${key} ${searchableText(child)}`).join(" ");
  return String(value);
}

function renderAcademyValue(value: unknown): ReactNode {
  if (value === null || value === undefined) return null;

  if (Array.isArray(value)) {
    const objectItems = value.every((item) => isRecord(item));

    if (objectItems) {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {value.map((item, index) => {
            const entries = Object.entries(item as ContentRecord);
            const labelEntry = entries.find(([key]) => key === "label" || key === "title");
            const supportingEntries = entries.filter(([key]) => key !== "label" && key !== "title");

            return (
              <div key={index} className="rounded-lg border border-white/10 bg-[#0A1A2F]/70 p-3.5 space-y-2">
                {labelEntry && <p className="text-sm font-bold text-white">{renderAcademyValue(labelEntry[1])}</p>}
                <div className="space-y-1.5">
                  {supportingEntries.map(([key, itemValue]) => (
                    <div key={key} className="text-xs leading-relaxed">
                      <span className="font-semibold text-[#D4AF37]">{humanizeKey(key)}: </span>
                      <span className="text-[#F8F5F0]/75">{renderAcademyValue(itemValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-xs leading-relaxed text-[#F8F5F0]/80">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37]" />
            <span>{renderAcademyValue(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (isRecord(value)) {
    return (
      <div className="space-y-2">
        {Object.entries(value).map(([key, itemValue]) => (
          <div key={key} className="text-xs leading-relaxed">
            <span className="font-semibold text-white">{humanizeKey(key)}: </span>
            <span className="text-[#F8F5F0]/75">{renderAcademyValue(itemValue)}</span>
          </div>
        ))}
      </div>
    );
  }

  return String(value);
}

function InfoTip({ text }: { text?: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;

  const toggle = () => setOpen((current) => !current);
  return (
    <span
      className="group relative inline-flex cursor-help text-[#D4AF37]/80 hover:text-[#D4AF37]"
      tabIndex={0}
      role="button"
      aria-label="Show explanation"
      aria-expanded={open}
      onClick={(event) => {
        event.stopPropagation();
        toggle();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          toggle();
        }
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <HelpCircle size={13} />
      <span
        role="tooltip"
        className={`absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-lg border border-[#D4AF37]/40 bg-[#0A1A2F] p-3 text-left text-[11px] font-normal leading-relaxed text-[#F8F5F0] shadow-2xl transition ${open ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        {text}
      </span>
    </span>
  );
}

function SectionStatusButton({ understood, pending, onToggle }: { understood: boolean; pending: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
        understood
          ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
          : "border-white/15 bg-white/[0.03] text-[#F8F5F0]/65 hover:border-[#D4AF37]/60 hover:text-white"
      }`}
    >
      <CheckCircle2 size={12} />
      {understood ? "Understood" : "Mark as Understood"}
    </button>
  );
}

function SectionCard({
  title,
  tooltip,
  value,
  understood,
  pending,
  onToggle,
}: {
  title: string;
  tooltip?: string;
  value: unknown;
  understood: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`rounded-xl border p-4 space-y-3 transition ${understood ? "border-emerald-400/30 bg-emerald-400/[0.04]" : "border-white/5 bg-white/[0.02]"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-bold text-[#D4AF37]">
          {title}
          <InfoTip text={tooltip} />
        </p>
        <SectionStatusButton understood={understood} pending={pending} onToggle={onToggle} />
      </div>
      <div className="text-xs text-[#F8F5F0]/80 leading-relaxed">{renderAcademyValue(value)}</div>
    </div>
  );
}

function GuidePanel({
  content,
  understood,
  glossaryUnderstood,
  pending,
  onToggle,
  onToggleGlossary,
}: {
  content: ContentRecord;
  understood: boolean;
  glossaryUnderstood: boolean;
  pending: boolean;
  onToggle: () => void;
  onToggleGlossary: () => void;
}) {
  const definitions = isRecord(content.definitions) ? content.definitions : {};
  const tooltips = isRecord(content.tooltips) ? content.tooltips : {};

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className={`rounded-xl border p-5 space-y-3 transition ${understood ? "border-emerald-400/30 bg-emerald-400/[0.04]" : "border-[#D4AF37]/30 bg-[#D4AF37]/[0.08]"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]"><Info size={15} /> How to Understand This Section</div>
          <SectionStatusButton understood={understood} pending={pending} onToggle={onToggle} />
        </div>
        <p className="text-sm leading-relaxed text-[#F8F5F0]/85">{String(content.howToUnderstand ?? "Read this section from the user's problem first, then connect the product language to a real workplace moment.")}</p>
      </div>

      <div className={`rounded-xl border p-5 space-y-3 transition ${glossaryUnderstood ? "border-emerald-400/30 bg-emerald-400/[0.04]" : "border-white/10 bg-white/[0.03]"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]"><BookOpen size={15} /> Newcomer Glossary</div>
          <SectionStatusButton understood={glossaryUnderstood} pending={pending} onToggle={onToggleGlossary} />
        </div>
        {Object.keys(definitions).length > 0 ? (
          <div className="space-y-2.5">
            {Object.entries(definitions).map(([term, definition]) => (
              <div key={term} className="text-xs leading-relaxed">
                <p className="flex items-center gap-1.5 font-semibold text-white">{term}<InfoTip text={String(tooltips[term] ?? `Definition of ${term}.`)} /></p>
                <p className="text-[#F8F5F0]/65">{renderAcademyValue(definition)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#F8F5F0]/60">Hover or click the question-mark icons beside section headings for plain-language context.</p>
        )}
      </div>
    </div>
  );
}

function TierCard({ tier, expanded, onToggle }: { tier: ContentRecord; expanded: boolean; onToggle: () => void }) {
  const tierLabel = String(tier.label ?? tier.title ?? "Product tier");
  const route = typeof tier.route === "string" ? tier.route : undefined;
  const derailleurs = Array.isArray(tier.primaryDerailers) ? tier.primaryDerailers : [];
  const personas = Array.isArray(tier.targetPersonas) ? tier.targetPersonas : [];
  const moves = Array.isArray(tier.recommendedBehaviouralMoves) ? tier.recommendedBehaviouralMoves : [];

  return (
    <div className={`rounded-xl border transition ${expanded ? "border-[#D4AF37]/60 bg-[#0A1A2F]/90" : "border-white/10 bg-[#0A1A2F]/70"}`}>
      <div className="p-4 flex items-start gap-3">
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="min-w-0 flex-1 text-left hover:bg-white/[0.04] transition rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2"><p className="text-sm font-bold text-white">{tierLabel}</p><InfoTip text="Click to reveal the likely derailers, target personas, and behavioural moves for this transition." /></div>
            <p className="text-[11px] leading-relaxed text-[#F8F5F0]/70">{String(tier.focus ?? "")}</p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {route && <Link href={route} onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1 rounded-md bg-[#D4AF37] px-2.5 py-1.5 text-[10px] font-bold text-[#0A1A2F] hover:bg-[#c49f2e] transition"><ExternalLink size={11} /> Open</Link>}
          <button type="button" onClick={onToggle} aria-label={`${expanded ? "Collapse" : "Expand"} ${tierLabel}`} className="rounded-md p-1.5 text-[#D4AF37] hover:bg-white/10"><ChevronDown size={17} className={`transition-transform ${expanded ? "rotate-180" : ""}`} /></button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-300"><Zap size={13} /> Primary Derailers</p><ul className="space-y-1.5 text-xs text-[#F8F5F0]/75">{derailleurs.map((item, index) => <li key={index}>• {String(item)}</li>)}</ul></div>
            <div className="space-y-2"><p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-300"><Users size={13} /> Target Personas</p><ul className="space-y-1.5 text-xs text-[#F8F5F0]/75">{personas.map((item, index) => <li key={index}>• {String(item)}</li>)}</ul></div>
            <div className="space-y-2"><p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300"><Target size={13} /> Recommended Moves</p><ul className="space-y-1.5 text-xs text-[#F8F5F0]/75">{moves.map((item, index) => <li key={index}>• {String(item)}</li>)}</ul></div>
          </div>
          {typeof tier.howToUse === "string" && <div className="rounded-lg bg-white/[0.04] p-3 text-xs leading-relaxed text-[#F8F5F0]/75"><span className="font-semibold text-[#D4AF37]">How to use this tier: </span>{tier.howToUse}</div>}
        </div>
      )}
    </div>
  );
}

export default function AcademyProductMap() {
  const { data: objects, isLoading } = trpc.academy.getProductMap.useQuery();
  const { data: savedProgress } = trpc.academy.getProductMapProgress.useQuery();
  const exploreMutation = trpc.academy.recordStepExploration.useMutation();
  const progressMutation = trpc.academy.markSectionUnderstood.useMutation();
  const utils = trpc.useUtils();
  const [selectedSlug, setSelectedSlug] = useState("golden-journey-first-time-manager");
  const [activeFilter, setActiveFilter] = useState<MapFilter>("all");
  const [expandedTierCode, setExpandedTierCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [localProgress, setLocalProgress] = useState<Record<string, boolean>>({});

  if (isLoading || !objects) {
    return <AcademyLayout stageBadge="Product Map"><div className="py-24 text-center"><div className="h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-sm text-[#F8F5F0]/70">Loading interactive Product Map...</p></div></AcademyLayout>;
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleObjects = objects.filter((object) => {
    const matchesFilter = activeFilter === "all" || object.objectType === activeFilter;
    const matchesSearch = !normalizedSearch || searchableText(object).toLowerCase().includes(normalizedSearch);
    return matchesFilter && matchesSearch;
  });
  const selectedObject = visibleObjects.find((object) => object.slug === selectedSlug) ?? visibleObjects[0];
  const selectedContent = (selectedObject?.content as ContentRecord | undefined) ?? {};
  const tiers = Array.isArray(selectedContent.tiers) ? selectedContent.tiers.filter(isRecord) : [];
  const tooltips = isRecord(selectedContent.tooltips) ? selectedContent.tooltips : {};
  const metadataKeys = new Set(["howToUnderstand", "definitions", "tooltips", "tiers", "route"]);
  const progressState = { ...(savedProgress ?? {}), ...localProgress };
  const sectionKey = (key: string) => selectedObject ? `${selectedObject.slug}::${key}` : key;
  const isUnderstood = (key: string) => progressState[sectionKey(key)] === true;

  const toggleSection = async (key: string, title: string) => {
    if (!selectedObject) return;
    const objectKey = sectionKey(key);
    const nextValue = !isUnderstood(key);
    setLocalProgress((current) => ({ ...current, [objectKey]: nextValue }));
    try {
      await progressMutation.mutateAsync({ slug: selectedObject.slug, sectionKey: key, sectionTitle: title, understood: nextValue });
      await utils.academy.getProductMapProgress.invalidate();
      toast.success(nextValue ? `Marked "${title}" as understood.` : `Removed "${title}" from understood sections.`);
    } catch {
      setLocalProgress((current) => ({ ...current, [objectKey]: !nextValue }));
      toast.error("Could not save your Academy progress.");
    }
  };

  const handleRecordExploration = async () => {
    if (!selectedObject) return;
    try {
      await exploreMutation.mutateAsync({ slug: selectedObject.slug, stepTitle: selectedObject.title, dimension: "navigate" });
      toast.success(`Explored "${selectedObject.title}". Added to Passport evidence.`);
    } catch {
      toast.error("Could not record step.");
    }
  };

  const filters: { key: MapFilter; label: string }[] = [
    { key: "all", label: "All Nodes" },
    { key: "product", label: "Products" },
    { key: "engine", label: "Engines" },
    { key: "golden_journey", label: "Golden Journeys" },
  ];

  return (
    <AcademyLayout stageBadge="Product Map">
      <div className="space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5"><Map size={14} /> Interactive Product Architecture</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">The LevelNext Product & Capability Universe</h1>
          <p className="text-sm text-[#F8F5F0]/70 max-w-3xl">LevelNext is a single interconnected intelligence architecture. Select a product, engine, or journey below to understand who it serves, what it changes, and where to experience it.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2"><p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">Find in Product Map</p><InfoTip text="Search titles, summaries, products, engines, glossary definitions, and behavioural terms." /></div>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F8F5F0]/45" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search products, engines, or glossary terms" aria-label="Search Product Map" className="w-full rounded-lg border border-white/15 bg-white/[0.04] py-2.5 pl-9 pr-9 text-xs text-white outline-none placeholder:text-[#F8F5F0]/40 focus:border-[#D4AF37]/70" />
                {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#F8F5F0]/50 hover:text-white"><X size={14} /></button>}
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Product Map filters">
                {filters.map((filter) => <button key={filter.key} type="button" onClick={() => { setActiveFilter(filter.key); setExpandedTierCode(null); }} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${activeFilter === filter.key ? "border-[#D4AF37] bg-[#D4AF37] text-[#0A1A2F]" : "border-white/15 bg-white/[0.03] text-[#F8F5F0]/70 hover:border-[#D4AF37]/60 hover:text-white"}`}>{filter.label}</button>)}
              </div>
              <p className="text-[11px] text-[#F8F5F0]/50">{visibleObjects.length} of {objects.length} knowledge nodes shown</p>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {visibleObjects.length > 0 ? visibleObjects.map((obj) => {
                const isSelected = obj.slug === selectedObject?.slug;
                return <button key={obj.slug} type="button" onClick={() => { setSelectedSlug(obj.slug); setExpandedTierCode(null); }} className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${isSelected ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-md" : "bg-[#1C1C1C] border-white/10 text-[#F8F5F0]/80 hover:bg-white/5 hover:border-white/20"}`}><div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${isSelected ? "bg-[#D4AF37] text-[#0A1A2F]" : "bg-white/10 text-[#D4AF37]"}`}>{obj.objectType === "engine" ? <Zap size={14} /> : <BookOpen size={14} />}</div><div className="space-y-1"><p className="text-xs font-bold leading-snug">{obj.title}</p><span className="inline-block text-[10px] uppercase font-semibold text-[#D4AF37]/80">{obj.objectType.replace("_", " ")}</span></div></button>;
              }) : <div className="rounded-xl border border-dashed border-white/15 p-5 text-center text-xs text-[#F8F5F0]/60">No Product Map nodes match your search. Try a product name, engine, or glossary term.</div>}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedObject ? <div className="bg-[#1C1C1C] border border-[#D4AF37]/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><div><span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">{selectedObject.objectType.replace("_", " ")}</span><h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5">{selectedObject.title}</h2></div><button type="button" onClick={handleRecordExploration} disabled={exploreMutation.isPending} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#0A1A2F] text-xs font-bold hover:bg-[#c49f2e] transition shadow"><ShieldCheck size={14} /> <span>Record in Passport</span></button></div>
              <p className="text-sm text-[#F8F5F0]/90 leading-relaxed font-medium">{selectedObject.summary}</p>

              <GuidePanel content={selectedContent} understood={isUnderstood("orientation")} glossaryUnderstood={isUnderstood("glossary")} pending={progressMutation.isPending} onToggle={() => toggleSection("orientation", "How to Understand This Section")} onToggleGlossary={() => toggleSection("glossary", "Newcomer Glossary")} />

              {tiers.length > 0 && <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Leadership Transition Tiers</h3><InfoTip text={String(tooltips.tiers ?? "Click any tier to reveal who it serves, what can derail progress, and which behavioural moves to practise next.")} /></div><SectionStatusButton understood={isUnderstood("tiers")} pending={progressMutation.isPending} onToggle={() => toggleSection("tiers", "Leadership Transition Tiers")} /></div><div className="space-y-3">{tiers.map((tier) => { const code = String(tier.code ?? tier.label ?? "tier"); return <TierCard key={code} tier={tier} expanded={expandedTierCode === code} onToggle={() => setExpandedTierCode(expandedTierCode === code ? null : code)} />; })}</div></div>}

              <div className="space-y-4 pt-2">{Object.entries(selectedContent).filter(([key]) => !metadataKeys.has(key)).map(([key, val]) => <SectionCard key={key} title={humanizeKey(key)} tooltip={typeof tooltips[key] === "string" ? String(tooltips[key]) : undefined} value={val} understood={isUnderstood(key)} pending={progressMutation.isPending} onToggle={() => toggleSection(key, humanizeKey(key))} />)}</div>

              {typeof selectedContent.route === "string" && <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-white">Live Experience Route</p><p className="text-[11px] text-[#F8F5F0]/60">Open the product surface and connect the explanation to a real workflow.</p></div><Link href={selectedContent.route} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"><ExternalLink size={13} /> <span>Open Live Route</span> <ArrowRight size={14} /></Link></div>}
            </div> : <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-sm text-[#F8F5F0]/60">Select a Product Map node to begin.</div>}
          </div>
        </div>
      </div>
    </AcademyLayout>
  );
}
