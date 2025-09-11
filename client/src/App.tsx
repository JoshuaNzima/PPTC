import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/language-context";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import SubmitResults from "@/pages/submit-results";
import VerifyResults from "@/pages/verify-results";
import Reports from "@/pages/reports";
import UserManagement from "@/pages/user-management";
import AuditTrail from "@/pages/audit-trail";
import AdminManagement from "@/pages/admin-management";
import ReviewFlagged from "@/pages/review-flagged";
import Profile from "@/pages/profile";
import { PoliticalPartiesPage } from "@/pages/political-parties";
import DataManagement from "@/pages/data-management";
import ComplaintsPage from "@/pages/complaints";
import MECResultsPage from "@/pages/mec-results";
import InternalResultsPage from "@/pages/internal-results";
import ResultsComparisonPage from "@/pages/results-comparison";
import Presentation from "@/pages/presentation";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import LanguageSelector from "@/components/language-selector";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // A simple wrapper for routes that require authentication
  const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null; // Or a loading spinner
    if (!isAuthenticated) return <Landing />; // Redirect to landing if not authenticated
    return children;
  };

  return (
    <Switch>
      <Route path="/login" component={Login} />
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <div className="h-screen flex flex-col bg-gray-50">
            <Navigation />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-auto p-4 sm:p-6">
                <Switch>
                  <Route path="/" component={Dashboard} />
                  <Route path="/submit-results" component={SubmitResults} />
                  <Route path="/complaints" component={ComplaintsPage} />
                  <Route path="/mec-results" component={MECResultsPage} />
                  <Route path="/internal-results" component={InternalResultsPage} />
                  <Route path="/results-comparison" component={ResultsComparisonPage} />
                  <Route path="/verify-results" component={VerifyResults} />
                  <Route path="/reports" component={Reports} />
                  <Route path="/user-management" component={UserManagement} />
                  <Route path="/political-parties" component={PoliticalPartiesPage} />
                  <Route path="/data-management" component={DataManagement} />
                  <Route path="/admin-management" component={AdminManagement} />
                  <Route path="/review-flagged" component={ReviewFlagged} />
                  <Route path="/audit-trail" component={AuditTrail} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/presentation" component={Presentation} />
                  <Route component={NotFound} />
                </Switch>
              </main>
            </div>
          </div>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;