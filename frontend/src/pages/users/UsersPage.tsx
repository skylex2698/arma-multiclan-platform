import { useState } from 'react';
import { Search, Filter, UserCheck } from 'lucide-react';
import {
  useUsers,
  useValidateUser,
  useChangeUserRole,
  useChangeUserStatus,
} from '../../hooks/useUsers';
import { useClans } from '../../hooks/useClans';
import { UserCard } from '../../components/users/UserCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { UserRole, UserStatus } from '../../types';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [clanFilter, setClanFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: usersData, isLoading } = useUsers({
    clanId: clanFilter || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  const { data: clansData } = useClans();
  const validateUser = useValidateUser();
  const changeRole = useChangeUserRole();
  const changeStatus = useChangeUserStatus();

  const filteredUsers =
    usersData?.users.filter(
      (user) =>
        user.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const pendingUsers = filteredUsers.filter((u) => u.status === 'PENDING');
  const activeUsers = filteredUsers.filter((u) => u.status !== 'PENDING');

  const handleValidate = async (userId: string) => {
    try {
      await validateUser.mutateAsync(userId);
    } catch (error) {
      console.error('Error validating user:', error);
    }
  };

  const handleChangeRole = async (userId: string, role: UserRole) => {
    try {
      await changeRole.mutateAsync({ userId, role });
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  const handleChangeStatus = async (userId: string, status: UserStatus) => {
    try {
      await changeStatus.mutateAsync({ userId, status });
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-military-900">
          Gestión de Usuarios
        </h1>
        <p className="text-military-600 mt-1">
          {usersData?.count || 0} usuarios registrados
          {pendingUsers.length > 0 && (
            <span className="ml-2 text-yellow-600 font-medium">
              • {pendingUsers.length} pendientes de validación
            </span>
          )}
        </p>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-military-600" />
          <h2 className="text-lg font-semibold text-military-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-military-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-military-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre o email..."
                className="input pl-10"
              />
            </div>
          </div>

          {/* Clan */}
          <div>
            <label className="block text-sm font-medium text-military-700 mb-1">
              Clan
            </label>
            <select
              value={clanFilter}
              onChange={(e) => setClanFilter(e.target.value)}
              className="input"
            >
              <option value="">Todos los clanes</option>
              {clansData?.clans.map((clan) => (
                <option key={clan.id} value={clan.id}>
                  {clan.tag ? `${clan.tag} - ` : ''}
                  {clan.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-military-700 mb-1">
              Rol
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="">Todos los roles</option>
              <option value="USER">Usuario</option>
              <option value="CLAN_LEADER">Líder de Clan</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-military-700 mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="ACTIVE">Activos</option>
              <option value="BLOCKED">Bloqueados</option>
              <option value="BANNED">Baneados</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Usuarios pendientes */}
      {pendingUsers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-bold text-military-900">
              Usuarios Pendientes de Validación
            </h2>
            <span className="badge badge-warning">{pendingUsers.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onValidate={handleValidate}
                isLoading={validateUser.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Usuarios activos */}
      <div>
        <h2 className="text-xl font-bold text-military-900 mb-4">
          Todos los Usuarios
        </h2>
        {activeUsers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-military-600">
              {searchQuery || clanFilter || roleFilter || statusFilter
                ? 'No se encontraron usuarios con estos filtros'
                : 'No hay usuarios registrados'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onChangeRole={handleChangeRole}
                onChangeStatus={handleChangeStatus}
                isLoading={
                  changeRole.isPending || changeStatus.isPending
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}