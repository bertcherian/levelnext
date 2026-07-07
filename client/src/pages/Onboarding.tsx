import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Users } from "lucide-react";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [orgName, setOrgName] = useState("");
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-ln-navy)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="mb-6 flex flex-col items-center leading-tight">
            <span className="text-3xl font-bold tracking-tight text-white">LevelNext</span>
            <span className="text-sm font-medium tracking-wide mt-0.5" style={{ color: "var(--color-ln-yellow)" }}>The Leadership Intelligence Platform</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-white/60 text-sm">Let's set up your organisation to get started.</p>
        </div>

        {mode === "choose" && (
          <div className="space-y-4 animate-scale-in">
            <button
              onClick={() => setMode("create")}
              className="w-full rounded-xl p-5 text-left transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.1)", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.25)" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--color-ln-yellow)" }}>
                  <Building2 size={20} style={{ color: "var(--color-ln-navy)" }} />
                </div>
                <div>
                  <p className="font-semibold text-white">Create an Organisation</p>
                  <p className="text-sm text-white/60 mt-0.5">Set up LevelNext for your team or company</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("join")}
              className="w-full rounded-xl p-5 text-left transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: "oklch(100% 0 0 / 0.05)", border: "1px solid oklch(100% 0 0 / 0.15)" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(100% 0 0 / 0.1)" }}>
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Join an Organisation</p>
                  <p className="text-sm text-white/60 mt-0.5">Use an invite code from your organisation admin</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="rounded-2xl p-6 animate-scale-in" style={{ background: "oklch(100% 0 0 / 0.05)", border: "1px solid oklch(100% 0 0 / 0.1)" }}>
            <h2 className="text-lg font-semibold text-white mb-5">Create Organisation</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">Organisation Name</Label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Broadridge India"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-yellow-400"
                />
              </div>
              <Button
                onClick={() => createTenant.mutate({ name: orgName })}
                disabled={!orgName.trim() || createTenant.isPending}
                className="w-full h-11 font-semibold"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
              >
                {createTenant.isPending ? "Creating…" : "Create Organisation"}
              </Button>
              <button onClick={() => setMode("choose")} className="w-full text-sm text-white/40 hover:text-white/70 transition-colors">
                ← Back
              </button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="rounded-2xl p-6 animate-scale-in" style={{ background: "oklch(100% 0 0 / 0.05)", border: "1px solid oklch(100% 0 0 / 0.1)" }}>
            <h2 className="text-lg font-semibold text-white mb-5">Join Organisation</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">Invite Code</Label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCD1234EFGH"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-yellow-400 font-mono tracking-widest"
                />
              </div>
              <Button
                onClick={() => joinTenant.mutate({ inviteCode })}
                disabled={!inviteCode.trim() || joinTenant.isPending}
                className="w-full h-11 font-semibold"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
              >
                {joinTenant.isPending ? "Joining…" : "Join Organisation"}
              </Button>
              <button onClick={() => setMode("choose")} className="w-full text-sm text-white/40 hover:text-white/70 transition-colors">
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
