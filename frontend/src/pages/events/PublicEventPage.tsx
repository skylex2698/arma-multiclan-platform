import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Shield,
  UserPlus,
  FileText,
  Package,
  ExternalLink,
  Download,
  Radio,
} from 'lucide-react';
import { usePublicEvent } from '../../hooks/useEvents';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { AutomaticCommunicationChart } from '../../components/events/AutomaticCommunicationChart';
import { useState } from 'react';
import type { Squad, Slot } from '../../types';
import {
  formatDateInTimezone,
  formatTimeInTimezone,
  getTimezoneShortName,
  getUserTimezone,
} from '../../utils/eventTime';
import { getAssetUrl } from '../../utils/url';

type PublicTabType = 'briefing' | 'slots' | 'communications';

export default function PublicEventPage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = usePublicEvent(token!);
  const [activeTab, setActiveTab] = useState<PublicTabType>('briefing');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data?.event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Evento no encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            El link puede haber expirado o el evento no existe.
          </p>
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  const event = data.event;
  const eventTimezone = event.timezone || 'UTC';
  const userTimezone = getUserTimezone();
  const eventDateLabel = formatDateInTimezone(event.scheduledDate, eventTimezone);
  const eventTimeLabel = formatTimeInTimezone(event.scheduledDate, eventTimezone);
  const eventShortTimezone = getTimezoneShortName(
    event.scheduledDate,
    eventTimezone
  );
  const localDateLabel = formatDateInTimezone(event.scheduledDate, userTimezone);
  const localTimeLabel = formatTimeInTimezone(event.scheduledDate, userTimezone);
  const localShortTimezone = getTimezoneShortName(
    event.scheduledDate,
    userTimezone
  );
  const showLocalSchedule = userTimezone !== eventTimezone;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header minimalista */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-military-900 dark:text-gray-100">
            Arma Multiclan Platform
          </h2>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header del evento */}
        <Card className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-military-900 dark:text-gray-100 mb-2">
                {event.name}
              </h1>
              {event.description && (
                <p className="text-military-600 dark:text-gray-400">
                  {event.description}
                </p>
              )}
            </div>
            <Badge
              variant={
                event.status === 'ACTIVE'
                  ? 'success'
                  : event.status === 'FINISHED'
                    ? 'default'
                    : 'warning'
              }
            >
              {event.status === 'ACTIVE'
                ? 'Activo'
                : event.status === 'FINISHED'
                  ? 'Finalizado'
                  : 'Inactivo'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center text-military-600 dark:text-gray-400">
              <Calendar className="h-5 w-5 mr-3" />
              <div>
                <p className="text-xs text-military-500 dark:text-gray-500">
                  Fecha
                </p>
                <p className="font-medium text-military-900 dark:text-gray-100">
                  {eventDateLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center text-military-600 dark:text-gray-400">
              <Clock className="h-5 w-5 mr-3" />
              <div>
                <p className="text-xs text-military-500 dark:text-gray-500">
                  Hora del evento
                </p>
                <p className="font-medium text-military-900 dark:text-gray-100">
                  {eventTimeLabel} {eventShortTimezone}
                </p>
                <p className="text-xs text-military-500 dark:text-gray-500">
                  {eventTimezone}
                </p>
              </div>
            </div>

            {showLocalSchedule && (
              <div className="flex items-center text-military-600 dark:text-gray-400">
                <Clock className="h-5 w-5 mr-3" />
                <div>
                  <p className="text-xs text-military-500 dark:text-gray-500">
                    Tu hora local
                  </p>
                  <p className="font-medium text-military-900 dark:text-gray-100">
                    {localTimeLabel} {localShortTimezone}
                  </p>
                  <p className="text-xs text-military-500 dark:text-gray-500">
                    {localDateLabel}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center text-military-600 dark:text-gray-400">
              <MapPin className="h-5 w-5 mr-3" />
              <div>
                <p className="text-xs text-military-500 dark:text-gray-500">
                  Juego
                </p>
                <p className="font-medium text-military-900 dark:text-gray-100">
                  {event.game.name}
                </p>
              </div>
            </div>
          </div>

          {event.creator && (
            <div className="flex items-center text-sm text-military-600 dark:text-gray-400 pt-4 border-t border-military-200 dark:border-gray-700">
              <User className="h-4 w-4 mr-2" />
              <span>
                Creado por{' '}
                <span className="font-medium text-military-900 dark:text-gray-100">
                  {event.creator.clan?.tag && `${event.creator.clan.tag} `}
                  {event.creator.nickname}
                </span>
              </span>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-military-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-military-600 dark:text-gray-400">
                {event.occupiedSlots}/{event.totalSlots} slots ocupados
              </span>
              <div className="w-48 bg-military-200 dark:bg-gray-600 rounded-full h-2">
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

        {/* Pestanas */}
        <div className="mb-6">
          <div className="border-b border-military-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('briefing')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === 'briefing'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-military-500 dark:text-gray-400 hover:text-military-700 dark:hover:text-gray-300 hover:border-military-300'
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
                      : 'border-transparent text-military-500 dark:text-gray-400 hover:text-military-700 dark:hover:text-gray-300 hover:border-military-300'
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
                      : 'border-transparent text-military-500 dark:text-gray-400 hover:text-military-700 dark:hover:text-gray-300 hover:border-military-300'
                  }
                `}
              >
                <Radio className="h-4 w-4" />
                Comunicaciones
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido de las pestanas */}
        {activeTab === 'briefing' && (
          <div className="space-y-6">
            {/* Archivos del evento */}
            {(event.briefingFileUrl || event.modsetFileUrl) && (
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="section-title">Archivos del evento</h2>
                  </div>
                </div>

                <div className="divide-y divide-military-200 dark:divide-gray-700">
                  {event.briefingFileUrl && (
                    <div className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <FileText className="h-4 w-4 shrink-0 text-red-500" />
                          <h3 className="font-semibold text-military-900 dark:text-gray-100">
                            Briefing PDF
                          </h3>
                          <span className="section-caption">Disponible</span>
                        </div>
                      </div>

                      <div className="flex min-h-11 flex-wrap items-center gap-2">
                        <a
                          href={getAssetUrl(event.briefingFileUrl) || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Abrir
                        </a>
                        <a
                          href={getAssetUrl(event.briefingFileUrl) || undefined}
                          download
                          className="toolbar-link"
                        >
                          Descargar
                        </a>
                      </div>
                    </div>
                  )}

                  {event.modsetFileUrl && (
                    <div className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <Package className="h-4 w-4 shrink-0 text-blue-500" />
                          <h3 className="font-semibold text-military-900 dark:text-gray-100">
                            Modset HTML
                          </h3>
                          <span className="section-caption">Disponible</span>
                        </div>
                      </div>

                      <div className="flex min-h-11 flex-wrap items-center gap-2">
                        <a
                          href={getAssetUrl(event.modsetFileUrl) || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Abrir
                        </a>
                        <a
                          href={getAssetUrl(event.modsetFileUrl) || undefined}
                          download
                          className="toolbar-link"
                        >
                          Descargar
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Contenido del briefing */}
            <Card>
              {event.briefing ? (
                <>
                  <h2 className="text-xl font-bold text-military-900 dark:text-gray-100 mb-4">
                    Briefing
                  </h2>
                  <div
                    className="briefing-content p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                    dangerouslySetInnerHTML={{ __html: event.briefing }}
                  />
                </>
              ) : (
                <p className="text-military-500 dark:text-gray-400 text-center py-8">
                  No hay briefing de texto disponible para este evento
                </p>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'slots' && (
          <div>
            <h2 className="text-2xl font-bold text-military-900 dark:text-gray-100 mb-4">
              Escuadras y Slots
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {event.squads
                .sort((a: Squad, b: Squad) => a.order - b.order)
                .map((squad: Squad) => {
                  const occupiedSlots = squad.slots.filter(
                    (s: Slot) => s.status === 'OCCUPIED'
                  ).length;

                  return (
                    <div
                      key={squad.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary-600" />
                          <h3 className="text-lg font-bold text-military-900 dark:text-gray-100">
                            {squad.name}
                          </h3>
                        </div>
                        <span className="text-sm text-military-600 dark:text-gray-400">
                          {occupiedSlots}/{squad.slots.length} slots
                        </span>
                      </div>

                      {/* Reserva de clan */}
                      {squad.reservedForClan && (
                        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                          {squad.reservedForClan.avatarUrl ? (
                            <img
                              src={getAssetUrl(squad.reservedForClan.avatarUrl) || undefined}
                              alt={squad.reservedForClan.name}
                              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                {squad.reservedForClan.tag?.[0] ||
                                  squad.reservedForClan.name[0]}
                              </span>
                            </div>
                          )}
                          <span className="text-sm text-amber-700 dark:text-amber-300">
                            {squad.reservedForClan.tag && (
                              <span className="font-semibold">
                                {squad.reservedForClan.tag}{' '}
                              </span>
                            )}
                            {squad.reservedForClan.name}
                          </span>
                        </div>
                      )}

                      {/* Slots */}
                      <div className="space-y-2">
                        {squad.slots
                          .sort((a: Slot, b: Slot) => a.order - b.order)
                          .map((slot: Slot) => (
                            <div
                              key={slot.id}
                              className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                                slot.status === 'OCCUPIED'
                                  ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10'
                                  : 'border-military-200 dark:border-gray-600 bg-military-50/50 dark:bg-gray-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {slot.user ? (
                                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center border-2 border-primary-300 dark:border-primary-700">
                                    <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                                      {slot.user.nickname[0].toUpperCase()}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-military-100 dark:bg-gray-600 flex items-center justify-center border-2 border-military-200 dark:border-gray-500">
                                    <UserPlus className="h-5 w-5 text-military-400 dark:text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-military-900 dark:text-gray-100">
                                    {slot.role}
                                  </p>
                                  {slot.user ? (
                                    <p className="text-sm text-military-600 dark:text-gray-400">
                                      {slot.user.clan?.tag &&
                                        `${slot.user.clan.tag} `}
                                      {slot.user.nickname}
                                      {slot.user.status === 'EXTERNAL' && (
                                        <span className="ml-1 inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-600/30 dark:text-purple-300">
                                          EXT
                                        </span>
                                      )}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-military-500 dark:text-gray-500">
                                      Slot disponible
                                    </p>
                                  )}
                                </div>
                              </div>
                              {slot.status === 'OCCUPIED' ? (
                                <Badge variant="info">Ocupado</Badge>
                              ) : (
                                <Badge variant="default">Libre</Badge>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {activeTab === 'communications' && (
          <div>
            <h2 className="text-2xl font-bold text-military-900 dark:text-gray-100 mb-4">
              Plan de Comunicaciones
            </h2>
            <AutomaticCommunicationChart event={event} />
          </div>
        )}

        {/* Banner de registro */}
        <div className="mt-8 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100 mb-2">
            ¿Quieres participar?
          </h3>
          <p className="text-primary-700 dark:text-primary-300 mb-4">
            Registrate en la plataforma para apuntarte a este evento y ver mas
            detalles.
          </p>
          <Link to="/register" className="btn btn-primary">
            Registrarse
          </Link>
        </div>
      </main>
    </div>
  );
}
