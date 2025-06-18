import React from "react";
import { Route, Switch } from "wouter";
import Login from "./pages/Login";
import OnboardingNew from "./pages/OnboardingNew";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/not-found";
import "./index.css";

function App() {
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

export default App;
