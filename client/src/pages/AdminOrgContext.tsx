import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Globe, Save, RefreshCw, Plus, X, Loader2, Building2, Target, Eye, Star, ListChecks, Heart } from "lucide-react";

export default function AdminOrgContext() {
  const { data: context, refetch, isLoading } = trpc.orgContext.getOrgContext.useQuery();
  const saveMutation = trpc.orgContext.saveOrgContext.useMutation({
    onSuccess: () => { refetch(); toast.success("Organisation context saved."); },
    onError: (e) => toast.error(`Save failed: ${e.message}`),
  });
  const scrapeMutation = trpc.orgContext.scrapeWebsite.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(`Website scraped — extracted ${data.rawTextLength.toLocaleString()} characters.`);
      if (data.extracted) {
        const ex = data.extracted;
        if (ex.companyName) setCompanyName(ex.companyName);
        if (ex.mission) setMission(ex.mission);
        if (ex.vision) setVision(ex.vision);
        if (ex.northStar) setNorthStar(ex.northStar);
        if (ex.strategicGoals) setGoals(ex.strategicGoals);
        if (ex.values) setValues(ex.values);
      }
    },
    onError: (e) => toast.error(`Scrape failed: ${e.message}`),
  });

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [northStar, setNorthStar] = useState("");
  const [goals, setGoals] = useState<string[]>([""]);
  const [values, setValues] = useState<string[]>([""]);

  useEffect(() => {
    if (context) {
      setWebsiteUrl(context.websiteUrl ?? "");
      setCompanyName(context.companyName ?? "");
      setMission(context.mission ?? "");
      setVision(context.vision ?? "");
      setNorthStar(context.northStar ?? "");
      setGoals(context.strategicGoals?.length ? context.strategicGoals : [""]);
      setValues(context.values?.length ? context.values : [""]);
    }
  }, [context]);

  const handleSave = () => {
    saveMutation.mutate({
      websiteUrl: websiteUrl || undefined,
      companyName: companyName || undefined,
      mission: mission || undefined,
      vision: vision || undefined,
      northStar: northStar || undefined,
      strategicGoals: goals.filter(Boolean),
      values: values.filter(Boolean),
    });
  };

  const updateList = (
    list: string[],
    setList: (v: string[]) => void,
    idx: number,
    val: string,
  ) => {
    const next = [...list];
    next[idx] = val;
    setList(next);
  };

  const removeFromList = (list: string[], setList: (v: string[]) => void, idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-ln-navy)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>
              Organisation Context
            </h1>
            <p className="text-sm" style={{ color: "oklch(45% 0.02 248.6)" }}>
              Set your company's mission, vision, and strategic goals. This context enriches AI coaching for all participants.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="shrink-0"
            style={{ background: "var(--color-ln-navy)", color: "white" }}
          >
            {saveMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
            Save
          </Button>
        </div>

        {/* Website scraper */}
        <div className="rounded-2xl p-6 border space-y-4" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={16} style={{ color: "var(--color-ln-navy)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Auto-extract from Website</h2>
          </div>
          <p className="text-xs" style={{ color: "oklch(50% 0.02 248.6)" }}>
            Enter your company website URL and we'll extract mission, vision, goals, and values automatically.
          </p>
          <div className="flex gap-2">
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourcompany.com"
              className="flex-1 text-sm"
            />
            <Button
              variant="outline"
              onClick={() => {
                if (!websiteUrl) { toast.error("Enter a website URL first."); return; }
                scrapeMutation.mutate({ url: websiteUrl });
              }}
              disabled={scrapeMutation.isPending}
              className="shrink-0"
            >
              {scrapeMutation.isPending
                ? <Loader2 size={14} className="animate-spin mr-1.5" />
                : <RefreshCw size={14} className="mr-1.5" />}
              Extract
            </Button>
          </div>
          {context?.scrapedAt && (
            <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>
              Last scraped: {new Date(context.scrapedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Company name */}
        <div className="rounded-2xl p-6 border space-y-3" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
          <div className="flex items-center gap-2">
            <Building2 size={15} style={{ color: "var(--color-ln-navy)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Company Name</h2>
          </div>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Corporation"
            className="text-sm"
          />
        </div>

        {/* Mission */}
        <div className="rounded-2xl p-6 border space-y-3" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
          <div className="flex items-center gap-2">
            <Target size={15} style={{ color: "var(--color-ln-navy)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Mission</h2>
            <span className="text-xs ml-auto" style={{ color: "oklch(55% 0.02 248.6)" }}>Why we exist</span>
          </div>
          <Textarea
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            placeholder="e.g. To empower every person and every organisation on the planet to achieve more."
            className="text-sm min-h-[80px] resize-none"
            rows={3}
          />
        </div>

        {/* Vision */}
        <div className="rounded-2xl p-6 border space-y-3" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
          <div className="flex items-center gap-2">
            <Eye size={15} style={{ color: "var(--color-ln-navy)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Vision</h2>
            <span className="text-xs ml-auto" style={{ color: "oklch(55% 0.02 248.6)" }}>Where we are going</span>
          </div>
          <Textarea
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            placeholder="e.g. A world where every leader reaches their full potential."
            className="text-sm min-h-[80px] resize-none"
            rows={3}
          />
        </div>

        {/* North Star */}
        <div className="rounded-2xl p-6 border space-y-3" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
          <div className="flex items-center gap-2">
            <Star size={15} style={{ color: "var(--color-ln-navy)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>North Star</h2>
            <span className="text-xs ml-auto" style={{ color: "oklch(55% 0.02 248.6)" }}>Primary goal or metric</span>
          </div>
          <Textarea
            value={northStar}
            onChange={(e) => setNorthStar(e.target.value)}
            placeholder="e.g. Become the most trusted leadership development platform in Asia by 2027."
            className="text-sm min-h-[60px] resize-none"
            rows={2}
          />
        </div>

        {/* Strategic Goals */}
        <div className="rounded-2xl p-6 border space-y-3" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
          <div className="flex items-center gap-2">
            <ListChecks size={15} style={{ color: "var(--color-ln-navy)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Strategic Goals</h2>
            <span className="text-xs ml-auto" style={{ color: "oklch(55% 0.02 248.6)" }}>Up to 10</span>
          </div>
          <div className="space-y-2">
            {goals.map((goal, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={goal}
                  onChange={(e) => updateList(goals, setGoals, i, e.target.value)}
                  placeholder={`Goal ${i + 1}`}
                  className="text-sm flex-1"
                />
                {goals.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 text-red-400 hover:text-red-600"
                    onClick={() => removeFromList(goals, setGoals, i)}
                  >
                    <X size={13} />
                  </Button>
                )}
              </div>
            ))}
            {goals.length < 10 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 px-2"
                style={{ color: "var(--color-ln-navy)" }}
                onClick={() => setGoals([...goals, ""])}
              >
                <Plus size={12} className="mr-1" /> Add Goal
              </Button>
            )}
          </div>
        </div>

        {/* Values */}
        <div className="rounded-2xl p-6 border space-y-3" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
          <div className="flex items-center gap-2">
            <Heart size={15} style={{ color: "var(--color-ln-navy)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Company Values</h2>
            <span className="text-xs ml-auto" style={{ color: "oklch(55% 0.02 248.6)" }}>Up to 15</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {values.map((val, i) => (
              <div key={i} className="flex items-center gap-1 rounded-full px-3 py-1 border text-sm" style={{ borderColor: "oklch(85% 0.01 248.6)", background: "oklch(96% 0.005 248.6)" }}>
                <input
                  value={val}
                  onChange={(e) => updateList(values, setValues, i, e.target.value)}
                  placeholder={`Value ${i + 1}`}
                  className="bg-transparent outline-none text-xs w-24"
                  style={{ color: "var(--color-ln-navy)" }}
                />
                {values.length > 1 && (
                  <button
                    className="text-red-400 hover:text-red-600 ml-1"
                    onClick={() => removeFromList(values, setValues, i)}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
            {values.length < 15 && (
              <button
                className="rounded-full px-3 py-1 border border-dashed text-xs"
                style={{ borderColor: "oklch(75% 0.01 248.6)", color: "oklch(50% 0.02 248.6)" }}
                onClick={() => setValues([...values, ""])}
              >
                + Add Value
              </button>
            )}
          </div>
        </div>

        {/* Save button (bottom) */}
        <div className="flex justify-end pb-8">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            style={{ background: "var(--color-ln-navy)", color: "white" }}
          >
            {saveMutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
            Save Organisation Context
          </Button>
        </div>
      </div>
    </div>
  );
}
