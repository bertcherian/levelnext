import { useEffect, useState } from "react";
import { ArrowRight, CircleAlert, LockKeyhole, QrCode, ShieldCheck } from "lucide-react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function isMobileBrowser() { return typeof navigator !== "undefined" && /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent); }

export default function PilotJoin() {
  const [, params] = useRoute("/pilot/join/:token");
  const token = params?.token ?? "";
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const resolve = trpc.behaviourChangeProof.resolveQrJoin.useMutation({ onSuccess: (data) => { window.location.assign(`/pilot/participant/${data.participantToken}?source=qr`); } });
  useEffect(() => { if (token) { try { sessionStorage.setItem("levelnext_qr_token", token); } catch { /* private browsing fallback */ } } }, [token]);
  if (!token) return <main className="grid min-h-screen place-items-center bg-[#F8F5F0] px-6"><Card className="max-w-md border-[#DCE3EA] bg-white"><CardContent className="p-8 text-center"><CircleAlert className="mx-auto text-red-500" /><h1 className="mt-3 text-2xl font-bold text-[#0A1A2F]">This pilot link is incomplete.</h1><p className="mt-2 text-sm text-slate-600">Ask your sponsor for the current launch QR.</p></CardContent></Card></main>;
  return <main className="grid min-h-screen place-items-center bg-[#F8F5F0] px-4 py-10 text-[#1C1C1C] sm:px-6"><Card className="w-full max-w-md border-[#DCE3EA] bg-white shadow-[0_20px_60px_rgba(10,26,47,0.1)]"><CardHeader className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF8DF] text-[#A78418]"><QrCode size={28} /></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#A78418]">Your LevelNext pilot</p><CardTitle className="mt-2 text-3xl text-[#0A1A2F]">Start on your phone</CardTitle><p className="mt-3 text-sm leading-6 text-slate-600">Use the email address that received your pilot invitation. We use it only to connect you to the right participant space.</p></CardHeader><CardContent className="space-y-5"><label className="block"><span className="mb-2 block text-sm font-semibold text-[#0A1A2F]">Invitation email</span><Input autoComplete="email" inputMode="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="you@company.com" className="h-12 border-[#C9D4DF] text-base" /></label><div className="rounded-lg bg-[#EEF4F9] p-4 text-sm leading-6 text-slate-700"><div className="flex gap-2"><LockKeyhole size={17} className="mt-0.5 shrink-0 text-[#0A1A2F]" /><p><b>No personal details are in this QR.</b> This step checks your invitation email before opening the pilot. If your organisation requires approved access, use only the permitted lane.</p></div></div>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}{resolve.error && <p role="alert" className="text-sm text-red-600">{resolve.error.message}</p>}<Button className="h-12 w-full bg-[#D4AF37] text-base text-[#0A1A2F]" disabled={!email.trim() || resolve.isPending} onClick={() => { setError(""); resolve.mutate({ token, email, isMobile: isMobileBrowser() }); }}>{resolve.isPending ? "Opening your pilot…" : "Open my pilot"} <ArrowRight size={17} /></Button><p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck size={14} className="mt-0.5 shrink-0" /> You can start in the browser without installing anything. LevelNext may offer quick access later, after you experience value.</p></CardContent></Card></main>;
}
