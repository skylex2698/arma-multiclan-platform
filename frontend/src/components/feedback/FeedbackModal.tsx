import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, Lightbulb, Send, X } from 'lucide-react';
import { useCreateFeedback } from '../../hooks/useFeedback';
import type { FeedbackType } from '../../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: FeedbackType;
}

const TITLE_LIMIT = 120;
const DESCRIPTION_LIMIT = 2000;

const FEEDBACK_TYPE_OPTIONS: Array<{
  value: FeedbackType;
  label: string;
  description: string;
  icon: typeof AlertCircle;
}> = [
  {
    value: 'BUG',
    label: 'Reportar bug',
    description: 'Algo no funciona como debería.',
    icon: AlertCircle,
  },
  {
    value: 'SUGGESTION',
    label: 'Enviar sugerencia',
    description: 'Una mejora de flujo, interfaz o funcionamiento.',
    icon: Lightbulb,
  },
];

export function FeedbackModal({
  isOpen,
  onClose,
  initialType = 'BUG',
}: FeedbackModalProps) {
  const location = useLocation();
  const createFeedback = useCreateFeedback();
  const [type, setType] = useState<FeedbackType>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setType(initialType);
      setTitle('');
      setDescription('');
      setError('');
      setSuccess('');
    }
  }, [initialType, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
    }
  }, [initialType, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    if (!normalizedTitle) {
      setError('El titulo es obligatorio.');
      return;
    }

    if (!normalizedDescription) {
      setError('La descripcion es obligatoria.');
      return;
    }

    try {
      await createFeedback.mutateAsync({
        type,
        title: normalizedTitle,
        description: normalizedDescription,
        pagePath: `${location.pathname}${location.search}`,
      });
      setSuccess('Mensaje enviado al equipo de gestión de la plataforma.');
      setTitle('');
      setDescription('');
      setType('BUG');
    } catch (submissionError) {
      const apiError = submissionError as {
        response?: { data?: { message?: string } };
      };
      setError(apiError.response?.data?.message || 'No se pudo enviar el mensaje.');
    }
  };

  const isProblem = type === 'BUG';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-military-950/55 px-4 py-6 backdrop-blur-[2px]">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-military-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 border-b border-military-200 px-5 py-4 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-military-950 dark:text-gray-100">
              {isProblem ? 'Informar de un problema' : 'Proponer una mejora'}
            </h2>
            <p className="mt-1 text-sm text-military-600 dark:text-gray-400">
              El mensaje llegará solo al administrador de la plataforma.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
          <div className="rounded-xl border border-military-200 bg-military-50/70 px-4 py-4 dark:border-gray-700 dark:bg-gray-800/70">
            {FEEDBACK_TYPE_OPTIONS.filter((option) => option.value === type).map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white dark:bg-tactical-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-military-900 dark:text-gray-100">
                      {option.label}
                    </p>
                    <p className="mt-1 text-xs text-military-600 dark:text-gray-400">
                      {option.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label htmlFor="feedback-title" className="field-label">
              Titulo
            </label>
            <input
              id="feedback-title"
              value={title}
              maxLength={TITLE_LIMIT}
              onChange={(event) => setTitle(event.target.value)}
              className="input"
              placeholder={
                isProblem
                  ? 'Resumen breve del problema detectado'
                  : 'Resumen breve de la mejora propuesta'
              }
            />
            <p className="field-help text-right">{title.length}/{TITLE_LIMIT}</p>
          </div>

          <div>
            <label htmlFor="feedback-description" className="field-label">
              Descripcion
            </label>
            <textarea
              id="feedback-description"
              value={description}
              maxLength={DESCRIPTION_LIMIT}
              onChange={(event) => setDescription(event.target.value)}
              className="input min-h-[160px] resize-y"
              placeholder={
                isProblem
                  ? 'Describe qué ha pasado, dónde ocurrió y qué esperabas que sucediera.'
                  : 'Explica qué mejorarías y por qué sería útil.'
              }
            />
            <p className="field-help text-right">
              {description.length}/{DESCRIPTION_LIMIT}
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/70 dark:bg-green-950/40 dark:text-green-200">
              {success}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-military-200 pt-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-military-500 dark:text-gray-400">
              Ruta actual: {location.pathname}
              {location.search}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn btn-outline">
                Cerrar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createFeedback.isPending}
              >
                <Send className="h-4 w-4" />
                {createFeedback.isPending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
