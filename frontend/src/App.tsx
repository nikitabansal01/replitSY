import React, { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "./context/AuthContext";
import { useProfile } from "./context/ProfileContext";
import Login from "./pages/Login";
import OnboardingNew from "./pages/OnboardingNew";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/not-found";
import "./index.css";

function Router() {
  const { user, loading, token } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && token && user) {
      // User is authenticated, check if they need onboarding or can go to dashboard
      // Check if this is a new signup
      const isNewSignup = localStorage.getItem('isNewSignup') === 'true';
      
      if (isNewSignup) {
        // New user, redirect to onboarding
        localStorage.removeItem('isNewSignup'); // Clear the flag
        setLocation('/onboarding');
      } else if (location === '/') {
        // Existing user on login page, check if they have completed onboarding
        if (!profileLoading) {
          if (profile && profile.onboarding) {
            // User has completed onboarding, redirect to dashboard
            setLocation('/dashboard');
          } else {
            // User hasn't completed onboarding, redirect to onboarding
            setLocation('/onboarding');
          }
        }
      }
    } else if (!loading && !token && location !== '/') {
      // User is not authenticated, redirect to login
      setLocation('/');
    }
  }, [user, loading, token, location, setLocation, profile, profileLoading]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/onboarding" component={OnboardingNew} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={AdminLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;
