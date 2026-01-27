// frontend/src/pages/events/EditEventPage.tsx - VERSIÓN COMPLETA CON COMUNICACIONES

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent } from '../../hooks/useEvents';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Trash2, Save, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { SquadCommunicationFields } from '../../components/events/SquadCommunicationFields';
import type { GameType } from '../../types';
import { BriefingEditorWithTemplates } from '../../components/events/BriefingEditor/BriefingEditorWithTemplates';
import '../../components/events/BriefingEditor/BriefingEditor.css';

interface SlotForm {
  id?: string;
  role: string;
  order: number;
  isNew?: boolean;
}

interface SquadForm {
  id?: string;
  name: string;
  order: number;
  frequency?: string;
  isCommand: boolean;
  parentSquadId?: string;
  parentFrequency?: string;
  slots: SlotForm[];
  isNew?: boolean;
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: eventData, isLoading: loadingEvent } = useEvent(id!);
  const updateEvent = useUpdateEvent(id!);
  const deleteEvent = useDeleteEvent();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [briefing, setBriefing] = useState('');
  const [gameType, setGameType] = useState<GameType>('ARMA_3');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [squads, setSquads] = useState<SquadForm[]>([]);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set());

  const toggleSquad = (squadId: string) => {
    setExpandedSquads((prev) => {
      const next = new Set(prev);
      if (next.has(squadId)) {
        next.delete(squadId);
      } else {
        next.add(squadId);
      }
      return next;
    });
  };

  useEffect(() => {
    if (eventData?.event) {
      const event = eventData.event;
      setName(event.name);
      setDescription(event.description || '');
      setBriefing(event.briefing || '');
      setGameType(event.gameType);

      const date = new Date(event.scheduledDate);
      setScheduledDate(date.toISOString().split('T')[0]);
      setScheduledTime(date.toTimeString().slice(0, 5));

      const formattedSquads = event.squads.map((squad) => ({
        id: squad.id,
        name: squad.name,
        order: squad.order,
        frequency: squad.frequency || '',
        isCommand: squad.isCommand || false,
        parentSquadId: squad.parentSquadId || '',
        parentFrequency: squad.parentFrequency || '',
        slots: squad.slots.map((slot) => ({
          id: slot.id,
          role: slot.role,
          order: slot.order,
          isNew: false,
        })),
        isNew: false,
      }));
      setSquads(formattedSquads);
      
      // Expandir todas las escuadras por defecto
      setExpandedSquads(new Set(formattedSquads.map(s => s.id!)));
    }
  }, [eventData]);

  const canEdit =
    user?.role === 'ADMIN' ||
    eventData?.event?.creatorId === user?.id ||
    (user?.role === 'CLAN_LEADER' &&
      user?.clan?.id === eventData?.event?.creator?.clanId);

  const canDelete =
    user?.role === 'ADMIN' ||
    eventData?.event?.creatorId === user?.id ||
    (user?.role === 'CLAN_LEADER' &&
      user?.clan?.id === eventData?.event?.creator?.clanId);

  const addSquad = () => {
    const newOrder = squads.length + 1;
    const newSquad: SquadForm = {
      name: `Escuadra ${newOrder}`,
      order: newOrder,
      frequency: '',
      isCommand: false,
      parentSquadId: '',
      parentFrequency: '',
      slots: [
        {
          role: 'Líder de Escuadra',
          order: 1,
          isNew: true,
        },
      ],
      isNew: true,
    };
    setSquads([...squads, newSquad]);
  };

  const removeSquad = (index: number) => {
    setSquads(squads.filter((_, i) => i !== index));
  };

  const updateSquad = (index: number, updates: Partial<SquadForm>) => {
    const updated = [...squads];
    updated[index] = { ...updated[index], ...updates };
    setSquads(updated);
  };

  const addSlot = (squadIndex: number) => {
    const updated = [...squads];
    const newOrder = updated[squadIndex].slots.length + 1;
    updated[squadIndex].slots.push({
      role: 'Fusilero',
      order: newOrder,
      isNew: true,
    });
    setSquads(updated);
  };

  const removeSlot = (squadIndex: number, slotIndex: number) => {
    const updated = [...squads];
    updated[squadIndex].slots = updated[squadIndex].slots.filter(
      (_, i) => i !== slotIndex
    );
    setSquads(updated);
  };

  const updateSlotRole = (squadIndex: number, slotIndex: number, role: string) => {
    const updated = [...squads];
    updated[squadIndex].slots[slotIndex].role = role;
    setSquads(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !scheduledDate || !scheduledTime) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    if (squads.length === 0) {
      setError('Debes tener al menos una escuadra');
      return;
    }

    for (const squad of squads) {
      if (squad.slots.length === 0) {
        setError(`La escuadra "${squad.name}" debe tener al menos un slot`);
        return;
      }
    }

    try {
      const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);

      await updateEvent.mutateAsync({
        name,
        description: description || undefined,
        briefing: briefing || undefined,
        gameType,
        scheduledDate: dateTime,
        squads: squads.map((squad, index) => ({
          id: squad.isNew ? undefined : squad.id,
          name: squad.name,
          order: index + 1,
          frequency: squad.frequency || undefined,
          isCommand: squad.isCommand,
          parentSquadId: squad.parentSquadId || undefined,
          parentFrequency: squad.parentFrequency || undefined,
          slots: squad.slots.map((slot, slotIndex) => ({
            id: slot.isNew ? undefined : slot.id,
            role: slot.role,
            order: slotIndex + 1,
          })),
        })),
      });

      navigate(`/events/${id}`);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al actualizar el evento');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent.mutateAsync(id!);
      navigate('/events');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al eliminar el evento');
      setShowDeleteConfirm(false);
    }
  };

  const getAvailableParentSquads = (currentIndex: number) => {
    return squads
      .filter((_, index) => index !== currentIndex)
      .map((s, index) => ({ id: s.id || `temp-${index}`, name: s.name }));
  };

  if (loadingEvent) {
    return <LoadingSpinner />;
  }

  if (!eventData?.event) {
    return (
      <div className="card bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-400">Evento no encontrado</p>
        <Link
          to="/events"
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mt-2 inline-block"
        >
          Volver a eventos
        </Link>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="card bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-400">No tienes permisos para editar este evento</p>
        <Link
          to={`/events/${id}`}
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mt-2 inline-block"
        >
          Volver al evento
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to={`/events/${id}`}
        className="inline-flex items-center text-military-600 dark:text-gray-400 hover:text-military-900 dark:hover:text-gray-200 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al evento
      </Link>

      <h1 className="text-3xl font-bold text-military-900 dark:text-gray-100 mb-6">
        Editar Evento
      </h1>

      {error && (
        <div className="card bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Información básica */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-military-900 dark:text-gray-100 mb-4">
            Información Básica
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-2">
                Nombre del Evento *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input w-full"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-2">
                  Tipo de Juego *
                </label>
                <select
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value as GameType)}
                  className="input w-full"
                  required
                >
                  <option value="ARMA_3">Arma 3</option>
                  <option value="ARMA_REFORGER">Arma Reforger</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-2">
                  Hora *
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-2">
                Briefing del Evento
              </label>
              <BriefingEditorWithTemplates
                content={briefing}
                onChange={setBriefing}
                placeholder="Escribe el briefing del evento aquí..."
              />
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>💡 <strong>Tip:</strong> Usa las plantillas predefinidas para empezar más rápido</p>
                <p>📝 El briefing admite formato rico: títulos, listas, tablas, imágenes y más</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Escuadras */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-military-900 dark:text-gray-100">
              Escuadras y Slots
            </h2>
            <button
              type="button"
              onClick={addSquad}
              className="btn btn-primary btn-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Escuadra
            </button>
          </div>

          <div className="space-y-4">
            {squads.map((squad, squadIndex) => {
              const squadKey = squad.id || `temp-${squadIndex}`;
              const isExpanded = expandedSquads.has(squadKey);

              return (
                <div
                  key={squadKey}
                  className="border-2 border-military-200 dark:border-gray-600 rounded-lg overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 bg-military-100 dark:bg-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleSquad(squadKey)}
                        className="p-1 hover:bg-military-200 dark:hover:bg-gray-600 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <input
                        type="text"
                        value={squad.name}
                        onChange={(e) => updateSquad(squadIndex, { name: e.target.value })}
                        className="input flex-1"
                        placeholder="Nombre de la escuadra"
                      />
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm text-military-600 dark:text-gray-400">
                        {squad.slots.length} slots
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSquad(squadIndex)}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contenido */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                      {/* Slots */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-military-900 dark:text-gray-100">Slots</h4>
                          <button
                            type="button"
                            onClick={() => addSlot(squadIndex)}
                            className="btn btn-primary btn-sm flex items-center"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Añadir Slot
                          </button>
                        </div>

                        <div className="space-y-2">
                          {squad.slots.map((slot, slotIndex) => (
                            <div key={slotIndex} className="flex items-center gap-2">
                              <span className="text-sm text-military-600 dark:text-gray-400 w-8">
                                {slotIndex + 1}.
                              </span>
                              <input
                                type="text"
                                value={slot.role}
                                onChange={(e) =>
                                  updateSlotRole(squadIndex, slotIndex, e.target.value)
                                }
                                className="input flex-1"
                                placeholder="Rol del slot"
                              />
                              <button
                                type="button"
                                onClick={() => removeSlot(squadIndex, slotIndex)}
                                className="btn btn-outline btn-sm text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Campos de Comunicación */}
                      <SquadCommunicationFields
                        frequency={squad.frequency || ''}
                        isCommand={squad.isCommand}
                        parentSquadId={squad.parentSquadId || ''}
                        parentFrequency={squad.parentFrequency || ''}
                        availableSquads={getAvailableParentSquads(squadIndex)}
                        onFrequencyChange={(value) =>
                          updateSquad(squadIndex, { frequency: value })
                        }
                        onIsCommandChange={(value) =>
                          updateSquad(squadIndex, { isCommand: value })
                        }
                        onParentSquadIdChange={(value) =>
                          updateSquad(squadIndex, { parentSquadId: value })
                        }
                        onParentFrequencyChange={(value) =>
                          updateSquad(squadIndex, { parentFrequency: value })
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {squads.length === 0 && (
              <div className="text-center py-8 text-military-500 dark:text-gray-400">
                No hay escuadras. Click en "Agregar Escuadra" para empezar.
              </div>
            )}
          </div>
        </Card>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={updateEvent.isPending}
            className="btn btn-primary flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateEvent.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <Link to={`/events/${id}`} className="btn btn-outline">
            Cancelar
          </Link>
          {canDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger ml-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Evento
            </button>
          )}
        </div>
      </form>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              ¿Eliminar evento?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Esta acción no se puede deshacer. Se eliminarán todas las escuadras y slots.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleteEvent.isPending}
                className="btn btn-danger flex-1"
              >
                {deleteEvent.isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-outline flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}