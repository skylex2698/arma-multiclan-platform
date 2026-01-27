import { api } from './api';
import type { ApiResponse, Event, CreateEventForm } from '../types';
import type { GameType } from '../types';

export const eventService = {
  // Obtener todos los eventos
  getAll: async (filters?: {
    status?: string;
    gameType?: string;
    upcoming?: boolean;
    includeAll?: boolean;
  }): Promise<{ events: Event[]; count: number }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.gameType) params.append('gameType', filters.gameType);
    if (filters?.upcoming) params.append('upcoming', 'true');
    if (filters?.includeAll) params.append('includeAll', 'true');

    const response = await api.get<ApiResponse<{ events: Event[]; count: number }>>(
      `/events?${params.toString()}`
    );
    return response.data.data;
  },

  // Obtener evento por ID
  getById: async (id: string): Promise<{ event: Event }> => {
    const response = await api.get<ApiResponse<{ event: Event }>>(`/events/${id}`);
    return response.data.data;
  },

  // Crear evento
  create: async (data: CreateEventForm): Promise<{ event: Event }> => {
    const response = await api.post<ApiResponse<{ event: Event }>>('/events', data);
    return response.data.data;
  },

  // Crear evento desde plantilla
  createFromTemplate: async (data: {
    templateEventId: string;
    name: string;
    description?: string;
    briefing?: string;
    scheduledDate: Date;
  }): Promise<{ event: Event }> => {
    const response = await api.post<ApiResponse<{ event: Event }>>(
      '/events/from-template',
      data
    );
    return response.data.data;
  },

  // Actualizar evento
  update: async (
    id: string,
    data: {
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
    }
  ): Promise<{ event: Event }> => {
    const response = await api.put<ApiResponse<{ event: Event }>>(
      `/events/${id}`,
      data
    );
    return response.data.data;
  },

  // Cambiar estado
  changeStatus: async (
    id: string,
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<{ event: Event }> => {
    const response = await api.put<ApiResponse<{ event: Event }>>(
      `/events/${id}/status`,
      { status }
    );
    return response.data.data;
  },

  // Eliminar evento
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  // Subir archivo de briefing (PDF)
  uploadBriefingFile: async (
    eventId: string,
    file: File
  ): Promise<{ event: Event; briefingFileUrl: string }> => {
    const formData = new FormData();
    formData.append('briefingFile', file);

    const response = await api.post<
      ApiResponse<{ event: Event; briefingFileUrl: string }>
    >(`/events/${eventId}/briefing-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Subir archivo de modset (HTML)
  uploadModsetFile: async (
    eventId: string,
    file: File
  ): Promise<{ event: Event; modsetFileUrl: string }> => {
    const formData = new FormData();
    formData.append('modsetFile', file);

    const response = await api.post<
      ApiResponse<{ event: Event; modsetFileUrl: string }>
    >(`/events/${eventId}/modset-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Eliminar archivo de briefing
  deleteBriefingFile: async (eventId: string): Promise<void> => {
    await api.delete(`/events/${eventId}/briefing-file`);
  },

  // Eliminar archivo de modset
  deleteModsetFile: async (eventId: string): Promise<void> => {
    await api.delete(`/events/${eventId}/modset-file`);
  },
};