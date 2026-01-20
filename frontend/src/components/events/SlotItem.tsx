import { UserPlus, UserMinus, UserCog } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { UserAvatar } from '../ui/UserAvatar';
import type { Slot, User } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

interface SlotItemProps {
  slot: Slot;
  onAssign: (slotId: string) => void;
  onUnassign: (slotId: string) => void;
  onAdminAssign?: (slotId: string, userId: string) => void;
  onAdminUnassign?: (slotId: string) => void;
  isLoading: boolean;
  eventStatus: 'ACTIVE' | 'INACTIVE';
  availableUsers?: User[];
  getUserSlotInfo?: (userId: string) => {
    hasSlot: boolean;
    squadName?: string;
    slotRole?: string;
  };
}

export function SlotItem({
  slot,
  onAssign,
  onUnassign,
  onAdminAssign,
  onAdminUnassign,
  isLoading,
  eventStatus,
  availableUsers = [],
  getUserSlotInfo,
}: SlotItemProps) {
  const user = useAuthStore((state) => state.user);
  const [showUserSelector, setShowUserSelector] = useState(false);

  const isFree = slot.status === 'FREE';
  const isOccupiedByMe = slot.userId === user?.id;
  const canInteract = eventStatus === 'ACTIVE' && user;
  const canAdminAssign =
    (user?.role === 'ADMIN' || user?.role === 'CLAN_LEADER') &&
    onAdminAssign &&
    availableUsers.length > 0;

  // Verificar si puede desapuntar por admin
  const canAdminUnassign =
    slot.status === 'OCCUPIED' &&
    !isOccupiedByMe &&
    onAdminUnassign &&
    (user?.role === 'ADMIN' ||
      (user?.role === 'CLAN_LEADER' && slot.user?.clan?.id === user?.clan?.id));

  const handleClick = () => {
    if (!canInteract || isLoading || showUserSelector) return;

    if (isFree) {
      onAssign(slot.id);
    } else if (isOccupiedByMe) {
      onUnassign(slot.id);
    }
  };

  const handleAdminAssign = (userId: string) => {
    if (onAdminAssign) {
      onAdminAssign(slot.id, userId);
      setShowUserSelector(false);
    }
  };

  return (
    <div className="relative">
      <div
        className={`
          flex items-center justify-between p-3 rounded-lg border-2 transition-all
          ${isFree ? 'slot-free' : ''}
          ${isOccupiedByMe ? 'slot-mine' : ''}
          ${slot.status === 'OCCUPIED' && !isOccupiedByMe ? 'slot-occupied' : ''}
          ${canInteract && (isFree || isOccupiedByMe) && !showUserSelector ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
        `}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3 flex-1">
          {slot.user ? (
            <UserAvatar user={slot.user} size="md" showBorder={true} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-military-100 dark:bg-gray-600 flex items-center justify-center border-2 border-military-200 dark:border-gray-500">
              <UserPlus className="h-5 w-5 text-military-400 dark:text-gray-400" />
            </div>
          )}

          <div className="flex-1">
            <p className="font-medium text-military-900 dark:text-gray-100">{slot.role}</p>
            {slot.user && (
              <p className="text-sm text-military-600 dark:text-gray-400">
                {slot.user.clan?.tag && `${slot.user.clan.tag} `}
                {slot.user.nickname}
              </p>
            )}
            {isFree && (
              <p className="text-sm text-military-500 dark:text-gray-500">Slot disponible</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOccupiedByMe && (
            <>
              <Badge variant="success">Tú</Badge>
              {canInteract && (
                <button
                  className="btn btn-danger btn-sm"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnassign(slot.id);
                  }}
                  title="Desapuntarme"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              )}
            </>
          )}

          {isFree && canInteract && !showUserSelector && (
            <button
              className="btn btn-primary btn-sm"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                onAssign(slot.id);
              }}
              title="Apuntarme"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          )}

          {/* Botón de asignación por admin/líder */}
          {isFree && canAdminAssign && !showUserSelector && (
            <button
              className="btn btn-secondary btn-sm"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                setShowUserSelector(true);
              }}
              title="Asignar usuario"
            >
              <UserCog className="h-4 w-4" />
            </button>
          )}

          {/* Botón de desasignar por admin/líder */}
          {canAdminUnassign && (
            <button
              className="btn btn-danger btn-sm"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                if (onAdminUnassign) {
                  onAdminUnassign(slot.id);
                }
              }}
              title="Desapuntar usuario"
            >
              <UserMinus className="h-4 w-4" />
            </button>
          )}

          {slot.status === 'OCCUPIED' && !isOccupiedByMe && !canAdminUnassign && (
            <Badge variant="info">Ocupado</Badge>
          )}
        </div>
      </div>

      {/* Selector de usuario */}
      {showUserSelector && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-military-300 dark:border-gray-700 rounded-lg shadow-lg w-64 max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-military-200 dark:border-gray-700 bg-military-50 dark:bg-gray-700">
            <p className="text-xs font-medium text-military-700 dark:text-gray-300">
              Asignar usuario a este slot:
            </p>
          </div>
          <div className="p-1">
            {availableUsers.length === 0 ? (
              <p className="text-sm text-military-500 dark:text-gray-400 p-2">
                No hay usuarios disponibles
              </p>
            ) : (
              availableUsers.map((availableUser) => {
                const slotInfo = getUserSlotInfo?.(availableUser.id) || { hasSlot: false };

                return (
                  <button
                    key={availableUser.id}
                    onClick={() => handleAdminAssign(availableUser.id)}
                    className="w-full text-left px-3 py-2 hover:bg-military-50 dark:hover:bg-gray-700 rounded text-sm flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <UserAvatar user={availableUser} size="sm" showBorder={true} />
                    <div className="flex-1">
                      <p className="font-medium text-military-900 dark:text-gray-100">
                        {availableUser.clan?.tag && `${availableUser.clan.tag} `}
                        {availableUser.nickname}
                      </p>
                      {slotInfo.hasSlot && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Ya en: {slotInfo.squadName} - {slotInfo.slotRole}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="p-2 border-t border-military-200 dark:border-gray-700">
            <button
              onClick={() => setShowUserSelector(false)}
              className="w-full px-2 py-1 text-xs text-military-600 dark:text-gray-400 hover:text-military-900 dark:hover:text-gray-100 hover:bg-military-50 dark:hover:bg-gray-700 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}