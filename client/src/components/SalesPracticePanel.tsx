import React, { useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, Check, Loader2, MessageSquareText, Send, ShieldCheck, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { SalesPracticeDebrief, SalesPracticeMessage, SalesPracticeScenario } from "../../../shared/modules/salesIntelligence";
import "./salesPractice.css";
import "./salesPracticeInvite.css";
import "./salesPracticeErrors.css";

export function SalesPracticePanel({ situationId, onClose }: { situationId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [buyerRole, setBuyerRole] = useState("Procurement lead");
  const [objective, setObjective] = useState("");
  const [practiceId, setPracticeId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<"start" | "send" | "finish" | null>(null);
  const practice = trpc.salesIntelligence.getPractice.useQuery({ id: practiceId ?? 0 }, { enabled: Boolean(practiceId) });
  const startPractice = () => { setErrorMessage(null); setRetryAction(null); start.mutate({ situationId, buyerRole, objective: objective || undefined }); };
  const sendBuyerTurn = () => { if (!practiceId || !message.trim()) return; setErrorMessage(null); setRetryAction(null); send.mutate({ practiceId, message: message.trim() }); };
  const finishPractice = () => { if (!practiceId) return; setErrorMessage(null); setRetryAction(null); finish.mutate({ practiceId }); };
  const start = trpc.salesIntelligence.startPractice.useMutation({ onSuccess: (data) => { setErrorMessage(null); setRetryAction(null); setPracticeId(data.id); }, onError: (error) => { setRetryAction("start"); setErrorMessage(error.message || "We could not create this rehearsal."); } });
  const send = trpc.salesIntelligence.sendPracticeMessage.useMutation({ onSuccess: () => { setErrorMessage(null); setRetryAction(null); setMessage(""); utils.salesIntelligence.getPractice.invalidate(); }, onError: (error) => { setRetryAction("send"); setErrorMessage(error.message || "We could not generate the buyer response."); } });
  const finish = trpc.salesIntelligence.finishPractice.useMutation({ onSuccess: () => { setErrorMessage(null); setRetryAction(null); utils.salesIntelligence.getPractice.invalidate(); }, onError: (error) => { setRetryAction("finish"); setErrorMessage(error.message || "We could not complete the practice debrief."); } });

  const session = practice.data;
  const scenario = session?.scenario as SalesPracticeScenario | null | undefined;
  const messages = (session?.messages ?? []) as SalesPracticeMessage[];
  const debrief = session?.debrief as SalesPracticeDebrief | null | undefined;
  const canSend = message.trim().length > 1 && !send.isPending && session?.status === "active";
  const hasSellerTurn = useMemo(() => messages.some((item) => item.role === "seller"), [messages]);

  const retry = () => {
    if (retryAction === "start") return startPractice();
    if (retryAction === "send") return sendBuyerTurn();
    if (retryAction === "finish") return finishPractice();
    setErrorMessage(null);
    practice.refetch();
  };

  return <section className="sales-practice-panel" aria-label="Buyer conversation practice">
    <header><div><p className="sales-kicker">Practice this conversation</p><h2>Rehearse the moment before it matters.</h2><span>This is a private simulation, not a prediction of a real buyer.</span></div><button type="button" className="sales-practice-close" onClick={onClose} aria-label="Close practice"><X size={17} /></button></header>
    {errorMessage && <div className="sales-practice-error" role="alert"><div><b>Practice needs another attempt.</b>{errorMessage}</div><button type="button" onClick={retry}>Try again</button></div>}
    {!practiceId && <div className="sales-practice-setup"><div className="sales-practice-principle"><ShieldCheck size={17} /><span>The AI plays the buyer. You remain the seller. The buyer stance will test your commercial thinking using only the situation you supplied.</span></div><label>Buyer role to rehearse<input value={buyerRole} onChange={(event) => setBuyerRole(event.target.value)} placeholder="e.g. Procurement lead, Economic buyer, Operations sponsor" /></label><label>Your practice objective <small>Optional</small><textarea value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="What would you like to test, clarify, or secure in this conversation?" /></label><button className="sales-practice-primary" disabled={buyerRole.trim().length < 3 || start.isPending} onClick={startPractice}>{start.isPending ? <><Loader2 size={16} className="animate-spin" /> Setting the rehearsal…</> : <><BrainCircuit size={16} /> Start buyer rehearsal</>}</button></div>}
    {practiceId && practice.isLoading && <div className="sales-practice-loading"><Loader2 className="animate-spin" /> Opening private rehearsal…</div>}
    {practiceId && practice.error && !errorMessage && <div className="sales-practice-error" role="alert"><div><b>We could not load this rehearsal.</b>Check your connection and try again.</div><button type="button" onClick={() => practice.refetch()}>Try again</button></div>}
    {session && scenario && <div className="sales-practice-session"><div className="sales-practice-scenario"><span>{scenario.buyerRole}</span><h3>{scenario.buyerStance}</h3><p><b>Pressure point:</b> {scenario.challenge}</p><p><b>Success signal:</b> {scenario.successSignal}</p></div><div className="sales-practice-messages">{messages.map((item, index) => <article key={`${item.timestamp}-${index}`} className={`is-${item.role}`}><span>{item.role === "buyer" ? scenario.buyerRole : "You"}</span><p>{item.content}</p></article>)}</div>{session.status === "active" && <div className="sales-practice-compose"><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Respond as the seller. Ask, clarify, challenge, or propose your next step…" /><div><span><MessageSquareText size={14} /> Keep it specific; test an assumption before making a claim.</span><button className="sales-practice-send" disabled={!canSend} onClick={sendBuyerTurn}>{send.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send</button></div></div>}{session.status === "active" && <button className="sales-practice-finish" disabled={!hasSellerTurn || finish.isPending} onClick={finishPractice}>{finish.isPending ? <><Loader2 size={15} className="animate-spin" /> Debriefing…</> : <><Check size={15} /> End practice and reflect</>}</button>}{debrief && <div className="sales-practice-debrief"><p className="sales-kicker">Practice debrief</p><h3>{debrief.keyTakeaway}</h3><div className="sales-practice-debrief-grid"><article><b>What worked</b><ul>{debrief.strengths.map((item) => <li key={item}>{item}</li>)}</ul></article><article><b>Try next</b><ul>{debrief.tryNext.map((item) => <li key={item}>{item}</li>)}</ul></article></div><div className="sales-practice-question"><ArrowRight size={15} /><span><b>Evidence question:</b> {debrief.evidenceQuestion}</span></div><small>{debrief.evidenceBoundary}</small></div>}<p className="sales-practice-boundary">{scenario.evidenceBoundary}</p></div>}
  </section>;
}
