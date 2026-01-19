import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { useEvent } from '../../hooks/useEvents';
import { useAssignSlot, useUnassignSlot } from '../../hooks/useSlots';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { SquadSection } from '../../components/events/SquadSection';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { Edit } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAdminAssignSlot, useAdminUnassignSlot } from '../../hooks/useSlots';
import { useUsers } from '../../hooks/useUsers';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, error } = useEvent(id!);
  const assignSlot = useAssignSlot(id!);
  const unassignSlot = useUnassignSlot(id!);
  const [actionError, setActionError] = useState('');
  const adminAssignSlot = useAdminAssignSlot();
  const adminUnassignSlot = useAdminUnassignSlot();

  // Obtener usuarios disponibles para asignación (AGREGAR)
  const { data: usersData } = useUsers(
    user?.role === 'ADMIN' || user?.role === 'CLAN_LEADER'
      ? {
          status: 'ACTIVE',
          ...(user?.role === 'CLAN_LEADER' && user?.clan?.id
            ? { clanId: user.clan.id }
            : {}),
        }
      : undefined
  );

  // CAMBIO: NO filtrar usuarios que ya están en el evento
  // Filtrar usuarios que NO están ya en el evento (AGREGAR)
  const availableUsers = usersData?.users || [];

  const handleAdminAssign = async (slotId: string, userId: string) => {
    try {
      await adminAssignSlot.mutateAsync({ slotId, userId });
    } catch (err) {
      console.error('Error al asignar usuario:', err);
    }
  };

  const handleAdminUnassign = async (slotId: string) => {
    try {
      await adminUnassignSlot.mutateAsync(slotId);
    } catch (err) {
      console.error('Error al desasignar usuario:', err);
    }
  };

  // Opcional: Marcar visualmente cuáles ya están asignados
  const getUserSlotInfo = (userId: string) => {
    for (const squad of data?.event?.squads || []) {
      const slot = squad.slots.find((s) => s.userId === userId);
      if (slot) {
        return {
          hasSlot: true,
          squadName: squad.name,
          slotRole: slot.role,
        };
      }
    }
    return { hasSlot: false };
  };

  const handleAssignSlot = async (slotId: string) => {
    setActionError('');
    try {
      await assignSlot.mutateAsync(slotId);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setActionError(
        error.response?.data?.message || 'Error al asignarte al slot'
      );
    }
  };

  const handleUnassignSlot = async (slotId: string) => {
    setActionError('');
    try {
      await unassignSlot.mutateAsync(slotId);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setActionError(
        error.response?.data?.message || 'Error al desasignarte del slot'
      );
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !data?.event) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">Error al cargar el evento</p>
        <Link to="/events" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Volver a eventos
        </Link>
      </div>
    );
  }

  const canEditEvent =
    user?.role === 'ADMIN' ||
    data?.event?.creatorId === user?.id ||
    (user?.role === 'CLAN_LEADER' &&
      user?.clan?.id === data?.event?.creator?.clanId);

  const isPast = data?.event ? new Date(data.event.scheduledDate) < new Date() : false;
  const event = data.event;

  return (
    <div>
      <Link
        to="/events"
        className="inline-flex items-center text-military-600 hover:text-military-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a eventos
      </Link>

      {/* Header del evento */}
      <Card className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-military-900 mb-2">
              {event.name}
            </h1>
            {event.description && (
              <p className="text-military-600">{event.description}</p>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <Badge variant={event.status === 'ACTIVE' ? 'success' : 'default'}>
              {event.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
            </Badge>
            {isPast && event.status === 'ACTIVE' && (
              <Badge variant="warning">Finalizado</Badge>
            )}

            {canEditEvent && (
              <Link
                to={`/events/${event.id}/edit`}
                className="btn btn-secondary btn-sm flex items-center ml-2"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Link>
            )}

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center text-military-600">
            <Calendar className="h-5 w-5 mr-3" />
            <div>
              <p className="text-xs text-military-500">Fecha</p>
              <p className="font-medium">
                {format(new Date(event.scheduledDate), "d 'de' MMMM, yyyy", {
                  locale: es,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center text-military-600">
            <Clock className="h-5 w-5 mr-3" />
            <div>
              <p className="text-xs text-military-500">Hora</p>
              <p className="font-medium">
                {format(new Date(event.scheduledDate), 'HH:mm', { locale: es })}
              </p>
            </div>
          </div>

          <div className="flex items-center text-military-600">
            <MapPin className="h-5 w-5 mr-3" />
            <div>
              <p className="text-xs text-military-500">Juego</p>
              <p className="font-medium">
                {event.gameType === 'ARMA_3' ? 'Arma 3' : 'Arma Reforger'}
              </p>
            </div>
          </div>
        </div>

        {event.creator && (
          <div className="flex items-center text-sm text-military-600 pt-4 border-t border-military-200">
            <User className="h-4 w-4 mr-2" />
            <span>
              Creado por{' '}
              <span className="font-medium text-military-900">
                {event.creator.clan?.tag && `${event.creator.clan.tag} `}
                {event.creator.nickname}
              </span>
            </span>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-military-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-military-600">
              {event.occupiedSlots}/{event.totalSlots} slots ocupados
            </span>
            <div className="w-48 bg-military-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    event.totalSlots
                      ? (event.occupiedSlots! / event.totalSlots) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Error de acción */}
      {actionError && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{actionError}</p>
          </div>
        </div>
      )}

      {/* Briefing */}
      {event.briefing && (
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-military-900 mb-4">Briefing</h2>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: event.briefing }}
          />
        </Card>
      )}

      {/* Escuadras y Slots */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-military-900">
          Escuadras y Slots
        </h2>
        {event.squads
          .sort((a, b) => a.order - b.order)
          .map((squad) => (
            <SquadSection
              key={squad.id}
              squad={squad}
              onAssignSlot={handleAssignSlot}
              onUnassignSlot={handleUnassignSlot}
              onAdminAssign={handleAdminAssign}
              onAdminUnassign={handleAdminUnassign}
              isLoading={
                assignSlot.isPending ||
                unassignSlot.isPending ||
                adminAssignSlot.isPending ||
                adminUnassignSlot.isPending
              }
              eventStatus={event.status}
              availableUsers={availableUsers}
              getUserSlotInfo={getUserSlotInfo}
            />
          ))}
      </div>
    </div>
  );
}