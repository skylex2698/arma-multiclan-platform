import { Users, Shield, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { SlotItem } from './SlotItem';
import type { Squad, User, Clan } from '../../types';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

const getBackendUrl = () =>
  import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

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
  availableClans?: Clan[];
  onReserveSquad?: (squadId: string, clanId: string | null) => void;
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
  availableClans = [],
  onReserveSquad,
}: SquadSectionProps) {
  const user = useAuthStore((state) => state.user);
  const [showClanSelector, setShowClanSelector] = useState(false);
  const occupiedSlots = squad.slots.filter((slot) => slot.status === 'OCCUPIED').length;

  const handleReserveClan = (clanId: string) => {
    if (onReserveSquad) {
      onReserveSquad(squad.id, clanId);
      setShowClanSelector(false);
    }
  };

  const handleRemoveReservation = () => {
    if (onReserveSquad) {
      onReserveSquad(squad.id, null);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-bold text-military-900 dark:text-gray-100">{squad.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-military-600 dark:text-gray-400">
            {occupiedSlots}/{squad.slots.length} slots
          </span>
          {/* Boton de reservar */}
          {canEditEvent && !squad.reservedForClanId && onReserveSquad && eventStatus === 'ACTIVE' && (
            <div className="relative">
              <button
                onClick={() => setShowClanSelector(!showClanSelector)}
                className="btn btn-outline btn-sm flex items-center gap-1 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                disabled={isLoading}
                title="Reservar para un clan"
              >
                <Shield className="h-3.5 w-3.5" />
              </button>

              {/* Dropdown de clanes */}
              {showClanSelector && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-military-300 dark:border-gray-700 rounded-lg shadow-lg w-56 max-h-64 overflow-y-auto">
                  <div className="p-2 border-b border-military-200 dark:border-gray-700 bg-military-50 dark:bg-gray-700">
                    <p className="text-xs font-medium text-military-700 dark:text-gray-300">
                      Reservar escuadra para:
                    </p>
                  </div>
                  <div className="p-1">
                    {availableClans.length === 0 ? (
                      <p className="text-sm text-military-500 dark:text-gray-400 p-2">
                        No hay clanes disponibles
                      </p>
                    ) : (
                      availableClans.map((clan) => (
                        <button
                          key={clan.id}
                          onClick={() => handleReserveClan(clan.id)}
                          className="w-full text-left px-3 py-2 hover:bg-military-50 dark:hover:bg-gray-700 rounded text-sm flex items-center gap-2"
                          disabled={isLoading}
                        >
                          {clan.avatarUrl ? (
                            <img
                              src={`${getBackendUrl()}${clan.avatarUrl}`}
                              alt={clan.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                                {clan.tag?.[0] || clan.name[0]}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-military-900 dark:text-gray-100">
                              {clan.tag && <span className="text-primary-600 dark:text-primary-400">{clan.tag} </span>}
                              {clan.name}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-military-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowClanSelector(false)}
                      className="w-full px-2 py-1 text-xs text-military-600 dark:text-gray-400 hover:text-military-900 dark:hover:text-gray-100 hover:bg-military-50 dark:hover:bg-gray-700 rounded"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Badge de reserva de clan */}
      {squad.reservedForClan && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          {squad.reservedForClan.avatarUrl ? (
            <img
              src={`${getBackendUrl()}${squad.reservedForClan.avatarUrl}`}
              alt={squad.reservedForClan.name}
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {squad.reservedForClan.tag?.[0] || squad.reservedForClan.name[0]}
              </span>
            </div>
          )}
          <span className="text-sm text-amber-700 dark:text-amber-300 flex-1">
            {squad.reservedForClan.tag && (
              <span className="font-semibold">{squad.reservedForClan.tag} </span>
            )}
            {squad.reservedForClan.name}
          </span>
          {canEditEvent && onReserveSquad && (
            <button
              onClick={handleRemoveReservation}
              className="p-0.5 rounded hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-600 dark:text-amber-400"
              disabled={isLoading}
              title="Quitar reserva"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
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
              currentUserClanId={user?.clan?.id || null}
            />
          ))}
      </div>
    </Card>
  );
}
