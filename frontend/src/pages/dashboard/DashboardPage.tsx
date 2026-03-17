import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useEvents } from '../../hooks/useEvents';
import { useUsers, useClanChangeRequests, useClanCreationRequests } from '../../hooks/useUsers';
import { useClans } from '../../hooks/useClans';
import { EventCardCompact } from '../../components/events/EventCardCompact';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { QuickActions } from '../../components/ui/QuickActions';
import { getRoleDisplayName, hasPermission, PERMISSIONS } from '../../utils/permissions';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: upcomingEventsData, isLoading: loadingEvents } = useEvents({
    upcoming: true,
    status: 'ACTIVE',
  });

  const { data: usersData } = useUsers(
    hasPermission(user, PERMISSIONS.USER_VIEW)
      ? { status: 'PENDING' }
      : undefined
  );

  const { data: requestsData } = useClanChangeRequests(
    user?.role === 'ADMIN' || user?.role === 'CLAN_LEADER'
      ? { status: 'PENDING' }
      : undefined
  );
  const { data: clanCreationRequestsData } = useClanCreationRequests(
    user?.role === 'ADMIN' ? { status: 'PENDING' } : undefined
  );

  const { data: clansData } = useClans();

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

  const totalSlots =
    upcomingEventsData?.events.reduce(
      (acc, event) => acc + (event.totalSlots || 0),
      0
    ) || 0;

  const occupiedSlots =
    upcomingEventsData?.events.reduce(
      (acc, event) => acc + (event.occupiedSlots || 0),
      0
    ) || 0;

  const pendingUsers = usersData?.total || 0;
  const pendingRequests = requestsData?.count || 0;
  const pendingClanCreationRequests = clanCreationRequestsData?.count || 0;
  const canCreateEvent = hasPermission(user, PERMISSIONS.EVENT_CREATE);
  return (
    <div className="space-y-6">
      <header className="page-header">
        <div>
          <h1 className="page-title">Bienvenido, {user.nickname}</h1>
          <div className="meta-inline mt-2">
            <Badge variant="info">
              {user.clan?.tag ? `${user.clan.tag} - ` : ''}
              {user.clan?.name || 'Sin clan'}
            </Badge>
            <Badge
              variant={
                user.role === 'ADMIN'
                  ? 'danger'
                  : user.role === 'CLAN_LEADER'
                    ? 'warning'
                    : user.role === 'RECRUITER'
                      ? 'success'
                      : 'info'
              }
            >
              {getRoleDisplayName(user)}
            </Badge>
          </div>
        </div>
      </header>

      <section className="metric-strip">
        <div className="metric-strip-inner">
          <div className="metric-block">
            <p className="text-[13px] text-military-600 dark:text-gray-400">
              Proximos eventos
            </p>
            <p className="mt-1 flex items-baseline gap-2 text-military-900 dark:text-gray-100">
              <span className="text-2xl font-bold">
                {upcomingEventsData?.total || 0}
              </span>
              <span className="text-sm text-military-600 dark:text-gray-400">
                Misiones activas
              </span>
            </p>
          </div>
          <div className="metric-block">
            <p className="text-[13px] text-military-600 dark:text-gray-400">
              Mis inscripciones
            </p>
            <p className="mt-1 flex items-baseline gap-2 text-military-900 dark:text-gray-100">
              <span className="text-2xl font-bold">{myEvents.length}</span>
              <span className="text-sm text-military-600 dark:text-gray-400">
                Slots reservados
              </span>
            </p>
          </div>
          <div className="metric-block">
            <p className="text-[13px] text-military-600 dark:text-gray-400">
              Ocupacion media
            </p>
            <p className="mt-1 flex items-baseline gap-2 text-military-900 dark:text-gray-100">
              <span className="text-2xl font-bold">
                {totalSlots ? Math.round((occupiedSlots / totalSlots) * 100) : 0}%
              </span>
              <span className="text-sm text-military-600 dark:text-gray-400">
                {occupiedSlots}/{totalSlots} slots
              </span>
            </p>
          </div>
          <div className="metric-block">
            <p className="text-[13px] text-military-600 dark:text-gray-400">
              Clanes activos
            </p>
            <p className="mt-1 flex items-baseline gap-2 text-military-900 dark:text-gray-100">
              <span className="text-2xl font-bold">{clansData?.count || 0}</span>
              <span className="text-sm text-military-600 dark:text-gray-400">
                Organizaciones registradas
              </span>
            </p>
          </div>
        </div>
      </section>

      <QuickActions
        userRole={user.role}
        pendingUsers={pendingUsers}
        pendingRequests={pendingRequests}
        pendingClanCreationRequests={pendingClanCreationRequests}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-3">
          <div className="panel-header mb-0">
            <div>
              <h2 className="section-title">Proximos eventos</h2>
              <p className="section-caption">Resumen operativo inmediato.</p>
            </div>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="panel">
              <div className="empty-state">
                <p>No hay eventos proximos.</p>
                {canCreateEvent && (
                  <div className="mt-4">
                    <Link to="/events/create" className="btn btn-primary">
                      Crear evento
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="list-surface">
              {upcomingEvents.map((event) => (
                <EventCardCompact key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="panel-header mb-0">
            <div>
              <h2 className="section-title">Mis inscripciones</h2>
              <p className="section-caption">Tus plazas ya reservadas.</p>
            </div>
            {myEvents.length > 0 && <Badge variant="success">{myEvents.length}</Badge>}
          </div>

          {myEvents.length === 0 ? (
            <div className="panel">
              <div className="empty-state">
                <p>No estas inscrito en ningun evento.</p>
                <div className="mt-4">
                  <Link to="/events" className="btn btn-primary">
                    Explorar eventos
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="list-surface">
              {myEvents.map((event) => (
                <EventCardCompact key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
