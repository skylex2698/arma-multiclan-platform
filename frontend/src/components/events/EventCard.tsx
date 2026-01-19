import { Link } from 'react-router-dom';
import { Calendar, Users, Clock, MapPin } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import type { Event } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const occupancyPercentage = event.totalSlots
    ? Math.round((event.occupiedSlots! / event.totalSlots) * 100)
    : 0;

  const isUpcoming = new Date(event.scheduledDate) > new Date();
  const isPast = new Date(event.scheduledDate) < new Date();

  return (
    <Link to={`/events/${event.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-military-900 mb-2">
              {event.name}
            </h3>
            <p className="text-sm text-military-600 line-clamp-2">
              {event.description || 'Sin descripción'}
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <Badge variant={event.status === 'ACTIVE' ? 'success' : 'default'}>
              {event.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
            </Badge>
            {isPast && event.status === 'ACTIVE' && (
              <Badge variant="warning">Finalizado</Badge>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-military-600">
            <Calendar className="h-4 w-4 mr-2" />
            {format(new Date(event.scheduledDate), "d 'de' MMMM, yyyy", {
              locale: es,
            })}
          </div>
          <div className="flex items-center text-sm text-military-600">
            <Clock className="h-4 w-4 mr-2" />
            {format(new Date(event.scheduledDate), 'HH:mm', { locale: es })}
          </div>
          <div className="flex items-center text-sm text-military-600">
            <MapPin className="h-4 w-4 mr-2" />
            {event.gameType === 'ARMA_3' ? 'Arma 3' : 'Arma Reforger'}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-military-200">
          <div className="flex items-center text-sm text-military-600">
            <Users className="h-4 w-4 mr-2" />
            <span>
              {event.occupiedSlots}/{event.totalSlots} slots ocupados
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-military-500 mb-1">
              {occupancyPercentage}% ocupado
            </div>
            <div className="w-32 bg-military-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {event.creator && (
          <div className="mt-4 pt-4 border-t border-military-200">
            <p className="text-xs text-military-500">
              Creado por{' '}
              <span className="font-medium text-military-700">
                {event.creator.clan?.tag && `${event.creator.clan.tag} `}
                {event.creator.nickname}
              </span>
            </p>
          </div>
        )}
      </Card>
    </Link>
  );
}