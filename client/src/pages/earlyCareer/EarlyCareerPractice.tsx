import { useEffect, useState } from "react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function EarlyCareerPractice() {
  const { isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const scenarios = trpc.earlyCareer.getPracticeScenarios.useQuery(undefined, { enabled: isAuthenticated });
  const start = trpc.earlyCareer.startPracticeSession.useMutation({ onSuccess: (data) => setSessionId(data.sessionId) });
  const send = trpc.earlyCareer.sendPracticeMessage.useMutation();
  const end = trpc.earlyCareer.endPracticeSession.useMutation({ onSuccess: (data) => setFeedback(data) });
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  useEffect(() => { if (start.data?.opening) setLocalMessages([{ role: "assistant", content: start.data.opening }]); }, [start.data?.opening]);
  if (!isAuthenticated) return <div className="mx-auto max-w-3xl px-4 py-20 text-center" style={{ color: "#56616D" }}>Sign in to practise a workplace conversation.</div>;
  if (!sessionId) return <div className="mx-auto max-w-5xl px-4 py-8 md:px-8"><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A47618" }}>Practice Partner</p><h1 className="mt-2 text-3xl font-semibold" style={{ color: "#0A1A2F" }}>Rehearse before the real conversation.</h1><p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "#56616D" }}>This is a private developmental rehearsal, not a performance assessment.</p><div className="mt-7 grid gap-4 md:grid-cols-2">{scenarios.data?.map((scenario) => <button key={scenario.id} onClick={() => start.mutate({ scenarioId: scenario.id, difficulty: "realistic" })} className="rounded-2xl border bg-white p-5 text-left hover:bg-[#F8F5F0]" style={{ borderColor: "#E1D9CE" }}><p className="text-xs font-semibold" style={{ color: "#A47618" }}>{scenario.capabilityId.replaceAll("_", " ")}</p><h2 className="mt-2 font-semibold" style={{ color: "#0A1A2F" }}>{scenario.title}</h2><p className="mt-2 text-sm leading-6" style={{ color: "#56616D" }}>{scenario.situation}</p></button>)}</div></div>;
  return <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">{feedback ? <div className="rounded-2xl border bg-white p-7" style={{ borderColor: "#E1D9CE" }}><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A47618" }}>Practice debrief</p><h1 className="mt-2 text-2xl font-semibold" style={{ color: "#0A1A2F" }}>{feedback.headline}</h1><p className="mt-5 text-sm leading-6" style={{ color: "#56616D" }}>{feedback.tryNext}</p><p className="mt-4 text-sm italic" style={{ color: "#56616D" }}>{feedback.reflectionQuestion}</p><Button className="mt-6" onClick={() => { setSessionId(null); setFeedback(null); setLocalMessages([]); }}>Choose another rehearsal</Button></div> : <><AIChatBox messages={localMessages} onSendMessage={(content) => { setLocalMessages((current) => [...current, { role: "user", content }]); send.mutate({ sessionId, message: content }, { onSuccess: (data) => setLocalMessages((current) => [...current, { role: "assistant", content: data.reply }]) }); }} isLoading={send.isPending} height="590px" placeholder="Respond as you would in the real conversation…" /><Button className="mt-5" onClick={() => end.mutate({ sessionId })} disabled={end.isPending} style={{ background: "#0A1A2F", color: "#F8F5F0" }}>{end.isPending ? "Preparing debrief…" : "End practice and reflect"}</Button></>}</div>;
}
