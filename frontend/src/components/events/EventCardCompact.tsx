import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { Event } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventCardCompactProps {
  event: Event;
}

export function EventCardCompact({ event }: EventCardCompactProps) {
  const occupancyPercentage = event.totalSlots
    ? Math.round((event.occupiedSlots! / event.totalSlots) * 100)
    : 0;

  const isPast = new Date(event.scheduledDate) < new Date();

  return (
    <Link
      to={`/events/${event.id}`}
      className="block p-4 bg-white rounded-lg border border-military-200 hover:border-primary-500 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-military-900 mb-1">{event.name}</h3>
          <div className="flex items-center text-xs text-military-600 gap-3">
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(event.scheduledDate), "d 'de' MMM", {
                locale: es,
              })}
            </span>
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(event.scheduledDate), 'HH:mm')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPast && <Badge variant="default">Finalizado</Badge>}
          <ChevronRight className="h-4 w-4 text-military-400" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-xs text-military-600">
          <Users className="h-3 w-3 mr-1" />
          <span>
            {event.occupiedSlots}/{event.totalSlots}
          </span>
        </div>
        <div className="w-24 bg-military-200 rounded-full h-1.5">
          <div
            className="bg-primary-600 h-1.5 rounded-full transition-all"
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
      </div>
    </Link>
  );
}