import { useQuery } from '@tanstack/react-query';
import { api } from './api';

// Types
interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  email?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Query hooks

export function useDiscordMe() {
  return useQuery<ApiResponse<{ discordUser: DiscordUser }>>({
    queryKey: ['discord', 'me'],
    queryFn: async () => {
      const response = await api.get('/discord/me');
      return response.data;
    },
    retry: false,
  });
}

export function useDiscordConnections() {
  return useQuery<ApiResponse<{ connections: any[] }>>({
    queryKey: ['discord', 'connections'],
    queryFn: async () => {
      const response = await api.get('/discord/me/connections');
      return response.data;
    },
    retry: false,
  });
}

export function useDiscordGuilds() {
  return useQuery<ApiResponse<{ guilds: any[] }>>({
    queryKey: ['discord', 'guilds'],
    queryFn: async () => {
      const response = await api.get('/discord/me/guilds');
      return response.data;
    },
    retry: false,
  });
}
