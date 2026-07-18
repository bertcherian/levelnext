import { useState } from "react";
import { Building2, BarChart3, Users, Cpu, Globe, ArrowLeft, Sparkles, Lock, CheckCircle2, Mail, Briefcase } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const MODULES = [
  {
    id: "GCC",
    label: "GCC Readiness",
    tagline: "Is your GCC operating as a strategic partner or a delivery arm?",
    description:
      "Evaluate your organisation's readiness across Strategic Influence, Operating Excellence, Leadership & Talent, Innovation & AI, and Enterprise Alignment.",
    icon: <Globe size={22} />,
    color: "#0f2d4a",
  },
  {
    id: "OEI",
    label: "Organisational Effectiveness Intelligence",
    tagline: "How effectively does your organisation execute on its strategy?",
    description:
      "Measure cross-functional collaboration, decision-making speed, accountability culture, change readiness, and strategic alignment across business units.",
    icon: <BarChart3 size={22} />,
    color: "#1a3d5c",
  },
  {
    id: "CLI",
    label: "Culture & Leadership Intelligence",
    tagline: "Does your culture enable or constrain your strategy?",
    description:
      "Assess psychological safety, innovation culture, leadership bench strength, talent development practices, and the alignment between stated values and lived behaviours.",
    icon: <Users size={22} />,
    color: "#2d4a1a",
  },
  {
    id: "AIE",
    label: "AI & Digital Transformation Readiness",
    tagline: "Is your organisation AI-ready — or AI-resistant?",
    description:
      "Evaluate your organisation's AI literacy, data infrastructure maturity, change management capability, and leadership readiness to drive digital transformation at scale.",
    icon: <Cpu size={22} />,
    color: "#1a1a4a",
  },
];

function WaitlistForm() {
  const { data: status, isLoading: statusLoading } = trpc.orgIntelligence.getWaitlistStatus.useQuery();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    email: "",
    name: "",
    orgName: "",
    role: "",
    useCase: "",
  });

  const joinMutation = trpc.orgIntelligence.joinWaitlist.useMutation({
    onSuccess: () => {
      utils.orgIntelligence.getWaitlistStatus.invalidate();
      toast.success("You're on the waitlist! We'll be in touch.");
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  if (statusLoading) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: "var(--color-ln-navy)", border: "1px solid rgba(212,175,55,0.2)" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin mx-auto" />
      </div>
    );
  }

  if (status?.isOnWaitlist) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: "var(--color-ln-navy)", border: "1px solid rgba(212,175,55,0.3)" }}
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(212,175,55,0.15)" }}>
          <CheckCircle2 size={28} style={{ color: "var(--color-ln-yellow)" }} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">You're on the waitlist</h3>
        <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
          We'll notify you at <span className="font-semibold text-white">{status.entry?.email}</span> when Organisation Intelligence launches.
        </p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          In the meantime, continue building your Leadership Edge in the diagnostics above.
        </p>
        <Link href="/diagnostics">
          <Button className="mt-6 font-semibold" style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
            Return to Diagnostics
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--color-ln-navy)", border: "1px solid rgba(212,175,55,0.2)" }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,175,55,0.15)" }}>
            <Mail size={20} style={{ color: "var(--color-ln-yellow)" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Register Your Interest</h3>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Be first to access Organisation Intelligence</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
              Your Name *
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Priya Sharma"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[var(--color-ln-yellow)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
              Work Email *
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="priya@company.com"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[var(--color-ln-yellow)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
              Organisation
            </Label>
            <Input
              value={form.orgName}
              onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
              placeholder="Broadridge, Volvo, etc."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[var(--color-ln-yellow)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
              Your Role
            </Label>
            <Input
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="CHRO, GCC Head, L&D Director"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[var(--color-ln-yellow)]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
            What would you use it for?
          </Label>
          <Textarea
            value={form.useCase}
            onChange={(e) => setForm((f) => ({ ...f, useCase: e.target.value }))}
            placeholder="e.g. GCC readiness assessment for 200-person team, culture diagnostic before transformation programme..."
            rows={3}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[var(--color-ln-yellow)] resize-none"
          />
        </div>

        <Button
          className="w-full font-semibold"
          style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
          disabled={!form.name.trim() || !form.email.trim() || joinMutation.isPending}
          onClick={() => joinMutation.mutate(form)}
        >
          {joinMutation.isPending ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[var(--color-ln-navy)]/30 border-t-[var(--color-ln-navy)] animate-spin" />
              Registering...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Briefcase size={16} />
              Register My Interest
            </span>
          )}
        </Button>

        <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          No spam. We'll only contact you about Organisation Intelligence access.
        </p>
      </div>
    </div>
  );
}

export default function OrgIntelligence() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{ background: "var(--color-ln-navy)", paddingBottom: "3rem" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <Link href="/diagnostics">
            <button className="flex items-center gap-2 text-sm mb-6 transition-colors" style={{ color: "rgba(255,255,255,0.6)" }}>
              <ArrowLeft size={15} />
              Back to Diagnostics
            </button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}>
              <Building2 size={24} style={{ color: "var(--color-ln-yellow)" }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--color-ln-yellow)" }}>Coming Soon</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Organisation Intelligence</h1>
            </div>
          </div>
          <p className="text-base leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.75)" }}>
            A suite of organisational diagnostics for CHROs, GCC leaders, and transformation teams. Move beyond individual leadership assessments to measure the health, readiness, and strategic capability of your entire organisation.
          </p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6">
        <div
          className="rounded-2xl p-5 flex items-start gap-4"
          style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.12)" }}>
            <Sparkles size={20} style={{ color: "var(--color-ln-yellow)" }} />
          </div>
          <div>
            <h2 className="font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>This platform is under development</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-ln-text)" }}>
              Organisation Intelligence is being built as a standalone multi-tenant platform for consulting firms, HR leaders, and GCC transformation teams. The diagnostics below represent the planned module set. Register your interest below to be notified at launch and to shape the product roadmap.
            </p>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--color-ln-muted)" }}>Planned Diagnostic Modules</h2>
        {MODULES.map((mod) => (
          <div
            key={mod.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)", opacity: 0.85 }}
          >
            <div className="flex">
              <div className="w-1.5 flex-shrink-0" style={{ background: mod.color }} />
              <div className="flex-1 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: `${mod.color}15`, color: mod.color }}
                  >
                    {mod.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ background: `${mod.color}15`, color: mod.color }}
                      >
                        {mod.id}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--color-ln-muted)" }}>
                        <Lock size={11} /> Coming Soon
                      </span>
                    </div>
                    <h3 className="text-base font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>{mod.label}</h3>
                    <p className="text-sm font-medium mb-2" style={{ color: "var(--color-ln-muted)" }}>{mod.tagline}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-ln-text)" }}>{mod.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Waitlist Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <WaitlistForm />
      </div>
    </div>
  );
}
