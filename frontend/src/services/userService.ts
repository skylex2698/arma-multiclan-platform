import { api } from './api';
import type { ApiResponse, User, ClanChangeRequest } from '../types';

export const userService = {
  // Obtener todos los usuarios
  getAll: async (filters?: {
    clanId?: string;
    role?: string;
    status?: string;
  }): Promise<{ users: User[]; count: number }> => {
    const params = new URLSearchParams();
    if (filters?.clanId) params.append('clanId', filters.clanId);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get<ApiResponse<{ users: User[]; count: number }>>(
      `/users?${params.toString()}`
    );
    return response.data.data;
  },

  // Obtener usuario por ID
  getById: async (id: string): Promise<{ user: User }> => {
    const response = await api.get<ApiResponse<{ user: User }>>(`/users/${id}`);
    return response.data.data;
  },

  // Validar usuario (cambiar de PENDING a ACTIVE)
  validate: async (id: string): Promise<{ user: User }> => {
    const response = await api.post<ApiResponse<{ user: User }>>(
      `/users/${id}/validate`
    );
    return response.data.data;
  },

  // Cambiar rol
  changeRole: async (
    id: string,
    role: 'USER' | 'CLAN_LEADER' | 'ADMIN'
  ): Promise<{ user: User }> => {
    const response = await api.put<ApiResponse<{ user: User }>>(
      `/users/${id}/role`,
      { role }
    );
    return response.data.data;
  },

  // Cambiar estado
  changeStatus: async (
    id: string,
    status: 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'BANNED' | 'INACTIVE'
  ): Promise<{ user: User }> => {
    const response = await api.put<ApiResponse<{ user: User }>>(
      `/users/${id}/status`,
      { status }
    );
    return response.data.data;
  },

  // Cambiar clan
  changeClan: async (id: string, clanId: string | null): Promise<{ user: User }> => {
    const response = await api.put<ApiResponse<{ user: User }>>(
      `/users/${id}/clan`,
      { clanId }
    );
    return response.data.data;
  },

  // Obtener solicitudes de cambio de clan
  getClanChangeRequests: async (filters?: {
    status?: string;
  }): Promise<{ requests: ClanChangeRequest[]; count: number }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get<
      ApiResponse<{ requests: ClanChangeRequest[]; count: number }>
    >(`/users/clan-change-requests?${params.toString()}`);
    return response.data.data;
  },

  // Aprobar/rechazar solicitud de cambio de clan
  reviewClanChangeRequest: async (
    id: string,
    approved: boolean
  ): Promise<{ request: ClanChangeRequest }> => {
    const response = await api.post<ApiResponse<{ request: ClanChangeRequest }>>(
      `/users/clan-change-requests/${id}/review`,
      { approved }
    );
    return response.data.data;
  },

  // Actualizar perfil
  updateProfile: async (data: {
    nickname?: string;
    email?: string;
  }): Promise<{ user: User }> => {
    const response = await api.put<ApiResponse<{ user: User }>>(
      '/users/profile',
      data
    );
    return response.data.data;
  },

  // Cambiar contraseña
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await api.put('/users/change-password', data);
  },
};