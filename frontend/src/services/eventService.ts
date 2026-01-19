import { api } from './api';
import type { ApiResponse, Event, CreateEventForm } from '../types';

export const eventService = {
  // Obtener todos los eventos
  getAll: async (filters?: {
    status?: string;
    gameType?: string;
    upcoming?: boolean;
  }): Promise<{ events: Event[]; count: number }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.gameType) params.append('gameType', filters.gameType);
    if (filters?.upcoming) params.append('upcoming', 'true');

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

  // Editar evento
  update: async (
    id: string,
    data: Partial<CreateEventForm>
  ): Promise<{ event: Event }> => {
    const response = await api.put<ApiResponse<{ event: Event }>>(`/events/${id}`, data);
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
};