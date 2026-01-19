import { useMutation, useQueryClient } from '@tanstack/react-query';
import { slotService } from '../services/slotService';

export function useAssignSlot(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slotId: string) => slotService.assign(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}

export function useUnassignSlot(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slotId: string) => slotService.unassign(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}

export function useAdminAssignSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slotId, userId }: { slotId: string; userId: string }) =>
      slotService.adminAssign(slotId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
    },
  });
}