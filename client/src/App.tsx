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
import ImportEci from "./pages/ImportEci";
import ImportChatgpt from "./pages/ImportChatgpt";
import ImportPriorAssessments from "./pages/ImportPriorAssessments";
import GrowthProfile from "@/pages/GrowthProfile";
import EnterpriseOnboardingWizard from "@/pages/EnterpriseOnboardingWizard";
import ApplyForPilot from "@/pages/ApplyForPilot";
import AdminPilotApplications from "@/pages/AdminPilotApplications";
import AdminManageInvites from "@/pages/AdminManageInvites";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminMomentumQueue from "@/pages/AdminMomentumQueue";
import AdminMomentumBrief from "@/pages/AdminMomentumBrief";
import AdminEscalations from "@/pages/AdminEscalations";
import CareerHome from "@/pages/CareerHome";
import AdminProductEnrollments from "@/pages/AdminProductEnrollments";
import JoinPage from "@/pages/JoinPage";
import PWAInstallBanner from "./components/PWAInstallBanner";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/onboard" component={Onboarding} />
      <Route path="/report/:slug" component={Report} />

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
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/pilot-applications" component={AdminPilotApplications} />
      <Route path="/admin/invites" component={AdminManageInvites} />
      <Route path="/admin/momentum" component={AdminMomentumQueue} />
      <Route path="/admin/momentum/:userId" component={AdminMomentumBrief} />
      <Route path="/admin/escalations" component={AdminEscalations} />
      <Route path="/career" component={CareerHome} />
      <Route path="/admin/enrollments" component={AdminProductEnrollments} />
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
          <PWAInstallBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
