// frontend/src/pages/events/EventDetailPage.tsx

import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  AlertCircle,
  Edit,
  Copy,
  Radio,
  FileText,
  Package,
  Upload,
  Trash2,
  Download,
  ExternalLink,
} from 'lucide-react';
import {
  useEvent,
  useUploadBriefingFile,
  useUploadModsetFile,
  useDeleteBriefingFile,
  useDeleteModsetFile,
} from '../../hooks/useEvents';
import { useAssignSlot, useUnassignSlot } from '../../hooks/useSlots';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { SquadSection } from '../../components/events/SquadSection';
import CommunicationTreeViewer from '../../components/events/CommunicationTree/CommunicationTreeViewer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAdminAssignSlot, useAdminUnassignSlot } from '../../hooks/useSlots';
import { useUsers } from '../../hooks/useUsers';
import type { Squad, Slot } from '../../types';

type TabType = 'briefing' | 'slots' | 'communications';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, error } = useEvent(id!);
  const assignSlot = useAssignSlot(id!);
  const unassignSlot = useUnassignSlot(id!);
  const [actionError, setActionError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('briefing');
  const adminAssignSlot = useAdminAssignSlot();
  const adminUnassignSlot = useAdminUnassignSlot();

  // Hooks para archivos
  const uploadBriefingFile = useUploadBriefingFile(id!);
  const uploadModsetFile = useUploadModsetFile(id!);
  const deleteBriefingFile = useDeleteBriefingFile(id!);
  const deleteModsetFile = useDeleteModsetFile(id!);
  const briefingFileInputRef = useRef<HTMLInputElement>(null);
  const modsetFileInputRef = useRef<HTMLInputElement>(null);
  const [fileUploadError, setFileUploadError] = useState('');

  // Obtener usuarios disponibles para asignación
  const { data: usersData } = useUsers(
    user?.role === 'ADMIN' || user?.role === 'CLAN_LEADER'
      ? {
          status: 'ACTIVE',
          ...(user?.role === 'CLAN_LEADER' && user?.clan?.id
            ? { clanId: user.clan.id }
            : {}),
        }
      : undefined
  );

  const availableUsers = usersData?.users || [];

  const handleAdminAssign = async (slotId: string, userId: string) => {
    try {
      await adminAssignSlot.mutateAsync({ slotId, userId });
    } catch (err) {
      console.error('Error al asignar usuario:', err);
    }
  };

  const handleAdminUnassign = async (slotId: string) => {
    try {
      await adminUnassignSlot.mutateAsync(slotId);
    } catch (err) {
      console.error('Error al desasignar usuario:', err);
    }
  };

  const getUserSlotInfo = (userId: string) => {
    for (const squad of data?.event?.squads || []) {
      const slot = squad.slots.find((s: Slot) => s.userId === userId);
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
      const error = err as { response?: { data?: { message?: string } } };
      setActionError(
        error.response?.data?.message || 'Error al asignarte al slot'
      );
    }
  };

  const handleUnassignSlot = async (slotId: string) => {
    setActionError('');
    try {
      await unassignSlot.mutateAsync(slotId);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setActionError(
        error.response?.data?.message || 'Error al desasignarte del slot'
      );
    }
  };

  // Handlers para archivos
  const handleBriefingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploadError('');
    try {
      await uploadBriefingFile.mutateAsync(file);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setFileUploadError(error.response?.data?.message || 'Error al subir el archivo de briefing');
    }
    // Limpiar input
    if (briefingFileInputRef.current) {
      briefingFileInputRef.current.value = '';
    }
  };

  const handleModsetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploadError('');
    try {
      await uploadModsetFile.mutateAsync(file);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setFileUploadError(error.response?.data?.message || 'Error al subir el archivo de modset');
    }
    // Limpiar input
    if (modsetFileInputRef.current) {
      modsetFileInputRef.current.value = '';
    }
  };

  const handleDeleteBriefingFile = async () => {
    if (!confirm('¿Eliminar el archivo de briefing?')) return;
    setFileUploadError('');
    try {
      await deleteBriefingFile.mutateAsync();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setFileUploadError(error.response?.data?.message || 'Error al eliminar el archivo');
    }
  };

  const handleDeleteModsetFile = async () => {
    if (!confirm('¿Eliminar el archivo de modset?')) return;
    setFileUploadError('');
    try {
      await deleteModsetFile.mutateAsync();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setFileUploadError(error.response?.data?.message || 'Error al eliminar el archivo');
    }
  };

  const getBackendUrl = () => {
    return import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !data?.event) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">Error al cargar el evento</p>
        <Link to="/events" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
          Volver a eventos
        </Link>
      </div>
    );
  }

  const event = data.event;
  const isFinished = event.status === 'FINISHED';

  // No se puede editar un evento finalizado
  const canEditEvent =
    !isFinished &&
    (user?.role === 'ADMIN' ||
    event.creatorId === user?.id ||
    (user?.role === 'CLAN_LEADER' &&
      user?.clan?.id === event.creator?.clanId));

  return (
    <div>
      <Link
        to="/events"
        className="inline-flex items-center text-military-600 hover:text-military-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a eventos
      </Link>

      {/* Header del evento */}
      <Card className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-military-900 mb-2">
              {event.name}
            </h1>
            {event.description && (
              <p className="text-military-600">{event.description}</p>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <Badge
              variant={
                event.status === 'ACTIVE'
                  ? 'success'
                  : event.status === 'FINISHED'
                    ? 'warning'
                    : 'default'
              }
            >
              {event.status === 'ACTIVE'
                ? 'Activo'
                : event.status === 'FINISHED'
                  ? 'Finalizado'
                  : 'Inactivo'}
            </Badge>

            {canEditEvent && (
              <>
                <Link
                  to={`/events/${event.id}/edit`}
                  className="btn btn-secondary btn-sm flex items-center ml-2"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Link>
                <Link
                  to={`/events/from-template/${event.id}`}
                  className="btn btn-outline btn-sm flex items-center ml-2"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Usar como Plantilla
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center text-military-600">
            <Calendar className="h-5 w-5 mr-3" />
            <div>
              <p className="text-xs text-military-500">Fecha</p>
              <p className="font-medium">
                {format(new Date(event.scheduledDate), "d 'de' MMMM, yyyy", {
                  locale: es,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center text-military-600">
            <Clock className="h-5 w-5 mr-3" />
            <div>
              <p className="text-xs text-military-500">Hora</p>
              <p className="font-medium">
                {format(new Date(event.scheduledDate), 'HH:mm', { locale: es })}
              </p>
            </div>
          </div>

          <div className="flex items-center text-military-600">
            <MapPin className="h-5 w-5 mr-3" />
            <div>
              <p className="text-xs text-military-500">Juego</p>
              <p className="font-medium">
                {event.gameType === 'ARMA_3' ? 'Arma 3' : 'Arma Reforger'}
              </p>
            </div>
          </div>
        </div>

        {event.creator && (
          <div className="flex items-center text-sm text-military-600 pt-4 border-t border-military-200">
            <User className="h-4 w-4 mr-2" />
            <span>
              Creado por{' '}
              <span className="font-medium text-military-900">
                {event.creator.clan?.tag && `${event.creator.clan.tag} `}
                {event.creator.nickname}
              </span>
            </span>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-military-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-military-600">
              {event.occupiedSlots}/{event.totalSlots} slots ocupados
            </span>
            <div className="w-48 bg-military-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    event.totalSlots
                      ? (event.occupiedSlots! / event.totalSlots) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Aviso de evento finalizado */}
      {isFinished && (
        <div className="card bg-amber-50 border border-amber-200 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
            <p className="text-amber-700">
              Este evento ha finalizado. No se pueden realizar modificaciones ni cambios en los slots.
            </p>
          </div>
        </div>
      )}

      {/* Error de acción */}
      {actionError && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{actionError}</p>
          </div>
        </div>
      )}

      {/* Pestañas */}
      <div className="mb-6">
        <div className="border-b border-military-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('briefing')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'briefing'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-military-500 hover:text-military-700 hover:border-military-300'
                }
              `}
            >
              Briefing
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'slots'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-military-500 hover:text-military-700 hover:border-military-300'
                }
              `}
            >
              Escuadras y Slots
            </button>
            <button
              onClick={() => setActiveTab('communications')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors inline-flex items-center gap-2
                ${
                  activeTab === 'communications'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-military-500 hover:text-military-700 hover:border-military-300'
                }
              `}
            >
              <Radio className="h-4 w-4" />
              Comunicaciones
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido de las pestañas */}
      {activeTab === 'briefing' && (
        <div className="space-y-6">
          {/* Error de subida de archivos */}
          {fileUploadError && (
            <div className="card bg-red-50 border border-red-200">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-700">{fileUploadError}</p>
              </div>
            </div>
          )}

          {/* Archivos del evento */}
          <Card>
            <h2 className="text-xl font-bold text-military-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Archivos del Evento
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Briefing PDF */}
              <div className="p-4 border border-military-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-military-900">Briefing (PDF)</h3>
                </div>

                {event.briefingFileUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700 flex-1">Archivo subido</span>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`${getBackendUrl()}${event.briefingFileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir
                      </a>
                      <a
                        href={`${getBackendUrl()}${event.briefingFileUrl}`}
                        download
                        className="btn btn-secondary btn-sm flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </a>
                      {canEditEvent && (
                        <button
                          onClick={handleDeleteBriefingFile}
                          disabled={deleteBriefingFile.isPending}
                          className="btn btn-danger btn-sm flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-military-500">No hay archivo de briefing</p>
                    {canEditEvent && (
                      <>
                        <input
                          ref={briefingFileInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={handleBriefingFileChange}
                          className="hidden"
                        />
                        <button
                          onClick={() => briefingFileInputRef.current?.click()}
                          disabled={uploadBriefingFile.isPending}
                          className="btn btn-primary btn-sm flex items-center gap-1"
                        >
                          <Upload className="h-4 w-4" />
                          {uploadBriefingFile.isPending ? 'Subiendo...' : 'Subir PDF'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Modset HTML */}
              <div className="p-4 border border-military-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-military-900">Modset (HTML)</h3>
                </div>

                {event.modsetFileUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                      <Package className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700 flex-1">Archivo subido</span>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`${getBackendUrl()}${event.modsetFileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir
                      </a>
                      <a
                        href={`${getBackendUrl()}${event.modsetFileUrl}`}
                        download
                        className="btn btn-secondary btn-sm flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </a>
                      {canEditEvent && (
                        <button
                          onClick={handleDeleteModsetFile}
                          disabled={deleteModsetFile.isPending}
                          className="btn btn-danger btn-sm flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-military-500">No hay archivo de modset</p>
                    {canEditEvent && (
                      <>
                        <input
                          ref={modsetFileInputRef}
                          type="file"
                          accept=".html,.htm"
                          onChange={handleModsetFileChange}
                          className="hidden"
                        />
                        <button
                          onClick={() => modsetFileInputRef.current?.click()}
                          disabled={uploadModsetFile.isPending}
                          className="btn btn-primary btn-sm flex items-center gap-1"
                        >
                          <Upload className="h-4 w-4" />
                          {uploadModsetFile.isPending ? 'Subiendo...' : 'Subir HTML'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-military-500 mt-3">
              Tamaño máximo: 10MB por archivo
            </p>
          </Card>

          {/* Contenido del briefing */}
          <Card>
            {event.briefing ? (
              <>
                <h2 className="text-xl font-bold text-military-900 mb-4">Briefing</h2>
                <div
                  className="briefing-content p-6 bg-white rounded-lg border border-gray-200"
                  dangerouslySetInnerHTML={{ __html: event.briefing }}
                />
              </>
            ) : (
              <p className="text-military-500 text-center py-8">
                No hay briefing de texto disponible para este evento
              </p>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'slots' && (
        <div>
          <h2 className="text-2xl font-bold text-military-900 mb-4">
            Escuadras y Slots
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {event.squads
              .sort((a: Squad, b: Squad) => a.order - b.order)
              .map((squad: Squad) => (
                <SquadSection
                  key={squad.id}
                  squad={squad}
                  onAssignSlot={handleAssignSlot}
                  onUnassignSlot={handleUnassignSlot}
                  onAdminAssign={handleAdminAssign}
                  onAdminUnassign={handleAdminUnassign}
                  isLoading={
                    assignSlot.isPending ||
                    unassignSlot.isPending ||
                    adminAssignSlot.isPending ||
                    adminUnassignSlot.isPending
                  }
                  eventStatus={event.status}
                  availableUsers={availableUsers}
                  getUserSlotInfo={getUserSlotInfo}
                />
              ))}
          </div>
        </div>
      )}

      {activeTab === 'communications' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-military-900">
              Árbol de Comunicaciones
            </h2>
            {canEditEvent && (
              <Link
                to={`/events/${event.id}/communications/edit`}
                className="btn btn-primary btn-sm flex items-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar Árbol
              </Link>
            )}
          </div>
          <CommunicationTreeViewer eventId={event.id} />
        </div>
      )}
    </div>
  );
}