import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Clock3, Filter, MessageSquareWarning } from 'lucide-react';
import { useFeedbackItems, useUpdateFeedbackStatus } from '../../hooks/useFeedback';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import type { FeedbackItem, FeedbackStatus, FeedbackType } from '../../types';

const feedbackTypeOptions: Array<{ value: 'ALL' | FeedbackType; label: string }> = [
  { value: 'ALL', label: 'Todos los tipos' },
  { value: 'BUG', label: 'Bugs' },
  { value: 'SUGGESTION', label: 'Sugerencias' },
];

const feedbackStatusOptions: Array<{ value: 'ALL' | FeedbackStatus; label: string }> = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'OPEN', label: 'Abierto' },
  { value: 'IN_REVIEW', label: 'En revisión' },
  { value: 'DONE', label: 'Resuelto' },
  { value: 'REJECTED', label: 'Descartado' },
];

const getStatusBadgeVariant = (status: FeedbackStatus) => {
  switch (status) {
    case 'DONE':
      return 'success' as const;
    case 'IN_REVIEW':
      return 'warning' as const;
    case 'REJECTED':
      return 'danger' as const;
    default:
      return 'info' as const;
  }
};

const getStatusLabel = (status: FeedbackStatus) => {
  switch (status) {
    case 'OPEN':
      return 'Abierto';
    case 'IN_REVIEW':
      return 'En revisión';
    case 'DONE':
      return 'Resuelto';
    case 'REJECTED':
      return 'Descartado';
  }
};

const getTypeLabel = (type: FeedbackType) =>
  type === 'BUG' ? 'Bug' : 'Sugerencia';

function FeedbackCard({
  item,
  onSave,
  isSaving,
}: {
  item: FeedbackItem;
  onSave: (status: FeedbackStatus, adminNote: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [status, setStatus] = useState<FeedbackStatus>(item.status);
  const [adminNote, setAdminNote] = useState(item.adminNote || '');

  return (
    <Card className="space-y-4 rounded-xl border-military-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={item.type === 'BUG' ? 'danger' : 'info'}>
              {getTypeLabel(item.type)}
            </Badge>
            <Badge variant={getStatusBadgeVariant(item.status)}>
              {getStatusLabel(item.status)}
            </Badge>
          </div>
          <h2 className="text-lg font-semibold text-military-950 dark:text-gray-100">
            {item.title}
          </h2>
          <p className="text-sm leading-6 text-military-700 dark:text-gray-300">
            {item.description}
          </p>
        </div>

        <div className="min-w-[220px] rounded-xl border border-military-200 bg-military-50/70 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="font-medium text-military-900 dark:text-gray-100">
            {item.user.nickname}
          </p>
          <p className="mt-1 text-military-600 dark:text-gray-400">
            {item.user.email || 'Sin email'}
          </p>
          <p className="mt-2 text-military-600 dark:text-gray-400">
            Clan:{' '}
            {item.clan
              ? `${item.clan.tag ? `[${item.clan.tag}] ` : ''}${item.clan.name}`
              : 'Sin clan'}
          </p>
          <p className="mt-2 text-military-600 dark:text-gray-400">
            {format(new Date(item.createdAt), "d MMM yyyy, HH:mm", {
              locale: es,
            })}
          </p>
          <p className="mt-2 break-all text-xs text-military-500 dark:text-gray-500">
            {item.pagePath || 'Ruta no informada'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
        <div>
          <label className="field-label">Estado</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as FeedbackStatus)}
            className="input"
          >
            {feedbackStatusOptions
              .filter((option) => option.value !== 'ALL')
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="field-label">Nota interna</label>
          <textarea
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            className="input min-h-[96px] resize-y"
            placeholder="Contexto interno, decisión o seguimiento."
          />
          {(item.reviewer || item.reviewedAt) && (
            <p className="field-help">
              Última revisión:{' '}
              {item.reviewer?.nickname || 'Administrador'}{' '}
              {item.reviewedAt
                ? `· ${format(new Date(item.reviewedAt), "d MMM yyyy, HH:mm", {
                    locale: es,
                  })}`
                : ''}
            </p>
          )}
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void onSave(status, adminNote)}
            className="btn btn-primary w-full lg:w-auto"
            disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function FeedbackAdminPage() {
  const [typeFilter, setTypeFilter] = useState<'ALL' | FeedbackType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FeedbackStatus>('ALL');
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
  const { data, isLoading } = useFeedbackItems({
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  });
  const updateFeedbackStatus = useUpdateFeedbackStatus();

  const items = data?.items || [];
  const stats = useMemo(() => {
    const open = items.filter((item) => item.status === 'OPEN').length;
    const inReview = items.filter((item) => item.status === 'IN_REVIEW').length;
    const done = items.filter((item) => item.status === 'DONE').length;
    return { total: items.length, open, inReview, done };
  }, [items]);

  const handleSave = async (
    id: string,
    status: FeedbackStatus,
    adminNote: string
  ) => {
    try {
      setActiveSaveId(id);
      await updateFeedbackStatus.mutateAsync({ id, status, adminNote });
    } finally {
      setActiveSaveId(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <header className="page-header">
        <div>
          <h1 className="page-title">Bandeja de feedback</h1>
          <p className="page-subtitle">
            Reportes de bugs y recomendaciones enviadas por usuarios autenticados.
          </p>
        </div>
      </header>

      <section className="metric-strip">
        <div className="metric-strip-inner xl:grid-cols-4">
          <div className="metric-block">
            <p className="text-[13px] text-military-600 dark:text-gray-400">
              Total
            </p>
            <p className="mt-1 text-2xl font-bold text-military-900 dark:text-gray-100">
              {stats.total}
            </p>
          </div>
          <div className="metric-block">
            <p className="text-[13px] text-military-600 dark:text-gray-400">
              Abiertos
            </p>
            <p className="mt-1 flex items-center gap-2 text-military-900 dark:text-gray-100">
              <MessageSquareWarning className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">{stats.open}</span>
            </p>
          </div>
          <div className="metric-block">
            <p className="text-[13px] text-military-600 dark:text-gray-400">
              En revisión
            </p>
            <p className="mt-1 flex items-center gap-2 text-military-900 dark:text-gray-100">
              <Clock3 className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-bold">{stats.inReview}</span>
            </p>
          </div>
          <div className="metric-block">
            <p className="text-[13px] text-military-600 dark:text-gray-400">
              Resueltos
            </p>
            <p className="mt-1 flex items-center gap-2 text-military-900 dark:text-gray-100">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.done}</span>
            </p>
          </div>
        </div>
      </section>

      <Card className="rounded-xl border-military-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,220px)_1fr]">
          <div>
            <label className="field-label">Tipo</label>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as 'ALL' | FeedbackType)
              }
              className="input"
            >
              {feedbackTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Estado</label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'ALL' | FeedbackStatus)
              }
              className="input"
            >
              {feedbackStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="flex h-[38px] items-center gap-2 text-sm text-military-600 dark:text-gray-400">
              <Filter className="h-4 w-4" />
              {data?.count || 0} resultado{(data?.count || 0) === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </Card>

      {items.length === 0 ? (
        <div className="panel">
          <div className="empty-state">No hay feedback con los filtros actuales.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              isSaving={activeSaveId === item.id && updateFeedbackStatus.isPending}
              onSave={(status, adminNote) => handleSave(item.id, status, adminNote)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
