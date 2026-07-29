/**
 * /login — Magic Link Email Authentication Page
 *
 * Three states:
 * 1. "enter_email"  — user types their email and submits
 * 2. "check_inbox"  — email sent, waiting for user to click the link
 * 3. "verifying"    — auto-triggered when ?token= is in the URL (handled by server redirect)
 *
 * If ?invite=TOKEN is in the URL, we pre-fill the email from the invite record
 * and pass the invite token through so it gets auto-accepted on sign-in.
 *
 * If ?error= is in the URL (from a failed verify redirect), we show an error message.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, RefreshCw, Mail } from "lucide-react";

type PageState = "enter_email" | "check_inbox" | "link_error";

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: "The sign-in link is missing. Please request a new one.",
  invalid_or_expired: "This sign-in link has expired or already been used. Please request a new one.",
  user_creation_failed: "We couldn't create your account. Please try again or contact support.",
  server_error: "Something went wrong. Please try again.",
  db_unavailable: "Service temporarily unavailable. Please try again in a moment.",
};

export default function Login() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<PageState>("enter_email");
  const [email, setEmail] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Parse URL params
  const params = new URLSearchParams(window.location.search);
  const inviteParam = params.get("invite");
  const errorParam = params.get("error");
  const returnToParam = params.get("returnTo");

  // Load invite info if invite token is present
  const inviteInfoQuery = trpc.emailAuth.getInviteInfo.useQuery(
    { inviteToken: inviteParam ?? "" },
    { enabled: !!inviteParam }
  );

  useEffect(() => {
    if (inviteParam) setInviteToken(inviteParam);
    if (errorParam) {
      // Link errors get their own dedicated screen
      if (errorParam === "invalid_or_expired" || errorParam === "missing_token") {
        setState("link_error");
      }
      setErrorMsg(ERROR_MESSAGES[errorParam] ?? "Sign-in failed. Please try again.");
    }
  }, [inviteParam, errorParam]);

  useEffect(() => {
    if (inviteInfoQuery.data?.valid) {
      setEmail(inviteInfoQuery.data.email ?? "");
      setInviteName(inviteInfoQuery.data.name ?? null);
    }
  }, [inviteInfoQuery.data]);

  const requestMagicLink = trpc.emailAuth.requestMagicLink.useMutation({
    onSuccess: (data) => {
      setState("check_inbox");
      // Dev mode: show the token link for testing without SMTP
      if (data && "devToken" in data && data.devToken) {
        setDevToken(data.devToken as string);
      }
      // Clear URL params so the error state doesn't re-trigger on refresh
      window.history.replaceState({}, "", window.location.pathname);
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to send sign-in link. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorMsg(null);
    requestMagicLink.mutate({
      email: email.trim().toLowerCase(),
      origin: window.location.origin,
      inviteToken: inviteToken ?? undefined,
      returnTo: returnToParam ?? undefined,
    });
  };

  const handleResend = () => {
    setState("enter_email");
    setErrorMsg(null);
    setDevToken(null);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#12345A" }}>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Centered logo above the form */}
          <div className="flex flex-col items-center mb-8">
            <img
              src="/manus-storage/LevelNext_logo_transparent_5345898b.png"
              alt="LevelNext"
              className="h-20 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          {state === "enter_email" && (
            <div
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
              style={{ borderColor: "#e8e6e0" }}
            >
              {/* Welcome message */}
              {inviteInfoQuery.data?.valid && inviteName ? (
                <div className="mb-6">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                    style={{ background: "#FEF3C7", color: "#92400E" }}
                  >
                    ✉ Personal Invitation
                  </div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: "#12345A" }}>
                    Welcome, {inviteName.split(" ")[0]}
                  </h1>
                  <p className="text-sm" style={{ color: "#555" }}>
                    You've been invited to LevelNext. Sign in with your email to get started.
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <h1 className="text-2xl font-bold mb-2" style={{ color: "#12345A" }}>
                    Sign in to LevelNext
                  </h1>
                  <p className="text-sm" style={{ color: "#555" }}>
                    Enter your email and we'll send you a sign-in link — no password needed.
                  </p>
                </div>
              )}

              {/* Error message */}
              {errorMsg && (
                <div
                  className="mb-4 px-4 py-3 rounded-lg text-sm"
                  style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
                >
                  {errorMsg}
                </div>
              )}

              {/* Email form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#12345A" }}
                  >
                    Email address
                  </label>
                  <Input
                    id="email"
                    ref={emailInputRef}
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="h-12 text-base"
                    style={{ borderColor: "#d1cfc9" }}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold rounded-full"
                  style={{ background: "#F2B705", color: "#12345A" }}
                  disabled={requestMagicLink.isPending || !email.trim()}
                >
                  {requestMagicLink.isPending ? "Sending…" : "Send Sign-In Link →"}
                </Button>
              </form>


              <p className="text-xs text-center mt-4" style={{ color: "#aaa" }}>
                By signing in, you agree to our{" "}
                <a href="/privacy" className="underline" style={{ color: "#888" }}>
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          )}

          {state === "link_error" && (
            <div
              className="bg-white rounded-2xl p-8 shadow-sm border text-center"
              style={{ borderColor: "#e8e6e0" }}
            >
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "#FEF2F2" }}
              >
                <AlertTriangle size={28} style={{ color: "#DC2626" }} />
              </div>

              <h1 className="text-2xl font-bold mb-3" style={{ color: "#12345A" }}>
                {errorParam === "invalid_or_expired" ? "Link expired" : "Invalid link"}
              </h1>
              <p className="text-sm mb-6" style={{ color: "#555" }}>
                {errorParam === "invalid_or_expired"
                  ? "This sign-in link has expired or has already been used. Magic links are valid for 15 minutes and can only be clicked once."
                  : "This sign-in link is not valid. Please request a new one below."
                }
              </p>

              {/* Resend form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!email.trim()) return;
                  setErrorMsg(null);
                  requestMagicLink.mutate({
                    email: email.trim().toLowerCase(),
                    origin: window.location.origin,
                    inviteToken: inviteToken ?? undefined,
                    returnTo: returnToParam ?? undefined,
                  });
                }}
                className="space-y-3 mb-4"
              >
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#999" }} />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="h-12 text-base pl-10"
                    style={{ borderColor: "#d1cfc9" }}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold rounded-full gap-2"
                  style={{ background: "#F2B705", color: "#12345A" }}
                  disabled={requestMagicLink.isPending || !email.trim()}
                >
                  <RefreshCw size={16} />
                  {requestMagicLink.isPending ? "Sending new link…" : "Send New Sign-In Link"}
                </Button>
              </form>

              <p className="text-xs" style={{ color: "#aaa" }}>
                Enter your email above and we'll send you a fresh link.
              </p>
            </div>
          )}

          {state === "check_inbox" && (
            <div
              className="bg-white rounded-2xl p-8 shadow-sm border text-center"
              style={{ borderColor: "#e8e6e0" }}
            >
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"
                style={{ background: "#FEF3C7" }}
              >
                ✉
              </div>

              <h1 className="text-2xl font-bold mb-3" style={{ color: "#12345A" }}>
                Check your inbox
              </h1>
              <p className="text-sm mb-2" style={{ color: "#333" }}>
                We've sent a sign-in link to
              </p>
              <p className="font-semibold text-base mb-6" style={{ color: "#12345A" }}>
                {email}
              </p>
              <p className="text-sm mb-8" style={{ color: "#333" }}>
                Click the link in the email to sign in. The link expires in 15 minutes.
              </p>

              {/* Dev mode: show clickable link */}
              {devToken && (
                <div
                  className="mb-6 p-4 rounded-lg text-left"
                  style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                >
                  <p className="text-xs font-semibold mb-2" style={{ color: "#166534" }}>
                    DEV MODE — SMTP not configured. Use this link to sign in:
                  </p>
                  <a
                    href={`/api/auth/magic-link/verify?token=${devToken}`}
                    className="text-xs break-all underline"
                    style={{ color: "#15803D" }}
                  >
                    /api/auth/magic-link/verify?token={devToken}
                  </a>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-full"
                  style={{ borderColor: "#d1cfc9", color: "#12345A" }}
                  onClick={handleResend}
                >
                  Use a different email
                </Button>
                <button
                  className="text-sm underline"
                  style={{ color: "#333" }}
                  onClick={handleResend}
                >
                  Resend sign-in link
                </button>
              </div>

              <p className="text-xs mt-6" style={{ color: "#555" }}>
                Didn't receive it? Check your spam folder or try a different email address.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs" style={{ color: "#bbb" }}>
        LevelNext by Meta Results Pvt. Ltd.
      </div>
    </div>
  );
}
