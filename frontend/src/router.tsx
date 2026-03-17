import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './components/layout/MainLayout';
import { AdminOrClanLeaderRoute } from './components/routes/AdminOrClanLeaderRoute';
import { ClanLeaderOrAdminRoute } from './components/routes/ClanLeaderOrAdminRoute';
import { PermissionRoute } from './components/routes/PermissionRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DiscordCallbackPage from './pages/auth/DiscordCallbackPage';
import DiscordCompleteRegistrationPage from './pages/auth/DiscordCompleteRegistrationPage';
import PendingApprovalPage from './pages/auth/PendingApprovalPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EventsPage from './pages/events/EventsPage';
import EventDetailPage from './pages/events/EventDetailPage';
import CreateEventPage from './pages/events/CreateEventPage';
import CreateEventFromTemplatePage from './pages/events/CreateEventFromTemplatePage';
import EditEventPage from './pages/events/EditEventPage';
import PublicEventPage from './pages/events/PublicEventPage';
import ClanesPage from './pages/clanes/ClanesPage';
import ClanDetailPage from './pages/clanes/ClanDetailPage';
import CreateClanPage from './pages/clanes/CreateClanPage';
import EditClanPage from './pages/clanes/EditClanPage';
import GamesPage from './pages/games/GamesPage';
import FeedbackAdminPage from './pages/feedback/FeedbackAdminPage';
import HelpManualPage from './pages/help/HelpManualPage';
import UsersPage from './pages/users/UsersPage';
import ClanChangeRequestsPage from './pages/users/ClanChangeRequestsPage';
import ClanCreationRequestsPage from './pages/users/ClanCreationRequestsPage';
import ProfilePage from './pages/profile/ProfilePage';
import { hasPermission, PERMISSIONS } from './utils/permissions';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.mustCreateClanOnboarding && location.pathname !== '/clanes/create') {
    return <Navigate to="/clanes/create?onboarding=true" replace />;
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

  if (!hasPermission(user, PERMISSIONS.GAME_MANAGE)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function CreateClanRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const canCreateClan =
    hasPermission(user, PERMISSIONS.CLAN_CREATE) || user?.mustCreateClanOnboarding;

  if (!canCreateClan) {
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
    path: '/auth/discord/complete',
    element: <DiscordCompleteRegistrationPage />,
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
    path: '/help/manual',
    element: (
      <ProtectedRoute>
        <HelpManualPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/events/public/:token',
    element: <PublicEventPage />,
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
      <PermissionRoute permission={PERMISSIONS.EVENT_CREATE}>
        <CreateEventPage />
      </PermissionRoute>
    ),
  },
  {
    path: '/events/from-template/:templateId',
    element: (
      <PermissionRoute permission={PERMISSIONS.EVENT_CREATE}>
        <CreateEventFromTemplatePage />
      </PermissionRoute>
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
      <CreateClanRoute>
        <CreateClanPage />
      </CreateClanRoute>
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
    path: '/games',
    element: (
      <AdminRoute>
        <GamesPage />
      </AdminRoute>
    ),
  },
  {
    path: '/feedback',
    element: (
      <PermissionRoute permission={PERMISSIONS.FEEDBACK_MANAGE}>
        <FeedbackAdminPage />
      </PermissionRoute>
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
    path: '/users/requests',
    element: (
      <ClanLeaderOrAdminRoute>
        <ClanChangeRequestsPage />
      </ClanLeaderOrAdminRoute>
    ),
  },
  {
    path: '/users/clan-creation-requests',
    element: (
      <AdminRoute>
        <ClanCreationRequestsPage />
      </AdminRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
