import { api } from './api';
import type { ApiResponse, Clan, ClanNotionIntegration, NotionSyncMode, User } from '../types';

export const sanitizeClanTag = (tag?: string | null) => {
  if (!tag) {
    return '';
  }

  return tag.replace(/[\[\]\(\)\{\}]/g, '').trim().toUpperCase();
};

export const clanService = {
  // Obtener todos los clanes
  getAll: async (filters?: { deleted?: boolean }): Promise<{ clans: Clan[]; count: number }> => {
    const params = new URLSearchParams();
    if (filters?.deleted) params.append('deleted', 'true');
    const response = await api.get<ApiResponse<{ clans: Clan[]; count: number }>>(
      `/clans?${params.toString()}`
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
    avatarUrl?: string;
    primaryGameId: string;
  }): Promise<{ clan: Clan }> => {
    const response = await api.post<ApiResponse<{ clan: Clan }>>('/clans', {
      ...data,
      tag: sanitizeClanTag(data.tag) || undefined,
    });
    return response.data.data;
  },

  // Editar clan (Admin)
  update: async (
    id: string,
    data: {
      name?: string;
      tag?: string;
      description?: string;
      avatarUrl?: string;
      primaryGameId?: string;
    }
  ): Promise<{ clan: Clan }> => {
    const response = await api.put<ApiResponse<{ clan: Clan }>>(
      `/clans/${id}`,
      {
        ...data,
        ...(data.tag !== undefined ? { tag: sanitizeClanTag(data.tag) || undefined } : {}),
      }
    );
    return response.data.data;
  },

  // Eliminar clan (Admin)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/clans/${id}`);
  },

  // Restaurar clan eliminado (Admin)
  restore: async (id: string): Promise<{ clan: Clan }> => {
    const response = await api.patch<ApiResponse<{ clan: Clan }>>(`/clans/${id}/restore`);
    return response.data.data;
  },

  // Subir avatar
  uploadAvatar: async (id: string, file: File): Promise<{ clan: Clan; avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post<ApiResponse<{ clan: Clan; avatarUrl: string }>>(
      `/clans/${id}/avatar`,
      formData
    );
    return response.data.data;
  },

  // Eliminar avatar
  deleteAvatar: async (id: string): Promise<{ clan: Clan }> => {
    const response = await api.delete<ApiResponse<{ clan: Clan }>>(
      `/clans/${id}/avatar`
    );
    return response.data.data;
  },

  getNotionIntegration: async (id: string): Promise<{ integration: ClanNotionIntegration }> => {
    const response = await api.get<ApiResponse<{ integration: ClanNotionIntegration }>>(
      `/clans/${id}/notion`
    );
    return response.data.data;
  },

  saveNotionIntegration: async (
    id: string,
    data: {
      enabled: boolean;
      token?: string;
      parentPageId?: string;
      syncMode: NotionSyncMode;
    }
  ): Promise<{ integration: ClanNotionIntegration }> => {
    const response = await api.put<ApiResponse<{ integration: ClanNotionIntegration }>>(
      `/clans/${id}/notion`,
      data
    );
    return response.data.data;
  },

  testNotionConnection: async (
    id: string,
    payload?: { token?: string; parentPageId?: string }
  ): Promise<{
    ok: boolean;
    botName: string;
    botId: string | null;
    workspaceName: string | null;
    parentPageValidated: boolean;
  }> => {
    const response = await api.post<
      ApiResponse<{
        ok: boolean;
        botName: string;
        botId: string | null;
        workspaceName: string | null;
        parentPageValidated: boolean;
      }>
    >(`/clans/${id}/notion/test`, payload || {});
    return response.data.data;
  },
};
