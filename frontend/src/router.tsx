import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import type { ReactNode } from 'react';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EventsPage from './pages/events/EventsPage';
import EventDetailPage from './pages/events/EventDetailPage';
import ClanesPage from './pages/clanes/ClanesPage';
import UsersPage from './pages/users/UsersPage';
import CreateEventPage from './pages/events/CreateEventPage';
import ClanDetailPage from './pages/clanes/ClanDetailPage';
import ClanRequestsPage from './pages/users/ClanRequestsPage';
import CreateClanPage from './pages/clanes/CreateClanPage';
import EditClanPage from './pages/clanes/EditClanPage';
import EditEventPage from './pages/events/EditEventPage';
import CreateEventFromTemplatePage from './pages/events/CreateEventFromTemplatePage';



// Protected Route Component
// eslint-disable-next-line react-refresh/only-export-components
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Admin Route Component
// eslint-disable-next-line react-refresh/only-export-components
function AdminRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  
  if (!user || (user.role !== 'ADMIN' && user.role !== 'CLAN_LEADER')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'events',
        element: <EventsPage />,
      },
      {
        path: 'events/create',
        element: (
          <AdminRoute>
            <CreateEventPage />
          </AdminRoute>
        ),
      },
      {
        path: 'events/from-template/:templateId',
        element: (
          <AdminRoute>
            <CreateEventFromTemplatePage />
          </AdminRoute>
        ),
      },
      {
        path: 'events/:id/edit',
        element: <EditEventPage />,
      },
      {
        path: 'events/:id',
        element: <EventDetailPage />,
      },
      {
        path: 'clanes/:id/edit',
        element: <EditClanPage />,
      },
      {
        path: 'clanes',
        element: <ClanesPage />,
      },
      {
        path: 'clanes/create',
        element: (
          <AdminRoute>
            <CreateClanPage />
          </AdminRoute>
        ),
      },
      {
        path: 'clanes/:id',
        element: <ClanDetailPage />,
      },
      {
        path: 'users/requests',
        element: (
          <AdminRoute>
            <ClanRequestsPage />
          </AdminRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        ),
      },
    ],
  },
]);