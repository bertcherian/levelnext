import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_88851f5c.png";

export default function JoinPage() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Extract token from URL query string
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";

  const [accepted, setAccepted] = useState(false);

  // Validate the token
  const { data: invite, isLoading: validating, error } = trpc.platformInvites.validateToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  // Mark invite as accepted once user is logged in
  const markAccepted = trpc.platformInvites.markAccepted.useMutation({
    onSuccess: () => {
      setAccepted(true);
      setTimeout(() => setLocation("/dashboard"), 1500);
    },
  });

  // Once user is logged in and invite is valid, mark it accepted and redirect
  useEffect(() => {
    if (user && invite && !accepted && !markAccepted.isPending) {
      markAccepted.mutate({ token });
    }
  }, [user, invite, accepted]);

  // If already logged in and invite valid — redirect immediately
  useEffect(() => {
    if (user && accepted) {
      setLocation("/dashboard");
    }
  }, [user, accepted]);

  const loginUrl = `${import.meta.env.VITE_OAUTH_PORTAL_URL ?? ""}/oauth/authorize?app_id=${import.meta.env.VITE_APP_ID ?? ""}&redirect_uri=${encodeURIComponent(window.location.origin + "/api/oauth/callback")}&state=${encodeURIComponent("/join?token=" + token)}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--color-ln-navy)" }}>

      {/* Logo */}
      <img src={LOGO_URL} alt="LevelNext" className="w-40 mb-8 object-contain" />

      <div className="w-full max-w-md rounded-2xl border p-8 text-center"
        style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }}>

        {/* Loading state */}
        {(validating || authLoading) && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Spinner className="text-[var(--color-ln-yellow)]" />
            <p className="text-white/80 text-sm">Validating your invite…</p>
          </div>
        )}

        {/* Invalid / expired token */}
        {!validating && !authLoading && (!token || error) && (
          <div className="py-4">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Invalid Invite Link</h2>
            <p className="text-white/60 text-sm mb-6">
              This invite link is invalid, expired, or has already been used.
              Please contact your LevelNext administrator for a new invite.
            </p>
            <Button
              onClick={() => setLocation("/")}
              style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
              className="font-semibold"
            >
              Back to Home
            </Button>
          </div>
        )}

        {/* Valid invite — not logged in yet */}
        {!validating && !authLoading && invite && !user && (
          <div className="py-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--color-ln-yellow)" }}>
              <span className="text-2xl">🎯</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              You're invited to LevelNext
            </h2>
            <p className="text-white/70 text-sm mb-1">
              Hi <strong className="text-white">{invite.name}</strong>,
            </p>
            <p className="text-white/60 text-sm mb-6">
              You've been granted access to the LevelNext Leadership Intelligence Platform.
              Sign in with your Manus account to get started.
            </p>
            <a href={loginUrl}>
              <Button
                className="w-full font-semibold text-base py-3"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
              >
                Sign In & Access Platform →
              </Button>
            </a>
            <p className="text-white/40 text-xs mt-4">
              This invite link expires in 7 days. One-time use only.
            </p>
          </div>
        )}

        {/* Logged in — marking accepted and redirecting */}
        {!validating && !authLoading && invite && user && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
              style={{ background: "var(--color-ln-yellow)" }}>
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-white">Welcome to LevelNext!</h2>
            <p className="text-white/70 text-sm">Taking you to your dashboard…</p>
            <Spinner className="text-[var(--color-ln-yellow)]" />
          </div>
        )}
      </div>
    </div>
  );
}
