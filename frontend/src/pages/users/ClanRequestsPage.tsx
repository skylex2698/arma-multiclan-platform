import { useState } from 'react';
import { GitBranch, Filter } from 'lucide-react';
import {
  useClanChangeRequests,
  useReviewClanChangeRequest,
} from '../../hooks/useUsers';
import { ClanChangeRequestCard } from '../../components/users/ClanChangeRequestCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function ClanRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const { data, isLoading } = useClanChangeRequests({
    status: statusFilter || undefined,
  });

  const reviewRequest = useReviewClanChangeRequest();

  const handleApprove = async (requestId: string) => {
    try {
      await reviewRequest.mutateAsync({ requestId, approved: true });
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await reviewRequest.mutateAsync({ requestId, approved: false });
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const requests = data?.requests || [];
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <GitBranch className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-military-900">
              Solicitudes de Cambio de Clan
            </h1>
            <p className="text-military-600 mt-1">
              {data?.count || 0} solicitudes totales
              {pendingCount > 0 && (
                <span className="ml-2 text-yellow-600 font-medium">
                  • {pendingCount} pendientes
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filtro de estado */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-military-600" />
          <h2 className="text-lg font-semibold text-military-900">Filtros</h2>
        </div>

        <div className="max-w-xs">
          <label className="block text-sm font-medium text-military-700 mb-1">
            Estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">Todas</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="REJECTED">Rechazadas</option>
          </select>
        </div>
      </div>

      {/* Lista de solicitudes */}
      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-military-600">
            {statusFilter
              ? `No hay solicitudes ${
                  statusFilter === 'PENDING'
                    ? 'pendientes'
                    : statusFilter === 'APPROVED'
                    ? 'aprobadas'
                    : 'rechazadas'
                }`
              : 'No hay solicitudes de cambio de clan'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <ClanChangeRequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onReject={handleReject}
              isLoading={reviewRequest.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}