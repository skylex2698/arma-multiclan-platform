import { useState } from 'react';
import { Building2, CheckCircle2, Filter, XCircle } from 'lucide-react';
import {
  useClanCreationRequests,
  useReviewClanCreationRequest,
} from '../../hooks/useUsers';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function ClanCreationRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const { data, isLoading } = useClanCreationRequests({
    status: statusFilter || undefined,
  });
  const reviewRequest = useReviewClanCreationRequest();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const requests = data?.requests || [];

  return (
    <div className="space-y-6">
      <header className="page-header">
        <div>
          <h1 className="page-title">Solicitudes de nuevo clan</h1>
          <p className="page-subtitle">{data?.count || 0} en la vista actual.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Filtros</h2>
          </div>
        </div>

        <div className="max-w-xs">
          <label className="field-label">Estado</label>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-military-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input pl-9"
            >
              <option value="">Todas</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="REJECTED">Rechazadas</option>
              <option value="FULFILLED">Completadas</option>
            </select>
          </div>
        </div>
      </section>

      {requests.length === 0 ? (
        <section className="panel">
          <div className="empty-state">No hay solicitudes en esta vista.</div>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {requests.map((request) => (
            <section key={request.id} className="panel">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary-600" />
                    <h2 className="section-title">{request.requestedName}</h2>
                  </div>
                  <p className="section-caption">
                    Solicitado por {request.user?.nickname} · {request.user?.email}
                  </p>
                </div>
                <span className="section-caption">{request.status}</span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-military-700 dark:text-gray-300">
                <p>
                  <strong>Tag:</strong> {request.requestedTag || 'Sin tag'}
                </p>
                <p>
                  <strong>Juego principal:</strong> {request.primaryGame?.name}
                </p>
                <p>
                  <strong>Descripción:</strong>{' '}
                  {request.requestedDescription || 'Sin descripción inicial'}
                </p>
              </div>

              {request.status === 'PENDING' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={reviewRequest.isPending}
                    onClick={() =>
                      reviewRequest.mutate({
                        requestId: request.id,
                        approved: true,
                      })
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Aprobar
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={reviewRequest.isPending}
                    onClick={() =>
                      reviewRequest.mutate({
                        requestId: request.id,
                        approved: false,
                      })
                    }
                  >
                    <XCircle className="h-4 w-4" />
                    Rechazar
                  </button>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
