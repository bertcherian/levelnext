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
import Insights from "./pages/Insights";
import Diagnostics from "./pages/Diagnostics";
import Progress from "./pages/Progress";
import Organisation from "./pages/Organisation";
import Settings from "./pages/Settings";
import Assessment from "./pages/Assessment";
import Report from "./pages/Report";

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
      <Route path="/insights" component={Insights} />
      <Route path="/diagnostics" component={Diagnostics} />
      <Route path="/diagnostics/:moduleType" component={Assessment} />
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
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
