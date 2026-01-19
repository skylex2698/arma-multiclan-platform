import { User, Crown, Shield } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { User as UserType } from '../../types';

interface MembersListProps {
  members: UserType[];
}

export function MembersList({ members }: MembersListProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="danger">Admin</Badge>;
      case 'CLAN_LEADER':
        return <Badge variant="warning">Líder</Badge>;
      default:
        return <Badge variant="default">Miembro</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Activo</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'BLOCKED':
        return <Badge variant="danger">Bloqueado</Badge>;
      case 'BANNED':
        return <Badge variant="danger">Baneado</Badge>;
      case 'INACTIVE':
        return <Badge variant="default">Inactivo</Badge>;
      default:
        return null;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4 text-red-600" />;
      case 'CLAN_LEADER':
        return <Shield className="h-4 w-4 text-yellow-600" />;
      default:
        return <User className="h-4 w-4 text-military-600" />;
    }
  };

  return (
    <div className="space-y-2">
      {members.length === 0 ? (
        <div className="text-center py-8 text-military-500">
          No hay miembros en este clan
        </div>
      ) : (
        members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 bg-military-50 rounded-lg hover:bg-military-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-military-200 p-2 rounded-full">
                {getRoleIcon(member.role)}
              </div>
              <div>
                <p className="font-medium text-military-900">
                  {member.nickname}
                </p>
                <p className="text-sm text-military-600">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getRoleBadge(member.role)}
              {getStatusBadge(member.status)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}