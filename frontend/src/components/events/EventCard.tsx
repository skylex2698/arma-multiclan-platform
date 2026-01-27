import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { Event } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const getStatusBadge = () => {
    switch (event.status) {
      case 'ACTIVE':
        return <Badge variant="success">Activo</Badge>;
      case 'INACTIVE':
        return <Badge variant="default">Inactivo</Badge>;
      case 'FINISHED':
        return <Badge variant="warning">Finalizado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Link
      to={`/events/${event.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-military-200 dark:border-gray-700 hover:shadow-lg transition-all overflow-hidden"
    >
      {/* Header con estado */}
      <div className="bg-primary-50 dark:bg-gray-700 px-4 py-3 border-b border-military-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-military-900 dark:text-gray-100">
            {event.name}
          </h3>
          <div className="flex gap-2">
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {event.description && (
          <p className="text-military-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-military-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(event.scheduledDate), "d 'de' MMM", {
                locale: es,
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-military-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(event.scheduledDate), 'HH:mm', { locale: es })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-military-600 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            <span>{event.gameType === 'ARMA_3' ? 'Arma 3' : 'Arma Reforger'}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-military-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span>
              {event.occupiedSlots}/{event.totalSlots} slots
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-military-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 dark:bg-tactical-600 h-2 rounded-full transition-all"
              style={{
                width: `${
                  event.totalSlots
                    ? (event.occupiedSlots! / event.totalSlots) * 100
                    : 0
                }%`,
              }}
            />
          </div>
          <span className="text-xs text-military-600 dark:text-gray-400 font-medium">
            {event.totalSlots
              ? Math.round((event.occupiedSlots! / event.totalSlots) * 100)
              : 0}
            %
          </span>
        </div>

        {/* Creador */}
        {event.creator && (
          <div className="mt-3 pt-3 border-t border-military-200 dark:border-gray-700">
            <p className="text-xs text-military-500 dark:text-gray-500">
              Creado por{' '}
              <span className="font-medium text-military-700 dark:text-gray-300">
                {event.creator.clan?.tag && `${event.creator.clan.tag} `}
                {event.creator.nickname}
              </span>
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}