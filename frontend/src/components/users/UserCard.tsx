import { User as UserIcon, Shield, Crown, Mail } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { User, UserRole, UserStatus } from '../../types';

interface UserCardProps {
  user: User;
  onValidate?: (userId: string) => void;
  onChangeRole?: (userId: string, role: UserRole) => void;
  onChangeStatus?: (userId: string, status: UserStatus) => void;
  isLoading?: boolean;
}

export function UserCard({
  user,
  onValidate,
  onChangeRole,
  onChangeStatus,
  isLoading,
}: UserCardProps) {
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
        return <Crown className="h-5 w-5 text-red-600" />;
      case 'CLAN_LEADER':
        return <Shield className="h-5 w-5 text-yellow-600" />;
      default:
        return <UserIcon className="h-5 w-5 text-military-600" />;
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-military-100 p-3 rounded-full">
            {getRoleIcon(user.role)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-military-900">
              {user.nickname}
            </h3>
            <div className="flex items-center text-sm text-military-600 mt-1">
              <Mail className="h-3 w-3 mr-1" />
              {user.email}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {getRoleBadge(user.role)}
          {getStatusBadge(user.status)}
        </div>
      </div>

      {user.clan && (
        <div className="mb-4 p-3 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-900">
            <strong>Clan:</strong> {user.clan.tag && `${user.clan.tag} `}
            {user.clan.name}
          </p>
        </div>
      )}

      {user.status === 'PENDING' && onValidate && (
        <button
          onClick={() => onValidate(user.id)}
          disabled={isLoading}
          className="w-full btn btn-primary btn-sm"
        >
          Validar Usuario
        </button>
      )}

      {user.status !== 'PENDING' && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {onChangeRole && (
            <select
              value={user.role}
              onChange={(e) => onChangeRole(user.id, e.target.value as UserRole)}
              disabled={isLoading}
              className="input text-sm"
            >
              <option value="USER">Usuario</option>
              <option value="CLAN_LEADER">Líder</option>
              <option value="ADMIN">Admin</option>
            </select>
          )}

          {onChangeStatus && (
            <select
              value={user.status}
              onChange={(e) => onChangeStatus(user.id, e.target.value as UserStatus)}
              disabled={isLoading}
              className="input text-sm"
            >
              <option value="ACTIVE">Activo</option>
              <option value="BLOCKED">Bloqueado</option>
              <option value="BANNED">Baneado</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          )}
        </div>
      )}
    </Card>
  );
}