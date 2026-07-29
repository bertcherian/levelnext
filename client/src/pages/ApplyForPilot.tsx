import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

const LOGO_URL = "/logo.png";
const TIDYCAL_URL = "https://tidycal.com/metaresults/pilot";

const TEAM_SIZE_OPTIONS = [
  "1–10 leaders",
  "11–25 leaders",
];

export default function ApplyForPilot() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    companyUrl: "",
    teamSize: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = trpc.pilotApplication.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      // Redirect to TidyCal after a short pause so user sees confirmation
      setTimeout(() => {
        window.open(TIDYCAL_URL, "_blank");
      }, 1800);
    },
    onError: (err) => {
      setErrors({ _global: err.message });
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Your name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.company.trim()) e.company = "Company name is required";
    if (form.companyUrl && !/^https?:\/\/.+/.test(form.companyUrl)) {
      e.companyUrl = "Include https:// (e.g. https://yourcompany.com)";
    }
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    submit.mutate(form);
  }

  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-ln-navy)", color: "white" }}>

      {/* Header */}
      <header className="px-6 md:px-10 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid oklch(from white 30% 0 0 / 0.08)" }}>
        <a href="/">
          <img src={LOGO_URL} alt="LevelNext" className="h-12 w-auto" />
        </a>
        <a href="/" className="text-sm font-medium" style={{ color: "oklch(60% 0.02 248.6)" }}>
          ← Back to home
        </a>
      </header>

      {/* Body */}
      <div className="flex-1 flex items-start justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-xl">

          {!submitted ? (
            <>
              {/* Heading */}
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "var(--color-ln-yellow)" }}>
                  Complimentary 90-Day Pilot
                </p>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3 text-white">
                  Apply for a Pilot
                </h1>
                <p className="text-base leading-relaxed" style={{ color: "oklch(72% 0.02 248.6)" }}>
                  We'll give 10 of your leaders a complimentary 90-day LevelNext pilot —
                  no IT setup, no procurement process. Fill in your details and we'll
                  set up a 30-minute call to get you started.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-white/80">Your Name *</Label>
                  <Input
                    id="name"
                    placeholder="Priya Sharma"
                    value={form.name}
                    onChange={(e) => field("name", e.target.value)}
                    className="h-11 text-white placeholder:text-white/30"
                    style={{ background: "oklch(from white 15% 0 0 / 0.08)", border: errors.name ? "1.5px solid #ef4444" : "1px solid oklch(from white 30% 0 0 / 0.15)" }}
                  />
                  {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-white/80">Work Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="priya@yourcompany.com"
                    value={form.email}
                    onChange={(e) => field("email", e.target.value)}
                    className="h-11 text-white placeholder:text-white/30"
                    style={{ background: "oklch(from white 15% 0 0 / 0.08)", border: errors.email ? "1.5px solid #ef4444" : "1px solid oklch(from white 30% 0 0 / 0.15)" }}
                  />
                  {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium text-white/80">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => field("phone", e.target.value)}
                    className="h-11 text-white placeholder:text-white/30"
                    style={{ background: "oklch(from white 15% 0 0 / 0.08)", border: "1px solid oklch(from white 30% 0 0 / 0.15)" }}
                  />
                </div>

                {/* Company */}
                <div className="space-y-1.5">
                  <Label htmlFor="company" className="text-sm font-medium text-white/80">Company Name *</Label>
                  <Input
                    id="company"
                    placeholder="Acme Corp"
                    value={form.company}
                    onChange={(e) => field("company", e.target.value)}
                    className="h-11 text-white placeholder:text-white/30"
                    style={{ background: "oklch(from white 15% 0 0 / 0.08)", border: errors.company ? "1.5px solid #ef4444" : "1px solid oklch(from white 30% 0 0 / 0.15)" }}
                  />
                  {errors.company && <p className="text-xs text-red-400">{errors.company}</p>}
                </div>

                {/* Company URL */}
                <div className="space-y-1.5">
                  <Label htmlFor="companyUrl" className="text-sm font-medium text-white/80">Company Website</Label>
                  <Input
                    id="companyUrl"
                    type="url"
                    placeholder="https://yourcompany.com"
                    value={form.companyUrl}
                    onChange={(e) => field("companyUrl", e.target.value)}
                    className="h-11 text-white placeholder:text-white/30"
                    style={{ background: "oklch(from white 15% 0 0 / 0.08)", border: errors.companyUrl ? "1.5px solid #ef4444" : "1px solid oklch(from white 30% 0 0 / 0.15)" }}
                  />
                  {errors.companyUrl && <p className="text-xs text-red-400">{errors.companyUrl}</p>}
                </div>

                {/* Team Size */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-white/80">Number of Leaders for the Pilot</Label>
                  <Select value={form.teamSize} onValueChange={(v) => field("teamSize", v)}>
                    <SelectTrigger className="h-11 text-white"
                      style={{ background: "oklch(from white 15% 0 0 / 0.08)", border: "1px solid oklch(from white 30% 0 0 / 0.15)" }}>
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_SIZE_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-sm font-medium text-white/80">
                    Anything you'd like us to know? <span className="text-white/40">(optional)</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="e.g. We're a GCC with 200 senior leaders and want to focus on executive communication and strategic thinking..."
                    value={form.message}
                    onChange={(e) => field("message", e.target.value)}
                    rows={3}
                    className="text-white placeholder:text-white/30 resize-none"
                    style={{ background: "oklch(from white 15% 0 0 / 0.08)", border: "1px solid oklch(from white 30% 0 0 / 0.15)" }}
                  />
                </div>

                {errors._global && (
                  <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-2">{errors._global}</p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-13 text-base font-bold rounded-xl"
                  style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
                  disabled={submit.isPending}
                >
                  {submit.isPending ? (
                    <><Loader2 size={18} className="mr-2 animate-spin" /> Submitting…</>
                  ) : (
                    <>Submit & Book a Call <ArrowRight size={18} className="ml-2" /></>
                  )}
                </Button>

                <p className="text-xs text-center" style={{ color: "oklch(45% 0.02 248.6)" }}>
                  After submitting, you'll be taken to our calendar to book a 30-minute call.
                </p>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.15)", border: "2px solid var(--color-ln-yellow)" }}>
                <CheckCircle2 size={32} style={{ color: "var(--color-ln-yellow)" }} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Application received!</h2>
              <p className="text-base mb-6" style={{ color: "oklch(72% 0.02 248.6)" }}>
                Thank you, {form.name.split(" ")[0]}. Opening our booking calendar so you can
                pick a time that works for you…
              </p>
              <a
                href={TIDYCAL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="font-bold px-8"
                  style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                  Book Your Call Now <ArrowRight size={18} className="ml-2" />
                </Button>
              </a>
              <p className="text-xs mt-4" style={{ color: "oklch(45% 0.02 248.6)" }}>
                If the calendar didn't open,{" "}
                <a href={TIDYCAL_URL} target="_blank" rel="noopener noreferrer"
                  className="underline" style={{ color: "var(--color-ln-yellow)" }}>
                  click here
                </a>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-6 text-center"
        style={{ borderTop: "1px solid oklch(from white 20% 0 0 / 0.08)" }}>
        <p className="text-xs" style={{ color: "oklch(40% 0.02 248.6)" }}>
          © 2026 LevelNext · Powered by Meta Results Pvt. Ltd.
        </p>
      </footer>
    </div>
  );
}
