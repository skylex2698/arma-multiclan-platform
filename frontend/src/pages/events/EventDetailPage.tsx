import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Package,
  Power,
  Share2,
} from 'lucide-react';
import {
  useChangeEventStatus,
  useEvent,
  useDownloadEventSlotlist,
  useDownloadEventWhitelist,
  useGenerateShareToken,
} from '../../hooks/useEvents';
import {
  useAdminAssignSlot,
  useAdminUnassignSlot,
  useAssignSlot,
  useReserveSquad,
  useUnassignSlot,
} from '../../hooks/useSlots';
import { useCreateExternalUser, useUsers } from '../../hooks/useUsers';
import { useClans } from '../../hooks/useClans';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { SquadSection } from '../../components/events/SquadSection';
import { AutomaticCommunicationChart } from '../../components/events/AutomaticCommunicationChart';
import { AttendanceTab } from '../../components/events/AttendanceTab';
import { useAuthStore } from '../../store/authStore';
import type { Slot, Squad } from '../../types';
import {
  formatDateInTimezone,
  formatTimeInTimezone,
  getTimezoneShortName,
  getUserTimezone,
} from '../../utils/eventTime';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';
import { getAssetUrl } from '../../utils/url';

type TabType = 'briefing' | 'slots' | 'communications' | 'attendance';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isDeletedView = searchParams.get('deleted') === 'true';
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, error } = useEvent(id!, { deleted: isDeletedView });
  const assignSlot = useAssignSlot(id!);
  const unassignSlot = useUnassignSlot(id!);
  const adminAssignSlot = useAdminAssignSlot();
  const adminUnassignSlot = useAdminUnassignSlot();
  const reserveSquad = useReserveSquad(id!);

  const changeEventStatus = useChangeEventStatus(id!);
  const generateShareToken = useGenerateShareToken();
  const downloadEventSlotlist = useDownloadEventSlotlist();
  const downloadEventWhitelist = useDownloadEventWhitelist();

  const [actionError, setActionError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('briefing');
  const [showPassword, setShowPassword] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLinkReady, setShareLinkReady] = useState(false);
  const canManageSlots = hasPermission(user, PERMISSIONS.SLOT_MANAGE);
  const canManageAttendance = hasPermission(user, PERMISSIONS.EVENT_ATTENDANCE_MANAGE);

  const { data: usersData } = useUsers(
    canManageSlots
      ? {
          status: 'ACTIVE,EXTERNAL',
          ...(user?.role !== 'ADMIN' && user?.clan?.id
            ? { clanId: user.clan.id }
            : {}),
        }
      : undefined
  );

  const availableUsers = usersData?.users || [];
  const createExternalUser = useCreateExternalUser();

  const { data: clansData } = useClans();
  const availableClans =
    user?.role === 'ADMIN'
      ? clansData?.clans || []
      : canManageSlots
        ? (clansData?.clans || []).filter((clan) => clan.id === user?.clan?.id)
        : [];

  const handleReserveSquad = async (squadId: string, clanId: string | null) => {
    setActionError('');
    try {
      await reserveSquad.mutateAsync({ squadId, clanId });
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setActionError(
        requestError.response?.data?.message || 'Error al reservar escuadra'
      );
    }
  };

  const handleAdminAssign = async (slotId: string, userId: string) => {
    setActionError('');
    try {
      await adminAssignSlot.mutateAsync({ slotId, userId });
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setActionError(
        requestError.response?.data?.message || 'Error al asignar usuario'
      );
    }
  };

  const handleAdminUnassign = async (slotId: string) => {
    setActionError('');
    try {
      await adminUnassignSlot.mutateAsync(slotId);
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setActionError(
        requestError.response?.data?.message || 'Error al retirar al usuario'
      );
    }
  };

  const handleCreateExternalAndAssign = async (
    slotId: string,
    nickname: string
  ) => {
    setActionError('');
    try {
      const result = await createExternalUser.mutateAsync({ nickname });
      await adminAssignSlot.mutateAsync({ slotId, userId: result.user.id });
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setActionError(
        requestError.response?.data?.message ||
          'Error al registrar miembro externo'
      );
    }
  };

  const getUserSlotInfo = (userId: string) => {
    for (const squad of data?.event?.squads || []) {
      const slot = squad.slots.find((candidate: Slot) => candidate.userId === userId);
      if (slot) {
        return {
          hasSlot: true,
          squadName: squad.name,
          slotRole: slot.role,
        };
      }
    }

    return { hasSlot: false };
  };

  const handleAssignSlot = async (slotId: string) => {
    setActionError('');
    try {
      await assignSlot.mutateAsync(slotId);
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setActionError(
        requestError.response?.data?.message || 'Error al asignarte al slot'
      );
    }
  };

  const handleUnassignSlot = async (slotId: string) => {
    setActionError('');
    try {
      await unassignSlot.mutateAsync(slotId);
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setActionError(
        requestError.response?.data?.message || 'Error al salir del slot'
      );
    }
  };

  const handleToggleStatus = async () => {
    if (!data?.event) return;
    const newStatus = data.event.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      await changeEventStatus.mutateAsync(newStatus);
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setActionError(
        requestError.response?.data?.message ||
          'Error al cambiar el estado del evento'
      );
    }
  };

  const downloadTextFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadSlotlist = async () => {
    if (!data?.event) return;

    setActionError('');
    try {
      const slotlist = await downloadEventSlotlist.mutateAsync(data.event.id);
      downloadTextFile(
        `slotlist-${data.event.id}.json`,
        JSON.stringify(slotlist, null, 2),
        'application/json;charset=utf-8'
      );
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setActionError(
        requestError.response?.data?.message || 'Error al exportar la slotlist'
      );
    }
  };

  const handleDownloadWhitelist = async () => {
    if (!data?.event) return;

    setActionError('');
    try {
      const whitelist = await downloadEventWhitelist.mutateAsync(data.event.id);
      downloadTextFile(
        `whitelist-${data.event.id}.txt`,
        whitelist,
        'text/plain;charset=utf-8'
      );
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setActionError(
        requestError.response?.data?.message || 'Error al exportar la whitelist'
      );
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !data?.event) {
    return (
      <section className="panel">
        <p className="text-sm text-red-600 dark:text-red-400">
          Error al cargar el evento.
        </p>
        <Link to="/events" className="toolbar-link mt-2 inline-flex">
          Volver a eventos
        </Link>
      </section>
    );
  }

  const event = data.event;
  const isFinished = event.status === 'FINISHED';
  const occupancyPercentage = event.totalSlots
    ? Math.round(((event.occupiedSlots ?? 0) / event.totalSlots) * 100)
    : 0;
  const userTimezone = user?.timezone || getUserTimezone();
  const userDateLabel = formatDateInTimezone(event.scheduledDate, userTimezone);
  const userTimeLabel = formatTimeInTimezone(event.scheduledDate, userTimezone);
  const userShortTimezone = getTimezoneShortName(event.scheduledDate, userTimezone);
  const hasEventFiles = Boolean(event.briefingFileUrl || event.modsetFileUrl);

  const canEditEvent =
    !isDeletedView &&
    !isFinished &&
    hasPermission(user, PERMISSIONS.EVENT_EDIT) &&
    (user?.role === 'ADMIN' ||
      event.creatorId === user?.id ||
      user?.clan?.id === event.creator?.clanId);

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'briefing', label: 'Briefing' },
    { id: 'slots', label: 'Escuadras' },
    { id: 'communications', label: 'Comunicaciones' },
    ...(isFinished && canManageAttendance
      ? [{ id: 'attendance' as const, label: 'Asistencia' }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <Link to="/events" className="inline-flex items-center gap-2 toolbar-link">
        <ArrowLeft className="h-4 w-4" />
        Volver a eventos
      </Link>

      <header className="space-y-3">
        <div className="page-header mb-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-start gap-2">
              <h1 className="page-title break-words">{event.name}</h1>
              <Badge
                variant={
                  isDeletedView
                    ? 'danger'
                    : event.status === 'ACTIVE'
                    ? 'success'
                    : event.status === 'FINISHED'
                      ? 'default'
                      : 'warning'
                }
              >
                {isDeletedView
                  ? 'Eliminado'
                  : event.status === 'ACTIVE'
                  ? 'Activo'
                  : event.status === 'FINISHED'
                    ? 'Finalizado'
                    : 'Inactivo'}
              </Badge>
            </div>

            {event.description && (
              <p className="mt-1 break-words text-sm text-military-600 dark:text-gray-400">
                {event.description}
              </p>
            )}

            <div className="meta-inline mt-2">
              <span>{userDateLabel}</span>
              <span aria-hidden="true">·</span>
              <span>
                {userTimeLabel} {userShortTimezone}
              </span>
              <span aria-hidden="true">·</span>
              <span>{event.game.name}</span>
              <span aria-hidden="true">·</span>
              <span>
                {event.occupiedSlots ?? 0}/{event.totalSlots ?? 0} slots
              </span>
              {event.creator && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Por{' '}
                    <strong>
                      {event.creator.clan?.tag ? `${event.creator.clan.tag} ` : ''}
                      {event.creator.nickname}
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="page-actions">
            {canEditEvent && (
              <Link to={`/events/${event.id}/edit`} className="btn btn-primary">
                <Edit className="h-4 w-4" />
                Editar
              </Link>
            )}

            <button
              type="button"
              onClick={async () => {
                try {
                  setActionError('');
                  setShareLinkReady(false);
                  const result = await generateShareToken.mutateAsync(event.id);
                  const publicUrl = `${window.location.origin}/events/public/${result.token}`;
                  try {
                    await navigator.clipboard.writeText(publicUrl);
                    setShareCopied(true);
                    window.setTimeout(() => setShareCopied(false), 2000);
                  } catch {
                    setShareLinkReady(true);
                    window.prompt('Copia este enlace publico:', publicUrl);
                  }
                } catch (err) {
                  const requestError = err as { response?: { data?: { message?: string } } };
                  setActionError(
                    requestError.response?.data?.message ||
                      'Error al generar el enlace publico'
                  );
                }
              }}
              disabled={generateShareToken.isPending}
              className="btn btn-outline"
            >
              {shareCopied ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {shareCopied ? 'Copiado' : 'Compartir'}
            </button>

            {shareLinkReady && !shareCopied && (
              <span className="section-caption">
                Enlace generado. Si no se copio automaticamente, copialo manualmente.
              </span>
            )}

            {canEditEvent && (
              <details className="relative">
                <summary className="btn btn-outline cursor-pointer list-none">
                  Mas acciones
                </summary>
                <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-md border border-military-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <button
                    type="button"
                    onClick={handleDownloadSlotlist}
                    disabled={downloadEventSlotlist.isPending}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-military-700 transition-colors hover:bg-military-50 disabled:opacity-60 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                    {downloadEventSlotlist.isPending ? 'Exportando slotlist...' : 'Slotlist'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadWhitelist}
                    disabled={downloadEventWhitelist.isPending}
                    className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-military-700 transition-colors hover:bg-military-50 disabled:opacity-60 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                    {downloadEventWhitelist.isPending ? 'Exportando whitelist...' : 'Whitelist'}
                  </button>
                  <Link
                    to={`/events/from-template/${event.id}`}
                    className="mt-1 block rounded-md px-3 py-2 text-sm text-military-700 transition-colors hover:bg-military-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Usar como plantilla
                  </Link>
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={changeEventStatus.isPending}
                    className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-military-700 transition-colors hover:bg-military-50 disabled:opacity-60 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Power className="h-4 w-4" />
                    {changeEventStatus.isPending
                      ? 'Actualizando...'
                      : event.status === 'ACTIVE'
                        ? 'Desactivar evento'
                        : 'Activar evento'}
                  </button>
                </div>
              </details>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-military-200 dark:bg-gray-700">
            <div
              className="h-1.5 rounded-full bg-primary-600 transition-all dark:bg-tactical-500"
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium text-military-700 dark:text-gray-300">
            {occupancyPercentage}%
          </span>
        </div>
      </header>

      {(event.serverName ||
        event.serverIp ||
        event.serverPort ||
        event.serverPassword) && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Conexion al servidor</h2>
              <p className="section-caption">Datos operativos compartidos para el evento.</p>
            </div>
          </div>

          <dl className="grid gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
            {event.serverName && (
              <div className="min-w-0">
                <dt className="text-[13px] text-military-500 dark:text-gray-400">
                  Servidor
                </dt>
                <dd className="mt-1 break-words text-sm font-medium text-military-900 dark:text-gray-100">
                  {event.serverName}
                </dd>
              </div>
            )}

            {event.serverIp && (
              <div className="min-w-0">
                <dt className="text-[13px] text-military-500 dark:text-gray-400">IP</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="break-all font-mono text-sm text-military-900 dark:text-gray-100">
                    {event.serverIp}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(event.serverIp!)}
                    className="icon-button h-8 w-8"
                    title="Copiar IP"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </dd>
              </div>
            )}

            {event.serverPort && (
              <div className="min-w-0">
                <dt className="text-[13px] text-military-500 dark:text-gray-400">
                  Puerto
                </dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-sm text-military-900 dark:text-gray-100">
                    {event.serverPort}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(event.serverPort!)}
                    className="icon-button h-8 w-8"
                    title="Copiar puerto"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </dd>
              </div>
            )}

            {event.serverPassword && (
              <div className="min-w-0">
                <dt className="text-[13px] text-military-500 dark:text-gray-400">
                  Contrasena
                </dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-sm text-military-900 dark:text-gray-100">
                    {showPassword ? event.serverPassword : '••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="icon-button h-8 w-8"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(event.serverPassword!)
                    }
                    className="icon-button h-8 w-8"
                    title="Copiar contrasena"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {isFinished && (
        <section className="panel border-amber-300 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Este evento ya finalizo. Los slots quedan en solo lectura.
            </p>
          </div>
        </section>
      )}

      {actionError && (
        <section className="panel border-red-300 bg-red-50/80 dark:border-red-700 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-700 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{actionError}</p>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2 border-b border-military-200 pb-2 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white dark:bg-tactical-600'
                : 'text-military-600 hover:bg-military-50 hover:text-military-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'briefing' && (
        <div className="space-y-4">
          {hasEventFiles && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="section-title">Archivos del evento</h2>
                  <p className="section-caption">
                    Solo se muestran los archivos disponibles del evento.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-military-200 dark:divide-gray-700">
                {event.briefingFileUrl && (
                  <div className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <FileText className="h-4 w-4 shrink-0 text-red-500" />
                        <h3 className="font-semibold text-military-900 dark:text-gray-100">
                          Briefing PDF
                        </h3>
                        <span className="section-caption">Disponible</span>
                      </div>
                    </div>

                    <div className="flex min-h-11 flex-wrap items-center gap-2">
                      <a
                        href={getAssetUrl(event.briefingFileUrl) || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir
                      </a>
                      <a
                        href={getAssetUrl(event.briefingFileUrl) || undefined}
                        download
                        className="toolbar-link"
                      >
                        Descargar
                      </a>
                    </div>
                  </div>
                )}

                {event.modsetFileUrl && (
                  <div className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <Package className="h-4 w-4 shrink-0 text-blue-500" />
                        <h3 className="font-semibold text-military-900 dark:text-gray-100">
                          Modset HTML
                        </h3>
                        <span className="section-caption">Disponible</span>
                      </div>
                    </div>

                    <div className="flex min-h-11 flex-wrap items-center gap-2">
                      <a
                        href={getAssetUrl(event.modsetFileUrl) || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir
                      </a>
                      <a
                        href={getAssetUrl(event.modsetFileUrl) || undefined}
                        download
                        className="toolbar-link"
                      >
                        Descargar
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="section-title">Briefing de texto</h2>
                <p className="section-caption">Version integrada para lectura rapida.</p>
              </div>
            </div>

            {event.briefing ? (
              <div
                className="briefing-content"
                dangerouslySetInnerHTML={{ __html: event.briefing }}
              />
            ) : (
              <div className="empty-state">
                No hay briefing de texto disponible para este evento.
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'slots' && (
        <section className="space-y-3">
          {event.squads.length === 0 ? (
            <div className="panel">
              <div className="empty-state">No hay escuadras creadas.</div>
            </div>
          ) : (
            event.squads
              .sort((a: Squad, b: Squad) => a.order - b.order)
              .map((squad: Squad) => {
                const canManageReservation =
                  (user?.role === 'ADMIN' && canManageSlots) ||
                  (canManageSlots &&
                    user?.clan?.id &&
                    (!squad.reservedForClanId ||
                      squad.reservedForClanId === user.clan.id));

                return (
                <SquadSection
                  key={squad.id}
                  squad={squad}
                  onAssignSlot={handleAssignSlot}
                  onUnassignSlot={handleUnassignSlot}
                  onAdminAssign={handleAdminAssign}
                  onAdminUnassign={handleAdminUnassign}
                  onCreateExternal={handleCreateExternalAndAssign}
                  isLoading={
                    assignSlot.isPending ||
                    unassignSlot.isPending ||
                    adminAssignSlot.isPending ||
                    adminUnassignSlot.isPending ||
                    createExternalUser.isPending ||
                    reserveSquad.isPending
                  }
                  eventStatus={event.status}
                  availableUsers={availableUsers}
                  getUserSlotInfo={getUserSlotInfo}
                  canEditEvent={canEditEvent}
                  canManageReservation={Boolean(canManageReservation)}
                  availableClans={availableClans}
                  onReserveSquad={handleReserveSquad}
                  directReserveClanId={
                    user?.role !== 'ADMIN' && canManageSlots ? user.clan?.id || null : null
                  }
                  defaultExpanded
                />
                );
              })
          )}
        </section>
      )}

      {activeTab === 'communications' && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Plan de comunicaciones</h2>
              <p className="section-caption">
                Diagrama Mermaid generado desde las frecuencias y enlaces de las escuadras.
              </p>
            </div>
          </div>

          <AutomaticCommunicationChart event={event} />
        </section>
      )}

      {activeTab === 'attendance' && isFinished && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Asistencia</h2>
              <p className="section-caption">Revision posterior al cierre del evento.</p>
            </div>
            <Badge variant="default">
              <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
              Cerrado
            </Badge>
          </div>
          <AttendanceTab eventId={event.id} />
        </section>
      )}
    </div>
  );
}
