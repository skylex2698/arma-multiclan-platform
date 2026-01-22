import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './components/layout/MainLayout';
import { AdminOrClanLeaderRoute } from './components/routes/AdminOrClanLeaderRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DiscordCallbackPage from './pages/auth/DiscordCallbackPage';
import PendingApprovalPage from './pages/auth/PendingApprovalPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EventsPage from './pages/events/EventsPage';
import EventDetailPage from './pages/events/EventDetailPage';
import CreateEventPage from './pages/events/CreateEventPage';
import CreateEventFromTemplatePage from './pages/events/CreateEventFromTemplatePage';
import EditEventPage from './pages/events/EditEventPage';
import ClanesPage from './pages/clanes/ClanesPage';
import ClanDetailPage from './pages/clanes/ClanDetailPage';
import CreateClanPage from './pages/clanes/CreateClanPage';
import EditClanPage from './pages/clanes/EditClanPage';
import UsersPage from './pages/users/UsersPage';
import ProfilePage from './pages/profile/ProfilePage';
import EditCommunicationTreePage from './pages/events/EditCommunicationTreePage';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

// Admin Route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/auth/discord/success',
    element: <DiscordCallbackPage />,
  },
  {
    path: '/auth/discord/callback',
    element: <DiscordCallbackPage />,
  },
  {
    path: '/auth/pending',
    element: <PendingApprovalPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/events',
    element: (
      <ProtectedRoute>
        <EventsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/events/create',
    element: (
      <AdminRoute>
        <CreateEventPage />
      </AdminRoute>
    ),
  },
  {
    path: '/events/from-template/:templateId',
    element: (
      <AdminRoute>
        <CreateEventFromTemplatePage />
      </AdminRoute>
    ),
  },
  {
    path: '/events/:id/edit',
    element: (
      <ProtectedRoute>
        <EditEventPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/events/:id/communications/edit',
    element: (
      <ProtectedRoute>
        <EditCommunicationTreePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/events/:id',
    element: (
      <ProtectedRoute>
        <EventDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/clanes',
    element: (
      <ProtectedRoute>
        <ClanesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/clanes/create',
    element: (
      <AdminRoute>
        <CreateClanPage />
      </AdminRoute>
    ),
  },
  {
    path: '/clanes/:id/edit',
    element: (
      <ProtectedRoute>
        <EditClanPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/clanes/:id',
    element: (
      <ProtectedRoute>
        <ClanDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <AdminOrClanLeaderRoute>
        <UsersPage />
      </AdminOrClanLeaderRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);