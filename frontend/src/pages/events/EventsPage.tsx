import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useEvents, useRestoreEvent } from '../../hooks/useEvents';
import { useGames } from '../../hooks/useGames';
import { useAuthStore } from '../../store/authStore';
import { EventCard } from '../../components/events/EventCard';
import { EventFilters } from '../../components/events/EventFilters';
import { ViewToggle } from '../../components/events/ViewToggle';
import { EventCalendar } from '../../components/events/EventCalendar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Pagination } from '../../components/ui/Pagination';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';

const ITEMS_PER_PAGE = 12;
const CALENDAR_ITEMS_LIMIT = 100;

export default function EventsPage() {
  const user = useAuthStore((state) => state.user);
  const { data: gamesData } = useGames();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [gameIdFilter, setGameIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error } = useEvents({
    gameId: gameIdFilter || undefined,
    status:
      statusFilter && statusFilter !== 'DELETED' ? statusFilter : undefined,
    includeAll:
      !statusFilter || (statusFilter !== 'ACTIVE' && statusFilter !== 'DELETED')
        ? true
        : undefined,
    deleted: statusFilter === 'DELETED' ? true : undefined,
    search: debouncedSearch || undefined,
    page: view === 'calendar' ? 1 : page,
    limit: view === 'calendar' ? CALENDAR_ITEMS_LIMIT : ITEMS_PER_PAGE,
  });

  const events = data?.events || [];
  const totalPages = data?.totalPages || 1;
  const totalEvents = data?.total || 0;

  const handleFilterChange =
    (setter: (value: string | boolean) => void) => (value: string | boolean) => {
      setter(value);
      setPage(1);
    };

  const canCreateEvent = hasPermission(user, PERMISSIONS.EVENT_CREATE);
  const canSeeDeleted =
    hasPermission(user, PERMISSIONS.EVENT_DELETE) ||
    hasPermission(user, PERMISSIONS.EVENT_RESTORE);
  const isDeletedView = statusFilter === 'DELETED';
  const restoreEvent = useRestoreEvent();

  if (error) {
    return (
      <section className="panel">
        <p className="text-sm text-red-600 dark:text-red-400">
          Error al cargar eventos.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header className="page-header">
        <div>
          <h1 className="page-title">Eventos</h1>
          <p className="page-subtitle">
            {totalEvents} disponibles en la vista actual.
          </p>
        </div>

        <div className="page-actions">
          <ViewToggle view={view} onViewChange={setView} />
          {canCreateEvent && (
            <Link to="/events/create" className="btn btn-primary">
              <Plus className="h-4 w-4" />
              Crear evento
            </Link>
          )}
        </div>
      </header>

      <EventFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        gameIdFilter={gameIdFilter}
        onGameIdChange={(value) => handleFilterChange(setGameIdFilter)(value)}
        statusFilter={statusFilter}
        onStatusChange={(value) => handleFilterChange(setStatusFilter)(value)}
        isAdmin={canSeeDeleted}
        games={gamesData?.games || []}
      />

      {view === 'calendar' ? (
        <EventCalendar events={events} isLoading={isLoading} />
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : events.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            <p>No hay eventos en esta vista.</p>
            {canCreateEvent && (
              <div className="mt-4">
                <Link to="/events/create" className="btn btn-primary">
                  <Plus className="h-4 w-4" />
                  Crear primer evento
                </Link>
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          <div className="list-surface">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isDeleted={isDeletedView}
                onRestore={
                  isDeletedView ? () => restoreEvent.mutate(event.id) : undefined
                }
                isRestoring={restoreEvent.isPending}
              />
            ))}
          </div>

          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalEvents}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        </>
      )}
    </div>
  );
}
