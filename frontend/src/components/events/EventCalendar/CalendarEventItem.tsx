import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import type { Event } from '../../../types';

interface CalendarEventItemProps {
  event: Event;
}

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/70',
  INACTIVE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/70',
  FINISHED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600',
};

export function CalendarEventItem({ event }: CalendarEventItemProps) {
  const navigate = useNavigate();
  const time = format(new Date(event.scheduledDate), 'HH:mm', { locale: es });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/events/${event.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full text-left px-2 py-1 rounded text-xs font-medium truncate transition-colors cursor-pointer
        ${statusColors[event.status]}
      `}
      title={`${time} - ${event.name}`}
    >
      <span className="font-semibold">{time}</span>{' '}
      <span className="truncate">{event.name}</span>
    </button>
  );
}
