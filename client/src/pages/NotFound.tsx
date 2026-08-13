import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowRight, BriefcaseBusiness, Home, Rocket, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

const helpfulLinks = [
  { href: "/launch", label: "Launch Intelligence", description: "Build career momentum", icon: Rocket },
  { href: "/career-landing", label: "Career Transition", description: "Plan your next chapter", icon: BriefcaseBusiness },
  { href: "/manager-effectiveness", label: "Manager Effectiveness", description: "Lead through others", icon: UsersRound },
];

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-lg mx-4 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-red-500" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>

          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            Page Not Found
          </h2>

          <p className="text-slate-600 mb-8 leading-relaxed">
            Sorry, the page you are looking for doesn't exist.
            <br />
            It may have been moved or deleted.
          </p>

          <div id="not-found-button-group" className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoHome}
              className="bg-[var(--color-ln-navy)] hover:bg-[color-mix(in_oklab,var(--color-ln-navy),black_15%)] text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Homepage
            </Button>
          </div>

          <nav aria-label="Helpful navigation" className="mt-8 border-t border-slate-200 pt-6 text-left">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Or explore a platform</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {helpfulLinks.map(({ href, label, description, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  className="group rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-[var(--color-ln-yellow)] hover:bg-[var(--color-ln-ivory)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ln-yellow)] focus-visible:ring-offset-2"
                >
                  <Icon className="h-4 w-4 text-[var(--color-ln-navy)]" aria-hidden="true" />
                  <span className="mt-2 block text-sm font-semibold text-[var(--color-ln-navy)]">{label}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-slate-600">{description}<ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
                </a>
              ))}
            </div>
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
