import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Mail, Shield } from 'lucide-react';

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    // Auto-redirigir al login después de 10 segundos
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-military-900 via-military-800 to-military-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-2xl">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>

          {/* Title */}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Registro Pendiente
          </h2>

          {/* Message */}
          <p className="mt-4 text-center text-base text-gray-700 dark:text-gray-300">
            Tu cuenta ha sido creada exitosamente y está pendiente de aprobación por un administrador.
          </p>

          {/* Email Info */}
          {email && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4" />
                <span className="font-medium">{email}</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 space-y-4">
            <div className="flex items-start space-x-3 text-left">
              <Shield className="h-5 w-5 text-military-500 dark:text-military-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Siguiente paso:</strong> Un administrador revisará tu solicitud y aprobará tu cuenta.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-left">
              <Mail className="h-5 w-5 text-military-500 dark:text-military-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Notificación:</strong> Recibirás un correo electrónico cuando tu cuenta sea activada.
                </p>
              </div>
            </div>
          </div>

          {/* Redirect info */}
          <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-500">
            Serás redirigido al login en unos segundos...
          </p>

          {/* Manual redirect button */}
          <div className="mt-6">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-military-600 hover:bg-military-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-military-500 transition-colors"
            >
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
