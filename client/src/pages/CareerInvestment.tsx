import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Check, X, ChevronDown, ChevronUp, ArrowRight,
  TrendingUp, Clock, Shield, Star, Users, Award,
  Briefcase, Target, Brain, Zap, MessageSquare,
  BarChart3, BookOpen, Search, Menu,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { OutplacementContactModal } from "@/components/OutplacementContactModal";

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_570ab0aa.png";

// ── PLAN DATA ─────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "essentials",
    name: "Career Transition Essentials",
    tagline: "Self-directed. AI-powered. Outcome-focused.",
    price: "₹40,000",
    priceNote: "+ GST",
    duration: "90 Days",
    idealFor: "Professionals who enjoy working independently while using world-class AI coaching.",
    recommended: false,
    cta: "Start My Transition",
    features: [
      "Complete diagnostics",
      "Career Transition Readiness",
      "AI Guide",
      "AI Practice Coach",
      "Interview Simulator",
      "Negotiation Coach",
      "Career Roadmap",
      "LinkedIn Optimisation",
      "Executive CV Builder",
      "Career Journal",
      "Daily Momentum",
      "Weekly Reviews",
      "Opportunity Dashboard",
      "Career Intelligence Reports",
      "Email Support",
    ],
  },
  {
    id: "executive",
    name: "Career Transition Executive",
    tagline: "Personal guidance. Maximum acceleration.",
    price: "₹80,000",
    priceNote: "+ GST",
    duration: "90 Days",
    idealFor: "Senior leaders who want the full power of AI combined with personal executive coaching.",
    recommended: true,
    badge: "Most Popular",
    cta: "Work With an Executive Coach",
    features: [
      "Everything in Essentials",
      "Executive Coach",
      "Fortnightly coaching",
      "Six coaching conversations",
      "Career positioning",
      "Interview preparation",
      "Offer negotiation",
      "Executive accountability",
      "Priority AI support",
      "Personal action plans",
      "Reflection reviews",
      "Priority email support",
    ],
  },
  {
    id: "advisory",
    name: "Career Transition Advisory",
    tagline: "Bespoke. Intensive. For CXOs.",
    price: "₹1,20,000–₹2,00,000",
    priceNote: "+ GST",
    duration: "90 Days",
    idealFor: "CXOs and senior executives navigating complex transitions, board positioning, or major career pivots.",
    recommended: false,
    cta: "Book a Discovery Conversation",
    features: [
      "Everything in Executive",
      "Unlimited messaging",
      "Weekly coaching",
      "Personal branding",
      "Board positioning",
      "Executive introductions",
      "Negotiation support",
      "Executive narrative",
      "Personal strategy",
      "Priority scheduling",
      "Bespoke programme design",
    ],
  },
];

// ── COMPARISON TABLE DATA ─────────────────────────────────────────────────────
const COMPARISON_ROWS = [
  { feature: "Career Transition Diagnostics", essentials: true, executive: true, advisory: true },
  { feature: "AI Career Transition Coach", essentials: true, executive: true, advisory: true },
  { feature: "AI Practice Coach", essentials: true, executive: true, advisory: true },
  { feature: "Interview Simulator", essentials: true, executive: true, advisory: true },
  { feature: "Negotiation Coach", essentials: true, executive: true, advisory: true },
  { feature: "Executive CV Builder", essentials: true, executive: true, advisory: true },
  { feature: "LinkedIn Optimisation", essentials: true, executive: true, advisory: true },
  { feature: "Career Roadmap", essentials: true, executive: true, advisory: true },
  { feature: "Opportunity Dashboard", essentials: true, executive: true, advisory: true },
  { feature: "Career Journal & Daily Momentum", essentials: true, executive: true, advisory: true },
  { feature: "Email Support", essentials: "Standard", executive: "Priority", advisory: "Priority" },
  { feature: "Executive Coach", essentials: false, executive: true, advisory: true },
  { feature: "Coaching Conversations", essentials: false, executive: "6 sessions", advisory: "Weekly" },
  { feature: "Personal Action Plans", essentials: false, executive: true, advisory: true },
  { feature: "Offer Negotiation Support", essentials: false, executive: true, advisory: true },
  { feature: "Personal Branding", essentials: false, executive: false, advisory: true },
  { feature: "Board Positioning", essentials: false, executive: false, advisory: true },
  { feature: "Executive Introductions", essentials: false, executive: false, advisory: true },
  { feature: "Bespoke Programme Design", essentials: false, executive: false, advisory: true },
];

// ── JOURNEY OUTCOMES ──────────────────────────────────────────────────────────
const JOURNEY_OUTCOMES = [
  {
    step: "Discover",
    icon: Search,
    color: "#818cf8",
    items: ["Diagnostics", "Career readiness", "Gap analysis"],
  },
  {
    step: "Develop",
    icon: Brain,
    color: "#34d399",
    items: ["AI coaching", "Learning roadmap", "Practice", "Reflection"],
  },
  {
    step: "Position",
    icon: Target,
    color: "#f59e0b",
    items: ["Executive CV", "LinkedIn", "Narrative", "Personal brand"],
  },
  {
    step: "Access",
    icon: Briefcase,
    color: "#f472b6",
    items: ["Networking", "Target companies", "Opportunity intelligence", "Interview preparation"],
  },
  {
    step: "Transition",
    icon: TrendingUp,
    color: "#60a5fa",
    items: ["Negotiation", "Offer evaluation", "90-day roadmap"],
  },
];

// ── ALTERNATIVES ─────────────────────────────────────────────────────────────
const ALTERNATIVES = [
  { name: "Executive MBA", cost: "₹20–40 lakhs", duration: "2 years", note: "No career transition focus" },
  { name: "Executive Coach", cost: "₹2–8 lakhs", duration: "6–12 months", note: "No AI, diagnostics, or tools" },
  { name: "Outplacement Programme", cost: "₹75,000–₹5 lakhs", duration: "Variable", note: "Generic, not personalised" },
  { name: "Months of searching alone", cost: "Lost salary + confidence", duration: "6–18 months", note: "No structure or support" },
];

// ── TESTIMONIALS ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Priya Nair",
    role: "VP, Technology",
    company: "Global MNC",
    outcome: "Moved from VP to SVP in 4 months",
    quote: "I had been waiting for the right opportunity for two years. Career Transition Intelligence helped me understand exactly why I was being overlooked — and what to do about it. Within four months I had three offers and accepted an SVP role at 40% higher compensation.",
  },
  {
    name: "Rajiv Menon",
    role: "Director, Operations",
    company: "Fortune 500",
    outcome: "₹18L salary increase on transition",
    quote: "The negotiation coaching alone was worth ten times the investment. I had never negotiated an offer in my life. The AI coach walked me through every scenario. I ended up negotiating ₹18 lakhs more than the initial offer.",
  },
  {
    name: "Ananya Krishnan",
    role: "Senior Manager",
    company: "Consulting Firm",
    outcome: "Transitioned industries in 90 days",
    quote: "I wanted to move from consulting to industry but didn't know how to position my experience. The diagnostics showed me exactly where my gaps were. The CV builder and LinkedIn optimisation transformed how I was perceived. I had my first industry role within 90 days.",
  },
  {
    name: "Suresh Iyer",
    role: "CTO",
    company: "Technology Company",
    outcome: "Board advisory role secured",
    quote: "At CXO level, transitions are complex and high-stakes. The Advisory programme gave me a personal strategist who understood board positioning. I secured two advisory roles and a fractional CTO engagement within the programme period.",
  },
];

// ── FAQs ─────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Why 90 days?",
    a: "Career transitions require consistent, structured effort over time. 90 days is long enough to complete diagnostics, build new habits, position yourself properly, and have meaningful conversations in the market — but short enough to maintain momentum and urgency. Most professionals who commit fully see meaningful results within this window.",
  },
  {
    q: "Is this coaching?",
    a: "The Essentials plan is AI-powered and self-directed — you have access to an AI Career Transition Coach, Practice Coach, and Interview Simulator available 24/7. The Executive plan adds a real executive coach with six personal conversations. The Advisory plan provides intensive personal coaching throughout.",
  },
  {
    q: "How much time does it require?",
    a: "We recommend 30–45 minutes per day. This includes completing diagnostics, working with your AI coach, practising for interviews, building your CV and LinkedIn, and reviewing your progress. The platform is designed to fit around a working professional's schedule.",
  },
  {
    q: "Will AI replace the coach?",
    a: "No. The AI handles the always-available, personalised, data-driven elements — diagnostics, daily coaching, practice, and preparation. The human executive coach provides strategic judgment, emotional intelligence, and the kind of honest conversation that only a trusted advisor can offer. They work together.",
  },
  {
    q: "Who is this designed for?",
    a: "Career Transition Intelligence is designed for Directors, VPs, Senior Managers, and CXOs who are considering a transition, actively searching, or want to build long-term career capital. It is also valuable for professionals returning to work after a break, changing industries, or preparing for their first senior role.",
  },
  {
    q: "How is this different from LinkedIn Premium?",
    a: "LinkedIn Premium gives you visibility into job postings and who viewed your profile. Career Transition Intelligence gives you the diagnostics to understand your gaps, the AI coaching to close them, the tools to position yourself, the practice to perform in interviews, and the intelligence to negotiate confidently. They are complementary, not competing.",
  },
  {
    q: "Can my employer pay?",
    a: "Yes. Many organisations fund this through their professional development, leadership, or learning budgets. Some use it as part of outplacement support. We provide a sponsorship request letter you can share with your HR or manager.",
  },
  {
    q: "Do I need to be actively job hunting?",
    a: "No. Many professionals use Career Transition Intelligence to build career capital while still in their current role — so they are ready when the right opportunity appears. Starting before you need to is one of the most strategic decisions you can make.",
  },
  {
    q: "What if I'm unsure about changing jobs?",
    a: "That is exactly the right time to start. The diagnostics will give you clarity on where you stand, what your options are, and what a transition would realistically involve. Many professionals complete the programme and decide to stay — but with a much stronger negotiating position and clearer career direction.",
  },
];

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function CareerInvestment() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [outplacementModalOpen, setOutplacementModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [salary, setSalary] = useState(2000000);
  const [targetSalary, setTargetSalary] = useState(2800000);
  const [monthsSaved, setMonthsSaved] = useState(4);

  const handleCTA = (planId: string) => {
    if (planId === "advisory") {
      setOutplacementModalOpen(true);
      return;
    }
    if (isAuthenticated) {
      navigate("/career");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const roi = Math.round(((targetSalary - salary) + (monthsSaved * (salary / 12))) / 1000) * 1000;
  const investmentCost = 80000;
  const roiMultiple = Math.round(roi / investmentCost);

  return (
    <div className="min-h-screen" style={{ background: "#FAFAF8", color: "#0A1A2F", fontFamily: "'Inter', sans-serif" }}>
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(250,250,248,0.95)", backdropFilter: "blur(12px)", borderColor: "rgba(10,26,47,0.08)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/career-intelligence" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="LevelNext" className="h-8 object-contain" />
            <span className="text-sm font-semibold" style={{ color: "#0A1A2F" }}>Career Transition Intelligence</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#plans" className="text-sm font-medium" style={{ color: "rgba(10,26,47,0.6)" }}>Plans</a>
            <a href="#compare" className="text-sm font-medium" style={{ color: "rgba(10,26,47,0.6)" }}>Compare</a>
            <a href="#why" className="text-sm font-medium" style={{ color: "rgba(10,26,47,0.6)" }}>Why Now</a>
            <a href="#faq" className="text-sm font-medium" style={{ color: "rgba(10,26,47,0.6)" }}>FAQ</a>
            <button
              onClick={() => isAuthenticated ? navigate("/career") : window.location.href = getLoginUrl()}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
              style={{ background: "#D4AF37", color: "#0A1A2F" }}
            >
              Start My Transition
            </button>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t px-6 py-4 flex flex-col gap-4" style={{ borderColor: "rgba(10,26,47,0.08)", background: "#FAFAF8" }}>
            <a href="#plans" className="text-sm font-medium" style={{ color: "rgba(10,26,47,0.6)" }} onClick={() => setMobileMenuOpen(false)}>Plans</a>
            <a href="#compare" className="text-sm font-medium" style={{ color: "rgba(10,26,47,0.6)" }} onClick={() => setMobileMenuOpen(false)}>Compare</a>
            <a href="#why" className="text-sm font-medium" style={{ color: "rgba(10,26,47,0.6)" }} onClick={() => setMobileMenuOpen(false)}>Why Now</a>
            <a href="#faq" className="text-sm font-medium" style={{ color: "rgba(10,26,47,0.6)" }} onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <button
              onClick={() => { setMobileMenuOpen(false); isAuthenticated ? navigate("/career") : window.location.href = getLoginUrl(); }}
              className="px-5 py-2 rounded-full text-sm font-semibold"
              style={{ background: "#D4AF37", color: "#0A1A2F" }}
            >
              Start My Transition
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border" style={{ borderColor: "rgba(212,175,55,0.3)", color: "#B8960C", background: "rgba(212,175,55,0.06)" }}>
          Career Transition Intelligence — by LevelNext
        </div>
        <h1 className="font-bold mb-5" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", lineHeight: 1.1, color: "#0A1A2F" }}>
          Invest in the next chapter<br />of your career.
        </h1>
        <p className="text-lg mb-3 mx-auto max-w-2xl" style={{ color: "rgba(10,26,47,0.55)", lineHeight: 1.7 }}>
          Your next career opportunity shouldn't depend on luck.
        </p>
        <p className="text-base mb-10 mx-auto max-w-2xl" style={{ color: "rgba(10,26,47,0.5)", lineHeight: 1.7 }}>
          Career Transition Intelligence combines AI coaching, diagnostics, deliberate practice and executive guidance to help you confidently transition into your next role.
        </p>
        <a href="#plans">
          <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-base transition-all" style={{ background: "#0A1A2F", color: "#F8F5F0" }}>
            Choose Your Journey <ArrowRight size={18} />
          </button>
        </a>
      </section>

      {/* ── SECTION 1: WHY INVEST NOW ── */}
      <section id="why" className="py-20 border-t" style={{ borderColor: "rgba(10,26,47,0.06)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>Why Invest Now</p>
            <h2 className="font-bold mb-4" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", color: "#0A1A2F" }}>
              Waiting costs more than acting.
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "rgba(10,26,47,0.55)", lineHeight: 1.7 }}>
              Most professionals delay their transition until they have no choice. By then, the market has moved, confidence has eroded, and options have narrowed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Cost of waiting */}
            <div className="rounded-2xl p-8 border" style={{ background: "rgba(10,26,47,0.02)", borderColor: "rgba(10,26,47,0.08)" }}>
              <p className="text-sm font-semibold mb-5" style={{ color: "rgba(10,26,47,0.4)" }}>Waiting six months could mean</p>
              {[
                "Missed promotions that went to better-positioned peers",
                "Lost salary growth — every month without a move is a month without an increase",
                "Reduced confidence from repeated rejections or stagnation",
                "Poorer positioning as the market moves without you",
                "Reactive career decisions made from pressure, not choice",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                    <X size={11} style={{ color: "#ef4444" }} />
                  </div>
                  <p className="text-sm" style={{ color: "rgba(10,26,47,0.65)", lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
            {/* Investing now */}
            <div className="rounded-2xl p-8 border" style={{ background: "rgba(212,175,55,0.04)", borderColor: "rgba(212,175,55,0.2)" }}>
              <p className="text-sm font-semibold mb-5" style={{ color: "#B8960C" }}>Investing now means</p>
              {[
                "Clarity on your gaps before they become visible to others",
                "A structured 90-day plan that creates momentum from day one",
                "Positioning yourself before you need to — from a place of strength",
                "Practising until interviews feel natural, not terrifying",
                "Negotiating with data and confidence, not desperation",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.15)" }}>
                    <Check size={11} style={{ color: "#B8960C" }} />
                  </div>
                  <p className="text-sm" style={{ color: "rgba(10,26,47,0.65)", lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: PLANS ── */}
      <section id="plans" className="py-20 border-t" style={{ borderColor: "rgba(10,26,47,0.06)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>Choose Your Journey</p>
            <h2 className="font-bold mb-4" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", color: "#0A1A2F" }}>
              Choose the level of support that's right for you.
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(10,26,47,0.5)" }}>
              All plans are 90 days. All plans include the full AI platform. The difference is the level of personal guidance.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl p-8 flex flex-col relative"
                style={{
                  background: plan.recommended ? "#0A1A2F" : "#FFFFFF",
                  border: plan.recommended ? "none" : "1px solid rgba(10,26,47,0.1)",
                  boxShadow: plan.recommended ? "0 20px 60px rgba(10,26,47,0.2)" : "0 2px 12px rgba(10,26,47,0.04)",
                }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold" style={{ background: "#D4AF37", color: "#0A1A2F" }}>
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: plan.recommended ? "rgba(248,245,240,0.5)" : "rgba(10,26,47,0.4)" }}>{plan.duration}</p>
                  <h3 className="font-bold text-lg mb-2" style={{ color: plan.recommended ? "#F8F5F0" : "#0A1A2F" }}>{plan.name}</h3>
                  <p className="text-sm mb-5" style={{ color: plan.recommended ? "rgba(248,245,240,0.6)" : "rgba(10,26,47,0.5)" }}>{plan.tagline}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-bold" style={{ fontSize: "1.75rem", color: plan.recommended ? "#D4AF37" : "#0A1A2F" }}>{plan.price}</span>
                  </div>
                  <p className="text-xs" style={{ color: plan.recommended ? "rgba(248,245,240,0.4)" : "rgba(10,26,47,0.35)" }}>{plan.priceNote}</p>
                </div>
                <p className="text-xs mb-6 leading-relaxed" style={{ color: plan.recommended ? "rgba(248,245,240,0.55)" : "rgba(10,26,47,0.5)" }}>
                  <span className="font-semibold" style={{ color: plan.recommended ? "rgba(248,245,240,0.7)" : "rgba(10,26,47,0.65)" }}>Ideal for: </span>
                  {plan.idealFor}
                </p>
                <div className="flex-1 mb-8">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 mb-2.5">
                      <Check size={13} style={{ color: plan.recommended ? "#D4AF37" : "#0A1A2F", flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: plan.recommended ? "rgba(248,245,240,0.75)" : "rgba(10,26,47,0.65)" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleCTA(plan.id)}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: plan.recommended ? "#D4AF37" : "#0A1A2F",
                    color: plan.recommended ? "#0A1A2F" : "#F8F5F0",
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: COMPARISON TABLE ── */}
      <section id="compare" className="py-20 border-t" style={{ borderColor: "rgba(10,26,47,0.06)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>Compare the Plans</p>
            <h2 className="font-bold" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#0A1A2F" }}>Everything, side by side.</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-4 pr-6 text-sm font-medium" style={{ color: "rgba(10,26,47,0.4)", width: "40%" }}>Feature</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="text-center py-4 px-4 text-sm font-semibold" style={{ color: p.recommended ? "#D4AF37" : "#0A1A2F", width: "20%" }}>
                      {p.recommended && <span className="block text-xs font-normal mb-0.5" style={{ color: "#D4AF37" }}>★ Most Popular</span>}
                      {p.name.replace("Career Transition ", "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid rgba(10,26,47,0.05)" }}>
                    <td className="py-3 pr-6 text-sm" style={{ color: "rgba(10,26,47,0.65)" }}>{row.feature}</td>
                    {[row.essentials, row.executive, row.advisory].map((val, j) => (
                      <td key={j} className="py-3 px-4 text-center text-sm">
                        {val === true ? (
                          <Check size={16} className="mx-auto" style={{ color: "#0A1A2F" }} />
                        ) : val === false ? (
                          <span style={{ color: "rgba(10,26,47,0.2)" }}>—</span>
                        ) : (
                          <span className="font-medium" style={{ color: "#0A1A2F" }}>{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: WHAT IS INCLUDED (5-STEP JOURNEY) ── */}
      <section className="py-20 border-t" style={{ borderColor: "rgba(10,26,47,0.06)", background: "#F4F1EC" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>What is Included</p>
            <h2 className="font-bold mb-4" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#0A1A2F" }}>
              Organised around outcomes, not features.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {JOURNEY_OUTCOMES.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="rounded-xl p-5 border" style={{ background: "#FFFFFF", borderColor: "rgba(10,26,47,0.07)" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${step.color}18` }}>
                    <Icon size={18} style={{ color: step.color }} />
                  </div>
                  <p className="font-bold text-sm mb-3" style={{ color: "#0A1A2F" }}>{step.step}</p>
                  {step.items.map((item, i) => (
                    <p key={i} className="text-xs mb-1.5" style={{ color: "rgba(10,26,47,0.55)" }}>{item}</p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: WHY THIS INVESTMENT MAKES SENSE ── */}
      <section className="py-20 border-t" style={{ borderColor: "rgba(10,26,47,0.06)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>The ROI Case</p>
            <h2 className="font-bold mb-4" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#0A1A2F" }}>
              Why this investment makes sense.
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(10,26,47,0.5)" }}>
              Compare the cost of Career Transition Intelligence against the alternatives.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {ALTERNATIVES.map((alt, i) => (
              <div key={i} className="rounded-xl p-5 border" style={{ background: "#FFFFFF", borderColor: "rgba(10,26,47,0.08)" }}>
                <p className="font-semibold text-sm mb-2" style={{ color: "#0A1A2F" }}>{alt.name}</p>
                <p className="font-bold text-lg mb-1" style={{ color: "#ef4444" }}>{alt.cost}</p>
                <p className="text-xs mb-2" style={{ color: "rgba(10,26,47,0.4)" }}>{alt.duration}</p>
                <p className="text-xs" style={{ color: "rgba(10,26,47,0.45)" }}>{alt.note}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-8 text-center" style={{ background: "#0A1A2F" }}>
            <p className="text-sm mb-2" style={{ color: "rgba(248,245,240,0.5)" }}>Career Transition Intelligence</p>
            <p className="font-bold text-3xl mb-2" style={{ color: "#D4AF37" }}>₹40,000 or ₹80,000</p>
            <p className="text-sm" style={{ color: "rgba(248,245,240,0.6)" }}>One of the highest-ROI investments a professional can make.</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: IMAGINE 90 DAYS FROM NOW ── */}
      <section className="py-20 border-t" style={{ borderColor: "rgba(10,26,47,0.06)", background: "#F4F1EC" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>Future Pacing</p>
          <h2 className="font-bold mb-10" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", color: "#0A1A2F" }}>
            Imagine yourself 90 days from now.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {[
              { icon: "🎯", text: "Walking into interviews with complete confidence — knowing exactly what you'll be asked and how to answer." },
              { icon: "💡", text: "Knowing precisely how to present your value, your story, and your differentiation." },
              { icon: "📱", text: "Having multiple conversations underway — not waiting for one response." },
              { icon: "📈", text: "Receiving stronger opportunities because your positioning is sharper than 95% of candidates." },
              { icon: "🤝", text: "Negotiating with confidence and data — not accepting the first number offered." },
              { icon: "✨", text: "Feeling genuinely excited about your career again — not anxious or stuck." },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-5 border" style={{ background: "#FFFFFF", borderColor: "rgba(10,26,47,0.07)" }}>
                <div className="text-2xl mb-3">{item.icon}</div>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(10,26,47,0.65)" }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: TESTIMONIALS ── */}
      <section className="py-20 border-t" style={{ borderColor: "rgba(10,26,47,0.06)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>Success Stories</p>
            <h2 className="font-bold" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#0A1A2F" }}>Real outcomes from real professionals.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl p-7 border" style={{ background: "#FFFFFF", borderColor: "rgba(10,26,47,0.08)" }}>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5" style={{ background: "rgba(212,175,55,0.1)", color: "#B8960C" }}>
                  <Award size={11} /> {t.outcome}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(10,26,47,0.65)", fontStyle: "italic" }}>"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#0A1A2F" }}>{t.name}</p>
                  <p className="text-xs" style={{ color: "rgba(10,26,47,0.45)" }}>{t.role}, {t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: FAQ ── */}
      <section id="faq" className="py-20 border-t" style={{ borderColor: "rgba(10,26,47,0.06)", background: "#F4F1EC" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>Frequently Asked Questions</p>
            <h2 className="font-bold" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#0A1A2F" }}>Questions worth asking.</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "rgba(10,26,47,0.08)" }}>
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-sm pr-4" style={{ color: "#0A1A2F" }}>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={16} style={{ color: "rgba(10,26,47,0.4)", flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: "rgba(10,26,47,0.4)", flexShrink: 0 }} />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(10,26,47,0.6)" }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 9: EMPLOYER SPONSORSHIP ── */}
      <section className="py-20 border-t" style={{ borderColor: "rgba(10,26,47,0.06)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>Employer Sponsorship</p>
              <h2 className="font-bold mb-4" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", color: "#0A1A2F" }}>
                Your employer may already fund this.
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(10,26,47,0.55)" }}>
                Many organisations sponsor Career Transition Intelligence through their professional development, leadership, or learning budgets. Some use it as part of outplacement support or career transition programmes.
              </p>
              <div className="space-y-2 mb-6">
                {["Professional Development Budget", "Leadership Development Budget", "Learning & Development Budget", "Outplacement Support", "Career Transition Programmes"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check size={13} style={{ color: "#D4AF37" }} />
                    <span className="text-sm" style={{ color: "rgba(10,26,47,0.65)" }}>{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setOutplacementModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border transition-all"
                style={{ borderColor: "#0A1A2F", color: "#0A1A2F", background: "transparent" }}
              >
                Request Sponsorship Letter <ArrowRight size={14} />
              </button>
            </div>
            <div className="rounded-2xl p-8 border" style={{ background: "#F4F1EC", borderColor: "rgba(10,26,47,0.08)" }}>
              <p className="font-semibold text-sm mb-4" style={{ color: "#0A1A2F" }}>What to say to your manager</p>
              <div className="rounded-xl p-5 border text-sm leading-relaxed" style={{ background: "#FFFFFF", borderColor: "rgba(10,26,47,0.07)", color: "rgba(10,26,47,0.6)", fontStyle: "italic" }}>
                "I've identified a 90-day programme that combines AI-powered career diagnostics, coaching, and deliberate practice. It aligns directly with my professional development goals and would strengthen my leadership capability and positioning. I'd like to request that this be funded through our L&D budget."
              </div>
              <p className="text-xs mt-4" style={{ color: "rgba(10,26,47,0.4)" }}>We provide a formal sponsorship request letter on enrolment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 10: ROI CALCULATOR ── */}
      <section className="py-20 border-t" style={{ borderColor: "rgba(10,26,47,0.06)", background: "#F4F1EC" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>Investment Calculator</p>
            <h2 className="font-bold mb-3" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#0A1A2F" }}>
              What is your transition worth?
            </h2>
            <p className="text-sm" style={{ color: "rgba(10,26,47,0.5)" }}>Adjust the sliders to estimate the value of a successful transition.</p>
          </div>
          <div className="rounded-2xl p-8 border" style={{ background: "#FFFFFF", borderColor: "rgba(10,26,47,0.08)" }}>
            <div className="space-y-6 mb-8">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: "#0A1A2F" }}>Current Annual Salary</label>
                  <span className="text-sm font-bold" style={{ color: "#0A1A2F" }}>₹{(salary / 100000).toFixed(0)}L</span>
                </div>
                <input type="range" min={500000} max={10000000} step={100000} value={salary}
                  onChange={e => setSalary(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#0A1A2F" }}
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: "rgba(10,26,47,0.35)" }}><span>₹5L</span><span>₹1Cr</span></div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: "#0A1A2F" }}>Target Annual Salary</label>
                  <span className="text-sm font-bold" style={{ color: "#0A1A2F" }}>₹{(targetSalary / 100000).toFixed(0)}L</span>
                </div>
                <input type="range" min={salary} max={15000000} step={100000} value={targetSalary}
                  onChange={e => setTargetSalary(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#D4AF37" }}
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: "rgba(10,26,47,0.35)" }}><span>Current</span><span>₹1.5Cr</span></div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: "#0A1A2F" }}>Months Saved in Transition</label>
                  <span className="text-sm font-bold" style={{ color: "#0A1A2F" }}>{monthsSaved} months</span>
                </div>
                <input type="range" min={1} max={12} step={1} value={monthsSaved}
                  onChange={e => setMonthsSaved(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#0A1A2F" }}
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: "rgba(10,26,47,0.35)" }}><span>1 month</span><span>12 months</span></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-6 border-t" style={{ borderColor: "rgba(10,26,47,0.08)" }}>
              <div className="text-center">
                <p className="text-xs mb-1" style={{ color: "rgba(10,26,47,0.45)" }}>Salary Increase</p>
                <p className="font-bold text-lg" style={{ color: "#0A1A2F" }}>₹{((targetSalary - salary) / 100000).toFixed(0)}L</p>
              </div>
              <div className="text-center">
                <p className="text-xs mb-1" style={{ color: "rgba(10,26,47,0.45)" }}>Time Recovered</p>
                <p className="font-bold text-lg" style={{ color: "#0A1A2F" }}>₹{((monthsSaved * salary / 12) / 100000).toFixed(0)}L</p>
              </div>
              <div className="text-center">
                <p className="text-xs mb-1" style={{ color: "rgba(10,26,47,0.45)" }}>Total Value Created</p>
                <p className="font-bold text-lg" style={{ color: "#D4AF37" }}>₹{(roi / 100000).toFixed(0)}L</p>
              </div>
            </div>
            <div className="mt-5 rounded-xl p-4 text-center" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
              <p className="text-xs mb-1" style={{ color: "rgba(10,26,47,0.5)" }}>Your estimated ROI on the Executive plan</p>
              <p className="font-bold text-2xl" style={{ color: "#0A1A2F" }}>{roiMultiple}× return</p>
              <p className="text-xs mt-1" style={{ color: "rgba(10,26,47,0.4)" }}>Based on ₹80,000 investment</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 11: RISK REVERSAL ── */}
      <section className="py-20 border-t" style={{ borderColor: "rgba(10,26,47,0.06)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>Our Commitment</p>
            <h2 className="font-bold mb-4" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#0A1A2F" }}>
              We stand behind this investment.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🔍", title: "Free Discovery Session", desc: "Start with a complimentary 30-minute discovery conversation before you commit." },
              { icon: "🗓️", title: "7-Day Platform Exploration", desc: "Explore the full platform for 7 days. If it's not right for you, we'll discuss your options." },
              { icon: "⏸️", title: "Pause Option", desc: "Life happens. You can pause your programme for up to 30 days if circumstances change." },
              { icon: "🏢", title: "Transfer to Employer Licence", desc: "If your employer decides to sponsor, we'll transfer your individual licence seamlessly." },
              { icon: "⬆️", title: "Upgrade Path", desc: "Start with Essentials and upgrade to Executive at any point. We'll credit what you've paid." },
              { icon: "🤝", title: "Satisfaction Commitment", desc: "If you complete the programme and don't feel the value, we'll work with you to make it right." },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-5 border" style={{ background: "#FFFFFF", borderColor: "rgba(10,26,47,0.08)" }}>
                <div className="text-2xl mb-3">{item.icon}</div>
                <p className="font-semibold text-sm mb-2" style={{ color: "#0A1A2F" }}>{item.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(10,26,47,0.55)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 12: FINAL CTA ── */}
      <section className="py-24 border-t" style={{ borderColor: "rgba(10,26,47,0.06)", background: "#0A1A2F" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "#D4AF37" }}>Begin</p>
          <h2 className="font-bold mb-5" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "#F8F5F0", lineHeight: 1.15 }}>
            The next opportunity in your career begins with one decision.
          </h2>
          <p className="text-base mb-10 mx-auto max-w-xl" style={{ color: "rgba(248,245,240,0.55)", lineHeight: 1.7 }}>
            Invest 90 days in yourself today and shape the next decade of your career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => isAuthenticated ? navigate("/career") : window.location.href = getLoginUrl()}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-base transition-all"
              style={{ background: "#D4AF37", color: "#0A1A2F" }}
            >
              Start Your Career Transition <ArrowRight size={18} />
            </button>
            <button
              onClick={() => setOutplacementModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-base border transition-all"
              style={{ borderColor: "rgba(248,245,240,0.25)", color: "#F8F5F0", background: "transparent" }}
            >
              Book a Discovery Conversation
            </button>
          </div>
          <p className="text-xs mt-6" style={{ color: "rgba(248,245,240,0.3)" }}>
            Free to start · First diagnostic in 10 minutes · No credit card required
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 border-t" style={{ borderColor: "rgba(10,26,47,0.08)", background: "#FAFAF8" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="LevelNext" className="h-6 object-contain" />
            <span className="text-xs" style={{ color: "rgba(10,26,47,0.4)" }}>Career Transition Intelligence</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/career-intelligence" className="text-xs" style={{ color: "rgba(10,26,47,0.4)" }}>Platform</a>
            <a href="/" className="text-xs" style={{ color: "rgba(10,26,47,0.4)" }}>LevelNext</a>
            <button onClick={() => setOutplacementModalOpen(true)} className="text-xs" style={{ color: "rgba(10,26,47,0.4)" }}>Contact</button>
          </div>
        </div>
      </footer>

      {/* ── STICKY MOBILE CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden p-4 border-t" style={{ background: "rgba(250,250,248,0.97)", backdropFilter: "blur(12px)", borderColor: "rgba(10,26,47,0.1)" }}>
        <button
          onClick={() => isAuthenticated ? navigate("/career") : window.location.href = getLoginUrl()}
          className="w-full py-3.5 rounded-full font-semibold text-sm"
          style={{ background: "#D4AF37", color: "#0A1A2F" }}
        >
          Start My Transition
        </button>
      </div>

      <OutplacementContactModal open={outplacementModalOpen} onOpenChange={setOutplacementModalOpen} />
    </div>
  );
}
