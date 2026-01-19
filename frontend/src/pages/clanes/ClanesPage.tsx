import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useClans } from '../../hooks/useClans';
import { useAuthStore } from '../../store/authStore';
import { ClanCard } from '../../components/clanes/ClanCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';

export default function ClanesPage() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, error } = useClans();
  const [searchQuery, setSearchQuery] = useState('');

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
          <h1 className="text-3xl font-bold text-military-900">Clanes</h1>
          <p className="text-military-600 mt-1">
            {data?.count || 0} clanes registrados
          </p>
        </div>
        {canManageClans && (
          <Link to="/clanes/create" className="btn btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Crear Clan
          </Link>
        )}
      </div>

      {/* Buscador */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-military-400" />
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
          <p className="text-military-600 mb-4">
            {searchQuery ? 'No se encontraron clanes' : 'No hay clanes registrados'}
          </p>
          {canManageClans && !searchQuery && (
            <Link to="/clanes/create" className="btn btn-primary inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Crear primer clan
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClans.map((clan) => (
            <ClanCard key={clan.id} clan={clan} />
          ))}
        </div>
      )}
    </div>
  );
}