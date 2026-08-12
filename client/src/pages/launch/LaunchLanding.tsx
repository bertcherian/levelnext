import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Rocket, Map, Brain, FileText, Mic, DollarSign, Briefcase, Star, ArrowRight, CheckCircle2, Zap, Target, Trophy, Users, X } from "lucide-react";

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_c21f58d5.png";

const MISSIONS = [
  { icon: Target, color: "#3B82F6", label: "Career Compass", desc: "Discover your ideal career direction with AI-powered self-assessment", xp: 150, route: "/launch/mission/1" },
  { icon: Brain, color: "#8B5CF6", label: "Story Builder", desc: "Craft your personal brand narrative and LinkedIn presence", xp: 200, route: "/launch/mission/2" },
  { icon: Zap, color: "#10B981", label: "Skill Sprint", desc: "10 bite-sized modules on communication, productivity & presence", xp: 300, route: "/launch/mission/3" },
  { icon: FileText, color: "#F59E0B", label: "Resume Makeover", desc: "AI-powered resume analysis and complete rewrite", xp: 250, route: "/launch/resume" },
  { icon: Mic, color: "#EF4444", label: "Interview Intelligence", desc: "Mock interviews with real-time AI coaching and debrief", xp: 350, route: "/launch/interview" },
  { icon: DollarSign, color: "#06B6D4", label: "Negotiation Simulator", desc: "Practice salary negotiation with an AI employer", xp: 300, route: "/launch/negotiate" },
  { icon: Briefcase, color: "#F97316", label: "Application Tracker", desc: "Manage your job pipeline with reminders and status tracking", xp: 100, route: "/launch/applications" },
];

const STATS = [
  { value: "7", label: "Career Missions" },
  { value: "1,450+", label: "XP to Earn" },
  { value: "AI", label: "Powered Coach" },
  { value: "Free", label: "To Start" },
];

const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "Software Engineer",
    company: "Infosys · 2 YOE",
    text: "The Interview Intelligence module completely changed how I prepare. I got my dream offer after just 3 practice sessions.",
    initials: "PS",
    avatarBg: "#3B82F6",
    rating: 5,
  },
  {
    name: "Arjun M.",
    role: "MBA Graduate",
    company: "IIM Bangalore · Fresher",
    text: "Story Builder helped me write a LinkedIn About section that got me 5 recruiter messages in one week. Absolutely worth it.",
    initials: "AM",
    avatarBg: "#8B5CF6",
    rating: 5,
  },
  {
    name: "Kavya R.",
    role: "Product Manager",
    company: "Razorpay · 1 YOE",
    text: "The Negotiation Simulator gave me the confidence to ask for 18% more than the initial offer. It worked. Best tool I've used.",
    initials: "KR",
    avatarBg: "#10B981",
    rating: 5,
  },
];

// Reusable 5-star rating component
function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={15}
          fill={i < count ? "#F59E0B" : "none"}
          style={{ color: i < count ? "#F59E0B" : "rgba(255,255,255,0.2)" }}
        />
      ))}
    </div>
  );
}

// Mission card with hover effect via React state (avoids CSS-in-JS limitations)
function MissionCard({ m, idx, onClick }: { m: typeof MISSIONS[0]; idx: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const Icon = m.icon;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        padding: "20px",
        borderRadius: 16,
        background: hovered ? `${m.color}14` : `${m.color}08`,
        border: `1px solid ${hovered ? m.color + "55" : m.color + "25"}`,
        boxShadow: hovered ? `0 8px 32px ${m.color}30, 0 0 0 1px ${m.color}20` : "none",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.22s cubic-bezier(0.23, 1, 0.32, 1)",
        cursor: "pointer",
        willChange: "transform",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: hovered ? `${m.color}28` : `${m.color}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.22s",
        }}>
          <Icon size={20} style={{ color: m.color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>Mission {idx + 1}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${m.color}20`, color: m.color }}>+{m.xp} XP</span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#F8FAFC", marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>{m.label}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{m.desc}</p>
        </div>
      </div>
    </div>
  );
}

// Testimonial card with avatar and star rating
function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    <div style={{
      padding: "24px",
      borderRadius: 16,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {/* Stars */}
      <StarRating count={t.rating} />

      {/* Quote */}
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.75, fontStyle: "italic", flex: 1 }}>
        "{t.text}"
      </p>

      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${t.avatarBg}cc, ${t.avatarBg}66)`,
          border: `2px solid ${t.avatarBg}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: "#fff",
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: "0.03em",
        }}>
          {t.initials}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC", marginBottom: 2 }}>{t.name}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>
            {t.role}<br />
            <span style={{ color: "rgba(255,255,255,0.25)" }}>{t.company}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LaunchLanding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [stickyDismissed, setStickyDismissed] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Show sticky bar only after the hero CTA scrolls out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!stickyDismissed) {
          setShowStickyBar(!entry.isIntersecting);
        }
      },
      { threshold: 0 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [stickyDismissed]);

  const handleCTA = () => {
    if (user) {
      navigate("/launch/onboarding");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div style={{
      fontFamily: "'Manrope', sans-serif",
      background: "linear-gradient(135deg, #0A0F1E 0%, #0D1B2A 40%, #0A1628 70%, #060D1A 100%)",
      minHeight: "100vh",
      color: "#F8FAFC",
      overflowX: "hidden",
      paddingBottom: showStickyBar && !stickyDismissed ? 80 : 0,
    }}>
      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "40%", left: "40%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,15,30,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(59,130,246,0.15)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={LOGO_URL} alt="LevelNext" style={{ height: 40, width: "auto", objectFit: "contain" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.08em" }}>
              LAUNCH INTELLIGENCE
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user ? (
              <button
                onClick={() => navigate("/launch/home")}
                style={{
                  padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button
                  onClick={() => window.location.href = getLoginUrl()}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600 }}
                >
                  Sign In
                </button>
                <button
                  onClick={handleCTA}
                  style={{
                    padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  Start Free →
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Hero ── */}
        <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 1.5rem 60px", textAlign: "center" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 20, marginBottom: 28,
            background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)",
          }}>
            <Rocket size={14} style={{ color: "#60A5FA" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.05em" }}>
              LAUNCH INTELLIGENCE · POWERED BY AI
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 24,
            fontFamily: "'Space Grotesk', sans-serif",
            background: "linear-gradient(135deg, #F8FAFC 0%, #93C5FD 50%, #6EE7B7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Is your career launch<br />leaving you behind?
          </h1>

          {/* Sub-headline */}
          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "rgba(255,255,255,0.65)",
            maxWidth: 620,
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}>
            Launch Intelligence is a 7-mission AI career platform built for ambitious professionals in their first 5 years. Complete missions, earn XP, and land the role — and the salary — you deserve.
          </p>

          {/* CTA Buttons — observed for sticky bar visibility */}
          <div ref={heroRef} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <button
              onClick={handleCTA}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "14px 32px", borderRadius: 14, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                color: "#fff", fontSize: 15, fontWeight: 800,
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: "0 0 40px rgba(59,130,246,0.4)",
              }}
            >
              <Rocket size={18} />
              Begin Your Launch
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/launch/journey")}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "14px 28px", borderRadius: 14, cursor: "pointer",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 600,
              }}
            >
              <Map size={16} />
              View Journey Map
            </button>
          </div>

          {/* Trust line */}
          <p style={{ marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
            Free to start · No credit card · Powered by Claude AI
          </p>
        </section>

        {/* ── Stats Bar ── */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 1.5rem", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, textAlign: "center" }}>
            {STATS.map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#60A5FA", fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7 Missions ── */}
        <section style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.1em", marginBottom: 12 }}>THE JOURNEY</p>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 12 }}>
              7 Missions. One Career Launch.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, maxWidth: 500, margin: "0 auto" }}>
              Each mission builds on the last. Complete them all to unlock your full career potential.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {MISSIONS.map((m, idx) => (
              <MissionCard key={m.label} m={m} idx={idx} onClick={handleCTA} />
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section style={{ background: "rgba(59,130,246,0.04)", borderTop: "1px solid rgba(59,130,246,0.1)", borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.1em", marginBottom: 12 }}>HOW IT WORKS</p>
              <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, color: "#F8FAFC", textShadow: "0 1px 18px rgba(0,0,0,0.24)", fontFamily: "'Space Grotesk', sans-serif" }}>
                Your AI coach, Layla, guides every step
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
              {[
                { step: "01", title: "Set Your Goal", desc: "Tell Layla what you're aiming for — first job, promotion, or startup. She personalises your entire journey.", color: "#3B82F6" },
                { step: "02", title: "Complete Missions", desc: "Work through AI-powered missions at your own pace. Each one builds a real, tangible career asset.", color: "#10B981" },
                { step: "03", title: "Earn XP & Level Up", desc: "Track your progress with XP, streaks, and levels. From Career Explorer to Launch Legend.", color: "#F59E0B" },
                { step: "04", title: "Land the Role", desc: "Walk into every interview, negotiation, and application with the confidence of someone who's prepared.", color: "#8B5CF6" },
              ].map((s) => (
                <div key={s.step} style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: `${s.color}40`, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 12 }}>{s.step}</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#F8FAFC", marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.1em", marginBottom: 12 }}>RESULTS</p>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
              What could your launch look like?
            </h2>
            {/* Aggregate rating row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <StarRating count={5} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>5.0</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>· Rated by early-career professionals</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} t={t} />
            ))}
          </div>
        </section>

        {/* ── What You Get ── */}
        <section style={{ background: "rgba(16,185,129,0.04)", borderTop: "1px solid rgba(16,185,129,0.1)", borderBottom: "1px solid rgba(16,185,129,0.1)" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", padding: "80px 1.5rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 36 }}>
              Everything you need to launch
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, textAlign: "left", marginBottom: 48 }}>
              {[
                "AI Career Direction Report",
                "LinkedIn About Section",
                "30s & 60s Elevator Pitches",
                "ATS-Optimised Resume",
                "Interview Debrief PDF",
                "Negotiation Coaching",
                "Job Application Pipeline",
                "XP Progress Tracking",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleCTA}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "16px 40px", borderRadius: 14, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                color: "#fff", fontSize: 16, fontWeight: 800,
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: "0 0 50px rgba(59,130,246,0.4)",
              }}
            >
              <Rocket size={20} />
              Start Your Launch — Free
              <ArrowRight size={18} />
            </button>
            <p style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              No credit card required · Start in under 2 minutes
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 1.5rem", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
            <img src={LOGO_URL} alt="LevelNext" style={{ height: 28, objectFit: "contain" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Launch Intelligence</span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
            © 2025 Meta Results Pvt. Ltd. · Bangalore, India · Built for ambitious early-career professionals
          </p>
        </footer>

      </div>

      {/* ── Sticky CTA Bar ── */}
      {showStickyBar && !stickyDismissed && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: "rgba(8, 13, 26, 0.92)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(59,130,246,0.3)",
          padding: "14px 1.5rem",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
          boxShadow: "0 -4px 32px rgba(0,0,0,0.5)",
          animation: "slideUp 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        }}>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Rocket size={16} style={{ color: "#60A5FA" }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600, display: "none" }} className="sm-show">
              Ready to launch your career?
            </span>
          </div>

          <button
            onClick={handleCTA}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 28px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
              color: "#fff", fontSize: 14, fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: "0 0 24px rgba(59,130,246,0.5)",
              flexShrink: 0,
            }}
          >
            Get Started — It's Free
            <ArrowRight size={15} />
          </button>

          <button
            onClick={() => setStickyDismissed(true)}
            aria-label="Dismiss"
            style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.3)", padding: 4, display: "flex",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
