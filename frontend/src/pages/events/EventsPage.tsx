import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { useAuthStore } from '../../store/authStore';
import { EventCard } from '../../components/events/EventCard';
import { EventFilters } from '../../components/events/EventFilters';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function EventsPage() {
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [gameTypeFilter, setGameTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(false);

  const { data, isLoading, error } = useEvents({
    gameType: gameTypeFilter || undefined,
    status: statusFilter || undefined,
    upcoming: upcomingOnly || undefined,
  });

  const filteredEvents = useMemo(() => {
    if (!data?.events) return [];

    let filtered = data.events;

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter((event) =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [data?.events, searchQuery]);

  const canCreateEvent = user?.role === 'ADMIN' || user?.role === 'CLAN_LEADER';

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">Error al cargar eventos</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-military-900 dark:text-gray-100 mb-2">
            Eventos
          </h1>
          <p className="text-military-600 dark:text-gray-400">
            {data?.count || 0} eventos disponibles
          </p>
        </div>
        {canCreateEvent && (
          <Link to="/events/create" className="btn btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Crear Evento
          </Link>
        )}
      </div>

      <EventFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        gameTypeFilter={gameTypeFilter}
        onGameTypeChange={setGameTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        upcomingOnly={upcomingOnly}
        onUpcomingOnlyChange={setUpcomingOnly}
      />

      {filteredEvents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-military-600 mb-4">No hay eventos disponibles</p>
          {canCreateEvent && (
            <Link to="/events/create" className="btn btn-primary inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Crear primer evento
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}