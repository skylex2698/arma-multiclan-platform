import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Cliente Axios configurado para la API
 *
 * SEGURIDAD:
 * - Usa withCredentials para enviar cookies httpOnly automáticamente
 * - NO almacena tokens en localStorage (previene XSS)
 * - El servidor maneja la autenticación via cookies
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANTE: Enviar cookies httpOnly en cada petición
  timeout: 30000, // 30 segundos timeout
});

/**
 * Interceptor de respuesta para manejar errores de autenticación
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      // Limpiar cualquier dato legacy de localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');

      // Solo redirigir si no estamos ya en la página de login
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/register', '/auth/pending', '/auth/discord/success'];

      if (!publicPaths.some(path => currentPath.startsWith(path))) {
        // Usar replace para no agregar al historial
        window.location.replace('/login?session_expired=true');
      }
    }

    // Manejar errores de rate limiting
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded:', error.response.data?.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Interceptor de request para logging en desarrollo
 */
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}
