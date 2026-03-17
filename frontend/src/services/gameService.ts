import { api } from './api';
import type { ApiResponse, Game, GameIdentity, GameIdentityProviderKind, GameIdentityStatus } from '../types';

export const gameService = {
  getAll: async (filters?: { includeInactive?: boolean }): Promise<{ games: Game[] }> => {
    const params = new URLSearchParams();
    if (filters?.includeInactive) {
      params.append('includeInactive', 'true');
    }

    const response = await api.get<ApiResponse<{ games: Game[] }>>(`/games?${params.toString()}`);
    return response.data.data;
  },

  create: async (data: {
    slug?: string;
    name: string;
    status?: 'ACTIVE' | 'INACTIVE';
    supportsModsetHtml?: boolean;
    identityMode?: 'STEAM64' | 'MANUAL' | 'NONE';
    identityLabel?: string;
    sortOrder?: number;
  }): Promise<{ game: Game }> => {
    const response = await api.post<ApiResponse<{ game: Game }>>('/games', data);
    return response.data.data;
  },

  update: async (
    id: string,
    data: {
      slug?: string;
      name?: string;
      status?: 'ACTIVE' | 'INACTIVE';
      supportsModsetHtml?: boolean;
      identityMode?: 'STEAM64' | 'MANUAL' | 'NONE';
      identityLabel?: string;
      sortOrder?: number;
    }
  ): Promise<{ game: Game }> => {
    const response = await api.put<ApiResponse<{ game: Game }>>(`/games/${id}`, data);
    return response.data.data;
  },

  delete: async (
    id: string
  ): Promise<{ game: Pick<Game, 'id' | 'name'> & { deletedIdentities?: number } }> => {
    const response = await api.delete<
      ApiResponse<{ game: Pick<Game, 'id' | 'name'> & { deletedIdentities?: number } }>
    >(
      `/games/${id}`
    );
    return response.data.data;
  },

  getCurrentUserIdentities: async (): Promise<{ identities: GameIdentity[] }> => {
    const response = await api.get<ApiResponse<{ identities: GameIdentity[] }>>(
      '/users/profile/game-identities'
    );
    return response.data.data;
  },

  upsertCurrentUserIdentity: async (
    gameId: string,
    data: { providerKind?: GameIdentityProviderKind; value: string }
  ): Promise<{ identity: GameIdentity }> => {
    const response = await api.put<ApiResponse<{ identity: GameIdentity }>>(
      `/users/profile/game-identities/${gameId}`,
      data
    );
    return response.data.data;
  },

  updateIdentityStatus: async (
    identityId: string,
    status: GameIdentityStatus
  ): Promise<{ identity: GameIdentity }> => {
    const response = await api.patch<ApiResponse<{ identity: GameIdentity }>>(
      `/users/game-identities/${identityId}/status`,
      { status }
    );
    return response.data.data;
  },
};
