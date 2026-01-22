import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function DiscordCallbackPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Llamar a /api/auth/me para obtener el usuario autenticado
        // La cookie httpOnly ya fue establecida por el backend
        const response = await api.get('/auth/me');

        if (response.data.success && response.data.data.user) {
          const user = response.data.data.user;

          // Actualizar Zustand store (sin token, solo user)
          setAuth(user, ''); // Token vacío porque ahora está en cookie httpOnly

          // Redirigir al dashboard
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error('No se pudo obtener la información del usuario');
        }
      } catch (err: any) {
        console.error('Error en callback de Discord:', err);
        setError(
          err.response?.data?.message ||
            'Error al autenticar con Discord. Por favor, intenta de nuevo.'
        );

        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, setAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Error de autenticación
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {error}
            </p>
            <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-500">
              Redirigiendo al login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Autenticando con Discord
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Por favor, espera mientras procesamos tu autenticación...
          </p>
        </div>
      </div>
    </div>
  );
}
