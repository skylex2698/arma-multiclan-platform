import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  // El segundo parámetro (token) se mantiene por compatibilidad pero se ignora
  // La autenticación real se maneja via cookies httpOnly
  setAuth: (user: User, _token?: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  clearAuth: () => void;
}

/**
 * Store de autenticación
 *
 * SEGURIDAD: NO almacenamos tokens en el cliente.
 * La autenticación se maneja mediante cookies httpOnly que el servidor
 * establece automáticamente. Esto previene ataques XSS de robo de tokens.
 *
 * Solo almacenamos información del usuario (no sensible) para la UI.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      /**
       * Establece el usuario autenticado
       * El token se maneja via cookie httpOnly (no se almacena en el cliente)
       * El parámetro _token se mantiene por compatibilidad pero se ignora
       */
      setAuth: (user, _token?: string) => {
        // SEGURIDAD: NO almacenamos el token en localStorage
        // La autenticación se maneja via cookies httpOnly
        set({
          user,
          isAuthenticated: true,
        });
      },

      /**
       * Cierra la sesión del usuario
       * Llama al backend para invalidar la cookie y limpiar el estado local
       */
      logout: async () => {
        try {
          // Llamar al endpoint de logout para limpiar cookie y revocar token
          await api.post('/auth/logout');
        } catch (error) {
          // Ignorar errores de red en logout (el usuario se desconecta igual)
          console.error('Error al hacer logout:', error);
        } finally {
          // Limpiar estado local
          // Eliminar cualquier token legacy de localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('auth-storage');

          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },

      /**
       * Actualiza la información del usuario
       */
      updateUser: (user) => {
        set({ user });
      },

      /**
       * Limpia la autenticación sin llamar al backend
       * Usado cuando el token expira o es inválido
       */
      clearAuth: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      // Solo persistir datos no sensibles del usuario (para mostrar en UI)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
