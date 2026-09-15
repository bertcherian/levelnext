import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Landing from "./pages/Landing";
import EngineeringDemo from "./pages/EngineeringDemo";
import TechIntelligenceLanding from "./pages/TechIntelligenceLanding";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import MyEdge from "./pages/MyEdge";
import Guide from "./pages/Guide";
import PracticeCoach from "./pages/PracticeCoach";
import Diagnostics from "./pages/Diagnostics";
import Assessment from "./pages/Assessment";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PWAInstallBanner from "./components/PWAInstallBanner";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import PEAccessGate from "./components/PEAccessGate";
import MEPAccessGate from "./components/MEPAccessGate";
import { lazyWithRouteRecovery } from "./lib/lazyRouteRecovery";
import VersionUpdateBanner from "./components/VersionUpdateBanner";
import ClientErrorTelemetry from "./components/ClientErrorTelemetry";

const LS_KEY = "levelnext_join_product";

// Route-level splitting keeps the leadership core quick while loading reports,
// administration, and adjacent product experiences only when selected.
const Insights = lazy(() => import("./pages/Insights"));
const Progress = lazy(() => import("./pages/Progress"));
const Organisation = lazy(() => import("./pages/Organisation"));
const Settings = lazy(() => import("./pages/Settings"));
const Report = lazy(() => import("./pages/Report"));
const CpiReport = lazy(() => import("./pages/CpiReport"));
const NiiReport = lazy(() => import("./pages/NiiReport"));
const CiReport = lazy(() => import("./pages/CiReport"));
const LiReport = lazy(() => import("./pages/LiReport"));
const LeaderPlaybook = lazy(() => import("./pages/LeaderPlaybook"));
const PlaybookPatterns = lazy(() => import("./pages/PlaybookPatterns"));
const OutreachEngine = lazy(() => import("./pages/OutreachEngine"));
const CareerProgress = lazy(() => import("./pages/CareerProgress"));
const CareerAccess = lazy(() => import("./pages/CareerAccess"));
const RelationshipGraph = lazy(() => import("./pages/RelationshipGraph"));
const AccessPaths = lazy(() => import("./pages/AccessPaths"));
const ImportEci = lazy(() => import("./pages/ImportEci"));
const ImportChatgpt = lazy(() => import("./pages/ImportChatgpt"));
const ImportPriorAssessments = lazy(() => import("./pages/ImportPriorAssessments"));
const GrowthProfile = lazy(() => import("@/pages/GrowthProfile"));
const EnterpriseOnboardingWizard = lazy(() => import("@/pages/EnterpriseOnboardingWizard"));
const ApplyForPilot = lazy(() => import("@/pages/ApplyForPilot"));
const AdminPilotApplications = lazyWithRouteRecovery(() => import("@/pages/AdminPilotApplications"), "admin-pilot-applications");
const AdminManageInvites = lazyWithRouteRecovery(() => import("@/pages/AdminManageInvites"), "admin-invites");
const AdminDashboard = lazyWithRouteRecovery(() => import("@/pages/AdminDashboard"), "admin-dashboard");
const AdminSuccessPartnerQueue = lazyWithRouteRecovery(() => import("@/pages/AdminSuccessPartnerQueue"), "admin-momentum");
const AdminSuccessPartnerBrief = lazyWithRouteRecovery(() => import("@/pages/AdminSuccessPartnerBrief"), "admin-momentum-brief");
const AdminEscalations = lazyWithRouteRecovery(() => import("@/pages/AdminEscalations"), "admin-escalations");
const CareerHome = lazy(() => import("@/pages/CareerHome"));
const CareerMarketIntel = lazy(() => import("@/pages/career/CareerMarketIntel"));
const CareerPrepare = lazy(() => import("@/pages/career/CareerPrepare"));
const CareerMyJourney = lazy(() => import("@/pages/career/CareerMyJourney"));
const AdminProductEnrollments = lazyWithRouteRecovery(() => import("@/pages/AdminProductEnrollments"), "admin-enrollments");
const ManagerEffectivenessLanding = lazy(() => import("@/pages/ManagerEffectivenessLanding"));
const ManagerHome = lazy(() => import("@/pages/mep/ManagerHome"));
const WorkGenomeScan = lazy(() => import("@/pages/WorkGenomeScan"));
const WorkDiary = lazy(() => import("@/pages/WorkDiary"));
const ManagerDiagnostics = lazyWithRouteRecovery(() => import("@/pages/mep/ManagerDiagnostics"), "manager-diagnostics");
const ManagerGuide = lazy(() => import("@/pages/mep/ManagerGuide"));
const ManagerPlaybook = lazy(() => import("@/pages/mep/ManagerPlaybook"));
const ManagerBrief = lazy(() => import("@/pages/mep/ManagerBrief"));
const ManagerPractice = lazy(() => import("@/pages/mep/ManagerPractice"));
const ManagerCommitments = lazy(() => import("@/pages/mep/ManagerCommitments"));
const TeamIntelligence = lazy(() => import("@/pages/mep/TeamIntelligence"));
const ManagerCoach = lazy(() => import("@/pages/mep/ManagerCoach"));
const ManagerProgress = lazy(() => import("@/pages/mep/ManagerProgress"));
const RadarSignals = lazy(() => import("@/pages/RadarSignals"));
const InterviewPrep = lazy(() => import("@/pages/InterviewPrep"));
const NegotiationIntelligence = lazy(() => import("@/pages/NegotiationIntelligence"));
const OrgIntelligence = lazy(() => import("@/pages/OrgIntelligence"));
const MEPLayout = lazy(() => import("@/components/MEPLayout"));
const CoachPortal = lazy(() => import("@/pages/CoachPortal"));
const SuccessPartnerNarrativeView = lazy(() => import("@/pages/SuccessPartnerNarrativeView"));
const AdminCoachManagement = lazyWithRouteRecovery(() => import("@/pages/AdminCoachManagement"), "admin-coaches");
const AdminSuccessPartners = lazyWithRouteRecovery(() => import("@/pages/AdminSuccessPartners"), "admin-success-partners");
const MEPLeaderDocuments = lazy(() => import("@/pages/mep/MEPLeaderDocuments"));
const AdminOrgContext = lazyWithRouteRecovery(() => import("@/pages/AdminOrgContext"), "admin-org-context");
const AdminParticipantImport = lazyWithRouteRecovery(() => import("@/pages/AdminParticipantImport"), "admin-participant-import");
const AdminModelEvaluator = lazyWithRouteRecovery(() => import("@/pages/AdminModelEvaluator"), "admin-model-evaluator");
const CareerLanding = lazy(() => import("@/pages/CareerLanding"));
const CareerInvestment = lazy(() => import("@/pages/CareerInvestment"));
const ResumeMakeover = lazy(() => import("@/pages/ci/ResumeMakeover"));
const ResumeReport = lazy(() => import("@/pages/ci/ResumeReport"));
const ResumeRewrite = lazy(() => import("@/pages/ci/ResumeRewrite"));
const NextChapter = lazy(() => import("@/pages/NextChapter"));
const LSOSWorkspace = lazyWithRouteRecovery(() => import("@/pages/LSOSWorkspace"), "admin-lsos");
const NextChapterPortfolio = lazy(() => import("@/pages/NextChapterPortfolio"));
const IdentityClarityAssessment = lazy(() => import("@/pages/IdentityClarityAssessment"));
const JoinPage = lazy(() => import("@/pages/JoinPage"));
const JoinProduct = lazy(() => import("@/pages/JoinProduct"));
const PELayout = lazy(() => import("./components/PELayout"));
const PEOnboarding = lazy(() => import("./pages/pe/PEOnboarding"));
const PEHome = lazy(() => import("./pages/pe/PEHome"));
const PEAssessment = lazy(() => import("./pages/pe/PEAssessment"));
const PECoach = lazy(() => import("./pages/pe/PECoach"));
const PEPractice = lazy(() => import("./pages/pe/PEPractice"));
const PEProgress = lazy(() => import("./pages/pe/PEProgress"));
const PESettings = lazy(() => import("./pages/pe/PESettings"));
const IntelligenceCoreDashboard = lazyWithRouteRecovery(() => import("./pages/IntelligenceCoreDashboard"), "admin-intelligence-core");
const Intelligence = lazy(() => import("./pages/Intelligence"));
const NarrativeIntelligence = lazy(() => import("./pages/NarrativeIntelligence"));
const BehaviouralIntelligenceStudio = lazy(() => import("@/pages/BehaviouralIntelligenceStudio"));
const BehaviouralSponsorHeatmap = lazy(() => import("@/pages/BehaviouralSponsorHeatmap"));
const SponsorCapacityDashboard = lazy(() => import("@/pages/SponsorCapacityDashboard"));
const AcademyHome = lazy(() => import("@/pages/AcademyHome"));
const AcademyDiagnostic = lazy(() => import("@/pages/AcademyDiagnostic"));
const AcademyProductMap = lazy(() => import("@/pages/AcademyProductMap"));
const AcademyPassport = lazy(() => import("@/pages/AcademyPassport"));
const AcademyMentor = lazy(() => import("@/pages/AcademyMentor"));
const SimulatorStart = lazy(() => import("./pages/SimulatorStart"));
const SimulatorSession = lazy(() => import("./pages/SimulatorSession"));
const SimulatorDebrief = lazy(() => import("./pages/SimulatorDebrief"));
const EarlyCareerLayout = lazy(() => import("./components/EarlyCareerLayout"));
const EarlyCareerHome = lazy(() => import("./pages/earlyCareer/EarlyCareerHome"));
const EarlyCareerGrowth = lazy(() => import("./pages/earlyCareer/EarlyCareerGrowth"));
const ManagerCompanion = lazy(() => import("./pages/earlyCareer/ManagerCompanion"));
const EarlyCareerDiagnostic = lazy(() => import("./pages/earlyCareer/EarlyCareerDiagnostic"));
const EarlyCareerCoach = lazy(() => import("./pages/earlyCareer/EarlyCareerCoach"));
const EarlyCareerPractice = lazy(() => import("./pages/earlyCareer/EarlyCareerPractice"));
const EarlyCareerHR = lazy(() => import("./pages/earlyCareer/EarlyCareerHR"));
const ExecutiveIntelligence = lazy(() => import("./pages/ExecutiveIntelligence"));
const SalesIntelligence = lazy(() => import("./pages/SalesIntelligence"));
const CriticalThinkingHome = lazy(() => import("./pages/CriticalThinkingHome"));
const CriticalThinkingAssessment = lazy(() => import("./pages/CriticalThinkingAssessment"));
const CriticalThinkingReport = lazy(() => import("./pages/CriticalThinkingReport"));
const CriticalThinkingAdmin = lazy(() => import("./pages/CriticalThinkingAdmin"));
const CriticalThinkingPlatformAdmin = lazyWithRouteRecovery(() => import("./pages/CriticalThinkingPlatformAdmin"), "admin-critical-thinking");
const CriticalThinkingPilot = lazy(() => import("./pages/CriticalThinkingPilot"));
const EngineeringDiagnostic = lazy(() => import("./pages/engineering/EngineeringDiagnostic"));
const EngineeringOperatingProfile = lazy(() => import("./pages/engineering/EngineeringOperatingProfile"));
const EngineeringPartnerWorkspace = lazy(() => import("./pages/engineering/EngineeringPartnerWorkspace"));
const EngineeringAdminProvisioning = lazy(() => import("./pages/engineering/EngineeringAdminProvisioning"));
const EngineeringPromptEvaluation = lazy(() => import("./pages/engineering/EngineeringPromptEvaluation"));
const CriticalThinkingReportValidationFixture = import.meta.env.DEV ? lazy(() => import("./pages/CriticalThinkingReportValidationFixture")) : null;
const OrgContextExtractionValidationFixture = import.meta.env.DEV ? lazy(() => import("./pages/OrgContextExtractionValidationFixture")) : null;

// Launch Intelligence is a self-contained experience. Loading its journeys on
// demand keeps the platform's initial bundle focused on the page a learner chose.
const LaunchHome = lazy(() => import("@/pages/launch/LaunchHome"));
const LaunchLanding = lazy(() => import("@/pages/launch/LaunchLanding"));
const LaunchOnboarding = lazy(() => import("@/pages/launch/LaunchOnboarding"));
const LaunchJourneyMap = lazy(() => import("@/pages/launch/LaunchJourneyMap"));
const LaunchCareerCompass = lazy(() => import("@/pages/launch/LaunchCareerCompass"));
const LaunchStoryBuilder = lazy(() => import("@/pages/launch/LaunchStoryBuilder"));
const LaunchSkillSprint = lazy(() => import("@/pages/launch/LaunchSkillSprint"));
const LaunchResumeMakeover = lazy(() => import("@/pages/launch/LaunchResumeMakeover"));
const LaunchApplicationTracker = lazy(() => import("@/pages/launch/LaunchApplicationTracker"));
const LaunchInterviewIntelligence = lazy(() => import("@/pages/launch/LaunchInterviewIntelligence"));
const LaunchNegotiationSimulator = lazy(() => import("@/pages/launch/LaunchNegotiationSimulator"));
const LaunchDashboard = lazy(() => import("@/pages/launch/LaunchDashboard"));
const LaunchSettings = lazy(() => import("@/pages/launch/LaunchSettings"));
const LaunchLeaderboard = lazy(() => import("@/pages/launch/LaunchLeaderboard"));
const LaunchMissionHistory = lazy(() => import("@/pages/launch/LaunchMissionHistory"));
const LaunchWeeklyChallenges = lazy(() => import("@/pages/launch/LaunchWeeklyChallenges"));

function LaunchRouteFallback() {
  return (
    <div className="launch-dark min-h-screen grid place-items-center bg-[#0A0F1E] text-[#F8FAFC]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-11 w-11 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" aria-hidden="true" />
        <p className="font-semibold">Preparing your next move…</p>
      </div>
    </div>
  );
}

const withMepLayout = (page: ReactNode) => () => (
  <MEPAccessGate><MEPLayout>{page}</MEPLayout></MEPAccessGate>
);

const withPeAccess = (page: ReactNode) => () => <PEAccessGate>{page}</PEAccessGate>;

const withPeLayout = (page: ReactNode) => () => (
  <PEAccessGate><PELayout>{page}</PELayout></PEAccessGate>
);

const withEarlyCareerLayout = (page: ReactNode) => () => (
  <EarlyCareerLayout>{page}</EarlyCareerLayout>
);

// Handles the case where user was redirected to OAuth from /join-product
// and lands back at "/" after login — we pick up the pending product from localStorage.
function PostLoginProductActivator() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const enrollMutation = trpc.products.selfEnrollAndActivate.useMutation({
    onSuccess: (data) => {
      utils.products.getActiveProduct.invalidate();
      utils.products.getEnrolledProducts.invalidate();
      const dest = data.productId === "career_intelligence" ? "/career" : data.productId === "manager_effectiveness" ? "/manager" : data.productId === "launch_intelligence" ? "/launch/home" : data.productId === "professional_effectiveness" ? "/pe" : data.productId === "early_career_intelligence" ? "/early-career" : "/home";
      window.location.replace(dest);
    },
  });

  useEffect(() => {
    if (!user) return;
    const pending = localStorage.getItem(LS_KEY);
    if (!pending) return;
    // Only act if we're on the home/landing page (post-OAuth redirect)
    const path = window.location.pathname;
    if (path !== "/" && path !== "/home") return;
    localStorage.removeItem(LS_KEY);
    enrollMutation.mutate({ productId: pending });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return null;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/demo" component={EngineeringDemo} />
      <Route path="/tech-intelligence" component={TechIntelligenceLanding} />
      <Route path="/onboard" component={Onboarding} />
      <Route path="/report/:slug" component={Report} />
      <Route path="/cpi-report/:slug" component={CpiReport} />
      <Route path="/nii-report/:slug" component={NiiReport} />
      <Route path="/ci-report/:moduleCode/:slug" component={CiReport} />
      <Route path="/li-report/:moduleCode/:slug" component={LiReport} />
      <Route path="/playbook" component={LeaderPlaybook} />
      <Route path="/playbook/patterns" component={PlaybookPatterns} />
      <Route path="/critical-thinking" component={CriticalThinkingHome} />
      <Route path="/critical-thinking/assessment/:campaignId" component={CriticalThinkingAssessment} />
      <Route path="/critical-thinking/report/:reportId" component={CriticalThinkingReport} />
      <Route path="/critical-thinking/admin" component={CriticalThinkingAdmin} />
      <Route path="/critical-thinking/pilot" component={CriticalThinkingPilot} />
      {CriticalThinkingReportValidationFixture && <Route path="/critical-thinking/_report-validation/team" component={CriticalThinkingReportValidationFixture} />}
      {CriticalThinkingReportValidationFixture && <Route path="/critical-thinking/_report-validation/share" component={CriticalThinkingReportValidationFixture} />}
      {CriticalThinkingReportValidationFixture && <Route path="/critical-thinking/_report-validation/generating" component={CriticalThinkingReportValidationFixture} />}
      {CriticalThinkingReportValidationFixture && <Route path="/critical-thinking/_report-validation/individual" component={CriticalThinkingReportValidationFixture} />}
      {CriticalThinkingReportValidationFixture && <Route path="/critical-thinking/_report-validation" component={CriticalThinkingReportValidationFixture} />}
      {OrgContextExtractionValidationFixture && <Route path="/_validation/org-context-extraction" component={OrgContextExtractionValidationFixture} />}
      <Route path="/admin/critical-thinking" component={CriticalThinkingPlatformAdmin} />

      {/* Platform (authenticated) */}
      <Route path="/home" component={Home} />
      <Route path="/my-edge" component={MyEdge} />
      <Route path="/guide" component={Guide} />
      <Route path="/practice" component={PracticeCoach} />
      <Route path="/insights" component={Insights} />
      <Route path="/diagnostics" component={Diagnostics} />
      <Route path="/narrative" component={NarrativeIntelligence} />
      <Route path="/narrative-intelligence" component={NarrativeIntelligence} />
      <Route path="/behavioural-intelligence" component={() => <BehaviouralIntelligenceStudio />} />
      <Route path="/organisation/behavioural-intelligence" component={BehaviouralSponsorHeatmap} />
      <Route path="/organisation/effectiveness" component={SponsorCapacityDashboard} />
      {/* LevelNext Academy */}
      <Route path="/academy" component={AcademyHome} />
      <Route path="/academy/diagnostic" component={AcademyDiagnostic} />
      <Route path="/academy/map" component={AcademyProductMap} />
      <Route path="/academy/passport" component={AcademyPassport} />
      <Route path="/academy/mentor" component={AcademyMentor} />
      <Route path="/diagnostics/:moduleType" component={Assessment} />
      <Route path="/engineering/diagnostic" component={EngineeringDiagnostic} />
      <Route path="/engineering/profile" component={EngineeringOperatingProfile} />
      <Route path="/engineering/partner" component={EngineeringPartnerWorkspace} />
      <Route path="/engineering/admin/provisioning" component={EngineeringAdminProvisioning} />
      <Route path="/engineering/admin/prompt-evaluation" component={EngineeringPromptEvaluation} />
      <Route path="/import-eci" component={ImportEci} />
      <Route path="/import-chatgpt" component={ImportChatgpt} />
      <Route path="/import-ai" component={ImportChatgpt} />
      <Route path="/import-prior-assessments" component={ImportPriorAssessments} />
      <Route path="/growth-profile" component={GrowthProfile} />
      <Route path="/enterprise-onboarding" component={EnterpriseOnboardingWizard} />
      <Route path="/apply" component={ApplyForPilot} />
      <Route path="/join" component={JoinPage} />
      <Route path="/join-product" component={JoinProduct} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/pilot-applications" component={AdminPilotApplications} />
      <Route path="/admin/invites" component={AdminManageInvites} />
      <Route path="/admin/momentum" component={AdminSuccessPartnerQueue} />
      <Route path="/admin/momentum/:userId" component={AdminSuccessPartnerBrief} />
      <Route path="/admin/success-partner" component={AdminSuccessPartnerQueue} />
      <Route path="/admin/success-partner/brief/:userId" component={AdminSuccessPartnerBrief} />
      <Route path="/admin/lsos" component={LSOSWorkspace} />
      <Route path="/admin/escalations" component={AdminEscalations} />
      <Route path="/career" component={CareerHome} />
      <Route path="/career/progress" component={CareerProgress} />
      <Route path="/career/access" component={CareerAccess} />
      <Route path="/career/relationships" component={RelationshipGraph} />
      <Route path="/career/access-paths" component={AccessPaths} />
      <Route path="/career/brand" component={OutreachEngine} />
      <Route path="/career/radar" component={RadarSignals} />
      <Route path="/career/interview-prep" component={InterviewPrep} />
      <Route path="/career/negotiation" component={NegotiationIntelligence} />
      <Route path="/career/resume" component={ResumeMakeover} />
      {/* Career nav — new merged pages */}
      <Route path="/career/market-intel" component={CareerMarketIntel} />
      <Route path="/career/prepare" component={CareerPrepare} />
      <Route path="/career/journey" component={CareerMyJourney} />
      <Route path="/career/resume/report/:id" component={ResumeReport} />
      <Route path="/career/resume/rewrite/:id" component={ResumeRewrite} />
      <Route path="/org-intelligence" component={OrgIntelligence} />
      {/* Manager Effectiveness Platform — 6-item nav */}
      <Route path="/manager" component={withMepLayout(<ManagerHome />)} />
      <Route path="/manager/work-genome" component={withMepLayout(<WorkGenomeScan />)} />
      <Route path="/manager/work-diary" component={withMepLayout(<WorkDiary />)} />
      <Route path="/manager/diagnostics" component={withMepLayout(<ManagerDiagnostics />)} />
      <Route path="/manager/coach" component={withMepLayout(<ManagerCoach />)} />
      <Route path="/manager/practice" component={withMepLayout(<ManagerPractice />)} />
      <Route path="/manager/narrative" component={withMepLayout(<NarrativeIntelligence />)} />
      <Route path="/manager/behavioural-intelligence" component={withMepLayout(<BehaviouralIntelligenceStudio sourceApp="mep" />)} />
      <Route path="/manager/team" component={withMepLayout(<TeamIntelligence />)} />
      <Route path="/manager/progress" component={withMepLayout(<ManagerProgress />)} />
      {/* Legacy redirects — old routes still work */}
      <Route path="/manager/guide" component={withMepLayout(<ManagerCoach />)} />
      <Route path="/manager/playbook" component={withMepLayout(<ManagerCoach />)} />
      <Route path="/manager/brief" component={withMepLayout(<ManagerBrief />)} />
      <Route path="/manager/commitments" component={withMepLayout(<ManagerProgress />)} />
      <Route path="/manager/documents" component={withMepLayout(<ManagerProgress />)} />
      <Route path="/admin/enrollments" component={AdminProductEnrollments} />
      <Route path="/admin/coaches" component={AdminCoachManagement} />
      <Route path="/admin/success-partners" component={AdminSuccessPartners} />
      <Route path="/admin/org-context" component={AdminOrgContext} />
      <Route path="/admin/participants/import" component={AdminParticipantImport} />
      <Route path="/admin/model-evaluator" component={AdminModelEvaluator} />
      <Route path="/next-chapter" component={NextChapter} />
      <Route path="/next-chapter/portfolio" component={NextChapterPortfolio} />
      <Route path="/next-chapter/identity-assessment" component={IdentityClarityAssessment} />
      <Route path="/coach" component={CoachPortal} />
      <Route path="/admin/success-partner/narrative/:participantUserId" component={SuccessPartnerNarrativeView} />
      <Route path="/career-landing" component={CareerLanding} />
      <Route path="/career-intelligence" component={CareerLanding} />
      <Route path="/career-investment" component={CareerInvestment} />
      {/* Voice Practice Simulator */}
      <Route path="/leadership/simulate" component={SimulatorStart} />
      <Route path="/manager/simulate" component={SimulatorStart} />
      <Route path="/career/simulate" component={SimulatorStart} />
      <Route path="/young/simulate" component={SimulatorStart} />
      <Route path="/simulator/:sessionId/debrief" component={SimulatorDebrief} />
      <Route path="/simulator/:sessionId" component={SimulatorSession} />
      {/* Launch Intelligence */}
      <Route path="/launch" component={LaunchLanding} />
      <Route path="/launch/home" component={LaunchHome} />
      <Route path="/launch/onboarding" component={LaunchOnboarding} />
      <Route path="/launch/journey" component={LaunchJourneyMap} />
      <Route path="/launch/mission/1" component={LaunchCareerCompass} />
      <Route path="/launch/mission/2" component={LaunchStoryBuilder} />
      <Route path="/launch/mission/3" component={LaunchSkillSprint} />
      <Route path="/launch/resume" component={LaunchResumeMakeover} />
      <Route path="/launch/applications" component={LaunchApplicationTracker} />
      <Route path="/launch/interview" component={LaunchInterviewIntelligence} />
      <Route path="/launch/negotiate" component={LaunchNegotiationSimulator} />
      <Route path="/launch/dashboard" component={LaunchDashboard} />
      <Route path="/launch/settings" component={LaunchSettings} />
      <Route path="/launch/leaderboard" component={LaunchLeaderboard} />
      <Route path="/launch/history" component={LaunchMissionHistory} />
      <Route path="/launch/challenges" component={LaunchWeeklyChallenges} />
      {/* Professional Effectiveness Intelligence */}
      <Route path="/pe/onboarding" component={withPeAccess(<PEOnboarding />)} />
      <Route path="/pe" component={withPeLayout(<PEHome />)} />
      <Route path="/pe/assessment" component={withPeLayout(<PEAssessment />)} />
      <Route path="/pe/coach" component={withPeLayout(<PECoach />)} />
      <Route path="/pe/practice" component={withPeLayout(<PEPractice />)} />
      <Route path="/pe/progress" component={withPeLayout(<PEProgress />)} />
      <Route path="/pe/settings" component={withPeLayout(<PESettings />)} />

      {/* Early Career Intelligence — distinct from Launch and Executive Communication Intelligence */}
      <Route path="/early-career" component={withEarlyCareerLayout(<EarlyCareerHome />)} />
      <Route path="/early-career/diagnostic" component={withEarlyCareerLayout(<EarlyCareerDiagnostic />)} />
      <Route path="/early-career/guide" component={withEarlyCareerLayout(<EarlyCareerCoach />)} />
      <Route path="/early-career/practice" component={withEarlyCareerLayout(<EarlyCareerPractice />)} />
      <Route path="/early-career/hr" component={withEarlyCareerLayout(<EarlyCareerHR />)} />
      <Route path="/early-career/growth" component={withEarlyCareerLayout(<EarlyCareerGrowth />)} />
      <Route path="/early-career/manager" component={withEarlyCareerLayout(<ManagerCompanion />)} />

      {/* Executive Intelligence — a private enterprise decision and mandate cockpit */}
      <Route path="/executive" component={ExecutiveIntelligence} />
      <Route path="/sales" component={SalesIntelligence} />

      <Route path="/manager-effectiveness" component={ManagerEffectivenessLanding} />
      <Route path="/progress" component={Progress} />
      <Route path="/organisation" component={Organisation} />
      <Route path="/settings" component={Settings} />

      {/* Intelligence Core */}
      <Route path="/intelligence" component={Intelligence} />
      <Route path="/admin/intelligence-core" component={IntelligenceCoreDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Suspense fallback={<LaunchRouteFallback />}>
            <Router />
          </Suspense>
          <PostLoginProductActivator />
          <ClientErrorTelemetry />
          <VersionUpdateBanner />
          <PWAInstallBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
