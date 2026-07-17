import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  BarChart3,
  MessageSquare,
  BookOpen,
  Zap,
  Users,
  Target,
  Brain,
  TrendingUp,
  Shield,
  Star,
} from "lucide-react";

const DIAGNOSTICS = [
  { code: "DEI", name: "Delegation & Empowerment", desc: "Do you trust your team enough to let go?" },
  { code: "FCI", name: "Feedback & Coaching", desc: "Are your conversations building capability?" },
  { code: "TMI", name: "Team Motivation", desc: "Do your people bring their best every day?" },
  { code: "CCI", name: "Communication Clarity", desc: "Does your team know exactly what you mean?" },
  { code: "CNI", name: "Conflict Navigation", desc: "Do you turn friction into forward motion?" },
  { code: "DMI", name: "Decision Making", desc: "Are you deciding fast enough, and well enough?" },
  { code: "CLI", name: "Change Leadership", desc: "Can you move people through uncertainty?" },
  { code: "PMI", name: "Performance Management", desc: "Are you having the right performance conversations?" },
  { code: "PSI", name: "Psychological Safety", desc: "Do people speak up, challenge, and take risks?" },
  { code: "STI", name: "Strategic Thinking", desc: "Are you managing the present or building the future?" },
];

const MODULES = [
  {
    icon: <BarChart3 size={22} className="text-amber-500" />,
    title: "10 Management Diagnostics",
    desc: "Precision assessments across the 10 dimensions that separate average managers from exceptional ones. Know your exact score in each.",
  },
  {
    icon: <Brain size={22} className="text-amber-500" />,
    title: "AI Manager Guide",
    desc: "Your always-on coaching advisor. Ask anything about managing your team — it knows your diagnostic scores and gives you context-specific guidance.",
  },
  {
    icon: <BookOpen size={22} className="text-amber-500" />,
    title: "Manager Playbook",
    desc: "Describe any leadership situation you're facing. Get a structured playbook: the SBI model, a conversation guide, and a concrete action plan.",
  },
  {
    icon: <Zap size={22} className="text-amber-500" />,
    title: "Daily Management Brief",
    desc: "Your morning OS. An AI-generated brief that sets your focus, surfaces team priorities, and gives you one high-leverage action for the day.",
  },
  {
    icon: <MessageSquare size={22} className="text-amber-500" />,
    title: "AI Practice Partner",
    desc: "Role-play difficult conversations before they happen. Get instant feedback on your approach, language, and emotional intelligence.",
  },
  {
    icon: <Target size={22} className="text-amber-500" />,
    title: "Behaviour Change Engine",
    desc: "Turn insights into commitments. Track your behaviour change goals with AI coaching check-ins that hold you accountable.",
  },
  {
    icon: <Users size={22} className="text-amber-500" />,
    title: "Team Intelligence",
    desc: "Build a profile of each team member. Get AI-generated coaching insights, communication preferences, and engagement strategies per person.",
  },
];

const WHO_ITS_FOR = [
  "First-time managers transitioning from individual contributor to team leader",
  "Mid-level managers leading teams of 5–20 people",
  "Team leads who want to build high-performing, psychologically safe teams",
  "Managers preparing for their next step into senior leadership",
  "HR and L&D leaders looking for a scalable manager development tool",
];

const OUTCOMES = [
  { icon: <TrendingUp size={18} />, text: "Higher team performance and output quality" },
  { icon: <Shield size={18} />, text: "Fewer escalations and team conflicts" },
  { icon: <Star size={18} />, text: "Better retention — people stay for great managers" },
  { icon: <CheckCircle2 size={18} />, text: "Faster, more confident decision-making" },
  { icon: <Users size={18} />, text: "A team that speaks up, challenges, and innovates" },
  { icon: <Brain size={18} />, text: "A manager who knows exactly where to grow next" },
];

export default function ManagerEffectivenessLanding() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1f3d", color: "#f8f7f4" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(15,31,61,0.95)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <img src="/manus-storage/LevelNext_logo_transparent_88851f5c.png" alt="LevelNext" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="font-semibold gap-1.5" style={{ background: "#F2B705", color: "#0f1f3d" }}>
                Get Started <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
              style={{ background: "rgba(242,183,5,0.12)", borderColor: "rgba(242,183,5,0.3)", color: "#F2B705" }}>
              <Users size={13} />
              Manager Effectiveness Platform
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6" style={{ color: "#ffffff" }}>
              The intelligence platform built for{" "}
              <span style={{ color: "#F2B705" }}>managers who want to lead well.</span>
            </h1>
            <p className="text-lg leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
              10 precision diagnostics. An AI coaching advisor. A daily management brief. A practice partner for difficult conversations. Everything a manager needs to go from good to exceptional — in one platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg" className="font-semibold gap-2 px-8" style={{ background: "#F2B705", color: "#0f1f3d" }}>
                  Start Your Assessment <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="font-semibold gap-2 border-white/20 text-white hover:bg-white/10 hover:text-white">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-sm mt-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              No credit card required · Takes 15 minutes to complete your first diagnostic
            </p>
          </div>

          {/* Score mockup */}
          <div className="hidden lg:block">
            <div className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>MANAGEMENT EFFECTIVENESS SCORE</p>
                  <p className="text-3xl font-bold" style={{ color: "#F2B705" }}>72 / 100</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Zone</p>
                  <p className="text-sm font-semibold" style={{ color: "#F2B705" }}>Developing Leader</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: "Delegation & Empowerment", score: 68, color: "#F2B705" },
                  { name: "Feedback & Coaching", score: 81, color: "#4ade80" },
                  { name: "Team Motivation", score: 74, color: "#F2B705" },
                  { name: "Psychological Safety", score: 58, color: "#f87171" },
                  { name: "Strategic Thinking", score: 77, color: "#4ade80" },
                ].map((d) => (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                      <span>{d.name}</span>
                      <span className="font-semibold" style={{ color: d.color }}>{d.score}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${d.score}%`, background: d.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-4 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>Sample diagnostic results</p>
            </div>
          </div>
        </div>
      </section>

      {/* 10 Diagnostics */}
      <section className="py-16" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "#ffffff" }}>10 Diagnostics. Every dimension of management.</h2>
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
              Each diagnostic gives you a precise score, a zone classification, and an AI-generated development plan.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {DIAGNOSTICS.map((d) => (
              <div key={d.code} className="rounded-xl p-4 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="text-xs font-bold mb-2 px-2 py-0.5 rounded inline-block" style={{ background: "rgba(242,183,5,0.15)", color: "#F2B705" }}>{d.code}</div>
                <p className="text-sm font-semibold mb-1.5" style={{ color: "#ffffff" }}>{d.name}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "#ffffff" }}>Everything you need. Nothing you don't.</h2>
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
              Seven integrated modules that work together to build a complete management intelligence system.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULES.map((m) => (
              <div key={m.title} className="rounded-xl p-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="mb-3">{m.icon}</div>
                <h3 className="font-semibold mb-2" style={{ color: "#ffffff" }}>{m.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-16" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "#ffffff" }}>Built for managers who are serious about their craft.</h2>
          </div>
          <div className="space-y-3">
            {WHO_ITS_FOR.map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#F2B705" }} />
                <p style={{ color: "rgba(255,255,255,0.8)" }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "#ffffff" }}>What changes when managers use LevelNext.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OUTCOMES.map((o) => (
              <div key={o.text} className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: "rgba(242,183,5,0.06)", borderColor: "rgba(242,183,5,0.2)" }}>
                <span style={{ color: "#F2B705" }} className="mt-0.5 flex-shrink-0">{o.icon}</span>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{o.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: "#ffffff" }}>
            The best managers don't wait to get better.
          </h2>
          <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            Start with your first diagnostic today. In 15 minutes, you'll know exactly where you stand — and what to do next.
          </p>
          <Link href="/signup">
            <Button size="lg" className="font-semibold gap-2 px-10 py-6 text-base" style={{ background: "#F2B705", color: "#0f1f3d" }}>
              Start Free Assessment <ArrowRight size={18} />
            </Button>
          </Link>
          <p className="text-sm mt-4" style={{ color: "rgba(255,255,255,0.35)" }}>
            No credit card · No setup · Just clarity
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            © {new Date().getFullYear()} LevelNext by Meta Results Pvt. Ltd. · Bangalore, India
          </p>
          <div className="flex items-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            <Link href="/">
              <span className="hover:text-white transition-colors cursor-pointer">Leadership Intelligence</span>
            </Link>
            <Link href="/career-intelligence">
              <span className="hover:text-white transition-colors cursor-pointer">Career Intelligence</span>
            </Link>
            <Link href="/login">
              <span className="hover:text-white transition-colors cursor-pointer">Sign In</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
