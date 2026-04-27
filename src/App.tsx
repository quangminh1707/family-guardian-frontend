import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { useSignalR } from './hooks/useSignalR';
import { useHeartbeat } from './hooks/useHeartbeat';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ChildDetailPage from './pages/ChildDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import ExtensionGuidePage from './pages/ExtensionGuidePage';
import { ThemeProvider } from './components/theme';

function AuthenticatedApp() {
  // Activate real-time features
  useSignalR();
  useHeartbeat();

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <AuthenticatedApp /> : <Navigate to="/login" replace />;
};

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <ThemeProvider />
      <BrowserRouter>
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
          />
          
          {/* Public routes */}
          <Route path="/guide/extension" element={<ExtensionGuidePage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/children/:childId" element={<ChildDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
