import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Users, ArrowRight, CheckCircle2, ChevronLeft } from "lucide-react";

const PLATFORM_PILLARS = [
  { label: "Executive Communication", desc: "Build your presence and strategic voice" },
  { label: "Leadership Influence", desc: "Expand your impact across stakeholders" },
  { label: "GCC Readiness", desc: "Lead your global capability centre forward" },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const createTenant = trpc.tenant.create.useMutation({
    onSuccess: () => {
      toast.success("Organisation created! Welcome to LevelNext.");
      navigate("/home");
    },
    onError: (e) => toast.error(e.message),
  });

  const joinTenant = trpc.tenant.join.useMutation({
    onSuccess: (data) => {
      toast.success(`Joined ${data.name}! Welcome to LevelNext.`);
      navigate("/home");
    },
    onError: (e) => toast.error(e.message),
  });

  const firstName = user?.name?.split(" ")[0] ?? "Leader";

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-ln-ivory)" }}>

      {/* ── Left panel — brand & value prop ─────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] min-h-screen p-12"
        style={{ background: "var(--color-ln-navy)" }}
      >
        {/* Logo */}
        <div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold tracking-tight text-white">LevelNext</span>
            <span className="text-xs font-medium tracking-wide mt-0.5" style={{ color: "var(--color-ln-yellow)" }}>
              The Leadership Intelligence Platform
            </span>
          </div>
        </div>

        {/* Value proposition */}
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Build your<br />
            <span style={{ color: "var(--color-ln-yellow)" }}>Leadership Edge</span><br />
            across every dimension.
          </h2>
          <p className="text-white/60 text-sm mb-10 leading-relaxed max-w-xs">
            LevelNext unifies your leadership intelligence across three diagnostics into a single, evolving Edge profile — personalised to you.
          </p>

          {/* Pillars */}
          <div className="space-y-4">
            {PLATFORM_PILLARS.map((p, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-ln-yellow)" }} />
                <div>
                  <p className="text-sm font-semibold text-white">{p.label}</p>
                  <p className="text-xs text-white/50 mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/25 text-xs">
          © {new Date().getFullYear()} Meta Results Pvt. Ltd.
        </p>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 text-center">
          <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-ln-navy)" }}>LevelNext</span>
          <p className="text-xs font-medium tracking-wide mt-0.5" style={{ color: "var(--color-ln-yellow)" }}>
            The Leadership Intelligence Platform
          </p>
        </div>

        <div className="w-full max-w-md">

          {/* ── CHOOSE mode ─────────────────────────────────────────────── */}
          {mode === "choose" && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>
                  Welcome, {firstName}.
                </h1>
                <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
                  Let's set up your workspace to get started.
                </p>
              </div>

              <div className="space-y-3">
                {/* Create card */}
                <button
                  onClick={() => setMode("create")}
                  className="w-full rounded-2xl p-5 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group"
                  style={{
                    background: "white",
                    border: "1.5px solid var(--color-ln-border)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--color-ln-navy)" }}
                    >
                      <Building2 size={20} style={{ color: "var(--color-ln-yellow)" }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                        Create an Organisation
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: "var(--color-ln-muted)" }}>
                        Set up LevelNext for your team or company
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                      style={{ color: "var(--color-ln-muted)" }}
                    />
                  </div>
                </button>

                {/* Join card */}
                <button
                  onClick={() => setMode("join")}
                  className="w-full rounded-2xl p-5 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group"
                  style={{
                    background: "white",
                    border: "1.5px solid var(--color-ln-border)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "oklch(95% 0.02 248.6)" }}
                    >
                      <Users size={20} style={{ color: "var(--color-ln-navy)" }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                        Join an Organisation
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: "var(--color-ln-muted)" }}>
                        Use an invite code from your organisation admin
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                      style={{ color: "var(--color-ln-muted)" }}
                    />
                  </div>
                </button>
              </div>

              {/* Divider + context */}
              <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--color-ln-border)" }}>
                <p className="text-xs text-center" style={{ color: "var(--color-ln-muted)" }}>
                  Your data is private and never shared without your consent.
                </p>
              </div>
            </div>
          )}

          {/* ── CREATE mode ─────────────────────────────────────────────── */}
          {mode === "create" && (
            <div className="animate-fade-in">
              <button
                onClick={() => setMode("choose")}
                className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:opacity-70"
                style={{ color: "var(--color-ln-muted)" }}
              >
                <ChevronLeft size={15} /> Back
              </button>

              <div className="mb-7">
                <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>
                  Create your Organisation
                </h1>
                <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
                  This sets up your LevelNext workspace. You can invite team members after setup.
                </p>
              </div>

              <div
                className="rounded-2xl p-6 space-y-5"
                style={{ background: "white", border: "1.5px solid var(--color-ln-border)" }}
              >
                {/* Org name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                    Organisation Name <span style={{ color: "#e53e3e" }}>*</span>
                  </Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Broadridge India GCC"
                    className="h-10"
                    style={{ borderColor: "var(--color-ln-border)" }}
                  />
                </div>

                {/* Industry */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                    Industry <span className="text-xs font-normal" style={{ color: "var(--color-ln-muted)" }}>(optional)</span>
                  </Label>
                  <Input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Financial Services, Technology"
                    className="h-10"
                    style={{ borderColor: "var(--color-ln-border)" }}
                  />
                </div>

                {/* Team size */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                    Team Size <span className="text-xs font-normal" style={{ color: "var(--color-ln-muted)" }}>(optional)</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["1–10", "11–50", "51–200", "201–500", "500+", "1000+"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(size === s ? "" : s)}
                        className="h-9 rounded-lg text-sm font-medium transition-all duration-100"
                        style={{
                          background: size === s ? "var(--color-ln-navy)" : "oklch(97% 0.005 248.6)",
                          color: size === s ? "white" : "var(--color-ln-navy)",
                          border: size === s ? "1.5px solid var(--color-ln-navy)" : "1.5px solid var(--color-ln-border)",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => createTenant.mutate({ name: orgName, industry: industry || undefined, size: size || undefined })}
                  disabled={!orgName.trim() || createTenant.isPending}
                  className="w-full h-11 font-semibold text-sm"
                  style={{ background: "var(--color-ln-navy)", color: "white" }}
                >
                  {createTenant.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Organisation <ArrowRight size={15} />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── JOIN mode ───────────────────────────────────────────────── */}
          {mode === "join" && (
            <div className="animate-fade-in">
              <button
                onClick={() => setMode("choose")}
                className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:opacity-70"
                style={{ color: "var(--color-ln-muted)" }}
              >
                <ChevronLeft size={15} /> Back
              </button>

              <div className="mb-7">
                <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>
                  Join your Organisation
                </h1>
                <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
                  Enter the invite code shared by your organisation admin to connect your account.
                </p>
              </div>

              <div
                className="rounded-2xl p-6 space-y-5"
                style={{ background: "white", border: "1.5px solid var(--color-ln-border)" }}
              >
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                    Invite Code <span style={{ color: "#e53e3e" }}>*</span>
                  </Label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCD-1234-EFGH"
                    className="h-10 font-mono tracking-widest text-center text-base"
                    style={{ borderColor: "var(--color-ln-border)" }}
                    maxLength={16}
                  />
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>
                    Ask your organisation admin for the invite code.
                  </p>
                </div>

                {/* What happens next */}
                <div
                  className="rounded-xl p-4 space-y-2"
                  style={{ background: "oklch(97% 0.005 248.6)", border: "1px solid var(--color-ln-border)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>
                    What happens next
                  </p>
                  {[
                    "Your account is linked to the organisation",
                    "You can begin your first diagnostic immediately",
                    "Your Edge profile is private to you",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-ln-navy)" }} />
                      <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{step}</p>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => joinTenant.mutate({ inviteCode })}
                  disabled={!inviteCode.trim() || joinTenant.isPending}
                  className="w-full h-11 font-semibold text-sm"
                  style={{ background: "var(--color-ln-navy)", color: "white" }}
                >
                  {joinTenant.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Joining…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Join Organisation <ArrowRight size={15} />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
