import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLocation } from "wouter";

const LOGO_URL = "/manus-storage/levelnext-logo_525d7189.png";

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ln-navy)" }}>
        <img src={LOGO_URL} alt="LevelNext" className="h-12 w-auto animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-ln-navy)" }}>
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between">
        <img src={LOGO_URL} alt="LevelNext" className="h-10 w-auto" />
        <a href={getLoginUrl()}>
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent">
            Sign In
          </Button>
        </a>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
            style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.15)", color: "var(--color-ln-yellow)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            The Leadership Intelligence Platform
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Build your<br />
            <span style={{ color: "var(--color-ln-yellow)" }}>Leadership Edge.</span>
          </h1>

          <p className="text-xl text-white/70 mb-12 max-w-xl mx-auto leading-relaxed">
            LevelNext gives you the diagnostics, daily coaching, and intelligence to continuously grow as a leader — all in one platform.
          </p>

          <a href={getLoginUrl()}>
            <Button size="lg" className="h-14 px-10 text-lg font-semibold rounded-xl"
              style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
              Begin Your Journey
            </Button>
          </a>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-24 w-full">
          {[
            { icon: "◎", title: "Three Diagnostics", desc: "Executive Communication, Leadership Influence, and GCC Readiness — all in one platform." },
            { icon: "◈", title: "Your Edge", desc: "A unified leadership intelligence profile that grows richer with every insight you complete." },
            { icon: "◉", title: "Guide", desc: "Your personal AI coach, available daily, grounded in your actual leadership data." },
          ].map((p) => (
            <div key={p.title} className="rounded-2xl p-6 text-left"
              style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.06)", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.15)" }}>
              <div className="text-2xl mb-3" style={{ color: "var(--color-ln-yellow)" }}>{p.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{p.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 text-center">
        <p className="text-sm" style={{ color: "oklch(50% 0.02 248.6)" }}>
          Powered by Meta Results Pvt. Ltd.
        </p>
      </footer>
    </div>
  );
}
