import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { MainLayout } from '../layout/MainLayout';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';

interface AdminOrClanLeaderRouteProps {
  children: React.ReactNode;
}

export function AdminOrClanLeaderRoute({ children }: AdminOrClanLeaderRouteProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(user, PERMISSIONS.USER_VIEW)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}
