import { UserPlus, UserMinus } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { UserAvatar } from '../ui/UserAvatar';
import type { Slot } from '../../types';
import { useAuthStore } from '../../store/authStore';

interface SlotItemProps {
  slot: Slot;
  onAssign: (slotId: string) => void;
  onUnassign: (slotId: string) => void;
  isLoading: boolean;
  eventStatus: 'ACTIVE' | 'INACTIVE';
}

export function SlotItem({
  slot,
  onAssign,
  onUnassign,
  isLoading,
  eventStatus,
}: SlotItemProps) {
  const user = useAuthStore((state) => state.user);

  const isFree = slot.status === 'FREE';
  const isOccupiedByMe = slot.userId === user?.id;
  const canInteract = eventStatus === 'ACTIVE' && user;

  const handleClick = () => {
    if (!canInteract || isLoading) return;

    if (isFree) {
      onAssign(slot.id);
    } else if (isOccupiedByMe) {
      onUnassign(slot.id);
    }
  };

  return (
    <div
      className={`
        flex items-center justify-between p-3 rounded-lg border-2 transition-all
        ${isFree ? 'border-military-200 bg-white hover:border-primary-300' : ''}
        ${isOccupiedByMe ? 'border-primary-500 bg-primary-50' : ''}
        ${slot.status === 'OCCUPIED' && !isOccupiedByMe ? 'border-military-300 bg-military-50' : ''}
        ${canInteract && (isFree || isOccupiedByMe) ? 'cursor-pointer' : 'cursor-not-allowed'}
      `}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 flex-1">
        {slot.user ? (
          <UserAvatar user={slot.user} size="md" showBorder={true} />
        ) : (
          <div className="w-10 h-10 rounded-full bg-military-100 flex items-center justify-center border-2 border-military-200">
            <UserPlus className="h-5 w-5 text-military-400" />
          </div>
        )}

        <div className="flex-1">
          <p className="font-medium text-military-900">{slot.role}</p>
          {slot.user && (
            <p className="text-sm text-military-600">
              {slot.user.clan?.tag && `${slot.user.clan.tag} `}
              {slot.user.nickname}
            </p>
          )}
          {isFree && (
            <p className="text-sm text-military-500">Slot disponible</p>
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
              >
                <UserMinus className="h-4 w-4" />
              </button>
            )}
          </>
        )}
        {isFree && canInteract && (
          <button
            className="btn btn-primary btn-sm"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              onAssign(slot.id);
            }}
          >
            <UserPlus className="h-4 w-4" />
          </button>
        )}
        {slot.status === 'OCCUPIED' && !isOccupiedByMe && (
          <Badge variant="info">Ocupado</Badge>
        )}
      </div>
    </div>
  );
}