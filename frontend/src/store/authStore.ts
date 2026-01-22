import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        // Solo guardar token en localStorage si existe (backwards compatibility)
        // Para login con Discord, token será "" (vacío) porque se usa cookie httpOnly
        if (token) {
          localStorage.setItem('token', token);
        }
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        try {
          // Llamar al endpoint de logout para limpiar cookie del servidor
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Error al hacer logout:', error);
        } finally {
          // Limpiar localStorage y estado local
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      updateUser: (user) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);