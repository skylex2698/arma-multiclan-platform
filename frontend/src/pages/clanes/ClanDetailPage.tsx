import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Shield, Edit, Trash2 } from 'lucide-react';
import { useClan, useClanMembers } from '../../hooks/useClans';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { MembersList } from '../../components/clanes/MembersList';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ClanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { data: clanData, isLoading: loadingClan } = useClan(id!);
  const { data: membersData, isLoading: loadingMembers } = useClanMembers(id!);

  const canManage = user?.role === 'ADMIN';
  const isLoading = loadingClan || loadingMembers;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!clanData?.clan) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">Clan no encontrado</p>
        <Link
          to="/clanes"
          className="text-primary-600 hover:text-primary-700 mt-2 inline-block"
        >
          Volver a clanes
        </Link>
      </div>
    );
  }

  const clan = clanData.clan;
  const members = membersData?.members || [];

  return (
    <div>
      <Link
        to="/clanes"
        className="inline-flex items-center text-military-600 hover:text-military-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a clanes
      </Link>

      {/* Header del clan */}
      <Card className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary-100 p-4 rounded-full">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-military-900">
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
              <button className="btn btn-danger btn-sm flex items-center">
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </button>
            </div>
          )}
        </div>

        {clan.description && (
          <p className="text-military-600 mb-4">{clan.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-military-200">
          <div className="flex items-center text-military-600">
            <Users className="h-5 w-5 mr-3" />
            <div>
              <p className="text-xs text-military-500">Miembros</p>
              <p className="font-medium">{members.length}</p>
            </div>
          </div>
          <div className="text-military-600">
            <p className="text-xs text-military-500">Creado</p>
            <p className="font-medium">
              {format(new Date(clan.createdAt), "d 'de' MMMM, yyyy", {
                locale: es,
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Lista de miembros */}
      <Card>
        <h2 className="text-xl font-bold text-military-900 mb-4">
          Miembros del Clan
        </h2>
        <MembersList members={members} />
      </Card>
    </div>
  );
}