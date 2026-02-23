import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

import LoginPage from './pages/LoginPage';
import OtpVerifyPage from './pages/OtpVerifyPage';
import DashboardPage from './pages/DashboardPage';
import PledgePage from './pages/PledgePage';
import MyPledgesPage from './pages/MyPledgesPage';
import AdminDashboardOverview from './pages/AdminDashboardOverview';
import AdminPrograms from './pages/AdminPrograms';
import AdminPractices from './pages/AdminPractices';
import AdminParticipants from './pages/AdminParticipants';
import AdminSurveys from './pages/AdminSurveys';
import AdminReports from './pages/AdminReports';
import AdminPledgeWizard from './pages/AdminPledgeWizard';

function App() {
  return (
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
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-otp" element={<OtpVerifyPage />} />

          {/* Protected routes — inside layout */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pledge" element={<PledgePage />} />
            <Route path="/my-pledges" element={<MyPledgesPage />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboardOverview /></ProtectedRoute>} />
            <Route path="/admin/programs" element={<ProtectedRoute adminOnly><AdminPrograms /></ProtectedRoute>} />
            <Route path="/admin/practices" element={<ProtectedRoute adminOnly><AdminPractices /></ProtectedRoute>} />
            <Route path="/admin/participants" element={<ProtectedRoute adminOnly><AdminParticipants /></ProtectedRoute>} />
            <Route path="/admin/surveys" element={<ProtectedRoute adminOnly><AdminSurveys /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute adminOnly><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/wizard" element={<ProtectedRoute adminOnly><AdminPledgeWizard /></ProtectedRoute>} />
          </Route>

          {/* Catch-all */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
