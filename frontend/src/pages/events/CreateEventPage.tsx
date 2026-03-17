import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Copy,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCreateEvent } from '../../hooks/useEvents';
import { useClans } from '../../hooks/useClans';
import { useGames } from '../../hooks/useGames';
import { eventService } from '../../services/eventService';
import { useAuthStore } from '../../store/authStore';
import { SquadCommunicationFields } from '../../components/events/SquadCommunicationFields';
import { ClanInvitationSelector } from '../../components/events/ClanInvitationSelector';
import { BriefingEditorWithTemplates } from '../../components/events/BriefingEditor/BriefingEditorWithTemplates';
import { getSquadTemplateById, squadTemplates } from '../../data/squadTemplates';
import { EventVisibility } from '../../types';
import { normalizeFrequencyValue } from '../../utils/frequency';
import {
  createUtcDateFromTimezone,
  getEventTimezoneOptions,
  getNearestUpcomingFridayDateInput,
  getTodayDateInputInTimezone,
  getUserTimezone,
  isDateTimeInPast,
} from '../../utils/eventTime';
import {
  buildAutomaticSquadIdentity,
  DEFAULT_SQUAD_BASE_FREQUENCY,
} from '../../utils/squadAutoAssignment';
import '../../components/events/BriefingEditor/BriefingEditor.css';

interface SlotForm {
  id: string;
  role: string;
  order: number;
}

interface SquadForm {
  id: string;
  sequence: number;
  name: string;
  order: number;
  frequency?: string;
  isCommand: boolean;
  parentSquadId?: string;
  parentFrequency?: string;
  reservedForClanId?: string;
  slots: SlotForm[];
}

const reindexSlots = (slots: SlotForm[]) =>
  slots.map((slot, index) => ({ ...slot, order: index + 1 }));

const reindexSquads = (squads: SquadForm[]) =>
  squads.map((squad, index) => ({ ...squad, order: index + 1 }));

const cloneSlots = (slots: SlotForm[], squadId: string) =>
  slots.map((slot, index) => ({
    id: `${squadId}-${index + 1}-${Date.now()}`,
    role: slot.role,
    order: index + 1,
  }));

export default function CreateEventPage() {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();
  const { data: gamesData } = useGames();
  const { data: clansData } = useClans();
  const user = useAuthStore((state) => state.user);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [briefing, setBriefing] = useState('');
  const [gameId, setGameId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('20:00');
  const [timezone, setTimezone] = useState(user?.timezone || getUserTimezone());
  const [visibility, setVisibility] = useState<EventVisibility>(EventVisibility.PRIVATE);
  const [invitedClanIds, setInvitedClanIds] = useState<string[]>([]);
  const [serverName, setServerName] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [serverPort, setServerPort] = useState('');
  const [serverPassword, setServerPassword] = useState('');
  const [briefingFile, setBriefingFile] = useState<File | null>(null);
  const [modsetFile, setModsetFile] = useState<File | null>(null);
  const [defaultSquadFrequency, setDefaultSquadFrequency] = useState(
    DEFAULT_SQUAD_BASE_FREQUENCY
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(squadTemplates[0]?.id || '');
  const [squads, setSquads] = useState<SquadForm[]>(() => {
    const sequence = 1;
    const automaticIdentity = buildAutomaticSquadIdentity(
      sequence,
      DEFAULT_SQUAD_BASE_FREQUENCY
    );

    return [
      {
        id: '1',
        sequence,
        name: automaticIdentity.name,
        order: 1,
        frequency: automaticIdentity.frequency,
        isCommand: false,
        parentSquadId: '',
        parentFrequency: '',
        reservedForClanId: '',
        slots: [{ id: '1-1', role: 'Lider de escuadra', order: 1 }],
      },
    ];
  });
  const [error, setError] = useState('');
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set());
  const minScheduledDate = getTodayDateInputInTimezone(timezone);

  useEffect(() => {
    if (!gameId && gamesData?.games?.length) {
      setGameId(gamesData.games[0].id);
    }
  }, [gameId, gamesData?.games]);

  useEffect(() => {
    if (!scheduledDate) {
      setScheduledDate(getNearestUpcomingFridayDateInput(timezone, scheduledTime));
    }
  }, [scheduledDate, scheduledTime, timezone]);

  const selectedTemplate = getSquadTemplateById(selectedTemplateId);
  const nextSquadSequence =
    squads.reduce((maxSequence, squad) => Math.max(maxSequence, squad.sequence), 0) + 1;

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
    const newId = Date.now().toString();
    const sequence = nextSquadSequence;
    const automaticIdentity = buildAutomaticSquadIdentity(sequence, defaultSquadFrequency);
    const newSquad: SquadForm = {
      id: newId,
      sequence,
      name: automaticIdentity.name,
      order: squads.length + 1,
      frequency: automaticIdentity.frequency,
      isCommand: false,
      parentSquadId: '',
      parentFrequency: '',
      reservedForClanId: '',
      slots: [{ id: `${newId}-1`, role: 'Lider de escuadra', order: 1 }],
    };

    setSquads((prev) => [...prev, newSquad]);
    setExpandedSquads((prev) => new Set(prev).add(newId));
  };

  const addSquadFromTemplate = () => {
    if (!selectedTemplate) {
      return;
    }

    const newId = `${Date.now()}-${selectedTemplate.id}`;
    const sequence = nextSquadSequence;
    const automaticIdentity = buildAutomaticSquadIdentity(sequence, defaultSquadFrequency);
    const newSquad: SquadForm = {
      id: newId,
      sequence,
      name: automaticIdentity.name,
      order: squads.length + 1,
      frequency: automaticIdentity.frequency,
      isCommand: false,
      parentSquadId: '',
      parentFrequency: '',
      reservedForClanId: '',
      slots: selectedTemplate.roles.map((role, index) => ({
        id: `${newId}-${index + 1}`,
        role,
        order: index + 1,
      })),
    };

    setSquads((prev) => reindexSquads([...prev, newSquad]));
    setExpandedSquads((prev) => new Set(prev).add(newId));
  };

  const duplicateSquad = (sourceSquadId: string) => {
    const source = squads.find((squad) => squad.id === sourceSquadId);
    if (!source) return;

    const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const sequence = nextSquadSequence;
    const automaticIdentity = buildAutomaticSquadIdentity(sequence, defaultSquadFrequency);
    const duplicate: SquadForm = {
      id: newId,
      sequence,
      name: automaticIdentity.name,
      order: squads.length + 1,
      frequency: automaticIdentity.frequency,
      isCommand: false,
      parentSquadId: '',
      parentFrequency: '',
      reservedForClanId: source.reservedForClanId || '',
      slots: cloneSlots(source.slots, newId),
    };

    setSquads((prev) => reindexSquads([...prev, duplicate]));
    setExpandedSquads((prev) => new Set(prev).add(newId));
  };

  const removeSquad = (squadId: string) => {
    setSquads((prev) => reindexSquads(prev.filter((squad) => squad.id !== squadId)));
    setExpandedSquads((prev) => {
      const next = new Set(prev);
      next.delete(squadId);
      return next;
    });
  };

  const updateSquad = (squadId: string, updates: Partial<SquadForm>) => {
    setSquads((prev) =>
      prev.map((squad) => (squad.id === squadId ? { ...squad, ...updates } : squad))
    );
  };

  const addSlot = (squadId: string) => {
    setSquads((prev) =>
      prev.map((squad) => {
        if (squad.id !== squadId) return squad;

        const nextSlots = [
          ...squad.slots,
          {
            id: `${Date.now()}`,
            role: 'Fusilero',
            order: squad.slots.length + 1,
          },
        ];

        return { ...squad, slots: reindexSlots(nextSlots) };
      })
    );
  };

  const removeSlot = (squadId: string, slotId: string) => {
    setSquads((prev) =>
      prev.map((squad) => {
        if (squad.id !== squadId) return squad;
        return {
          ...squad,
          slots: reindexSlots(squad.slots.filter((slot) => slot.id !== slotId)),
        };
      })
    );
  };

  const updateSlotRole = (squadId: string, slotId: string, role: string) => {
    setSquads((prev) =>
      prev.map((squad) => {
        if (squad.id !== squadId) return squad;

        return {
          ...squad,
          slots: squad.slots.map((slot) =>
            slot.id === slotId ? { ...slot, role } : slot
          ),
        };
      })
    );
  };

  const getAvailableParentSquads = (currentSquadId: string) =>
    squads
      .filter((squad) => squad.id !== currentSquadId)
      .map((squad) => ({ id: squad.id, name: squad.name }));

  const invitationClanOptions = (clansData?.clans || []).filter(
    (clan) => clan.id !== user?.clanId
  );
  const ownClanOption = user?.clanId
    ? (clansData?.clans || []).find((clan) => clan.id === user.clanId) ||
      (user.clan
        ? {
            id: user.clanId,
            name: user.clan.name,
            tag: user.clan.tag,
          }
        : {
            id: user.clanId,
            name: 'Tu clan',
            tag: null,
          })
    : null;
  const canReserveForOwnClan =
    visibility === EventVisibility.PRIVATE && invitedClanIds.length > 0 && !!user?.clanId;
  const reservationClanIds = useMemo(
    () =>
      canReserveForOwnClan && user?.clanId
        ? [...invitedClanIds, user.clanId]
        : invitedClanIds,
    [canReserveForOwnClan, invitedClanIds, user?.clanId]
  );
  const reservationClanOptions = useMemo(
    () =>
      visibility === EventVisibility.PRIVATE
        ? [
            ...invitationClanOptions.filter((clan) => invitedClanIds.includes(clan.id)),
            ...(canReserveForOwnClan && ownClanOption ? [ownClanOption] : []),
          ]
            .filter(
              (clan, index, array) => array.findIndex((item) => item.id === clan.id) === index
            )
            .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
        : [],
    [
      canReserveForOwnClan,
      invitationClanOptions,
      invitedClanIds,
      ownClanOption,
      visibility,
    ]
  );

  useEffect(() => {
    setSquads((prev) => {
      let changed = false;

      const next = prev.map((squad) => {
        const nextReservedForClanId =
          visibility === EventVisibility.PRIVATE &&
          squad.reservedForClanId &&
          reservationClanIds.includes(squad.reservedForClanId)
            ? squad.reservedForClanId
            : '';

        if (nextReservedForClanId !== (squad.reservedForClanId || '')) {
          changed = true;
          return { ...squad, reservedForClanId: nextReservedForClanId };
        }

        return squad;
      });

      return changed ? next : prev;
    });
  }, [reservationClanIds, visibility]);

  const toggleInvitedClan = (clanId: string) => {
    setInvitedClanIds((current) =>
      current.includes(clanId)
        ? current.filter((id) => id !== clanId)
        : [...current, clanId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !gameId || !scheduledDate || !scheduledTime) {
      setError('Completa los campos obligatorios.');
      return;
    }

    if (isDateTimeInPast(scheduledDate, scheduledTime, timezone)) {
      setError('No se puede crear un evento con una fecha y hora en el pasado.');
      return;
    }

    if (squads.length === 0) {
      setError('Debes crear al menos una escuadra.');
      return;
    }

    for (const squad of squads) {
      if (squad.slots.length === 0) {
        setError(`La escuadra "${squad.name}" debe tener al menos un slot.`);
        return;
      }
    }

    if (squads.filter((squad) => squad.isCommand).length > 1) {
      setError('Solo puede existir una escuadra marcada como mando de misión.');
      return;
    }

    try {
      const dateTime = createUtcDateFromTimezone(
        scheduledDate,
        scheduledTime,
        timezone
      );

      const result = await createEvent.mutateAsync({
        name,
        description: description || undefined,
        briefing: briefing || undefined,
        gameId,
        scheduledDate: dateTime,
        timezone,
        visibility,
        invitedClanIds: visibility === EventVisibility.PRIVATE ? invitedClanIds : [],
        serverName: serverName || undefined,
        serverIp: serverIp || undefined,
        serverPort: serverPort || undefined,
        serverPassword: serverPassword || undefined,
        squads: squads.map((squad) => ({
          id: squad.id,
          name: squad.name,
          order: squad.order,
          frequency: normalizeFrequencyValue(squad.frequency || '') || undefined,
          isCommand: squad.isCommand,
          parentSquadId: squad.parentSquadId || undefined,
          parentFrequency:
            normalizeFrequencyValue(squad.parentFrequency || '') || undefined,
          reservedForClanId: squad.reservedForClanId || undefined,
          slots: squad.slots.map((slot) => ({
            role: slot.role,
            order: slot.order,
          })),
        })),
      });

      try {
        if (briefingFile) {
          await eventService.uploadBriefingFile(result.event.id, briefingFile);
        }

        if (modsetFile) {
          await eventService.uploadModsetFile(result.event.id, modsetFile);
        }

        navigate(`/events/${result.event.id}`);
      } catch (uploadErr) {
        const requestError = uploadErr as { response?: { data?: { message?: string } } };
        window.alert(
          requestError.response?.data?.message ||
            'El evento se ha creado, pero no se pudo subir alguno de los archivos. Puedes completarlo desde la edicion del evento.'
        );
        navigate(`/events/${result.event.id}/edit`);
      }
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setError(requestError.response?.data?.message || 'Error al crear el evento');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/events" className="inline-flex items-center gap-2 toolbar-link">
        <ArrowLeft className="h-4 w-4" />
        Volver a eventos
      </Link>

      <header className="space-y-1">
        <h1 className="page-title">Crear nuevo evento</h1>
        <p className="page-subtitle">
          Formulario compacto con escuadras colapsadas por defecto.
        </p>
      </header>

      {error && (
        <section className="panel border-red-300 bg-red-50/80 dark:border-red-700 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </section>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Datos del evento</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="field-label">Nombre del evento *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="field-label">Descripcion</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-[96px]"
                rows={4}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="field-label">Juego *</label>
                <select
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="input"
                  required
                >
                  {(gamesData?.games || []).map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Fecha *</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={minScheduledDate}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="field-label">Hora *</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="field-label">Zona horaria *</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="input"
                  required
                >
                  {getEventTimezoneOptions().map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="field-label">Visibilidad</label>
                <select
                  value={visibility}
                  onChange={(e) => {
                    const nextVisibility = e.target.value as EventVisibility;
                    setVisibility(nextVisibility);
                    if (nextVisibility !== EventVisibility.PRIVATE) {
                      setInvitedClanIds([]);
                    }
                  }}
                  className="input"
                >
                  <option value={EventVisibility.PRIVATE}>Privado</option>
                  <option value={EventVisibility.PUBLIC}>Publico</option>
                </select>
              </div>
            </div>

            {visibility === EventVisibility.PRIVATE && (
              <div>
                <label className="field-label">Clanes invitados</label>
                <ClanInvitationSelector
                  availableClans={invitationClanOptions}
                  invitedClanIds={invitedClanIds}
                  onToggleClan={toggleInvitedClan}
                  disabled={createEvent.isPending}
                />
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Acceso al servidor</h2>
            </div>
          </div>

          <div className="form-grid-4">
            <div>
              <label className="field-label">Nombre del servidor</label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                className="input"
                placeholder="Servidor principal"
              />
            </div>

            <div>
              <label className="field-label">IP</label>
              <input
                type="text"
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value)}
                className="input"
                placeholder="192.168.1.1"
              />
            </div>

            <div>
              <label className="field-label">Puerto</label>
              <input
                type="text"
                value={serverPort}
                onChange={(e) => setServerPort(e.target.value)}
                className="input"
                placeholder="2302"
              />
            </div>

            <div>
              <label className="field-label">Contraseña</label>
              <input
                type="text"
                value={serverPassword}
                onChange={(e) => setServerPassword(e.target.value)}
                className="input"
                placeholder="Clave segura"
              />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Briefing</h2>
            </div>
          </div>

          <BriefingEditorWithTemplates
            content={briefing}
            onChange={setBriefing}
            placeholder="Escribe el briefing del evento..."
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Archivos del evento</h2>
            </div>
          </div>

          <div className={`grid gap-4 ${gameId && gamesData?.games.find((game) => game.id === gameId)?.supportsModsetHtml ? 'md:grid-cols-2' : ''}`}>
            <div>
              <label className="field-label">Briefing PDF</label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-military-200 px-3 py-2 text-sm text-military-800 dark:border-gray-700 dark:text-gray-200">
                <Upload className="h-4 w-4" />
                <span className="truncate">
                  {briefingFile ? briefingFile.name : 'Seleccionar PDF'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setBriefingFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {gamesData?.games.find((game) => game.id === gameId)?.supportsModsetHtml && (
              <div>
                <label className="field-label">Modset HTML</label>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-military-200 px-3 py-2 text-sm text-military-800 dark:border-gray-700 dark:text-gray-200">
                  <Upload className="h-4 w-4" />
                  <span className="truncate">
                    {modsetFile ? modsetFile.name : 'Seleccionar HTML'}
                  </span>
                  <input
                    type="file"
                    accept=".html,.htm"
                    className="hidden"
                    onChange={(e) => setModsetFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Escuadras y slots</h2>
              <p className="section-caption">
                La plantilla define los slots. El nombre y la frecuencia de cada
                escuadra se proponen automaticamente a partir de una secuencia comun.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-military-200 bg-white/80 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-military-500 dark:text-gray-400">
                Plantilla preconfigurada
              </p>
              <h3 className="text-base font-semibold text-military-900 dark:text-gray-100">
                Anadir una escuadra con slots ya definidos
              </h3>
              <p className="section-caption">
                Elige el tipo de escuadra y anadela. La plantilla define sus
                puestos y la nueva escuadra se agrega con nombre y radio automaticos.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 xl:flex-row">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="input xl:flex-1"
              >
                {squadTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.roles.length} pax)
                  </option>
                ))}
              </select>
              <div className="flex flex-col gap-2 sm:flex-row xl:flex-none">
                <button
                  type="button"
                  onClick={addSquadFromTemplate}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  Anadir desde plantilla
                </button>
                <button
                  type="button"
                  onClick={addSquad}
                  className="btn btn-secondary"
                >
                  <Plus className="h-4 w-4" />
                  Agregar escuadra vacia
                </button>
              </div>
            </div>

            {selectedTemplate && (
              <div className="mt-4 rounded-lg border border-military-200 bg-military-50/70 p-4 dark:border-gray-700 dark:bg-gray-950/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-military-900 dark:text-gray-100">
                      {selectedTemplate.name}
                    </p>
                    <p className="text-xs text-military-600 dark:text-gray-400">
                      {selectedTemplate.roles.length} pax configurados
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-military-700 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                    Plantilla activa
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTemplate.roles.map((role, index) => (
                    <span
                      key={`${selectedTemplate.id}-${index}-${role}`}
                      className="rounded-full border border-military-200 bg-white px-2.5 py-1 text-xs text-military-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      {index + 1}. {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {squads.map((squad) => {
              const isExpanded = expandedSquads.has(squad.id);

              return (
                <section
                  key={squad.id}
                  className="overflow-hidden rounded-md border border-military-200 dark:border-gray-700"
                >
                  <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-start md:justify-between">
                    <button
                      type="button"
                      onClick={() => toggleSquad(squad.id)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <span className="mt-0.5 text-military-500 dark:text-gray-400">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={squad.name}
                          onChange={(e) =>
                            updateSquad(squad.id, { name: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="input"
                          placeholder="Nombre de la escuadra"
                        />
                        <div className="meta-inline mt-2">
                          <span>{squad.slots.length} slots</span>
                          {squad.frequency && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Interna {squad.frequency}</span>
                            </>
                          )}
                          {squad.isCommand && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Mando</span>
                            </>
                          )}
                          {squad.reservedForClanId && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Reservada</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => removeSquad(squad.id)}
                      className="btn btn-outline btn-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateSquad(squad.id)}
                      className="btn btn-outline btn-sm"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicar
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="subtle-divider space-y-4 px-4 py-4">
                      <div>
                        <label className="field-label">Reserva para clan</label>
                        <select
                          value={squad.reservedForClanId || ''}
                          onChange={(e) =>
                            updateSquad(squad.id, { reservedForClanId: e.target.value })
                          }
                          className="input"
                          disabled={reservationClanOptions.length === 0}
                        >
                          <option value="">Sin reserva</option>
                          {reservationClanOptions.map((clan) => (
                            <option key={clan.id} value={clan.id}>
                              {clan.tag ? `[${clan.tag}] ` : ''}
                              {clan.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-military-500 dark:text-gray-400">
                          Solo puedes reservar para clanes añadidos antes en `Clanes invitados` y,
                          si el evento es privado con invitados, para tu propio clan.
                        </p>
                      </div>

                      <div>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-military-900 dark:text-gray-100">
                            Slots
                          </h3>
                          <button
                            type="button"
                            onClick={() => addSlot(squad.id)}
                            className="btn btn-outline btn-sm"
                          >
                            <Plus className="h-4 w-4" />
                            Anadir slot
                          </button>
                        </div>

                        <div className="space-y-2">
                          {squad.slots.map((slot) => (
                            <div
                              key={slot.id}
                              className="grid gap-2 md:grid-cols-[40px_minmax(0,1fr)_auto] md:items-center"
                            >
                              <span className="text-sm text-military-500 dark:text-gray-400">
                                {slot.order}.
                              </span>
                              <input
                                type="text"
                                value={slot.role}
                                onChange={(e) =>
                                  updateSlotRole(squad.id, slot.id, e.target.value)
                                }
                                className="input"
                                placeholder="Rol del slot"
                              />
                              <button
                                type="button"
                                onClick={() => removeSlot(squad.id, slot.id)}
                                className="btn btn-outline btn-sm"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <SquadCommunicationFields
                        frequency={squad.frequency || ''}
                        isCommand={squad.isCommand}
                        commandDisabled={
                          !squad.isCommand && squads.some((candidate) => candidate.isCommand)
                        }
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
                </section>
              );
            })}

            {squads.length === 0 && (
              <div className="empty-state">
                No hay escuadras creadas. Agrega una para empezar.
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/events" className="btn btn-outline">
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={createEvent.isPending}
            className="btn btn-primary"
          >
            <Save className="h-4 w-4" />
            {createEvent.isPending ? 'Creando...' : 'Crear evento'}
          </button>
        </div>
      </form>
    </div>
  );
}
