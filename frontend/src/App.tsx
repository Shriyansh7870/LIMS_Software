import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import Layout from '@/components/layout/Layout';
import LoginPage from '@/pages/LoginPage';
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import Registry from '@/pages/Registry';
import Equipment from '@/pages/Equipment';
import Certifications from '@/pages/Certifications';
import Partners from '@/pages/Partners';
import Finder from '@/pages/Finder';
import Capa from '@/pages/Capa';
import Audits from '@/pages/Audits';
import Sop from '@/pages/Sop';
import Bmr from '@/pages/Bmr';
import Dms from '@/pages/Dms';
import Requests from '@/pages/Requests';
import Workflows from '@/pages/Workflows';
import Integrations from '@/pages/Integrations';
import Onboarding from '@/pages/Onboarding';
import BulkImport from '@/pages/BulkImport';
import { useAuth } from '@/context/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-teal"
            style={{ background: 'linear-gradient(135deg, #DDB84A, #A67D16)' }}>
            <span className="text-white font-bold font-syne text-xl">Q</span>
          </div>
          <div className="flex gap-1.5">
            {[0, 150, 300].map((delay) => (
              <span key={delay} className="w-2 h-2 rounded-full bg-teal animate-bounce"
                style={{ animationDelay: `${delay}ms` }} />
            ))}
          </div>
          <p className="text-text-dim text-sm font-mono">Loading Quantum Kairoz...</p>
        </div>
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes — wrapped in Layout via a pathless layout route */}
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/registry" element={<Registry />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/certifications" element={<Certifications />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/finder" element={<Finder />} />
            <Route path="/capa" element={<Capa />} />
            <Route path="/audits" element={<Audits />} />
            <Route path="/sop" element={<Sop />} />
            <Route path="/bmr" element={<Bmr />} />
            <Route path="/dms" element={<Dms />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/bulk-import" element={<BulkImport />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}
