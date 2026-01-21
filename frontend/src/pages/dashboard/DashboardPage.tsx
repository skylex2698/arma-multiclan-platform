import { useAuthStore } from '../../store/authStore';
import { useEvents } from '../../hooks/useEvents';
import { useUsers } from '../../hooks/useUsers';
import { useClanChangeRequests } from '../../hooks/useUsers';
import { StatsCard } from '../../components/ui/StatsCard';
import { QuickActions } from '../../components/ui/QuickActions';
import { EventCardCompact } from '../../components/events/EventCardCompact';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  Calendar,
  CheckCircle,
  TrendingUp,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  // Obtener próximos eventos
  const { data: upcomingEventsData, isLoading: loadingEvents } = useEvents({
    upcoming: true,
    status: 'ACTIVE',
  });

  // Obtener datos de admin y líder de clan
  // Admin ve todos los usuarios pendientes, Líder de Clan solo los de su clan
  const { data: usersData } = useUsers(
    user?.role === 'ADMIN' || user?.role === 'CLAN_LEADER'
      ? { status: 'PENDING' }
      : undefined
  );

  // Admin ve todas las solicitudes, Líder de Clan solo las de su clan
  const { data: requestsData } = useClanChangeRequests(
    user?.role === 'ADMIN' || user?.role === 'CLAN_LEADER'
      ? { status: 'PENDING' }
      : undefined
  );

  if (loadingEvents) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  const upcomingEvents = upcomingEventsData?.events.slice(0, 3) || [];
  const myEvents =
    upcomingEventsData?.events.filter((event) =>
      event.squads.some((squad) =>
        squad.slots.some((slot) => slot.userId === user.id)
      )
    ) || [];

  const totalSlots = upcomingEventsData?.events.reduce(
    (acc, event) => acc + (event.totalSlots || 0),
    0
  ) || 0;

  const occupiedSlots = upcomingEventsData?.events.reduce(
    (acc, event) => acc + (event.occupiedSlots || 0),
    0
  ) || 0;

  const pendingUsers = usersData?.count || 0;
  const pendingRequests = requestsData?.count || 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-military-900 mb-2">
          Bienvenido, {user.nickname}
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="info">
            {user.clan?.tag && `${user.clan.tag} - `}
            {user.clan?.name || 'Sin clan'}
          </Badge>
          <Badge
            variant={
              user.role === 'ADMIN'
                ? 'danger'
                : user.role === 'CLAN_LEADER'
                ? 'warning'
                : 'default'
            }
          >
            {user.role === 'ADMIN'
              ? 'Administrador'
              : user.role === 'CLAN_LEADER'
              ? 'Líder de Clan'
              : 'Miembro'}
          </Badge>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Próximos Eventos"
          value={upcomingEventsData?.count || 0}
          icon={Calendar}
          description="Eventos activos"
        />
        <StatsCard
          title="Mis Inscripciones"
          value={myEvents.length}
          icon={CheckCircle}
          description="Slots reservados"
        />
        <StatsCard
          title="Tasa de Ocupación"
          value={`${totalSlots ? Math.round((occupiedSlots / totalSlots) * 100) : 0}%`}
          icon={TrendingUp}
          description={`${occupiedSlots}/${totalSlots} slots`}
        />
        <StatsCard
          title="Clanes Activos"
          value="3"
          icon={Shield}
          description="Clanes registrados"
        />
      </div>

      {/* Panel de Admin y Líder de Clan */}
      {(user.role === 'ADMIN' || user.role === 'CLAN_LEADER') &&
        (pendingUsers > 0 || pendingRequests > 0) && (
          <div className="mb-8">
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-military-900 dark:text-gray-100 mb-2">
                    Tareas Pendientes
                    {user.role === 'CLAN_LEADER' && (
                      <span className="text-sm font-normal text-military-600 dark:text-gray-400 ml-2">
                        (de tu clan)
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {pendingUsers > 0 && (
                      <Link
                        to="/users"
                        className="block text-sm text-military-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-tactical-400"
                      >
                        • {pendingUsers} {user.role === 'CLAN_LEADER' ? 'miembro' : 'usuario'}
                        {pendingUsers !== 1 ? 's' : ''} pendiente
                        {pendingUsers !== 1 ? 's' : ''} de validación →
                      </Link>
                    )}
                    {pendingRequests > 0 && (
                      <Link
                        to="/users/requests"
                        className="block text-sm text-military-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-tactical-400"
                      >
                        • {pendingRequests} solicitud{pendingRequests !== 1 ? 'es' : ''} de
                        cambio de clan →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

      {/* Accesos rápidos */}
      <div className="mb-8">
        <QuickActions userRole={user.role} />
      </div>

      {/* Próximos eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-military-900 dark:text-gray-100">
              Próximos Eventos
            </h2>
            <Link
              to="/events"
              className="text-sm text-primary-600 dark:text-tactical-400 hover:text-primary-700 dark:hover:text-tactical-300 font-medium"
            >
              Ver todos →
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <Card>
              <p className="text-center py-8 text-military-600 dark:text-gray-400">
                No hay eventos próximos
              </p>
              {(user.role === 'ADMIN' || user.role === 'CLAN_LEADER') && (
                <div className="text-center">
                  <Link to="/events/create" className="btn btn-primary">
                    Crear Evento
                  </Link>
                </div>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <EventCardCompact key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Mis eventos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-military-900 dark:text-gray-100">
              Mis Inscripciones
            </h2>
            {myEvents.length > 0 && (
              <Badge variant="success">{myEvents.length}</Badge>
            )}
          </div>
          {myEvents.length === 0 ? (
            <Card>
              <p className="text-center py-8 text-military-600 dark:text-gray-400">
                No estás inscrito en ningún evento
              </p>
              <div className="text-center">
                <Link to="/events" className="btn btn-primary">
                  Explorar Eventos
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {myEvents.map((event) => (
                <EventCardCompact key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}