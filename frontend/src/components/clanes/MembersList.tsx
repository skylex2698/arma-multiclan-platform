import { Badge } from '../ui/Badge';
import { UserAvatar } from '../ui/UserAvatar';
import type { User } from '../../types';

interface MembersListProps {
  members: User[];
}

export function MembersList({ members }: MembersListProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'danger' as const;
      case 'CLAN_LEADER':
        return 'warning' as const;
      default:
        return 'info' as const;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'CLAN_LEADER':
        return 'Líder de Clan';
      default:
        return 'Miembro';
    }
  };

  if (members.length === 0) {
    return (
      <p className="text-military-500 dark:text-gray-500 text-center py-8">
        No hay miembros en este clan
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-military-200 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <UserAvatar user={member} size="lg" showBorder={true} />
            <div>
              <p className="font-medium text-military-900 dark:text-gray-100">
                {member.nickname}
              </p>
              <p className="text-sm text-military-600 dark:text-gray-400">
                {member.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={getRoleBadgeVariant(member.role)}>
              {getRoleLabel(member.role)}
            </Badge>
            <Badge variant={member.status === 'ACTIVE' ? 'success' : 'default'}>
              {member.status === 'ACTIVE' ? 'Activo' : member.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}