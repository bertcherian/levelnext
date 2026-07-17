import { Building2, BarChart3, Users, Cpu, Globe, ArrowLeft, Sparkles, Lock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

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
              Organisation Intelligence is being built as a standalone multi-tenant platform for consulting firms, HR leaders, and GCC transformation teams. The diagnostics below represent the planned module set. If you are interested in early access or a pilot, reach out to the Meta Results team.
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

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "var(--color-ln-navy)", border: "1px solid rgba(212,175,55,0.2)" }}
        >
          <h3 className="text-lg font-bold text-white mb-2">Interested in Organisation Intelligence?</h3>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.7)" }}>
            This platform is designed for CHROs, GCC leaders, and consulting firms running multi-team transformation programmes. Contact Meta Results to discuss a pilot.
          </p>
          <Link href="/diagnostics">
            <Button style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }} className="font-semibold">
              Return to Leadership Diagnostics
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
