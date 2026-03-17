import { Link } from 'react-router-dom';
import { AlertCircle, Calendar, Plus, UserCheck, Users } from 'lucide-react';
import { Card } from './Card';
import type { UserRole } from '../../types';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';

interface QuickActionsProps {
  userRole: UserRole;
  pendingUsers?: number;
  pendingRequests?: number;
  pendingClanCreationRequests?: number;
}

export function QuickActions({
  userRole,
  pendingUsers = 0,
  pendingRequests = 0,
  pendingClanCreationRequests = 0,
}: QuickActionsProps) {
  const user = { role: userRole };
  const canManageUsers = hasPermission(user, PERMISSIONS.USER_VIEW);
  const canCreateEvents = hasPermission(user, PERMISSIONS.EVENT_CREATE);
  const canReviewClanRequests = userRole === 'ADMIN' || userRole === 'CLAN_LEADER';
  const actions = [
    {
      name: 'Validar usuarios',
      description:
        pendingUsers > 0
          ? `${pendingUsers} pendiente${pendingUsers !== 1 ? 's' : ''}`
          : 'Sin validaciones pendientes',
      icon: UserCheck,
      href: '/users',
      color: pendingUsers > 0 ? 'bg-amber-500' : 'bg-slate-400',
      show: canManageUsers,
      emphasize: pendingUsers > 0,
    },
    {
      name: 'Solicitudes de clan',
      description:
        pendingRequests > 0
          ? `${pendingRequests} pendiente${pendingRequests !== 1 ? 's' : ''}`
          : 'Sin solicitudes pendientes',
      icon: AlertCircle,
      href: '/users/requests',
      color: pendingRequests > 0 ? 'bg-red-500' : 'bg-slate-400',
      show: canReviewClanRequests,
      emphasize: pendingRequests > 0,
    },
    {
      name: 'Nuevos clanes',
      description:
        pendingClanCreationRequests > 0
          ? `${pendingClanCreationRequests} pendiente${pendingClanCreationRequests !== 1 ? 's' : ''}`
          : 'Sin solicitudes pendientes',
      icon: AlertCircle,
      href: '/users/clan-creation-requests',
      color: pendingClanCreationRequests > 0 ? 'bg-red-500' : 'bg-slate-400',
      show: userRole === 'ADMIN',
      emphasize: pendingClanCreationRequests > 0,
    },
    {
      name: 'Crear evento',
      description: 'Crear una misión nueva',
      icon: Plus,
      href: '/events/create',
      color: 'bg-green-500',
      show: canCreateEvents,
      emphasize: false,
    },
    {
      name: 'Ver personal',
      description: 'Abrir gestión de usuarios',
      icon: Users,
      href: '/users',
      color: 'bg-blue-500',
      show: canManageUsers,
      emphasize: false,
    },
    {
      name: 'Ver eventos',
      description: 'Abrir listado de eventos',
      icon: Calendar,
      href: '/events',
      color: 'bg-blue-500',
      show: !canManageUsers && !canCreateEvents,
      emphasize: false,
    },
  ];

  const visibleActions = actions.filter((action) => action.show);

  return (
    <Card>
      <h2 className="text-xl font-bold text-military-900 mb-4">
        Acciones Rápidas
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {visibleActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className={`flex flex-col items-center rounded-lg border p-4 transition-all group ${
                action.emphasize
                  ? 'border-amber-300 bg-amber-50/70 hover:border-amber-500 hover:shadow-md'
                  : 'border-military-200 hover:border-primary-500 hover:shadow-md'
              }`}
            >
              <div
                className={`${action.color} p-3 rounded-full mb-3 group-hover:scale-110 transition-transform`}
              >
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <p className="font-medium text-military-900 text-center text-sm">
                {action.name}
              </p>
              <p className="text-xs text-military-600 text-center mt-1">
                {action.description}
              </p>
            </Link>
          ))}
      </div>
    </Card>
  );
}
