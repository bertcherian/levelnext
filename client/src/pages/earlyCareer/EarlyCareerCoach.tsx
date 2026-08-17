import React, { useEffect, useState } from "react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function EarlyCareerCoach() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [sessionId, setSessionId] = useState<number | null>(null); const [error, setError] = useState<string | null>(null); const [lastMessage, setLastMessage] = useState<string | null>(null);
  const starters = trpc.earlyCareer.getCoachStarters.useQuery(undefined, { enabled: isAuthenticated });
  const sessions = trpc.earlyCareer.getCoachSessions.useQuery(undefined, { enabled: isAuthenticated });
  const messages = trpc.earlyCareer.getCoachMessages.useQuery({ sessionId: sessionId ?? 0 }, { enabled: Boolean(sessionId) });
  const start = trpc.earlyCareer.startCoachSession.useMutation({ onSuccess: (data) => { setError(null); setSessionId(data.sessionId); sessions.refetch(); }, onError: (e) => setError(e.message) });
  const send = trpc.earlyCareer.sendCoachMessage.useMutation({ onSuccess: () => { setError(null); messages.refetch(); }, onError: (e) => setError(e.message) });
  useEffect(() => { if (!sessionId && sessions.data?.[0]) setSessionId(sessions.data[0].id); }, [sessionId, sessions.data]);
  if (!isAuthenticated) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-[#56616D]">Sign in to use your private Guide.</div>;
  if (sessions.isLoading && !sessionId) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-[#56616D]">Loading your private conversations…</div>;
  const chatMessages: Message[] = (messages.data ?? []).map((item) => ({ role: item.role, content: item.content }));
  const retry = () => { if (sessionId && lastMessage) send.mutate({ sessionId, message: lastMessage }); else start.mutate({}); };
  const openExample = (example: { title: string; context: string; counterpartRole: string; objective: string }) => {
    window.sessionStorage.setItem("levelnext:early-career-practice-draft", JSON.stringify(example));
    navigate("/early-career/practice");
  };
  const guideExamples = [
    { title: "Prepare for a manager check-in", context: "I want to prepare for a check-in with my manager about my current priorities and where I need guidance.", counterpartRole: "manager", objective: "Agree the most important next priority and the support I need." },
    { title: "Respond to feedback", context: "I received feedback that I want to understand and turn into one practical change in how I work.", counterpartRole: "senior colleague", objective: "Understand the feedback and agree one behaviour to practise." },
    { title: "Handle an unclear request", context: "I have been asked to do something at work, but the outcome and next step are not clear to me.", counterpartRole: "manager", objective: "Clarify the expected outcome, scope, and first next step." },
  ];
  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-8"><div className="grid gap-6 lg:grid-cols-[280px_1fr]"><aside className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E1D9CE" }}><p className="text-xs font-semibold uppercase tracking-widest text-[#A47618]">Private Guide</p><h1 className="mt-2 text-xl font-semibold text-[#0A1A2F]">Think through the next real moment.</h1><p className="mt-3 text-sm leading-6 text-[#56616D]">Your conversations are private and are never shown to your manager or HR.</p><Button className="mt-5 w-full" onClick={() => { setError(null); setLastMessage(null); start.mutate({}); }} disabled={start.isPending} style={{ background: "#0A1A2F", color: "#F8F5F0" }}>{start.isPending ? "Opening…" : "New conversation"}</Button><div className="mt-6 border-t pt-5" style={{ borderColor: "#EDE7DF" }}><p className="text-xs font-semibold uppercase tracking-widest text-[#A47618]">Turn an example into practice</p><p className="mt-2 text-xs leading-5 text-[#56616D]">Choose an example to prefill a private rehearsal, then tailor it before you start.</p><div className="mt-3 space-y-2">{guideExamples.map((example) => <button key={example.title} type="button" disabled={start.isPending} onClick={() => openExample(example)} className="w-full rounded-xl border px-3 py-2.5 text-left text-xs font-medium text-[#0A1A2F] transition-colors hover:bg-[#F8F5F0] disabled:opacity-60" style={{ borderColor: "#E1D9CE" }}>{example.title}<span className="mt-1 block font-normal text-[#56616D]">Open in Practice →</span></button>)}</div></div>{sessions.isError && <Button variant="outline" className="mt-3 w-full" onClick={() => sessions.refetch()}>Retry conversations</Button>}</aside><section className="min-w-0">{error && <div className="mb-3 flex items-center justify-between rounded-xl bg-[#FBE9E7] p-3 text-sm text-[#8E2C1D]">{error}<Button size="sm" variant="outline" onClick={retry}>Retry</Button></div>}{messages.isError && <div className="mb-3 rounded-xl bg-[#FBE9E7] p-3 text-sm text-[#8E2C1D]">Messages could not load. <button className="underline" onClick={() => messages.refetch()}>Try again</button></div>}{sessionId && messages.isLoading ? <div className="rounded-2xl border bg-white p-8 text-[#56616D]" style={{ borderColor: "#E1D9CE" }}>Loading this private conversation…</div> : sessionId ? <AIChatBox messages={chatMessages} onSendMessage={(content) => { setLastMessage(content); setError(null); send.mutate({ sessionId, message: content }); }} isLoading={send.isPending} height="620px" placeholder="Describe the workplace moment you want to think through…" suggestedPrompts={starters.data ? [...starters.data] : []} /> : <div className="rounded-2xl border bg-white p-8 text-[#56616D]" style={{ borderColor: "#E1D9CE" }}>Start a private conversation when you are ready.</div>}</section></div></div>;
}
