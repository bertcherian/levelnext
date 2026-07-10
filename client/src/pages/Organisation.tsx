import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import {
  Loader2, Users, TrendingUp, BarChart3, Building2, ArrowRight,
  CheckCircle2, AlertCircle, Target, Lightbulb, FileText,
  Palette, ChevronRight, Zap, Globe, BookOpen,
} from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  ECI: "Executive Communication",
  LII: "Leadership Influence",
  GCC: "GCC Readiness",
  TII: "Time Intelligence",
  LDI: "Leadership Depth",
  STI: "Strategic Thinking",
};

// ── Wizard step labels ──────────────────────────────────────────────────────
const WIZARD_STEPS = [
  "Welcome & Route",
  "Company Profile",
  "Mission, Vision & Values",
  "Leadership Framework",
  "Document Upload",
  "Branding & Terminology",
  "Team Setup",
  "Launch",
];

// ── Resume wizard banner ────────────────────────────────────────────────────
function ResumeWizardBanner({ wizardStep, orgName }: { wizardStep: number; orgName: string }) {
  const [, navigate] = useLocation();
  const stepLabel = WIZARD_STEPS[(wizardStep ?? 1) - 1] ?? "Setup";
  const progress = Math.round(((wizardStep - 1) / 8) * 100);

  return (
    <div
      className="rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{
        background: "linear-gradient(135deg, var(--color-ln-navy) 0%, oklch(25% 0.08 248.6) 100%)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.15)" }}>
          <Building2 size={20} style={{ color: "var(--color-ln-yellow)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-white truncate">{orgName} — Setup in progress</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.2)", color: "var(--color-ln-yellow)" }}>
              Step {wizardStep} of 8
            </span>
          </div>
          <p className="text-xs mb-2" style={{ color: "oklch(70% 0.02 248.6)" }}>
            Continue from: <span className="text-white font-medium">{stepLabel}</span>
          </p>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(35% 0.04 248.6)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: "var(--color-ln-yellow)" }}
            />
          </div>
        </div>
      </div>
      <button
        onClick={() => navigate("/enterprise-onboarding")}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
        style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
      >
        Continue Setup <ArrowRight size={15} />
      </button>
    </div>
  );
}

// ── Company Context Summary Card ────────────────────────────────────────────
function CompanyContextCard({ org }: { org: any }) {
  const [, navigate] = useLocation();
  const values = (org.values ?? []) as any[];
  const competencies = (org.competencies ?? []) as any[];
  const priorities = (org.strategicPriorities ?? []) as any[];
  const branding = org.branding as any;

  const hasContent = values.length > 0 || competencies.length > 0 || priorities.length > 0 || org.missionStatement;

  return (
    <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ background: "white", borderBottom: "1px solid var(--color-ln-border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: org.contextActivated ? "oklch(95% 0.05 150)" : "oklch(97% 0.01 248.6)" }}>
            {org.contextActivated
              ? <CheckCircle2 size={18} style={{ color: "oklch(45% 0.15 150)" }} />
              : <AlertCircle size={18} style={{ color: "var(--color-ln-muted)" }} />
            }
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Company Context Layer</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>
              {org.contextActivated
                ? "Active — Guide and diagnostics are using your company context"
                : "Not yet activated — complete setup to activate"}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/enterprise-onboarding")}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ background: "oklch(97% 0.01 248.6)", color: "var(--color-ln-navy)", border: "1px solid var(--color-ln-border)" }}
        >
          Edit <ChevronRight size={12} />
        </button>
      </div>

      {!hasContent ? (
        <div className="px-5 py-8 text-center" style={{ background: "white" }}>
          <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
            No company context added yet. Complete the onboarding wizard to add your values, competencies, and strategic priorities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x"
          style={{ background: "white", borderColor: "var(--color-ln-border)" }}>

          {/* Mission / Vision */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target size={15} style={{ color: "var(--color-ln-navy)" }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-ln-navy)" }}>Mission & Vision</p>
            </div>
            {org.missionStatement ? (
              <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "oklch(25% 0 0)" }}>
                {org.missionStatement}
              </p>
            ) : (
              <p className="text-xs italic" style={{ color: "var(--color-ln-muted)" }}>Not added yet</p>
            )}
            {org.visionStatement && (
              <p className="text-xs mt-2 leading-relaxed line-clamp-2" style={{ color: "var(--color-ln-muted)" }}>
                <span className="font-medium">Vision:</span> {org.visionStatement}
              </p>
            )}
          </div>

          {/* Values */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={15} style={{ color: "var(--color-ln-navy)" }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-ln-navy)" }}>
                Values <span className="font-normal normal-case" style={{ color: "var(--color-ln-muted)" }}>({values.length})</span>
              </p>
            </div>
            {values.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {values.slice(0, 6).map((v: any, i: number) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "oklch(95% 0.02 248.6)", color: "var(--color-ln-navy)" }}>
                    {v.name}
                  </span>
                ))}
                {values.length > 6 && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "oklch(95% 0.02 248.6)", color: "var(--color-ln-muted)" }}>
                    +{values.length - 6} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs italic" style={{ color: "var(--color-ln-muted)" }}>No values added yet</p>
            )}
          </div>

          {/* Competencies */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={15} style={{ color: "var(--color-ln-navy)" }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-ln-navy)" }}>
                Competencies <span className="font-normal normal-case" style={{ color: "var(--color-ln-muted)" }}>({competencies.length})</span>
              </p>
            </div>
            {competencies.length > 0 ? (
              <div className="space-y-1.5">
                {competencies.slice(0, 4).map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--color-ln-yellow)" }} />
                    <p className="text-xs truncate" style={{ color: "oklch(25% 0 0)" }}>{c.name}</p>
                    {c.level && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: "oklch(95% 0.02 248.6)", color: "var(--color-ln-muted)" }}>
                        {c.level}
                      </span>
                    )}
                  </div>
                ))}
                {competencies.length > 4 && (
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>+{competencies.length - 4} more</p>
                )}
              </div>
            ) : (
              <p className="text-xs italic" style={{ color: "var(--color-ln-muted)" }}>No competencies added yet</p>
            )}
          </div>

          {/* Strategic Priorities */}
          {priorities.length > 0 && (
            <div className="p-5 sm:col-span-2 lg:col-span-1" style={{ borderTop: "1px solid var(--color-ln-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={15} style={{ color: "var(--color-ln-navy)" }} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-ln-navy)" }}>
                  Strategic Priorities <span className="font-normal normal-case" style={{ color: "var(--color-ln-muted)" }}>({priorities.length})</span>
                </p>
              </div>
              <div className="space-y-1.5">
                {priorities.slice(0, 3).map((p: any, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs font-bold flex-shrink-0 mt-0.5" style={{ color: "var(--color-ln-yellow)" }}>{i + 1}.</span>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "oklch(25% 0 0)" }}>{p.title ?? p.name}</p>
                  </div>
                ))}
                {priorities.length > 3 && (
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>+{priorities.length - 3} more</p>
                )}
              </div>
            </div>
          )}

          {/* Branding */}
          {branding && (branding.primaryColor || branding.customTerminology) && (
            <div className="p-5" style={{ borderTop: "1px solid var(--color-ln-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Palette size={15} style={{ color: "var(--color-ln-navy)" }} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-ln-navy)" }}>Branding</p>
              </div>
              <div className="flex items-center gap-3">
                {branding.primaryColor && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md border" style={{ background: branding.primaryColor, borderColor: "var(--color-ln-border)" }} />
                    <span className="text-xs font-mono" style={{ color: "var(--color-ln-muted)" }}>{branding.primaryColor}</span>
                  </div>
                )}
                {branding.customTerminology?.leader && (
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "oklch(95% 0.02 248.6)", color: "var(--color-ln-navy)" }}>
                    "{branding.customTerminology.leader}"
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Company info */}
          {(org.website || org.industry) && (
            <div className="p-5" style={{ borderTop: "1px solid var(--color-ln-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={15} style={{ color: "var(--color-ln-navy)" }} />
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-ln-navy)" }}>Company</p>
              </div>
              <div className="space-y-1">
                {org.industry && (
                  <p className="text-xs" style={{ color: "oklch(25% 0 0)" }}>{org.industry}</p>
                )}
                {org.companySize && (
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{org.companySize} employees</p>
                )}
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 hover:underline"
                    style={{ color: "var(--color-ln-navy)" }}>
                    <Globe size={10} /> {org.website.replace(/^https?:\/\//, "").slice(0, 30)}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Documents summary ───────────────────────────────────────────────────────
function DocumentsSummary({ orgId }: { orgId: number }) {
  const { data: docs } = trpc.enterpriseOnboarding.getDocuments.useQuery({ organisationId: orgId });
  if (!docs || docs.length === 0) return null;

  const approved = docs.filter((d: any) => d.processingStatus === "approved").length;
  const pending = docs.filter((d: any) => d.processingStatus === "needs_review" || d.processingStatus === "processing").length;

  return (
    <div className="rounded-2xl p-5 mb-6 flex items-center gap-4"
      style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "oklch(95% 0.02 248.6)" }}>
        <FileText size={18} style={{ color: "var(--color-ln-navy)" }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
          {docs.length} Document{docs.length !== 1 ? "s" : ""} Uploaded
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>
          {approved} approved · {pending} pending review
        </p>
      </div>
      {pending > 0 && (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: "oklch(95% 0.1 60)", color: "oklch(45% 0.15 60)" }}>
          {pending} to review
        </span>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Organisation() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: tenant, isLoading: tenantLoading } = trpc.tenant.myTenant.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const { data: tenantReports } = trpc.report.tenantReports.useQuery(undefined, {
    enabled: isAuthenticated && (tenant?.role === "owner" || tenant?.role === "admin"),
    retry: false,
  });
  const { data: org, isLoading: orgLoading } = trpc.enterpriseOnboarding.getMyOrganisation.useQuery(
    undefined, { enabled: isAuthenticated && (tenant?.role === "owner" || tenant?.role === "admin") }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [loading, isAuthenticated, navigate]);

  const isAdmin = tenant?.role === "owner" || tenant?.role === "admin";
  const wizardInProgress = org && org.wizardStatus === "in_progress";

  // Compute heatmap data
  const moduleStats = Object.keys(MODULE_LABELS).map((mod) => {
    const modReports = tenantReports?.filter((r) => r.moduleType === mod) ?? [];
    const avg = modReports.length > 0
      ? Math.round(modReports.reduce((sum, r) => sum + r.edgeScore, 0) / modReports.length)
      : null;
    return { mod, count: modReports.length, avg };
  }).filter(m => m.count > 0 || ["ECI", "LII", "GCC"].includes(m.mod));

  return (
    <PlatformLayout title="Organisation">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 animate-fade-in">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Organisation</h1>
          {tenant && (
            <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>
              {tenant.tenant.name}
            </p>
          )}
        </div>

        {tenantLoading || orgLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-ln-muted)" }} />
          </div>
        ) : !isAdmin ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
            <p className="text-lg font-semibold mb-2" style={{ color: "var(--color-ln-navy)" }}>Admin access required</p>
            <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>Organisation insights are available to owners and admins.</p>
          </div>
        ) : (
          <>
            {/* ── Resume wizard banner (shown when setup is in progress) ── */}
            {wizardInProgress && (
              <ResumeWizardBanner
                wizardStep={org.wizardStep ?? 1}
                orgName={org.displayName ?? org.legalName}
              />
            )}

            {/* ── Company Context Summary Card ── */}
            {org && <CompanyContextCard org={org} />}

            {/* ── Documents summary ── */}
            {org && <DocumentsSummary orgId={org.id} />}

            {/* ── Team stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6">
              <div className="rounded-2xl p-5" style={{ background: "var(--color-ln-navy)", boxShadow: "var(--shadow-card)" }}>
                <Users size={20} style={{ color: "var(--color-ln-yellow)" }} className="mb-3" />
                <p className="text-3xl font-bold text-white">{tenantReports?.length ?? 0}</p>
                <p className="text-sm mt-1" style={{ color: "oklch(65% 0.02 248.6)" }}>Total Diagnostics Completed</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
                <TrendingUp size={20} style={{ color: "var(--color-ln-navy)" }} className="mb-3" />
                <p className="text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                  {tenantReports && tenantReports.length > 0
                    ? Math.round(tenantReports.reduce((s, r) => s + r.edgeScore, 0) / tenantReports.length)
                    : "—"}
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--color-ln-muted)" }}>Average Team Edge</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
                <BarChart3 size={20} style={{ color: "var(--color-ln-navy)" }} className="mb-3" />
                <p className="text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                  {moduleStats.filter((m) => m.count > 0).length}/{moduleStats.length}
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--color-ln-muted)" }}>Modules Active</p>
              </div>
            </div>

            {/* ── Team Edge Heatmap ── */}
            <div className="rounded-2xl p-5 mb-6" style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
              <h2 className="font-semibold mb-5" style={{ color: "var(--color-ln-navy)" }}>Team Edge Heatmap</h2>
              <div className="space-y-4">
                {moduleStats.map(({ mod, count, avg }) => (
                  <div key={mod}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>{MODULE_LABELS[mod]}</span>
                      <span className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
                        {avg !== null ? `${avg}/100` : "No data"} · {count} completed
                      </span>
                    </div>
                    <div className="relative h-2.5 rounded-full" style={{ background: "var(--color-ln-border)" }}>
                      {avg !== null && (
                        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                          style={{
                            width: `${avg}%`,
                            background: avg >= 75 ? "#16a34a" : avg >= 55 ? "var(--color-ln-yellow)" : avg >= 40 ? "#d97706" : "#dc2626",
                          }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Recent reports ── */}
            {tenantReports && tenantReports.length > 0 && (
              <div>
                <h2 className="font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>Recent Diagnostic Activity</h2>
                <div className="space-y-3">
                  {tenantReports.slice(0, 10).map((r) => (
                    <div key={r.id} className="rounded-xl p-4 flex items-center justify-between"
                      style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                          {MODULE_LABELS[r.moduleType] ?? r.moduleType}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>
                          {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {r.archetype && ` · ${r.archetype}`}
                        </p>
                      </div>
                      <span className="text-lg font-bold" style={{ color: "var(--color-ln-navy)" }}>{Math.round(r.edgeScore)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── No org yet — prompt to start wizard ── */}
            {!org && !orgLoading && (
              <div className="rounded-2xl p-8 text-center" style={{ background: "white", border: "1.5px dashed var(--color-ln-border)" }}>
                <Building2 size={32} className="mx-auto mb-3" style={{ color: "var(--color-ln-muted)" }} />
                <p className="font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>No company context set up yet</p>
                <p className="text-sm mb-4" style={{ color: "var(--color-ln-muted)" }}>
                  Add your company's values, competencies, and strategic priorities to personalise LevelNext for your team.
                </p>
                <button
                  onClick={() => navigate("/enterprise-onboarding")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "var(--color-ln-navy)", color: "white" }}
                >
                  Set Up Company Context <ArrowRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PlatformLayout>
  );
}
