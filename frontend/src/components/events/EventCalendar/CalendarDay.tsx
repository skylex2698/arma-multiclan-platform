import { isToday, format } from 'date-fns';
import { CalendarEventItem } from './CalendarEventItem';
import type { Event } from '../../../types';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  events: Event[];
  maxEventsToShow?: number;
}

export function CalendarDay({
  date,
  isCurrentMonth,
  events,
  maxEventsToShow = 3,
}: CalendarDayProps) {
  const today = isToday(date);
  const dayNumber = format(date, 'd');
  const eventsToShow = events.slice(0, maxEventsToShow);
  const remainingCount = events.length - maxEventsToShow;

  return (
    <div
      className={`
        min-h-24 md:min-h-28 p-1 md:p-2 border-b border-r border-military-200 dark:border-gray-700
        ${!isCurrentMonth ? 'bg-military-50/50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'}
        ${today ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-1">
        <span
          className={`
            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
            ${!isCurrentMonth ? 'text-military-400 dark:text-gray-600' : 'text-military-900 dark:text-gray-100'}
            ${today ? 'bg-primary-600 text-white dark:bg-primary-500' : ''}
          `}
        >
          {dayNumber}
        </span>
      </div>

      <div className="space-y-1">
        {eventsToShow.map((event) => (
          <CalendarEventItem key={event.id} event={event} />
        ))}
        {remainingCount > 0 && (
          <div className="text-xs text-military-500 dark:text-gray-500 px-2 py-0.5">
            +{remainingCount} más
          </div>
        )}
      </div>
    </div>
  );
}
