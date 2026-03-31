import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { AppSidebar } from "@/components/sidebar";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard";
import TemplatesPage from "@/pages/templates";
import ClientsPage from "@/pages/clients";
import InvoicesPage from "@/pages/invoices";
import ChasePage from "@/pages/chase";
import AdminPage from "@/pages/admin";
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import CookiesPage from "@/pages/cookies";
import CareersPage from "@/pages/careers";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Admins skip onboarding — go straight to dashboard
  if (!user.onboardingComplete && (user as any).role !== 'admin') {
    return <Redirect to="/auth" />;
  }

  return (
    <AppSidebar>
      <Component />
    </AppSidebar>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return <Redirect to="/auth" />;
  if ((user as any).role !== 'admin') return <Redirect to="/dashboard" />;
  return (
    <AppSidebar>
      <Component />
    </AppSidebar>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={DashboardPage} />}
      </Route>
      <Route path="/templates">
        {() => <ProtectedRoute component={TemplatesPage} />}
      </Route>
      <Route path="/clients">
        {() => <ProtectedRoute component={ClientsPage} />}
      </Route>
      <Route path="/invoices">
        {() => <ProtectedRoute component={InvoicesPage} />}
      </Route>
      <Route path="/chase">
        {() => <ProtectedRoute component={ChasePage} />}
      </Route>
      <Route path="/settings">
        {() => (
          <ProtectedRoute component={() => (
            <div className="p-6 max-w-7xl mx-auto" data-testid="settings-page">
              <h1 className="text-xl font-semibold mb-2">Settings</h1>
              <p className="text-sm text-muted-foreground">Account settings coming soon.</p>
            </div>
          )} />
        )}
      </Route>
      <Route path="/admin">
        {() => <AdminRoute component={AdminPage} />}
      </Route>
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/careers" component={CareersPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
