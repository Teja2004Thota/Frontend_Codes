import { useState, useEffect, JSX } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster as ShadToaster } from '@/components/ui/sonner';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import UserDashboard from './pages/UserDashboard';
import SubAdminDashboard from './pages/SubAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

// ✅ Protected route with role + token check
const ProtectedRoute = ({
  allowedRole,
  children,
}: {
  allowedRole: string;
  children: JSX.Element;
}) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || !role || role !== allowedRole) {
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
  }, [allowedRole]);

  if (isAuthorized === null) return null; // Spinner or loader can go here
  if (!isAuthorized) return <Navigate to="/login" replace />;
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* ✅ Both Toasters */}
      <ShadToaster />
      <SonnerToaster />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* ✅ App Routing */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subadmin"
          element={
            <ProtectedRoute allowedRole="subadmin">
              <SubAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
