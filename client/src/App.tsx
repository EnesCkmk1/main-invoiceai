import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { needsOnboarding } from "./lib/onboarding";
import { FullPageSpinner } from "./components/ui";
import { AppLayout } from "./layouts/AppLayout";

import LandingPage from "./pages/LandingPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import MagicLinkPage from "./pages/auth/MagicLinkPage";
import DashboardPage from "./pages/app/DashboardPage";
import CustomersPage from "./pages/app/CustomersPage";
import CustomerDetailPage from "./pages/app/CustomerDetailPage";
import InvoicesPage from "./pages/app/InvoicesPage";
import InvoiceEditorPage from "./pages/app/InvoiceEditorPage";
import InvoiceDetailPage from "./pages/app/InvoiceDetailPage";
import AnalyticsPage from "./pages/app/AnalyticsPage";
import SettingsPage from "./pages/app/SettingsPage";
import OnboardingPage from "./pages/app/OnboardingPage";
import PublicInvoicePage from "./pages/PublicInvoicePage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { company, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (needsOnboarding(company)) return <Navigate to="/app/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingOnlyRoute({ children }: { children: React.ReactNode }) {
  const { company, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!needsOnboarding(company)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, company, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to={needsOnboarding(company) ? "/app/onboarding" : "/app"} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/pay/:token" element={<PublicInvoicePage />} />

      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset" element={<ResetPasswordPage />} />
      <Route path="/auth/magic" element={<MagicLinkPage />} />

      <Route
        path="/app/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingOnlyRoute>
              <OnboardingPage />
            </OnboardingOnlyRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <OnboardingGate>
              <AppLayout />
            </OnboardingGate>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/new" element={<InvoiceEditorPage />} />
        <Route path="invoices/:id/edit" element={<InvoiceEditorPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
