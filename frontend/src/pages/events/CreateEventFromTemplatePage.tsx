import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Save } from 'lucide-react';
import {
  useCreateEventFromTemplate,
  useEvent,
} from '../../hooks/useEvents';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { BriefingEditorWithTemplates } from '../../components/events/BriefingEditor/BriefingEditorWithTemplates';
import {
  createUtcDateFromTimezone,
  getNearestUpcomingFridayDateInput,
  getTodayDateInputInTimezone,
  getUserTimezone,
  isDateTimeInPast,
} from '../../utils/eventTime';
import { useAuthStore } from '../../store/authStore';
import '../../components/events/BriefingEditor/BriefingEditor.css';

export default function CreateEventFromTemplatePage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { data: templateData, isLoading: loadingTemplate } = useEvent(templateId!);
  const createEvent = useCreateEventFromTemplate();
  const user = useAuthStore((state) => state.user);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [briefing, setBriefing] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!templateData?.event) return;

    const event = templateData.event;
    const effectiveTimezone = event.timezone || user?.timezone || getUserTimezone();

    setName(`${event.name} (Copia)`);
    setDescription(event.description || '');
    setBriefing(event.briefing || '');
    setScheduledDate(getNearestUpcomingFridayDateInput(effectiveTimezone, '20:00'));
    setScheduledTime('20:00');
  }, [templateData, user?.timezone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !scheduledDate || !scheduledTime) {
      setError('Completa los campos obligatorios.');
      return;
    }

    try {
      const effectiveTimezone =
        templateData?.event?.timezone || user?.timezone || getUserTimezone();

      if (isDateTimeInPast(scheduledDate, scheduledTime, effectiveTimezone)) {
        setError('No se puede crear un evento con una fecha y hora en el pasado.');
        return;
      }

      const dateTime = createUtcDateFromTimezone(
        scheduledDate,
        scheduledTime,
        effectiveTimezone
      );

      await createEvent.mutateAsync({
        templateEventId: templateId!,
        name,
        description: description || undefined,
        briefing: briefing || undefined,
        scheduledDate: dateTime,
      });

      navigate('/events');
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setError(requestError.response?.data?.message || 'Error al crear el evento');
    }
  };

  if (loadingTemplate) {
    return <LoadingSpinner />;
  }

  if (!templateData?.event) {
    return (
      <section className="panel">
        <p className="text-sm text-red-600 dark:text-red-400">
          Plantilla no encontrada.
        </p>
        <Link to="/events" className="toolbar-link mt-2 inline-flex">
          Volver a eventos
        </Link>
      </section>
    );
  }

  const template = templateData.event;
  const effectiveTimezone = template.timezone || user?.timezone || getUserTimezone();
  const minScheduledDate = getTodayDateInputInTimezone(effectiveTimezone);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/events" className="inline-flex items-center gap-2 toolbar-link">
        <ArrowLeft className="h-4 w-4" />
        Volver a eventos
      </Link>

      <header className="space-y-1">
        <h1 className="page-title">Crear evento desde plantilla</h1>
        <p className="page-subtitle">
          Se duplica la estructura de escuadras manteniendo los slots libres.
        </p>
      </header>

      {error && (
        <section className="panel border-red-300 bg-red-50/80 dark:border-red-700 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </section>
      )}

      <section className="panel border-blue-300 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <Copy className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700 dark:text-blue-400" />
          <div>
            <h2 className="section-title">Plantilla base: {template.name}</h2>
            <div className="meta-inline mt-1">
              <span>{template.squads.length} escuadras</span>
              <span aria-hidden="true">·</span>
              <span>{template.totalSlots ?? 0} slots totales</span>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Datos del nuevo evento</h2>
              <p className="section-caption">Solo editas nombre, fecha, hora y briefing.</p>
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

            <div className="form-grid-2">
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
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Briefing</h2>
              <p className="section-caption">
                Copiado desde la plantilla y editable antes de publicar.
              </p>
            </div>
          </div>

          <BriefingEditorWithTemplates
            content={briefing}
            onChange={setBriefing}
            placeholder="Edita el briefing del evento..."
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Estructura incluida</h2>
              <p className="section-caption">
                Vista previa compacta de las escuadras que se copiaran.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {template.squads
              .sort((a, b) => a.order - b.order)
              .map((squad) => (
                <div
                  key={squad.id}
                  className="rounded-md border border-military-200 px-4 py-3 dark:border-gray-700"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-military-900 dark:text-gray-100">
                      {squad.name}
                    </p>
                    <span className="section-caption">
                      {squad.slots.length} slots
                    </span>
                  </div>
                  <div className="meta-inline mt-2">
                    {squad.slots
                      .sort((a, b) => a.order - b.order)
                      .map((slot, index) => (
                        <span key={slot.id}>
                          {slot.role}
                          {index < squad.slots.length - 1 ? ' · ' : ''}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
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
