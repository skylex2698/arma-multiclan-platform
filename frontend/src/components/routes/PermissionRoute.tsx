import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { MainLayout } from '../layout/MainLayout';
import type { Permission } from '../../utils/permissions';
import { hasPermission } from '../../utils/permissions';

interface PermissionRouteProps {
  children: React.ReactNode;
  permission: Permission;
}

export function PermissionRoute({ children, permission }: PermissionRouteProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(user, permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}
