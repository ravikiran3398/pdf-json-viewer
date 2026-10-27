import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout.js';
import { UserLayout } from '../layouts/UserLayout.js';
import { AdminLayout } from '../layouts/AdminLayout.js';

// Public Pages
import { HomePage } from '../pages/public/HomePage.js';
import { FeaturesPage } from '../pages/public/FeaturesPage.js';
import { HowItWorksPage } from '../pages/public/HowItWorksPage.js';
import { PricingPage } from '../pages/public/PricingPage.js';
import { DocsPage } from '../pages/public/DocsPage.js';
import { HelpPage } from '../pages/public/HelpPage.js';
import { ContactPage } from '../pages/public/ContactPage.js';
import { EnterprisePage } from '../pages/public/EnterprisePage.js';
import { PrivacyPolicyPage, TermsOfServicePage, CookieNoticePage } from '../pages/public/LegalPages.js';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage.js';
import { RegisterPage } from '../pages/auth/RegisterPage.js';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage.js';

// User Pages
import { OverviewPage } from '../pages/user/OverviewPage.js';
import { UploadPage } from '../pages/user/UploadPage.js';
import { DriveImportPage } from '../pages/user/DriveImportPage.js';
import { DocumentsPage } from '../pages/user/DocumentsPage.js';
import { WorkspacePage } from '../pages/user/WorkspacePage.js';
import { BatchesPage } from '../pages/user/BatchesPage.js';
import { TemplatesPage } from '../pages/user/TemplatesPage.js';
import { UsagePage } from '../pages/user/UsagePage.js';
import { BillingPage } from '../pages/user/BillingPage.js';
import { ApiKeysPage } from '../pages/user/ApiKeysPage.js';
import { WebhooksPage } from '../pages/user/WebhooksPage.js';
import { SupportTicketsPage } from '../pages/user/SupportTicketsPage.js';
import { SettingsPage } from '../pages/user/SettingsPage.js';
import { UserActivityPage } from '../pages/user/UserActivityPage.js';

// Admin Pages
import { AdminOverviewPage } from '../pages/admin/AdminOverviewPage.js';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage.js';
import { AdminDocumentsPage } from '../pages/admin/AdminDocumentsPage.js';
import { AdminJobsPage } from '../pages/admin/AdminJobsPage.js';
import { AdminPlansPage } from '../pages/admin/AdminPlansPage.js';
import { AdminPaymentsPage } from '../pages/admin/AdminPaymentsPage.js';
import { AdminUsagePage } from '../pages/admin/AdminUsagePage.js';
import { AdminSupportPage } from '../pages/admin/AdminSupportPage.js';
import { AdminEnquiriesPage } from '../pages/admin/AdminEnquiriesPage.js';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage.js';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage.js';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage.js';

const ProtectedUserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Authenticating...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Verifying privileges...</div>;
  }
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/enterprise" element={<EnterprisePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/cookies" element={<CookieNoticePage />} />
      </Route>

      {/* Auth Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Authenticated User Dashboard */}
      <Route
        path="/app"
        element={
          <ProtectedUserRoute>
            <UserLayout />
          </ProtectedUserRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="drive" element={<DriveImportPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/:id" element={<WorkspacePage />} />
        <Route path="documents/:id/edit" element={<WorkspacePage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="usage" element={<UsagePage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="api-keys" element={<ApiKeysPage />} />
        <Route path="webhooks" element={<WebhooksPage />} />
        <Route path="activity" element={<UserActivityPage />} />
        <Route path="support" element={<SupportTicketsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Authenticated Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="documents" element={<AdminDocumentsPage />} />
        <Route path="jobs" element={<AdminJobsPage />} />
        <Route path="plans" element={<AdminPlansPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="usage" element={<AdminUsagePage />} />
        <Route path="support" element={<AdminSupportPage />} />
        <Route path="enquiries" element={<AdminEnquiriesPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
