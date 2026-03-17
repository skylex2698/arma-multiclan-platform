import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../services/eventService';
import type { CreateEventForm } from '../types';

export function useEvents(filters?: {
  status?: string;
  gameId?: string;
  upcoming?: boolean;
  includeAll?: boolean;
  deleted?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventService.getAll(filters),
  });
}

export function useEvent(id: string, filters?: { deleted?: boolean }) {
  return useQuery({
    queryKey: ['event', id, filters],
    queryFn: () => eventService.getById(id, filters),
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
      gameId?: string;
      scheduledDate?: Date;
      timezone?: string;
      visibility?: 'PUBLIC' | 'PRIVATE';
      invitedClanIds?: string[];
      serverName?: string;
      serverIp?: string;
      serverPort?: string;
      serverPassword?: string;
      squads?: Array<{
        id?: string;
        name: string;
        order: number;
        frequency?: string;
        isCommand?: boolean;
        parentSquadId?: string;
        parentFrequency?: string;
        reservedForClanId?: string | null;
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

export function useRestoreEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useChangeEventStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE') => eventService.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
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
      timezone?: string;
    }) => eventService.createFromTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Subir archivo de briefing
export function useUploadBriefingFile(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => eventService.uploadBriefingFile(eventId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Subir archivo de modset
export function useUploadModsetFile(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => eventService.uploadModsetFile(eventId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Eliminar archivo de briefing
export function useDeleteBriefingFile(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => eventService.deleteBriefingFile(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Eliminar archivo de modset
export function useDeleteModsetFile(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => eventService.deleteModsetFile(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Obtener evento público por token
export function usePublicEvent(token: string) {
  return useQuery({
    queryKey: ['public-event', token],
    queryFn: () => eventService.getPublicEvent(token),
    enabled: !!token,
  });
}

// Generar token de link público
export function useGenerateShareToken() {
  return useMutation({
    mutationFn: (eventId: string) => eventService.generateShareToken(eventId),
  });
}

export function useDownloadEventSlotlist() {
  return useMutation({
    mutationFn: (eventId: string) => eventService.getSlotlist(eventId),
  });
}

export function useDownloadEventWhitelist() {
  return useMutation({
    mutationFn: (eventId: string) => eventService.getWhitelistTxt(eventId),
  });
}
