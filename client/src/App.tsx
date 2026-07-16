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
import AdminMomentumQueue from "@/pages/AdminMomentumQueue";
import AdminMomentumBrief from "@/pages/AdminMomentumBrief";
import AdminEscalations from "@/pages/AdminEscalations";
import CareerHome from "@/pages/CareerHome";
import AdminProductEnrollments from "@/pages/AdminProductEnrollments";
import CareerLanding from "@/pages/CareerLanding";
import JoinPage from "@/pages/JoinPage";
import JoinProduct from "@/pages/JoinProduct";
import Login from "@/pages/Login";
import PWAInstallBanner from "./components/PWAInstallBanner";
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
      const dest = data.productId === "career_intelligence" ? "/career" : "/home";
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
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/pilot-applications" component={AdminPilotApplications} />
      <Route path="/admin/invites" component={AdminManageInvites} />
      <Route path="/admin/momentum" component={AdminMomentumQueue} />
      <Route path="/admin/momentum/:userId" component={AdminMomentumBrief} />
      <Route path="/admin/escalations" component={AdminEscalations} />
      <Route path="/career" component={CareerHome} />
      <Route path="/career/progress" component={CareerProgress} />
      <Route path="/career/access" component={CareerAccess} />
      <Route path="/career/relationships" component={RelationshipGraph} />
      <Route path="/career/access-paths" component={AccessPaths} />
      <Route path="/admin/enrollments" component={AdminProductEnrollments} />
      <Route path="/career-intelligence" component={CareerLanding} />
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
