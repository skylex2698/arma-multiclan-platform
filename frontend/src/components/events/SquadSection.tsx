import { Users } from 'lucide-react';
import { Card } from '../ui/Card';
import { SlotItem } from './SlotItem';
import type { Squad, User } from '../../types';

interface SquadSectionProps {
  squad: Squad;
  onAssignSlot: (slotId: string) => void;
  onUnassignSlot: (slotId: string) => void;
  onAdminAssign?: (slotId: string, userId: string) => void;
  onAdminUnassign?: (slotId: string) => void;
  isLoading: boolean;
  eventStatus: 'ACTIVE' | 'INACTIVE' | 'FINISHED';
  availableUsers?: User[];
  getUserSlotInfo?: (userId: string) => {
    hasSlot: boolean;
    squadName?: string;
    slotRole?: string;
  };
}

export function SquadSection({
  squad,
  onAssignSlot,
  onUnassignSlot,
  onAdminAssign,
  onAdminUnassign,
  isLoading,
  eventStatus,
  availableUsers = [],
  getUserSlotInfo
}: SquadSectionProps) {
  const occupiedSlots = squad.slots.filter((slot) => slot.status === 'OCCUPIED').length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-bold text-military-900">{squad.name}</h3>
        </div>
        <span className="text-sm text-military-600">
          {occupiedSlots}/{squad.slots.length} slots
        </span>
      </div>

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
              isLoading={isLoading}
              eventStatus={eventStatus}
              availableUsers={availableUsers}
              getUserSlotInfo={getUserSlotInfo}
            />
          ))}
      </div>
    </Card>
  );
}