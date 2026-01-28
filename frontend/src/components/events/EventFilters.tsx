import { Search, Filter } from 'lucide-react';

interface EventFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  gameTypeFilter: string;
  onGameTypeChange: (type: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
}

export function EventFilters({
  searchQuery,
  onSearchChange,
  gameTypeFilter,
  onGameTypeChange,
  statusFilter,
  onStatusChange,
}: EventFiltersProps) {
  return (
    <div className="card mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-military-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-military-900 dark:text-gray-100">Filtros</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Búsqueda */}
        <div>
          <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-military-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Nombre del evento..."
              className="input pl-10"
            />
          </div>
        </div>

        {/* Tipo de juego */}
        <div>
          <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1">
            Juego
          </label>
          <select
            value={gameTypeFilter}
            onChange={(e) => onGameTypeChange(e.target.value)}
            className="input"
          >
            <option value="">Todos</option>
            <option value="ARMA_3">Arma 3</option>
            <option value="ARMA_REFORGER">Arma Reforger</option>
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="input"
          >
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
            <option value="FINISHED">Finalizados</option>
            <option value="">Todos</option>
          </select>
        </div>
      </div>
    </div>
  );
}
