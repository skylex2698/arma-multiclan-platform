import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useClans } from '../../hooks/useClans';
import { userService } from '../../services/userService';
import { Card } from '../ui/Card';
import { Shield, Send, CheckCircle, AlertCircle } from 'lucide-react';

export function ClanChangeRequestForm({ currentClanId }: { currentClanId: string | null }) {
  const [targetClanId, setTargetClanId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: clansData } = useClans();
  const clans = clansData?.clans || [];
  const queryClient = useQueryClient();

  const requestMutation = useMutation({
    mutationFn: ({ targetClanId, reason }: { targetClanId: string; reason?: string }) =>
      userService.requestClanChange(targetClanId, reason),
    onSuccess: () => {
      setSuccess('Solicitud enviada correctamente. Un administrador o líder del clan revisará tu solicitud.');
      setTargetClanId('');
      setReason('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['clan-change-requests'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Error al enviar la solicitud');
      setSuccess('');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!targetClanId) {
      setError('Debes seleccionar un clan');
      return;
    }

    if (targetClanId === currentClanId) {
      setError('Ya perteneces a este clan');
      return;
    }

    requestMutation.mutate({ targetClanId, reason });
  };

  // Filtrar clanes (excluir el actual)
  const availableClans = clans.filter((clan) => clan.id !== currentClanId);

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-6 w-6 text-primary-600 dark:text-tactical-500" />
        <h2 className="text-xl font-bold text-military-900 dark:text-gray-100">
          Solicitar Cambio de Clan
        </h2>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-2">
            Clan Destino *
          </label>
          <select
            value={targetClanId}
            onChange={(e) => setTargetClanId(e.target.value)}
            className="input w-full"
            required
          >
            <option value="">Selecciona un clan...</option>
            {availableClans.map((clan) => (
              <option key={clan.id} value={clan.id}>
                [{clan.tag}] {clan.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-2">
            Motivo (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input w-full"
            rows={3}
            placeholder="Explica brevemente por qué quieres cambiar de clan..."
          />
        </div>

        <button
          type="submit"
          disabled={requestMutation.isPending}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          <Send className="h-4 w-4" />
          {requestMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          ℹ️ Tu solicitud será revisada por un administrador o por el líder del clan al que deseas unirte.
        </p>
      </div>
    </Card>
  );
}
