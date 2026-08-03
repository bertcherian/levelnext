import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Building2, Mic2, Calendar, CheckCircle2, Link2, Unlink, Save } from "lucide-react";
import { toast } from "sonner";

export default function PESettings() {
  const profile = trpc.pei.getProfile.useQuery();
  const upsertProfile = trpc.pei.upsertProfile.useMutation({
    onSuccess: () => toast.success("Settings saved"),
    onError: () => toast.error("Failed to save settings"),
  });
  const calendarIntegrations = trpc.pei.getCalendarIntegrations.useQuery();
  const connectCalendar = trpc.pei.connectCalendar.useMutation({
    onSuccess: () => {
      calendarIntegrations.refetch();
      toast.success("Calendar connected");
    },
    onError: () => toast.error("Failed to connect calendar"),
  });
  const disconnectCalendar = trpc.pei.disconnectCalendar.useMutation({
    onSuccess: () => {
      calendarIntegrations.refetch();
      toast.success("Calendar disconnected");
    },
  });

  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | "">("");
  const [department, setDepartment] = useState("");
  const [voiceProvider, setVoiceProvider] = useState<"openai" | "sarvam">("openai");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (profile.data && !loaded) {
      setCurrentRole(profile.data.currentRole ?? "");
      setTargetRole(profile.data.targetRole ?? "");
      setExperienceYears(profile.data.experienceYears ?? "");
      setDepartment(profile.data.department ?? "");
      setVoiceProvider((profile.data.voiceProvider as "openai" | "sarvam") ?? "openai");
      setLoaded(true);
    }
  }, [profile.data, loaded]);

  const handleSave = () => {
    upsertProfile.mutate({
      currentRole,
      targetRole,
      experienceYears: typeof experienceYears === "number" ? experienceYears : undefined,
      department,
      voiceProvider,
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "oklch(50% 0.02 248.6)" }}>Manage your profile, voice, and calendar integrations.</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} style={{ color: "var(--color-ln-navy)" }} />
          <h3 className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>Professional Profile</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>Current Role</label>
            <input
              type="text"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "oklch(85% 0.02 248.6)", outline: "none" }}
            />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>Target Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "oklch(85% 0.02 248.6)", outline: "none" }}
            />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>Years of Experience</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value ? parseInt(e.target.value) : "")}
              className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "oklch(85% 0.02 248.6)", outline: "none" }}
            />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "oklch(85% 0.02 248.6)", outline: "none" }}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleSave} disabled={upsertProfile.isPending} style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}>
            {upsertProfile.isPending ? "Saving..." : <><Save size={14} className="mr-1" /> Save Profile</>}
          </Button>
        </div>
      </div>

      {/* Voice Settings */}
      <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Mic2 size={18} style={{ color: "var(--color-ln-navy)" }} />
          <h3 className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>Voice Provider</h3>
        </div>
        <div className="space-y-2">
          {[
            { id: "openai" as const, label: "OpenAI TTS", desc: "Natural English voices — ideal for international professionals" },
            { id: "sarvam" as const, label: "Sarvam AI", desc: "Indian language support — Hindi, Tamil, Telugu, and more" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setVoiceProvider(v.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150"
              style={{
                background: voiceProvider === v.id ? "oklch(from var(--color-ln-navy) l c h / 0.08)" : "oklch(96% 0.02 248.6)",
                border: voiceProvider === v.id ? "2px solid var(--color-ln-navy)" : "2px solid transparent",
                color: voiceProvider === v.id ? "var(--color-ln-navy)" : "oklch(40% 0.02 248.6)",
              }}
            >
              <Mic2 size={18} />
              <div>
                <div className="font-semibold">{v.label}</div>
                <div className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>{v.desc}</div>
              </div>
              {voiceProvider === v.id && <CheckCircle2 size={16} className="ml-auto" style={{ color: "#d4af37" }} />}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Button onClick={handleSave} disabled={upsertProfile.isPending} style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}>
            {upsertProfile.isPending ? "Saving..." : <><Save size={14} className="mr-1" /> Save Voice Setting</>}
          </Button>
        </div>
      </div>

      {/* Calendar Integration */}
      <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} style={{ color: "var(--color-ln-navy)" }} />
          <h3 className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>Calendar Integration</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: "oklch(50% 0.02 248.6)" }}>
          Connect your calendar to get AI-powered daily briefings based on your schedule.
        </p>

        <div className="space-y-3">
          {/* Google Calendar */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "oklch(96% 0.02 248.6)" }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: "white" }}>
                <Calendar size={20} style={{ color: "#4285f4" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Google Calendar</p>
                <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>
                  {calendarIntegrations.data?.find((c) => c.provider === "google")
                    ? `Connected · Last sync: ${calendarIntegrations.data.find((c) => c.provider === "google")?.lastSyncAt ? new Date(calendarIntegrations.data.find((c) => c.provider === "google")!.lastSyncAt!).toLocaleDateString() : "Pending"}`
                    : "Not connected"}
                </p>
              </div>
            </div>
            {calendarIntegrations.data?.find((c) => c.provider === "google") ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => disconnectCalendar.mutate({ integrationId: calendarIntegrations.data.find((c) => c.provider === "google")!.id })}
                style={{ borderColor: "#ef4444", color: "#ef4444" }}
              >
                <Unlink size={14} className="mr-1" /> Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => connectCalendar.mutate({ provider: "google", accessToken: "oauth-pending" })}
                disabled={connectCalendar.isPending}
                style={{ background: "#4285f4", color: "white" }}
              >
                <Link2 size={14} className="mr-1" /> Connect
              </Button>
            )}
          </div>

          {/* Outlook Calendar */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "oklch(96% 0.02 248.6)" }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: "white" }}>
                <Calendar size={20} style={{ color: "#0078d4" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Outlook Calendar</p>
                <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>
                  {calendarIntegrations.data?.find((c) => c.provider === "outlook")
                    ? `Connected · Last sync: ${calendarIntegrations.data.find((c) => c.provider === "outlook")?.lastSyncAt ? new Date(calendarIntegrations.data.find((c) => c.provider === "outlook")!.lastSyncAt!).toLocaleDateString() : "Pending"}`
                    : "Not connected"}
                </p>
              </div>
            </div>
            {calendarIntegrations.data?.find((c) => c.provider === "outlook") ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => disconnectCalendar.mutate({ integrationId: calendarIntegrations.data.find((c) => c.provider === "outlook")!.id })}
                style={{ borderColor: "#ef4444", color: "#ef4444" }}
              >
                <Unlink size={14} className="mr-1" /> Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => connectCalendar.mutate({ provider: "outlook", accessToken: "oauth-pending" })}
                disabled={connectCalendar.isPending}
                style={{ background: "#0078d4", color: "white" }}
              >
                <Link2 size={14} className="mr-1" /> Connect
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
