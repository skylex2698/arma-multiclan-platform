import { useState } from 'react';
import { UserCog, UserMinus, UserPlus } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { UserAvatar } from '../ui/UserAvatar';
import type { Slot, User } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';

interface SlotItemProps {
  slot: Slot;
  onAssign: (slotId: string) => void;
  onUnassign: (slotId: string) => void;
  onAdminAssign?: (slotId: string, userId: string) => void;
  onAdminUnassign?: (slotId: string) => void;
  onCreateExternal?: (slotId: string, nickname: string) => void;
  isLoading: boolean;
  eventStatus: 'ACTIVE' | 'INACTIVE' | 'FINISHED';
  availableUsers?: User[];
  getUserSlotInfo?: (userId: string) => {
    hasSlot: boolean;
    squadName?: string;
    slotRole?: string;
  };
  squadReservedForClanId?: string | null;
}

export function SlotItem({
  slot,
  onAssign,
  onUnassign,
  onAdminAssign,
  onAdminUnassign,
  onCreateExternal,
  isLoading,
  eventStatus,
  availableUsers = [],
  getUserSlotInfo,
  squadReservedForClanId,
}: SlotItemProps) {
  const user = useAuthStore((state) => state.user);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [externalName, setExternalName] = useState('');

  const isFree = slot.status === 'FREE';
  const isOccupiedByMe = slot.userId === user?.id;
  const isFinished = eventStatus === 'FINISHED';
  const isAdmin = user?.role === 'ADMIN';
  const canManageSlots = hasPermission(user, PERMISSIONS.SLOT_MANAGE);
  const canCreateExternalUsers = hasPermission(user, PERMISSIONS.USER_EXTERNAL_CREATE);
  const currentUserClanId = user?.clan?.id ?? null;

  const isReservedForOtherClan =
    !!squadReservedForClanId &&
    squadReservedForClanId !== currentUserClanId &&
    !isAdmin;

  const canInteract = eventStatus === 'ACTIVE' && !!user && !isReservedForOtherClan;

  const canAdminAssign =
    eventStatus === 'ACTIVE' &&
    !isReservedForOtherClan &&
    canManageSlots &&
    (Boolean(onAdminAssign) || (canCreateExternalUsers && Boolean(onCreateExternal)));

  const canAdminUnassign =
    !isFinished &&
    slot.status === 'OCCUPIED' &&
    !isOccupiedByMe &&
    !!onAdminUnassign &&
    (user?.role === 'ADMIN' || (canManageSlots && slot.user?.clan?.id === user?.clan?.id));

  return (
    <div>
      <div
        className={`rounded-md border px-3 py-2 transition-colors ${
          isOccupiedByMe
            ? 'border-green-300 bg-green-50/70 dark:border-green-700 dark:bg-green-900/20'
            : slot.status === 'OCCUPIED'
              ? 'border-military-200 bg-military-50/50 dark:border-gray-700 dark:bg-gray-900/40'
              : isReservedForOtherClan
                ? 'border-amber-300 bg-amber-50/70 dark:border-amber-700 dark:bg-amber-900/20'
                : 'border-military-200 bg-white dark:border-gray-700 dark:bg-gray-800'
        }`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="break-words text-sm font-medium text-military-900 dark:text-gray-100">
                {slot.role}
              </p>
              {isOccupiedByMe && <Badge variant="success">Tu slot</Badge>}
              {slot.status === 'OCCUPIED' && !isOccupiedByMe && !canAdminUnassign && (
                <span className="section-caption">Ocupado</span>
              )}
            </div>

            <div className="meta-inline mt-1">
              {slot.user ? (
                <>
                  <span className="inline-flex items-center gap-2">
                    <UserAvatar user={slot.user} size="sm" showBorder={true} />
                    <strong>
                      {slot.user.clan?.tag ? `${slot.user.clan.tag} ` : ''}
                      {slot.user.nickname}
                    </strong>
                  </span>
                  {slot.user.status === 'EXTERNAL' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Miembro externo</span>
                    </>
                  )}
                </>
              ) : isReservedForOtherClan ? (
                <span>Disponible solo para el clan reservado</span>
              ) : (
                <span>Slot libre</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isFree && canInteract && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={isLoading}
                onClick={() => onAssign(slot.id)}
              >
                <UserPlus className="h-4 w-4" />
                Apuntarme
              </button>
            )}

            {isOccupiedByMe && eventStatus === 'ACTIVE' && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={isLoading}
                onClick={() => onUnassign(slot.id)}
              >
                <UserMinus className="h-4 w-4" />
                Salir
              </button>
            )}

            {isFree && canAdminAssign && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={isLoading}
                onClick={() => setShowUserSelector((current) => !current)}
              >
                <UserCog className="h-4 w-4" />
                Gestionar
              </button>
            )}

            {canAdminUnassign && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={isLoading}
                onClick={() => onAdminUnassign?.(slot.id)}
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      </div>

      {showUserSelector && (
        <div className="mt-2 rounded-md border border-military-200 bg-military-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-military-800 dark:text-gray-200">
              Asignacion manual
            </p>
            <button
              type="button"
              onClick={() => {
                setShowUserSelector(false);
                setExternalName('');
              }}
              className="toolbar-link text-xs"
            >
              Cerrar
            </button>
          </div>

          <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
            {availableUsers.length === 0 ? (
              <p className="text-sm text-military-500 dark:text-gray-400">
                No hay usuarios disponibles.
              </p>
            ) : (
              availableUsers.map((availableUser) => {
                const slotInfo = getUserSlotInfo?.(availableUser.id) || {
                  hasSlot: false,
                };

                return (
                  <button
                    key={availableUser.id}
                    type="button"
                    onClick={() => {
                      onAdminAssign?.(slot.id, availableUser.id);
                      setShowUserSelector(false);
                    }}
                    className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-white dark:hover:bg-gray-800"
                    disabled={isLoading}
                  >
                    <UserAvatar user={availableUser} size="sm" showBorder={true} />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-military-900 dark:text-gray-100">
                        {availableUser.clan?.tag ? `${availableUser.clan.tag} ` : ''}
                        {availableUser.nickname}
                      </p>
                      {slotInfo.hasSlot && (
                        <p className="text-[12px] text-amber-700 dark:text-amber-400">
                          Ya ocupa {slotInfo.slotRole} en {slotInfo.squadName}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {canCreateExternalUsers && onCreateExternal && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = externalName.trim();
                if (trimmed.length < 2) return;
                onCreateExternal(slot.id, trimmed);
                setExternalName('');
                setShowUserSelector(false);
              }}
              className="subtle-divider mt-3 grid gap-2 pt-3 md:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div>
                <label className="field-label">Registrar miembro externo</label>
                <input
                  type="text"
                  value={externalName}
                  onChange={(e) => setExternalName(e.target.value)}
                  placeholder="Nombre o nick"
                  className="input"
                  minLength={2}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || externalName.trim().length < 2}
                className="btn btn-primary md:self-end"
              >
                Guardar
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
