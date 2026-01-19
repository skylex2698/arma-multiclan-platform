import { Users } from 'lucide-react';
import { Card } from '../ui/Card';
import { SlotItem } from './SlotItem';
import type { Squad } from '../../types';

interface SquadSectionProps {
  squad: Squad;
  onAssignSlot: (slotId: string) => void;
  onUnassignSlot: (slotId: string) => void;
  isLoading: boolean;
  eventStatus: 'ACTIVE' | 'INACTIVE';
}

export function SquadSection({
  squad,
  onAssignSlot,
  onUnassignSlot,
  isLoading,
  eventStatus,
}: SquadSectionProps) {
  const occupiedSlots = squad.slots.filter((s) => s.status === 'OCCUPIED').length;
  const totalSlots = squad.slots.length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 p-2 rounded-lg">
            <Users className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-military-900">{squad.name}</h3>
            <p className="text-sm text-military-600">
              {occupiedSlots}/{totalSlots} slots ocupados
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="w-24 bg-military-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{
                width: `${totalSlots ? (occupiedSlots / totalSlots) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
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
              isLoading={isLoading}
              eventStatus={eventStatus}
            />
          ))}
      </div>
    </Card>
  );
}