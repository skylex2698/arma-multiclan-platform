import { useState, useMemo } from 'react';
import { Users, Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { useUsers, useUpdateUserRole, useUpdateUserStatus, useChangeUserClan } from '../../hooks/useUsers';
import { useClans } from '../../hooks/useClans';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { Pagination } from '../../components/ui/Pagination';
import type { UserRole, UserStatus } from '../../types';
import { useAuthStore } from '../../store/authStore';

const ITEMS_PER_PAGE = 15;

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clanFilter, setClanFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<'nickname' | 'role' | 'status'>('nickname');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Obtener el usuario actual para verificar permisos
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isClanLeader = currentUser?.role === 'CLAN_LEADER';

  // Debounce search to avoid too many requests
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useUsers({
    search: debouncedSearch || undefined,
    role: roleFilter !== 'ALL' ? (roleFilter as UserRole) : undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as UserStatus) : undefined,
    clanId: clanFilter !== 'ALL' ? clanFilter : undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const changeClan = useChangeUserClan();

  const { data: clansData } = useClans();
  const allClans = clansData?.clans || [];

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;
  const totalUsers = data?.total || 0;

  // Sort users locally (server returns sorted by role desc, nickname asc)
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'nickname') {
        comparison = a.nickname.localeCompare(b.nickname);
      } else if (sortField === 'role') {
        const roleOrder = { ADMIN: 3, CLAN_LEADER: 2, USER: 1 };
        comparison = (roleOrder[a.role as keyof typeof roleOrder] || 0) - (roleOrder[b.role as keyof typeof roleOrder] || 0);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [users, sortField, sortOrder]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

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

  const handleClanChange = async (userId: string, newClanId: string) => {
    try {
      await changeClan.mutateAsync({ userId, clanId: newClanId === 'null' ? null : newClanId });
    } catch (err) {
      console.error('Error al actualizar clan:', err);
    }
  };

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1); // Reset to first page on filter change
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success' as const;
      case 'PENDING':
        return 'warning' as const;
      case 'BLOCKED':
      case 'BANNED':
        return 'danger' as const;
      default:
        return 'default' as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'PENDING':
        return 'Pendiente';
      case 'BLOCKED':
        return 'Bloqueado';
      case 'BANNED':
        return 'Baneado';
      default:
        return status;
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-military-900 dark:text-gray-100">
            {isClanLeader ? 'Gestión de Personal' : 'Gestión de Usuarios'}
          </h1>
          <p className="text-military-600 dark:text-gray-400 mt-1">
            {totalUsers} {isClanLeader ? 'miembros del clan' : 'usuarios registrados'}
          </p>
          {isClanLeader && (
            <p className="text-sm text-military-500 dark:text-gray-500 mt-2">
              Como líder de clan, solo puedes ver y gestionar a los miembros de tu clan
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
                onChange={(e) => handleFilterChange(setClanFilter)(e.target.value)}
                className="input"
              >
                <option value="ALL">Todos los clanes</option>
                {allClans.map((clan) => (
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
              onChange={(e) => handleFilterChange(setRoleFilter)(e.target.value)}
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
              onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value)}
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

      {/* Tabla de usuarios */}
      <Card>
        <h2 className="text-xl font-bold text-military-900 dark:text-gray-100 mb-4">
          {isClanLeader ? 'Miembros del Clan' : 'Todos los Usuarios'}
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : sortedUsers.length === 0 ? (
          <p className="text-center text-military-500 dark:text-gray-500 py-8">
            No se encontraron usuarios
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-military-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">
                      <button
                        onClick={() => handleSort('nickname')}
                        className="font-semibold text-military-700 dark:text-gray-300 hover:text-military-900 dark:hover:text-gray-100"
                      >
                        Usuario
                        <SortIcon field="nickname" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 hidden md:table-cell">
                      <span className="font-semibold text-military-700 dark:text-gray-300">
                        Email
                      </span>
                    </th>
                    <th className="text-left py-3 px-4">
                      <span className="font-semibold text-military-700 dark:text-gray-300">
                        Clan
                      </span>
                    </th>
                    <th className="text-left py-3 px-4">
                      <button
                        onClick={() => handleSort('role')}
                        className="font-semibold text-military-700 dark:text-gray-300 hover:text-military-900 dark:hover:text-gray-100"
                      >
                        Rol
                        <SortIcon field="role" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4">
                      <button
                        onClick={() => handleSort('status')}
                        className="font-semibold text-military-700 dark:text-gray-300 hover:text-military-900 dark:hover:text-gray-100"
                      >
                        Estado
                        <SortIcon field="status" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-military-100 dark:border-gray-800 hover:bg-military-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* Usuario */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} size="md" showBorder={true} />
                          <div>
                            <p className="font-medium text-military-900 dark:text-gray-100">
                              {user.nickname}
                            </p>
                            <p className="text-sm text-military-500 dark:text-gray-500 md:hidden">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-sm text-military-600 dark:text-gray-400">
                          {user.email}
                        </span>
                      </td>

                      {/* Clan */}
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <select
                            value={user.clanId || 'null'}
                            onChange={(e) => handleClanChange(user.id, e.target.value)}
                            disabled={changeClan.isPending}
                            className="input text-sm py-1 px-2 min-w-[140px]"
                          >
                            <option value="null">Sin clan</option>
                            {allClans.map((clan) => (
                              <option key={clan.id} value={clan.id}>
                                {clan.tag} {clan.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-military-700 dark:text-gray-300">
                            {user.clan ? `${user.clan.tag} ${user.clan.name}` : '-'}
                          </span>
                        )}
                      </td>

                      {/* Rol */}
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            disabled={updateRole.isPending}
                            className="input text-sm py-1 px-2 min-w-[100px]"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="CLAN_LEADER">Líder</option>
                            <option value="USER">Usuario</option>
                          </select>
                        ) : (
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        {isAdmin || isClanLeader ? (
                          <select
                            value={user.status}
                            onChange={(e) => handleStatusChange(user.id, e.target.value as UserStatus)}
                            disabled={updateStatus.isPending}
                            className="input text-sm py-1 px-2 min-w-[110px]"
                          >
                            <option value="ACTIVE">Activo</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="BLOCKED">Bloqueado</option>
                            <option value="BANNED">Baneado</option>
                          </select>
                        ) : (
                          <Badge variant={getStatusBadgeVariant(user.status)}>
                            {getStatusLabel(user.status)}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="mt-6 pt-4 border-t border-military-200 dark:border-gray-700">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={totalUsers}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
