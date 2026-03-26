import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Public auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import CompanyLoginPage from './pages/CompanyLoginPage';
import ParticipantLoginPage from './pages/ParticipantLoginPage';

// Super Admin pages
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import CompaniesPage from './pages/CompaniesPage';
import CompanyAdminsPage from './pages/CompanyAdminsPage';
import AdminReports from './pages/AdminReports'; // reused as Analytics
import CompanyStatusPage from './pages/CompanyStatusPage';
import GlobalReportsPage from './pages/GlobalReportsPage';

// Company Admin pages (existing, served at /company/* routes)
import AdminDashboardOverview from './pages/AdminDashboardOverview';
import AdminPrograms from './pages/AdminPrograms';
import AdminPractices from './pages/AdminPractices';
import AdminParticipants from './pages/AdminParticipants';
import AdminSurveys from './pages/AdminSurveys';
import AdminPledgeWizard from './pages/AdminPledgeWizard';
import CompanyAdminStatusPage from './pages/CompanyAdminStatusPage';
import CompanyAdminDownloadPage from './pages/CompanyAdminDownloadPage';
import CompanyAdminRemindersPage from './pages/CompanyAdminRemindersPage';

// Participant pages (existing, served at /participant/* routes)
import DashboardPage from './pages/DashboardPage';
import PledgePage from './pages/PledgePage';
import PledgeSuccessPage from './pages/PledgeSuccessPage';
import MyPledgesPage from './pages/MyPledgesPage';
import MySurveysPage from './pages/MySurveysPage';
import SurveyFormPage from './pages/SurveyFormPage';

// Smart root redirect based on role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'company_admin' || user.role === 'admin') return <Navigate to="/company/dashboard" replace />;
  return <Navigate to="/participant/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              },
            }}
          />
          <Routes>
            {/* ── Public routes ─────────────────────────────────── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/company/login" element={<CompanyLoginPage />} />
            <Route path="/participant/login" element={<ParticipantLoginPage />} />

            {/* ── Super Admin routes ─────────────────────────────── */}
            <Route element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/admin/companies" element={<CompaniesPage />} />
              <Route path="/admin/company-admins" element={<CompanyAdminsPage />} />
              <Route path="/admin/wizard" element={<AdminPledgeWizard />} />
              <Route path="/admin/programs" element={<AdminPrograms />} />
              <Route path="/admin/analytics" element={<AdminReports />} />
              <Route path="/admin/company-status" element={<CompanyStatusPage />} />
              <Route path="/admin/global-reports" element={<GlobalReportsPage />} />
            </Route>

            {/* ── Company Admin routes ───────────────────────────── */}
            <Route element={
              <ProtectedRoute allowedRoles={['company_admin', 'admin']}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/company/dashboard" element={<AdminDashboardOverview />} />
              <Route path="/company/practices" element={<AdminPractices />} />
              <Route path="/company/surveys" element={<AdminSurveys />} />
              <Route path="/company/reports" element={<AdminReports />} />
              <Route path="/company/participants" element={<AdminParticipants />} />
              <Route path="/company/status" element={<CompanyAdminStatusPage />} />
              <Route path="/company/downloads" element={<CompanyAdminDownloadPage />} />
              <Route path="/company/reminders" element={<CompanyAdminRemindersPage />} />
            </Route>

            {/* ── Participant routes ─────────────────────────────── */}
            <Route element={
              <ProtectedRoute allowedRoles={['participant']}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/participant/dashboard" element={<DashboardPage />} />
              <Route path="/participant/pledge" element={<PledgePage />} />
              <Route path="/participant/pledges" element={<MyPledgesPage />} />
              <Route path="/participant/surveys" element={<MySurveysPage />} />
              <Route path="/participant/survey/:id" element={<SurveyFormPage />} />
              <Route path="/pledge-success" element={<PledgeSuccessPage />} />
            </Route>

            {/* Legacy routes – keep for backward compatibility */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pledge" element={<PledgePage />} />
              <Route path="/my-pledges" element={<MyPledgesPage />} />
              <Route path="/my-surveys" element={<MySurveysPage />} />
              <Route path="/survey/:id" element={<SurveyFormPage />} />
              <Route path="/admin" element={<AdminDashboardOverview />} />
              <Route path="/admin/programs" element={<AdminPrograms />} />
              <Route path="/admin/practices" element={<AdminPractices />} />
              <Route path="/admin/participants" element={<AdminParticipants />} />
              <Route path="/admin/surveys" element={<AdminSurveys />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/wizard" element={<AdminPledgeWizard />} />
            </Route>

            {/* ── Catch-all ──────────────────────────────────────── */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
