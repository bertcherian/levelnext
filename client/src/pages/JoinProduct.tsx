import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const LOGO_URL = "/logo.png";

// Product metadata for the welcome screen
const PRODUCT_META: Record<string, { name: string; tagline: string; destination: string; color: string }> = {
  career_intelligence: {
    name: "Career Transition Intelligence",
    tagline: "Your personal career strategist — powered by AI.",
    destination: "/career",
    color: "#12345A",
  },
  leadership_intelligence: {
    name: "Leadership Intelligence",
    tagline: "Build your leadership edge with precision diagnostics.",
    destination: "/",
    color: "#12345A",
  },
};

const LS_KEY = "levelnext_join_product";

export default function JoinProduct() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"idle" | "enrolling" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Read ?product= from URL
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("product") ?? "";
  const meta = PRODUCT_META[productId];

  const enrollMutation = trpc.products.selfEnrollAndActivate.useMutation({
    onSuccess: (data) => {
      setStatus("done");
      const dest = PRODUCT_META[data.productId]?.destination ?? "/";
      setTimeout(() => navigate(dest), 1200);
    },
    onError: (err) => {
      setStatus("error");
      setErrorMsg(err.message ?? "Something went wrong. Please try again.");
    },
  });

  // Step 1: Not logged in → save product to localStorage, redirect to login
  useEffect(() => {
    if (authLoading) return;
    if (!productId) return;

    if (!user) {
      // Persist the intended product so we can resume after OAuth
      localStorage.setItem(LS_KEY, productId);
      window.location.href = "/login?returnTo=%2Fhome";
      return;
    }

    // Step 2: Logged in → check if we have a pending product in localStorage
    const pending = localStorage.getItem(LS_KEY);
    if (pending) {
      localStorage.removeItem(LS_KEY);
      setStatus("enrolling");
      enrollMutation.mutate({ productId: pending });
    } else if (status === "idle") {
      // Direct visit while already logged in
      setStatus("enrolling");
      enrollMutation.mutate({ productId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, productId]);

  // Also handle the post-OAuth return: user lands on "/" but localStorage has pending product
  // This is handled by the App-level JoinProductHandler below.

  if (!productId || !meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F5F0]">
        <div className="text-center max-w-sm px-6">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Invalid invite link</h2>
          <p className="text-sm text-gray-500 mb-6">This link doesn't point to a valid LevelNext product. Please check with the person who shared it.</p>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-[#12345A] underline underline-offset-2"
          >
            Go to LevelNext
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F5F0] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={LOGO_URL} alt="LevelNext" className="h-10 object-contain" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          {(status === "idle" || status === "enrolling") && (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: `${meta.color}15` }}
              >
                <Loader2 size={24} className="animate-spin" style={{ color: meta.color }} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Joining {meta.name}
              </h1>
              <p className="text-sm text-gray-500">{meta.tagline}</p>
              <p className="text-xs text-gray-400 mt-4">Setting up your access…</p>
            </>
          )}

          {status === "done" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">You're in!</h1>
              <p className="text-sm text-gray-500">
                Welcome to <strong>{meta.name}</strong>. Taking you there now…
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={28} className="text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-sm text-gray-500 mb-4">{errorMsg}</p>
              <button
                onClick={() => navigate("/")}
                className="text-sm text-[#12345A] underline underline-offset-2"
              >
                Go to LevelNext
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          LevelNext — The Leadership Intelligence Platform
        </p>
      </div>
    </div>
  );
}
