import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  Save,
  X,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { UserAvatar } from '../ui/UserAvatar';
import { useEventAttendance, useSaveAttendance } from '../../hooks/useAttendance';
import { useAuthStore } from '../../store/authStore';
import type { AttendanceStatus, User } from '../../types';
import { useAvailableUsers } from '../../hooks/useUsers';

interface AttendanceTabProps {
  eventId: string;
}

interface AttendanceRow {
  userId: string;
  user: {
    id: string;
    nickname: string;
    clanId: string | null;
    avatarUrl?: string | null;
    clan?: { id: string; name: string; tag: string | null };
  };
  slotId: string | null;
  squadName?: string;
  slotRole?: string;
  status: AttendanceStatus | null;
  note: string;
  isWalkIn: boolean;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; icon: typeof CheckCircle; color: string }[] = [
  { value: 'PRESENT', label: 'Presente', icon: CheckCircle, color: 'text-green-600' },
  { value: 'ABSENT_JUSTIFIED', label: 'Ausencia Justificada', icon: AlertTriangle, color: 'text-amber-600' },
  { value: 'NO_SHOW', label: 'No Presentado', icon: XCircle, color: 'text-red-600' },
];

export function AttendanceTab({ eventId }: AttendanceTabProps) {
  const currentUser = useAuthStore((state) => state.user);
  const { data, isLoading } = useEventAttendance(eventId);
  const saveAttendance = useSaveAttendance(eventId);

  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const isClanLeader = currentUser?.role === 'CLAN_LEADER';
  const currentUserClanId = currentUser?.clan?.id || null;

  // Users for walk-in feature
  const { data: usersData } = useAvailableUsers(
    isClanLeader && currentUserClanId ? currentUserClanId : undefined
  );

  // Initialize rows from API data
  useEffect(() => {
    if (!data) return;

    if (data.attendances.length > 0) {
      setRows(
        data.attendances.map((a) => ({
          userId: a.userId,
          user: a.user,
          slotId: a.slotId,
          status: a.status,
          note: a.note || '',
          isWalkIn: !a.slotId,
        }))
      );
    } else if (data.prePopulated && data.prePopulated.length > 0) {
      let prePopRows = data.prePopulated.map((p) => ({
        userId: p.userId,
        user: p.user,
        slotId: p.slotId,
        squadName: p.squadName,
        slotRole: p.slotRole,
        status: p.status,
        note: '',
        isWalkIn: false,
      }));

      // ClanLeader: filter to their clan only
      if (isClanLeader && currentUserClanId) {
        prePopRows = prePopRows.filter((r) => r.user.clanId === currentUserClanId);
      }

      setRows(prePopRows);
    }
  }, [data, isClanLeader, currentUserClanId]);

  const handleStatusChange = (userId: string, status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, status } : r))
    );
  };

  const handleNoteChange = (userId: string, note: string) => {
    setRows((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, note } : r))
    );
  };

  const handleAddWalkIn = (walkInUser: User) => {
    if (rows.some((r) => r.userId === walkInUser.id)) return;

    setRows((prev) => [
      ...prev,
      {
        userId: walkInUser.id,
        user: {
          id: walkInUser.id,
          nickname: walkInUser.nickname,
          clanId: walkInUser.clanId,
          avatarUrl: walkInUser.avatarUrl,
          clan: walkInUser.clan
            ? { id: walkInUser.clan.id, name: walkInUser.clan.name, tag: walkInUser.clan.tag }
            : undefined,
        },
        slotId: null,
        status: 'PRESENT' as AttendanceStatus,
        note: 'Check-in manual',
        isWalkIn: true,
      },
    ]);
    setShowAddUser(false);
  };

  const handleRemoveWalkIn = (userId: string) => {
    setRows((prev) => prev.filter((r) => !(r.userId === userId && r.isWalkIn)));
  };

  const handleMarkAllPresent = () => {
    setRows((prev) => prev.map((r) => (r.status === null ? { ...r, status: 'PRESENT' as AttendanceStatus } : r)));
  };

  const handleSave = async () => {
    setActionError('');
    setActionSuccess('');

    const unmarked = rows.filter((r) => r.status === null);
    if (unmarked.length > 0) {
      setActionError(
        `Hay ${unmarked.length} usuario(s) sin estado de asistencia marcado`
      );
      return;
    }

    try {
      const result = await saveAttendance.mutateAsync(
        rows.map((r) => ({
          userId: r.userId,
          status: r.status as AttendanceStatus,
          slotId: r.slotId,
          note: r.note || undefined,
        }))
      );

      if (result.blockedUsers.length > 0) {
        setActionSuccess(
          `Asistencia guardada. ${result.blockedUsers.length} usuario(s) bloqueado(s) automáticamente por ausencias reiteradas.`
        );
      } else {
        setActionSuccess('Asistencia guardada correctamente');
      }
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setActionError(
        error.response?.data?.message || 'Error al guardar asistencia'
      );
    }
  };

  // Summary stats
  const summary = useMemo(
    () => ({
      present: rows.filter((r) => r.status === 'PRESENT').length,
      noShow: rows.filter((r) => r.status === 'NO_SHOW').length,
      justified: rows.filter((r) => r.status === 'ABSENT_JUSTIFIED').length,
      unmarked: rows.filter((r) => r.status === null).length,
      total: rows.length,
    }),
    [rows]
  );

  // Available users for walk-in (excluding already in list)
  const walkInUsers = useMemo(() => {
    const existingIds = new Set(rows.map((r) => r.userId));
    return (usersData?.users || []).filter((u) => !existingIds.has(u.id));
  }, [usersData, rows]);

  const getRowBg = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800';
      case 'ABSENT_JUSTIFIED':
        return 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800';
      case 'NO_SHOW':
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
      default:
        return 'bg-military-50 dark:bg-gray-800 border-military-200 dark:border-gray-700';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <p className="text-center text-military-500 dark:text-gray-400 py-8">
          No hay usuarios asignados a este evento para marcar asistencia.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error/Success messages */}
      {actionError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
          {actionSuccess}
        </div>
      )}

      {/* Summary bar */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-military-700 dark:text-gray-300">
              {summary.present} presente{summary.present !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-military-700 dark:text-gray-300">
              {summary.justified} justificado{summary.justified !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-military-700 dark:text-gray-300">
              {summary.noShow} no-show{summary.noShow !== 1 ? 's' : ''}
            </span>
          </div>
          {summary.unmarked > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-military-500 dark:text-gray-500">
                {summary.unmarked} sin marcar
              </span>
            </div>
          )}
          <div className="ml-auto text-sm text-military-600 dark:text-gray-400">
            Total: {summary.total}
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="flex gap-2">
        {summary.unmarked > 0 && (
          <button
            onClick={handleMarkAllPresent}
            className="btn btn-outline btn-sm text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Marcar todos presentes
          </button>
        )}
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          className="btn btn-outline btn-sm"
        >
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          Agregar usuario
        </button>
      </div>

      {/* Walk-in user selector */}
      {showAddUser && (
        <Card>
          <div className="space-y-2">
            <p className="text-sm font-medium text-military-700 dark:text-gray-300">
              Agregar check-in manual:
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {walkInUsers.length === 0 ? (
                <p className="text-sm text-military-500 dark:text-gray-400 p-2">
                  No hay usuarios disponibles
                </p>
              ) : (
                walkInUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleAddWalkIn(u)}
                    className="w-full text-left px-3 py-2 hover:bg-military-50 dark:hover:bg-gray-700 rounded text-sm flex items-center gap-2"
                  >
                    <UserAvatar user={u} size="sm" showBorder={true} />
                    <span className="font-medium text-military-900 dark:text-gray-100">
                      {u.clan?.tag && `${u.clan.tag} `}
                      {u.nickname}
                    </span>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowAddUser(false)}
              className="text-xs text-military-500 hover:text-military-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancelar
            </button>
          </div>
        </Card>
      )}

      {/* Attendance table */}
      <Card>
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.userId}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${getRowBg(row.status)}`}
            >
              {/* User info */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <UserAvatar user={row.user as any} size="sm" showBorder={true} />
                <div className="min-w-0">
                  <p className="font-medium text-military-900 dark:text-gray-100 truncate">
                    {row.user.clan?.tag && (
                      <span className="text-primary-600 dark:text-primary-400">
                        {row.user.clan.tag}{' '}
                      </span>
                    )}
                    {row.user.nickname}
                  </p>
                  {row.squadName && (
                    <p className="text-xs text-military-500 dark:text-gray-500">
                      {row.squadName} — {row.slotRole}
                    </p>
                  )}
                  {row.isWalkIn && (
                    <p className="text-xs text-primary-500">Check-in manual</p>
                  )}
                </div>
              </div>

              {/* Status selector */}
              <div className="flex items-center gap-2">
                <select
                  value={row.status || ''}
                  onChange={(e) =>
                    handleStatusChange(
                      row.userId,
                      e.target.value as AttendanceStatus
                    )
                  }
                  className="text-sm border border-military-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-800 text-military-900 dark:text-gray-100"
                >
                  <option value="" disabled>
                    Sin marcar
                  </option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Note input */}
                <input
                  type="text"
                  value={row.note}
                  onChange={(e) => handleNoteChange(row.userId, e.target.value)}
                  placeholder="Nota..."
                  className="text-sm border border-military-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-800 text-military-900 dark:text-gray-100 w-32 hidden sm:block"
                />

                {/* Remove walk-in */}
                {row.isWalkIn && (
                  <button
                    onClick={() => handleRemoveWalkIn(row.userId)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                    title="Quitar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saveAttendance.isPending}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saveAttendance.isPending ? 'Guardando...' : 'Guardar Asistencia'}
        </button>
      </div>
    </div>
  );
}
