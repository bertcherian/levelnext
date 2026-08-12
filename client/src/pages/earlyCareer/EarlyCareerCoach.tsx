import { useEffect, useState } from "react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function EarlyCareerCoach() {
  const { isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const starters = trpc.earlyCareer.getCoachStarters.useQuery(undefined, { enabled: isAuthenticated });
  const sessions = trpc.earlyCareer.getCoachSessions.useQuery(undefined, { enabled: isAuthenticated });
  const messages = trpc.earlyCareer.getCoachMessages.useQuery({ sessionId: sessionId ?? 0 }, { enabled: Boolean(sessionId) });
  const start = trpc.earlyCareer.startCoachSession.useMutation({ onSuccess: (data) => { setSessionId(data.sessionId); sessions.refetch(); } });
  const send = trpc.earlyCareer.sendCoachMessage.useMutation({ onSuccess: () => messages.refetch() });
  useEffect(() => { if (!sessionId && sessions.data?.[0]) setSessionId(sessions.data[0].id); }, [sessionId, sessions.data]);
  if (!isAuthenticated) return <div className="mx-auto max-w-3xl px-4 py-20 text-center" style={{ color: "#56616D" }}>Sign in to use your private Guide.</div>;
  const chatMessages: Message[] = (messages.data ?? []).map((item) => ({ role: item.role, content: item.content }));
  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-8"><div className="grid gap-6 lg:grid-cols-[260px_1fr]"><aside className="rounded-2xl border bg-white p-5" style={{ borderColor: "#E1D9CE" }}><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A47618" }}>Private Guide</p><h1 className="mt-2 text-xl font-semibold" style={{ color: "#0A1A2F" }}>Think through the next real moment.</h1><p className="mt-3 text-sm leading-6" style={{ color: "#56616D" }}>Your conversations are private and are never shown to your manager or HR.</p><Button className="mt-5 w-full" onClick={() => start.mutate({})} disabled={start.isPending} style={{ background: "#0A1A2F", color: "#F8F5F0" }}>New conversation</Button></aside><section className="min-w-0">{sessionId ? <AIChatBox messages={chatMessages} onSendMessage={(content) => send.mutate({ sessionId, message: content })} isLoading={send.isPending} height="620px" placeholder="Describe the workplace moment you want to think through…" suggestedPrompts={starters.data ? [...starters.data] : []} /> : <div className="rounded-2xl border bg-white p-8" style={{ borderColor: "#E1D9CE" }}><p style={{ color: "#56616D" }}>Start a private conversation when you are ready.</p></div>}</section></div></div>;
}
