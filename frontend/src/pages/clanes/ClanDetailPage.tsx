import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Shield, Edit, Trash2 } from 'lucide-react';
import { useClan, useClanMembers, useDeleteClan } from '../../hooks/useClans';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { MembersList } from '../../components/clanes/MembersList';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ClanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: clanData, isLoading: loadingClan } = useClan(id!);
  const { data: membersData, isLoading: loadingMembers } = useClanMembers(id!);
  const deleteClan = useDeleteClan();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canManage = user?.role === 'ADMIN' || 
    (user?.role === 'CLAN_LEADER' && user?.clanId === id);
  const canDelete = user?.role === 'ADMIN';
  const isLoading = loadingClan || loadingMembers;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!clanData?.clan) {
    return (
      <div className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-400">Clan no encontrado</p>
        <Link
          to="/clanes"
          className="text-primary-600 dark:text-tactical-400 hover:text-primary-700 dark:hover:text-tactical-300 mt-2 inline-block"
        >
          Volver a clanes
        </Link>
      </div>
    );
  }

  const clan = clanData.clan;
  const members = membersData?.members || [];

  const handleDelete = async () => {
    try {
      await deleteClan.mutateAsync(id!);
      navigate('/clanes');
    } catch (err) {
      console.error('Error al eliminar clan:', err);
    }
  };

  return (
    <div>
      <Link
        to="/clanes"
        className="inline-flex items-center text-military-600 dark:text-gray-400 hover:text-military-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a clanes
      </Link>

      {/* Header del clan */}
      <Card className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {clan.avatarUrl ? (
              <img
                src={`http://localhost:3000${clan.avatarUrl}`}
                alt={clan.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-primary-200 dark:border-tactical-600"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="bg-primary-100 dark:bg-tactical-900 p-4 rounded-full">
                <Shield className="h-8 w-8 text-primary-600 dark:text-tactical-400" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-military-900 dark:text-gray-100">
                {clan.name}
              </h1>
              {clan.tag && (
                <Badge variant="info" className="mt-2">
                  {clan.tag}
                </Badge>
              )}
            </div>
          </div>

          {canManage && (
            <div className="flex gap-2">
              <Link
                to={`/clanes/${clan.id}/edit`}
                className="btn btn-secondary btn-sm flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Link>
            </div>
          )}
        </div>

        {clan.description && (
          <p className="text-military-600 dark:text-gray-300 mb-4">{clan.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-military-200 dark:border-gray-700">
          <div className="flex items-center text-military-600 dark:text-gray-400">
            <Users className="h-5 w-5 mr-3" />
            <div>
              <p className="text-xs text-military-500 dark:text-gray-500">Miembros</p>
              <p className="font-medium text-military-900 dark:text-gray-100">{members.length}</p>
            </div>
          </div>
          <div className="text-military-600 dark:text-gray-400">
            <p className="text-xs text-military-500 dark:text-gray-500">Creado</p>
            <p className="font-medium text-military-900 dark:text-gray-100">
              {format(new Date(clan.createdAt), "d 'de' MMMM, yyyy", {
                locale: es,
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Lista de miembros */}
      <Card>
        <h2 className="text-xl font-bold text-military-900 dark:text-gray-100 mb-4">
          Miembros del Clan
        </h2>
        <MembersList members={members} />
      </Card>

      {/* Zona de peligro */}
      {canDelete && (
        <Card className="mt-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <h3 className="text-lg font-bold text-red-900 dark:text-red-400 mb-2">
            Zona de Peligro
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mb-4">
            Eliminar este clan es una acción permanente. Todos los miembros perderán su clan.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Clan
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-900 dark:text-red-400">
                ¿Estás seguro? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleteClan.isPending}
                  className="btn btn-danger"
                >
                  {deleteClan.isPending ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}