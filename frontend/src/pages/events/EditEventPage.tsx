import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEvent, useUpdateEvent } from '../../hooks/useEvents';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { GameType } from '../../types';
import { useDeleteEvent } from '../../hooks/useEvents';

interface SlotForm {
  id: string;
  role: string;
  order: number;
}

interface SquadForm {
  id: string;
  name: string;
  order: number;
  slots: SlotForm[];
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: eventData, isLoading: loadingEvent } = useEvent(id!);
  const updateEvent = useUpdateEvent(id!);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [briefing, setBriefing] = useState('');
  const [gameType, setGameType] = useState<GameType>('ARMA_3' as GameType);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [squads, setSquads] = useState<SquadForm[]>([]);
  const [error, setError] = useState('');

  const deleteEvent = useDeleteEvent();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const canDelete = user?.role === 'ADMIN' || eventData?.event?.creatorId === user?.id;

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

  // Cargar datos del evento
  useEffect(() => {
    if (eventData?.event) {
      const event = eventData.event;
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        })),
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
      });

      navigate(`/events/${id}`);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al actualizar el evento');
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

        {/* Nota sobre escuadras */}
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> La edición de escuadras y slots no está disponible
            por ahora para evitar problemas con usuarios ya inscritos. Si necesitas
            modificar la estructura, contacta con un administrador.
          </p>
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
        </div>
      </form>
    </div>
  );
}