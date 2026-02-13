import { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { useClans, useRestoreClan } from '../../hooks/useClans';
import { useAuthStore } from '../../store/authStore';
import { ClanCard } from '../../components/clanes/ClanCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';

export default function ClanesPage() {
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  const { data, isLoading, error } = useClans(
    showDeleted ? { deleted: true } : undefined
  );
  const restoreClan = useRestoreClan();

  const filteredClans = data?.clans.filter((clan) =>
    clan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clan.tag?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const canManageClans = user?.role === 'ADMIN';

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">Error al cargar clanes</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-military-900 dark:text-gray-100">Clanes</h1>
          <p className="text-military-600 dark:text-gray-400 mt-1">
            {data?.count || 0} {showDeleted ? 'clanes eliminados' : 'clanes registrados'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManageClans && (
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`btn ${showDeleted ? 'btn-danger' : 'btn-outline'} flex items-center`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {showDeleted ? 'Ver Activos' : 'Eliminados'}
            </button>
          )}
          {canManageClans && !showDeleted && (
            <Link to="/clanes/create" className="btn btn-primary flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Crear Clan
            </Link>
          )}
        </div>
      </div>

      {/* Buscador */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-military-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar clan por nombre o tag..."
            className="input pl-10"
          />
        </div>
      </div>

      {filteredClans.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-military-600 dark:text-gray-400 mb-4">
            {searchQuery
              ? 'No se encontraron clanes'
              : showDeleted
                ? 'No hay clanes eliminados'
                : 'No hay clanes registrados'}
          </p>
          {canManageClans && !searchQuery && !showDeleted && (
            <Link to="/clanes/create" className="btn btn-primary inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Crear primer clan
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClans.map((clan) => (
            <ClanCard
              key={clan.id}
              clan={clan}
              isDeleted={showDeleted}
              onRestore={showDeleted ? () => restoreClan.mutate(clan.id) : undefined}
              isRestoring={restoreClan.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
