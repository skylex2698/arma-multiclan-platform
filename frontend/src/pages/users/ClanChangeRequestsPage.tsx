import { useState } from 'react';
import { Users, Shield, Check, X, Filter, AlertCircle } from 'lucide-react';
import { useClanChangeRequests, useReviewClanChangeRequest } from '../../hooks/useUsers';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ClanChangeRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isClanLeader = currentUser?.role === 'CLAN_LEADER';

  const { data, isLoading } = useClanChangeRequests({ status: statusFilter !== 'ALL' ? statusFilter : undefined });
  const reviewRequest = useReviewClanChangeRequest();

  const requests = data?.requests || [];

  const handleReview = async (requestId: string, approved: boolean) => {
    try {
      await reviewRequest.mutateAsync({ requestId, approved });
    } catch (err) {
      console.error('Error al revisar solicitud:', err);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-military-900 dark:text-gray-100">
            Solicitudes de Cambio de Clan
          </h1>
          <p className="text-military-600 dark:text-gray-400 mt-1">
            {requests.length} solicitudes {statusFilter !== 'ALL' && `(${statusFilter.toLowerCase()})`}
          </p>
          {isClanLeader && (
            <p className="text-sm text-military-500 dark:text-gray-500 mt-2">
              ℹ️ Solo puedes ver solicitudes para unirse a tu clan
            </p>
          )}
        </div>
        <Shield className="h-8 w-8 text-primary-600 dark:text-tactical-500" />
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-military-600 dark:text-gray-400" />
          <h2 className="text-lg font-bold text-military-900 dark:text-gray-100">
            Filtros
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="REJECTED">Rechazadas</option>
              <option value="ALL">Todas</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de solicitudes */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-military-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-military-500 dark:text-gray-500">
                No hay solicitudes {statusFilter !== 'ALL' && statusFilter.toLowerCase()}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Avatar del usuario */}
                  <UserAvatar user={request.user} size="lg" showBorder={true} />

                  {/* Información */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-military-900 dark:text-gray-100">
                          {request.user.nickname}
                        </h3>
                        <p className="text-sm text-military-600 dark:text-gray-400">
                          {request.user.email}
                        </p>
                      </div>
                      <Badge
                        variant={
                          request.status === 'APPROVED'
                            ? 'success'
                            : request.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {request.status === 'PENDING' ? 'Pendiente' :
                         request.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                      </Badge>
                    </div>

                    {/* Detalles */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-military-500 dark:text-gray-400" />
                        <span className="text-military-700 dark:text-gray-300">
                          <strong>De:</strong>{' '}
                          {request.currentClan ? (
                            <>{request.currentClan.tag} {request.currentClan.name}</>
                          ) : (
                            'Sin clan'
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-primary-600 dark:text-tactical-500" />
                        <span className="text-military-700 dark:text-gray-300">
                          <strong>A:</strong> {request.targetClan.tag} {request.targetClan.name}
                        </span>
                      </div>

                      <div className="text-sm text-military-600 dark:text-gray-400">
                        <strong>Fecha:</strong>{' '}
                        {format(new Date(request.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </div>

                      {request.reason && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm">
                          <strong className="text-military-700 dark:text-gray-300">Motivo:</strong>
                          <p className="text-military-600 dark:text-gray-400 mt-1">
                            {request.reason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción - Solo para pendientes */}
                    {request.status === 'PENDING' && (isAdmin || (isClanLeader && request.targetClan.id === currentUser?.clanId)) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(request.id, true)}
                          disabled={reviewRequest.isPending}
                          className="btn btn-success flex items-center gap-1 text-sm"
                        >
                          <Check className="h-4 w-4" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReview(request.id, false)}
                          disabled={reviewRequest.isPending}
                          className="btn btn-danger flex items-center gap-1 text-sm"
                        >
                          <X className="h-4 w-4" />
                          Rechazar
                        </button>
                      </div>
                    )}

                    {/* Info de revisión */}
                    {request.status !== 'PENDING' && (
                      <div className="text-xs text-military-500 dark:text-gray-500 mt-2">
                        {request.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'} por{' '}
                        {request.reviewer?.nickname || 'Admin'} el{' '}
                        {request.reviewedAt &&
                          format(new Date(request.reviewedAt), "d 'de' MMMM, yyyy", {
                            locale: es,
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
