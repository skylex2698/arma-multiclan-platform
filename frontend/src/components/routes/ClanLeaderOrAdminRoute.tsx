import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { MainLayout } from '../layout/MainLayout';

interface ClanLeaderOrAdminRouteProps {
  children: React.ReactNode;
}

export function ClanLeaderOrAdminRoute({ children }: ClanLeaderOrAdminRouteProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN' && user?.role !== 'CLAN_LEADER') {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}
