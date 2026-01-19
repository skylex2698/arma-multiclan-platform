import { api } from './api';
import type { ApiResponse, Clan, User } from '../types';

export const clanService = {
  // Obtener todos los clanes
  getAll: async (): Promise<{ clans: Clan[]; count: number }> => {
    const response = await api.get<ApiResponse<{ clans: Clan[]; count: number }>>(
      '/clans'
    );
    return response.data.data;
  },

  // Obtener clan por ID
  getById: async (id: string): Promise<{ clan: Clan }> => {
    const response = await api.get<ApiResponse<{ clan: Clan }>>(`/clans/${id}`);
    return response.data.data;
  },

  // Obtener miembros de un clan
  getMembers: async (id: string): Promise<{ members: User[]; count: number }> => {
    const response = await api.get<
      ApiResponse<{ members: User[]; count: number }>
    >(`/clans/${id}/members`);
    return response.data.data;
  },

  // Crear clan (Admin)
  create: async (data: {
    name: string;
    tag?: string;
    description?: string;
  }): Promise<{ clan: Clan }> => {
    const response = await api.post<ApiResponse<{ clan: Clan }>>('/clans', data);
    return response.data.data;
  },

  // Editar clan (Admin)
  update: async (
    id: string,
    data: {
      name?: string;
      tag?: string;
      description?: string;
    }
  ): Promise<{ clan: Clan }> => {
    const response = await api.put<ApiResponse<{ clan: Clan }>>(
      `/clans/${id}`,
      data
    );
    return response.data.data;
  },

  // Eliminar clan (Admin)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/clans/${id}`);
  },
};