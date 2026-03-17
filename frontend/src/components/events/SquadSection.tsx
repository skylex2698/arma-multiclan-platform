import { useState } from 'react';
import { ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { SlotItem } from './SlotItem';
import type { Squad, User, Clan } from '../../types';

interface SquadSectionProps {
  squad: Squad;
  onAssignSlot: (slotId: string) => void;
  onUnassignSlot: (slotId: string) => void;
  onAdminAssign?: (slotId: string, userId: string) => void;
  onAdminUnassign?: (slotId: string) => void;
  onCreateExternal?: (slotId: string, nickname: string) => void;
  isLoading: boolean;
  eventStatus: 'ACTIVE' | 'INACTIVE' | 'FINISHED';
  availableUsers?: User[];
  getUserSlotInfo?: (userId: string) => {
    hasSlot: boolean;
    squadName?: string;
    slotRole?: string;
  };
  canEditEvent?: boolean;
  canManageReservation?: boolean;
  availableClans?: Clan[];
  onReserveSquad?: (squadId: string, clanId: string | null) => void;
  directReserveClanId?: string | null;
  defaultExpanded?: boolean;
}

export function SquadSection({
  squad,
  onAssignSlot,
  onUnassignSlot,
  onAdminAssign,
  onAdminUnassign,
  onCreateExternal,
  isLoading,
  eventStatus,
  availableUsers = [],
  getUserSlotInfo,
  canEditEvent = false,
  canManageReservation = false,
  availableClans = [],
  onReserveSquad,
  directReserveClanId = null,
  defaultExpanded = false,
}: SquadSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [selectedClanId, setSelectedClanId] = useState('');

  const occupiedSlots = squad.slots.filter((slot) => slot.status === 'OCCUPIED')
    .length;
  const canDirectReserve = Boolean(directReserveClanId);

  const handleReserveClan = () => {
    if (!selectedClanId || !onReserveSquad) return;
    onReserveSquad(squad.id, selectedClanId);
    setSelectedClanId('');
    setShowReservationForm(false);
  };

  const handleRemoveReservation = () => {
    if (!onReserveSquad) return;
    onReserveSquad(squad.id, null);
    setShowReservationForm(false);
  };

  const handleReserveOwnClan = () => {
    if (!onReserveSquad || !directReserveClanId) return;
    onReserveSquad(squad.id, directReserveClanId);
    setShowReservationForm(false);
  };

  return (
    <section className="overflow-hidden rounded-md border border-military-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-start md:justify-between">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span className="mt-0.5 text-military-500 dark:text-gray-400">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words text-sm font-semibold text-military-900 dark:text-gray-100">
                {squad.name}
              </h3>
              {squad.isCommand && <span className="section-caption">Mando</span>}
            </div>

            <div className="meta-inline mt-1">
              <span>
                {occupiedSlots}/{squad.slots.length} slots
              </span>
              {squad.frequency && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Interna {squad.frequency}</span>
                </>
              )}
              {squad.parentSquad?.name && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Reporta a {squad.parentSquad.name}</span>
                </>
              )}
              {squad.reservedForClan && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Reservada para{' '}
                    <strong>
                      {squad.reservedForClan.tag
                        ? `${squad.reservedForClan.tag} `
                        : ''}
                      {squad.reservedForClan.name}
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </button>

        {canEditEvent && canManageReservation && eventStatus === 'ACTIVE' && onReserveSquad && (
          <div className="flex items-center gap-2">
            {!squad.reservedForClanId && (
              <button
                type="button"
                onClick={() => {
                  if (canDirectReserve) {
                    handleReserveOwnClan();
                    return;
                  }

                  setExpanded(true);
                  setShowReservationForm((current) => !current);
                }}
                className="btn btn-outline btn-sm"
                disabled={isLoading}
              >
                <Shield className="h-4 w-4" />
                Reservar
              </button>
            )}

            {squad.reservedForClanId && (
              <button
                type="button"
                onClick={handleRemoveReservation}
                className="btn btn-outline btn-sm"
                disabled={isLoading}
              >
                Quitar reserva
              </button>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="subtle-divider px-4 py-3">
          {showReservationForm &&
            canManageReservation &&
            !canDirectReserve &&
            !squad.reservedForClanId &&
            onReserveSquad && (
            <div className="mb-4 grid gap-2 rounded-md border border-military-200 bg-military-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/40 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
              <div>
                <label className="field-label">Reservar para clan</label>
                <select
                  value={selectedClanId}
                  onChange={(e) => setSelectedClanId(e.target.value)}
                  className="input"
                >
                  <option value="">Selecciona un clan</option>
                  {availableClans.map((clan) => (
                    <option key={clan.id} value={clan.id}>
                      {clan.tag ? `[${clan.tag}] ` : ''}
                      {clan.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleReserveClan}
                className="btn btn-primary"
                disabled={isLoading || !selectedClanId}
              >
                Guardar
              </button>

              <button
                type="button"
                onClick={() => setShowReservationForm(false)}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>
          )}

          <div className="space-y-2">
            {squad.slots
              .sort((a, b) => a.order - b.order)
              .map((slot) => (
                <SlotItem
                  key={slot.id}
                  slot={slot}
                  onAssign={onAssignSlot}
                  onUnassign={onUnassignSlot}
                  onAdminAssign={onAdminAssign}
                  onAdminUnassign={onAdminUnassign}
                  onCreateExternal={onCreateExternal}
                  isLoading={isLoading}
                  eventStatus={eventStatus}
                  availableUsers={availableUsers}
                  getUserSlotInfo={getUserSlotInfo}
                  squadReservedForClanId={squad.reservedForClanId}
                />
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
