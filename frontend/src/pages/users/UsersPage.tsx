import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Search, Trash2 } from 'lucide-react';
import {
  useUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
  useChangeUserClan,
  useAdminUpdateUserProfile,
  useDeleteUser,
  useValidateUser,
} from '../../hooks/useUsers';
import { useClans } from '../../hooks/useClans';
import { useUserReliability } from '../../hooks/useAttendance';
import { useUpdateGameIdentityStatus } from '../../hooks/useGames';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { ReliabilityBadge } from '../../components/ui/ReliabilityBadge';
import { Pagination } from '../../components/ui/Pagination';
import type { UserRole, UserStatus } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  getRoleBadgeVariant,
  getRoleDisplayName,
  hasPermission,
  PERMISSIONS,
} from '../../utils/permissions';

function UserReliabilityCell({ userId }: { userId: string }) {
  const { data } = useUserReliability(userId);
  const reliability = data?.reliability;

  if (!reliability) {
    return <span className="section-caption">Sin datos</span>;
  }

  return <ReliabilityBadge score={reliability.score} />;
}

const ITEMS_PER_PAGE = 15;

type EditableDraft = {
  nickname: string;
  email: string;
  clanId: string;
  role: UserRole;
  status: UserStatus;
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clanFilter, setClanFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<'nickname' | 'role' | 'status'>(
    'nickname'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<EditableDraft | null>(null);

  const { user: currentUser } = useAuthStore();
  const isAdmin = hasPermission(currentUser, PERMISSIONS.USER_PROFILE_ADMIN_EDIT);
  const isClanLeader = currentUser?.role === 'CLAN_LEADER';
  const canManageUserStatus = hasPermission(currentUser, PERMISSIONS.USER_STATUS_MANAGE);
  const canReviewIdentity = hasPermission(currentUser, PERMISSIONS.USER_IDENTITY_REVIEW);
  const canDeleteUsers = hasPermission(currentUser, PERMISSIONS.USER_DELETE);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
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
  const updateIdentityStatus = useUpdateGameIdentityStatus();
  const adminUpdateProfile = useAdminUpdateUserProfile();
  const deleteUser = useDeleteUser();
  const validateUser = useValidateUser();
  const { data: clansData } = useClans();

  const allClans = clansData?.clans || [];
  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;
  const totalUsers = data?.total || 0;

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'nickname') {
        comparison = a.nickname.localeCompare(b.nickname);
      } else if (sortField === 'role') {
        const roleOrder = {
          ADMIN: 5,
          CLAN_LEADER: 4,
          OPERATIONS_OFFICER: 3,
          RECRUITER: 2,
          USER: 1,
        };
        comparison =
          (roleOrder[a.role as keyof typeof roleOrder] || 0) -
          (roleOrder[b.role as keyof typeof roleOrder] || 0);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [users, sortField, sortOrder]);

  const pendingUsers = useMemo(
    () => sortedUsers.filter((candidate) => candidate.status === 'PENDING'),
    [sortedUsers]
  );

  const readyUsers = useMemo(
    () => sortedUsers.filter((candidate) => candidate.status !== 'PENDING'),
    [sortedUsers]
  );

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortOrder('asc');
  };

  const handleValidateUser = async (userId: string) => {
    try {
      await validateUser.mutateAsync(userId);
    } catch (err) {
      console.error('Error al validar usuario:', err);
    }
  };

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const openInlineEditor = (user: (typeof users)[number]) => {
    setEditingUserId(user.id);
    setEditingDraft({
      nickname: user.nickname,
      email: user.email || '',
      clanId: user.clanId || 'null',
      role: user.role,
      status: user.status,
    });
  };

  const closeInlineEditor = () => {
    setEditingUserId(null);
    setEditingDraft(null);
  };

  const handleInlineSave = async (user: (typeof users)[number]) => {
    if (!editingDraft || editingUserId !== user.id) {
      return;
    }

    const canPromoteClanLeaders =
      isClanLeader &&
      currentUser?.clanId === user.clanId &&
      user.role !== 'ADMIN';

    try {
      if (
        isAdmin &&
        (editingDraft.nickname !== user.nickname ||
          editingDraft.email !== (user.email || ''))
      ) {
        await adminUpdateProfile.mutateAsync({
          userId: user.id,
          data: {
            nickname: editingDraft.nickname,
            email: editingDraft.email.trim() || null,
          },
        });
      }

      if (isAdmin && editingDraft.clanId !== (user.clanId || 'null')) {
        await changeClan.mutateAsync({
          userId: user.id,
          clanId: editingDraft.clanId === 'null' ? null : editingDraft.clanId,
        });
      }

      if ((isAdmin || canPromoteClanLeaders) && editingDraft.role !== user.role) {
        await updateRole.mutateAsync({ userId: user.id, role: editingDraft.role });
      }

      if (canManageUserStatus && editingDraft.status !== user.status) {
        await updateStatus.mutateAsync({ userId: user.id, status: editingDraft.status });
      }

      closeInlineEditor();
    } catch (err) {
      console.error('Error al guardar la edicion del usuario:', err);
    }
  };

  const handleDeleteUser = async (user: (typeof users)[number]) => {
    if (
      !window.confirm(
        `Se eliminará al usuario "${user.nickname}". Esta acción lo ocultará de la plataforma.`
      )
    ) {
      return;
    }

    try {
      await deleteUser.mutateAsync(user.id);
      if (editingUserId === user.id) {
        closeInlineEditor();
      }
    } catch (err) {
      console.error('Error al eliminar el usuario:', err);
    }
  };

  const getRequiredIdentity = (user: (typeof users)[number]) => {
    const primaryGameId = user.clan?.primaryGameId;
    if (!primaryGameId) {
      return null;
    }

    return user.gameIdentities?.find((identity) => identity.gameId === primaryGameId) || null;
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
      case 'EXTERNAL':
        return 'info' as const;
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
      case 'EXTERNAL':
        return 'Externo';
      default:
        return status;
    }
  };

  const getUsersRoleLabel = (role: string) => {
    if (role === 'ADMIN') {
      return 'Admin';
    }

    return getRoleDisplayName(role as UserRole);
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) {
      return null;
    }

    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const renderUserRow = (user: (typeof users)[number], highlightPending = false) => {
    const isEditing = editingUserId === user.id && editingDraft !== null;
    const canPromoteClanLeaders =
      isClanLeader &&
      currentUser?.clanId === user.clanId &&
      user.role !== 'ADMIN';

    return (
      <div
        key={user.id}
        className={`list-row lg:grid lg:items-center lg:gap-4 ${
          highlightPending
            ? 'border-l-4 border-l-amber-500 bg-amber-50/70 dark:bg-amber-900/10'
            : ''
        } ${
          isAdmin
            ? 'lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.8fr)_160px_160px_minmax(0,1.4fr)_96px_168px]'
            : 'lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.8fr)_160px_160px_minmax(0,1.4fr)_96px_128px]'
        }`}
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-3">
            <UserAvatar user={user} size="md" showBorder={true} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {isEditing && isAdmin ? (
                  <input
                    value={editingDraft.nickname}
                    onChange={(e) =>
                      setEditingDraft((current) =>
                        current ? { ...current, nickname: e.target.value } : current
                      )
                    }
                    className="input h-9"
                  />
                ) : (
                  <p className="break-words text-sm font-medium text-military-900 dark:text-gray-100">
                    {user.nickname}
                  </p>
                )}
                {user.status === 'PENDING' && (
                  <Badge variant="warning" className="uppercase tracking-[0.08em]">
                    Pendiente
                  </Badge>
                )}
              </div>

              <div className="meta-inline mt-1">
                {isEditing && isAdmin ? (
                  <input
                    type="email"
                    value={editingDraft.email}
                    onChange={(e) =>
                      setEditingDraft((current) =>
                        current ? { ...current, email: e.target.value } : current
                      )
                    }
                    className="input h-9 w-full max-w-sm"
                    placeholder="Sin email"
                  />
                ) : (
                  user.email && <span className="break-all">{user.email}</span>
                )}

                {!isEditing && user.clan && (
                  <>
                    {user.email && <span aria-hidden="true">·</span>}
                    <span className="break-words">
                      {user.clan.tag ? `${user.clan.tag} ` : ''}
                      {user.clan.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <p className="field-label lg:hidden">Clan</p>
          {isEditing && isAdmin ? (
            <select
              value={editingDraft.clanId}
              onChange={(e) =>
                setEditingDraft((current) =>
                  current ? { ...current, clanId: e.target.value } : current
                )
              }
              className="input"
            >
              <option value="null">Sin clan</option>
              {allClans.map((clan) => (
                <option key={clan.id} value={clan.id}>
                  {clan.tag} {clan.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="break-words text-sm text-military-700 dark:text-gray-300">
              {user.clan ? `${user.clan.tag} ${user.clan.name}` : 'Sin clan'}
            </p>
          )}
        </div>

        <div>
          <p className="field-label lg:hidden">Rol</p>
          {isEditing && (isAdmin || canPromoteClanLeaders) ? (
            <select
              value={editingDraft.role}
              onChange={(e) =>
                setEditingDraft((current) =>
                  current ? { ...current, role: e.target.value as UserRole } : current
                )
              }
              className="input"
            >
              {isAdmin && <option value="ADMIN">Admin</option>}
              <option value="CLAN_LEADER">Administrador de clan</option>
              <option value="OPERATIONS_OFFICER">Oficial de operaciones</option>
              <option value="RECRUITER">Oficial de personal</option>
              <option value="USER">Operador</option>
            </select>
          ) : (
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {getUsersRoleLabel(user.role)}
            </Badge>
          )}
        </div>

        <div>
          <p className="field-label lg:hidden">Estado</p>
          {isEditing && canManageUserStatus ? (
            <select
              value={editingDraft.status}
              onChange={(e) =>
                setEditingDraft((current) =>
                  current ? { ...current, status: e.target.value as UserStatus } : current
                )
              }
              className="input"
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
        </div>

        <div>
          <p className="field-label lg:hidden">Identidad opcional</p>
          {(() => {
            const identity = getRequiredIdentity(user);
            const primaryGame = user.clan?.primaryGame;

            if (!primaryGame || primaryGame.identityMode === 'NONE') {
              return <span className="section-caption">No configurada</span>;
            }

            return (
              <div className="space-y-1">
                <p className="text-sm text-military-800 dark:text-gray-200">
                  {primaryGame.identityLabel || primaryGame.name}
                </p>
                <p className="section-caption break-all">
                  {identity?.value || primaryGame.identityLabel || 'Pendiente'}
                </p>
                {identity?.status === 'PENDING' &&
                  canReviewIdentity && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={updateIdentityStatus.isPending}
                        onClick={() =>
                          updateIdentityStatus.mutate({
                            identityId: identity.id,
                            status: 'VERIFIED',
                          })
                        }
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={updateIdentityStatus.isPending}
                        onClick={() =>
                          updateIdentityStatus.mutate({
                            identityId: identity.id,
                            status: 'REJECTED',
                          })
                        }
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
              </div>
            );
          })()}
        </div>

        <div>
          <p className="field-label lg:hidden">Fiabilidad</p>
          <UserReliabilityCell userId={user.id} />
        </div>

        <div>
          <p className="field-label lg:hidden">Acciones</p>
          <div className="flex flex-wrap gap-2">
            {user.status === 'PENDING' && canManageUserStatus && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleValidateUser(user.id)}
                disabled={validateUser.isPending}
              >
                {validateUser.isPending ? 'Validando...' : 'Validar'}
              </button>
            )}

            {(isAdmin || canManageUserStatus) &&
              (isEditing ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleInlineSave(user)}
                    disabled={
                      adminUpdateProfile.isPending ||
                      changeClan.isPending ||
                      updateRole.isPending ||
                      updateStatus.isPending
                    }
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={closeInlineEditor}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => openInlineEditor(user)}
                  >
                    Editar
                  </button>
                  {canDeleteUsers && currentUser?.id !== user.id && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteUser(user)}
                      disabled={deleteUser.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </>
              ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            {isAdmin ? 'Gestion de usuarios' : 'Gestion de personal'}
          </h1>
          <p className="page-subtitle">
            {totalUsers}{' '}
            {isAdmin ? 'usuarios en esta vista' : 'miembros del clan en esta vista'}
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Filtros</h2>
            <p className="section-caption">Busqueda y segmentacion operativa.</p>
          </div>
        </div>

        <div className={`grid gap-3 ${isAdmin ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
          <div>
            <label className="field-label">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-military-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9"
                placeholder="Nombre o email"
              />
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="field-label">Clan</label>
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

          <div>
            <label className="field-label">Rol</label>
            <select
              value={roleFilter}
              onChange={(e) => handleFilterChange(setRoleFilter)(e.target.value)}
              className="input"
            >
              <option value="ALL">Todos</option>
              <option value="ADMIN">Admin</option>
              <option value="CLAN_LEADER">Administrador de clan</option>
              <option value="OPERATIONS_OFFICER">Oficial de operaciones</option>
              <option value="RECRUITER">Oficial de personal</option>
              <option value="USER">Operador</option>
            </select>
          </div>

          <div>
            <label className="field-label">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value)}
              className="input"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activo</option>
              <option value="PENDING">Pendiente</option>
              <option value="BLOCKED">Bloqueado</option>
              <option value="BANNED">Baneado</option>
              <option value="EXTERNAL">Externo</option>
            </select>
          </div>
        </div>
      </section>

      {pendingUsers.length > 0 && (
        <section className="panel border-amber-300 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
            <div className="min-w-0 flex-1">
              <h2 className="section-title">Tareas pendientes</h2>
              <p className="section-caption mt-1">
                Hay {pendingUsers.length} usuario{pendingUsers.length !== 1 ? 's' : ''} pendiente
                {pendingUsers.length !== 1 ? 's' : ''} de activacion.
                {!isAdmin
                  ? ' Solo puedes validar miembros de tu propio clan.'
                  : ' Puedes validarlos aqui mismo o desde el dashboard.'}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">
              {isAdmin ? 'Usuarios' : 'Miembros del clan'}
            </h2>
            <p className="section-caption">
              Vista compacta con edicion inline.
              {pendingUsers.length > 0 && ' Las altas pendientes quedan destacadas al inicio.'}
            </p>
          </div>

          <div className="page-actions">
            <button
              type="button"
              onClick={() => handleSort('nickname')}
              className="btn btn-outline btn-sm"
            >
              Usuario
              <SortIcon field="nickname" />
            </button>
            <button
              type="button"
              onClick={() => handleSort('role')}
              className="btn btn-outline btn-sm"
            >
              Rol
              <SortIcon field="role" />
            </button>
            <button
              type="button"
              onClick={() => handleSort('status')}
              className="btn btn-outline btn-sm"
            >
              Estado
              <SortIcon field="status" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="empty-state">No se encontraron usuarios.</div>
        ) : (
          <>
            <div className="list-surface">
              {pendingUsers.length > 0 && (
                <div className="border-b border-military-200 bg-amber-50/90 px-4 py-3 dark:border-gray-700 dark:bg-amber-900/10">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Pendientes de activacion
                  </p>
                  <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                    Estas cuentas requieren revision manual antes de poder operar en la plataforma.
                  </p>
                </div>
              )}

              {pendingUsers.map((user) => renderUserRow(user, true))}

              {pendingUsers.length > 0 && readyUsers.length > 0 && (
                <div className="border-y border-military-200 bg-military-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/60">
                  <p className="text-sm font-semibold text-military-900 dark:text-gray-100">
                    Personal activo y resto de estados
                  </p>
                </div>
              )}

              {(pendingUsers.length > 0 ? readyUsers : sortedUsers).map((user) =>
                renderUserRow(user, false)
              )}
            </div>

            <div className="pt-4">
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
      </section>
    </div>
  );
}
