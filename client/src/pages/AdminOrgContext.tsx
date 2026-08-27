import React, { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAdminTenantSelection } from "@/lib/adminTenantSelection";
import { mergeWebsiteExtraction, normaliseWebsiteUrl, populatedExtractionFieldCount, type WebsiteExtraction, type WebsiteExtractionSources } from "@/lib/orgContextExtraction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Globe, Save, RefreshCw, RotateCcw, Plus, X, Loader2, Building2, Target, Eye, Star,
  ListChecks, Heart, Upload, ImageIcon, BookOpen, ChevronDown, ChevronUp, Quote, ExternalLink,
} from "lucide-react";

type Framework = { name: string; description: string; competencies: string[] };

const TABS = ["Identity", "Strategy", "Logo", "Frameworks"] as const;
type Tab = typeof TABS[number];

export function ExtractionSourceNote({ source }: { source?: { snippet: string; sourceUrl: string } }) {
  if (!source) return null;
  let hostname = source.sourceUrl;
  try { hostname = new URL(source.sourceUrl).hostname; } catch { /* use the provided source URL */ }
  return <div className="mt-2 flex gap-2 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "oklch(88% 0.03 85)", background: "oklch(97% 0.02 85)", color: "oklch(42% 0.02 248.6)" }}>
    <Quote size={13} className="mt-0.5 shrink-0" style={{ color: "var(--color-ln-gold)" }} />
    <p className="leading-relaxed">{source.snippet} <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-0.5 font-medium underline" style={{ color: "var(--color-ln-navy)" }}>Source: {hostname}<ExternalLink size={10} /></a></p>
  </div>;
}

export default function AdminOrgContext() {
  const { tenantId } = useAdminTenantSelection();
  const [activeTab, setActiveTab] = useState<Tab>("Identity");
  const { data: context, refetch, isLoading } = trpc.orgContext.getOrgContext.useQuery({ tenantId });

  const saveMutation = trpc.orgContext.saveOrgContext.useMutation({
    onSuccess: () => { refetch(); toast.success("Organisation context saved."); },
    onError: (e) => toast.error(`Save failed: ${e.message}`),
  });
  const scrapeMutation = trpc.orgContext.scrapeWebsite.useMutation({
    onSuccess: (data) => {
      const extracted = data.extracted as WebsiteExtraction;
      const merged = mergeWebsiteExtraction({ companyName, mission, vision, northStar, strategicGoals: goals, values }, extracted);
      setCompanyName(merged.companyName);
      setMission(merged.mission);
      setVision(merged.vision);
      setNorthStar(merged.northStar);
      setGoals(merged.strategicGoals);
      setValues(merged.values);
      setExtractionSources((data.extractionSources ?? {}) as WebsiteExtractionSources);
      setCanRetryAbout(!data.usedFallback);
      const populated = populatedExtractionFieldCount(extracted);
      const contributingFallback = data.fallbackPagesTried?.find((page) => page.contributed)?.label;
      if (contributingFallback) toast.success(`${contributingFallback} checked — additional organisation context was found and populated.`);
      else if (populated) toast.success(`Website scraped — populated ${populated} organisation context field${populated === 1 ? "" : "s"}.`);
      else toast.warning("Website was captured, but no mission, vision, goals, or values were confidently detected. You can complete the fields manually.");
    },
    onError: (e) => toast.error(`Scrape failed: ${e.message}`),
  });
  const uploadLogoMutation = trpc.orgContext.uploadLogo.useMutation({
    onSuccess: (data) => { refetch(); setLogoPreview(data.logoUrl); toast.success("Logo uploaded successfully."); },
    onError: (e) => toast.error(`Logo upload failed: ${e.message}`),
  });
  const saveFrameworksMutation = trpc.orgContext.saveLeadershipFrameworks.useMutation({
    onSuccess: () => { refetch(); toast.success("Leadership frameworks saved."); },
    onError: (e) => toast.error(`Save failed: ${e.message}`),
  });

  // Identity fields
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [northStar, setNorthStar] = useState("");
  const [goals, setGoals] = useState<string[]>([""]);
  const [values, setValues] = useState<string[]>([""]);
  const [extractionSources, setExtractionSources] = useState<WebsiteExtractionSources>({});
  const [canRetryAbout, setCanRetryAbout] = useState(false);

  // Logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Frameworks
  const [frameworks, setFrameworks] = useState<Framework[]>([
    { name: "", description: "", competencies: [""] },
  ]);
  const [expandedFramework, setExpandedFramework] = useState<number>(0);

  useEffect(() => {
    if (context) {
      setWebsiteUrl(context.websiteUrl ?? "");
      setCompanyName(context.companyName ?? "");
      setMission(context.mission ?? "");
      setVision(context.vision ?? "");
      setNorthStar(context.northStar ?? "");
      setGoals(context.strategicGoals?.length ? context.strategicGoals : [""]);
      setValues(context.values?.length ? context.values : [""]);
      setExtractionSources((context.extractionSources ?? {}) as WebsiteExtractionSources);
      if (context.logoUrl) setLogoPreview(context.logoUrl);
      if (context.leadershipFrameworks?.length) {
        setFrameworks(context.leadershipFrameworks.map((f) => ({
          name: f.name,
          description: f.description ?? "",
          competencies: f.competencies.length ? f.competencies : [""],
        })));
      }
    }
  }, [context]);

  const handleSaveIdentity = () => {
    saveMutation.mutate({
      tenantId: tenantId ?? undefined,
      websiteUrl: websiteUrl || undefined,
      companyName: companyName || undefined,
      mission: mission || undefined,
      vision: vision || undefined,
      northStar: northStar || undefined,
      strategicGoals: goals.filter(Boolean),
      values: values.filter(Boolean),
    });
  };

  const handleSaveFrameworks = () => {
    const valid = frameworks.filter((f) => f.name.trim());
    if (!valid.length) { toast.error("Add at least one framework with a name."); return; }
    saveFrameworksMutation.mutate({
      tenantId: tenantId ?? undefined,
      frameworks: valid.map((f) => ({
        name: f.name.trim(),
        description: f.description.trim(),
        competencies: f.competencies.filter(Boolean),
      })),
    });
  };

  const handleWebsiteExtraction = (preferAbout = false) => {
    const normalizedUrl = normaliseWebsiteUrl(websiteUrl);
    if (!normalizedUrl) {
      toast.error("Enter a valid company website, such as www.parkcontrols.com.");
      return;
    }
    setWebsiteUrl(normalizedUrl);
    scrapeMutation.mutate({ url: normalizedUrl, tenantId: tenantId ?? undefined, preferAbout });
  };

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      uploadLogoMutation.mutate({ tenantId: tenantId ?? undefined, fileName: file.name, mimeType: file.type, base64Data: base64 });
    };
    reader.readAsDataURL(file);
  };

  const updateList = (list: string[], setList: (v: string[]) => void, idx: number, val: string) => {
    const next = [...list]; next[idx] = val; setList(next);
  };
  const removeFromList = (list: string[], setList: (v: string[]) => void, idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const updateFramework = (idx: number, field: keyof Framework, value: string | string[]) => {
    const next = [...frameworks];
    (next[idx] as any)[field] = value;
    setFrameworks(next);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-ln-navy)" }} />
      </div>
    );
  }

  const cardStyle = { background: "white", borderColor: "oklch(90% 0.01 248.6)" };
  const navy = "var(--color-ln-navy)";
  const muted = "oklch(50% 0.02 248.6)";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: navy }}>Organisation Context</h1>
          <p className="text-sm" style={{ color: muted }}>
            Configure your company identity, logo, and leadership frameworks. This context enriches AI coaching for all participants.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1 border" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
              style={activeTab === tab
                ? { background: navy, color: "white" }
                : { color: muted }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── IDENTITY TAB ── */}
        {activeTab === "Identity" && (
          <div className="space-y-5">
            {/* Website scraper */}
            <div className="rounded-2xl p-6 border space-y-4" style={cardStyle}>
              <div className="flex items-center gap-2 mb-1">
                <Globe size={16} style={{ color: navy }} />
                <h2 className="text-sm font-semibold" style={{ color: navy }}>Auto-extract from Website</h2>
              </div>
              <p className="text-xs" style={{ color: muted }}>
                Enter your company website URL and we'll extract mission, vision, goals, and values automatically.
              </p>
              <div className="flex gap-2">
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yourcompany.com" className="flex-1 text-sm" />
                <Button variant="outline" onClick={() => handleWebsiteExtraction()} disabled={scrapeMutation.isPending} className="shrink-0">
                  {scrapeMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <RefreshCw size={14} className="mr-1.5" />}
                  Extract
                </Button>
              </div>
              {canRetryAbout && <Button variant="ghost" size="sm" onClick={() => handleWebsiteExtraction(true)} disabled={scrapeMutation.isPending} className="-ml-2 h-7 px-2 text-xs" style={{ color: navy }}><RotateCcw size={12} className="mr-1" /> Try fallback pages</Button>}
              {context?.scrapedAt && <p className="text-xs" style={{ color: muted }}>Last scraped: {new Date(context.scrapedAt).toLocaleString()}</p>}
            </div>

            {/* Company name */}
            <div className="rounded-2xl p-6 border space-y-3" style={cardStyle}>
              <div className="flex items-center gap-2"><Building2 size={15} style={{ color: navy }} /><h2 className="text-sm font-semibold" style={{ color: navy }}>Company Name</h2></div>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Acme Corporation" className="text-sm" />
              <ExtractionSourceNote source={extractionSources.companyName} />
            </div>

            {/* Mission */}
            <div className="rounded-2xl p-6 border space-y-3" style={cardStyle}>
              <div className="flex items-center gap-2"><Target size={15} style={{ color: navy }} /><h2 className="text-sm font-semibold" style={{ color: navy }}>Mission</h2><span className="text-xs ml-auto" style={{ color: muted }}>Why we exist</span></div>
              <Textarea value={mission} onChange={(e) => setMission(e.target.value)} placeholder="e.g. To empower every person and every organisation on the planet to achieve more." className="text-sm min-h-[80px] resize-none" rows={3} />
              <ExtractionSourceNote source={extractionSources.mission} />
            </div>

            {/* Vision */}
            <div className="rounded-2xl p-6 border space-y-3" style={cardStyle}>
              <div className="flex items-center gap-2"><Eye size={15} style={{ color: navy }} /><h2 className="text-sm font-semibold" style={{ color: navy }}>Vision</h2><span className="text-xs ml-auto" style={{ color: muted }}>Where we are going</span></div>
              <Textarea value={vision} onChange={(e) => setVision(e.target.value)} placeholder="e.g. A world where every leader reaches their full potential." className="text-sm min-h-[80px] resize-none" rows={3} />
              <ExtractionSourceNote source={extractionSources.vision} />
            </div>

            {/* North Star */}
            <div className="rounded-2xl p-6 border space-y-3" style={cardStyle}>
              <div className="flex items-center gap-2"><Star size={15} style={{ color: navy }} /><h2 className="text-sm font-semibold" style={{ color: navy }}>North Star</h2><span className="text-xs ml-auto" style={{ color: muted }}>Primary goal or metric</span></div>
              <Textarea value={northStar} onChange={(e) => setNorthStar(e.target.value)} placeholder="e.g. Become the most trusted leadership development platform in Asia by 2027." className="text-sm min-h-[60px] resize-none" rows={2} />
              <ExtractionSourceNote source={extractionSources.northStar} />
            </div>

            {/* Strategic Goals */}
            {extractionSources.strategicGoals && <ExtractionSourceNote source={extractionSources.strategicGoals} />}
            <div className="rounded-2xl p-6 border space-y-3" style={cardStyle}>
              <div className="flex items-center gap-2"><ListChecks size={15} style={{ color: navy }} /><h2 className="text-sm font-semibold" style={{ color: navy }}>Strategic Goals</h2><span className="text-xs ml-auto" style={{ color: muted }}>Up to 10</span></div>
              <div className="space-y-2">
                {goals.map((goal, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={goal} onChange={(e) => updateList(goals, setGoals, i, e.target.value)} placeholder={`Goal ${i + 1}`} className="text-sm flex-1" />
                    {goals.length > 1 && <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-red-400 hover:text-red-600" onClick={() => removeFromList(goals, setGoals, i)}><X size={13} /></Button>}
                  </div>
                ))}
                {goals.length < 10 && <Button size="sm" variant="ghost" className="text-xs h-7 px-2" style={{ color: navy }} onClick={() => setGoals([...goals, ""])}><Plus size={12} className="mr-1" /> Add Goal</Button>}
              </div>
            </div>

            {/* Values */}
            {extractionSources.values && <ExtractionSourceNote source={extractionSources.values} />}
            <div className="rounded-2xl p-6 border space-y-3" style={cardStyle}>
              <div className="flex items-center gap-2"><Heart size={15} style={{ color: navy }} /><h2 className="text-sm font-semibold" style={{ color: navy }}>Company Values</h2><span className="text-xs ml-auto" style={{ color: muted }}>Up to 15</span></div>
              <div className="flex flex-wrap gap-2">
                {values.map((val, i) => (
                  <div key={i} className="flex items-center gap-1 rounded-full px-3 py-1 border text-sm" style={{ borderColor: "oklch(85% 0.01 248.6)", background: "oklch(96% 0.005 248.6)" }}>
                    <input value={val} onChange={(e) => updateList(values, setValues, i, e.target.value)} placeholder={`Value ${i + 1}`} className="bg-transparent outline-none text-xs w-24" style={{ color: navy }} />
                    {values.length > 1 && <button className="text-red-400 hover:text-red-600 ml-1" onClick={() => removeFromList(values, setValues, i)}><X size={11} /></button>}
                  </div>
                ))}
                {values.length < 15 && <button className="rounded-full px-3 py-1 border border-dashed text-xs" style={{ borderColor: "oklch(75% 0.01 248.6)", color: muted }} onClick={() => setValues([...values, ""])}>+ Add Value</button>}
              </div>
            </div>

            <div className="flex justify-end pb-4">
              <Button onClick={handleSaveIdentity} disabled={saveMutation.isPending} style={{ background: navy, color: "white" }}>
                {saveMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
                Save Identity
              </Button>
            </div>
          </div>
        )}

        {/* ── STRATEGY TAB (Goals + Values quick edit) ── */}
        {activeTab === "Strategy" && (
          <div className="space-y-5">
            <div className="rounded-2xl p-6 border space-y-3" style={cardStyle}>
              <div className="flex items-center gap-2"><ListChecks size={15} style={{ color: navy }} /><h2 className="text-sm font-semibold" style={{ color: navy }}>Strategic Goals</h2><span className="text-xs ml-auto" style={{ color: muted }}>Up to 10</span></div>
              <div className="space-y-2">
                {goals.map((goal, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={goal} onChange={(e) => updateList(goals, setGoals, i, e.target.value)} placeholder={`Goal ${i + 1}`} className="text-sm flex-1" />
                    {goals.length > 1 && <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-red-400 hover:text-red-600" onClick={() => removeFromList(goals, setGoals, i)}><X size={13} /></Button>}
                  </div>
                ))}
                {goals.length < 10 && <Button size="sm" variant="ghost" className="text-xs h-7 px-2" style={{ color: navy }} onClick={() => setGoals([...goals, ""])}><Plus size={12} className="mr-1" /> Add Goal</Button>}
              </div>
            </div>
            <div className="rounded-2xl p-6 border space-y-3" style={cardStyle}>
              <div className="flex items-center gap-2"><Heart size={15} style={{ color: navy }} /><h2 className="text-sm font-semibold" style={{ color: navy }}>Company Values</h2></div>
              <div className="flex flex-wrap gap-2">
                {values.map((val, i) => (
                  <div key={i} className="flex items-center gap-1 rounded-full px-3 py-1 border text-sm" style={{ borderColor: "oklch(85% 0.01 248.6)", background: "oklch(96% 0.005 248.6)" }}>
                    <input value={val} onChange={(e) => updateList(values, setValues, i, e.target.value)} placeholder={`Value ${i + 1}`} className="bg-transparent outline-none text-xs w-24" style={{ color: navy }} />
                    {values.length > 1 && <button className="text-red-400 hover:text-red-600 ml-1" onClick={() => removeFromList(values, setValues, i)}><X size={11} /></button>}
                  </div>
                ))}
                {values.length < 15 && <button className="rounded-full px-3 py-1 border border-dashed text-xs" style={{ borderColor: "oklch(75% 0.01 248.6)", color: muted }} onClick={() => setValues([...values, ""])}>+ Add Value</button>}
              </div>
            </div>
            <div className="flex justify-end pb-4">
              <Button onClick={handleSaveIdentity} disabled={saveMutation.isPending} style={{ background: navy, color: "white" }}>
                {saveMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
                Save Strategy
              </Button>
            </div>
          </div>
        )}

        {/* ── LOGO TAB ── */}
        {activeTab === "Logo" && (
          <div className="space-y-5">
            <div className="rounded-2xl p-6 border space-y-5" style={cardStyle}>
              <div className="flex items-center gap-2">
                <ImageIcon size={16} style={{ color: navy }} />
                <h2 className="text-sm font-semibold" style={{ color: navy }}>Company Logo</h2>
              </div>
              <p className="text-xs" style={{ color: muted }}>
                Upload your company logo. It will appear on reports and coaching materials. PNG, JPG, SVG or WebP — max 5 MB.
              </p>

              {/* Current logo preview */}
              {logoPreview && (
                <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ borderColor: "oklch(88% 0.01 248.6)", background: "oklch(97% 0.005 248.6)" }}>
                  <img src={logoPreview} alt="Company logo" className="h-16 w-auto max-w-[160px] object-contain rounded" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: navy }}>Current logo</p>
                    <p className="text-xs mt-0.5" style={{ color: muted }}>Upload a new file to replace it</p>
                  </div>
                </div>
              )}

              {/* Drop zone */}
              <div
                className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
                style={{
                  borderColor: isDragOver ? navy : "oklch(80% 0.01 248.6)",
                  background: isDragOver ? "oklch(from var(--color-ln-navy) l c h / 0.04)" : "oklch(98% 0.005 248.6)",
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleLogoFile(file);
                }}
              >
                {uploadLogoMutation.isPending ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={28} className="animate-spin" style={{ color: navy }} />
                    <p className="text-sm" style={{ color: muted }}>Uploading…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={28} style={{ color: "oklch(70% 0.01 248.6)" }} />
                    <p className="text-sm font-medium" style={{ color: navy }}>Drop your logo here</p>
                    <p className="text-xs" style={{ color: muted }}>or click to browse</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoFile(file); }}
              />
            </div>
          </div>
        )}

        {/* ── FRAMEWORKS TAB ── */}
        {activeTab === "Frameworks" && (
          <div className="space-y-5">
            <div className="rounded-2xl p-6 border space-y-5" style={cardStyle}>
              <div className="flex items-center gap-2">
                <BookOpen size={16} style={{ color: navy }} />
                <h2 className="text-sm font-semibold" style={{ color: navy }}>Leadership Frameworks</h2>
                <span className="text-xs ml-auto" style={{ color: muted }}>Up to 10 frameworks</span>
              </div>
              <p className="text-xs" style={{ color: muted }}>
                Define the leadership competency frameworks your organisation uses. These inform AI coaching, scenario design, and assessment feedback.
              </p>

              <div className="space-y-3">
                {frameworks.map((fw, idx) => (
                  <div key={idx} className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(88% 0.01 248.6)" }}>
                    {/* Framework header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      style={{ background: expandedFramework === idx ? "oklch(96% 0.01 248.6)" : "white" }}
                      onClick={() => setExpandedFramework(expandedFramework === idx ? -1 : idx)}
                    >
                      <div className="flex-1">
                        <input
                          value={fw.name}
                          onChange={(e) => updateFramework(idx, "name", e.target.value)}
                          placeholder={`Framework ${idx + 1} name (e.g. Leadership Excellence Model)`}
                          className="bg-transparent outline-none text-sm font-medium w-full"
                          style={{ color: navy }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs" style={{ color: muted }}>{fw.competencies.filter(Boolean).length} competencies</span>
                        {frameworks.length > 1 && (
                          <button
                            className="text-red-400 hover:text-red-600"
                            onClick={(e) => { e.stopPropagation(); setFrameworks(frameworks.filter((_, i) => i !== idx)); }}
                          >
                            <X size={14} />
                          </button>
                        )}
                        {expandedFramework === idx ? <ChevronUp size={14} style={{ color: muted }} /> : <ChevronDown size={14} style={{ color: muted }} />}
                      </div>
                    </div>

                    {/* Framework body */}
                    {expandedFramework === idx && (
                      <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: "oklch(92% 0.01 248.6)" }}>
                        <div className="pt-3">
                          <label className="text-xs font-medium block mb-1.5" style={{ color: muted }}>Description (optional)</label>
                          <Textarea
                            value={fw.description}
                            onChange={(e) => updateFramework(idx, "description", e.target.value)}
                            placeholder="Brief description of this framework and its purpose…"
                            className="text-sm min-h-[60px] resize-none"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium block mb-1.5" style={{ color: muted }}>Competencies (up to 20)</label>
                          <div className="space-y-2">
                            {fw.competencies.map((comp, ci) => (
                              <div key={ci} className="flex gap-2">
                                <Input
                                  value={comp}
                                  onChange={(e) => {
                                    const next = [...fw.competencies];
                                    next[ci] = e.target.value;
                                    updateFramework(idx, "competencies", next);
                                  }}
                                  placeholder={`Competency ${ci + 1} (e.g. Strategic Thinking)`}
                                  className="text-sm flex-1"
                                />
                                {fw.competencies.length > 1 && (
                                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-red-400 hover:text-red-600"
                                    onClick={() => updateFramework(idx, "competencies", fw.competencies.filter((_, i) => i !== ci))}>
                                    <X size={13} />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {fw.competencies.length < 20 && (
                              <Button size="sm" variant="ghost" className="text-xs h-7 px-2" style={{ color: navy }}
                                onClick={() => updateFramework(idx, "competencies", [...fw.competencies, ""])}>
                                <Plus size={12} className="mr-1" /> Add Competency
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {frameworks.length < 10 && (
                <Button variant="outline" className="w-full text-sm" onClick={() => { setFrameworks([...frameworks, { name: "", description: "", competencies: [""] }]); setExpandedFramework(frameworks.length); }}>
                  <Plus size={14} className="mr-1.5" /> Add Framework
                </Button>
              )}
            </div>

            <div className="flex justify-end pb-4">
              <Button onClick={handleSaveFrameworks} disabled={saveFrameworksMutation.isPending} style={{ background: navy, color: "white" }}>
                {saveFrameworksMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
                Save Frameworks
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
