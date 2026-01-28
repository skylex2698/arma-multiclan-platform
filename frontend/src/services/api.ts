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
 * Interceptor de request para manejar FormData y logging
 */
api.interceptors.request.use(
  (config) => {
    // Si los datos son FormData, eliminar Content-Type para que axios
    // lo configure automáticamente con el boundary correcto
    if (config.data instanceof FormData) {
      // Usar el método delete de AxiosHeaders o set a undefined
      if (config.headers && typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else if (config.headers) {
        config.headers['Content-Type'] = undefined as unknown as string;
      }
    }

    // Logging en desarrollo
    if (import.meta.env.DEV) {
      console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`,
        config.data instanceof FormData ? '[FormData]' : config.data);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
