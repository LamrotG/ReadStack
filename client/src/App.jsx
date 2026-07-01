import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import PublicLayout from "./components/PublicLayout";
import AuthCallback from "./pages/AuthCallback";
import AuthChoice from "./pages/AuthChoice";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import ResetPassword from "./pages/ResetPassword";
import Signup from "./pages/Signup";
import About from "./pages/About";
import Help from "./pages/Help";
import Settings from "./pages/Settings";

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading…</span>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/auth/login" replace />;
  if (!user.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return children;
}

function OnboardingRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/auth/login" replace />;
  if (user.onboarding_complete) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user)    return <Navigate to={user.onboarding_complete ? "/dashboard" : "/onboarding"} replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public pages with persistent nav + footer */}
            <Route path="/" element={
              <PublicRoute>
                <PublicLayout><Landing /></PublicLayout>
              </PublicRoute>
            } />
            <Route path="/auth" element={
              <PublicRoute>
                <PublicLayout><AuthChoice /></PublicLayout>
              </PublicRoute>
            } />
            <Route path="/auth/signup" element={
              <PublicRoute>
                <PublicLayout><Signup /></PublicLayout>
              </PublicRoute>
            } />
            <Route path="/auth/login" element={
              <PublicRoute>
                <PublicLayout><Login /></PublicLayout>
              </PublicRoute>
            } />
            <Route path="/auth/forgot-password" element={
              <PublicLayout><ForgotPassword /></PublicLayout>
            } />
            <Route path="/auth/reset-password" element={
              <PublicLayout><ResetPassword /></PublicLayout>
            } />
            <Route path="/about" element={
              <PublicLayout><About /></PublicLayout>
            } />
            <Route path="/help" element={
              <PublicLayout><Help /></PublicLayout>
            } />

            {/* Auth callback (legacy, no layout) */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* App routes */}
            <Route path="/onboarding" element={
              <OnboardingRoute><Onboarding /></OnboardingRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><Settings /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
