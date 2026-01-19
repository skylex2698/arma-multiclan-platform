import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { ClanChangeRequest } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClanChangeRequestCardProps {
  request: ClanChangeRequest;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isLoading?: boolean;
}

export function ClanChangeRequestCard({
  request,
  onApprove,
  onReject,
  isLoading,
}: ClanChangeRequestCardProps) {
  const isPending = request.status === 'PENDING';

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-military-900">
            {request.user.nickname}
          </h3>
          <p className="text-sm text-military-600">{request.user.email}</p>
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
          {request.status === 'APPROVED'
            ? 'Aprobada'
            : request.status === 'REJECTED'
            ? 'Rechazada'
            : 'Pendiente'}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        <div className="p-2 bg-red-50 rounded">
          <p className="text-xs text-red-700">
            <strong>Clan actual:</strong>{' '}
            {request.user.clan
              ? `${request.user.clan.tag ? `${request.user.clan.tag} - ` : ''}${
                  request.user.clan.name
                }`
              : 'Sin clan'}
          </p>
        </div>
        <div className="p-2 bg-green-50 rounded">
          <p className="text-xs text-green-700">
            <strong>Clan solicitado:</strong>{' '}
            {request.targetClan.tag && `${request.targetClan.tag} - `}
            {request.targetClan.name}
          </p>
        </div>
      </div>

      {request.reason && (
        <div className="mb-4 p-3 bg-military-50 rounded-lg">
          <p className="text-sm text-military-700">
            <strong>Motivo:</strong> {request.reason}
          </p>
        </div>
      )}

      <div className="text-xs text-military-500 mb-3">
        <Clock className="h-3 w-3 inline mr-1" />
        Solicitado el{' '}
        {format(new Date(request.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", {
          locale: es,
        })}
      </div>

      {isPending && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onApprove(request.id)}
            disabled={isLoading}
            className="btn btn-sm bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 flex items-center justify-center"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Aprobar
          </button>
          <button
            onClick={() => onReject(request.id)}
            disabled={isLoading}
            className="btn btn-sm btn-danger flex items-center justify-center"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Rechazar
          </button>
        </div>
      )}

      {!isPending && request.reviewedAt && (
        <div className="text-xs text-military-500 pt-3 border-t border-military-200">
          {request.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'} el{' '}
          {format(
            new Date(request.reviewedAt),
            "d 'de' MMMM, yyyy 'a las' HH:mm",
            { locale: es }
          )}
        </div>
      )}
    </Card>
  );
}