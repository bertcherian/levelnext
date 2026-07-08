import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Settings() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: tenant } = trpc.tenant.myTenant.useQuery(undefined, { enabled: isAuthenticated });
  const { data: inviteInfo } = trpc.tenant.getInviteCode.useQuery(undefined, {
    enabled: isAuthenticated && (tenant?.role === "owner" || tenant?.role === "admin"),
    retry: false,
  });

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [loading, isAuthenticated, navigate]);

  const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => { logout(); navigate("/"); } });

  return (
    <PlatformLayout title="Settings">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Settings</h1>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl p-4 sm:p-6" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
            <h2 className="font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>Your Profile</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--color-ln-muted)" }}>Name</span>
                <span style={{ color: "var(--color-ln-navy)" }}>{user?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--color-ln-muted)" }}>Email</span>
                <span style={{ color: "var(--color-ln-navy)" }}>{user?.email ?? "—"}</span>
              </div>
            </div>
          </div>
          {tenant && (
            <div className="rounded-2xl p-4 sm:p-6" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
              <h2 className="font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>Organisation</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-ln-muted)" }}>Organisation</span>
                  <span style={{ color: "var(--color-ln-navy)" }}>{tenant.tenant.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-ln-muted)" }}>Your Role</span>
                  <span className="capitalize" style={{ color: "var(--color-ln-navy)" }}>{tenant.role}</span>
                </div>
                {inviteInfo && (
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: "var(--color-ln-muted)" }}>Invite Code</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs px-2 py-1 rounded" style={{ background: "var(--color-ln-ivory-dark)", color: "var(--color-ln-navy)" }}>
                        {inviteInfo.inviteCode}
                      </code>
                      <button className="text-xs" style={{ color: "var(--color-ln-yellow)" }}
                        onClick={() => { navigator.clipboard.writeText(inviteInfo.inviteCode); toast.success("Invite code copied"); }}>
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="rounded-2xl p-4 sm:p-6" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
            <h2 className="font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>Account</h2>
            <Button variant="outline" onClick={() => logoutMutation.mutate()} className="text-sm">Sign Out</Button>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
