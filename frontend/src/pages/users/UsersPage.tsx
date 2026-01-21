import { useState } from 'react';
import { Users, Search, Filter } from 'lucide-react';
import { useUsers, useUpdateUserRole, useUpdateUserStatus } from '../../hooks/useUsers';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { UserAvatar } from '../../components/ui/UserAvatar';
import type { UserRole, UserStatus } from '../../types';
import { useAuthStore } from '../../store/authStore';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clanFilter, setClanFilter] = useState<string>('ALL');

  // Obtener el usuario actual para verificar permisos
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isClanLeader = currentUser?.role === 'CLAN_LEADER';

  const { data, isLoading } = useUsers({
    search: search || undefined,
    role: roleFilter !== 'ALL' ? (roleFilter as UserRole) : undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as UserStatus) : undefined,
  });

  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();

  const users = data?.users || [];

  // Obtener lista única de clanes
  const clans = Array.from(
    new Set(users.filter((u) => u.clan).map((u) => u.clan!.id))
  ).map((id) => users.find((u) => u.clan?.id === id)?.clan).filter(Boolean) as NonNullable<typeof users[0]['clan']>[];

  // Filtrar por clan
  const filteredUsers =
    clanFilter !== 'ALL'
      ? users.filter((u) => u.clanId === clanFilter)
      : users;

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
    } catch (err) {
      console.error('Error al actualizar rol:', err);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      await updateStatus.mutateAsync({ userId, status: newStatus });
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

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
        return 'Admin';
      case 'CLAN_LEADER':
        return 'Líder';
      default:
        return 'Miembro';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-military-900 dark:text-gray-100">
            {isClanLeader ? 'Gestión de Personal' : 'Gestión de Usuarios'}
          </h1>
          <p className="text-military-600 dark:text-gray-400 mt-1">
            {filteredUsers.length} {isClanLeader ? 'miembros del clan' : 'usuarios registrados'}
          </p>
          {isClanLeader && (
            <p className="text-sm text-military-500 dark:text-gray-500 mt-2">
              ℹ️ Como líder de clan, solo puedes ver y gestionar a los miembros de tu clan
            </p>
          )}
        </div>
        <Users className="h-8 w-8 text-primary-600 dark:text-tactical-500" />
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-military-600 dark:text-gray-400" />
          <h2 className="text-lg font-bold text-military-900 dark:text-gray-100">
            Filtros
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-military-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
                placeholder="Nombre o email..."
              />
            </div>
          </div>

          {/* Filtro de Clan - Solo visible para Admin */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1">
                Clan
              </label>
              <select
                value={clanFilter}
                onChange={(e) => setClanFilter(e.target.value)}
                className="input"
              >
                <option value="ALL">Todos los clanes</option>
                {clans.map((clan) => (
                  <option key={clan.id} value={clan.id}>
                    [{clan.tag}] {clan.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Rol */}
          <div>
            <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1">
              Rol
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="ALL">Todos los roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="CLAN_LEADER">Líder de Clan</option>
              <option value="USER">Usuario</option>
            </select>
          </div>

          {/* Filtro de Estado */}
          <div>
            <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activo</option>
              <option value="PENDING">Pendiente</option>
              <option value="BLOCKED">Bloqueado</option>
              <option value="BANNED">Baneado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de usuarios */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-military-900 dark:text-gray-100">
          {isClanLeader ? 'Miembros del Clan' : 'Todos los Usuarios'}
        </h2>

        {filteredUsers.length === 0 ? (
          <Card>
            <p className="text-center text-military-500 dark:text-gray-500 py-8">
              No se encontraron usuarios
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <UserAvatar user={user} size="xl" showBorder={true} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-military-900 dark:text-gray-100 truncate">
                      {user.nickname}
                    </h3>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge
                        variant={
                          user.status === 'ACTIVE'
                            ? 'success'
                            : user.status === 'PENDING'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {user.status === 'ACTIVE' ? 'Activo' : user.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <p className="text-sm text-military-600 dark:text-gray-400 mb-4 truncate">
                  📧 {user.email}
                </p>

                {/* Clan */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-military-600 dark:text-gray-400 mb-1">
                    Clan:
                  </p>
                  <div className="bg-white dark:bg-gray-700 rounded p-2 border border-military-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-military-900 dark:text-gray-100">
                      {user.clan ? `${user.clan.tag} ${user.clan.name}` : 'Sin clan'}
                    </p>
                  </div>
                </div>

                {/* Controles */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Control de Rol - Solo Admin puede ver y editar */}
                  <div>
                    <label className="block text-xs font-medium text-military-600 dark:text-gray-400 mb-1">
                      Rol
                    </label>
                    {isAdmin ? (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as UserRole)
                        }
                        disabled={updateRole.isPending}
                        className="input text-sm w-full"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="CLAN_LEADER">Líder</option>
                        <option value="USER">Usuario</option>
                      </select>
                    ) : (
                      <div className="input text-sm w-full bg-gray-100 dark:bg-gray-800 cursor-not-allowed">
                        {getRoleLabel(user.role)}
                      </div>
                    )}
                  </div>

                  {/* Control de Estado - Admin y Líder de Clan pueden editar */}
                  <div>
                    <label className="block text-xs font-medium text-military-600 dark:text-gray-400 mb-1">
                      Estado
                    </label>
                    <select
                      value={user.status}
                      onChange={(e) =>
                        handleStatusChange(user.id, e.target.value as UserStatus)
                      }
                      disabled={updateStatus.isPending}
                      className="input text-sm w-full"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="PENDING">Pendiente</option>
                      <option value="BLOCKED">Bloqueado</option>
                      <option value="BANNED">Baneado</option>
                    </select>
                  </div>
                </div>

                {/* Nota informativa para líderes de clan */}
                {isClanLeader && (
                  <div className="mt-3 text-xs text-military-500 dark:text-gray-500 italic">
                    * Solo puedes cambiar el estado, no el rol
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}