// frontend/src/pages/events/CreateEventPage.tsx - VERSIÓN COMPLETA CON COMUNICACIONES

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useCreateEvent } from '../../hooks/useEvents';
import { Card } from '../../components/ui/Card';
import { SquadCommunicationFields } from '../../components/events/SquadCommunicationFields';
import type { GameType } from '../../types';
import { BriefingEditorWithTemplates } from '../../components/events/BriefingEditor/BriefingEditorWithTemplates';
import '../../components/events/BriefingEditor/BriefingEditor.css';

interface SlotForm {
  id: string;
  role: string;
  order: number;
}

interface SquadForm {
  id: string;
  name: string;
  order: number;
  frequency?: string;
  isCommand: boolean;
  parentSquadId?: string;
  parentFrequency?: string;
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
      frequency: '',
      isCommand: false,
      parentSquadId: '',
      parentFrequency: '',
      slots: [
        { id: '1-1', role: 'Líder de Escuadra', order: 1 },
        { id: '1-2', role: 'Fusilero', order: 2 },
        { id: '1-3', role: 'Médico', order: 3 },
      ],
    },
  ]);

  const [error, setError] = useState('');
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set(['1']));

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

  const addSquad = () => {
    const newOrder = squads.length + 1;
    const newId = Date.now().toString();
    setSquads([
      ...squads,
      {
        id: newId,
        name: `Escuadra ${newOrder}`,
        order: newOrder,
        frequency: '',
        isCommand: false,
        parentSquadId: '',
        parentFrequency: '',
        slots: [
          {
            id: `${newId}-1`,
            role: 'Líder de Escuadra',
            order: 1,
          },
        ],
      },
    ]);
    setExpandedSquads((prev) => new Set([...prev, newId]));
  };

  const removeSquad = (squadId: string) => {
    setSquads(squads.filter((s) => s.id !== squadId));
    setExpandedSquads((prev) => {
      const next = new Set(prev);
      next.delete(squadId);
      return next;
    });
  };

  const updateSquad = (squadId: string, updates: Partial<SquadForm>) => {
    setSquads(squads.map((s) => (s.id === squadId ? { ...s, ...updates } : s)));
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

  const updateSlotRole = (squadId: string, slotId: string, role: string) => {
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
        id: squad.id, // ID temporal para mapear jerarquías
        name: squad.name,
        order: squad.order,
        frequency: squad.frequency || undefined,
        isCommand: squad.isCommand,
        parentSquadId: squad.parentSquadId || undefined,
        parentFrequency: squad.parentFrequency || undefined,
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
      setError(error.response?.data?.message || 'Error al crear el evento');
    }
  };

  const getAvailableParentSquads = (currentSquadId: string) => {
    return squads
      .filter((s) => s.id !== currentSquadId)
      .map((s) => ({ id: s.id, name: s.name }));
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
              <label className="block text-sm font-medium text-military-700 mb-2">
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
              <label className="block text-sm font-medium text-military-700 mb-2">
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
                <label className="block text-sm font-medium text-military-700 mb-2">
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
                <label className="block text-sm font-medium text-military-700 mb-2">
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
                <label className="block text-sm font-medium text-military-700 mb-2">
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
              <label className="block text-sm font-medium text-military-700 mb-2">
                Briefing del Evento
              </label>
              <BriefingEditorWithTemplates
                content={briefing}
                onChange={setBriefing}
                placeholder="Escribe el briefing del evento aquí..."
              />
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <p>💡 <strong>Tip:</strong> Usa las plantillas predefinidas para empezar más rápido</p>
                <p>📝 El briefing admite formato rico: títulos, listas, tablas, imágenes y más</p>
              </div>
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
              className="btn btn-primary btn-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Escuadra
            </button>
          </div>

          <div className="space-y-4">
            {squads.map((squad) => {
              const isExpanded = expandedSquads.has(squad.id);
              
              return (
                <div
                  key={squad.id}
                  className="border-2 border-military-200 rounded-lg overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 bg-military-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleSquad(squad.id)}
                        className="p-1 hover:bg-military-200 rounded"
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
                        onChange={(e) => updateSquad(squad.id, { name: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="input flex-1"
                        placeholder="Nombre de la escuadra"
                      />
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm text-military-600">
                        {squad.slots.length} slots
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSquad(squad.id)}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contenido expandible */}
                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      {/* Slots */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-military-900">Slots</h4>
                          <button
                            type="button"
                            onClick={() => addSlot(squad.id)}
                            className="btn btn-primary btn-sm flex items-center"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Añadir Slot
                          </button>
                        </div>

                        <div className="space-y-2">
                          {squad.slots.map((slot) => (
                            <div key={slot.id} className="flex items-center gap-2">
                              <span className="text-sm text-military-600 w-8">
                                {slot.order}.
                              </span>
                              <input
                                type="text"
                                value={slot.role}
                                onChange={(e) =>
                                  updateSlotRole(squad.id, slot.id, e.target.value)
                                }
                                className="input flex-1"
                                placeholder="Rol del slot"
                              />
                              <button
                                type="button"
                                onClick={() => removeSlot(squad.id, slot.id)}
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
                        availableSquads={getAvailableParentSquads(squad.id)}
                        onFrequencyChange={(value) =>
                          updateSquad(squad.id, { frequency: value })
                        }
                        onIsCommandChange={(value) =>
                          updateSquad(squad.id, { isCommand: value })
                        }
                        onParentSquadIdChange={(value) =>
                          updateSquad(squad.id, { parentSquadId: value })
                        }
                        onParentFrequencyChange={(value) =>
                          updateSquad(squad.id, { parentFrequency: value })
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {squads.length === 0 && (
              <div className="text-center py-8 text-military-500">
                No hay escuadras. Click en "Agregar Escuadra" para empezar.
              </div>
            )}
          </div>
        </Card>

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