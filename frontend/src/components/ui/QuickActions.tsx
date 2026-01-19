import { Link } from 'react-router-dom';
import { Calendar, Shield, Users, Plus } from 'lucide-react';
import { Card } from './Card';
import type { UserRole } from '../../types';

interface QuickActionsProps {
  userRole: UserRole;
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const actions = [
    {
      name: 'Ver Eventos',
      description: 'Explorar todos los eventos',
      icon: Calendar,
      href: '/events',
      color: 'bg-blue-500',
      show: true,
    },
    {
      name: 'Ver Clanes',
      description: 'Explorar clanes',
      icon: Shield,
      href: '/clanes',
      color: 'bg-purple-500',
      show: true,
    },
    {
      name: 'Crear Evento',
      description: 'Organizar nueva misión',
      icon: Plus,
      href: '/events/create',
      color: 'bg-green-500',
      show: userRole === 'ADMIN' || userRole === 'CLAN_LEADER',
    },
    {
      name: 'Gestionar Usuarios',
      description: 'Administrar usuarios',
      icon: Users,
      href: '/users',
      color: 'bg-red-500',
      show: userRole === 'ADMIN' || userRole === 'CLAN_LEADER',
    },
  ];

  return (
    <Card>
      <h2 className="text-xl font-bold text-military-900 mb-4">
        Accesos Rápidos
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions
          .filter((action) => action.show)
          .map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="flex flex-col items-center p-4 rounded-lg border border-military-200 hover:border-primary-500 hover:shadow-md transition-all group"
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