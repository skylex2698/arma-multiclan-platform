import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEvent, useCreateEventFromTemplate } from '../../hooks/useEvents';
import { ArrowLeft, Save, Copy } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { BriefingEditorWithTemplates } from '../../components/events/BriefingEditor/BriefingEditorWithTemplates';
import '../../components/events/BriefingEditor/BriefingEditor.css';

export default function CreateEventFromTemplatePage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { data: templateData, isLoading: loadingTemplate } = useEvent(templateId!);
  const createEvent = useCreateEventFromTemplate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [briefing, setBriefing] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [error, setError] = useState('');

  // Cargar datos de la plantilla
  useEffect(() => {
    if (templateData?.event) {
      const event = templateData.event;
      setName(`${event.name} (Copia)`);
      setDescription(event.description || '');
      setBriefing(event.briefing || '');
      
      // Poner fecha de hoy por defecto
      const today = new Date();
      setScheduledDate(today.toISOString().split('T')[0]);
      setScheduledTime('20:00'); // Hora por defecto
    }
  }, [templateData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!name || !scheduledDate || !scheduledTime) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);

      await createEvent.mutateAsync({
        templateEventId: templateId!,
        name,
        description: description || undefined,
        briefing: briefing || undefined,
        scheduledDate: dateTime,
      });

      navigate('/events');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al crear el evento');
    }
  };

  if (loadingTemplate) {
    return <LoadingSpinner />;
  }

  if (!templateData?.event) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">Plantilla no encontrada</p>
        <Link
          to="/events"
          className="text-primary-600 hover:text-primary-700 mt-2 inline-block"
        >
          Volver a eventos
        </Link>
      </div>
    );
  }

  const template = templateData.event;

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
        Crear Evento desde Plantilla
      </h1>

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Información de la plantilla */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <Copy className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-blue-900">
            Usando como plantilla: {template.name}
          </h2>
        </div>
        <p className="text-sm text-blue-700">
          Se copiará la estructura de escuadras y slots. Los slots estarán libres
          para que los usuarios se apunten.
        </p>
        <div className="mt-2 text-sm text-blue-600">
          <strong>Estructura:</strong> {template.squads.length} escuadras,{' '}
          {template.totalSlots} slots totales
        </div>
      </Card>

      <form onSubmit={handleSubmit}>
        {/* Información básica */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-military-900 mb-4">
            Información del Nuevo Evento
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Briefing del Evento
              </label>
              <BriefingEditorWithTemplates
                content={briefing}
                onChange={setBriefing}
                placeholder="Edita el briefing del evento..."
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 El briefing se ha copiado de la plantilla. Puedes editarlo libremente.
              </p>
            </div>
          </div>
        </Card>

        {/* Vista previa de estructura */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-military-900 mb-4">
            Vista Previa de la Estructura
          </h2>
          <div className="space-y-3">
            {template.squads
              .sort((a, b) => a.order - b.order)
              .map((squad) => (
                <div
                  key={squad.id}
                  className="p-3 bg-military-50 rounded-lg border border-military-200"
                >
                  <p className="font-medium text-military-900 mb-2">
                    {squad.name} - {squad.slots.length} slots
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {squad.slots
                      .sort((a, b) => a.order - b.order)
                      .map((slot) => (
                        <div
                          key={slot.id}
                          className="text-xs px-2 py-1 bg-white rounded border border-military-200"
                        >
                          {slot.role}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
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