import { api } from './api';
import type { ApiResponse, Slot } from '../types';

export const slotService = {
  // Apuntarse a un slot
  assign: async (slotId: string, userId?: string): Promise<{ slot: Slot }> => {
    const response = await api.post<ApiResponse<{ slot: Slot }>>(
      `/slots/${slotId}/assign`,
      userId ? { userId } : {}
    );
    return response.data.data;
  },

  // Desapuntarse
  unassign: async (slotId: string): Promise<{ slot: Slot }> => {
    const response = await api.post<ApiResponse<{ slot: Slot }>>(
      `/slots/${slotId}/unassign`
    );
    return response.data.data;
  },

  // Marcar ausencia
  markAbsence: async (
    eventId: string,
    reason?: string
  ): Promise<{ absence: unknown; slotFreed: boolean }> => {
    const response = await api.post<
      ApiResponse<{ absence: unknown; slotFreed: boolean }>
    >(`/events/${eventId}/absence`, { reason });
    return response.data.data;
  },

  // Asignar slot por admin/líder
  adminAssign: async (slotId: string, userId: string): Promise<{ slot: Slot }> => {
    const response = await api.post<ApiResponse<{ slot: Slot }>>(
      `/slots/${slotId}/admin-assign`,
      { userId }
    );
    return response.data.data;
  },
};