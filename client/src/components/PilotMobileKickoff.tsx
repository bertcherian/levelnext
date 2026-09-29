import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, QrCode, RefreshCw, ShieldCheck, Smartphone, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PilotMobileKickoff({ pilotId }: { pilotId: number }) {
  const origin = typeof window === "undefined" ? "https://levelnext.coach" : window.location.origin;
  const qr = trpc.behaviourChangeProof.qrOverview.useQuery({ pilotId, origin });
  const rotate = trpc.behaviourChangeProof.rotateQr.useMutation({ onSuccess: () => void qr.refetch() });
  const revoke = trpc.behaviourChangeProof.revokeQr.useMutation({ onSuccess: () => void qr.refetch() });
  const [image, setImage] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    if (!qr.data?.joinUrl) { setImage(""); return () => { active = false; }; }
    QRCode.toDataURL(qr.data.joinUrl, { width: 560, margin: 2, errorCorrectionLevel: "M", color: { dark: "#0A1A2F", light: "#FFFFFF" } })
      .then((url) => { if (active) setImage(url); })
      .catch(() => { if (active) setImage(""); });
    return () => { active = false; };
  }, [qr.data?.joinUrl]);

  const copyLink = async () => {
    if (!qr.data?.joinUrl) return;
    try { await navigator.clipboard.writeText(qr.data.joinUrl); setMessage("Mobile launch link copied."); }
    catch { setMessage("Copy is unavailable here. Use Download QR instead."); }
  };
  const download = () => {
    if (!image) return;
    const anchor = document.createElement("a"); anchor.href = image; anchor.download = `levelnext-pilot-${pilotId}-mobile-qr.png`; anchor.click(); setMessage("QR downloaded for the kickoff screen or sponsor email.");
  };
  const expiry = qr.data?.expiresAt ? new Date(qr.data.expiresAt).toLocaleDateString() : "not generated";
  const metrics = qr.data?.mobileMetrics;
  return <Card className="border-[#DCE3EA] bg-white"><CardHeader><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A78418]">Mobile kickoff</p><CardTitle className="mt-1 flex items-center gap-2 text-2xl text-[#0A1A2F]"><Smartphone size={21} /> Let participants start where work happens</CardTitle></div><span className="inline-flex items-center gap-2 rounded-full bg-[#EEF4F9] px-3 py-1.5 text-xs font-semibold text-[#0A1A2F]"><ShieldCheck size={14} /> QR contains no personal data</span></div></CardHeader><CardContent><div className="grid gap-6 lg:grid-cols-[220px_1fr]"><div className="flex min-h-[220px] items-center justify-center rounded-xl bg-[#F8F5F0] p-4">{image ? <img src={image} alt="Secure LevelNext pilot mobile launch QR" className="h-48 w-48 rounded-lg bg-white" /> : <div className="text-center text-sm text-slate-500"><QrCode className="mx-auto mb-2 text-[#A78418]" size={38} />{qr.isLoading ? "Preparing QR…" : "Generate a launch QR"}</div>}</div><div className="space-y-4"><div><p className="text-sm leading-6 text-slate-700"><b>Kickoff instruction:</b> display this QR or add it to the sponsor email. A scan opens a short email check, then takes the participant directly into the pilot experience—not the generic homepage.</p><p className="mt-2 text-xs leading-5 text-slate-500">The QR is revocable and expires {expiry}. Email-bound access tokens expire after 24 hours and do not replace the participant invitation.</p></div><div className="flex flex-wrap gap-2">{!qr.data?.joinUrl && <Button disabled={qr.isFetching || rotate.isPending} onClick={() => rotate.mutate({ pilotId })} className="bg-[#D4AF37] text-[#0A1A2F]"><QrCode size={16} /> Generate QR</Button>}{qr.data?.joinUrl && <><Button variant="outline" onClick={() => void copyLink()} className="border-[#C9D4DF] text-[#0A1A2F]"><Copy size={16} /> Copy mobile link</Button><Button variant="outline" onClick={download} disabled={!image} className="border-[#C9D4DF] text-[#0A1A2F]"><Download size={16} /> Download QR</Button><Button variant="outline" onClick={() => rotate.mutate({ pilotId })} disabled={rotate.isPending} className="border-[#C9D4DF] text-[#0A1A2F]"><RefreshCw size={16} /> Rotate</Button><Button variant="outline" onClick={() => revoke.mutate({ pilotId })} disabled={revoke.isPending} className="border-red-200 text-red-700"><XCircle size={16} /> Revoke</Button></>}</div>{message && <p className="text-sm text-emerald-700">{message}</p>}<div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><MobileMetric label="QR scans" value={metrics?.qrScanned ?? 0} /><MobileMetric label="Mobile opens" value={metrics?.mobileOpened ?? 0} /><MobileMetric label="First Reps" value={metrics?.firstBehaviourRep ?? 0} /><MobileMetric label="Mobile returns" value={metrics?.mobileReturn ?? 0} /></div></div></div></CardContent></Card>;
}
function MobileMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border border-[#EEF1F4] bg-[#F8F5F0] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-[#0A1A2F]">{value}</p></div>; }
