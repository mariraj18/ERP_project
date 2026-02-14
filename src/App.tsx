import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Settings from './pages/Settings';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-secondary flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={getDashboardRoute(user.role)} />} />
      
      <Route path="/super-admin" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
          <Layout>
            <SuperAdminDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/staff" element={
        <ProtectedRoute allowedRoles={['STAFF']}>
          <Layout>
            <StaffDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <Layout>
            <StudentDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/profile/:userType/:userId" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'STAFF', 'STUDENT']}>
          <Layout>
            <ProfilePage />
          </Layout>
        </ProtectedRoute>
      } />

      
      <Route path="/" element={
        user ? <Navigate to={getDashboardRoute(user.role)} /> : <Navigate to="/login" />
      } />
      
      <Route path="/unauthorized" element={
        <div className="min-h-screen bg-theme-secondary flex items-center justify-center transition-colors duration-300">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-theme-primary mb-4">Unauthorized Access</h1>
            <p className="text-theme-secondary">You don't have permission to access this page.</p>
          </div>
        </div>
      } />
    </Routes>
  );
}

function getDashboardRoute(role: string) {
  switch (role) {
    case 'SUPER_ADMIN': return '/super-admin';
    case 'STAFF': return '/staff';
    case 'STUDENT': return '/student';
    default: return '/login';
  }
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-theme-secondary transition-colors duration-300">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;