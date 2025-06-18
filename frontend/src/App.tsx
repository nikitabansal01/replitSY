import React, { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Login from "@/pages/Login";
import OnboardingNew from "@/pages/OnboardingNew";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import DailyPlanner from "@/pages/DailyPlanner";
import EvaluationDashboard from "@/pages/EvaluationDashboard";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">The application encountered an error.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  const { user, loading, token } = useAuth();
  const [location, setLocation] = useLocation();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      if (!loading && token && user) {
        // User is authenticated, check if they need onboarding or can go to dashboard
        if (location === '/') {
          // Redirect authenticated users away from login page
          setLocation('/dashboard');
        }
      } else if (!loading && !token && location !== '/') {
        // User is not authenticated, redirect to login
        setLocation('/');
      }
    } catch (err) {
      console.error('Router error:', err);
      setError(err as Error);
    }
  }, [user, loading, token, location, setLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">Routing Error</h1>
          <p className="text-gray-600 mb-4">There was an error with the application routing.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Simple test component to verify React is working
  if (location === '/test') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-green-600 mb-4">React is Working!</h1>
          <p className="text-gray-600 mb-4">If you can see this, React is rendering correctly.</p>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Current location: {location}</p>
            <p className="text-sm text-gray-500">Loading: {loading ? 'true' : 'false'}</p>
            <p className="text-sm text-gray-500">Has token: {token ? 'yes' : 'no'}</p>
            <p className="text-sm text-gray-500">Has user: {user ? 'yes' : 'no'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/test" component={() => null} />
      <Route path="/onboarding" component={OnboardingNew} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/daily-planner" component={DailyPlanner} />
      <Route path="/evaluation" component={EvaluationDashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
