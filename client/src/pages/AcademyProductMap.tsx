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
  ShieldCheck,
  Target,
  Users,
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
  if (!text) return null;
  return (
    <span
      title={text}
      aria-label={text}
      className="inline-flex cursor-help text-[#D4AF37]/80 hover:text-[#D4AF37]"
    >
      <HelpCircle size={13} />
    </span>
  );
}

function GuidePanel({ content }: { content: ContentRecord }) {
  const definitions = isRecord(content.definitions) ? content.definitions : {};
  const tooltips = isRecord(content.tooltips) ? content.tooltips : {};

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
          <Info size={15} /> How to Understand This Section
        </div>
        <p className="text-sm leading-relaxed text-[#F8F5F0]/85">
          {String(content.howToUnderstand ?? "Read this section from the user's problem first, then connect the product language to a real workplace moment.")}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
          <BookOpen size={15} /> Newcomer Glossary
        </div>
        {Object.keys(definitions).length > 0 ? (
          <div className="space-y-2.5">
            {Object.entries(definitions).map(([term, definition]) => (
              <div key={term} className="text-xs leading-relaxed">
                <p className="flex items-center gap-1.5 font-semibold text-white">
                  {term}
                  <InfoTip text={String(tooltips[term] ?? `Definition of ${term}.`)} />
                </p>
                <p className="text-[#F8F5F0]/65">{renderAcademyValue(definition)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#F8F5F0]/60">Hover the question-mark icons beside section headings for plain-language context.</p>
        )}
      </div>
    </div>
  );
}

function TierCard({
  tier,
  expanded,
  onToggle,
}: {
  tier: ContentRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tierLabel = String(tier.label ?? tier.title ?? "Product tier");
  const route = typeof tier.route === "string" ? tier.route : undefined;
  const derailleurs = Array.isArray(tier.primaryDerailers) ? tier.primaryDerailers : [];
  const personas = Array.isArray(tier.targetPersonas) ? tier.targetPersonas : [];
  const moves = Array.isArray(tier.recommendedBehaviouralMoves) ? tier.recommendedBehaviouralMoves : [];

  return (
    <div className={`rounded-xl border transition ${expanded ? "border-[#D4AF37]/60 bg-[#0A1A2F]/90" : "border-white/10 bg-[#0A1A2F]/70"}`}>
      <div className="p-4 flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="min-w-0 flex-1 text-left hover:bg-white/[0.04] transition rounded-lg"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">{tierLabel}</p>
              <InfoTip text="Click to reveal the likely derailers, target personas, and behavioural moves for this transition." />
            </div>
            <p className="text-[11px] leading-relaxed text-[#F8F5F0]/70">{String(tier.focus ?? "")}</p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {route && (
            <Link
              href={route}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-md bg-[#D4AF37] px-2.5 py-1.5 text-[10px] font-bold text-[#0A1A2F] hover:bg-[#c49f2e] transition"
            >
              <ExternalLink size={11} /> Open
            </Link>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${tierLabel}`}
            className="rounded-md p-1.5 text-[#D4AF37] hover:bg-white/10"
          >
            <ChevronDown size={17} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-300">
                <Zap size={13} /> Primary Derailers
              </p>
              <ul className="space-y-1.5 text-xs text-[#F8F5F0]/75">
                {derailleurs.map((item, index) => <li key={index}>• {String(item)}</li>)}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-300">
                <Users size={13} /> Target Personas
              </p>
              <ul className="space-y-1.5 text-xs text-[#F8F5F0]/75">
                {personas.map((item, index) => <li key={index}>• {String(item)}</li>)}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                <Target size={13} /> Recommended Moves
              </p>
              <ul className="space-y-1.5 text-xs text-[#F8F5F0]/75">
                {moves.map((item, index) => <li key={index}>• {String(item)}</li>)}
              </ul>
            </div>
          </div>
          {typeof tier.howToUse === "string" && (
            <div className="rounded-lg bg-white/[0.04] p-3 text-xs leading-relaxed text-[#F8F5F0]/75">
              <span className="font-semibold text-[#D4AF37]">How to use this tier: </span>
              {tier.howToUse}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AcademyProductMap() {
  const { data: objects, isLoading } = trpc.academy.getProductMap.useQuery();
  const exploreMutation = trpc.academy.recordStepExploration.useMutation();
  const [selectedSlug, setSelectedSlug] = useState<string>("golden-journey-first-time-manager");
  const [activeFilter, setActiveFilter] = useState<MapFilter>("all");
  const [expandedTierCode, setExpandedTierCode] = useState<string | null>(null);

  if (isLoading || !objects) {
    return (
      <AcademyLayout stageBadge="Product Map">
        <div className="py-24 text-center">
          <div className="h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#F8F5F0]/70">Loading interactive Product Map...</p>
        </div>
      </AcademyLayout>
    );
  }

  const visibleObjects = activeFilter === "all" ? objects : objects.filter((object) => object.objectType === activeFilter);
  const selectedObject = visibleObjects.find((object) => object.slug === selectedSlug) ?? visibleObjects[0];
  const selectedContent = (selectedObject?.content as ContentRecord | undefined) ?? {};
  const tiers = Array.isArray(selectedContent.tiers) ? selectedContent.tiers.filter(isRecord) : [];
  const tooltips = isRecord(selectedContent.tooltips) ? selectedContent.tooltips : {};
  const metadataKeys = new Set(["howToUnderstand", "definitions", "tooltips", "tiers", "route"]);

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
          <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
            <Map size={14} /> Interactive Product Architecture
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">The LevelNext Product & Capability Universe</h1>
          <p className="text-sm text-[#F8F5F0]/70 max-w-3xl">
            LevelNext is a single interconnected intelligence architecture. Select a product, engine, or journey below to understand who it serves, what it changes, and where to experience it.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">Product Knowledge Nodes</p>
                <InfoTip text="Use these filters to focus your learning. Products are user-facing applications; engines are reusable platform capabilities; Golden Journeys are end-to-end stories." />
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Product Map filters">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => {
                      setActiveFilter(filter.key);
                      setExpandedTierCode(null);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                      activeFilter === filter.key
                        ? "border-[#D4AF37] bg-[#D4AF37] text-[#0A1A2F]"
                        : "border-white/15 bg-white/[0.03] text-[#F8F5F0]/70 hover:border-[#D4AF37]/60 hover:text-white"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {visibleObjects.map((obj) => {
                const isSelected = obj.slug === selectedObject?.slug;
                return (
                  <button
                    key={obj.slug}
                    type="button"
                    onClick={() => {
                      setSelectedSlug(obj.slug);
                      setExpandedTierCode(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
                      isSelected ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-md" : "bg-[#1C1C1C] border-white/10 text-[#F8F5F0]/80 hover:bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${isSelected ? "bg-[#D4AF37] text-[#0A1A2F]" : "bg-white/10 text-[#D4AF37]"}`}>
                      {obj.objectType === "engine" ? <Zap size={14} /> : <BookOpen size={14} />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold leading-snug">{obj.title}</p>
                      <span className="inline-block text-[10px] uppercase font-semibold text-[#D4AF37]/80">{obj.objectType.replace("_", " ")}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedObject && (
              <div className="bg-[#1C1C1C] border border-[#D4AF37]/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">{selectedObject.objectType.replace("_", " ")}</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5">{selectedObject.title}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleRecordExploration}
                    disabled={exploreMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#0A1A2F] text-xs font-bold hover:bg-[#c49f2e] transition shadow"
                  >
                    <ShieldCheck size={14} /> <span>Record in Passport</span>
                  </button>
                </div>

                <p className="text-sm text-[#F8F5F0]/90 leading-relaxed font-medium">{selectedObject.summary}</p>

                <GuidePanel content={selectedContent} />

                {tiers.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Leadership Transition Tiers</h3>
                      <InfoTip text={String(tooltips.tiers ?? "Click any tier to reveal who it serves, what can derail progress, and which behavioural moves to practise next.")} />
                    </div>
                    <div className="space-y-3">
                      {tiers.map((tier) => {
                        const code = String(tier.code ?? tier.label ?? "tier");
                        return (
                          <TierCard
                            key={code}
                            tier={tier}
                            expanded={expandedTierCode === code}
                            onToggle={() => setExpandedTierCode(expandedTierCode === code ? null : code)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-2">
                  {Object.entries(selectedContent).filter(([key]) => !metadataKeys.has(key)).map(([key, val]) => (
                    <div key={key} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                      <p className="flex items-center gap-2 text-xs font-bold text-[#D4AF37]">
                        {humanizeKey(key)}
                        <InfoTip text={typeof tooltips[key] === "string" ? String(tooltips[key]) : undefined} />
                      </p>
                      <div className="text-xs text-[#F8F5F0]/80 leading-relaxed">{renderAcademyValue(val)}</div>
                    </div>
                  ))}
                </div>

                {typeof selectedContent.route === "string" && (
                  <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-white">Live Experience Route</p>
                      <p className="text-[11px] text-[#F8F5F0]/60">Open the product surface and connect the explanation to a real workflow.</p>
                    </div>
                    <Link href={selectedContent.route} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition">
                      <ExternalLink size={13} /> <span>Open Live Route</span> <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AcademyLayout>
  );
}
