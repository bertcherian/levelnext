import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import MyEdge from "./pages/MyEdge";
import Guide from "./pages/Guide";
import PracticeCoach from "./pages/PracticeCoach";
import Insights from "./pages/Insights";
import Diagnostics from "./pages/Diagnostics";
import Progress from "./pages/Progress";
import Organisation from "./pages/Organisation";
import Settings from "./pages/Settings";
import Assessment from "./pages/Assessment";
import Report from "./pages/Report";
import CpiReport from "./pages/CpiReport";
import NiiReport from "./pages/NiiReport";
import CiReport from "./pages/CiReport";
import LiReport from "./pages/LiReport";
import LeaderPlaybook from "./pages/LeaderPlaybook";
import PlaybookPatterns from "./pages/PlaybookPatterns";
import OutreachEngine from "./pages/OutreachEngine";
import CareerProgress from "./pages/CareerProgress";
import CareerAccess from "./pages/CareerAccess";
import RelationshipGraph from "./pages/RelationshipGraph";
import AccessPaths from "./pages/AccessPaths";
import ImportEci from "./pages/ImportEci";
import ImportChatgpt from "./pages/ImportChatgpt";
import ImportPriorAssessments from "./pages/ImportPriorAssessments";
import GrowthProfile from "@/pages/GrowthProfile";
import EnterpriseOnboardingWizard from "@/pages/EnterpriseOnboardingWizard";
import ApplyForPilot from "@/pages/ApplyForPilot";
import AdminPilotApplications from "@/pages/AdminPilotApplications";
import AdminManageInvites from "@/pages/AdminManageInvites";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminSuccessPartnerQueue from "@/pages/AdminSuccessPartnerQueue";
import AdminSuccessPartnerBrief from "@/pages/AdminSuccessPartnerBrief";
import AdminEscalations from "@/pages/AdminEscalations";
import CareerHome from "@/pages/CareerHome";
import AdminProductEnrollments from "@/pages/AdminProductEnrollments";
import ManagerEffectivenessLanding from "@/pages/ManagerEffectivenessLanding";
import ManagerHome from "@/pages/mep/ManagerHome";
import ManagerDiagnostics from "@/pages/mep/ManagerDiagnostics";
import ManagerGuide from "@/pages/mep/ManagerGuide";
import ManagerPlaybook from "@/pages/mep/ManagerPlaybook";
import ManagerBrief from "@/pages/mep/ManagerBrief";
import ManagerPractice from "@/pages/mep/ManagerPractice";
import ManagerCommitments from "@/pages/mep/ManagerCommitments";
import TeamIntelligence from "@/pages/mep/TeamIntelligence";
import ManagerCoach from "@/pages/mep/ManagerCoach";
import ManagerProgress from "@/pages/mep/ManagerProgress";
import RadarSignals from "@/pages/RadarSignals";
import InterviewPrep from "@/pages/InterviewPrep";
import NegotiationIntelligence from "@/pages/NegotiationIntelligence";
import OrgIntelligence from "@/pages/OrgIntelligence";
import MEPLayout from "@/components/MEPLayout";
import CoachPortal from "@/pages/CoachPortal";
import AdminCoachManagement from "@/pages/AdminCoachManagement";
import AdminSuccessPartners from "@/pages/AdminSuccessPartners";
import MEPLeaderDocuments from "@/pages/mep/MEPLeaderDocuments";
import AdminOrgContext from "@/pages/AdminOrgContext";
import AdminParticipantImport from "@/pages/AdminParticipantImport";
import CareerLanding from "@/pages/CareerLanding";
import CareerInvestment from "@/pages/CareerInvestment";
import ResumeMakeover from "@/pages/ci/ResumeMakeover";
import ResumeReport from "@/pages/ci/ResumeReport";
import ResumeRewrite from "@/pages/ci/ResumeRewrite";
import NextChapter from "@/pages/NextChapter";
import LSOSWorkspace from "@/pages/LSOSWorkspace";
import NextChapterPortfolio from "@/pages/NextChapterPortfolio";
import IdentityClarityAssessment from "@/pages/IdentityClarityAssessment";
import JoinPage from "@/pages/JoinPage";
import LaunchHome from "@/pages/launch/LaunchHome";
import LaunchLanding from "@/pages/launch/LaunchLanding";
import LaunchOnboarding from "@/pages/launch/LaunchOnboarding";
import LaunchJourneyMap from "@/pages/launch/LaunchJourneyMap";
import LaunchCareerCompass from "@/pages/launch/LaunchCareerCompass";
import LaunchStoryBuilder from "@/pages/launch/LaunchStoryBuilder";
import LaunchSkillSprint from "@/pages/launch/LaunchSkillSprint";
import LaunchResumeMakeover from "@/pages/launch/LaunchResumeMakeover";
import LaunchApplicationTracker from "@/pages/launch/LaunchApplicationTracker";
import LaunchInterviewIntelligence from "@/pages/launch/LaunchInterviewIntelligence";
import LaunchNegotiationSimulator from "@/pages/launch/LaunchNegotiationSimulator";
import LaunchDashboard from "@/pages/launch/LaunchDashboard";
import JoinProduct from "@/pages/JoinProduct";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PWAInstallBanner from "./components/PWAInstallBanner";
import SimulatorStart from "./pages/SimulatorStart";
import SimulatorSession from "./pages/SimulatorSession";
import SimulatorDebrief from "./pages/SimulatorDebrief";
import { useEffect } from "react";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";

const LS_KEY = "levelnext_join_product";

// Handles the case where user was redirected to OAuth from /join-product
// and lands back at "/" after login — we pick up the pending product from localStorage.
function PostLoginProductActivator() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const enrollMutation = trpc.products.selfEnrollAndActivate.useMutation({
    onSuccess: (data) => {
      utils.products.getActiveProduct.invalidate();
      utils.products.getEnrolledProducts.invalidate();
      const dest = data.productId === "career_intelligence" ? "/career" : data.productId === "manager_effectiveness" ? "/manager" : data.productId === "launch_intelligence" ? "/launch/home" : "/home";
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
      <Route path="/onboard" component={Onboarding} />
      <Route path="/report/:slug" component={Report} />
      <Route path="/cpi-report/:slug" component={CpiReport} />
      <Route path="/nii-report/:slug" component={NiiReport} />
      <Route path="/ci-report/:moduleCode/:slug" component={CiReport} />
      <Route path="/li-report/:moduleCode/:slug" component={LiReport} />
      <Route path="/playbook" component={LeaderPlaybook} />
      <Route path="/playbook/patterns" component={PlaybookPatterns} />

      {/* Platform (authenticated) */}
      <Route path="/home" component={Home} />
      <Route path="/my-edge" component={MyEdge} />
      <Route path="/guide" component={Guide} />
      <Route path="/practice" component={PracticeCoach} />
      <Route path="/insights" component={Insights} />
      <Route path="/diagnostics" component={Diagnostics} />
      <Route path="/diagnostics/:moduleType" component={Assessment} />
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
      <Route path="/career/resume/report/:id" component={ResumeReport} />
      <Route path="/career/resume/rewrite/:id" component={ResumeRewrite} />
      <Route path="/org-intelligence" component={OrgIntelligence} />
      {/* Manager Effectiveness Platform — 6-item nav */}
      <Route path="/manager">{() => <MEPLayout><ManagerHome /></MEPLayout>}</Route>
      <Route path="/manager/diagnostics">{() => <MEPLayout><ManagerDiagnostics /></MEPLayout>}</Route>
      <Route path="/manager/coach">{() => <MEPLayout><ManagerCoach /></MEPLayout>}</Route>
      <Route path="/manager/practice">{() => <MEPLayout><ManagerPractice /></MEPLayout>}</Route>
      <Route path="/manager/team">{() => <MEPLayout><TeamIntelligence /></MEPLayout>}</Route>
      <Route path="/manager/progress">{() => <MEPLayout><ManagerProgress /></MEPLayout>}</Route>
      {/* Legacy redirects — old routes still work */}
      <Route path="/manager/guide">{() => <MEPLayout><ManagerCoach /></MEPLayout>}</Route>
      <Route path="/manager/playbook">{() => <MEPLayout><ManagerCoach /></MEPLayout>}</Route>
      <Route path="/manager/brief">{() => <MEPLayout><ManagerBrief /></MEPLayout>}</Route>
      <Route path="/manager/commitments">{() => <MEPLayout><ManagerProgress /></MEPLayout>}</Route>
      <Route path="/manager/documents">{() => <MEPLayout><ManagerProgress /></MEPLayout>}</Route>
      <Route path="/admin/enrollments" component={AdminProductEnrollments} />
      <Route path="/admin/coaches" component={AdminCoachManagement} />
      <Route path="/admin/success-partners" component={AdminSuccessPartners} />
      <Route path="/admin/org-context" component={AdminOrgContext} />
      <Route path="/admin/participants/import" component={AdminParticipantImport} />
      <Route path="/next-chapter" component={NextChapter} />
      <Route path="/next-chapter/portfolio" component={NextChapterPortfolio} />
      <Route path="/next-chapter/identity-assessment" component={IdentityClarityAssessment} />
      <Route path="/coach" component={CoachPortal} />
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
      <Route path="/manager-effectiveness" component={ManagerEffectivenessLanding} />
      <Route path="/progress" component={Progress} />
      <Route path="/organisation" component={Organisation} />
      <Route path="/settings" component={Settings} />

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
          <Router />
          <PostLoginProductActivator />
          <PWAInstallBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
