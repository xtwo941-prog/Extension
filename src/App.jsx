import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase.js';
import LoginPage from './pages/LoginPage.jsx';
import DashboardLayout from './pages/DashboardLayout.jsx';
import LicensesPage from './pages/LicensesPage.jsx';
import PackagesPage from './pages/PackagesPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import FeatureFlagsPage from './pages/FeatureFlagsPage.jsx';
import ExtensionVersionsPage from './pages/ExtensionVersionsPage.jsx';

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/dashboard/licenses" replace /> : <LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute session={session}>
            <DashboardLayout session={session} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="licenses" replace />} />
        <Route path="licenses" element={<LicensesPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="feature-flags" element={<FeatureFlagsPage />} />
        <Route path="versions" element={<ExtensionVersionsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
