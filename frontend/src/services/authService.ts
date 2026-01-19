import { api } from './api';
import type { ApiResponse, AuthResponse, LoginForm, RegisterForm, User } from '../types';

export const authService = {
  login: async (data: LoginForm): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login/local', data);
    return response.data.data;
  },

  register: async (data: RegisterForm): Promise<{ user: User }> => {
    const response = await api.post<ApiResponse<{ user: User }>>('/auth/register/local', data);
    return response.data.data;
  },

  getMe: async (): Promise<AuthResponse> => {
    const response = await api.get<ApiResponse<AuthResponse>>('/auth/me');
    return response.data.data;
  },
};