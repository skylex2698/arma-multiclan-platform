import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent } from '../../hooks/useEvents';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Trash2, Save, Plus, X, Edit2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { GameType } from '../../types';

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
  const [gameType, setGameType] = useState<GameType>('ARMA_3' as GameType);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [squads, setSquads] = useState<SquadForm[]>([]);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Cargar datos del evento
  useEffect(() => {
    if (eventData?.event) {
      const event = eventData.event;
      setName(event.name);
      setDescription(event.description || '');
      setBriefing(event.briefing || '');
      setGameType(event.gameType);

      // Convertir fecha y hora
      const date = new Date(event.scheduledDate);
      setScheduledDate(date.toISOString().split('T')[0]);
      setScheduledTime(date.toTimeString().slice(0, 5));

      // Convertir escuadras y slots
      const formattedSquads = event.squads.map((squad) => ({
        id: squad.id,
        name: squad.name,
        order: squad.order,
        slots: squad.slots.map((slot) => ({
          id: slot.id,
          role: slot.role,
          order: slot.order,
          isNew: false,
        })),
        isNew: false,
      }));
      setSquads(formattedSquads);
    }
  }, [eventData]);

  // Verificar permisos
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

  // Funciones de manejo de escuadras
  const addSquad = () => {
    const newOrder = squads.length + 1;
    setSquads([
      ...squads,
      {
        name: `Escuadra ${newOrder}`,
        order: newOrder,
        slots: [
          {
            role: 'Líder de Escuadra',
            order: 1,
            isNew: true,
          },
        ],
        isNew: true,
      },
    ]);
  };

  const removeSquad = (index: number) => {
    setSquads(squads.filter((_, i) => i !== index));
  };

  const updateSquadName = (index: number, name: string) => {
    const updated = [...squads];
    updated[index].name = name;
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

    // Validaciones
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

  if (loadingEvent) {
    return <LoadingSpinner />;
  }

  if (!eventData?.event) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">Evento no encontrado</p>
        <Link
          to="/events"
          className="text-primary-600 hover:text-primary-700 mt-2 inline-block"
        >
          Volver a eventos
        </Link>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">No tienes permisos para editar este evento</p>
        <Link
          to={`/events/${id}`}
          className="text-primary-600 hover:text-primary-700 mt-2 inline-block"
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
        className="inline-flex items-center text-military-600 hover:text-military-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al evento
      </Link>

      <h1 className="text-3xl font-bold text-military-900 mb-6">
        Editar Evento
      </h1>

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Información básica */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-military-900 mb-4">
            Información Básica
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-military-700 mb-1">
                Nombre del Evento *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Operación Tormenta del Desierto"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-military-700 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                rows={3}
                placeholder="Breve descripción del evento..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-military-700 mb-1">
                  Tipo de Juego *
                </label>
                <select
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value as GameType)}
                  className="input"
                  required
                >
                  <option value="ARMA_3">Arma 3</option>
                  <option value="ARMA_REFORGER">Arma Reforger</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-military-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-military-700 mb-1">
                  Hora *
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-military-700 mb-1">
                Briefing (HTML)
              </label>
              <textarea
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                className="input font-mono text-sm"
                rows={6}
                placeholder="<h1>Briefing</h1><p>Objetivo: Capturar la base enemiga...</p>"
              />
              <p className="text-xs text-military-500 mt-1">
                Puedes usar HTML para dar formato al briefing
              </p>
            </div>
          </div>
        </Card>

        {/* Escuadras y Slots */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-military-900">
              Escuadras y Slots
            </h2>
            <button
              type="button"
              onClick={addSquad}
              className="btn btn-secondary btn-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Escuadra
            </button>
          </div>

          <div className="space-y-4">
            {squads.map((squad, squadIndex) => (
              <div
                key={squadIndex}
                className="p-4 border-2 border-military-200 rounded-lg bg-military-50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={squad.name}
                    onChange={(e) => updateSquadName(squadIndex, e.target.value)}
                    className="input flex-1"
                    placeholder="Nombre de la escuadra"
                  />
                  <button
                    type="button"
                    onClick={() => addSlot(squadIndex)}
                    className="btn btn-primary btn-sm flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Slot
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSquad(squadIndex)}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {squad.slots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-2">
                      <span className="text-sm text-military-600 w-8">
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
            ))}

            {squads.length === 0 && (
              <div className="text-center py-8 text-military-500">
                No hay escuadras. Click en "Agregar Escuadra" para empezar.
              </div>
            )}
          </div>
        </Card>

        {/* Advertencia sobre usuarios asignados */}
        {eventData.event.occupiedSlots > 0 && (
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Advertencia:</strong> Este evento tiene {eventData.event.occupiedSlots} usuario
              {eventData.event.occupiedSlots !== 1 ? 's' : ''} asignado
              {eventData.event.occupiedSlots !== 1 ? 's' : ''}. Si eliminas escuadras o slots,
              los usuarios asignados a esos slots perderán su asignación.
            </p>
          </Card>
        )}

        {/* Zona de peligro */}
        {canDelete && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <h3 className="text-lg font-bold text-red-900 mb-2">Zona de Peligro</h3>
            <p className="text-sm text-red-700 mb-4">
              Eliminar este evento es una acción permanente. Todos los usuarios inscritos
              perderán sus slots.
            </p>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-danger flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Evento
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-900">
                  ¿Estás seguro? Esta acción no se puede deshacer y eliminará todos los
                  slots e inscripciones.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteEvent.isPending}
                    className="btn btn-danger"
                  >
                    {deleteEvent.isPending ? 'Eliminando...' : 'Sí, Eliminar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn btn-outline"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

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
        </div>
      </form>
    </div>
  );
}