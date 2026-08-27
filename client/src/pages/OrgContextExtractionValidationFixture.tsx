import React from "react";
import { Globe, RotateCcw, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExtractionSourceNote } from "./AdminOrgContext";

export default function OrgContextExtractionValidationFixture() {
  return <main className="min-h-screen px-4 py-8" style={{ background: "var(--color-ln-ivory)" }}>
    <section className="mx-auto max-w-3xl space-y-5">
      <div><p className="text-xs font-semibold tracking-[0.16em]" style={{ color: "var(--color-ln-gold)" }}>DEVELOPMENT VALIDATION</p><h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Website extraction verification</h1></div>
      <div className="rounded-2xl border p-5" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
        <div className="flex items-center gap-2"><Globe size={16} /><span className="font-semibold">Auto-extract from Website</span></div>
        <p className="mt-2 text-sm text-slate-600">Homepage information was incomplete. Review the snippet below or retry the About page.</p>
        <Button variant="ghost" size="sm" className="mt-3 px-1" style={{ color: "var(--color-ln-navy)" }}><RotateCcw size={13} className="mr-1" /> Try fallback pages</Button>
      </div>
      <div className="rounded-2xl border p-5" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
        <div className="flex items-center gap-2"><Target size={16} /><span className="font-semibold">Mission</span></div>
        <Textarea className="mt-3 min-h-24" value="Engineer reliable industrial controls for safer operations." readOnly />
        <ExtractionSourceNote source={{ snippet: "Park Controls engineers reliable industrial controls for safer operations, combining practical automation expertise with a safety-first approach.", sourceUrl: "https://www.parkcontrols.com/about" }} />
      </div>
    </section>
  </main>;
}
