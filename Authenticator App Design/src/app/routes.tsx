import { createBrowserRouter, Navigate } from "react-router";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";

// Check if user has completed onboarding
const hasCompletedOnboarding = () => {
  return localStorage.getItem("onboarding_completed") === "true";
};

// Check if user is authenticated
const isAuthenticated = () => {
  return localStorage.getItem("is_authenticated") === "true";
};

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: hasCompletedOnboarding() ? (
      isAuthenticated() ? (
        <Navigate to="/dashboard" replace />
      ) : (
        <Navigate to="/auth" replace />
      )
    ) : (
      <Navigate to="/onboarding" replace />
    ),
  },
  {
    path: "/onboarding",
    Component: Onboarding,
  },
  {
    path: "/auth",
    Component: Auth,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      {
        path: "dashboard",
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
      },
      {
        path: "settings",
        element: <ProtectedRoute><Settings /></ProtectedRoute>,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
