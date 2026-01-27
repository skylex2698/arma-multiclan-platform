import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../services/eventService';
import type { CreateEventForm } from '../types';
import type { GameType } from '../types';

export function useEvents(filters?: {
  status?: string;
  gameType?: string;
  upcoming?: boolean;
  includeAll?: boolean;
}) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventService.getAll(filters),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getById(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventForm) => eventService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name?: string;
      description?: string;
      briefing?: string;
      gameType?: GameType;
      scheduledDate?: Date;
      squads?: Array<{
        id?: string;
        name: string;
        order: number;
        slots: Array<{
          id?: string;
          role: string;
          order: number;
        }>;
      }>;
    }) => eventService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useCreateEventFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      templateEventId: string;
      name: string;
      description?: string;
      briefing?: string;
      scheduledDate: Date;
    }) => eventService.createFromTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}