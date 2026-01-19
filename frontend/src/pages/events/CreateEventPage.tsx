import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Users } from 'lucide-react';
import { useCreateEvent } from '../../hooks/useEvents';
import { Card } from '../../components/ui/Card';
import type { GameType } from '../../types';

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

export default function CreateEventPage() {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [briefing, setBriefing] = useState('');
  const [gameType, setGameType] = useState<GameType>('ARMA_3');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('20:00');
  const [squads, setSquads] = useState<SquadForm[]>([
    {
      id: '1',
      name: 'Alfa',
      order: 1,
      slots: [
        { id: '1-1', role: 'Líder de Escuadra', order: 1 },
        { id: '1-2', role: 'Fusilero', order: 2 },
        { id: '1-3', role: 'Médico', order: 3 },
      ],
    },
  ]);

  const [error, setError] = useState('');

  const addSquad = () => {
    const newOrder = squads.length + 1;
    setSquads([
      ...squads,
      {
        id: Date.now().toString(),
        name: `Escuadra ${newOrder}`,
        order: newOrder,
        slots: [
          {
            id: `${Date.now()}-1`,
            role: 'Líder de Escuadra',
            order: 1,
          },
        ],
      },
    ]);
  };

  const removeSquad = (squadId: string) => {
    setSquads(squads.filter((s) => s.id !== squadId));
  };

  const updateSquadName = (squadId: string, name: string) => {
    setSquads(
      squads.map((s) => (s.id === squadId ? { ...s, name } : s))
    );
  };

  const addSlot = (squadId: string) => {
    setSquads(
      squads.map((squad) => {
        if (squad.id === squadId) {
          const newOrder = squad.slots.length + 1;
          return {
            ...squad,
            slots: [
              ...squad.slots,
              {
                id: `${Date.now()}`,
                role: 'Fusilero',
                order: newOrder,
              },
            ],
          };
        }
        return squad;
      })
    );
  };

  const removeSlot = (squadId: string, slotId: string) => {
    setSquads(
      squads.map((squad) => {
        if (squad.id === squadId) {
          return {
            ...squad,
            slots: squad.slots.filter((s) => s.id !== slotId),
          };
        }
        return squad;
      })
    );
  };

  const updateSlotRole = (
    squadId: string,
    slotId: string,
    role: string
  ) => {
    setSquads(
      squads.map((squad) => {
        if (squad.id === squadId) {
          return {
            ...squad,
            slots: squad.slots.map((slot) =>
              slot.id === slotId ? { ...slot, role } : slot
            ),
          };
        }
        return squad;
      })
    );
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
      setError('Debes crear al menos una escuadra');
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

      const formattedSquads = squads.map((squad) => ({
        name: squad.name,
        order: squad.order,
        slots: squad.slots.map((slot) => ({
          role: slot.role,
          order: slot.order,
        })),
      }));

      await createEvent.mutateAsync({
        name,
        description: description || undefined,
        briefing: briefing || undefined,
        gameType,
        scheduledDate: dateTime,
        squads: formattedSquads,
      });

      navigate('/events');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || 'Error al crear el evento'
      );
    }
  };

  return (
    <div>
      <Link
        to="/events"
        className="inline-flex items-center text-military-600 hover:text-military-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a eventos
      </Link>

      <h1 className="text-3xl font-bold text-military-900 mb-6">
        Crear Nuevo Evento
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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-military-900">
              Escuadras y Slots
            </h2>
            <button
              type="button"
              onClick={addSquad}
              className="btn btn-secondary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Escuadra
            </button>
          </div>

          <div className="space-y-4">
            {squads.map((squad, squadIndex) => (
              <Card key={squad.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Users className="h-5 w-5 text-primary-600" />
                    <input
                      type="text"
                      value={squad.name}
                      onChange={(e) =>
                        updateSquadName(squad.id, e.target.value)
                      }
                      className="input"
                      placeholder="Nombre de la escuadra"
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => addSlot(squad.id)}
                      className="btn btn-primary btn-sm flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Slot
                    </button>
                    {squads.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSquad(squad.id)}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {squad.slots.map((slot, slotIndex) => (
                    <div
                      key={slot.id}
                      className="flex items-center gap-2 p-3 bg-military-50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-military-600 w-8">
                        #{slotIndex + 1}
                      </span>
                      <input
                        type="text"
                        value={slot.role}
                        onChange={(e) =>
                          updateSlotRole(squad.id, slot.id, e.target.value)
                        }
                        className="input flex-1"
                        placeholder="Rol del slot (ej: Fusilero, Médico)"
                      />
                      {squad.slots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlot(squad.id, slot.id)}
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-sm text-military-600">
                  Total: {squad.slots.length} slots
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="text-sm text-primary-900">
              <strong>Total del evento:</strong> {squads.length} escuadras,{' '}
              {squads.reduce((acc, s) => acc + s.slots.length, 0)} slots
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={createEvent.isPending}
            className="btn btn-primary flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {createEvent.isPending ? 'Creando...' : 'Crear Evento'}
          </button>
          <Link to="/events" className="btn btn-outline">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}