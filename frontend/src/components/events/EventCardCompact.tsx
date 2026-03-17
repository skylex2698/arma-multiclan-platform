import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Event } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  formatDateInTimezone,
  formatTimeInTimezone,
  getTimezoneShortName,
  getUserTimezone,
} from '../../utils/eventTime';

interface EventCardCompactProps {
  event: Event;
}

export function EventCardCompact({ event }: EventCardCompactProps) {
  const user = useAuthStore((state) => state.user);
  const userTimezone = user?.timezone || getUserTimezone();
  const occupancyPercentage = event.totalSlots
    ? Math.round(((event.occupiedSlots ?? 0) / event.totalSlots) * 100)
    : 0;

  return (
    <Link to={`/events/${event.id}`} className="list-row cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-semibold text-military-900 dark:text-gray-100">
            {event.name}
          </h3>
          <div className="meta-inline mt-1">
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
          </div>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-military-400 dark:text-gray-500" />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 rounded-full bg-military-200 dark:bg-gray-700">
          <div
            className="h-1.5 rounded-full bg-primary-600 transition-all dark:bg-tactical-500"
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
        <span className="text-[13px] font-medium text-military-700 dark:text-gray-300">
          {occupancyPercentage}%
        </span>
      </div>
    </Link>
  );
}
