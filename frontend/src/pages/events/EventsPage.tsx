import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { useAuthStore } from '../../store/authStore';
import { EventCard } from '../../components/events/EventCard';
import { EventFilters } from '../../components/events/EventFilters';
import { ViewToggle } from '../../components/events/ViewToggle';
import { EventCalendar } from '../../components/events/EventCalendar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Pagination } from '../../components/ui/Pagination';

const ITEMS_PER_PAGE = 12;
const CALENDAR_ITEMS_LIMIT = 100; // Load more events for calendar view

export default function EventsPage() {
  const user = useAuthStore((state) => state.user);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [gameTypeFilter, setGameTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [page, setPage] = useState(1);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // includeAll permite mostrar eventos de cualquier estado
  // For calendar view, load more events to display across the month
  const { data, isLoading, error } = useEvents({
    gameType: gameTypeFilter || undefined,
    status: statusFilter || undefined,
    includeAll: !statusFilter || statusFilter !== 'ACTIVE' ? true : undefined,
    search: debouncedSearch || undefined,
    page: view === 'calendar' ? 1 : page,
    limit: view === 'calendar' ? CALENDAR_ITEMS_LIMIT : ITEMS_PER_PAGE,
  });

  const events = data?.events || [];
  const totalPages = data?.totalPages || 1;
  const totalEvents = data?.total || 0;

  const handleFilterChange = (setter: (value: string | boolean) => void) => (value: string | boolean) => {
    setter(value);
    setPage(1); // Reset to first page on filter change
  };

  const canCreateEvent = user?.role === 'ADMIN' || user?.role === 'CLAN_LEADER';

  if (error) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">Error al cargar eventos</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-military-900 dark:text-gray-100 mb-2">
            Eventos
          </h1>
          <p className="text-military-600 dark:text-gray-400">
            {totalEvents} eventos disponibles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onViewChange={setView} />
          {canCreateEvent && (
            <Link to="/events/create" className="btn btn-primary flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Crear Evento
            </Link>
          )}
        </div>
      </div>

      <EventFilters
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
        }}
        gameTypeFilter={gameTypeFilter}
        onGameTypeChange={(value) => handleFilterChange(setGameTypeFilter)(value)}
        statusFilter={statusFilter}
        onStatusChange={(value) => handleFilterChange(setStatusFilter)(value)}
      />

      {view === 'calendar' ? (
        <EventCalendar events={events} isLoading={isLoading} />
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : events.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-military-600 dark:text-gray-400 mb-4">No hay eventos disponibles</p>
          {canCreateEvent && (
            <Link to="/events/create" className="btn btn-primary inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Crear primer evento
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Paginación */}
          <div className="mt-8">
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
