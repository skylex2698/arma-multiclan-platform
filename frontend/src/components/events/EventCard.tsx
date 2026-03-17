import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { Event } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  formatDateInTimezone,
  formatTimeInTimezone,
  getTimezoneShortName,
  getUserTimezone,
} from '../../utils/eventTime';

interface EventCardProps {
  event: Event;
  isDeleted?: boolean;
  onRestore?: () => void;
  isRestoring?: boolean;
}

const getStatusBadge = (event: Event, isDeleted?: boolean) => {
  if (isDeleted) {
    return <Badge variant="danger">Eliminado</Badge>;
  }

  switch (event.status) {
    case 'ACTIVE':
      return <Badge variant="success">Activo</Badge>;
    case 'INACTIVE':
      return <Badge variant="warning">Inactivo</Badge>;
    case 'FINISHED':
      return <Badge variant="default">Finalizado</Badge>;
    default:
      return null;
  }
};

export function EventCard({
  event,
  isDeleted,
  onRestore,
  isRestoring,
}: EventCardProps) {
  const user = useAuthStore((state) => state.user);
  const userTimezone = user?.timezone || getUserTimezone();
  const occupancyPercentage = event.totalSlots
    ? Math.round(((event.occupiedSlots ?? 0) / event.totalSlots) * 100)
    : 0;

  const creatorLabel = event.creator
    ? `${event.creator.clan?.tag ? `${event.creator.clan.tag} ` : ''}${event.creator.nickname}`
    : null;

  const content = (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="min-w-0 break-words text-base font-semibold text-military-900 dark:text-gray-100">
              {event.name}
            </h3>
            {getStatusBadge(event, isDeleted)}
          </div>

          {event.description && (
            <p className="mt-1 line-clamp-1 break-words text-sm text-military-600 dark:text-gray-400">
              {event.description}
            </p>
          )}

          <div className="meta-inline mt-2">
            <span>{formatDateInTimezone(event.scheduledDate, userTimezone)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {formatTimeInTimezone(event.scheduledDate, userTimezone)}{' '}
              {getTimezoneShortName(event.scheduledDate, userTimezone)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{event.game.name}</span>
            <span aria-hidden="true">·</span>
            <span>
              {event.occupiedSlots ?? 0}/{event.totalSlots ?? 0} slots
            </span>
            {creatorLabel && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Por <strong>{creatorLabel}</strong>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex min-w-[96px] flex-col items-start gap-2 lg:items-end">
          <span className="text-sm font-semibold text-military-800 dark:text-gray-200">
            {occupancyPercentage}%
          </span>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-3">
        <div className="h-1.5 flex-1 rounded-full bg-military-200 dark:bg-gray-700">
          <div
            className="h-1.5 rounded-full bg-primary-600 transition-all dark:bg-tactical-500"
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
      </div>

      {isDeleted && onRestore && (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRestore();
            }}
            disabled={isRestoring}
            className="btn btn-primary btn-sm"
          >
            <RotateCcw className={`h-4 w-4 ${isRestoring ? 'animate-spin' : ''}`} />
            {isRestoring ? 'Restaurando' : 'Restaurar'}
          </button>
        </div>
      )}
    </>
  );

  if (isDeleted) {
    return <div className="list-row opacity-80">{content}</div>;
  }

  return (
    <Link
      to={isDeleted ? `/events/${event.id}?deleted=true` : `/events/${event.id}`}
      className={`list-row ${isDeleted ? 'opacity-80' : 'cursor-pointer'}`}
    >
      {content}
    </Link>
  );
}
