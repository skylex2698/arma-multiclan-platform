import { Search } from 'lucide-react';
import type { Game } from '../../types';

interface EventFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  gameIdFilter: string;
  onGameIdChange: (type: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  isAdmin?: boolean;
  games: Game[];
}

export function EventFilters({
  searchQuery,
  onSearchChange,
  gameIdFilter,
  onGameIdChange,
  statusFilter,
  onStatusChange,
  isAdmin,
  games,
}: EventFiltersProps) {
  return (
    <section className="panel mb-6">
      <div className="panel-header">
        <div>
          <h2 className="section-title">Filtros</h2>
          <p className="section-caption">
            Refina la lista sin alargar el layout ni duplicar controles.
          </p>
        </div>
      </div>

      <div className="form-grid-3">
        <div>
          <label className="field-label">Buscar</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-military-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Nombre del evento"
              className="input pl-9"
            />
          </div>
        </div>

        <div>
          <label className="field-label">Juego</label>
          <select
            value={gameIdFilter}
            onChange={(e) => onGameIdChange(e.target.value)}
            className="input"
          >
            <option value="">Todos</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">Estado</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="input"
          >
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
            <option value="FINISHED">Finalizados</option>
            <option value="">Todos</option>
            {isAdmin && <option value="DELETED">Eliminados</option>}
          </select>
        </div>
      </div>
    </section>
  );
}
