import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { buildWhatsappNumber, DEFAULT_WHATSAPP_COUNTRY_CODE, isValidWhatsappNumber, splitWhatsappNumber, WHATSAPP_COUNTRY_CODES } from "@shared/whatsapp";

export default function Settings() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: tenant } = trpc.tenant.myTenant.useQuery(undefined, { enabled: isAuthenticated });
  const { data: inviteInfo } = trpc.tenant.getInviteCode.useQuery(undefined, {
    enabled: isAuthenticated && (tenant?.role === "owner" || tenant?.role === "admin"),
    retry: false,
  });
  const { data: profile } = trpc.account.getProfile.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const [whatsappCountryCode, setWhatsappCountryCode] = useState(DEFAULT_WHATSAPP_COUNTRY_CODE);
  const [whatsappLocalNumber, setWhatsappLocalNumber] = useState("");

  useEffect(() => {
    if (!profile) return;
    const parsed = splitWhatsappNumber(profile.whatsappNumber);
    setWhatsappCountryCode(parsed.dialCode);
    setWhatsappLocalNumber(parsed.localNumber);
  }, [profile?.whatsappNumber]);

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [loading, isAuthenticated, navigate]);

  const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => { logout(); navigate("/"); } });
  const whatsappNumber = buildWhatsappNumber(whatsappCountryCode, whatsappLocalNumber);
  const updateWhatsapp = trpc.account.updateWhatsapp.useMutation({
    onSuccess: async (result) => {
      await utils.account.getProfile.invalidate();
      await utils.auth.me.invalidate();
      toast.success(result.whatsappNumber ? "WhatsApp number saved" : "WhatsApp number removed");
    },
    onError: (error) => toast.error(error.message),
  });

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
              <div className="border-t pt-4" style={{ borderColor: "var(--color-ln-border)" }}>
                <div className="mb-2">
                  <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>WhatsApp contact</p>
                  <p className="text-sm mt-1" style={{ color: "#000" }}>
                    Your Success Partner can use this for agreed LevelNext follow-up. You can remove it at any time.
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    aria-label="WhatsApp country code"
                    value={whatsappCountryCode}
                    onChange={(e) => setWhatsappCountryCode(e.target.value)}
                    className="h-11 w-[145px] rounded-md border bg-white px-2 text-sm"
                    style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}
                  >
                    {WHATSAPP_COUNTRY_CODES.map((country) => (
                      <option key={`${country.code}-${country.dialCode}`} value={country.dialCode}>
                        {country.name} ({country.dialCode})
                      </option>
                    ))}
                  </select>
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    value={whatsappLocalNumber}
                    onChange={(e) => setWhatsappLocalNumber(e.target.value)}
                    className="h-11 flex-1 text-base"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <Button
                    size="sm"
                    onClick={() => updateWhatsapp.mutate({ whatsappNumber: whatsappNumber || null })}
                    disabled={updateWhatsapp.isPending || (!!whatsappLocalNumber && !isValidWhatsappNumber(whatsappNumber))}
                  >
                    {updateWhatsapp.isPending ? "Saving…" : "Save WhatsApp number"}
                  </Button>
                  {profile?.whatsappNumber && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setWhatsappLocalNumber(""); updateWhatsapp.mutate({ whatsappNumber: null }); }}
                      disabled={updateWhatsapp.isPending}
                    >
                      Remove number
                    </Button>
                  )}
                </div>
                {!!whatsappLocalNumber && !isValidWhatsappNumber(whatsappNumber) && (
                  <p className="mt-2 text-sm text-red-700">Enter a complete WhatsApp number with at least 10 digits.</p>
                )}
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
