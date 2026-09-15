import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Loader2, Plus, RefreshCw, ShieldCheck, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  LEADERSHIP_WORK_CATEGORIES,
  LEADERSHIP_WORK_CATEGORY_LABELS,
  WORK_REALLOCATION_TAXONOMY,
  WORK_REALLOCATION_LABELS,
  WORK_AT_LEVEL_STATUS,
  type LeadershipWorkCategory,
  type WorkAtLevelStatus,
  type WorkReallocationTaxonomy,
} from "@shared/modules/effectivenessIntelligence";

const NAVY = "#0A1A2F";
const GOLD = "#D4AF37";
const IVORY = "#F8F5F0";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

export default function WorkDiary() {
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<LeadershipWorkCategory>("operational_execution");
  const [hours, setHours] = useState(1);
  const [workAtLevel, setWorkAtLevel] = useState<WorkAtLevelStatus>("at_level");
  const [reallocation, setReallocation] = useState<WorkReallocationTaxonomy>("simplify");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");

  const range = useMemo(() => ({ startDateKey: dateKey(dateDaysAgo(6)), endDateKey: dateKey(new Date()) }), []);
  const diaryQuery = trpc.effectiveness.getDiaryEntries.useQuery(range);
  const dashboardQuery = trpc.effectiveness.getDashboard.useQuery();
  const utils = trpc.useUtils();

  const addEntryMutation = trpc.effectiveness.addDiaryEntry.useMutation({
    onSuccess: () => {
      toast.success("Diary activity logged");
      setTitle("");
      setHours(1);
      setOutcome("");
      setNotes("");
      void utils.effectiveness.getDiaryEntries.invalidate(range);
    },
    onError: (error) => toast.error(error.message),
  });

  const refineMutation = trpc.effectiveness.refineCapacityFromDiary.useMutation({
    onSuccess: (data) => {
      toast.success("Capacity allocation refined", { description: `${data.entriesUsed} entries across ${data.activeDays} days are now reflected in your latest snapshot.` });
      void utils.effectiveness.getDashboard.invalidate();
      void diaryQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const entries = diaryQuery.data ?? [];
  const selectedEntries = entries.filter((entry) => entry.dateKey === selectedDate);
  const totalLoggedHours = entries.reduce((sum, entry) => sum + Number(entry.hours), 0);
  const activeDays = new Set(entries.map((entry) => entry.dateKey)).size;

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Name the activity you want to log.");
      return;
    }
    addEntryMutation.mutate({
      dateKey: selectedDate,
      activityTitle: title.trim(),
      category,
      hours,
      workAtLevel,
      reallocation,
      outcome: outcome.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: IVORY, color: NAVY }}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/manager" className="inline-flex items-center gap-1 text-xs font-semibold text-[#56616D] hover:text-[#0A1A2F]"><ArrowLeft size={13} /> Manager Home</Link>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Interactive Work Diary</p>
            <h1 className="mt-2 text-3xl font-semibold">Make your capacity visible in the work</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#56616D]">Log representative leadership activities for a few days. Your entries stay private by default and help replace a one-time estimate with a more grounded capacity picture.</p>
          </div>
          <div className="hidden rounded-2xl border bg-white p-4 text-right sm:block" style={{ borderColor: "#E1D9CE" }}>
            <ShieldCheck className="ml-auto h-5 w-5" style={{ color: GOLD }} />
            <p className="mt-2 text-xs font-semibold">Participant-private</p>
            <p className="mt-1 text-[10px] text-[#56616D]">No activity surveillance</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
          <Card className="rounded-2xl border bg-white" style={{ borderColor: "#E1D9CE" }}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays size={18} style={{ color: GOLD }} /> Log an activity</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B6258]">Diary date</label>
                <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B6258]">What did you spend time on?</label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Reviewed a customer escalation with the team lead" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label="Leadership category" value={category} onChange={(value) => setCategory(value as LeadershipWorkCategory)} options={LEADERSHIP_WORK_CATEGORIES.map((key) => ({ value: key, label: LEADERSHIP_WORK_CATEGORY_LABELS[key] }))} />
                <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B6258]">Hours</label><Input type="number" min={0.25} max={24} step={0.25} value={hours} onChange={(event) => setHours(Number(event.target.value))} /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label="Work at your level?" value={workAtLevel} onChange={(value) => setWorkAtLevel(value as WorkAtLevelStatus)} options={WORK_AT_LEVEL_STATUS.map((key) => ({ value: key, label: key === "below_level" ? "Below my level" : key === "at_level" ? "At my level" : "Strategic / above level" }))} />
                <SelectField label="Best next treatment" value={reallocation} onChange={(value) => setReallocation(value as WorkReallocationTaxonomy)} options={WORK_REALLOCATION_TAXONOMY.map((key) => ({ value: key, label: WORK_REALLOCATION_LABELS[key].label }))} />
              </div>
              <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B6258]">Outcome (optional)</label><Input value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="What moved because you did this?" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B6258]">Private notes (optional)</label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#D4AF37]" placeholder="What made this activity useful, draining, or repeatable?" /></div>
              <Button onClick={handleSubmit} disabled={addEntryMutation.isPending} className="w-full text-white" style={{ background: NAVY }}><Plus size={15} className="mr-2" />{addEntryMutation.isPending ? "Saving…" : "Log activity"}</Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl border bg-white" style={{ borderColor: "#E1D9CE" }}>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp size={18} style={{ color: GOLD }} /> Diary signal</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="Activities" value={entries.length} />
                  <Metric label="Logged hours" value={`${totalLoggedHours.toFixed(1)}h`} />
                  <Metric label="Active days" value={activeDays} />
                  <Metric label="Latest snapshot" value={dashboardQuery.data?.capacitySnapshot?.confidence === "high_measured" ? "Refined" : "Reported"} />
                </div>
                <div className="mt-5 rounded-xl p-4" style={{ background: IVORY }}>
                  <p className="text-xs leading-5 text-[#56616D]">Log at least three activities across two days to refine your allocation. Five active days increases the confidence of the snapshot.</p>
                  <Button onClick={() => refineMutation.mutate(range)} disabled={refineMutation.isPending || entries.length < 3 || activeDays < 2} className="mt-4 w-full text-white" style={{ background: NAVY }}><RefreshCw size={14} className={refineMutation.isPending ? "mr-2 animate-spin" : "mr-2"} />{refineMutation.isPending ? "Refining capacity…" : "Refine my capacity allocation"}</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-white" style={{ borderColor: "#E1D9CE" }}>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock3 size={18} style={{ color: GOLD }} /> {selectedDate === range.endDateKey ? "Today's entries" : selectedDate}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {diaryQuery.isLoading ? <Loader2 className="animate-spin" style={{ color: NAVY }} /> : selectedEntries.length === 0 ? <p className="text-sm text-[#56616D]">No activities logged for this day yet.</p> : selectedEntries.map((entry) => <div key={entry.id} className="flex items-start justify-between gap-3 rounded-xl border p-3" style={{ borderColor: "#F0EBE4" }}><div><p className="text-sm font-semibold">{entry.activityTitle}</p><p className="mt-1 text-[11px] text-[#56616D]">{LEADERSHIP_WORK_CATEGORY_LABELS[entry.category]} · {entry.hours}h · {entry.workAtLevel.replace(/_/g, " ")}</p></div><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /></div>)}
              </CardContent>
            </Card>
          </div>
        </div>

        <section className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E1D9CE" }}>
          <h2 className="text-base font-semibold">The diary is a reflection tool, not a monitoring tool</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#56616D]">There is no passive tracking, screen capture, keystroke data, or message-volume analysis. You choose what to record, and sponsor reporting receives only privacy-thresholded aggregate capacity patterns.</p>
        </section>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B6258]">{label}</label><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-[#D4AF37]">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border p-3" style={{ borderColor: "#F0EBE4" }}><p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6258]">{label}</p><p className="mt-1 text-xl font-bold" style={{ color: NAVY }}>{value}</p></div>;
}
