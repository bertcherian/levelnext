import React, { useEffect, useState } from "react";
import { Bookmark, History, Play, Trash2 } from "lucide-react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

type StartInput = { scenarioId?: string; customContext?: string; customCounterpartRole?: string; customObjective?: string; difficulty: "guided" | "realistic" | "stretch" };
const DRAFT_KEY = "levelnext:early-career-practice-draft";

export default function EarlyCareerPractice() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastStart, setLastStart] = useState<StartInput | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [counterpart, setCounterpart] = useState("manager");
  const [objective, setObjective] = useState("");
  const [review, setReview] = useState<any>(null);
  const scenarios = trpc.earlyCareer.getPracticeScenarios.useQuery(undefined, { enabled: isAuthenticated });
  const saved = trpc.earlyCareer.getSavedPracticeScenarios.useQuery(undefined, { enabled: isAuthenticated });
  const history = trpc.earlyCareer.getPracticeHistory.useQuery(undefined, { enabled: isAuthenticated });
  const start = trpc.earlyCareer.startPracticeSession.useMutation({ onSuccess: (data) => { setError(null); setReview(null); setSessionId(data.sessionId); }, onError: (e) => setError(e.message) });
  const send = trpc.earlyCareer.sendPracticeMessage.useMutation();
  const end = trpc.earlyCareer.endPracticeSession.useMutation({ onSuccess: (data) => { setFeedback(data); utils.earlyCareer.getPracticeHistory.invalidate(); }, onError: (e) => setError(e.message) });
  const save = trpc.earlyCareer.savePracticeScenario.useMutation({ onSuccess: () => { setError(null); utils.earlyCareer.getSavedPracticeScenarios.invalidate(); }, onError: (e) => setError(e.message) });
  const remove = trpc.earlyCareer.deleteSavedPracticeScenario.useMutation({ onSuccess: () => utils.earlyCareer.getSavedPracticeScenarios.invalidate(), onError: (e) => setError(e.message) });

  useEffect(() => { if (start.data?.opening) setMessages([{ role: "assistant", content: start.data.opening }]); }, [start.data?.opening]);
  useEffect(() => {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try { const draft = JSON.parse(raw); setTitle(draft.title ?? ""); setContext(draft.context ?? ""); setCounterpart(draft.counterpartRole ?? "manager"); setObjective(draft.objective ?? ""); } catch { /* stale handoff is harmless */ }
    window.sessionStorage.removeItem(DRAFT_KEY);
  }, []);
  if (!isAuthenticated) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-[#56616D]">Sign in to practise a workplace conversation.</div>;

  const load = (item: any) => { setTitle(item.title); setContext(item.context); setCounterpart(item.counterpartRole); setObjective(item.objective ?? ""); setReview(null); };
  const startCustom = () => { const value = context.trim(); if (value.length < 20) return setError("Add a little more context so your practice partner can respond realistically."); const input: StartInput = { customContext: value, customCounterpartRole: counterpart.trim() || "colleague", customObjective: objective.trim() || undefined, difficulty: "realistic" }; setLastStart(input); setError(null); start.mutate(input); };
  const saveCustom = () => { const value = context.trim(); if (value.length < 20) return setError("Add the situation before saving it for later."); save.mutate({ title: title.trim() || value.slice(0, 60), context: value, counterpartRole: counterpart.trim() || "colleague", objective: objective.trim() || undefined }); };
  const startLibrary = (scenarioId: string) => { const input: StartInput = { scenarioId, difficulty: "realistic" }; setLastStart(input); setError(null); start.mutate(input); };
  const submit = (content: string) => { if (!sessionId) return; setLastMessage(content); setMessages((items) => [...items, { role: "user", content }]); send.mutate({ sessionId, message: content }, { onSuccess: (data) => setMessages((items) => [...items, { role: "assistant", content: data.reply }]), onError: (e) => { setMessages((items) => items.slice(0, -1)); setError(e.message); } }); };
  const retry = () => { if (!sessionId && lastStart) start.mutate(lastStart); else if (sessionId && lastMessage) submit(lastMessage); else if (sessionId) end.mutate({ sessionId }); };
  const reset = () => { setSessionId(null); setFeedback(null); setMessages([]); setReview(null); };

  if (sessionId) return <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">{feedback ? <div className="rounded-2xl border bg-white p-7" style={{ borderColor: "#E1D9CE" }}><p className="text-xs font-semibold uppercase tracking-widest text-[#A47618]">Practice debrief</p><h1 className="mt-2 text-2xl font-semibold text-[#0A1A2F]">{String(feedback.headline ?? "Practice complete")}</h1><p className="mt-4 text-sm text-[#56616D]">{String(feedback.tryNext ?? "Choose one phrase or question to use next time.")}</p><p className="mt-3 text-sm italic text-[#56616D]">{String(feedback.reflectionQuestion ?? "What felt more natural after practising it?")}</p><Button className="mt-6" onClick={reset}>Choose another rehearsal</Button></div> : <><ErrorMessage error={error} onRetry={retry} /><AIChatBox messages={messages} onSendMessage={submit} isLoading={send.isPending} height="590px" placeholder="Respond as you would in the real conversation…" /><Button className="mt-5 bg-[#0A1A2F] text-white" disabled={end.isPending} onClick={() => end.mutate({ sessionId })}>{end.isPending ? "Preparing debrief…" : "End practice and reflect"}</Button></>}</div>;

  return <div className="mx-auto max-w-5xl px-4 py-8 md:px-8"><p className="text-xs font-semibold uppercase tracking-widest text-[#A47618]">Practice Partner</p><h1 className="mt-2 text-3xl font-semibold text-[#0A1A2F]">Rehearse before the real conversation.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#56616D]">This is a private developmental rehearsal, not a performance assessment.</p><ErrorMessage error={error} onRetry={retry} />
    <section className="mt-6 rounded-2xl border bg-[#F8F5F0] p-5" style={{ borderColor: "#E1D9CE" }}><p className="text-xs font-semibold uppercase tracking-widest text-[#A47618]">Your own situation</p><h2 className="mt-2 text-lg font-semibold text-[#0A1A2F]">Practise a conversation from your workday.</h2><p className="mt-2 text-sm text-[#56616D]">Save a private situation for later or start practising now. It is never shared with your manager or HR.</p><label className="mt-4 block text-sm font-medium text-[#0A1A2F]" htmlFor="custom-practice-title">Save as <span className="font-normal text-[#56616D]">Optional</span></label><input id="custom-practice-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="Update manager about deadline risk" className="mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-sm" style={{ borderColor: "#D8CEC1" }} /><label className="mt-4 block text-sm font-medium text-[#0A1A2F]" htmlFor="custom-practice-context">What is happening?</label><textarea id="custom-practice-context" value={context} onChange={(e) => setContext(e.target.value)} maxLength={2000} rows={4} placeholder="Describe a real workplace moment…" className="mt-2 w-full rounded-xl border bg-white p-3 text-sm" style={{ borderColor: "#D8CEC1" }} /><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-[#0A1A2F]">Who are you speaking with?<input aria-label="Who are you speaking with?" value={counterpart} onChange={(e) => setCounterpart(e.target.value)} maxLength={120} className="mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-sm" style={{ borderColor: "#D8CEC1" }} /></label><label className="text-sm font-medium text-[#0A1A2F]">What would help? <span className="font-normal text-[#56616D]">Optional</span><input aria-label="What would help?" value={objective} onChange={(e) => setObjective(e.target.value)} maxLength={600} className="mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-sm" style={{ borderColor: "#D8CEC1" }} /></label></div><div className="mt-5 flex flex-wrap gap-3"><Button className="bg-[#0A1A2F] text-white" disabled={start.isPending} onClick={startCustom}><Play className="mr-1.5 h-4 w-4" />Start my practice</Button><Button variant="outline" disabled={save.isPending} onClick={saveCustom}><Bookmark className="mr-1.5 h-4 w-4" />Save for later</Button></div></section>
    {saved.isLoading && <ResourceState title="Saved situations" message="Loading your saved private situations…" />}
    {saved.isError && <ResourceState title="Saved situations" message="Saved situations could not load." retry={() => saved.refetch()} />}
    {!saved.isLoading && !saved.isError && !(saved.data ?? []).length && <ResourceState title="Saved situations" message="No saved situations yet. Save a workplace moment above to reuse it later." />}
    {(saved.data ?? []).length > 0 && <section className="mt-6 rounded-2xl border bg-white p-5" style={{ borderColor: "#E1D9CE" }}><p className="text-xs font-semibold uppercase tracking-widest text-[#A47618]">Saved situations</p><div className="mt-4 grid gap-3 md:grid-cols-2">{(saved.data ?? []).map((item: any) => <div key={item.id} className="rounded-xl border p-4" style={{ borderColor: "#EDE7DF" }}><p className="font-medium text-[#0A1A2F]">{item.title}</p><p className="mt-1 text-xs text-[#56616D]">{item.context}</p><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => load(item)}>Use in Practice</Button><button aria-label={`Delete ${item.title}`} onClick={() => remove.mutate({ id: item.id })} className="rounded-md border p-1.5 text-[#56616D]" style={{ borderColor: "#E1D9CE" }}><Trash2 className="h-3.5 w-3.5" /></button></div></div>)}</div></section>}
    <section className="mt-7"><p className="text-xs font-semibold uppercase tracking-widest text-[#A47618]">Practice library</p>{scenarios.isLoading ? <div className="mt-4 rounded-xl border bg-white p-5 text-sm text-[#56616D]">Loading rehearsal scenarios…</div> : <div className="mt-4 grid gap-4 md:grid-cols-2">{(scenarios.data ?? []).map((scenario: any) => <button key={scenario.id} disabled={start.isPending} onClick={() => startLibrary(scenario.id)} className="rounded-2xl border bg-white p-5 text-left hover:bg-[#F8F5F0]" style={{ borderColor: "#E1D9CE" }}><p className="text-xs font-semibold text-[#A47618]">{scenario.capabilityId.replaceAll("_", " ")}</p><h2 className="mt-2 font-semibold text-[#0A1A2F]">{scenario.title}</h2><p className="mt-2 text-sm text-[#56616D]">{scenario.situation}</p></button>)}</div>}</section>
    {history.isLoading && <ResourceState title="Past practice" message="Loading your private practice history…" />}
    {history.isError && <ResourceState title="Past practice" message="Practice history could not load." retry={() => history.refetch()} />}
    {!history.isLoading && !history.isError && !(history.data ?? []).length && <ResourceState title="Past practice" message="Your completed and in-progress rehearsals will appear here." />}
    {(history.data ?? []).length > 0 && <section className="mt-7 rounded-2xl border bg-white p-5" style={{ borderColor: "#E1D9CE" }}><div className="flex items-center gap-2"><History className="h-4 w-4 text-[#A47618]" /><p className="text-xs font-semibold uppercase tracking-widest text-[#A47618]">Past practice</p></div><div className="mt-4 space-y-2">{(history.data ?? []).map((item: any) => <button key={item.id} onClick={() => setReview(item)} className="flex w-full items-center justify-between rounded-xl border p-3 text-left hover:bg-[#F8F5F0]" style={{ borderColor: "#EDE7DF" }}><span><span className="block text-sm font-medium text-[#0A1A2F]">{item.scenarioTitle}</span><span className="block text-xs text-[#56616D]">{item.status === "completed" ? "Debrief available" : "In progress"} · {new Date(item.updatedAt).toLocaleDateString()}</span></span><span className="text-xs font-medium text-[#A47618]">Review</span></button>)}</div></section>}
    {review && <section className="mt-6 rounded-2xl border bg-[#F8F5F0] p-5" style={{ borderColor: "#E1D9CE" }}><p className="text-xs font-semibold uppercase tracking-widest text-[#A47618]">Practice review</p><h2 className="mt-2 text-lg font-semibold text-[#0A1A2F]">{review.scenarioTitle}</h2><p className="mt-2 text-sm text-[#56616D]">{review.customContext || "Library practice session"}</p><p className="mt-3 text-xs text-[#56616D]">{(review.messages ?? []).length} private conversation turns recorded.</p>{review.feedback && <p className="mt-3 text-sm text-[#0A1A2F]">{String(review.feedback.tryNext ?? review.feedback.headline ?? "Practice debrief available.")}</p>}<Button size="sm" variant="outline" className="mt-4" onClick={() => setReview(null)}>Close review</Button></section>}
  </div>;
}

function ErrorMessage({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return error ? <div className="mt-4 rounded-xl bg-[#FBE9E7] p-3 text-sm text-[#8E2C1D]">{error} <button className="underline" onClick={onRetry}>Try again</button></div> : null;
}

function ResourceState({ title, message, retry }: { title: string; message: string; retry?: () => void }) {
  return <section className="mt-6 rounded-2xl border bg-white p-4 text-sm text-[#56616D]" style={{ borderColor: "#E1D9CE" }}><p className="font-medium text-[#0A1A2F]">{title}</p><p className="mt-1">{message}</p>{retry && <button className="mt-2 text-xs font-semibold text-[#0A1A2F] underline" onClick={retry}>Try again</button>}</section>;
}
